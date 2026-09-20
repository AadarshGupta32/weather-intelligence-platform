package com.weatherintel.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherintel.entity.*;
import com.weatherintel.repository.ReportMediaRepository;
import com.weatherintel.repository.ReportRepository;
import com.weatherintel.repository.UserRepository;
import com.weatherintel.service.ai.AiVerificationClientService;
import com.weatherintel.service.phash.PHashService;
import com.weatherintel.statemachine.ReportStateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class KafkaConsumerWorker {

    private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerWorker.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ReportRepository reportRepository;
    private final ReportMediaRepository reportMediaRepository;
    private final UserRepository userRepository;
    private final PHashService pHashService;
    private final AiVerificationClientService aiVerificationService;
    private final ReportStateService reportStateService;

    public KafkaConsumerWorker(
            ReportRepository reportRepository,
            ReportMediaRepository reportMediaRepository,
            UserRepository userRepository,
            PHashService pHashService,
            AiVerificationClientService aiVerificationService,
            ReportStateService reportStateService) {
        this.reportRepository = reportRepository;
        this.reportMediaRepository = reportMediaRepository;
        this.userRepository = userRepository;
        this.pHashService = pHashService;
        this.aiVerificationService = aiVerificationService;
        this.reportStateService = reportStateService;
    }

    /**
     * Kafka Listener worker pool.
     * Consumes buffered raw streams and writes to database asynchronously.
     */
    @KafkaListener(topics = "${app.kafka.topic:weather.raw.ingestion}", groupId = "weather-intel-group", autoStartup = "${spring.kafka.consumer.auto-startup:false}")
    public void onKafkaMessage(String message) {
        logger.info("Kafka Consumer received record: {}", message);
        processRawPayload(message);
    }

    /**
     * Core processing worker pipeline:
     * Clean -> pHash Dedup -> AI Misinformation / Sentiment Check -> State Machine -> DB Write.
     */
    public void processRawPayload(String jsonPayload) {
        try {
            Map<String, Object> map = objectMapper.readValue(jsonPayload, Map.class);

            String title = (String) map.getOrDefault("title", "Weather Incident Report");
            String description = (String) map.getOrDefault("description", "");
            String sourceType = (String) map.getOrDefault("sourceType", "CITIZEN_REPORT");
            String username = (String) map.getOrDefault("username", "citizen_arun");
            String rawHazard = (String) map.getOrDefault("hazardType", "GENERAL_WEATHER");
            String rawSeverity = (String) map.getOrDefault("severity", "MEDIUM");
            Double lat = ((Number) map.getOrDefault("latitude", 22.7196)).doubleValue();
            Double lon = ((Number) map.getOrDefault("longitude", 75.8577)).doubleValue();
            String city = (String) map.getOrDefault("city", "Indore");
            String district = (String) map.getOrDefault("district", "Indore");
            String mediaBase64 = (String) map.get("mediaBase64");
            String mediaUrl = (String) map.getOrDefault("mediaUrl", "/uploads/placeholder.jpg");

            // 1. Compute Perceptual Hash (pHash) and Detect Recycled/Duplicate Media
            String imagePHash = null;
            boolean isDuplicateMedia = false;
            int minHammingDist = 64;

            if (mediaBase64 != null && !mediaBase64.isBlank()) {
                byte[] imgBytes = Base64.getDecoder().decode(mediaBase64);
                imagePHash = pHashService.computePHash(imgBytes);

                if (imagePHash != null) {
                    List<ReportMedia> existingMedia = reportMediaRepository.findByPhashIsNotNull();
                    for (ReportMedia media : existingMedia) {
                        int dist = pHashService.calculateHammingDistance(imagePHash, media.getPhash());
                        if (dist < minHammingDist) {
                            minHammingDist = dist;
                        }
                        if (pHashService.isDuplicate(imagePHash, media.getPhash(), 10)) {
                            isDuplicateMedia = true;
                            break;
                        }
                    }
                }
            }

            // 2. AI NLP Misinformation & Rumor Verification
            AiVerificationClientService.AiVerificationResult aiResult =
                    aiVerificationService.analyzeText(description + " " + title, sourceType, username);

            // 3. Resolve User
            User user = userRepository.findByUsername(username)
                    .orElseGet(() -> userRepository.findByUsername("citizen_arun").orElse(null));

            // 4. Instantiate Report Entity
            Report report = new Report();
            String trackingReceipt = (String) map.getOrDefault("trackingId",
                    "REP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            report.setTrackingId(trackingReceipt);
            report.setTitle(title);
            report.setDescription(description);
            report.setLatitude(lat);
            report.setLongitude(lon);
            report.setCity(city);
            report.setDistrict(district);
            report.setSourceType(sourceType);
            report.setDuplicateFlag(isDuplicateMedia);
            report.setPhash(imagePHash);
            report.setUser(user);
            report.setStatus(ReportStatus.SUBMITTED);

            // Assign Hazard Type (either specified or predicted by AI)
            try {
                if ("GENERAL_WEATHER".equalsIgnoreCase(rawHazard) && aiResult.hazardType != null) {
                    report.setHazardType(HazardType.valueOf(aiResult.hazardType));
                } else {
                    report.setHazardType(HazardType.valueOf(rawHazard));
                }
            } catch (Exception e) {
                report.setHazardType(HazardType.GENERAL_WEATHER);
            }

            // Assign Severity
            try {
                report.setSeverity(Severity.valueOf(rawSeverity));
            } catch (Exception e) {
                report.setSeverity(Severity.MEDIUM);
            }

            report.setRumorScore(aiResult.rumorScore);
            report.setIsRumor(aiResult.isRumor);
            report.setPanicIndex(aiResult.panicIndex);
            report.setSentiment(aiResult.sentiment);

            Report savedReport = reportRepository.save(report);

            // Save Media reference
            if (mediaUrl != null) {
                ReportMedia media = new ReportMedia(savedReport, mediaUrl, "IMAGE", imagePHash);
                reportMediaRepository.save(media);
            }

            // 5. Trigger Lifecycle Transition via Spring State Machine
            String notes = "AI Evaluation: RumorScore=" + aiResult.rumorScore +
                    ", DuplicateFlag=" + isDuplicateMedia + " (HammingDist=" + minHammingDist + ")";
            if (isDuplicateMedia) {
                notes += " [AUTO-FLAGGED: Recycled duplicate media detected]";
            }

            boolean flagAsRumor = aiResult.isRumor || (isDuplicateMedia && aiResult.rumorScore > 0.4);
            reportStateService.processAiEvaluation(savedReport, flagAsRumor, aiResult.rumorScore, notes);

            logger.info("Processed Report: ID={}, Tracking={}, Status={}, Duplicate={}, Rumor={}",
                    savedReport.getId(), savedReport.getTrackingId(), savedReport.getStatus(),
                    isDuplicateMedia, savedReport.getIsRumor());

        } catch (Exception e) {
            logger.error("Error processing raw ingestion payload: {}", e.getMessage(), e);
        }
    }
}

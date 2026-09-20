package com.weatherintel.controller;

import com.weatherintel.dto.ReportSubmissionDTO;
import com.weatherintel.dto.SocialMediaPayloadDTO;
import com.weatherintel.kafka.KafkaProducerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportIngestionController {

    private static final Logger logger = LoggerFactory.getLogger(ReportIngestionController.class);

    private final KafkaProducerService kafkaProducerService;

    @Value("${app.storage.upload-dir:uploads}")
    private String uploadDir;

    public ReportIngestionController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    /**
     * Accepts multipart citizen ground reports: text, coordinates, image/media.
     * Decoupled via Kafka: returns 202 ACCEPTED with tracking receipt immediately.
     */
    @PostMapping(value = "/submit")
    public ResponseEntity<Map<String, Object>> submitCitizenReport(
            @ModelAttribute ReportSubmissionDTO submission) {

        String trackingReceipt = "REP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        logger.info("Received Citizen Ground Report: title='{}', user='{}'", submission.getTitle(), submission.getUsername());

        Map<String, Object> payload = new HashMap<>();
        payload.put("trackingId", trackingReceipt);
        payload.put("title", submission.getTitle() != null ? submission.getTitle() : "Citizen Emergency Report");
        payload.put("description", submission.getDescription() != null ? submission.getDescription() : "");
        payload.put("hazardType", submission.getHazardType() != null ? submission.getHazardType() : "GENERAL_WEATHER");
        payload.put("severity", submission.getSeverity() != null ? submission.getSeverity() : "MEDIUM");
        payload.put("latitude", submission.getLatitude() != null ? submission.getLatitude() : 22.7196);
        payload.put("longitude", submission.getLongitude() != null ? submission.getLongitude() : 75.8577);
        payload.put("city", submission.getCity() != null ? submission.getCity() : "Indore");
        payload.put("district", submission.getDistrict() != null ? submission.getDistrict() : "Indore");
        payload.put("username", submission.getUsername() != null ? submission.getUsername() : "citizen_arun");
        payload.put("sourceType", "CITIZEN_REPORT");

        // Handle uploaded photo/media
        MultipartFile file = submission.getMediaFile();
        if (file != null && !file.isEmpty()) {
            try {
                Path dir = Paths.get(uploadDir);
                if (!Files.exists(dir)) {
                    Files.createDirectories(dir);
                }
                String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
                Path target = dir.resolve(filename);
                file.transferTo(target);

                byte[] bytes = Files.readAllBytes(target);
                payload.put("mediaBase64", Base64.getEncoder().encodeToString(bytes));
                payload.put("mediaUrl", "/uploads/" + filename);
            } catch (Exception e) {
                logger.error("Failed to save media upload: {}", e.getMessage());
            }
        }

        // Push to Kafka ingestion topic (non-blocking)
        kafkaProducerService.publishRawIngestion(payload);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "ACCEPTED");
        response.put("trackingId", trackingReceipt);
        response.put("message", "Ground report safely ingested into streaming pipeline. Real-time verification underway.");
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * Ingestion endpoint for automated social media stream scrapers (#IMD, Twitter, Telegram).
     */
    @PostMapping(value = "/social-stream", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> ingestSocialStream(@RequestBody SocialMediaPayloadDTO stream) {
        String trackingReceipt = "REP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Map<String, Object> payload = new HashMap<>();
        payload.put("trackingId", trackingReceipt);
        payload.put("title", "Social Stream: " + (stream.getPlatform() != null ? stream.getPlatform() : "#IMD"));
        payload.put("description", stream.getContent());
        payload.put("hazardType", "GENERAL_WEATHER"); // Will be classified by AI
        payload.put("severity", "MEDIUM");
        payload.put("latitude", stream.getLatitude() != null ? stream.getLatitude() : 22.7196);
        payload.put("longitude", stream.getLongitude() != null ? stream.getLongitude() : 75.8577);
        payload.put("city", stream.getCity() != null ? stream.getCity() : "Indore");
        payload.put("district", stream.getDistrict() != null ? stream.getDistrict() : "Indore");
        payload.put("username", "imd_bot");
        payload.put("sourceType", stream.getPlatform() != null ? stream.getPlatform() : "TWITTER_IMD");
        payload.put("mediaUrl", stream.getMediaUrl());

        kafkaProducerService.publishRawIngestion(payload);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "BUFFERED");
        response.put("trackingId", trackingReceipt);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
}

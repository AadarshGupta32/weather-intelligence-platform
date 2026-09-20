package com.weatherintel.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class AiVerificationClientService {

    private static final Logger logger = LoggerFactory.getLogger(AiVerificationClientService.class);
    private final RestTemplate restTemplate;

    @Value("${app.ai-service.url:http://localhost:8001}")
    private String aiServiceUrl;

    public AiVerificationClientService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(4))
                .setReadTimeout(Duration.ofSeconds(6))
                .build();
    }

    public static class AiVerificationResult {
        public double rumorScore;
        public boolean isRumor;
        public String sentiment;
        public double panicIndex;
        public String hazardType;
        public double confidence;
        public List<String> flags;
        public String explanation;

        public AiVerificationResult() {
            this.flags = new ArrayList<>();
        }
    }

    /**
     * Synchronous analysis call for ingestion pipeline.
     */
    public AiVerificationResult analyzeText(String text, String source, String author) {
        try {
            String url = aiServiceUrl + "/api/v1/verify-text";
            Map<String, Object> req = new HashMap<>();
            req.put("text", text);
            req.put("source", source != null ? source : "CITIZEN_REPORT");
            req.put("author", author != null ? author : "Anonymous");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                AiVerificationResult result = new AiVerificationResult();
                result.rumorScore = ((Number) body.getOrDefault("rumor_score", 0.0)).doubleValue();
                result.isRumor = (Boolean) body.getOrDefault("is_rumor", false);
                result.sentiment = (String) body.getOrDefault("sentiment", "OBSERVATIONAL_NEUTRAL");
                result.panicIndex = ((Number) body.getOrDefault("panic_index", 0.0)).doubleValue();
                result.hazardType = (String) body.getOrDefault("hazard_type", "GENERAL_WEATHER");
                result.confidence = ((Number) body.getOrDefault("confidence", 0.5)).doubleValue();
                result.explanation = (String) body.getOrDefault("explanation", "");
                result.flags = (List<String>) body.getOrDefault("flags", Collections.emptyList());
                return result;
            }
        } catch (Exception e) {
            logger.warn("AI Microservice call failed: {}. Falling back to heuristic verification.", e.getMessage());
        }

        // Resilient Fallback Heuristic
        return fallbackHeuristic(text);
    }

    @Async
    public CompletableFuture<AiVerificationResult> analyzeTextAsync(String text, String source, String author) {
        return CompletableFuture.completedFuture(analyzeText(text, source, author));
    }

    private AiVerificationResult fallbackHeuristic(String text) {
        AiVerificationResult result = new AiVerificationResult();
        String lower = text.toLowerCase();
        boolean panicWord = lower.contains("dam broke") || lower.contains("dam burst") || lower.contains("drowned");
        result.rumorScore = panicWord ? 0.85 : 0.05;
        result.isRumor = panicWord;
        result.sentiment = panicWord ? "PANIC_ALARMIST" : "OBSERVATIONAL_NEUTRAL";
        result.panicIndex = panicWord ? 0.9 : 0.1;
        result.hazardType = lower.contains("flood") ? "FLASH_FLOOD" : (lower.contains("waterlog") ? "WATERLOGGING" : "GENERAL_WEATHER");
        result.confidence = 0.65;
        result.explanation = "Local heuristic evaluation (AI Service fallback)";
        if (panicWord) {
            result.flags.add("Fallback panic trigger keyword matched");
        }
        return result;
    }
}

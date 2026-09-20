package com.weatherintel.websocket;

import com.weatherintel.entity.Report;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class RealtimeNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(RealtimeNotificationService.class);
    private final SimpMessagingTemplate messagingTemplate;
    private final List<SseEmitter> sseEmitters = new CopyOnWriteArrayList<>();

    public RealtimeNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public SseEmitter registerSseClient() {
        SseEmitter emitter = new SseEmitter(600000L); // 10 minutes timeout
        sseEmitters.add(emitter);

        emitter.onCompletion(() -> sseEmitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            sseEmitters.remove(emitter);
        });
        emitter.onError((e) -> sseEmitters.remove(emitter));

        try {
            Map<String, Object> welcome = new HashMap<>();
            welcome.put("type", "CONNECTED");
            welcome.put("timestamp", LocalDateTime.now().toString());
            welcome.put("message", "Connected to Weather Intelligence Real-Time SSE Stream");
            emitter.send(SseEmitter.event().name("INIT").data(welcome));
        } catch (IOException e) {
            sseEmitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcastReportUpdate(Report report, String eventType) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventType", eventType);
        payload.put("trackingId", report.getTrackingId());
        payload.put("id", report.getId());
        payload.put("title", report.getTitle());
        payload.put("hazardType", report.getHazardType().name());
        payload.put("severity", report.getSeverity().name());
        payload.put("status", report.getStatus().name());
        payload.put("latitude", report.getLatitude());
        payload.put("longitude", report.getLongitude());
        payload.put("district", report.getDistrict());
        payload.put("city", report.getCity());
        payload.put("rumorScore", report.getRumorScore());
        payload.put("isRumor", report.getIsRumor());
        payload.put("duplicateFlag", report.getDuplicateFlag());
        payload.put("actionNotes", report.getActionNotes());
        payload.put("timestamp", LocalDateTime.now().toString());

        // 1. Broadcast via STOMP WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/reports", payload);
            logger.info("Broadcasted WebSocket report update: [{}] status={}", report.getTrackingId(), report.getStatus());
        } catch (Exception e) {
            logger.warn("Failed to broadcast WebSocket update: {}", e.getMessage());
        }

        // 2. Broadcast to active SSE clients
        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : sseEmitters) {
            try {
                emitter.send(SseEmitter.event().name("REPORT_UPDATE").data(payload));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        sseEmitters.removeAll(deadEmitters);
    }

    public void broadcastDisasterAlert(String title, String message, String severity, Map<String, Object> extra) {
        Map<String, Object> alert = new HashMap<>();
        alert.put("type", "DISASTER_ALERT");
        alert.put("title", title);
        alert.put("message", message);
        alert.put("severity", severity);
        alert.put("timestamp", LocalDateTime.now().toString());
        if (extra != null) {
            alert.putAll(extra);
        }

        try {
            messagingTemplate.convertAndSend("/topic/alerts", alert);
        } catch (Exception e) {
            logger.warn("Failed to broadcast alert: {}", e.getMessage());
        }

        for (SseEmitter emitter : sseEmitters) {
            try {
                emitter.send(SseEmitter.event().name("ALERT").data(alert));
            } catch (Exception ignored) {}
        }
    }
}

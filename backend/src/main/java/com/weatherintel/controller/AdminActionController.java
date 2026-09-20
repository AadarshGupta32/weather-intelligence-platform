package com.weatherintel.controller;

import com.weatherintel.entity.Report;
import com.weatherintel.statemachine.ReportStateService;
import com.weatherintel.websocket.RealtimeNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminActionController {

    private final ReportStateService reportStateService;
    private final RealtimeNotificationService realtimeNotificationService;

    public AdminActionController(
            ReportStateService reportStateService,
            RealtimeNotificationService realtimeNotificationService) {
        this.reportStateService = reportStateService;
        this.realtimeNotificationService = realtimeNotificationService;
    }

    /**
     * Admin verifies incoming citizen ground report.
     * Transitions State: AI_CHECKED -> ADMIN_VERIFIED.
     * Triggers Spring Event to increment reporter's TrustScore.
     */
    @PutMapping("/reports/{id}/verify")
    public ResponseEntity<Report> verifyReport(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String adminUser = (body != null && body.containsKey("adminUser")) ? body.get("adminUser") : "admin_ndrf";
        String comments = (body != null && body.containsKey("comments")) ? body.get("comments") : "Ground truth confirmed via field officer";

        Report updated = reportStateService.adminVerify(id, adminUser, comments);
        return ResponseEntity.ok(updated);
    }

    /**
     * Emergency Response Team dispatch.
     * Transitions State: ADMIN_VERIFIED -> ACTIONED.
     */
    @PutMapping("/reports/{id}/action")
    public ResponseEntity<Report> dispatchAction(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String teamName = body.getOrDefault("teamName", "NDRF Quick Response Team 4");
        String instructions = body.getOrDefault("instructions", "Dispatched inflatable motorboats and de-watering pumps to site");

        Report updated = reportStateService.dispatchAction(id, teamName, instructions);
        return ResponseEntity.ok(updated);
    }

    /**
     * Flags report as false alarm or panic-inducing rumor.
     * Transitions State: AI_CHECKED -> FALSE_ALARM.
     * Decrements citizen trust score.
     */
    @PutMapping("/reports/{id}/false-alarm")
    public ResponseEntity<Report> markFalseAlarm(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Old recycled imagery or exaggerated casualty figures confirmed false.");
        String admin = body.getOrDefault("adminUser", "admin_ndrf");

        Report updated = reportStateService.markFalseAlarm(id, admin, reason);
        return ResponseEntity.ok(updated);
    }

    /**
     * Issues broadcast warning alert across citizen dashboards.
     */
    @PostMapping("/broadcast-alert")
    public ResponseEntity<Map<String, String>> broadcastEmergencyAlert(@RequestBody Map<String, Object> req) {
        String title = (String) req.getOrDefault("title", "IMD Severe Weather Advisory");
        String message = (String) req.getOrDefault("message", "Heavy waterlogging reported across Vijay Nagar & Palasia. Avoid underpasses.");
        String severity = (String) req.getOrDefault("severity", "HIGH");

        realtimeNotificationService.broadcastDisasterAlert(title, message, severity, req);
        return ResponseEntity.ok(Map.of("status", "BROADCASTED", "title", title));
    }
}

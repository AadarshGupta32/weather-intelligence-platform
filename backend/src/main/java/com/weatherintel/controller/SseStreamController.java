package com.weatherintel.controller;

import com.weatherintel.websocket.RealtimeNotificationService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*")
public class SseStreamController {

    private final RealtimeNotificationService notificationService;

    public SseStreamController(RealtimeNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Server-Sent Events endpoint for real-time browser updates without STOMP dependencies.
     */
    @GetMapping(value = "/reports", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamReports() {
        return notificationService.registerSseClient();
    }
}

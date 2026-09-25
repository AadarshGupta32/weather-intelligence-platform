package com.weatherintel.controller;

import com.weatherintel.service.SachetAlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class SachetAlertController {

    private final SachetAlertService sachetAlertService;

    public SachetAlertController(SachetAlertService sachetAlertService) {
        this.sachetAlertService = sachetAlertService;
    }

    @GetMapping("/national")
    public ResponseEntity<List<SachetAlertService.SachetAlert>> getNationalAlerts() {
        return ResponseEntity.ok(sachetAlertService.getNationalAlerts());
    }
}
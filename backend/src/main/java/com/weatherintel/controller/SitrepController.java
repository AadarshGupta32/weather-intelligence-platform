package com.weatherintel.controller;

import com.weatherintel.service.sitrep.SitrepService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/sitrep")
@CrossOrigin(origins = "*")
public class SitrepController {

    private final SitrepService sitrepService;

    public SitrepController(SitrepService sitrepService) {
        this.sitrepService = sitrepService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSitrep(
            @RequestParam(defaultValue = "Indore") String district) {
        return ResponseEntity.ok(sitrepService.generateSituationReport(district));
    }

    @GetMapping(value = "/html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getPrintableSitrep(
            @RequestParam(defaultValue = "Indore") String district) {
        return ResponseEntity.ok(sitrepService.generatePrintableHtml(district));
    }
}

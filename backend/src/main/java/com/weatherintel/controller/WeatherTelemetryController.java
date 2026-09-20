package com.weatherintel.controller;

import com.weatherintel.entity.Report;
import com.weatherintel.entity.ReportMedia;
import com.weatherintel.repository.ReportMediaRepository;
import com.weatherintel.repository.ReportRepository;
import com.weatherintel.service.phash.PHashService;
import com.weatherintel.service.telemetry.WeatherTelemetryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class WeatherTelemetryController {

    private final WeatherTelemetryService telemetryService;
    private final ReportRepository reportRepository;
    private final ReportMediaRepository mediaRepository;
    private final PHashService pHashService;

    public WeatherTelemetryController(
            WeatherTelemetryService telemetryService,
            ReportRepository reportRepository,
            ReportMediaRepository mediaRepository,
            PHashService pHashService) {
        this.telemetryService = telemetryService;
        this.reportRepository = reportRepository;
        this.mediaRepository = mediaRepository;
        this.pHashService = pHashService;
    }

    @GetMapping("/telemetry/current")
    public ResponseEntity<WeatherTelemetryService.TelemetrySnapshot> getCurrentTelemetry(
            @RequestParam(defaultValue = "22.7196") Double lat,
            @RequestParam(defaultValue = "75.8577") Double lon,
            @RequestParam(defaultValue = "Indore") String city) {
        return ResponseEntity.ok(telemetryService.getTelemetry(lat, lon, city));
    }

    /**
     * Media Forensics inspection endpoint.
     * Computes exact bitwise Hamming difference against original stored media.
     */
    @GetMapping("/admin/media-forensics/{reportId}")
    public ResponseEntity<Map<String, Object>> getMediaForensics(@PathVariable Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        Map<String, Object> forensics = new HashMap<>();
        forensics.put("targetReportId", report.getId());
        forensics.put("targetTitle", report.getTitle());
        forensics.put("targetTrackingId", report.getTrackingId());
        forensics.put("targetPHash", report.getPhash());

        String targetMediaUrl = !report.getMediaList().isEmpty() ? report.getMediaList().get(0).getMediaUrl() : null;
        forensics.put("targetMediaUrl", targetMediaUrl);

        if (report.getPhash() != null) {
            List<ReportMedia> otherMedia = mediaRepository.findByPhashIsNotNull();
            ReportMedia closestMatch = null;
            int lowestDistance = 64;

            for (ReportMedia rm : otherMedia) {
                if (rm.getReport() != null && !rm.getReport().getId().equals(report.getId())) {
                    int dist = pHashService.calculateHammingDistance(report.getPhash(), rm.getPhash());
                    if (dist < lowestDistance) {
                        lowestDistance = dist;
                        closestMatch = rm;
                    }
                }
            }

            if (closestMatch != null) {
                forensics.put("originalReportId", closestMatch.getReport().getId());
                forensics.put("originalTitle", closestMatch.getReport().getTitle());
                forensics.put("originalTrackingId", closestMatch.getReport().getTrackingId());
                forensics.put("originalMediaUrl", closestMatch.getMediaUrl());
                forensics.put("originalPHash", closestMatch.getPhash());
                forensics.put("hammingDistance", lowestDistance);
                forensics.put("similarityPercentage", Math.round((1.0 - (lowestDistance / 64.0)) * 100.0));
                forensics.put("isRecycledDuplicate", lowestDistance <= 10);
                forensics.put("forensicVerdict", lowestDistance <= 10 
                        ? "CONFIRMED: Recycled visual asset from earlier disaster report"
                        : "UNIQUE: Visual asset passes perceptual deduplication");
            }
        }

        return ResponseEntity.ok(forensics);
    }
}

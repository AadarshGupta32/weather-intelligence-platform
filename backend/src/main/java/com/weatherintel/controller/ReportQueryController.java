package com.weatherintel.controller;

import com.weatherintel.dto.GeoJsonFeature;
import com.weatherintel.dto.GeoJsonFeatureCollection;
import com.weatherintel.entity.*;
import com.weatherintel.repository.AuditLogRepository;
import com.weatherintel.repository.ReportRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportQueryController {

    private final ReportRepository reportRepository;
    private final AuditLogRepository auditLogRepository;

    public ReportQueryController(ReportRepository reportRepository, AuditLogRepository auditLogRepository) {
        this.reportRepository = reportRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Dynamic GIS endpoint producing standard RFC 7946 GeoJSON FeatureCollection.
     * Supports multi-parameter filtering: Date, Hazard Event, Status, District, and Radius.
     */
    @GetMapping("/geojson")
    public ResponseEntity<GeoJsonFeatureCollection> getReportsGeoJson(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String event,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false, defaultValue = "0") Double radiusKm
    ) {
        List<Report> reports;

        // If micro-local radius filtering is specified
        if (lat != null && lon != null && radiusKm > 0) {
            double radiusMeters = radiusKm * 1000.0;
            reports = reportRepository.findWithinRadius(lat, lon, radiusMeters);

            // In-memory filter on returned radius reports if other filters are present
            if (event != null && !event.isBlank()) {
                reports = reports.stream().filter(r -> r.getHazardType().name().equalsIgnoreCase(event)).toList();
            }
            if (status != null && !status.isBlank()) {
                reports = reports.stream().filter(r -> r.getStatus().name().equalsIgnoreCase(status)).toList();
            }
        } else {
            // Dynamic Spring Data JPA Specification filtering
            Specification<Report> spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();

                if (date != null && !date.isBlank()) {
                    LocalDate parsedDate = LocalDate.parse(date);
                    LocalDateTime startOfDay = parsedDate.atStartOfDay();
                    LocalDateTime endOfDay = parsedDate.atTime(LocalTime.MAX);
                    predicates.add(cb.between(root.get("createdAt"), startOfDay, endOfDay));
                }

                if (event != null && !event.isBlank()) {
                    try {
                        HazardType ht = HazardType.valueOf(event.toUpperCase());
                        predicates.add(cb.equal(root.get("hazardType"), ht));
                    } catch (Exception ignored) {}
                }

                if (status != null && !status.isBlank()) {
                    try {
                        ReportStatus st = ReportStatus.valueOf(status.toUpperCase());
                        predicates.add(cb.equal(root.get("status"), st));
                    } catch (Exception ignored) {}
                }

                if (district != null && !district.isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("district")), "%" + district.toLowerCase() + "%"));
                }

                return cb.and(predicates.toArray(new Predicate[0]));
            };

            reports = reportRepository.findAll(spec);
        }

        // Serialize to GeoJSON FeatureCollection
        List<GeoJsonFeature> features = reports.stream().map(r -> {
            Map<String, Object> props = new HashMap<>();
            props.put("id", r.getId());
            props.put("trackingId", r.getTrackingId());
            props.put("title", r.getTitle());
            props.put("description", r.getDescription());
            props.put("hazardType", r.getHazardType().name());
            props.put("severity", r.getSeverity().name());
            props.put("status", r.getStatus().name());
            props.put("sourceType", r.getSourceType());
            props.put("rumorScore", r.getRumorScore());
            props.put("isRumor", r.getIsRumor());
            props.put("duplicateFlag", r.getDuplicateFlag());
            props.put("district", r.getDistrict());
            props.put("city", r.getCity());
            props.put("actionNotes", r.getActionNotes());
            props.put("createdAt", r.getCreatedAt().toString());

            if (r.getUser() != null) {
                props.put("reportedBy", r.getUser().getUsername());
                if (r.getUser().getTrustScore() != null) {
                    props.put("reporterTrustScore", r.getUser().getTrustScore().getScore());
                    props.put("reporterBadge", r.getUser().getTrustScore().getBadgeTier().name());
                }
            }

            if (!r.getMediaList().isEmpty()) {
                props.put("mediaUrl", r.getMediaList().get(0).getMediaUrl());
                props.put("phash", r.getMediaList().get(0).getPhash());
            }

            return new GeoJsonFeature(r.getLongitude(), r.getLatitude(), props);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(new GeoJsonFeatureCollection(features));
    }

    /**
     * Citizen Tracking Ledger endpoint.
     * Provides full visibility into the lifecycle state and audit logs of a submitted report.
     */
    @GetMapping("/tracking/{trackingId}")
    public ResponseEntity<Map<String, Object>> getTrackingDetails(@PathVariable String trackingId) {
        Report report = reportRepository.findByTrackingId(trackingId)
                .orElseThrow(() -> new IllegalArgumentException("Tracking ID not found: " + trackingId));

        List<AuditLog> auditLogs = auditLogRepository.findByReportIdOrderByCreatedAtDesc(report.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("report", report);
        result.put("history", auditLogs);
        if (report.getUser() != null && report.getUser().getTrustScore() != null) {
            result.put("userReputation", report.getUser().getTrustScore());
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Report>> getRecentReports() {
        return ResponseEntity.ok(reportRepository.findTop50ByOrderByCreatedAtDesc());
    }
}

package com.weatherintel.service.sitrep;

import com.weatherintel.entity.*;
import com.weatherintel.repository.EmergencyShelterRepository;
import com.weatherintel.repository.ReportRepository;
import com.weatherintel.service.telemetry.WeatherTelemetryService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SitrepService {

    private final ReportRepository reportRepository;
    private final EmergencyShelterRepository shelterRepository;
    private final WeatherTelemetryService telemetryService;

    public SitrepService(
            ReportRepository reportRepository,
            EmergencyShelterRepository shelterRepository,
            WeatherTelemetryService telemetryService) {
        this.reportRepository = reportRepository;
        this.shelterRepository = shelterRepository;
        this.telemetryService = telemetryService;
    }

    public Map<String, Object> generateSituationReport(String district) {
        if (district == null || district.isBlank()) {
            district = "Indore";
        }

        List<Report> allReports = reportRepository.findAll();
        List<EmergencyShelter> shelters = shelterRepository.findByIsOperationalTrue();
        WeatherTelemetryService.TelemetrySnapshot telemetry = telemetryService.getTelemetry(22.7196, 75.8577, district);

        long totalReports = allReports.size();
        long verifiedReports = allReports.stream().filter(r -> r.getStatus() == ReportStatus.ADMIN_VERIFIED).count();
        long actionedReports = allReports.stream().filter(r -> r.getStatus() == ReportStatus.ACTIONED).count();
        long rumorsPurged = allReports.stream().filter(r -> r.getIsRumor() || r.getStatus() == ReportStatus.FALSE_ALARM).count();
        long criticalCount = allReports.stream().filter(r -> r.getSeverity() == Severity.CRITICAL).count();

        // Count by hazard type
        Map<String, Long> byHazard = allReports.stream()
                .collect(Collectors.groupingBy(r -> r.getHazardType().name(), Collectors.counting()));

        // Active Actioned incidents (rescue deployments)
        List<Map<String, Object>> activeDeployments = allReports.stream()
                .filter(r -> r.getStatus() == ReportStatus.ACTIONED)
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("trackingId", r.getTrackingId());
                    m.put("title", r.getTitle());
                    m.put("location", r.getCity() + " (Lat: " + r.getLatitude() + ", Lon: " + r.getLongitude() + ")");
                    m.put("actionNotes", r.getActionNotes());
                    return m;
                }).collect(Collectors.toList());

        // Shelter capacity
        int totalShelterCapacity = shelters.stream().mapToInt(EmergencyShelter::getCapacity).sum();
        int currentOccupancy = shelters.stream().mapToInt(EmergencyShelter::getCurrentOccupancy).sum();

        Map<String, Object> sitrep = new HashMap<>();
        sitrep.put("sitrepId", "SITREP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        sitrep.put("incidentName", "MONSOON URBAN FLOOD EMERGENCY - " + district.toUpperCase());
        sitrep.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm:ss")));
        sitrep.put("district", district);
        sitrep.put("reportingAgency", "District Emergency Operations Centre (DEOC) & NDRF Command");
        sitrep.put("telemetry", telemetry);
        sitrep.put("totalReportsIngested", totalReports);
        sitrep.put("verifiedGroundTruthCount", verifiedReports);
        sitrep.put("emergencyActionsDispatched", actionedReports);
        sitrep.put("rumorsSuppressedByAI", rumorsPurged);
        sitrep.put("criticalSeverityCount", criticalCount);
        sitrep.put("hazardBreakdown", byHazard);
        sitrep.put("activeDeployments", activeDeployments);
        sitrep.put("totalSheltersOperational", shelters.size());
        sitrep.put("shelterCapacityTotal", totalShelterCapacity);
        sitrep.put("shelterOccupancyCurrent", currentOccupancy);
        sitrep.put("recommendedAction", "Maintain NDRF boat units on Kahn river perimeter; enforce underpass diversions.");

        return sitrep;
    }

    public String generatePrintableHtml(String district) {
        Map<String, Object> s = generateSituationReport(district);
        WeatherTelemetryService.TelemetrySnapshot t = (WeatherTelemetryService.TelemetrySnapshot) s.get("telemetry");

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <title>%s</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; }
                    .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
                    .title { font-size: 20px; font-weight: bold; color: #0369a1; }
                    .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
                    .grid { display: flex; gap: 15px; margin-bottom: 20px; }
                    .card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; }
                    .card-num { font-size: 24px; font-weight: bold; color: #0f172a; }
                    .card-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
                    table { width: 100%%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                    th { background: #f1f5f9; }
                    .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 15px;">
                    <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">🖨️ Print / Save as PDF</button>
                </div>
                <div class="header">
                    <div class="title">%s</div>
                    <div class="meta"><strong>Generated:</strong> %s | <strong>Jurisdiction:</strong> %s | <strong>Source:</strong> SURAKSHA-NET DEOC</div>
                </div>

                <div class="grid">
                    <div class="card">
                        <div class="card-num" style="color: #0284c7;">%.1f mm</div>
                        <div class="card-lbl">Station Precipitation</div>
                    </div>
                    <div class="card">
                        <div class="card-num">%d</div>
                        <div class="card-lbl">Total Reports Ingested</div>
                    </div>
                    <div class="card">
                        <div class="card-num" style="color: #16a34a;">%d</div>
                        <div class="card-lbl">Ground Truth Verified</div>
                    </div>
                    <div class="card">
                        <div class="card-num" style="color: #ea580c;">%d</div>
                        <div class="card-lbl">Rescue Dispatches Active</div>
                    </div>
                    <div class="card">
                        <div class="card-num" style="color: #dc2626;">%d</div>
                        <div class="card-lbl">AI Rumors Suppressed</div>
                    </div>
                </div>

                <h3>Active Emergency Deployments (NDRF / SDRF Units)</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Tracking ID</th>
                            <th>Incident Title</th>
                            <th>Location</th>
                            <th>Deployment Directive</th>
                        </tr>
                    </thead>
                    <tbody>
                        %s
                    </tbody>
                </table>

                <h3 style="margin-top: 25px;">Designated Emergency Shelters & Safe Zones</h3>
                <p style="font-size: 12px; color: #475569;">
                    Total Operational Shelters: <strong>%d</strong> | Total Capacity: <strong>%d citizens</strong> | Current Occupancy: <strong>%d citizens</strong>
                </p>

                <div class="footer">
                    <span>SURAKSHA-NET Emergency Operations Command Platform</span>
                    <span>Classified for Official Disaster Authority Use</span>
                </div>
            </body>
            </html>
            """.formatted(
                s.get("sitrepId"),
                s.get("incidentName"),
                s.get("generatedAt"),
                s.get("district"),
                t.precipitationMm,
                s.get("totalReportsIngested"),
                s.get("verifiedGroundTruthCount"),
                s.get("emergencyActionsDispatched"),
                s.get("rumorsSuppressedByAI"),
                renderDeploymentRows((List<Map<String, Object>>) s.get("activeDeployments")),
                s.get("totalSheltersOperational"),
                s.get("shelterCapacityTotal"),
                s.get("shelterOccupancyCurrent")
            );
    }

    private String renderDeploymentRows(List<Map<String, Object>> deployments) {
        if (deployments == null || deployments.isEmpty()) {
            return "<tr><td colspan='4' style='text-align:center;'>No critical emergency teams currently deployed</td></tr>";
        }
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> d : deployments) {
            sb.append(String.format("<tr><td><strong>%s</strong></td><td>%s</td><td>%s</td><td>%s</td></tr>",
                    d.get("trackingId"), d.get("title"), d.get("location"), d.get("actionNotes")));
        }
        return sb.toString();
    }
}

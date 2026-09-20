package com.weatherintel.statemachine;

import com.weatherintel.entity.AuditLog;
import com.weatherintel.entity.Report;
import com.weatherintel.entity.ReportEvent;
import com.weatherintel.entity.ReportStatus;
import com.weatherintel.gamification.ReportFalseAlarmEvent;
import com.weatherintel.gamification.ReportVerifiedEvent;
import com.weatherintel.repository.AuditLogRepository;
import com.weatherintel.repository.ReportRepository;
import com.weatherintel.websocket.RealtimeNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.config.StateMachineFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ReportStateService {

    private static final Logger logger = LoggerFactory.getLogger(ReportStateService.class);

    private final StateMachineFactory<ReportStatus, ReportEvent> stateMachineFactory;
    private final ReportRepository reportRepository;
    private final AuditLogRepository auditLogRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final RealtimeNotificationService realtimeNotificationService;

    public ReportStateService(
            StateMachineFactory<ReportStatus, ReportEvent> stateMachineFactory,
            ReportRepository reportRepository,
            AuditLogRepository auditLogRepository,
            ApplicationEventPublisher eventPublisher,
            RealtimeNotificationService realtimeNotificationService) {
        this.stateMachineFactory = stateMachineFactory;
        this.reportRepository = reportRepository;
        this.auditLogRepository = auditLogRepository;
        this.eventPublisher = eventPublisher;
        this.realtimeNotificationService = realtimeNotificationService;
    }

    @Transactional
    public Report processAiEvaluation(Report report, boolean isRumor, double rumorScore, String notes) {
        ReportStatus previousStatus = report.getStatus();
        ReportEvent event = isRumor ? ReportEvent.FLAG_RUMOR : ReportEvent.EVALUATE_AI;
        ReportStatus targetStatus = isRumor ? ReportStatus.FALSE_ALARM : ReportStatus.AI_CHECKED;

        validateAndExecuteTransition(report, event, targetStatus);
        report.setRumorScore(rumorScore);
        report.setIsRumor(isRumor);
        report.setActionNotes(notes);
        report.setUpdatedAt(LocalDateTime.now());
        Report saved = reportRepository.save(report);

        recordAudit(saved.getId(), previousStatus.name(), saved.getStatus().name(), event.name(), "AI_WORKER", notes);

        if (isRumor) {
            eventPublisher.publishEvent(new ReportFalseAlarmEvent(this, saved, "Flagged by AI NLP rumor detection: " + notes));
        }

        realtimeNotificationService.broadcastReportUpdate(saved, "STATE_CHANGED");
        return saved;
    }

    @Transactional
    public Report adminVerify(Long reportId, String adminUser, String comments) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        ReportStatus previousStatus = report.getStatus();
        if (previousStatus != ReportStatus.AI_CHECKED && previousStatus != ReportStatus.SUBMITTED) {
            throw new IllegalStateException("Cannot verify report in state: " + previousStatus + ". Illegal transition!");
        }

        validateAndExecuteTransition(report, ReportEvent.APPROVE_ADMIN, ReportStatus.ADMIN_VERIFIED);
        report.setActionNotes("Verified by " + adminUser + ": " + comments);
        report.setUpdatedAt(LocalDateTime.now());
        Report saved = reportRepository.save(report);

        recordAudit(saved.getId(), previousStatus.name(), saved.getStatus().name(), 
                ReportEvent.APPROVE_ADMIN.name(), adminUser, comments);

        // Publish Spring Event for Gamified Trust Scoring
        eventPublisher.publishEvent(new ReportVerifiedEvent(this, saved, adminUser));

        realtimeNotificationService.broadcastReportUpdate(saved, "ADMIN_VERIFIED");
        return saved;
    }

    @Transactional
    public Report dispatchAction(Long reportId, String teamName, String instructions) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        ReportStatus previousStatus = report.getStatus();
        if (previousStatus != ReportStatus.ADMIN_VERIFIED) {
            throw new IllegalStateException("Cannot action report in state: " + previousStatus + ". Must be ADMIN_VERIFIED first!");
        }

        validateAndExecuteTransition(report, ReportEvent.DISPATCH_ACTION, ReportStatus.ACTIONED);
        String actionInfo = "Emergency Response Dispatched: [" + teamName + "] - " + instructions;
        report.setActionNotes(actionInfo);
        report.setUpdatedAt(LocalDateTime.now());
        Report saved = reportRepository.save(report);

        recordAudit(saved.getId(), previousStatus.name(), saved.getStatus().name(),
                ReportEvent.DISPATCH_ACTION.name(), teamName, instructions);

        realtimeNotificationService.broadcastReportUpdate(saved, "ACTION_DISPATCHED");
        return saved;
    }

    @Transactional
    public Report markFalseAlarm(Long reportId, String flaggedBy, String reason) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        ReportStatus previousStatus = report.getStatus();
        validateAndExecuteTransition(report, ReportEvent.FLAG_RUMOR, ReportStatus.FALSE_ALARM);
        report.setIsRumor(true);
        report.setActionNotes("Flagged as False Alarm: " + reason);
        report.setUpdatedAt(LocalDateTime.now());
        Report saved = reportRepository.save(report);

        recordAudit(saved.getId(), previousStatus.name(), saved.getStatus().name(),
                ReportEvent.FLAG_RUMOR.name(), flaggedBy, reason);

        eventPublisher.publishEvent(new ReportFalseAlarmEvent(this, saved, reason));

        realtimeNotificationService.broadcastReportUpdate(saved, "FALSE_ALARM");
        return saved;
    }

    private void validateAndExecuteTransition(Report report, ReportEvent event, ReportStatus expectedTarget) {
        StateMachine<ReportStatus, ReportEvent> sm = stateMachineFactory.getStateMachine(report.getTrackingId());
        sm.stopReactively().block();
        sm.getStateMachineAccessor().doWithAllRegions(accessor -> {
            accessor.resetStateMachineReactively(new org.springframework.statemachine.support.DefaultStateMachineContext<>(
                    report.getStatus(), null, null, null
            )).block();
        });
        sm.startReactively().block();

        boolean accepted = sm.sendEvent(event);
        if (!accepted) {
            logger.error("Illegal state transition attempt! Current={}, Event={}", report.getStatus(), event);
            throw new IllegalStateException("Illegal state jump! Cannot transition from " + report.getStatus() + " via " + event);
        }

        report.setStatus(sm.getState().getId());
    }

    private void recordAudit(Long reportId, String from, String to, String event, String actor, String comments) {
        AuditLog log = new AuditLog(reportId, from, to, event, actor, comments);
        auditLogRepository.save(log);
    }
}

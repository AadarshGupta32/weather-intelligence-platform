package com.weatherintel.gamification;

import com.weatherintel.entity.Report;
import com.weatherintel.entity.TrustScore;
import com.weatherintel.entity.User;
import com.weatherintel.repository.TrustScoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;

@Component
public class TrustScoreEventListener {

    private static final Logger logger = LoggerFactory.getLogger(TrustScoreEventListener.class);
    private final TrustScoreRepository trustScoreRepository;

    public TrustScoreEventListener(TrustScoreRepository trustScoreRepository) {
        this.trustScoreRepository = trustScoreRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onReportVerified(ReportVerifiedEvent event) {
        Report report = event.getReport();
        User user = report.getUser();
        if (user == null) {
            logger.debug("Report {} verified but no associated user found.", report.getTrackingId());
            return;
        }

        TrustScore trustScore = trustScoreRepository.findByUser(user)
                .orElseGet(() -> new TrustScore(user));

        // Positive verification increases reputation by +7.5 points (max 100.0)
        double newScore = Math.min(100.0, trustScore.getScore() + 7.5);
        trustScore.setScore(Math.round(newScore * 10.0) / 10.0);
        trustScore.setVerifiedCount(trustScore.getVerifiedCount() + 1);
        trustScore.setTotalSubmissions(trustScore.getTotalSubmissions() + 1);
        trustScore.setLastUpdated(LocalDateTime.now());
        
        // Recalculate tiered badges
        trustScore.recalculateBadge();
        trustScoreRepository.save(trustScore);

        logger.info("Updated TrustScore for user '{}': New Score={}, VerifiedCount={}, Badge='{}'",
                user.getUsername(), trustScore.getScore(), trustScore.getVerifiedCount(), trustScore.getBadgeTier());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onReportFalseAlarm(ReportFalseAlarmEvent event) {
        Report report = event.getReport();
        User user = report.getUser();
        if (user == null) {
            return;
        }

        TrustScore trustScore = trustScoreRepository.findByUser(user)
                .orElseGet(() -> new TrustScore(user));

        // False alarm / panic rumor penalizes score by -15.0 points (min 10.0)
        double newScore = Math.max(10.0, trustScore.getScore() - 15.0);
        trustScore.setScore(Math.round(newScore * 10.0) / 10.0);
        trustScore.setFalseAlarmCount(trustScore.getFalseAlarmCount() + 1);
        trustScore.setTotalSubmissions(trustScore.getTotalSubmissions() + 1);
        trustScore.setLastUpdated(LocalDateTime.now());

        trustScore.recalculateBadge();
        trustScoreRepository.save(trustScore);

        logger.warn("Penalized TrustScore for user '{}' due to False Alarm/Rumor: New Score={}, Badge='{}'",
                user.getUsername(), trustScore.getScore(), trustScore.getBadgeTier());
    }
}

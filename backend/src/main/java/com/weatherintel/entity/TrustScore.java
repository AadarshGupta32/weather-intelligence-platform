package com.weatherintel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trust_scores")
public class TrustScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private Double score = 50.0;

    @Column(name = "verified_count", nullable = false)
    private Integer verifiedCount = 0;

    @Column(name = "false_alarm_count", nullable = false)
    private Integer falseAlarmCount = 0;

    @Column(name = "total_submissions", nullable = false)
    private Integer totalSubmissions = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "badge_tier", nullable = false, length = 50)
    private BadgeTier badgeTier = BadgeTier.NOVICE_REPORTER;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated = LocalDateTime.now();

    public TrustScore() {}

    public TrustScore(User user) {
        this.user = user;
        this.score = 50.0;
        this.badgeTier = BadgeTier.NOVICE_REPORTER;
        this.lastUpdated = LocalDateTime.now();
    }

    public void recalculateBadge() {
        if (score >= 90.0 && verifiedCount >= 10) {
            this.badgeTier = BadgeTier.DISASTER_SENTINEL;
        } else if (score >= 75.0 && verifiedCount >= 5) {
            this.badgeTier = BadgeTier.VERIFIED_WEATHER_SCOUT;
        } else if (score >= 55.0 && verifiedCount >= 2) {
            this.badgeTier = BadgeTier.ACTIVE_SCOUT;
        } else {
            this.badgeTier = BadgeTier.NOVICE_REPORTER;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Integer getVerifiedCount() { return verifiedCount; }
    public void setVerifiedCount(Integer verifiedCount) { this.verifiedCount = verifiedCount; }

    public Integer getFalseAlarmCount() { return falseAlarmCount; }
    public void setFalseAlarmCount(Integer falseAlarmCount) { this.falseAlarmCount = falseAlarmCount; }

    public Integer getTotalSubmissions() { return totalSubmissions; }
    public void setTotalSubmissions(Integer totalSubmissions) { this.totalSubmissions = totalSubmissions; }

    public BadgeTier getBadgeTier() { return badgeTier; }
    public void setBadgeTier(BadgeTier badgeTier) { this.badgeTier = badgeTier; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}

package com.weatherintel.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_id", nullable = false, unique = true, length = 64)
    private String trackingId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "hazard_type", nullable = false, length = 50)
    private HazardType hazardType = HazardType.GENERAL_WEATHER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Severity severity = Severity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ReportStatus status = ReportStatus.SUBMITTED;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String city;

    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType = "CITIZEN_REPORT";

    @Column(name = "rumor_score")
    private Double rumorScore = 0.0;

    @Column(name = "is_rumor")
    private Boolean isRumor = false;

    @Column(name = "panic_index")
    private Double panicIndex = 0.0;

    @Column(length = 50)
    private String sentiment = "OBSERVATIONAL_NEUTRAL";

    @Column(name = "duplicate_flag")
    private Boolean duplicateFlag = false;

    @Column(length = 64)
    private String phash;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "action_notes", columnDefinition = "TEXT")
    private String actionNotes;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ReportMedia> mediaList = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Report() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTrackingId() { return trackingId; }
    public void setTrackingId(String trackingId) { this.trackingId = trackingId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public HazardType getHazardType() { return hazardType; }
    public void setHazardType(HazardType hazardType) { this.hazardType = hazardType; }

    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }

    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public Double getRumorScore() { return rumorScore; }
    public void setRumorScore(Double rumorScore) { this.rumorScore = rumorScore; }

    public Boolean getIsRumor() { return isRumor; }
    public void setIsRumor(Boolean rumor) { isRumor = rumor; }

    public Double getPanicIndex() { return panicIndex; }
    public void setPanicIndex(Double panicIndex) { this.panicIndex = panicIndex; }

    public String getSentiment() { return sentiment; }
    public void setSentiment(String sentiment) { this.sentiment = sentiment; }

    public Boolean getDuplicateFlag() { return duplicateFlag; }
    public void setDuplicateFlag(Boolean duplicateFlag) { this.duplicateFlag = duplicateFlag; }

    public String getPhash() { return phash; }
    public void setPhash(String phash) { this.phash = phash; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getActionNotes() { return actionNotes; }
    public void setActionNotes(String actionNotes) { this.actionNotes = actionNotes; }

    public List<ReportMedia> getMediaList() { return mediaList; }
    public void setMediaList(List<ReportMedia> mediaList) { this.mediaList = mediaList; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

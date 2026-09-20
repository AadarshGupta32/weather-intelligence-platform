package com.weatherintel.dto;

import org.springframework.web.multipart.MultipartFile;

public class ReportSubmissionDTO {
    private String title;
    private String description;
    private String hazardType;
    private String severity;
    private Double latitude;
    private Double longitude;
    private String district;
    private String city;
    private String username;
    private MultipartFile mediaFile;

    public ReportSubmissionDTO() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getHazardType() { return hazardType; }
    public void setHazardType(String hazardType) { this.hazardType = hazardType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public MultipartFile getMediaFile() { return mediaFile; }
    public void setMediaFile(MultipartFile mediaFile) { this.mediaFile = mediaFile; }
}

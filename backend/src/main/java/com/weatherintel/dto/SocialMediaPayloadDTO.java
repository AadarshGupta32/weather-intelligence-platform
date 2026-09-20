package com.weatherintel.dto;

public class SocialMediaPayloadDTO {
    private String postId;
    private String platform; // TWITTER_IMD, TELEGRAM, PUBLIC_POST
    private String author;
    private String content;
    private Double latitude;
    private Double longitude;
    private String city;
    private String district;
    private String timestamp;
    private String mediaUrl;

    public SocialMediaPayloadDTO() {}

    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
}

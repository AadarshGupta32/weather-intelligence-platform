package com.weatherintel.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "emergency_shelters")
public class EmergencyShelter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 50)
    private String type; // EVACUATION_CAMP, NDRF_DEPOT, MEDICAL_CENTER

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 255)
    private String address;

    @Column(length = 50)
    private String contactPhone;

    @Column(nullable = false)
    private Integer capacity = 500;

    @Column(nullable = false)
    private Integer currentOccupancy = 0;

    @Column(name = "is_operational", nullable = false)
    private Boolean isOperational = true;

    public EmergencyShelter() {}

    public EmergencyShelter(String name, String type, Double latitude, Double longitude, String address, String contactPhone, Integer capacity, Integer currentOccupancy) {
        this.name = name;
        this.type = type;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.contactPhone = contactPhone;
        this.capacity = capacity;
        this.currentOccupancy = currentOccupancy;
        this.isOperational = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public Integer getCurrentOccupancy() { return currentOccupancy; }
    public void setCurrentOccupancy(Integer currentOccupancy) { this.currentOccupancy = currentOccupancy; }

    public Boolean getIsOperational() { return isOperational; }
    public void setIsOperational(Boolean operational) { isOperational = operational; }
}

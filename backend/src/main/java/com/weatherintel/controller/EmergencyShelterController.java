package com.weatherintel.controller;

import com.weatherintel.dto.GeoJsonFeature;
import com.weatherintel.dto.GeoJsonFeatureCollection;
import com.weatherintel.entity.EmergencyShelter;
import com.weatherintel.repository.EmergencyShelterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shelters")
@CrossOrigin(origins = "*")
public class EmergencyShelterController {

    private final EmergencyShelterRepository shelterRepository;

    public EmergencyShelterController(EmergencyShelterRepository shelterRepository) {
        this.shelterRepository = shelterRepository;
    }

    @GetMapping("/geojson")
    public ResponseEntity<GeoJsonFeatureCollection> getSheltersGeoJson() {
        List<EmergencyShelter> shelters = shelterRepository.findByIsOperationalTrue();

        List<GeoJsonFeature> features = shelters.stream().map(s -> {
            Map<String, Object> props = new HashMap<>();
            props.put("id", s.getId());
            props.put("name", s.getName());
            props.put("type", s.getType());
            props.put("address", s.getAddress());
            props.put("contactPhone", s.getContactPhone());
            props.put("capacity", s.getCapacity());
            props.put("currentOccupancy", s.getCurrentOccupancy());
            props.put("availableSlots", Math.max(0, s.getCapacity() - s.getCurrentOccupancy()));
            props.put("isOperational", s.getIsOperational());

            return new GeoJsonFeature(s.getLongitude(), s.getLatitude(), props);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(new GeoJsonFeatureCollection(features));
    }

    @GetMapping("/nearest")
    public ResponseEntity<List<Map<String, Object>>> getNearestShelters(
            @RequestParam Double lat,
            @RequestParam Double lon) {

        List<EmergencyShelter> list = shelterRepository.findNearestShelters(lat, lon);

        List<Map<String, Object>> response = list.stream().map(s -> {
            double distanceMeters = calculateDistance(lat, lon, s.getLatitude(), s.getLongitude());
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("name", s.getName());
            map.put("type", s.getType());
            map.put("address", s.getAddress());
            map.put("contactPhone", s.getContactPhone());
            map.put("capacity", s.getCapacity());
            map.put("currentOccupancy", s.getCurrentOccupancy());
            map.put("distanceKm", Math.round((distanceMeters / 1000.0) * 10.0) / 10.0);
            map.put("latitude", s.getLatitude());
            map.put("longitude", s.getLongitude());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371000 * c;
    }
}

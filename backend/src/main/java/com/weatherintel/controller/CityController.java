package com.weatherintel.controller;

import com.weatherintel.service.CityLookupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cities")
@CrossOrigin(origins = "*")
public class CityController {

    private final CityLookupService cityLookupService;

    public CityController(CityLookupService cityLookupService) {
        this.cityLookupService = cityLookupService;
    }

    @GetMapping("/india")
    public ResponseEntity<List<Map<String, Object>>> getIndianCities() {
        return ResponseEntity.ok(cityLookupService.getIndianCities());
    }
}

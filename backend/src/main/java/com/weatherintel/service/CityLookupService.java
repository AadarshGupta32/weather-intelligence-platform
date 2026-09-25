package com.weatherintel.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

@Service
public class CityLookupService {

    private static final Logger logger = LoggerFactory.getLogger(CityLookupService.class);

    private final RestTemplate restTemplate;
    private List<Map<String, Object>> cachedCities = null;

    @Value("${app.geonames.username:priyanka_tech}")
    private String geonamesUsername;

    public CityLookupService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(6))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    public List<Map<String, Object>> getIndianCities() {
        if (cachedCities != null && !cachedCities.isEmpty()) return cachedCities;

        try {
            String url = String.format(
                "http://api.geonames.org/searchJSON?country=IN&featureClass=P&maxRows=1000&orderby=population&username=%s",
                geonamesUsername
            );

            Map response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("geonames") instanceof List) {
                List<Map<String, Object>> geonames = (List<Map<String, Object>>) response.get("geonames");
                List<Map<String, Object>> result = new ArrayList<>();
                for (Map<String, Object> place : geonames) {
                    if (place.get("name") != null && place.get("lat") != null && place.get("lng") != null) {
                        Map<String, Object> city = new HashMap<>();
                        city.put("name", place.get("name"));
                        city.put("state", place.get("adminName1") != null ? place.get("adminName1") : "");
                        city.put("latitude", Double.parseDouble(place.get("lat").toString()));
                        city.put("longitude", Double.parseDouble(place.get("lng").toString()));
                        result.add(city);
                    }
                }
                if (!result.isEmpty()) {
                    logger.info("Successfully fetched and cached {} Indian cities from GeoNames API", result.size());
                    cachedCities = result;
                    return result;
                }
            }
        } catch (Exception e) {
            logger.warn("GeoNames city fetch encountered error: {}. Using fallback Indian cities.", e.getMessage());
        }

        cachedCities = getDefaultIndianCities();
        return cachedCities;
    }

    private List<Map<String, Object>> getDefaultIndianCities() {
        List<Map<String, Object>> fallback = new ArrayList<>();
        addCity(fallback, "Indore", "Madhya Pradesh", 22.7196, 75.8577);
        addCity(fallback, "Bhopal", "Madhya Pradesh", 23.2599, 77.4126);
        addCity(fallback, "Mumbai", "Maharashtra", 19.0760, 72.8777);
        addCity(fallback, "Delhi", "Delhi", 28.6139, 77.2090);
        addCity(fallback, "Bengaluru", "Karnataka", 12.9716, 77.5946);
        addCity(fallback, "Hyderabad", "Telangana", 17.3850, 78.4867);
        addCity(fallback, "Ahmedabad", "Gujarat", 23.0225, 72.5714);
        addCity(fallback, "Chennai", "Tamil Nadu", 13.0827, 80.2707);
        addCity(fallback, "Kolkata", "West Bengal", 22.5726, 88.3639);
        addCity(fallback, "Surat", "Gujarat", 21.1702, 72.8311);
        addCity(fallback, "Pune", "Maharashtra", 18.5204, 73.8567);
        addCity(fallback, "Jaipur", "Rajasthan", 26.9124, 75.7873);
        addCity(fallback, "Lucknow", "Uttar Pradesh", 26.8467, 80.9462);
        addCity(fallback, "Kanpur", "Uttar Pradesh", 26.4499, 80.3319);
        addCity(fallback, "Nagpur", "Maharashtra", 21.1458, 79.0882);
        addCity(fallback, "Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185);
        addCity(fallback, "Patna", "Bihar", 25.5941, 85.1376);
        addCity(fallback, "Vadodara", "Gujarat", 22.3072, 73.1812);
        addCity(fallback, "Gwalior", "Madhya Pradesh", 26.2183, 78.1828);
        addCity(fallback, "Jabalpur", "Madhya Pradesh", 23.1815, 79.9864);
        addCity(fallback, "Chandigarh", "Chandigarh", 30.7333, 76.7794);
        addCity(fallback, "Guwahati", "Assam", 26.1445, 91.7362);
        addCity(fallback, "Bhubaneswar", "Odisha", 20.2961, 85.8245);
        addCity(fallback, "Dehradun", "Uttarakhand", 30.3165, 78.0322);
        addCity(fallback, "Shimla", "Himachal Pradesh", 31.1048, 77.1734);
        addCity(fallback, "Srinagar", "Jammu and Kashmir", 34.0837, 74.7973);
        addCity(fallback, "Thiruvananthapuram", "Kerala", 8.5241, 76.9366);
        addCity(fallback, "Kochi", "Kerala", 9.9312, 76.2673);
        return fallback;
    }

    private void addCity(List<Map<String, Object>> list, String name, String state, double lat, double lon) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", name);
        map.put("state", state);
        map.put("latitude", lat);
        map.put("longitude", lon);
        list.add(map);
    }
}
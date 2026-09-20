package com.weatherintel.dto;

import java.util.HashMap;
import java.util.Map;

public class GeoJsonFeature {
    private String type = "Feature";
    private Geometry geometry;
    private Map<String, Object> properties = new HashMap<>();

    public GeoJsonFeature() {}

    public GeoJsonFeature(double longitude, double latitude, Map<String, Object> properties) {
        this.type = "Feature";
        this.geometry = new Geometry(longitude, latitude);
        this.properties = properties;
    }

    public static class Geometry {
        private String type = "Point";
        private double[] coordinates;

        public Geometry() {}

        public Geometry(double longitude, double latitude) {
            this.type = "Point";
            this.coordinates = new double[]{longitude, latitude};
        }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public double[] getCoordinates() { return coordinates; }
        public void setCoordinates(double[] coordinates) { this.coordinates = coordinates; }
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Geometry getGeometry() { return geometry; }
    public void setGeometry(Geometry geometry) { this.geometry = geometry; }

    public Map<String, Object> getProperties() { return properties; }
    public void setProperties(Map<String, Object> properties) { this.properties = properties; }
}

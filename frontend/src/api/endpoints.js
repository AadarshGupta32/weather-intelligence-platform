/**
 * SURAKSHA-NET API Endpoints
 * Provides structured, easy-to-maintain API methods for all frontend services
 */

import { request } from './client.js';

export const endpoints = {
    // Reports & GeoJSON Incidents
    getIncidents: () => request('/api/reports/geojson'),
    getIncidentById: (id) => request(`/api/reports/${id}`),
    
    // Submit Citizen Report (Multipart or JSON)
    submitReport: (formData) => request('/api/reports', {
        method: 'POST',
        body: formData
    }),

    // Operator Verification
    verifyIncident: (id, payload) => request(`/api/reports/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    // Operator Action Dispatch
    dispatchAction: (id, payload) => request(`/api/reports/${id}/action`, {
        method: 'POST',
        body: JSON.stringify(payload)
    }),

    // Shelters & Safe Zones
    getShelters: () => request('/api/shelters'),

    // Citizen Sentinel Leaderboard
    getLeaderboard: () => request('/api/reports/leaderboard'),

    // IMD Telemetry Weather Data
    getTelemetry: (city = 'Indore') => request(`/api/weather/telemetry?city=${encodeURIComponent(city)}`),

    // NDMA SACHET National Alerts
    getNationalAlerts: () => request('/api/alerts/national'),

    // GeoNames Indian Cities Search
    searchCities: (query) => request(`/api/cities/search?query=${encodeURIComponent(query)}`),

    // SITREP Tactical Report (HTML / Plaintext)
    getSitrep: () => request('/api/reports/sitrep', {
        headers: { 'Accept': 'text/plain' }
    }),

    // Crisis Simulation Triggers
    triggerSimulation: (scenario = 'FLASH_FLOOD') => request('/api/simulate/crisis', {
        method: 'POST',
        body: JSON.stringify({ scenario })
    })
};

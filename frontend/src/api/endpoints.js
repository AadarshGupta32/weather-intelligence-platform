/**
 * SURAKSHA-NET API Endpoints
 * Accurately mapped to live Spring Boot & Python AI backend controllers
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

    // Operator Verification (PUT /api/admin/reports/{id}/verify)
    verifyIncident: (id, payload = {}) => request(`/api/admin/reports/${id}/${payload.verified ? 'verify' : 'false-alarm'}`, {
        method: 'PUT',
        body: JSON.stringify({
            adminUser: 'admin_ndrf',
            comments: payload.comments || 'Ground truth verified via commander dispatch console'
        })
    }),

    // Operator Action Dispatch (PUT /api/admin/reports/{id}/action)
    dispatchAction: (id, payload = {}) => request(`/api/admin/reports/${id}/action`, {
        method: 'PUT',
        body: JSON.stringify({
            teamName: payload.assignedUnit || 'NDRF Quick Response Team 4',
            instructions: payload.notes || 'Dispatched inflatable motorboats and rescue squads'
        })
    }),

    // Shelters & Safe Zones GeoJSON
    getShelters: async () => {
        const geojson = await request('/api/shelters/geojson');
        if (geojson && Array.isArray(geojson.features)) {
            return geojson.features.map(f => ({
                id: f.properties?.id,
                name: f.properties?.name,
                type: f.properties?.type,
                address: f.properties?.address,
                contactPhone: f.properties?.contactPhone,
                capacity: f.properties?.capacity,
                availableSlots: f.properties?.availableSlots,
                latitude: f.geometry?.coordinates?.[1],
                longitude: f.geometry?.coordinates?.[0]
            }));
        }
        return [];
    },

    // Citizen Sentinel Leaderboard (/api/reputation/leaderboard)
    getLeaderboard: () => request('/api/reputation/leaderboard'),

    // IMD Telemetry Weather Data (/api/telemetry/current)
    getTelemetry: (city = 'Indore') => request(`/api/telemetry/current?city=${encodeURIComponent(city)}`),

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

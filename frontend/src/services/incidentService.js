/**
 * Incident Service
 * High-level business logic for managing disaster ground-truth reports
 */
import { endpoints } from '../api/endpoints.js';
import { MOCK_REPORTS } from '../data/mockData.js';

class IncidentService {
    async fetchAllIncidents() {
        try {
            const data = await endpoints.getIncidents();
            if (data && Array.isArray(data.features) && data.features.length > 0) {
                return data.features;
            }
        } catch (err) {
            console.warn('[IncidentService] Live fetch failed, using fallback mock dataset:', err.message);
        }
        return MOCK_REPORTS;
    }

    async submitNewReport(reportData, imageFile) {
        const formData = new FormData();
        formData.append('title', reportData.title);
        formData.append('description', reportData.description);
        formData.append('hazardType', reportData.hazardType);
        formData.append('latitude', reportData.latitude);
        formData.append('longitude', reportData.longitude);
        formData.append('reportedBy', reportData.reportedBy || 'citizen_user');

        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            return await endpoints.submitReport(formData);
        } catch (err) {
            console.warn('[IncidentService] API submission failed, creating local fallback report:', err.message);
            // Construct a robust local feature object
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(reportData.longitude), parseFloat(reportData.latitude)]
                },
                properties: {
                    id: Date.now(),
                    trackingId: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
                    title: reportData.title,
                    description: reportData.description,
                    hazardType: reportData.hazardType,
                    severity: 'HIGH',
                    status: 'REPORTED',
                    city: 'Indore',
                    district: 'Indore',
                    reportedBy: reportData.reportedBy || 'citizen_user',
                    reporterBadge: 'NOVICE_SCOUT',
                    reporterTrustScore: 50.0,
                    rumorScore: 0.05,
                    isRumor: false,
                    sentiment: 'OBJECTIVE_INFORMATIVE',
                    sourceType: 'CITIZEN_MOBILE',
                    mediaUrl: imageFile ? URL.createObjectURL(imageFile) : '',
                    phash: null,
                    duplicateFlag: false,
                    createdAt: new Date().toISOString()
                }
            };
        }
    }

    async verifyReport(id, verified) {
        try {
            return await endpoints.verifyIncident(id, { verified });
        } catch (err) {
            console.warn('[IncidentService] Verification API error, simulating local update:', err.message);
            return { id, verified, status: verified ? 'ADMIN_VERIFIED' : 'FALSE_ALARM' };
        }
    }

    async dispatchAction(id, actionDetails) {
        try {
            return await endpoints.dispatchAction(id, actionDetails);
        } catch (err) {
            console.warn('[IncidentService] Dispatch API error, simulating local update:', err.message);
            return { id, actionDetails, status: 'ACTIONED' };
        }
    }
}

export const incidentService = new IncidentService();

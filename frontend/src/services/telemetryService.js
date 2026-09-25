/**
 * Meteorological Telemetry Polling Service
 * Syncs IMD Doppler radar data and weather sensor observations
 */
import { endpoints } from '../api/endpoints.js';
import { MOCK_TELEMETRY } from '../data/mockData.js';

class TelemetryService {
    constructor() {
        this.cache = { ...MOCK_TELEMETRY };
        this.pollInterval = null;
    }

    async fetchTelemetry(city = 'Indore') {
        try {
            const data = await endpoints.getTelemetry(city);
            if (data && typeof data === 'object') {
                this.cache = data;
                return data;
            }
        } catch (err) {
            console.warn('[Telemetry] Error fetching live data, falling back to cached telemetry');
        }
        return this.cache;
    }

    startPolling(city = 'Indore', intervalMs = 20000, onUpdate) {
        this.stopPolling();
        // Initial fetch
        this.fetchTelemetry(city).then(onUpdate);

        this.pollInterval = setInterval(async () => {
            const updated = await this.fetchTelemetry(city);
            if (onUpdate) onUpdate(updated);
        }, intervalMs);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
}

export const telemetryService = new TelemetryService();

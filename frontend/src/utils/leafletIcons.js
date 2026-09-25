/**
 * Custom SVG DivIcons for Leaflet Map
 * Zero external asset dependencies; rendered via CSS + inline SVGs
 */
import L from 'leaflet';

export function createIncidentMarker(severity, hazardType, isRumor) {
    let color = '#0866FF';
    let pulseClass = '';

    if (isRumor) {
        color = '#64748B'; // Muted slate for rumors
    } else if (severity === 'CRITICAL') {
        color = '#FA383E'; // Red
        pulseClass = 'marker-pulse-critical';
    } else if (severity === 'HIGH') {
        color = '#F59E0B'; // Amber
        pulseClass = 'marker-pulse-high';
    } else if (severity === 'MEDIUM') {
        color = '#0284C7';
    } else {
        color = '#31A24C';
    }

    const html = `
        <div class="custom-marker-wrapper ${pulseClass}">
            <div class="custom-marker-dot" style="background-color: ${color};">
                <span class="custom-marker-icon">${isRumor ? '🛑' : severity === 'CRITICAL' ? '⚠️' : '📍'}</span>
            </div>
        </div>
    `;

    return L.divIcon({
        className: 'custom-leaflet-divicon',
        html: html,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
}

export function createShelterMarker(type = 'EVACUATION_CAMP') {
    const isMedical = type === 'MEDICAL_CENTER';
    const isDepot = type === 'NDRF_DEPOT';
    const color = isMedical ? '#10B981' : isDepot ? '#8B5CF6' : '#0866FF';
    const icon = isMedical ? '🏥' : isDepot ? '🚤' : '⛺';

    const html = `
        <div class="custom-shelter-dot" style="background-color: ${color};">
            <span style="font-size: 13px;">${icon}</span>
        </div>
    `;

    return L.divIcon({
        className: 'custom-shelter-divicon',
        html: html,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
    });
}

/**
 * SURAKSHA-NET: Real-Time Weather Intelligence & Emergency Response Platform
 * Frontend GIS Command Center & Citizen Portal (Phase 2 Advanced Intelligence)
 */

const API_BASE = 'http://localhost:8080';
let map;
let geoJsonLayer;
let sheltersLayer;
let radarLayer = null;
let radiusCircle = null;
let stompClient = null;
let audioEnabled = true;
let reportsData = [];
let activeReportForAction = null;
let isRadarActive = false;
let isSheltersActive = true;
let isSachetActive = true;
let sachetLayer = null;
let currentTelemetryCity = 'Indore';
let indiaCities = []; // Loaded from backend /api/cities/india (GeoNames-backed)
let nationalAlerts = []; // Loaded from backend /api/alerts/national (NDMA SACHET)

// Standard Indian State & UT Centroids for national alerts
const INDIAN_STATES_CENTROIDS = {
    'andhra pradesh': { lat: 15.9129, lon: 79.7400, name: 'Andhra Pradesh' },
    'arunachal pradesh': { lat: 28.2180, lon: 94.7278, name: 'Arunachal Pradesh' },
    'assam': { lat: 26.2006, lon: 92.9376, name: 'Assam' },
    'bihar': { lat: 25.0961, lon: 85.3131, name: 'Bihar' },
    'chhattisgarh': { lat: 21.2787, lon: 81.8661, name: 'Chhattisgarh' },
    'goa': { lat: 15.2993, lon: 74.1240, name: 'Goa' },
    'gujarat': { lat: 22.2587, lon: 71.1924, name: 'Gujarat' },
    'haryana': { lat: 29.0588, lon: 76.0856, name: 'Haryana' },
    'himachal pradesh': { lat: 31.1048, lon: 77.1734, name: 'Himachal Pradesh' },
    'jharkhand': { lat: 23.6102, lon: 85.2799, name: 'Jharkhand' },
    'karnataka': { lat: 15.3173, lon: 75.7139, name: 'Karnataka' },
    'kerala': { lat: 10.8505, lon: 76.2711, name: 'Kerala' },
    'madhya pradesh': { lat: 22.9734, lon: 78.6569, name: 'Madhya Pradesh' },
    'maharashtra': { lat: 19.7515, lon: 75.7139, name: 'Maharashtra' },
    'manipur': { lat: 24.6637, lon: 93.9063, name: 'Manipur' },
    'meghalaya': { lat: 25.4670, lon: 91.3662, name: 'Meghalaya' },
    'mizoram': { lat: 23.1645, lon: 92.9376, name: 'Mizoram' },
    'nagaland': { lat: 26.1584, lon: 94.5624, name: 'Nagaland' },
    'odisha': { lat: 20.9517, lon: 85.0985, name: 'Odisha' },
    'punjab': { lat: 31.1471, lon: 75.3412, name: 'Punjab' },
    'rajasthan': { lat: 27.0238, lon: 74.2179, name: 'Rajasthan' },
    'sikkim': { lat: 27.5330, lon: 88.5122, name: 'Sikkim' },
    'tamil nadu': { lat: 11.1271, lon: 78.6569, name: 'Tamil Nadu' },
    'telangana': { lat: 18.1124, lon: 79.0193, name: 'Telangana' },
    'tripura': { lat: 23.9408, lon: 91.9882, name: 'Tripura' },
    'uttar pradesh': { lat: 26.8467, lon: 80.9462, name: 'Uttar Pradesh' },
    'uttarakhand': { lat: 30.0668, lon: 79.0193, name: 'Uttarakhand' },
    'west bengal': { lat: 22.9868, lon: 87.8550, name: 'West Bengal' },
    'delhi': { lat: 28.7041, lon: 77.1025, name: 'Delhi' },
    'jammu and kashmir': { lat: 33.7782, lon: 76.5762, name: 'Jammu & Kashmir' },
    'ladakh': { lat: 34.1526, lon: 77.5771, name: 'Ladakh' }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadIndianCities();
    fetchNationalAlerts();
    fetchTelemetry(22.7196, 75.8577, 'Indore');
    fetchReportsGeoJson();
    fetchSheltersGeoJson();
    fetchLeaderboard();
    connectRealtimeStreams();

    // Map click handler to populate GPS in citizen report form
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        document.getElementById('rep-lat').value = lat.toFixed(5);
        document.getElementById('rep-lon').value = lng.toFixed(5);

        // Render micro-local radius circle on click
        const radiusKm = parseFloat(document.getElementById('filter-radius').value) || 5;
        drawRadiusCircle(lat, lng, radiusKm);
    });

    // Periodically refresh telemetry every 60s & SACHET alerts every 3m
    setInterval(() => {
        const coords = findCityCoords(currentTelemetryCity) || { lat: 22.7196, lon: 75.8577 };
        fetchTelemetry(coords.lat, coords.lon, currentTelemetryCity);
    }, 60000);
    setInterval(fetchNationalAlerts, 180000);
});

/**
 * 0. National City Directory (GeoNames-backed, via backend /api/cities/india)
 */
async function loadIndianCities() {
    try {
        const res = await fetch(`${API_BASE}/api/cities/india`);
        if (!res.ok) throw new Error('Failed to fetch city directory');
        indiaCities = await res.json();
        console.log(`Loaded ${indiaCities.length} Indian cities from national directory`);
        populateCityDatalist();
        if (nationalAlerts && nationalAlerts.length > 0) {
            renderSachetMapMarkers();
        }
    } catch (e) {
        console.warn('City directory load warning:', e.message);
    }
}

/**
 * Populates global datalist for instant autocomplete in search & report form
 */
function populateCityDatalist() {
    const datalist = document.getElementById('cities-datalist');
    if (!datalist || !indiaCities || indiaCities.length === 0) return;
    datalist.innerHTML = '';
    indiaCities.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.label = `${c.name} (${c.state || 'India'})`;
        datalist.appendChild(opt);
    });
}

/**
 * Look up a city's coordinates by name (case-insensitive) from directory or state centroids.
 * Returns { lat, lon, state, name } or null if not found.
 */
function findCityCoords(cityName) {
    if (!cityName) return null;
    const clean = cityName.trim().toLowerCase();
    if (indiaCities && indiaCities.length > 0) {
        const match = indiaCities.find(
            c => c.name && c.name.toLowerCase() === clean
        );
        if (match) {
            return { lat: match.latitude, lon: match.longitude, state: match.state, name: match.name };
        }
    }
    // Fallback to states dictionary
    if (INDIAN_STATES_CENTROIDS[clean]) {
        const s = INDIAN_STATES_CENTROIDS[clean];
        return { lat: s.lat, lon: s.lon, state: s.name, name: s.name };
    }
    return null;
}

function onCitySelected(cityName) {
    if (!cityName) return;
    switchTelemetryToCity(cityName);
}

function onReportCitySelected(cityName) {
    const coords = findCityCoords(cityName);
    if (!coords) return;
    const latInput = document.getElementById('rep-lat');
    const lonInput = document.getElementById('rep-lon');
    const distInput = document.getElementById('rep-district');
    if (latInput) latInput.value = coords.lat.toFixed(4);
    if (lonInput) lonInput.value = coords.lon.toFixed(4);
    if (distInput && coords.state) distInput.value = coords.state;
    map.panTo([coords.lat, coords.lon]);
    drawRadiusCircle(coords.lat, coords.lon, 5);
}

/**
 * Scan alert text to match known Indian cities or states
 */
function extractLocationFromAlert(alert) {
    if (!alert) return null;
    const text = `${alert.title || ''} ${alert.description || ''} ${alert.author || ''}`.toLowerCase();

    // 1. Try finding a known city in the text (checking first 300 major cities)
    if (indiaCities && indiaCities.length > 0) {
        for (let i = 0; i < Math.min(indiaCities.length, 300); i++) {
            const c = indiaCities[i];
            if (c.name && c.name.length >= 4) {
                const regex = new RegExp(`\\b${c.name.toLowerCase()}\\b`, 'i');
                if (regex.test(text)) {
                    return { name: c.name, lat: c.latitude, lon: c.longitude, isState: false };
                }
            }
        }
    }

    // 2. Try finding a state in the text
    for (const [stateKey, stateData] of Object.entries(INDIAN_STATES_CENTROIDS)) {
        const regex = new RegExp(`\\b${stateKey}\\b`, 'i');
        if (regex.test(text)) {
            return { name: stateData.name, lat: stateData.lat, lon: stateData.lon, isState: true };
        }
    }

    return null;
}

/**
 * 0b. NDMA SACHET National Disaster Alert Feed
 * Live RSS/CAP ingestion from backend /api/alerts/national
 */
async function fetchNationalAlerts() {
    const list = document.getElementById('sachet-alerts-list');
    const badge = document.getElementById('sachet-count-badge');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE}/api/alerts/national`);
        if (!res.ok) throw new Error('Failed to fetch SACHET alerts');
        const alerts = await res.json();
        nationalAlerts = alerts || [];

        if (badge) {
            badge.innerText = `${nationalAlerts.length} Active Alerts`;
        }

        list.innerHTML = '';
        if (nationalAlerts.length === 0) {
            list.innerHTML = '<div style="color:#94a3b8; font-size:0.75rem; text-align:center; padding:12px;">No active national disaster advisories at this time.</div>';
            return;
        }

        // Render up to 20 latest alerts
        const displayAlerts = nationalAlerts.slice(0, 20);
        displayAlerts.forEach((alert, idx) => {
            const card = document.createElement('div');
            card.className = 'sachet-alert-card clickable';

            const rawTitle = alert.title || 'National Disaster Advisory';
            const cleanTitle = escapeHtml(rawTitle);
            const pubDateStr = alert.pubDate ? new Date(alert.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Live';
            const link = alert.link || '#';
            const author = alert.author ? escapeHtml(alert.author) : 'NDMA / IMD';

            const matchedLoc = extractLocationFromAlert(alert);

            card.innerHTML = `
                <div class="sachet-alert-title">
                    ⚠️ ${cleanTitle}
                </div>
                ${alert.description ? `<div style="font-size:0.72rem; color:#94a3b8; line-height:1.3;">${escapeHtml(alert.description)}</div>` : ''}
                <div class="sachet-alert-meta">
                    <span>⏱️ ${pubDateStr}</span>
                    <div style="display:flex; align-items:center; gap:6px;">
                        ${matchedLoc ? `<button class="btn btn-secondary btn-sm" style="padding:1px 5px; font-size:0.65rem;" onclick="event.stopPropagation(); switchTelemetryToCity('${escapeHtml(matchedLoc.name)}')">📍 ${escapeHtml(matchedLoc.name)}</button>` : ''}
                        ${link !== '#' ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="sachet-alert-link" onclick="event.stopPropagation()">CAP Bulletin ↗</a>` : ''}
                    </div>
                </div>
            `;

            // Clicking card focuses on map
            card.onclick = () => focusAlertOnMap(idx);
            list.appendChild(card);
        });

        // Update the top navigation live ticker with the latest clean headline
        const englishAlert = nationalAlerts.find(a => a.title && /[a-zA-Z]{5,}/.test(a.title));
        if (englishAlert) {
            const ticker = document.getElementById('live-ticker');
            if (ticker) {
                ticker.innerText = `NDMA SACHET: ${englishAlert.title}`;
            }
        }

        // Plot interactive alert markers onto the Leaflet GIS map
        renderSachetMapMarkers();

    } catch (e) {
        console.warn('SACHET alert fetch warning:', e.message);
        if (badge) badge.innerText = 'Standby';
        list.innerHTML = '<div style="color:#94a3b8; font-size:0.75rem; text-align:center; padding:8px;">Syncing with NDMA SACHET national feed...</div>';
    }
}

/**
 * Render SACHET Disaster Alert markers on GIS Map
 */
function renderSachetMapMarkers() {
    if (!sachetLayer) return;
    sachetLayer.clearLayers();
    if (!isSachetActive || !nationalAlerts || nationalAlerts.length === 0) return;

    nationalAlerts.forEach((alert, idx) => {
        const loc = extractLocationFromAlert(alert);
        if (!loc) return;

        const marker = L.circleMarker([loc.lat, loc.lon], {
            radius: 8,
            fillColor: '#ef4444',
            color: '#fee2e2',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
        });

        const cleanTitle = escapeHtml(alert.title || 'National Disaster Advisory');
        const cleanDesc = alert.description ? escapeHtml(alert.description) : '';
        const cleanAuthor = alert.author ? escapeHtml(alert.author) : 'NDMA SACHET / IMD';
        const pubDateStr = alert.pubDate ? new Date(alert.pubDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Live';
        const link = alert.link || '#';

        const popupContent = `
            <div class="sachet-popup-title">🚨 ${cleanTitle}</div>
            <div class="sachet-popup-agency">🏛️ ${cleanAuthor} | ⏱️ ${pubDateStr}</div>
            ${cleanDesc ? `<div class="sachet-popup-desc">${cleanDesc}</div>` : ''}
            <div class="sachet-popup-actions">
                <button class="sachet-popup-btn" onclick="switchTelemetryToCity('${escapeHtml(loc.name)}')">📍 Sensor: ${escapeHtml(loc.name)}</button>
                ${link !== '#' ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; font-size:11px; text-decoration:none;">CAP Bulletin ↗</a>` : ''}
            </div>
        `;

        marker.bindPopup(popupContent, { className: 'sachet-leaflet-popup', maxWidth: 320 });
        marker.alertIndex = idx;
        sachetLayer.addLayer(marker);
    });
}

function focusAlertOnMap(index) {
    const alert = nationalAlerts[index];
    if (!alert) return;
    const loc = extractLocationFromAlert(alert);
    if (loc) {
        map.flyTo([loc.lat, loc.lon], 9, { duration: 1.2 });
        if (!loc.isState) {
            switchTelemetryToCity(loc.name);
        }
        if (sachetLayer) {
            sachetLayer.eachLayer(layer => {
                if (layer.alertIndex === index) {
                    layer.openPopup();
                }
            });
        }
    }
}

/**
 * 1. GIS Leaflet Map Setup
 */
function initMap() {
    map = L.map('gis-map', {
        center: [22.9734, 78.6569], // Centered on India (national view)
        zoom: 5,
        zoomControl: true
    });

    // Free OpenStreetMap Tiles (no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abc',
        maxZoom: 19
    }).addTo(map);

    // 1. Incidents Layer
    geoJsonLayer = L.geoJSON(null, {
        pointToLayer: (feature, latlng) => {
            const markerColor = getMarkerColor(feature.properties);
            return L.circleMarker(latlng, {
                radius: feature.properties.severity === 'CRITICAL' ? 10 : 7,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.85
            });
        },
        onEachFeature: (feature, layer) => {
            layer.bindPopup(createPopupContent(feature.properties));
            layer.on('click', () => {
                const [lon, lat] = feature.geometry.coordinates;
                const radiusKm = parseFloat(document.getElementById('filter-radius').value) || 5;
                drawRadiusCircle(lat, lon, radiusKm);
            });
        }
    }).addTo(map);

    // 2. Safe Shelters Layer
    sheltersLayer = L.geoJSON(null, {
        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#10b981',
                color: '#d1fae5',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            });
        },
        onEachFeature: (feature, layer) => {
            const p = feature.properties;
            layer.bindPopup(`
                <div style="font-family:'Inter',sans-serif; color:#0f172a; min-width:200px;">
                    <div style="font-weight:bold; font-size:12px; color:#065f46;">⛺ ${escapeHtml(p.name)}</div>
                    <div style="font-size:10px; color:#64748b;">${escapeHtml(p.type)} | Available: <strong>${p.availableSlots} / ${p.capacity}</strong></div>
                    <div style="font-size:11px; margin-top:4px;">📍 ${escapeHtml(p.address || '')}</div>
                    <div style="font-size:11px; margin-top:2px;">📞 ${escapeHtml(p.contactPhone || '1077')}</div>
                </div>
            `);
        }
    }).addTo(map);

    // 3. SACHET National Alerts Layer
    sachetLayer = L.layerGroup().addTo(map);
}

function getMarkerColor(props) {
    if (props.isRumor || props.status === 'FALSE_ALARM') return '#64748b'; // Gray
    if (props.status === 'ACTIONED') return '#38bdf8'; // Blue
    if (props.status === 'ADMIN_VERIFIED') return '#10b981'; // Green
    if (props.severity === 'CRITICAL') return '#ef4444'; // Red
    return '#f59e0b'; // Amber (AI Checked / Pending)
}

function drawRadiusCircle(lat, lon, radiusKm) {
    if (radiusCircle) {
        map.removeLayer(radiusCircle);
    }
    radiusCircle = L.circle([lat, lon], {
        radius: radiusKm * 1000,
        color: '#38bdf8',
        weight: 1.5,
        fillColor: '#0284c7',
        fillOpacity: 0.12,
        dashArray: '4, 4'
    }).addTo(map);
}

function updateRadiusVal(val) {
    document.getElementById('radius-val').innerText = val;
    if (radiusCircle) {
        radiusCircle.setRadius(val * 1000);
    }
}

function createPopupContent(p) {
    const isRumor = p.isRumor || p.status === 'FALSE_ALARM';
    const rumorPercent = Math.round((p.rumorScore || 0) * 100);
    const mediaHtml = p.mediaUrl ? `<div style="margin-top:6px;"><img src="${p.mediaUrl}" style="width:100%; border-radius:4px; max-height:120px; object-fit:cover;" /></div>` : '';
    const phashHtml = p.phash ? `<div style="font-family:monospace; font-size:10px; color:#38bdf8; margin-top:2px;">pHash: ${p.phash}</div>` : '';
    const dupAlert = p.duplicateFlag ? `
        <div style="color:#ef4444; font-size:10px; font-weight:bold; margin-top:4px;">
            ⚠️ RECYCLED DUPLICATE MEDIA DETECTED
            <button onclick="openForensicsModal(${p.id})" style="background:#dc2626; color:white; border:none; border-radius:3px; padding:2px 6px; font-size:9px; cursor:pointer; margin-left:4px;">Inspect Forensics</button>
        </div>` : '';

    return `
        <div style="font-family:'Inter', sans-serif; min-width:240px; color:#0f172a;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
                <span style="font-size:11px; font-weight:bold; background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:3px;">${p.hazardType}</span>
                <span style="font-size:10px; font-family:monospace; font-weight:bold;">${p.status}</span>
            </div>
            <h4 style="margin:6px 0 2px 0; font-size:13px; font-weight:700;">${escapeHtml(p.title)}</h4>
            <p style="margin:0 0 6px 0; font-size:11px; color:#475569; line-height:1.3;">${escapeHtml(p.description)}</p>
            ${mediaHtml}
            ${phashHtml}
            ${dupAlert}
            <div style="margin:6px 0; font-size:11px; background:#f8fafc; padding:4px 6px; border-radius:4px;">
                <div><strong>Rumor Probability:</strong> ${rumorPercent}%</div>
                <div><strong>Reported By:</strong> ${p.reportedBy || 'Citizen'} (${p.reporterBadge || 'SCOUT'})</div>
            </div>
            <div style="display:flex; gap:4px; margin-top:6px;">
                ${p.status !== 'ADMIN_VERIFIED' && p.status !== 'ACTIONED' && !isRumor ? 
                    `<button onclick="verifyReportFromMap(${p.id})" style="flex:1; background:#10b981; color:white; border:none; padding:4px; border-radius:4px; font-size:11px; cursor:pointer;">Verify</button>` : ''}
                ${p.status === 'ADMIN_VERIFIED' ? 
                    `<button onclick="openActionModalForId(${p.id}, '${escapeHtml(p.title)}')" style="flex:1; background:#0284c7; color:white; border:none; padding:4px; border-radius:4px; font-size:11px; cursor:pointer;">Deploy NDRF</button>` : ''}
                ${!isRumor ? 
                    `<button onclick="flagRumorFromMap(${p.id})" style="background:#64748b; color:white; border:none; padding:4px; border-radius:4px; font-size:11px; cursor:pointer;">Flag Rumor</button>` : ''}
            </div>
        </div>
    `;
}

/**
 * 2. Meteorological Telemetry Fetcher
 */
async function fetchTelemetry(lat, lon, city) {
    try {
        const params = new URLSearchParams();
        if (lat != null) params.append('lat', lat);
        if (lon != null) params.append('lon', lon);
        if (city) params.append('city', city);

        const url = params.toString()
            ? `${API_BASE}/api/telemetry/current?${params.toString()}`
            : `${API_BASE}/api/telemetry/current`;

        const res = await fetch(url);
        if (!res.ok) return;
        const t = await res.json();

        document.getElementById('telem-city').innerText = `${t.city} Station (IMD)`;
        document.getElementById('telem-temp').innerText = `${t.temperature.toFixed(1)}°C`;
        document.getElementById('telem-rain').innerText = `${t.precipitationMm.toFixed(1)} mm`;
        document.getElementById('telem-wind').innerText = `${t.windSpeedKmh.toFixed(1)} km/h`;
        
        const riskBadge = document.getElementById('telem-risk');
        riskBadge.innerText = t.floodRiskLevel.replace(/_/g, ' ');
        if (t.floodRiskLevel.includes('CRITICAL') || t.floodRiskLevel.includes('HIGH')) {
            riskBadge.className = 'badge-risk';
            riskBadge.style.borderColor = '#ef4444';
            riskBadge.style.color = '#fca5a5';
        } else {
            riskBadge.className = 'badge-risk';
            riskBadge.style.borderColor = '#10b981';
            riskBadge.style.color = '#86efac';
        }
    } catch (e) {
        console.warn('Telemetry fetch warning:', e.message);
    }
}

/**
 * Convenience: switch telemetry + map focus to a named Indian city using the
 * national city directory loaded from the backend (GeoNames-backed).
 */
function switchTelemetryToCity(cityName) {
    const coords = findCityCoords(cityName);
    if (!coords) {
        console.warn(`City "${cityName}" not found in national directory`);
        return false;
    }
    fetchTelemetry(coords.lat, coords.lon, cityName);
    map.flyTo([coords.lat, coords.lon], 11, { duration: 1.2 });
    return true;
}

/**
 * 3. Fetch GeoJSON and Render Map Layers
 */
async function fetchReportsGeoJson() {
    try {
        const hazard = document.getElementById('filter-hazard').value;
        const status = document.getElementById('filter-status').value;
        const district = document.getElementById('filter-district').value;

        const params = new URLSearchParams();
        if (hazard) params.append('event', hazard);
        if (status) params.append('status', status);
        if (district) params.append('district', district);

        const res = await fetch(`${API_BASE}/api/reports/geojson?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch GeoJSON data');

        const data = await res.json();
        reportsData = data.features || [];

        // Update GeoJSON layer
        geoJsonLayer.clearLayers();
        geoJsonLayer.addData(data);

        // Update UI counters and feed list
        updateStats(reportsData);
        renderFeedList(reportsData);

    } catch (err) {
        console.warn('API fetch warning:', err.message);
    }
}

async function fetchSheltersGeoJson() {
    try {
        const res = await fetch(`${API_BASE}/api/shelters/geojson`);
        if (!res.ok) return;
        const data = await res.json();
        sheltersLayer.clearLayers();
        sheltersLayer.addData(data);
    } catch (e) {}
}

function updateStats(features) {
    document.getElementById('stat-total').innerText = features.length;
    document.getElementById('feed-count').innerText = features.length;

    const verified = features.filter(f => f.properties.status === 'ADMIN_VERIFIED').length;
    const actioned = features.filter(f => f.properties.status === 'ACTIONED').length;
    const rumors = features.filter(f => f.properties.isRumor || f.properties.status === 'FALSE_ALARM').length;

    document.getElementById('stat-verified').innerText = verified;
    document.getElementById('stat-actioned').innerText = actioned;
    document.getElementById('stat-rumor').innerText = rumors;
}

function renderFeedList(features) {
    const list = document.getElementById('incident-feed-list');
    list.innerHTML = '';

    if (features.length === 0) {
        list.innerHTML = '<div style="color:#64748b; font-size:0.8rem; text-align:center; padding:20px;">No incidents matching current criteria</div>';
        return;
    }

    features.forEach(f => {
        const p = f.properties;
        const card = document.createElement('div');
        card.className = 'incident-card';

        const isRumor = p.isRumor || p.status === 'FALSE_ALARM';
        const rumorScore = Math.round((p.rumorScore || 0) * 100);

        card.innerHTML = `
            <div class="card-top">
                <span class="badge-hazard">${p.hazardType}</span>
                <span class="badge-status status-${p.status}">${p.status}</span>
            </div>
            <div class="card-title">${escapeHtml(p.title)}</div>
            <div class="card-desc">${escapeHtml(p.description)}</div>
            <div class="card-metrics">
                <span class="metric-loc">📍 ${escapeHtml(p.city || 'Indore')}</span>
                <span class="metric-rumor ${rumorScore > 50 ? 'high-rumor' : ''}">🤖 Rumor Score: ${rumorScore}%</span>
            </div>
            ${p.duplicateFlag ? `
                <div style="color:#ef4444; font-size:11px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                    <span>⚠️ Recycled Duplicate Media Flagged</span>
                    <button class="btn btn-danger btn-sm" style="padding:2px 6px; font-size:10px;" onclick="openForensicsModal(${p.id})">Forensics</button>
                </div>` : ''}
            <div class="card-actions">
                ${p.status !== 'ADMIN_VERIFIED' && p.status !== 'ACTIONED' && !isRumor ? 
                    `<button class="btn btn-primary btn-sm" onclick="verifyReportFromMap(${p.id})">Verify Ground Truth</button>` : ''}
                ${p.status === 'ADMIN_VERIFIED' ? 
                    `<button class="btn btn-danger btn-sm" onclick="openActionModalForId(${p.id}, '${escapeHtml(p.title)}')">Deploy Relief Team</button>` : ''}
                <button class="btn btn-secondary btn-sm" onclick="focusOnMarker(${p.id})">Locate</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function focusOnMarker(reportId) {
    const match = reportsData.find(f => f.properties.id === reportId);
    if (match) {
        const [lon, lat] = match.geometry.coordinates;
        map.flyTo([lat, lon], 14, { duration: 1.2 });
        drawRadiusCircle(lat, lon, 5);
    }
}

/**
 * 4. Layer Controls: Doppler Radar & Shelters
 */
function toggleRadarLayer() {
    const btn = document.getElementById('btn-radar');
    isRadarActive = !isRadarActive;

    if (isRadarActive) {
        // RainViewer Live Weather Radar Tile Layer
        radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_45min/256/{z}/{x}/{y}/2/1_1.png', {
            opacity: 0.65,
            zIndex: 500
        }).addTo(map);
        btn.innerText = '🛰️ Doppler Radar: ON';
        btn.classList.add('active');
    } else {
        if (radarLayer) {
            map.removeLayer(radarLayer);
            radarLayer = null;
        }
        btn.innerText = '🛰️ Doppler Radar: OFF';
        btn.classList.remove('active');
    }
}

function toggleSheltersLayer() {
    const btn = document.getElementById('btn-shelters');
    isSheltersActive = !isSheltersActive;

    if (isSheltersActive) {
        sheltersLayer.addTo(map);
        btn.innerText = '⛺ Safe Shelters: ON';
        btn.classList.add('active');
    } else {
        map.removeLayer(sheltersLayer);
        btn.innerText = '⛺ Safe Shelters: OFF';
        btn.classList.remove('active');
    }
}

function toggleSachetLayer() {
    const btn = document.getElementById('btn-sachet');
    isSachetActive = !isSachetActive;

    if (isSachetActive) {
        if (!map.hasLayer(sachetLayer)) sachetLayer.addTo(map);
        btn.innerText = '📡 SACHET Alerts: ON';
        btn.classList.add('sachet-active');
        renderSachetMapMarkers();
    } else {
        if (map.hasLayer(sachetLayer)) map.removeLayer(sachetLayer);
        btn.innerText = '📡 SACHET Alerts: OFF';
        btn.classList.remove('sachet-active');
    }
}

/**
 * 5. Media Forensics Modal
 */
async function openForensicsModal(reportId) {
    const modal = document.getElementById('forensics-modal');
    const content = document.getElementById('forensics-content');
    content.innerHTML = '<div style="color:#94a3b8; font-size:0.8rem; text-align:center;">Analyzing bitwise perceptual hashes...</div>';
    modal.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/api/admin/media-forensics/${reportId}`);
        if (!res.ok) throw new Error('Could not retrieve forensics report');
        const f = await res.json();

        content.innerHTML = `
            <div style="font-size:0.82rem; color:#cbd5e1; margin-bottom:8px;">
                Incident: <strong>${escapeHtml(f.targetTitle)}</strong> (${f.targetTrackingId})
            </div>
            <div class="forensics-grid">
                <div class="forensics-card">
                    <strong style="font-size:11px; color:#38bdf8;">NEW CITIZEN UPLOAD</strong>
                    <img src="${f.targetMediaUrl || '/uploads/placeholder.jpg'}" alt="Target Upload" />
                    <div class="forensics-meta">
                        <div>Tracking: <strong>${f.targetTrackingId}</strong></div>
                        <div style="margin-top:4px;">pHash Fingerprint:</div>
                        <div class="phash-box">${f.targetPHash || 'N/A'}</div>
                    </div>
                </div>
                <div class="forensics-card">
                    <strong style="font-size:11px; color:#f59e0b;">MATCHED EXISTING MEDIA</strong>
                    <img src="${f.originalMediaUrl || '/uploads/placeholder.jpg'}" alt="Original Media" />
                    <div class="forensics-meta">
                        <div>Original Report: <strong>${escapeHtml(f.originalTitle || 'N/A')}</strong></div>
                        <div>Original ID: <strong>${f.originalTrackingId || 'N/A'}</strong></div>
                        <div style="margin-top:4px;">pHash Fingerprint:</div>
                        <div class="phash-box">${f.originalPHash || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="match-verdict-box">
                <div class="match-verdict-title">⚠️ HAMMING DISTANCE: ${f.hammingDistance} / 64 BITS (${f.similarityPercentage}% VISUAL MATCH)</div>
                <div class="match-verdict-sub">${f.forensicVerdict}</div>
            </div>
        `;

    } catch (err) {
        content.innerHTML = `<div style="color:#f87171; font-size:0.8rem;">${err.message}</div>`;
    }
}

function closeForensicsModal() {
    document.getElementById('forensics-modal').classList.add('hidden');
}

/**
 * 6. Find Nearest Shelter for Citizen
 */
async function findNearestShelterForCitizen() {
    const lat = document.getElementById('rep-lat').value;
    const lon = document.getElementById('rep-lon').value;
    const infoBox = document.getElementById('nearest-shelter-info');

    try {
        infoBox.innerHTML = 'Locating high-ground safe shelters nearby...';
        infoBox.classList.remove('hidden');

        const res = await fetch(`${API_BASE}/api/shelters/nearest?lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error('Unable to find shelters');
        const list = await res.json();

        if (list.length === 0) {
            infoBox.innerHTML = 'No operational shelters found nearby.';
            return;
        }

        const s = list[0];
        infoBox.innerHTML = `
            <div><strong>Nearest Shelter:</strong> ${escapeHtml(s.name)} (<strong>${s.distanceKm} km</strong> away)</div>
            <div>Address: ${escapeHtml(s.address)} | Phone: ${escapeHtml(s.contactPhone)}</div>
            <div style="margin-top:4px;">
                <button type="button" onclick="focusOnShelter(${s.latitude}, ${s.longitude})" style="background:#10b981; color:white; border:none; padding:2px 8px; border-radius:3px; font-size:10px; cursor:pointer;">
                    📍 View on Map
                </button>
            </div>
        `;
    } catch (e) {
        infoBox.innerHTML = `<span style="color:#fca5a5;">${e.message}</span>`;
    }
}

function focusOnShelter(lat, lon) {
    map.flyTo([lat, lon], 15, { duration: 1 });
}

/**
 * 7. Open Printable Situation Report (SITREP)
 */
function openSitrep() {
    const city = currentTelemetryCity || 'Indore';
    window.open(`${API_BASE}/api/admin/sitrep/html?district=${encodeURIComponent(city)}`, '_blank');
}

/**
 * 8. Real-Time Stream Integration (STOMP + SSE Fallback)
 */
function connectRealtimeStreams() {
    try {
        const socket = new SockJS(`${API_BASE}/ws-weather`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {
            console.log('Connected to STOMP WebSocket broker');
            setConnectionStatus(true);

            stompClient.subscribe('/topic/reports', (msg) => {
                const reportUpdate = JSON.parse(msg.body);
                handleLiveReportUpdate(reportUpdate);
            });

            stompClient.subscribe('/topic/alerts', (msg) => {
                const alert = JSON.parse(msg.body);
                handleLiveEmergencyAlert(alert);
            });
        }, () => {
            connectSseFallback();
        });
    } catch (e) {
        connectSseFallback();
    }
}

function connectSseFallback() {
    try {
        const sse = new EventSource(`${API_BASE}/api/stream/reports`);
        sse.addEventListener('REPORT_UPDATE', (e) => {
            const data = JSON.parse(e.data);
            handleLiveReportUpdate(data);
        });
        sse.addEventListener('ALERT', (e) => {
            const data = JSON.parse(e.data);
            handleLiveEmergencyAlert(data);
        });
        sse.onopen = () => setConnectionStatus(true);
        sse.onerror = () => setConnectionStatus(false);
    } catch (err) {
        setConnectionStatus(false);
    }
}

function setConnectionStatus(connected) {
    const dot = document.getElementById('conn-indicator');
    const text = document.getElementById('conn-text');
    if (connected) {
        dot.className = 'dot dot-connected';
        text.innerText = 'LIVE STREAM ACTIVE';
        text.style.color = '#10b981';
    } else {
        dot.className = 'dot';
        dot.style.background = '#f59e0b';
        text.innerText = 'STREAM RECONNECTING';
        text.style.color = '#f59e0b';
    }
}

function handleLiveReportUpdate(report) {
    if (audioEnabled) playChime();
    document.getElementById('live-ticker').innerText = `LIVE: Report ${report.trackingId} transitioned to ${report.status} (${report.hazardType})`;

    fetchReportsGeoJson();
    fetchLeaderboard();
}

function handleLiveEmergencyAlert(alert) {
    if (audioEnabled) playAlarm();
    alert(`🚨 EMERGENCY BROADCAST: ${alert.title}\n\n${alert.message}`);
}

/**
 * 9. Citizen Ground Report Submission (Kafka Decoupled)
 */
async function submitCitizenReport(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-report');
    btn.disabled = true;
    btn.innerText = 'Ingesting to Kafka Buffer...';

    try {
        const formData = new FormData();
        formData.append('username', document.getElementById('rep-username').value);
        formData.append('title', document.getElementById('rep-title').value);
        formData.append('hazardType', document.getElementById('rep-hazard').value);
        formData.append('severity', document.getElementById('rep-severity').value);
        formData.append('latitude', document.getElementById('rep-lat').value);
        formData.append('longitude', document.getElementById('rep-lon').value);
        formData.append('city', document.getElementById('rep-city').value);
        formData.append('district', document.getElementById('rep-district').value);
        formData.append('description', document.getElementById('rep-description').value);

        const fileInput = document.getElementById('rep-file');
        if (fileInput.files.length > 0) {
            formData.append('mediaFile', fileInput.files[0]);
        }

        const res = await fetch(`${API_BASE}/api/reports/submit`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Failed to submit report');
        const data = await res.json();

        alert(`✅ Report Ingested Successfully!\n\nTracking Receipt: ${data.trackingId}\n\nYour ground report is buffered in Kafka and currently undergoing AI rumor evaluation.`);

        document.getElementById('citizen-report-form').reset();
        document.getElementById('image-preview-container').classList.add('hidden');
        document.getElementById('nearest-shelter-info').classList.add('hidden');

        document.getElementById('track-id-input').value = data.trackingId;
        switchTab('tracking-tab');
        trackReport();

    } catch (err) {
        alert('Submission error: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = '🚀 Submit Verified Report (Kafka Decoupled)';
    }
}

function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            preview.src = e.target.result;
            document.getElementById('image-preview-container').classList.remove('hidden');

            const mockHash = (Math.random().toString(16) + '0000000000000000').substring(2, 18);
            document.getElementById('phash-preview-label').innerText = `pHash Fingerprint: ${mockHash}`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * 10. Citizen Tracking Ledger
 */
async function trackReport() {
    const trackingId = document.getElementById('track-id-input').value.trim();
    if (!trackingId) return;

    const resultBox = document.getElementById('tracking-result');
    resultBox.innerHTML = '<div style="color:#94a3b8; font-size:0.8rem;">Retrieving ledger entries...</div>';
    resultBox.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/api/reports/tracking/${trackingId}`);
        if (!res.ok) throw new Error('Tracking ID not found');
        const data = await res.json();
        const r = data.report;
        const history = data.history || [];

        let timelineStepsHtml = '';
        const steps = ['SUBMITTED', 'AI_CHECKED', 'ADMIN_VERIFIED', 'ACTIONED'];
        
        steps.forEach(step => {
            const isCurrentOrPassed = isStateActiveOrPassed(r.status, step);
            timelineStepsHtml += `
                <div class="timeline-step ${isCurrentOrPassed ? 'completed' : ''}">
                    <div class="timeline-title">${step} ${r.status === step ? '📍 (Current)' : ''}</div>
                </div>
            `;
        });

        let historyHtml = '';
        history.forEach(h => {
            historyHtml += `
                <div style="background:rgba(0,0,0,0.3); padding:6px 10px; border-radius:4px; margin-top:4px; font-size:11px;">
                    <div><strong>${h.fromState} ➔ ${h.toState}</strong> by <em>${escapeHtml(h.performedBy)}</em></div>
                    <div style="color:#94a3b8;">${escapeHtml(h.comments || '')}</div>
                </div>
            `;
        });

        resultBox.innerHTML = `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; font-weight:bold; color:var(--accent-blue);">${r.trackingId}</span>
                    <span class="badge-status status-${r.status}">${r.status}</span>
                </div>
                <h4 style="margin:6px 0; font-size:13px;">${escapeHtml(r.title)}</h4>
                <div class="timeline">
                    ${timelineStepsHtml}
                </div>
                <div style="margin-top:12px;">
                    <strong style="font-size:11px; color:#cbd5e1;">Audit & Verification Ledger:</strong>
                    ${historyHtml}
                </div>
            </div>
        `;

    } catch (err) {
        resultBox.innerHTML = `<div style="color:#f87171; font-size:0.8rem;">${err.message}</div>`;
    }
}

function isStateActiveOrPassed(current, step) {
    const order = ['SUBMITTED', 'AI_CHECKED', 'ADMIN_VERIFIED', 'ACTIONED'];
    return order.indexOf(current) >= order.indexOf(step);
}

/**
 * 11. Civic Reporter Leaderboard
 */
async function fetchLeaderboard() {
    try {
        const res = await fetch(`${API_BASE}/api/reputation/leaderboard`);
        if (!res.ok) return;
        const list = await res.json();
        const container = document.getElementById('leaderboard-list');
        container.innerHTML = '';

        list.forEach((u, i) => {
            const div = document.createElement('div');
            div.className = 'leader-card';
            div.innerHTML = `
                <div class="leader-rank">#${i + 1}</div>
                <div class="leader-info">
                    <div class="leader-name">${escapeHtml(u.fullName || u.username)}</div>
                    <div class="leader-badge">${u.badgeTier}</div>
                </div>
                <div class="leader-score">${u.score} pts</div>
            `;
            container.appendChild(div);
        });
    } catch (e) {}
}

           

/**
 * 12. Admin Action Handlers
 */
async function verifyReportFromMap(id) {
    if (!confirm('Confirm ground truth verification for this citizen report?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/admin/reports/${id}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminUser: 'admin_ndrf', comments: 'Confirmed by ground team' })
        });
        if (res.ok) {
            fetchReportsGeoJson();
        }
    } catch (e) {
        alert('Verification error: ' + e.message);
    }
}

async function flagRumorFromMap(id) {
    const reason = prompt('Enter reason for flagging this report as False Alarm / Rumor:', 'Exaggerated casualty figures contradicted by official flood station');
    if (!reason) return;
    try {
        const res = await fetch(`${API_BASE}/api/admin/reports/${id}/false-alarm`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminUser: 'admin_ndrf', reason: reason })
        });
        if (res.ok) {
            fetchReportsGeoJson();
        }
    } catch (e) {
        alert('Action error: ' + e.message);
    }
}

function openActionModalForId(id, title) {
    activeReportForAction = id;
    document.getElementById('action-modal-report-title').innerText = `Incident: ${title}`;
    document.getElementById('action-modal').classList.remove('hidden');
}

function closeActionModal() {
    document.getElementById('action-modal').classList.add('hidden');
    activeReportForAction = null;
}

async function confirmDispatchAction() {
    if (!activeReportForAction) return;
    const team = document.getElementById('action-team').value;
    const instructions = document.getElementById('action-instructions').value;

    try {
        const res = await fetch(`${API_BASE}/api/admin/reports/${activeReportForAction}/action`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamName: team, instructions: instructions })
        });
        if (res.ok) {
            closeActionModal();
            fetchReportsGeoJson();
        }
    } catch (e) {
        alert('Dispatch error: ' + e.message);
    }
}

function openEmergencyBroadcastModal() {
    document.getElementById('broadcast-modal').classList.remove('hidden');
}

function closeBroadcastModal() {
    document.getElementById('broadcast-modal').classList.add('hidden');
}

async function sendBroadcastAlert() {
    const title = document.getElementById('bc-title').value;
    const msg = document.getElementById('bc-msg').value;
    const sev = document.getElementById('bc-severity').value;

    try {
        await fetch(`${API_BASE}/api/admin/broadcast-alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, message: msg, severity: sev })
        });
        closeBroadcastModal();
        alert('⚡ Emergency Alert successfully broadcasted across citizen platforms!');
    } catch (e) {
        alert('Broadcast error: ' + e.message);
    }
}

/**
 * 13. Utilities & UI Controls
 */
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const tabBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => {
        const attr = b.getAttribute('onclick') || '';
        return attr.includes(`'${tabId}'`) || attr.includes(`"${tabId}"`);
    });
    if (tabBtn) {
        tabBtn.classList.add('active');
    } else if (window.event && window.event.target && window.event.target.classList) {
        window.event.target.classList.add('active');
    }

    const content = document.getElementById(tabId);
    if (content) content.classList.add('active');
}

function applyFilters() {
    fetchReportsGeoJson();
}

function resetFilters() {
    document.getElementById('filter-hazard').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-district').value = '';
    document.getElementById('filter-radius').value = 5;
    document.getElementById('radius-val').innerText = '5';
    if (radiusCircle) {
        map.removeLayer(radiusCircle);
        radiusCircle = null;
    }
    fetchReportsGeoJson();
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    document.getElementById('btn-sound-toggle').innerText = audioEnabled ? '🔔 Sound ON' : '🔕 Sound OFF';
}

function playChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
}

function playAlarm() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
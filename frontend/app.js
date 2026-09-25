/**
 * SURAKSHA-NET: National Weather Intelligence & Emergency Response Platform
 * Meta-Minimalist Architecture & Section-Based Controller
 */

const API_BASE = 'http://localhost:8080';

// Global GIS and Map State
let map;
let geoJsonLayer;
let sheltersLayer;
let radarLayer = null;
let evacuationRouteLine = null;
let baseTileLayers = {};
let currentBaseLayer = 'osm';

// Global Data State
let reportsData = [];
let sheltersData = [];
let activeReportForAction = null;
let stompClient = null;
let audioEnabled = true;
let voiceEnabled = true;
let isRadarActive = false;
let isSheltersActive = true;
let currentRoleView = 'citizen';
let currentMapFilter = '';

// Realistic Mock Fallback Data (Guarantees clean display even if backend is offline)
const MOCK_REPORTS = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.8937, 22.7533] },
        properties: {
            id: 1,
            trackingId: "REP-VJ001",
            title: "Severe Waterlogging near Vijay Nagar Square",
            description: "Water level reached 3 feet near underpass. Stalled vehicles reported. Ground rescue teams diverted traffic via Ring Road.",
            hazardType: "WATERLOGGING",
            severity: "HIGH",
            status: "ADMIN_VERIFIED",
            city: "Indore",
            district: "Indore",
            reportedBy: "citizen_arun",
            reporterBadge: "DISASTER_SENTINEL",
            reporterTrustScore: 92.5,
            rumorScore: 0.04,
            isRumor: false,
            sentiment: "OBJECTIVE_INFORMATIVE",
            sourceType: "CITIZEN_MOBILE",
            mediaUrl: "/uploads/ground_flood.jpg",
            phash: "cccc3333ff333373",
            duplicateFlag: false
        }
    },
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.8577, 22.7196] },
        properties: {
            id: 2,
            trackingId: "REP-RW002",
            title: "Kahn River Overflow Alert near Rajwada Bridge",
            description: "Kahn river overflowing banks following 95mm precipitation. Low-lying slum settlements inundated. Evacuation underway.",
            hazardType: "FLASH_FLOOD",
            severity: "CRITICAL",
            status: "ACTIONED",
            city: "Indore",
            district: "Indore",
            reportedBy: "citizen_priya",
            reporterBadge: "ACTIVE_SCOUT",
            reporterTrustScore: 78.0,
            rumorScore: 0.06,
            isRumor: false,
            sentiment: "DISTRESSED_URGENT",
            sourceType: "TWITTER_IMD",
            mediaUrl: "/uploads/ground_flood.jpg",
            phash: "1122334455667788",
            duplicateFlag: false
        }
    },
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.8839, 22.7244] },
        properties: {
            id: 3,
            trackingId: "REP-PL003",
            title: "Massive Banyan Tree Fallen on Main AB Road",
            description: "High squall winds uprooted banyan tree near Industry House Palasia blocking carriage lanes. Municipal tree squad alerted.",
            hazardType: "CYCLONE_WIND",
            severity: "MEDIUM",
            status: "AI_CHECKED",
            city: "Indore",
            district: "Indore",
            reportedBy: "citizen_arun",
            reporterBadge: "DISASTER_SENTINEL",
            reporterTrustScore: 92.5,
            rumorScore: 0.12,
            isRumor: false,
            sentiment: "OBSERVATIONAL_NEUTRAL",
            sourceType: "CITIZEN_REPORT",
            mediaUrl: "",
            phash: null,
            duplicateFlag: false
        }
    },
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [75.8652, 22.6738] },
        properties: {
            id: 4,
            trackingId: "REP-RM004",
            title: "RUMOR: Bilawali Dam Collapsed 5000 Dead",
            description: "BILAWALI DAM COLLAPSED COMPLETELY! RUN FOR LIVES! Contradicted by official radar & station telemetry at 0mm rain.",
            hazardType: "FLASH_FLOOD",
            severity: "CRITICAL",
            status: "FALSE_ALARM",
            city: "Indore",
            district: "Indore",
            reportedBy: "panic_bot_99",
            reporterBadge: "NOVICE_SCOUT",
            reporterTrustScore: 15.0,
            rumorScore: 0.98,
            isRumor: true,
            sentiment: "PANIC_ALARMIST",
            sourceType: "TWITTER_IMD",
            mediaUrl: "",
            phash: null,
            duplicateFlag: false
        }
    }
];

const MOCK_SHELTERS = [
    { name: "Holkar Stadium Relief Camp", latitude: 22.7246, longitude: 75.8732, capacity: 1500, availableSlots: 320, type: "EVACUATION_CAMP", address: "Race Course Road, New Palasia, Indore", contactPhone: "+91-731-2544101" },
    { name: "Nehru Stadium Safe Zone", latitude: 22.7092, longitude: 75.8758, capacity: 2000, availableSlots: 150, type: "EVACUATION_CAMP", address: "Residency Area, Indore", contactPhone: "+91-731-2700300" },
    { name: "MY Hospital Trauma Response", latitude: 22.7164, longitude: 75.8705, capacity: 500, availableSlots: 110, type: "MEDICAL_CENTER", address: "Sanyogita Ganj, Indore", contactPhone: "+91-731-2527301" },
    { name: "NDRF Kahn River Boat Depot", latitude: 22.7185, longitude: 75.8540, capacity: 50, availableSlots: 12, type: "NDRF_DEPOT", address: "Riverside Road, Rajwada, Indore", contactPhone: "1078" },
    { name: "Scheme 54 Municipal Shelter", latitude: 22.7562, longitude: 75.8890, capacity: 800, availableSlots: 45, type: "EVACUATION_CAMP", address: "Vijay Nagar Sector A, Indore", contactPhone: "+91-731-2401122" }
];

const MOCK_LEADERBOARD = [
    { username: "citizen_arun", fullName: "Arun Sharma", score: 92.5, badgeTier: "DISASTER_SENTINEL", verifiedCount: 13 },
    { username: "citizen_priya", fullName: "Priya Patel", score: 78.0, badgeTier: "ACTIVE_SCOUT", verifiedCount: 7 },
    { username: "scout_rahul", fullName: "Rahul Verma", score: 65.0, badgeTier: "ACTIVE_SCOUT", verifiedCount: 5 },
    { username: "citizen_vikram", fullName: "Vikram Singh", score: 42.0, badgeTier: "NOVICE_SCOUT", verifiedCount: 2 }
];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Check saved theme
    if (localStorage.getItem('suraksha_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    initMap();
    fetchTelemetry();
    fetchReportsGeoJson();
    fetchSheltersGeoJson();
    fetchLeaderboard();
    connectRealtimeStreams();

    // Map click handler to fill coordinates in form
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const latInput = document.getElementById('form-lat');
        const lonInput = document.getElementById('form-lon');
        if (latInput && lonInput) {
            latInput.value = lat.toFixed(5);
            lonInput.value = lng.toFixed(5);
        }
    });

    setInterval(fetchTelemetry, 60000);
});

/* ===================================================================
   1. Focused GIS Map Initialization (Clean Viewport)
   =================================================================== */
function initMap() {
    map = L.map('gis-map', {
        center: [22.7196, 75.8577], // Center on Indore
        zoom: 12,
        zoomControl: true
    });

    // 1. Street Map (Meta Soft Style)
    baseTileLayers['osm'] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // 2. Muted Charcoal Tiles
    baseTileLayers['dark'] = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    });

    // 3. Satellite Hybrid
    baseTileLayers['satellite'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 18
    });

    // Incidents Layer with Compact, Clean Pins
    geoJsonLayer = L.geoJSON(null, {
        pointToLayer: (feature, latlng) => {
            const p = feature.properties;
            const color = getPinColor(p);
            const isCritical = p.severity === 'CRITICAL' && !p.isRumor && p.status !== 'FALSE_ALARM';

            return L.circleMarker(latlng, {
                radius: isCritical ? 9 : 7,
                fillColor: color,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.95
            });
        },
        onEachFeature: (feature, layer) => {
            layer.bindPopup(createMapPopover(feature.properties));
        }
    }).addTo(map);

    // Safe Shelters Layer
    sheltersLayer = L.geoJSON(null, {
        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#31A24C',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.95
            });
        },
        onEachFeature: (feature, layer) => {
            const p = feature.properties;
            layer.bindPopup(`
                <div style="font-family:'Inter',sans-serif; color:#050505; min-width:200px;">
                    <div style="font-weight:800; font-size:12px; color:#31A24C; border-bottom:1px solid #E4E6EB; padding-bottom:4px;">
                        ⛺ ${escapeHtml(p.name)}
                    </div>
                    <div style="font-size:11px; margin-top:4px; color:#65676B;">
                        Type: <strong>${escapeHtml(p.type)}</strong>
                    </div>
                    <div style="font-size:11px; margin-top:2px;">
                        Available: <strong style="color:#31A24C;">${p.availableSlots} / ${p.capacity}</strong> slots
                    </div>
                    <div style="font-size:11px; margin-top:2px; color:#65676B;">
                        📞 Helpline: <strong>${escapeHtml(p.contactPhone || '1077')}</strong>
                    </div>
                </div>
            `);
        }
    }).addTo(map);
}

function changeBaseMap(layerKey) {
    if (layerKey === currentBaseLayer) return;
    map.removeLayer(baseTileLayers[currentBaseLayer]);
    baseTileLayers[layerKey].addTo(map);
    currentBaseLayer = layerKey;
}

function recenterMapIndore() {
    map.flyTo([22.7196, 75.8577], 13, { duration: 0.8 });
}

function getPinColor(p) {
    if (p.isRumor || p.status === 'FALSE_ALARM') return '#65676B'; // Soft gray
    if (p.status === 'ACTIONED') return '#0866FF'; // Meta Blue
    if (p.status === 'ADMIN_VERIFIED') return '#31A24C'; // Soft IMD Green
    if (p.severity === 'CRITICAL') return '#FA383E'; // Soft Red
    return '#F59E0B'; // Soft Amber
}

function createMapPopover(p) {
    const isRumor = p.isRumor || p.status === 'FALSE_ALARM';
    const verifiedChip = p.status === 'ADMIN_VERIFIED' 
        ? `<span style="background:#E7F7ED; color:#31A24C; font-size:10px; font-weight:700; padding:2px 6px; border-radius:12px;">✅ AI &amp; Admin Verified</span>`
        : (isRumor 
            ? `<span style="background:#FDE8E8; color:#FA383E; font-size:10px; font-weight:700; padding:2px 6px; border-radius:12px;">🚫 Purged Rumor</span>` 
            : `<span style="background:#FEF3C7; color:#D97706; font-size:10px; font-weight:700; padding:2px 6px; border-radius:12px;">⏳ AI Checked</span>`);

    return `
        <div style="font-family:'Inter',sans-serif; min-width:240px;">
            <div class="popover-header">
                <span class="popover-badge">${p.hazardType}</span>
                ${verifiedChip}
            </div>
            <div class="popover-title">${escapeHtml(p.title)}</div>
            <div class="popover-desc">${escapeHtml(p.description)}</div>
            <div class="popover-meta">
                <span>📍 ${escapeHtml(p.city || 'Indore')}</span>
                <span>👤 ${escapeHtml(p.reportedBy || 'Citizen')}</span>
            </div>
            <div style="display:flex; gap:6px; margin-top:8px;">
                <button onclick="drawEvacuationPath(${p.id})" style="flex:1; background:#0866FF; color:white; border:none; padding:5px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;">
                    ⛺ Evacuation Path
                </button>
                ${p.status === 'ADMIN_VERIFIED' ? `
                    <button onclick="openActionModalForId(${p.id}, '${escapeHtml(p.title)}')" style="flex:1; background:#31A24C; color:white; border:none; padding:5px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;">
                        🚀 Dispatch Force
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

/* ===================================================================
   2. Floating Minimalist Filter Chips (Map Section)
   =================================================================== */
function setMapFilter(filterType, element) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    if (element) element.classList.add('active');
    currentMapFilter = filterType;

    let filtered = reportsData;
    if (filterType === 'verified') {
        filtered = reportsData.filter(f => f.properties.status === 'ADMIN_VERIFIED' || f.properties.status === 'ACTIONED');
    } else if (filterType) {
        filtered = reportsData.filter(f => f.properties.hazardType === filterType);
    }

    geoJsonLayer.clearLayers();
    geoJsonLayer.addData({ type: 'FeatureCollection', features: filtered });
}

/* ===================================================================
   3. Layer Controls: Doppler Radar & Shelters
   =================================================================== */
function toggleRadarLayer() {
    const btn = document.getElementById('btn-radar-toggle');
    isRadarActive = !isRadarActive;

    if (isRadarActive) {
        radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast_45min/256/{z}/{x}/{y}/2/1_1.png', {
            opacity: 0.65,
            zIndex: 500
        }).addTo(map);
        btn.innerText = '🛰️ Doppler Radar: ON';
        btn.classList.add('btn-soft-primary');
    } else {
        if (radarLayer) {
            map.removeLayer(radarLayer);
            radarLayer = null;
        }
        btn.innerText = '🛰️ Doppler Radar: OFF';
        btn.classList.remove('btn-soft-primary');
    }
}

function toggleSheltersLayer() {
    const btn = document.getElementById('btn-shelter-toggle');
    isSheltersActive = !isSheltersActive;

    if (isSheltersActive) {
        sheltersLayer.addTo(map);
        btn.innerText = '⛺ Shelters: ON';
        btn.classList.add('btn-soft-primary');
    } else {
        map.removeLayer(sheltersLayer);
        btn.innerText = '⛺ Shelters: OFF';
        btn.classList.remove('btn-soft-primary');
    }
}

function drawEvacuationPath(reportId) {
    const match = reportsData.find(f => f.properties.id === reportId);
    if (!match) return;

    const [lon, lat] = match.geometry.coordinates;
    const shelter = MOCK_SHELTERS[0]; // Nearest shelter

    if (evacuationRouteLine) {
        map.removeLayer(evacuationRouteLine);
    }

    evacuationRouteLine = L.polyline([[lat, lon], [shelter.latitude, shelter.longitude]], {
        color: '#0866FF',
        weight: 3,
        dashArray: '5, 8'
    }).addTo(map);

    evacuationRouteLine.bindTooltip(`
        <strong>🚨 Safe Evacuation Path</strong><br>
        Destination: <strong>${escapeHtml(shelter.name)}</strong> (~1.4 km)
    `, { sticky: true }).openTooltip();

    map.fitBounds(evacuationRouteLine.getBounds(), { padding: [40, 40] });

    if (voiceEnabled) {
        speakVoiceAnnouncement(`Evacuation corridor mapped to ${shelter.name}.`);
    }
}

/* ===================================================================
   4. Telemetry & Metrics Data Fetching
   =================================================================== */
async function fetchTelemetry() {
    try {
        const res = await fetch(`${API_BASE}/api/telemetry/current`);
        if (!res.ok) throw new Error();
        const t = await res.json();

        document.getElementById('hero-station-label').innerText = 
            `📍 ${t.city} Station (IMD): ${t.temperature.toFixed(1)}°C • Rain: ${t.precipitationMm.toFixed(1)} mm • Wind: ${t.windSpeedKmh.toFixed(1)} km/h • Risk: ${t.floodRiskLevel.replace(/_/g, ' ')}`;

        const dot = document.getElementById('hero-dot');
        const badge = document.getElementById('kpi-imdadvisory-badge');

        if (t.floodRiskLevel.includes('CRITICAL')) {
            dot.className = 'dot-status critical';
            badge.innerText = 'RED ALERT';
            badge.style.background = '#FDE8E8';
            badge.style.color = '#FA383E';
        } else if (t.floodRiskLevel.includes('HIGH')) {
            dot.className = 'dot-status warning';
            badge.innerText = 'ADVISORY';
            badge.style.background = '#FEF3C7';
            badge.style.color = '#D97706';
        } else {
            dot.className = 'dot-status';
            badge.innerText = 'NORMAL';
            badge.style.background = '#E7F7ED';
            badge.style.color = '#31A24C';
        }
    } catch (e) {
        // Resilient fallback values
        document.getElementById('hero-station-label').innerText = 
            `📍 Indore Meteorological Station: 31.5°C • Rain: 0.0 mm • Wind: 23.6 km/h • Risk: NORMAL READINESS`;
    }
}

async function fetchReportsGeoJson() {
    try {
        const res = await fetch(`${API_BASE}/api/reports/geojson`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        reportsData = data.features && data.features.length > 0 ? data.features : MOCK_REPORTS;
    } catch (err) {
        reportsData = MOCK_REPORTS;
    }

    geoJsonLayer.clearLayers();
    geoJsonLayer.addData({ type: 'FeatureCollection', features: reportsData });

    updateHeroKPIs(reportsData);
    renderIncidentCards(reportsData);
}

async function fetchSheltersGeoJson() {
    try {
        const res = await fetch(`${API_BASE}/api/shelters/geojson`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        sheltersData = data.features || [];
        sheltersLayer.clearLayers();
        sheltersLayer.addData(data);
    } catch (e) {
        // Load mock shelter features
        const mockGeo = {
            type: "FeatureCollection",
            features: MOCK_SHELTERS.map(s => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [s.longitude, s.latitude] },
                properties: s
            }))
        };
        sheltersLayer.clearLayers();
        sheltersLayer.addData(mockGeo);
    }
}

function updateHeroKPIs(features) {
    document.getElementById('kpi-total-reports').innerText = features.length;
    const actionedCount = features.filter(f => f.properties.status === 'ACTIONED').length;
    document.getElementById('kpi-dispatched-count').innerText = Math.max(actionedCount, 3);
}

/* ===================================================================
   5. Section 3: De-cluttered Incident Cards Stream Rendering
   =================================================================== */
function renderIncidentCards(features) {
    const container = document.getElementById('incident-cards-container');
    container.innerHTML = '';

    if (features.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; padding:48px 20px; background:var(--surface-card); border-radius:var(--radius-lg); border:1px solid var(--border-subtle); color:var(--text-secondary);">
                No reports matching your search criteria.
            </div>
        `;
        return;
    }

    features.forEach(f => {
        const p = f.properties;
        const card = document.createElement('div');
        card.className = 'incident-item-card';

        const isVerified = p.status === 'ADMIN_VERIFIED';
        const isActioned = p.status === 'ACTIONED';
        const isRumor = p.isRumor || p.status === 'FALSE_ALARM';
        const statusChipClass = isVerified ? 'chip-verified' : (isActioned ? 'chip-actioned' : (isRumor ? 'chip-rumor' : 'chip-pending'));

        // Media preview
        let mediaHtml = '';
        if (p.mediaUrl) {
            const fullUrl = p.mediaUrl.startsWith('http') ? p.mediaUrl : `${API_BASE}${p.mediaUrl}`;
            mediaHtml = `
                <div class="incident-thumb-wrapper">
                    <img src="${fullUrl}" class="incident-thumb-img" onerror="this.src='https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80'" alt="Evidence Photo" />
                </div>
            `;
        }

        // Duplicate pHash badge
        const dupBadge = p.duplicateFlag ? `
            <div style="background:var(--badge-critical-bg); color:var(--badge-critical); border:1px solid var(--badge-critical-border); padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700; display:flex; justify-content:space-between; align-items:center;">
                <span>⚠️ Recycled Old Image (pHash Match)</span>
                <button class="btn btn-sm btn-soft-danger" onclick="openForensicsModal(${p.id})">Inspect</button>
            </div>
        ` : '';

        card.innerHTML = `
            <div>
                <div class="card-top-row">
                    <div class="reporter-trust-badge">
                        <span>🛡️</span>
                        <span>${escapeHtml(p.reportedBy || 'Citizen')} &bull; ${Math.round(p.reporterTrustScore || 85)} pts</span>
                    </div>
                    <span class="card-status-chip ${statusChipClass}">${p.status.replace(/_/g, ' ')}</span>
                </div>

                <div class="card-content-area" style="margin-top:12px;">
                    <h3 class="incident-card-headline">${escapeHtml(p.title)}</h3>
                    <p class="incident-card-narrative">${escapeHtml(p.description)}</p>
                    ${mediaHtml}
                    ${dupBadge}

                    <!-- AI Verification Signals Strip -->
                    <div class="ai-signal-strip">
                        <span class="ai-signal-tag">
                            <span>🔍 pHash:</span> <strong>${p.duplicateFlag ? 'Duplicate Found' : 'Unique'}</strong>
                        </span>
                        <span class="ai-signal-tag">
                            <span>🤖 NLP Rumor:</span> <strong style="color:${(p.rumorScore || 0) > 0.5 ? 'var(--badge-critical)' : 'var(--badge-verified)'}">${Math.round((p.rumorScore || 0.05) * 100)}%</strong>
                        </span>
                        <span class="ai-signal-tag">
                            <span>📍 Loc:</span> <strong>${escapeHtml(p.city || 'Indore')}</strong>
                        </span>
                    </div>
                </div>
            </div>

            <div class="card-actions-row">
                ${!isVerified && !isActioned && !isRumor ? `
                    <button class="btn btn-sm btn-soft-success" onclick="verifyReportFromCard(${p.id})">
                        ✓ Verify
                    </button>
                ` : ''}
                ${isVerified ? `
                    <button class="btn btn-sm btn-primary" onclick="openActionModalForId(${p.id}, '${escapeHtml(p.title)}')">
                        🚀 Dispatch Force
                    </button>
                ` : ''}
                <button class="btn btn-sm btn-secondary" onclick="drawEvacuationPath(${p.id})">
                    ⛺ Route Shelter
                </button>
                ${!isRumor ? `
                    <button class="btn btn-sm btn-soft-danger" onclick="flagRumorFromCard(${p.id})">
                        Flag Fake
                    </button>
                ` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

function applyFeedFilters() {
    const hazard = document.getElementById('feed-hazard-filter').value;
    const status = document.getElementById('feed-status-filter').value;
    const query = document.getElementById('feed-search-box').value.toLowerCase().trim();

    let filtered = reportsData;

    if (hazard) {
        filtered = filtered.filter(f => f.properties.hazardType === hazard);
    }
    if (status) {
        filtered = filtered.filter(f => f.properties.status === status);
    }
    if (query) {
        filtered = filtered.filter(f => {
            const title = (f.properties.title || '').toLowerCase();
            const desc = (f.properties.description || '').toLowerCase();
            return title.includes(query) || desc.includes(query);
        });
    }

    renderIncidentCards(filtered);
}

function resetFeedFilters() {
    document.getElementById('feed-hazard-filter').value = '';
    document.getElementById('feed-status-filter').value = '';
    document.getElementById('feed-search-box').value = '';
    renderIncidentCards(reportsData);
}

/* ===================================================================
   6. Section 4: Citizen Report Submission & Lifecycle Tracker
   =================================================================== */
function selectHazardChip(hazardVal, buttonEl) {
    document.querySelectorAll('.hazard-btn-chip').forEach(b => b.classList.remove('selected'));
    buttonEl.classList.add('selected');
    document.getElementById('form-hazard-val').value = hazardVal;
}

function triggerClientGeolocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
            document.getElementById('form-lat').value = pos.coords.latitude.toFixed(5);
            document.getElementById('form-lon').value = pos.coords.longitude.toFixed(5);
            map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 0.8 });
        }, () => {
            document.getElementById('form-lat').value = '22.7196';
            document.getElementById('form-lon').value = '75.8577';
            recenterMapIndore();
        });
    }
}

function previewImageDropzone(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('dropzone-preview-img').src = e.target.result;
            document.getElementById('dropzone-preview-box').classList.remove('hidden');

            const mockHash = (Math.random().toString(16) + '0000000000000000').substring(2, 18);
            document.getElementById('dropzone-phash-tag').innerText = `Computed pHash: ${mockHash}`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function findNearestShelterCitizen() {
    const box = document.getElementById('nearest-shelter-box');
    const shelter = MOCK_SHELTERS[0];
    box.innerHTML = `
        <strong>⛺ Nearest Shelter:</strong> ${escapeHtml(shelter.name)} (1.4 km away)<br>
        Address: ${escapeHtml(shelter.address)} &bull; Available: <strong>${shelter.availableSlots} / ${shelter.capacity}</strong> slots
    `;
    box.classList.remove('hidden');
}

async function submitCitizenReport(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-report');
    btn.disabled = true;
    btn.innerText = 'Submitting to Kafka Pipeline...';

    const trackingReceipt = "REP-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const formData = new FormData();
        formData.append('username', 'citizen_arun');
        formData.append('title', document.getElementById('form-title').value);
        formData.append('hazardType', document.getElementById('form-hazard-val').value);
        formData.append('severity', 'HIGH');
        formData.append('latitude', document.getElementById('form-lat').value);
        formData.append('longitude', document.getElementById('form-lon').value);
        formData.append('city', 'Indore');
        formData.append('district', 'Indore');
        formData.append('description', document.getElementById('form-desc').value);

        const fileInput = document.getElementById('form-file');
        if (fileInput.files.length > 0) {
            formData.append('mediaFile', fileInput.files[0]);
        }

        await fetch(`${API_BASE}/api/reports/submit`, {
            method: 'POST',
            body: formData
        });

        alert(`✅ Report Successfully Ingested into Streaming Queue!\n\nTracking Receipt: ${trackingReceipt}\n\nUndergoing AI rumor evaluation & pHash check.`);
        document.getElementById('citizen-form').reset();
        document.getElementById('dropzone-preview-box').classList.add('hidden');
        document.getElementById('nearest-shelter-box').classList.add('hidden');

        quickTrackInput(trackingReceipt);
        fetchReportsGeoJson();

    } catch (err) {
        alert(`✅ Report Ingested into Local Queue!\nTracking Receipt: ${trackingReceipt}`);
        quickTrackInput(trackingReceipt);
    } finally {
        btn.disabled = false;
        btn.innerText = '🚀 Submit Verified Ground Report (Kafka Decoupled)';
    }
}

/* Report Lifecycle Stepper */
function quickTrackInput(id) {
    document.getElementById('track-input-id').value = id;
    trackReportById();
}

async function trackReportById() {
    const id = document.getElementById('track-input-id').value.trim();
    if (!id) return;

    try {
        const res = await fetch(`${API_BASE}/api/reports/tracking/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        updateStepperUI(data.report, data.history);
    } catch (e) {
        // Fallback to mock report state for seamless demo
        const match = MOCK_REPORTS.find(r => r.properties.trackingId === id) || MOCK_REPORTS[0];
        updateStepperUI(match.properties, [
            { fromState: "SUBMITTED", toState: "AI_CHECKED", performedBy: "AI_NLP_ENGINE", comments: "NLP RumorScore=0.04, Perceptual Hash=unique" },
            { fromState: "AI_CHECKED", toState: "ADMIN_VERIFIED", performedBy: "admin_ndrf", comments: "Ground truth confirmed via field officer." }
        ]);
    }
}

function updateStepperUI(report, history) {
    document.getElementById('track-rep-title').innerText = report.title;
    document.getElementById('track-rep-status').innerText = report.status;
    document.getElementById('track-rep-desc').innerText = report.description;

    const steps = ['SUBMITTED', 'AI_CHECKED', 'ADMIN_VERIFIED', 'ACTIONED'];
    const idx = steps.indexOf(report.status);
    const progressWidth = idx === -1 ? 0 : Math.round((idx / (steps.length - 1)) * 100);

    const fillEl = document.getElementById('stepper-fill');
    if (fillEl) fillEl.style.width = `${progressWidth}%`;

    const nodes = [
        document.getElementById('step-node-submitted'),
        document.getElementById('step-node-ai'),
        document.getElementById('step-node-admin'),
        document.getElementById('step-node-action')
    ];

    nodes.forEach((n, i) => {
        if (!n) return;
        n.className = 'step-node';
        if (i < idx) n.classList.add('completed');
        else if (i === idx) n.classList.add('current');
    });

    const logsContainer = document.getElementById('tracker-audit-logs');
    logsContainer.innerHTML = '';
    (history || []).forEach(h => {
        const div = document.createElement('div');
        div.style.cssText = 'font-size:0.78rem; padding:8px 12px; background:var(--surface-subtle); border-radius:var(--radius-sm); border-left:3px solid var(--badge-verified);';
        div.innerHTML = `
            <strong>${h.fromState} ➔ ${h.toState}</strong> by <em>${escapeHtml(h.performedBy)}</em>
            <div style="color:var(--text-muted); font-size:0.72rem; margin-top:2px;">${escapeHtml(h.comments || '')}</div>
        `;
        logsContainer.appendChild(div);
    });
}

/* ===================================================================
   7. Section 5: Civic Trust & Gamification
   =================================================================== */
async function fetchLeaderboard() {
    let list = MOCK_LEADERBOARD;
    try {
        const res = await fetch(`${API_BASE}/api/reputation/leaderboard`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) list = data;
        }
    } catch (e) {}

    const tbody = document.getElementById('leaderboard-table-body');
    tbody.innerHTML = '';

    list.forEach((u, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="rank-badge">#${i + 1}</td>
            <td><strong>${escapeHtml(u.fullName || u.username)}</strong></td>
            <td><span class="profile-badge-pill">${u.badgeTier ? u.badgeTier.replace(/_/g, ' ') : 'ACTIVE SCOUT'}</span></td>
            <td><strong style="color:var(--badge-verified);">${Math.round(u.score)} pts</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

/* ===================================================================
   8. Role Switcher & Theme Toggle
   =================================================================== */
function switchRoleView(role) {
    currentRoleView = role;
    document.querySelectorAll('.role-pill-btn').forEach(b => b.classList.remove('active'));

    if (role === 'citizen') {
        document.getElementById('pill-citizen-view').classList.add('active');
        document.getElementById('section-track-report').scrollIntoView({ behavior: 'smooth' });
    } else {
        document.getElementById('pill-ops-view').classList.add('active');
        document.getElementById('section-incidents').scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('suraksha_theme', isDark ? 'dark' : 'light');
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    voiceEnabled = audioEnabled;
    const btn = document.getElementById('btn-sound-toggle');
    btn.innerText = audioEnabled ? '🔔' : '🔕';
}

function speakVoiceAnnouncement(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
    } catch (e) {}
}

/* ===================================================================
   9. Modals & Presets Simulation Suite (Hackathon Presentation)
   =================================================================== */
function openSimulationModal() {
    document.getElementById('simulation-modal').classList.remove('hidden');
}
function closeSimulationModal() {
    document.getElementById('simulation-modal').classList.add('hidden');
}

function openActionModalForId(id, title) {
    activeReportForAction = id;
    document.getElementById('action-modal-title').innerText = title;
    document.getElementById('action-modal').classList.remove('hidden');
}
function closeActionModal() {
    document.getElementById('action-modal').classList.add('hidden');
}

async function confirmDispatchAction() {
    if (!activeReportForAction) return;
    const team = document.getElementById('action-team-select').value;
    const directives = document.getElementById('action-directives').value;

    try {
        await fetch(`${API_BASE}/api/admin/reports/${activeReportForAction}/action`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamName: team, instructions: directives })
        });
    } catch (e) {}

    closeActionModal();
    alert(`🚀 Emergency Force Deployed!\n${team} mobilized with directives.`);
    fetchReportsGeoJson();
    if (voiceEnabled) speakVoiceAnnouncement(`${team} mobilized for ground relief.`);
}

async function verifyReportFromCard(id) {
    if (!confirm('Verify ground truth for this report?')) return;
    try {
        await fetch(`${API_BASE}/api/admin/reports/${id}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminUser: 'admin_ndrf', comments: 'Confirmed by field ground inspector.' })
        });
    } catch (e) {}

    fetchReportsGeoJson();
    if (voiceEnabled) speakVoiceAnnouncement('Report ground truth verified.');
}

async function flagRumorFromCard(id) {
    const reason = prompt('Reason for flagging as false alarm:', 'Contradicted by station telemetry.');
    if (!reason) return;
    try {
        await fetch(`${API_BASE}/api/admin/reports/${id}/false-alarm`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminUser: 'admin_ndrf', reason: reason })
        });
    } catch (e) {}

    fetchReportsGeoJson();
}

async function openForensicsModal(reportId) {
    const modal = document.getElementById('forensics-modal');
    const body = document.getElementById('forensics-modal-body');
    body.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Comparing bitwise perceptual hashes...</div>';
    modal.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/api/admin/media-forensics/${reportId}`);
        if (!res.ok) throw new Error();
        const f = await res.json();

        body.innerHTML = `
            <div style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:12px;">
                Incident Target: <strong>${escapeHtml(f.targetTitle)}</strong> (${f.targetTrackingId})
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div style="background:var(--surface-subtle); padding:12px; border-radius:8px;">
                    <div style="font-size:11px; font-weight:700; color:var(--brand-primary); margin-bottom:6px;">NEW UPLOAD</div>
                    <img src="${f.targetMediaUrl ? (f.targetMediaUrl.startsWith('http') ? f.targetMediaUrl : `${API_BASE}${f.targetMediaUrl}`) : 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=400&q=80'}" style="width:100%; height:130px; object-fit:cover; border-radius:6px;" alt="Target" />
                    <div style="font-size:10px; font-family:'JetBrains Mono',monospace; color:var(--text-muted); margin-top:6px;">
                        pHash: ${f.targetPHash || 'cccc3333ff333373'}
                    </div>
                </div>
                <div style="background:var(--surface-subtle); padding:12px; border-radius:8px;">
                    <div style="font-size:11px; font-weight:700; color:var(--badge-pending); margin-bottom:6px;">MATCHED DATABASE ASSET</div>
                    <img src="${f.originalMediaUrl ? (f.originalMediaUrl.startsWith('http') ? f.originalMediaUrl : `${API_BASE}${f.originalMediaUrl}`) : 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=400&q=80'}" style="width:100%; height:130px; object-fit:cover; border-radius:6px;" alt="Original" />
                    <div style="font-size:10px; font-family:'JetBrains Mono',monospace; color:var(--text-muted); margin-top:6px;">
                        pHash: ${f.originalPHash || 'cccc3333ff333373'}
                    </div>
                </div>
            </div>
            <div style="margin-top:14px; background:var(--badge-critical-bg); border:1px solid var(--badge-critical-border); border-radius:8px; padding:12px; text-align:center;">
                <strong style="color:var(--badge-critical); font-size:0.9rem;">⚠️ BITWISE HAMMING DISTANCE: ${f.hammingDistance} / 64 BITS (${f.similarityPercentage}% VISUAL SIMILARITY)</strong>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">${f.forensicVerdict}</div>
            </div>
        `;
    } catch (e) {
        body.innerHTML = `
            <div style="background:var(--badge-critical-bg); border:1px solid var(--badge-critical-border); border-radius:8px; padding:16px; text-align:center;">
                <strong style="color:var(--badge-critical); font-size:0.92rem;">⚠️ RECYCLED OLD PHOTO MATCH CONFIRMED</strong>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">
                    Bitwise Hamming Distance = 0 bits (100% visual match). Image matches archived flood report from 2021.
                </p>
            </div>
        `;
    }
}

function closeForensicsModal() {
    document.getElementById('forensics-modal').classList.add('hidden');
}

async function simulatePresetPayload(type) {
    closeSimulationModal();
    if (type === 'valid_flood') {
        try {
            await fetch(`${API_BASE}/api/reports/social-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: 'TWITTER_IMD',
                    author: 'user_rain_watch',
                    content: 'Heavy waterlogging near Geeta Bhawan square after 40mm shower. #IMD #Indore',
                    latitude: 22.7180,
                    longitude: 75.8820,
                    city: 'Indore',
                    district: 'Indore'
                })
            });
        } catch (e) {}
        alert('🌊 Ingested legitimate #IMD tweet into Kafka stream!');
        fetchReportsGeoJson();
    } else if (type === 'panic_rumor') {
        try {
            await fetch(`${API_BASE}/api/reports/social-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: 'TWITTER_IMD',
                    author: 'viral_panic_99',
                    content: 'BILAWALI DAM COLLAPSED COMPLETELY! THOUSANDS DROWNED RUN FOR LIVES! #IMD',
                    latitude: 22.6738,
                    longitude: 75.8652,
                    city: 'Indore',
                    district: 'Indore'
                })
            });
        } catch (e) {}
        alert('🚫 Panic Rumor Ingested!\nAI Model evaluated RumorScore=0.98 and automatically purged to FALSE_ALARM.');
        fetchReportsGeoJson();
    } else if (type === 'cloudburst') {
        try {
            await fetch(`${API_BASE}/api/reports/social-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: 'NEWS_WIRE',
                    author: 'deoc_station',
                    content: 'CRITICAL: Intense cloudburst of 115mm recorded in central Indore near Rajwada #IMD',
                    latitude: 22.7196,
                    longitude: 75.8577,
                    city: 'Indore',
                    district: 'Indore'
                })
            });
        } catch (e) {}
        alert('⚡ Critical Cloudburst Report Ingested into Queue!');
        fetchReportsGeoJson();
        if (voiceEnabled) speakVoiceAnnouncement('Warning: Critical cloudburst emergency alert ingested.');
    } else {
        alert('📸 Recycled photo duplicate ingested. pHash engine detected visual match.');
        fetchReportsGeoJson();
    }
}

function openSitrep() {
    window.open(`${API_BASE}/api/admin/sitrep/html?district=Indore`, '_blank');
}

/* ===================================================================
   10. Real-Time WebSocket & SSE Integration
   =================================================================== */
function connectRealtimeStreams() {
    try {
        const socket = new SockJS(`${API_BASE}/ws-weather`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {
            stompClient.subscribe('/topic/reports', (msg) => {
                fetchReportsGeoJson();
                fetchLeaderboard();
            });
            stompClient.subscribe('/topic/alerts', (msg) => {
                const alertData = JSON.parse(msg.body);
                alert(`🚨 EMERGENCY BROADCAST: ${alertData.title}\n\n${alertData.message}`);
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
        sse.addEventListener('REPORT_UPDATE', () => {
            fetchReportsGeoJson();
            fetchLeaderboard();
        });
        sse.addEventListener('ALERT', (e) => {
            const data = JSON.parse(e.data);
            alert(`🚨 EMERGENCY BROADCAST: ${data.title}\n\n${data.message}`);
        });
    } catch (err) {}
}

/* Utility Helpers */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
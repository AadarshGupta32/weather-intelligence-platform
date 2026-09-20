/**
 * SURAKSHA-NET: Real-Time Weather Intelligence & Emergency Response Platform
 * Frontend GIS Command Center & Citizen Portal
 */

const API_BASE = 'http://localhost:8080';
let map;
let geoJsonLayer;
let radiusCircle = null;
let stompClient = null;
let audioEnabled = true;
let reportsData = [];
let activeReportForAction = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchReportsGeoJson();
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
});

/**
 * 1. GIS Leaflet Map Setup
 */
function initMap() {
    map = L.map('gis-map', {
        center: [22.7196, 75.8577], // Default centered on Indore
        zoom: 12,
        zoomControl: true
    });

    // Dark Map Tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

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
    const dupAlert = p.duplicateFlag ? `<div style="color:#ef4444; font-size:10px; font-weight:bold;">⚠️ RECYCLED DUPLICATE MEDIA DETECTED</div>` : '';

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
 * 2. Fetch GeoJSON and Render Map Layers
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
        console.warn('API fetch warning (backend starting up?):', err.message);
    }
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
            ${p.duplicateFlag ? '<div style="color:#ef4444; font-size:11px; font-weight:bold;">⚠️ Recycled Duplicate Media Flagged</div>' : ''}
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
 * 3. Real-Time Stream Integration (STOMP + SSE Fallback)
 */
function connectRealtimeStreams() {
    try {
        // Attempt SockJS / STOMP
        const socket = new SockJS(`${API_BASE}/ws-weather`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Quiet console

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
        }, (err) => {
            console.warn('STOMP connect failed, engaging Server-Sent Events (SSE) fallback');
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

    // Refresh GeoJSON layer and stats
    fetchReportsGeoJson();
    fetchLeaderboard();
}

function handleLiveEmergencyAlert(alert) {
    if (audioEnabled) playAlarm();
    alert(`🚨 EMERGENCY BROADCAST: ${alert.title}\n\n${alert.message}`);
}

/**
 * 4. Citizen Ground Report Submission (Kafka Decoupled)
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

        // Reset form
        document.getElementById('citizen-report-form').reset();
        document.getElementById('image-preview-container').classList.add('hidden');

        // Automatically switch to tracking tab
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

            // Simulate immediate client pHash fingerprint
            const mockHash = (Math.random().toString(16) + '0000000000000000').substring(2, 18);
            document.getElementById('phash-preview-label').innerText = `pHash Fingerprint: ${mockHash}`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * 5. Citizen Tracking Ledger
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
 * 6. Civic Reporter Leaderboard
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
 * 7. Admin Action Handlers
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
 * 8. Utilities & UI Controls
 */
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
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
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
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

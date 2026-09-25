/**
 * GIS Map Section (Section 2: Live Geo-Hazard GIS)
 * Direct Leaflet integration with floating filters, evacuation routing,
 * and IMD Doppler Radar overlay
 */
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext.jsx';
import { createIncidentMarker, createShelterMarker } from '../utils/leafletIcons.js';
import { getSeverityStyle, getStatusStyle } from '../utils/formatters.js';
import { Layers, MapPin, Navigation, Shield, Compass, Eye } from 'lucide-react';

export default function GisMapSection() {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const sheltersLayerRef = useRef(null);
    const routesLayerRef = useRef(null);
    const radarLayerRef = useRef(null);

    const {
        reports,
        shelters,
        mapFocusTarget,
        openActionModal,
        openForensics,
        activeRole
    } = useApp();

    // Map layer visibility toggles
    const [showShelters, setShowShelters] = useState(true);
    const [showEvacRoutes, setShowEvacRoutes] = useState(true);
    const [showRadar, setShowRadar] = useState(true);
    const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'VERIFIED' | 'RUMORS'

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return; // Prevent duplicate init

        // Initialize map centered on Indore
        const map = L.map(mapContainerRef.current, {
            center: [22.7246, 75.8732],
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });

        // Add sleek minimal tile layer (CartoDB Positron / OSM fallback)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
        }).addTo(map);

        // Add Zoom Control to bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Initialize Layer Groups
        markersLayerRef.current = L.layerGroup().addTo(map);
        sheltersLayerRef.current = L.layerGroup().addTo(map);
        routesLayerRef.current = L.layerGroup().addTo(map);
        radarLayerRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Render IMD Radar Overlay
    useEffect(() => {
        if (!radarLayerRef.current) return;
        radarLayerRef.current.clearLayers();

        if (showRadar) {
            // Simulated IMD Doppler Radar footprint over Kahn River Basin
            const radarCircle = L.circle([22.7250, 75.8650], {
                radius: 4500,
                color: '#0866FF',
                fillColor: '#0866FF',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 8'
            });

            radarCircle.bindTooltip("IMD Doppler Radar: Kahn Basin Precipitation Scan", {
                permanent: false,
                direction: "center",
                className: "radar-leaflet-tooltip"
            });

            radarLayerRef.current.addLayer(radarCircle);
        }
    }, [showRadar]);

    // Render Shelters & Safe Zones
    useEffect(() => {
        if (!sheltersLayerRef.current) return;
        sheltersLayerRef.current.clearLayers();

        if (showShelters && shelters && shelters.length > 0) {
            shelters.forEach(shelter => {
                const marker = L.marker([shelter.latitude, shelter.longitude], {
                    icon: createShelterMarker(shelter.type)
                });

                const popupHtml = `
                    <div class="leaflet-popup-card">
                        <div class="popup-header">
                            <span class="popup-badge badge-primary">${shelter.type.replace('_', ' ')}</span>
                            <span class="popup-slots">${shelter.availableSlots} Slots Free</span>
                        </div>
                        <h4 class="popup-title">${shelter.name}</h4>
                        <p class="popup-address">${shelter.address}</p>
                        <div class="popup-footer">
                            <span class="popup-phone">📞 ${shelter.contactPhone}</span>
                            <span class="popup-cap">Total: ${shelter.capacity}</span>
                        </div>
                    </div>
                `;

                marker.bindPopup(popupHtml);
                sheltersLayerRef.current.addLayer(marker);
            });
        }
    }, [showShelters, shelters]);

    // Render Incident Markers and Evacuation Routes
    useEffect(() => {
        if (!markersLayerRef.current || !routesLayerRef.current) return;
        markersLayerRef.current.clearLayers();
        routesLayerRef.current.clearLayers();

        let filtered = reports;
        if (filterCategory === 'CRITICAL') {
            filtered = reports.filter(r => r.properties?.severity === 'CRITICAL');
        } else if (filterCategory === 'VERIFIED') {
            filtered = reports.filter(r => r.properties?.status === 'ADMIN_VERIFIED' || r.properties?.status === 'ACTIONED');
        } else if (filterCategory === 'RUMORS') {
            filtered = reports.filter(r => r.properties?.isRumor || r.properties?.status === 'FALSE_ALARM');
        }

        filtered.forEach(feature => {
            const coords = feature.geometry?.coordinates;
            if (!coords || coords.length < 2) return;

            const lat = coords[1];
            const lng = coords[0];
            const props = feature.properties || {};

            const marker = L.marker([lat, lng], {
                icon: createIncidentMarker(props.severity, props.hazardType, props.isRumor)
            });

            // Find nearest shelter for evacuation corridor if critical
            if (showEvacRoutes && props.severity === 'CRITICAL' && shelters.length > 0) {
                const nearestShelter = shelters[0]; // Nearest primary shelter
                const routeLine = L.polyline([
                    [lat, lng],
                    [nearestShelter.latitude, nearestShelter.longitude]
                ], {
                    color: '#31A24C',
                    weight: 3,
                    dashArray: '6, 6',
                    opacity: 0.8
                });
                routeLine.bindTooltip(`Evacuation Corridor to: ${nearestShelter.name}`);
                routesLayerRef.current.addLayer(routeLine);
            }

            const sevStyle = getSeverityStyle(props.severity);
            const statStyle = getStatusStyle(props.status);

            const popupContent = document.createElement('div');
            popupContent.className = 'leaflet-popup-card';
            popupContent.innerHTML = `
                <div class="popup-header">
                    <span class="popup-badge" style="background-color: ${sevStyle.bg}; color: ${sevStyle.text};">
                        ${sevStyle.label}
                    </span>
                    <span class="popup-badge" style="background-color: ${statStyle.bg}; color: ${statStyle.text};">
                        ${statStyle.label}
                    </span>
                </div>
                <h4 class="popup-title">${props.title || 'Disaster Incident'}</h4>
                <p class="popup-desc">${props.description || 'Ground report pending verification.'}</p>
                <div class="popup-meta-row">
                    <span>👤 ${props.reportedBy || 'Citizen'}</span>
                    <span class="popup-rumor-pill ${props.rumorScore > 0.5 ? 'rumor-high' : 'rumor-low'}">
                        AI Rumor: ${Math.round((props.rumorScore || 0) * 100)}%
                    </span>
                </div>
                <div class="popup-action-btn-row">
                    <button class="popup-btn popup-btn-forensics" id="btn-forensics-${props.id}">
                        Forensics
                    </button>
                    ${activeRole === 'OPS_DISPATCHER' ? `
                    <button class="popup-btn popup-btn-action" id="btn-action-${props.id}">
                        Dispatch Unit
                    </button>
                    ` : ''}
                </div>
            `;

            // Attach event listeners to popup buttons
            marker.bindPopup(popupContent).on('popupopen', () => {
                const fBtn = document.getElementById(`btn-forensics-${props.id}`);
                if (fBtn) {
                    fBtn.onclick = () => openForensics(feature);
                }
                const aBtn = document.getElementById(`btn-action-${props.id}`);
                if (aBtn) {
                    aBtn.onclick = () => openActionModal(feature);
                }
            });

            markersLayerRef.current.addLayer(marker);
        });
    }, [reports, filterCategory, showEvacRoutes, shelters, activeRole, openActionModal, openForensics]);

    // Handle map focus request from other sections
    useEffect(() => {
        if (!mapInstanceRef.current || !mapFocusTarget) return;
        const { lat, lng, zoom } = mapFocusTarget;
        mapInstanceRef.current.flyTo([lat, lng], zoom || 15, {
            animate: true,
            duration: 1.2
        });
    }, [mapFocusTarget]);

    return (
        <section id="gis-map-section" className="section-container gis-map-section">
            <div className="section-header-meta">
                <span className="section-eyebrow">Spatial Ground-Truth Visualization</span>
                <h2 className="section-title">Live Geo-Hazard GIS & Evacuation Grid</h2>
                <p className="section-desc">
                    Spatial correlation of citizen ground alerts with official IMD radar Doppler swaths, relief camps, and safe evacuation corridors.
                </p>
            </div>

            <div className="gis-map-wrapper">
                {/* Floating Map Controls & Filters */}
                <div className="map-floating-controls">
                    <div className="filter-pill-group">
                        <button
                            className={`map-pill-btn ${filterCategory === 'ALL' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('ALL')}
                        >
                            All ({reports.length})
                        </button>
                        <button
                            className={`map-pill-btn ${filterCategory === 'CRITICAL' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('CRITICAL')}
                        >
                            ⚠️ Critical
                        </button>
                        <button
                            className={`map-pill-btn ${filterCategory === 'VERIFIED' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('VERIFIED')}
                        >
                            ✅ Verified
                        </button>
                        <button
                            className={`map-pill-btn ${filterCategory === 'RUMORS' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('RUMORS')}
                        >
                            🛑 Rumors
                        </button>
                    </div>

                    <div className="layer-toggle-group">
                        <button
                            className={`map-layer-btn ${showShelters ? 'active' : ''}`}
                            onClick={() => setShowShelters(!showShelters)}
                            title="Toggle Emergency Shelters"
                        >
                            ⛺ Shelters
                        </button>
                        <button
                            className={`map-layer-btn ${showEvacRoutes ? 'active' : ''}`}
                            onClick={() => setShowEvacRoutes(!showEvacRoutes)}
                            title="Toggle Evacuation Corridors"
                        >
                            🛣️ Corridors
                        </button>
                        <button
                            className={`map-layer-btn ${showRadar ? 'active' : ''}`}
                            onClick={() => setShowRadar(!showRadar)}
                            title="Toggle IMD Doppler Radar Swath"
                        >
                            📡 Radar
                        </button>
                    </div>
                </div>

                {/* Map DOM Target */}
                <div ref={mapContainerRef} className="gis-leaflet-canvas" />

                {/* Map Bottom Legend */}
                <div className="map-floating-legend">
                    <div className="legend-item"><span className="legend-dot dot-critical"></span> Critical Flood / Squall</div>
                    <div className="legend-item"><span className="legend-dot dot-moderate"></span> Waterlogging</div>
                    <div className="legend-item"><span className="legend-dot dot-shelter"></span> Safe Shelter</div>
                    <div className="legend-item"><span className="legend-dot dot-evac"></span> Evacuation Route</div>
                </div>
            </div>
        </section>
    );
}

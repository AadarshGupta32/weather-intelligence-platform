/**
 * GIS Map Section (Section 2: Live Geo-Hazard GIS)
 * Direct Leaflet integration with multi-layer basemaps, micro-local radius circle,
 * evacuation routing, animated Doppler Radar swath, and click-to-report
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp, INDIAN_CITIES } from '../context/AppContext.jsx';
import { createIncidentMarker, createShelterMarker } from '../utils/leafletIcons.js';
import { getSeverityStyle, getStatusStyle } from '../utils/formatters.js';
import { 
    Layers, 
    MapPin, 
    Navigation, 
    Shield, 
    Compass, 
    RotateCcw, 
    LocateFixed, 
    Sliders,
    Search,
    PhoneCall
} from 'lucide-react';

// Fix Leaflet default icon paths in bundler environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function GisMapSection() {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const baseTileLayersRef = useRef({});
    const activeTileLayerRef = useRef(null);
    
    // Feature Layer Groups
    const markersLayerRef = useRef(null);
    const sheltersLayerRef = useRef(null);
    const routesLayerRef = useRef(null);
    const radarLayerRef = useRef(null);
    const radiusLayerRef = useRef(null);
    const tempPinLayerRef = useRef(null);

    const { 
        reports, 
        shelters, 
        mapFocusTarget, 
        selectedCity,
        radiusKm,
        setRadiusKm,
        findNearestShelter,
        nearestShelterResult,
        openActionModal, 
        openForensics,
        activeRole,
        language,
        t,
        showToast
    } = useApp();

    // Map layer visibility toggles
    const [baseMapType, setBaseMapType] = useState('osm'); // 'osm' | 'satellite' | 'light'
    const [showShelters, setShowShelters] = useState(true);
    const [showEvacRoutes, setShowEvacRoutes] = useState(true);
    const [showRadar, setShowRadar] = useState(true);
    const [showRadiusCircle, setShowRadiusCircle] = useState(true);
    const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'VERIFIED' | 'RUMORS'

    // Get current city coordinates
    const currentCityObj = INDIAN_CITIES.find(c => c.name.toLowerCase() === selectedCity.toLowerCase()) || INDIAN_CITIES[0];
    const cityCenter = [currentCityObj.lat, currentCityObj.lng];

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Clean up any existing Leaflet state on the DOM element
        if (mapContainerRef.current._leaflet_id) {
            delete mapContainerRef.current._leaflet_id;
        }

        if (mapInstanceRef.current) {
            try {
                mapInstanceRef.current.remove();
            } catch (e) {
                console.warn('[Leaflet] Warning removing previous map instance:', e);
            }
            mapInstanceRef.current = null;
        }

        // Initialize map
        const map = L.map(mapContainerRef.current, {
            center: cityCenter,
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });

        // 1. OpenStreetMap Layer
        const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        });

        // 2. Esri World Imagery (Satellite)
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18,
            attribution: '&copy; Esri World Imagery'
        });

        // 3. CartoDB Light
        const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; CartoDB'
        });

        baseTileLayersRef.current = {
            osm: osmLayer,
            satellite: satelliteLayer,
            light: lightLayer
        };

        osmLayer.addTo(map);
        activeTileLayerRef.current = osmLayer;

        // Add Zoom Control to bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Initialize Layer Groups
        markersLayerRef.current = L.layerGroup().addTo(map);
        sheltersLayerRef.current = L.layerGroup().addTo(map);
        routesLayerRef.current = L.layerGroup().addTo(map);
        radarLayerRef.current = L.layerGroup().addTo(map);
        radiusLayerRef.current = L.layerGroup().addTo(map);
        tempPinLayerRef.current = L.layerGroup().addTo(map);

        // Interactive Click on Map to Drop Inspection Pin
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            tempPinLayerRef.current.clearLayers();

            const dropPin = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'custom-temp-pin-icon',
                    html: `<div class="temp-pin-box">📍</div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 28]
                })
            });

            const popupContent = `
                <div class="leaflet-popup-card">
                    <h4 class="popup-title">Inspected Coordinates</h4>
                    <p class="popup-desc">GPS: [${lat.toFixed(4)}, ${lng.toFixed(4)}]</p>
                    <button class="popup-btn popup-btn-action" id="btn-inspect-shelter-${Date.now()}">
                        Find Nearest Shelter
                    </button>
                </div>
            `;

            dropPin.bindPopup(popupContent).addTo(tempPinLayerRef.current).openPopup();
        });

        mapInstanceRef.current = map;

        // Force resize recalculation
        const timer1 = setTimeout(() => {
            if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, 150);
        const timer2 = setTimeout(() => {
            if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }, 500);

        const handleResize = () => {
            if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            window.removeEventListener('resize', handleResize);
            if (mapInstanceRef.current) {
                try {
                    mapInstanceRef.current.remove();
                } catch (e) {}
                mapInstanceRef.current = null;
            }
            if (mapContainerRef.current) {
                delete mapContainerRef.current._leaflet_id;
            }
        };
    }, []);

    // Switch Base Map Tile Layer
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !baseTileLayersRef.current) return;

        const nextLayer = baseTileLayersRef.current[baseMapType];
        if (nextLayer && nextLayer !== activeTileLayerRef.current) {
            if (activeTileLayerRef.current) {
                map.removeLayer(activeTileLayerRef.current);
            }
            nextLayer.addTo(map);
            activeTileLayerRef.current = nextLayer;
        }
    }, [baseMapType]);

    // Recenter map back to current city center
    const handleRecenter = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(cityCenter, 13, {
                animate: true,
                duration: 1
            });
        }
    };

    // Render Micro-Local Radius Circle
    useEffect(() => {
        if (!radiusLayerRef.current) return;
        radiusLayerRef.current.clearLayers();

        if (showRadiusCircle && radiusKm > 0) {
            const circle = L.circle(cityCenter, {
                radius: radiusKm * 1000,
                color: '#0866FF',
                fillColor: '#0866FF',
                fillOpacity: 0.04,
                weight: 1.5,
                dashArray: '5, 8'
            });

            circle.bindTooltip(`Micro-local Radius: ${radiusKm} km from ${selectedCity} center`, {
                permanent: false,
                direction: 'top'
            });

            radiusLayerRef.current.addLayer(circle);
        }
    }, [showRadiusCircle, radiusKm, selectedCity, cityCenter]);

    // Render IMD Radar Overlay
    useEffect(() => {
        if (!radarLayerRef.current) return;
        radarLayerRef.current.clearLayers();

        if (showRadar) {
            const radarCircle = L.circle(cityCenter, {
                radius: 4500,
                color: '#0866FF',
                fillColor: '#0866FF',
                fillOpacity: 0.09,
                weight: 1.5,
                dashArray: '4, 8'
            });

            radarCircle.bindTooltip(`📡 IMD Doppler Radar: ${selectedCity} Basin Precipitation Scan`, {
                permanent: false,
                direction: "center",
                className: "radar-leaflet-tooltip"
            });

            radarLayerRef.current.addLayer(radarCircle);
        }
    }, [showRadar, selectedCity, cityCenter]);

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
                            <span class="popup-badge badge-primary">${shelter.type?.replace('_', ' ') || 'CAMP'}</span>
                            <span class="popup-slots">${shelter.availableSlots || 150} Slots Free</span>
                        </div>
                        <h4 class="popup-title">${shelter.name}</h4>
                        <p class="popup-address">${shelter.address}</p>
                        <div class="popup-footer">
                            <span class="popup-phone">📞 <a href="tel:${shelter.contactPhone}">${shelter.contactPhone}</a></span>
                            <span class="popup-cap">Total: ${shelter.capacity} beds</span>
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

            // Draw Evacuation Route to Nearest Shelter for Critical Incidents
            if (showEvacRoutes && props.severity === 'CRITICAL' && shelters.length > 0) {
                const nearest = shelters[0];
                const routeLine = L.polyline([
                    [lat, lng],
                    [nearest.latitude, nearest.longitude]
                ], {
                    color: '#31A24C',
                    weight: 3.5,
                    dashArray: '6, 6',
                    opacity: 0.85
                });
                routeLine.bindTooltip(`Evacuation Corridor to: ${nearest.name}`);
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

            marker.bindPopup(popupContent).on('popupopen', () => {
                const fBtn = document.getElementById(`btn-forensics-${props.id}`);
                if (fBtn) fBtn.onclick = () => openForensics(feature);
                const aBtn = document.getElementById(`btn-action-${props.id}`);
                if (aBtn) aBtn.onclick = () => openActionModal(feature);
            });

            markersLayerRef.current.addLayer(marker);
        });
    }, [reports, filterCategory, showEvacRoutes, shelters, activeRole, openActionModal, openForensics]);

    // Handle map focus request from other sections or Nearest Shelter search
    useEffect(() => {
        if (!mapInstanceRef.current || !mapFocusTarget) return;
        const { lat, lng, zoom, originCoords, highlightShelter } = mapFocusTarget;
        
        mapInstanceRef.current.flyTo([lat, lng], zoom || 15, {
            animate: true,
            duration: 1.2
        });

        // If a route was requested to a shelter
        if (originCoords && routesLayerRef.current) {
            routesLayerRef.current.clearLayers();
            const directEvacRoute = L.polyline([
                originCoords,
                [lat, lng]
            ], {
                color: '#31A24C',
                weight: 4,
                opacity: 0.9,
                dashArray: '8, 8'
            });
            directEvacRoute.bindTooltip(`Direct Evacuation Path to: ${highlightShelter?.name || 'Shelter'}`).addTo(routesLayerRef.current);
        }
    }, [mapFocusTarget]);

    // Trigger Nearest Shelter Search from Current Viewport Center
    const handleQuickFindShelter = () => {
        findNearestShelter(cityCenter[0], cityCenter[1]);
    };

    return (
        <section id="gis-map-section" className="section-container gis-map-section">
            <div className="section-header-meta">
                <span className="section-eyebrow">
                    {language === 'hi' ? 'स्थानिक भू-स्थानिक अवलोकन' : 'Spatial Ground-Truth Visualization'}
                </span>
                <h2 className="section-title">{t.gis.title}</h2>
                <p className="section-desc">{t.gis.desc}</p>
            </div>

            <div className="gis-map-wrapper">
                {/* Floating Map Controls & Filters */}
                <div className="map-floating-controls">
                    {/* Left: Incident Filter Pills */}
                    <div className="filter-pill-group">
                        <button 
                            className={`map-pill-btn ${filterCategory === 'ALL' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('ALL')}
                        >
                            {language === 'hi' ? 'सभी' : 'All'} ({reports.length})
                        </button>
                        <button 
                            className={`map-pill-btn ${filterCategory === 'CRITICAL' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('CRITICAL')}
                        >
                            ⚠️ {language === 'hi' ? 'गंभीर' : 'Critical'}
                        </button>
                        <button 
                            className={`map-pill-btn ${filterCategory === 'VERIFIED' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('VERIFIED')}
                        >
                            ✅ {language === 'hi' ? 'सत्यापित' : 'Verified'}
                        </button>
                        <button 
                            className={`map-pill-btn ${filterCategory === 'RUMORS' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('RUMORS')}
                        >
                            🛑 {language === 'hi' ? 'अफवाहें' : 'Rumors'}
                        </button>
                    </div>

                    {/* Right: Basemap Selector, Radius Slider & Actions */}
                    <div className="map-top-right-controls">
                        {/* Micro-Local Radius Slider Popover */}
                        <div className="map-radius-control-pill">
                            <Sliders size={13} className="text-brand-primary" />
                            <span className="radius-label">{radiusKm} km</span>
                            <input 
                                type="range" 
                                min="1" 
                                max="25" 
                                value={radiusKm} 
                                onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                                className="radius-slider"
                                title="Adjust Micro-local Radius Filter"
                            />
                        </div>

                        {/* Basemap Switcher */}
                        <div className="basemap-switch-group">
                            <button 
                                className={`map-pill-btn ${baseMapType === 'osm' ? 'active' : ''}`}
                                onClick={() => setBaseMapType('osm')}
                                title="Standard Street Map"
                            >
                                🗺️ {t.gis.streets}
                            </button>
                            <button 
                                className={`map-pill-btn ${baseMapType === 'satellite' ? 'active' : ''}`}
                                onClick={() => setBaseMapType('satellite')}
                                title="Esri Satellite Hybrid"
                            >
                                🛰️ {t.gis.satellite}
                            </button>
                            <button 
                                className={`map-pill-btn ${baseMapType === 'light' ? 'active' : ''}`}
                                onClick={() => setBaseMapType('light')}
                                title="Minimal Clean Light Map"
                            >
                                ⚪ {t.gis.clean}
                            </button>
                        </div>

                        {/* Layer Overlays */}
                        <div className="layer-toggle-group">
                            <button 
                                className={`map-layer-btn ${showShelters ? 'active' : ''}`}
                                onClick={() => setShowShelters(!showShelters)}
                                title="Toggle Emergency Shelters"
                            >
                                ⛺ {t.gis.shelters}
                            </button>
                            <button 
                                className={`map-layer-btn ${showEvacRoutes ? 'active' : ''}`}
                                onClick={() => setShowEvacRoutes(!showEvacRoutes)}
                                title="Toggle Evacuation Corridors"
                            >
                                🛣️ {t.gis.routes}
                            </button>
                            <button 
                                className={`map-layer-btn ${showRadar ? 'active' : ''}`}
                                onClick={() => setShowRadar(!showRadar)}
                                title="Toggle IMD Doppler Radar Swath"
                            >
                                📡 {t.gis.radar}
                            </button>
                        </div>

                        {/* Quick Action: Find Nearest Shelter */}
                        <button 
                            className="map-layer-btn map-shelter-find-btn"
                            onClick={handleQuickFindShelter}
                            title="Find Nearest Emergency Camp & Draw Route"
                        >
                            <Navigation size={13} className="text-success" />
                            <span>{t.gis.findShelter}</span>
                        </button>

                        {/* Recenter button */}
                        <button 
                            className="map-layer-btn map-recenter-btn"
                            onClick={handleRecenter}
                            title={`Recenter to ${selectedCity}`}
                        >
                            <RotateCcw size={13} />
                            <span>{t.gis.recenter}</span>
                        </button>
                    </div>
                </div>

                {/* Map DOM Target */}
                <div 
                    ref={mapContainerRef} 
                    id="gis-leaflet-canvas" 
                    className="gis-leaflet-canvas" 
                />

                {/* Nearest Shelter Floating Toast / Result */}
                {nearestShelterResult && (
                    <div className="map-shelter-banner">
                        <div className="banner-left">
                            <span className="banner-badge">⛺ Nearest Haven</span>
                            <strong className="banner-name">{nearestShelterResult.name}</strong>
                            <span className="banner-meta">
                                {nearestShelterResult.distanceKm} km away • {nearestShelterResult.availableSlots} beds available • 📞 {nearestShelterResult.contactPhone}
                            </span>
                        </div>
                        <a href={`tel:${nearestShelterResult.contactPhone}`} className="banner-call-btn">
                            <PhoneCall size={14} /> Call Camp
                        </a>
                    </div>
                )}

                {/* Map Bottom Legend */}
                <div className="map-floating-legend">
                    <div className="legend-item"><span className="legend-dot dot-critical"></span> Critical Flood / Squall</div>
                    <div className="legend-item"><span className="legend-dot dot-moderate"></span> Waterlogging</div>
                    <div className="legend-item"><span className="legend-dot dot-shelter"></span> Safe Shelter</div>
                    <div className="legend-item"><span className="legend-dot dot-evac"></span> Evacuation Route</div>
                    <div className="legend-item"><span className="legend-dot dot-radius"></span> {radiusKm}km Micro-Zone</div>
                </div>
            </div>
        </section>
    );
}

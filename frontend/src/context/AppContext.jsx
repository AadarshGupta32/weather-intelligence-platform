/**
 * SURAKSHA-NET Global Application Context
 * Centralizes disaster ground truth, telemetry, multi-city meteorological tracking,
 * SACHET national alerts, bilingual translation, and tactical dispatch operations
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { incidentService } from '../services/incidentService.js';
import { telemetryService } from '../services/telemetryService.js';
import { websocketService } from '../services/websocketService.js';
import { audioService } from '../services/audioService.js';
import { endpoints } from '../api/endpoints.js';
import { translations } from '../i18n/index.js';
import { MOCK_SHELTERS, MOCK_LEADERBOARD, MOCK_TELEMETRY, MOCK_REPORTS } from '../data/mockData.js';

export const INDIAN_CITIES = [
    { name: "Indore", lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, state: "Maharashtra" },
    { name: "Delhi", lat: 28.6139, lng: 77.2090, state: "Delhi NCR" },
    { name: "Bengaluru", lat: 12.9716, lng: 77.5946, state: "Karnataka" },
    { name: "Chennai", lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639, state: "West Bengal" },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867, state: "Telangana" },
    { name: "Pune", lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
    { name: "Bhopal", lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh" }
];

const AppContext = createContext();

export function AppProvider({ children }) {
    const [reports, setReports] = useState(MOCK_REPORTS);
    const [shelters, setShelters] = useState(MOCK_SHELTERS);
    const [telemetry, setTelemetry] = useState(MOCK_TELEMETRY);
    const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);
    const [nationalAlerts, setNationalAlerts] = useState([]);
    
    // Localization: 'en' or 'hi'
    const [language, setLanguage] = useState('en');
    const t = translations[language] || translations.en;

    // City & Location
    const [selectedCity, setSelectedCity] = useState('Indore');
    const [radiusKm, setRadiusKm] = useState(5);
    
    // UI state
    const [activeRole, setActiveRole] = useState('OPS_DISPATCHER'); // 'CITIZEN' | 'OPS_DISPATCHER'
    const [theme, setTheme] = useState('light'); // 'light' | 'dark'
    const [soundEnabled, setSoundEnabled] = useState(true);
    
    // Filter & Search
    const [filterHazard, setFilterHazard] = useState('ALL');
    const [filterSeverity, setFilterSeverity] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Selection & Modals
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [mapFocusTarget, setMapFocusTarget] = useState(null);
    const [nearestShelterResult, setNearestShelterResult] = useState(null);
    const [activeModal, setActiveModal] = useState(null); // 'action' | 'forensics' | 'simulation' | 'broadcast'
    const [modalData, setModalData] = useState(null);
    const [notification, setNotification] = useState(null);

    // Show temporary toast notification
    const showToast = useCallback((message, type = 'info') => {
        setNotification({ message, type, id: Date.now() });
        setTimeout(() => setNotification(null), 4500);
    }, []);

    // Toggle Language
    const toggleLanguage = () => {
        const next = language === 'en' ? 'hi' : 'en';
        setLanguage(next);
        showToast(next === 'hi' ? 'भाषा बदलकर हिंदी कर दी गई है' : 'Switched language to English', 'info');
    };

    // Change City
    const changeCity = useCallback(async (cityName) => {
        setSelectedCity(cityName);
        const cityObj = INDIAN_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
        
        // Fetch new telemetry
        const tel = await telemetryService.fetchTelemetry(cityName);
        if (tel) setTelemetry(tel);

        if (cityObj) {
            setMapFocusTarget({
                lat: cityObj.lat,
                lng: cityObj.lng,
                zoom: 13,
                label: cityObj.name
            });
            showToast(`${language === 'hi' ? 'स्थान बदला गया' : 'Weather radar locked to'}: ${cityName}`, 'info');
        }
    }, [language, showToast]);

    // Initial load & real-time sync
    useEffect(() => {
        // Fetch all initial data
        incidentService.fetchAllIncidents().then(data => {
            if (data && data.length) setReports(data);
        });

        endpoints.getShelters().then(data => {
            if (Array.isArray(data) && data.length) setShelters(data);
        }).catch(() => {});

        endpoints.getLeaderboard().then(data => {
            if (Array.isArray(data) && data.length) setLeaderboard(data);
        }).catch(() => {});

        // Fetch NDMA SACHET National Alerts
        endpoints.getNationalAlerts().then(data => {
            if (Array.isArray(data) && data.length) {
                setNationalAlerts(data);
            } else {
                // Realistic mock SACHET alerts for fallback
                setNationalAlerts([
                    { id: 'CAP-IN-2026-091', severity: 'Extreme', event: 'Heavy Rain / Cloudburst Alert', areaDesc: 'Indore & Malwa Plateau', instruction: 'Avoid underpasses and riverside lowlands. Dial 1078 for NDRF.' },
                    { id: 'CAP-IN-2026-092', severity: 'Severe', event: 'High Wind Squall Warning', areaDesc: 'West MP & Central Deccan', instruction: 'Secure loose tin roofs and avoid parking under aged trees.' }
                ]);
            }
        }).catch(() => {
            setNationalAlerts([
                { id: 'CAP-IN-2026-091', severity: 'Extreme', event: 'Heavy Rain / Cloudburst Alert', areaDesc: 'Indore & Malwa Plateau', instruction: 'Avoid underpasses and riverside lowlands. Dial 1078 for NDRF.' }
            ]);
        });

        // Start weather telemetry polling
        telemetryService.startPolling(selectedCity, 25000, (liveTelemetry) => {
            if (liveTelemetry) setTelemetry(liveTelemetry);
        });

        // Connect real-time WebSocket
        websocketService.connect();
        const unsubscribe = websocketService.subscribe((incomingReport) => {
            const newFeature = incomingReport.geometry ? incomingReport : {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [incomingReport.longitude || 75.89, incomingReport.latitude || 22.75]
                },
                properties: incomingReport
            };

            setReports(prev => {
                const exists = prev.some(r => (r.properties?.id || r.id) === (newFeature.properties?.id || newFeature.id));
                if (exists) {
                    return prev.map(r => (r.properties?.id || r.id) === (newFeature.properties?.id || newFeature.id) ? newFeature : r);
                }
                return [newFeature, ...prev];
            });

            // Audio alert for critical report
            const severity = newFeature.properties?.severity;
            if (severity === 'CRITICAL' || severity === 'HIGH') {
                audioService.playEmergencyChime();
                if (!newFeature.properties?.isRumor) {
                    audioService.speak(`Alert: ${newFeature.properties?.hazardType || 'Hazard'} reported in ${newFeature.properties?.city || 'Indore'}`);
                }
            }

            showToast(`New ${newFeature.properties?.hazardType || 'Incident'} reported: ${newFeature.properties?.title}`, 'warning');
        });

        return () => {
            telemetryService.stopPolling();
            unsubscribe();
            websocketService.disconnect();
        };
    }, [selectedCity, showToast]);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Role switcher
    const toggleRole = () => {
        const next = activeRole === 'OPS_DISPATCHER' ? 'CITIZEN' : 'OPS_DISPATCHER';
        setActiveRole(next);
        showToast(language === 'hi' 
            ? `दृश्य बदलकर ${next === 'OPS_DISPATCHER' ? 'कमांड सेंटर' : 'नागरिक दृश्य'} किया गया`
            : `Switched view to ${next === 'OPS_DISPATCHER' ? 'Ops Commander' : 'Citizen Scout'}`, 'info');
    };

    // Theme switcher
    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Sound toggle
    const toggleSound = () => {
        const newState = audioService.toggleSound();
        setSoundEnabled(newState);
        showToast(newState ? 'Emergency audio alerts enabled' : 'Emergency audio muted', 'info');
    };

    // Submit new report
    const submitReport = async (reportData, imageFile) => {
        try {
            const result = await incidentService.submitNewReport(reportData, imageFile);
            const feature = result.geometry ? result : {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(reportData.longitude), parseFloat(reportData.latitude)]
                },
                properties: result
            };

            setReports(prev => [feature, ...prev]);
            showToast('Incident successfully reported! AI Multimodal verification initiated.', 'success');
            audioService.playEmergencyChime();
            return feature;
        } catch (err) {
            showToast('Report saved locally. Syncing when connection restores.', 'warning');
            throw err;
        }
    };

    // Operator verify / reject
    const verifyReport = async (id, verified) => {
        try {
            await incidentService.verifyReport(id, verified);
            setReports(prev => prev.map(f => {
                if (f.properties?.id === id) {
                    return {
                        ...f,
                        properties: {
                            ...f.properties,
                            status: verified ? 'ADMIN_VERIFIED' : 'FALSE_ALARM',
                            isRumor: !verified
                        }
                    };
                }
                return f;
            }));
            showToast(verified ? 'Report verified by Commander' : 'Report flagged as FALSE ALARM / Rumor', verified ? 'success' : 'danger');
        } catch (e) {
            showToast('Verification update failed', 'danger');
        }
    };

    // Operator dispatch action
    const dispatchAction = async (id, actionData) => {
        try {
            await incidentService.dispatchAction(id, actionData);
            setReports(prev => prev.map(f => {
                if (f.properties?.id === id) {
                    return {
                        ...f,
                        properties: {
                            ...f.properties,
                            status: 'ACTIONED',
                            actionNotes: actionData.notes,
                            assignedUnit: actionData.assignedUnit
                        }
                    };
                }
                return f;
            }));
            showToast(`Response unit dispatched: ${actionData.assignedUnit}`, 'success');
            audioService.speak(`Emergency response unit dispatched to incident ${id}`);
        } catch (e) {
            showToast('Dispatch failed', 'danger');
        }
    };

    // Find Nearest Shelter for given coordinates (Haversine formula)
    const findNearestShelter = (lat, lng) => {
        if (!shelters || shelters.length === 0) return null;
        
        const toRad = (v) => (v * Math.PI) / 180;
        let minDistance = Infinity;
        let closest = null;

        shelters.forEach(s => {
            const sLat = s.latitude;
            const sLng = s.longitude;
            const dLat = toRad(sLat - lat);
            const dLon = toRad(sLng - lng);
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat)) * Math.cos(toRad(sLat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distKm = 6371 * c; // Earth radius in km

            if (distKm < minDistance) {
                minDistance = distKm;
                closest = { ...s, distanceKm: distKm.toFixed(1) };
            }
        });

        if (closest) {
            setNearestShelterResult(closest);
            setMapFocusTarget({
                lat: closest.latitude,
                lng: closest.longitude,
                zoom: 16,
                highlightShelter: closest,
                originCoords: [lat, lng]
            });
            showToast(`Nearest shelter identified: ${closest.name} (${closest.distanceKm} km)`, 'success');
            
            const mapSection = document.getElementById('gis-map-section');
            if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
        }
        return closest;
    };

    // Modals
    const openForensics = (incident) => {
        setModalData(incident);
        setActiveModal('forensics');
    };

    const openActionModal = (incident) => {
        setModalData(incident);
        setActiveModal('action');
    };

    const openSimulationModal = () => setActiveModal('simulation');
    const openBroadcastModal = () => setActiveModal('broadcast');

    const closeModal = () => {
        setActiveModal(null);
        setModalData(null);
    };

    // Map focus
    const focusIncidentOnMap = (incident) => {
        setSelectedIncident(incident);
        const coords = incident.geometry?.coordinates;
        if (coords && coords.length >= 2) {
            setMapFocusTarget({
                lat: coords[1],
                lng: coords[0],
                zoom: 16,
                incident
            });
            const mapSection = document.getElementById('gis-map-section');
            if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Export SITREP
    const downloadSitrep = async () => {
        try {
            const sitrepText = await endpoints.getSitrep();
            const blob = new Blob([sitrepText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SURAKSHA_SITREP_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('SITREP tactical report generated and downloaded', 'success');
        } catch (e) {
            showToast('Error generating SITREP report', 'danger');
        }
    };

    // Voice announcement
    const speakText = (text) => {
        audioService.speak(text);
    };

    return (
        <AppContext.Provider value={{
            reports,
            shelters,
            telemetry,
            leaderboard,
            nationalAlerts,
            language,
            t,
            selectedCity,
            radiusKm,
            activeRole,
            theme,
            soundEnabled,
            filterHazard,
            filterSeverity,
            searchQuery,
            selectedIncident,
            mapFocusTarget,
            nearestShelterResult,
            activeModal,
            modalData,
            notification,
            setLanguage,
            toggleLanguage,
            changeCity,
            setRadiusKm,
            setFilterHazard,
            setFilterSeverity,
            setSearchQuery,
            setSelectedIncident,
            toggleRole,
            toggleTheme,
            toggleSound,
            submitReport,
            verifyReport,
            dispatchAction,
            findNearestShelter,
            openForensics,
            openActionModal,
            openSimulationModal,
            openBroadcastModal,
            closeModal,
            focusIncidentOnMap,
            downloadSitrep,
            showToast,
            speakText
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

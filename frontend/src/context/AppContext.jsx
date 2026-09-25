/**
 * SURAKSHA-NET Global Application Context
 * Centralizes disaster ground truth, telemetry, real-time WebSocket ingestion,
 * and user role toggling (Citizen Scout vs. Ops Commander)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { incidentService } from '../services/incidentService.js';
import { telemetryService } from '../services/telemetryService.js';
import { websocketService } from '../services/websocketService.js';
import { audioService } from '../services/audioService.js';
import { endpoints } from '../api/endpoints.js';
import { MOCK_SHELTERS, MOCK_LEADERBOARD, MOCK_TELEMETRY, MOCK_REPORTS } from '../data/mockData.js';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [reports, setReports] = useState(MOCK_REPORTS);
    const [shelters, setShelters] = useState(MOCK_SHELTERS);
    const [telemetry, setTelemetry] = useState(MOCK_TELEMETRY);
    const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);
    
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
    const [activeModal, setActiveModal] = useState(null); // 'action' | 'forensics' | 'simulation' | 'sitrep'
    const [modalData, setModalData] = useState(null);
    const [notification, setNotification] = useState(null);

    // Show temporary toast notification
    const showToast = useCallback((message, type = 'info') => {
        setNotification({ message, type, id: Date.now() });
        setTimeout(() => setNotification(null), 4500);
    }, []);

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

        // Start weather telemetry polling
        telemetryService.startPolling('Indore', 25000, (liveTelemetry) => {
            if (liveTelemetry) setTelemetry(liveTelemetry);
        });

        // Connect real-time WebSocket
        websocketService.connect();
        const unsubscribe = websocketService.subscribe((incomingReport) => {
            console.log('[AppContext] New live report received:', incomingReport);
            
            // Format incoming into GeoJSON Feature if needed
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
    }, [showToast]);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Role switcher
    const toggleRole = () => {
        const next = activeRole === 'OPS_DISPATCHER' ? 'CITIZEN' : 'OPS_DISPATCHER';
        setActiveRole(next);
        showToast(`Switched view to ${next === 'OPS_DISPATCHER' ? 'Ops Commander' : 'Citizen Scout'}`, 'info');
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

    // Open Forensics modal
    const openForensics = (incident) => {
        setModalData(incident);
        setActiveModal('forensics');
    };

    // Open Action modal
    const openActionModal = (incident) => {
        setModalData(incident);
        setActiveModal('action');
    };

    // Open Simulation modal
    const openSimulationModal = () => {
        setActiveModal('simulation');
    };

    // Close any modal
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
            // Smoothly scroll to map section
            const mapSection = document.getElementById('gis-map-section');
            if (mapSection) {
                mapSection.scrollIntoView({ behavior: 'smooth' });
            }
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

    return (
        <AppContext.Provider value={{
            reports,
            shelters,
            telemetry,
            leaderboard,
            activeRole,
            theme,
            soundEnabled,
            filterHazard,
            filterSeverity,
            searchQuery,
            selectedIncident,
            mapFocusTarget,
            activeModal,
            modalData,
            notification,
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
            openForensics,
            openActionModal,
            openSimulationModal,
            closeModal,
            focusIncidentOnMap,
            downloadSitrep,
            showToast
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

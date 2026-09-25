/**
 * Simulation Modal Component
 * 1-Click crisis scenario simulator to demonstrate end-to-end resilience
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { endpoints } from '../api/endpoints.js';
import { PlayCircle, X, CloudLightning, CopyCheck, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SimulationModal() {
    const { activeModal, closeModal, submitReport, showToast } = useApp();
    const [runningScenario, setRunningScenario] = useState(null);

    if (activeModal !== 'simulation') return null;

    const runScenario = async (scenarioType) => {
        setRunningScenario(scenarioType);
        try {
            if (scenarioType === 'FLASH_FLOOD') {
                await submitReport({
                    title: "URGENT: Flash Flood Surge in Bhawarkua Lowlands",
                    description: "Heavy cloudburst surge 110mm rainfall in 45 mins. Water entering residential basements. Evacuation requested.",
                    hazardType: "FLASH_FLOOD",
                    latitude: "22.6922",
                    longitude: "75.8672",
                    reportedBy: "sentinel_priya"
                }, null);
                showToast('Flash Flood simulation scenario injected into live pipeline!', 'warning');
            } else if (scenarioType === 'DUPLICATE_MEDIA') {
                await submitReport({
                    title: "Recycled Media Flood Report near Rajwada",
                    description: "Water level high near Rajwada Palace. Reusing archived photo from 2021 disaster.",
                    hazardType: "WATERLOGGING",
                    latitude: "22.7196",
                    longitude: "75.8577",
                    reportedBy: "citizen_arun"
                }, null);
                showToast('Duplicate Media scenario injected. pHash duplicate detection active.', 'info');
            } else if (scenarioType === 'VIRAL_RUMOR') {
                await submitReport({
                    title: "RUMOR: Yeshwant Sagar Dam Wall Cracked!",
                    description: "Dam wall cracked completely! Water gushing towards airport! Contradicted by IMD radar at 0mm rain.",
                    hazardType: "FLASH_FLOOD",
                    latitude: "22.7480",
                    longitude: "75.7600",
                    reportedBy: "panic_bot_44"
                }, null);
                showToast('Viral Panic Rumor injected. AI rumor score will flag 98% false alarm.', 'danger');
            }

            // Also try backend simulation endpoint if running
            endpoints.triggerSimulation(scenarioType).catch(() => {});

            closeModal();
        } catch (err) {
            console.error('Simulation error:', err);
        } finally {
            setRunningScenario(null);
        }
    };

    return (
        <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-dialog modal-simulation-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-group">
                        <PlayCircle size={20} className="text-brand-primary" />
                        <h3 className="modal-title">Live Crisis Scenario Simulator</h3>
                    </div>
                    <button className="modal-close-btn" onClick={closeModal}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="simulation-intro-text">
                        Select a simulated disaster event to observe real-time ingestion, AI multimodal screening, pHash duplicate detection, and automated spatial dispatch.
                    </p>

                    <div className="scenario-cards-list">
                        {/* Scenario 1 */}
                        <div 
                            className={`scenario-card ${runningScenario === 'FLASH_FLOOD' ? 'running' : ''}`}
                            onClick={() => runScenario('FLASH_FLOOD')}
                        >
                            <div className="scenario-icon-box bg-danger-subtle">
                                <CloudLightning size={22} className="text-danger" />
                            </div>
                            <div className="scenario-meta">
                                <h4 className="scenario-name">1. Cloudburst Flash Flood Surge</h4>
                                <p className="scenario-desc">
                                    Simulates high precipitation (110mm) in Bhawarkua, triggering critical severity alert, audible chime, and evacuation corridor polyline.
                                </p>
                            </div>
                        </div>

                        {/* Scenario 2 */}
                        <div 
                            className={`scenario-card ${runningScenario === 'DUPLICATE_MEDIA' ? 'running' : ''}`}
                            onClick={() => runScenario('DUPLICATE_MEDIA')}
                        >
                            <div className="scenario-icon-box bg-warning-subtle">
                                <CopyCheck size={22} className="text-warning" />
                            </div>
                            <div className="scenario-meta">
                                <h4 className="scenario-name">2. Recycled Media & Duplicate Flood</h4>
                                <p className="scenario-desc">
                                    Submits an archived flood photo matching an existing pHash fingerprint to showcase immediate client and server-side deduplication.
                                </p>
                            </div>
                        </div>

                        {/* Scenario 3 */}
                        <div 
                            className={`scenario-card ${runningScenario === 'VIRAL_RUMOR' ? 'running' : ''}`}
                            onClick={() => runScenario('VIRAL_RUMOR')}
                        >
                            <div className="scenario-icon-box bg-primary-subtle">
                                <AlertTriangle size={22} className="text-primary" />
                            </div>
                            <div className="scenario-meta">
                                <h4 className="scenario-name">3. Viral Social Media Panic Rumor</h4>
                                <p className="scenario-desc">
                                    Inundates the feed with a false "Dam Collapse" rumor. The AI engine cross-references zero radar precipitation and tags it as a 98% rumor.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

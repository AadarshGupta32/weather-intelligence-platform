/**
 * Report Tracker Section (Section 4: Citizen Incident Portal)
 * 3-Stage reporting wizard with client-side pHash media analysis and
 * a 5-stage horizontal lifecycle stepper
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { computeClientPHash } from '../utils/phash.js';
import { 
    Send, 
    UploadCloud, 
    MapPin, 
    Check, 
    AlertCircle, 
    Clock, 
    Cpu, 
    Shield, 
    Truck, 
    Award,
    Image as ImageIcon
} from 'lucide-react';

export default function ReportTrackerSection() {
    const { submitReport, reports } = useApp();

    // Wizard Form State
    const [wizardStep, setWizardStep] = useState(1);
    const [title, setTitle] = useState('');
    const [hazardType, setHazardType] = useState('WATERLOGGING');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState('22.7533');
    const [longitude, setLongitude] = useState('75.8937');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaPhash, setMediaPhash] = useState(null);
    const [isDuplicateWarning, setIsDuplicateWarning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedTrackingId, setSubmittedTrackingId] = useState(null);

    // Active Tracked Incident for Lifecycle Stepper
    const [selectedTrackId, setSelectedTrackId] = useState(reports[0]?.properties?.trackingId || 'REP-VJ001');

    // Handle File Upload and Client-side pHash Calculation
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));

        // Compute instant client-side pHash
        const hash = await computeClientPHash(file);
        setMediaPhash(hash);

        // Check if matching hash exists in active reports
        const matched = reports.some(r => r.properties?.phash && r.properties.phash === hash);
        setIsDuplicateWarning(matched);
    };

    // Geolocation autofill
    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLatitude(pos.coords.latitude.toFixed(4));
                    setLongitude(pos.coords.longitude.toFixed(4));
                },
                () => {
                    // Fallback to Indore center
                    setLatitude('22.7196');
                    setLongitude('75.8577');
                }
            );
        }
    };

    // Handle Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const reportPayload = {
                title: title || `${hazardType.replace('_', ' ')} Alert`,
                description: description || 'Citizen reported ground hazard with GPS coordinates.',
                hazardType,
                latitude,
                longitude,
                reportedBy: 'citizen_arun'
            };

            const result = await submitReport(reportPayload, mediaFile);
            const trackingId = result.properties?.trackingId || `REP-${Math.floor(1000 + Math.random() * 9000)}`;
            setSubmittedTrackingId(trackingId);
            setSelectedTrackId(trackingId);
            setWizardStep(3); // Show confirmation
        } catch (err) {
            console.error('Submission failed:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setMediaFile(null);
        setMediaPreview(null);
        setMediaPhash(null);
        setIsDuplicateWarning(false);
        setSubmittedTrackingId(null);
        setWizardStep(1);
    };

    // Determine active stage of tracked incident
    const activeIncident = reports.find(r => r.properties?.trackingId === selectedTrackId)?.properties || reports[0]?.properties || {};
    
    const getStageIndex = (status) => {
        switch (status) {
            case 'REPORTED': return 1;
            case 'AI_CHECKED': return 2;
            case 'ADMIN_VERIFIED': return 3;
            case 'ACTIONED': return 4;
            case 'RESOLVED': return 5;
            default: return 2;
        }
    };

    const currentStageIndex = getStageIndex(activeIncident.status);

    return (
        <section id="report-tracker-section" className="section-container report-tracker-section">
            <div className="section-header-meta">
                <span className="section-eyebrow">Citizen Crowdsourcing & Transparency</span>
                <h2 className="section-title">Incident Reporting Portal & Lifecycle Tracker</h2>
                <p className="section-desc">
                    Submit verified ground observation with client-side media fingerprinting, and monitor end-to-end disaster response progression.
                </p>
            </div>

            <div className="report-tracker-layout">
                {/* Left Side: 3-Stage Reporting Wizard */}
                <div className="wizard-card-container">
                    <div className="wizard-header">
                        <div className="wizard-step-indicators">
                            <span className={`step-badge ${wizardStep >= 1 ? 'active' : ''}`}>1. Category</span>
                            <span className="step-arrow">→</span>
                            <span className={`step-badge ${wizardStep >= 2 ? 'active' : ''}`}>2. Evidence</span>
                            <span className="step-arrow">→</span>
                            <span className={`step-badge ${wizardStep === 3 ? 'active' : ''}`}>3. Verified</span>
                        </div>
                    </div>

                    {/* Step 1: Category & Location */}
                    {wizardStep === 1 && (
                        <div className="wizard-step-body">
                            <h3 className="wizard-step-title">Select Hazard & Location</h3>
                            <div className="hazard-select-grid">
                                {[
                                    { id: 'WATERLOGGING', label: 'Waterlogging', icon: '🌧️' },
                                    { id: 'FLASH_FLOOD', label: 'Flash Flood', icon: '🌊' },
                                    { id: 'CYCLONE_WIND', label: 'Squall / Wind', icon: '🌪️' },
                                    { id: 'TREE_FALL', label: 'Tree / Obstacle', icon: '🌲' }
                                ].map(h => (
                                    <button
                                        key={h.id}
                                        type="button"
                                        className={`hazard-choice-btn ${hazardType === h.id ? 'selected' : ''}`}
                                        onClick={() => setHazardType(h.id)}
                                    >
                                        <span className="hazard-choice-icon">{h.icon}</span>
                                        <span className="hazard-choice-label">{h.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="location-input-group">
                                <label className="input-label">GPS Geolocation</label>
                                <div className="gps-inputs-row">
                                    <input 
                                        type="text" 
                                        placeholder="Latitude" 
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        className="text-input"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Longitude" 
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        className="text-input"
                                    />
                                    <button 
                                        type="button" 
                                        className="gps-locate-btn"
                                        onClick={handleGetLocation}
                                        title="Auto-detect current GPS"
                                    >
                                        <MapPin size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="wizard-footer">
                                <button 
                                    type="button" 
                                    className="primary-action-btn"
                                    onClick={() => setWizardStep(2)}
                                >
                                    Proceed to Evidence →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Description & Media Upload */}
                    {wizardStep === 2 && (
                        <div className="wizard-step-body">
                            <h3 className="wizard-step-title">Incident Details & Photo Evidence</h3>
                            
                            <div className="input-field-group">
                                <label className="input-label">Incident Title</label>
                                <input 
                                    type="text"
                                    placeholder="e.g., Severe waterlogging near Vijay Nagar Square"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-input"
                                    required
                                />
                            </div>

                            <div className="input-field-group">
                                <label className="input-label">Field Description</label>
                                <textarea 
                                    placeholder="Describe depth, blocked roads, trapped people, or urgent assistance needed..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="textarea-input"
                                    rows={3}
                                />
                            </div>

                            <div className="input-field-group">
                                <label className="input-label">Upload Photo (with instant pHash verification)</label>
                                <label className="upload-dropzone">
                                    <UploadCloud size={24} className="text-brand-primary" />
                                    <span>Click to browse or take ground photo</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileChange}
                                        className="hidden-file-input"
                                    />
                                </label>

                                {mediaPreview && (
                                    <div className="media-preview-container">
                                        <img src={mediaPreview} alt="Uploaded incident preview" className="media-preview-img" />
                                        <div className="media-preview-meta">
                                            <span className="phash-tag">pHash: {mediaPhash || 'Computing...'}</span>
                                            {isDuplicateWarning && (
                                                <div className="duplicate-alert-badge">
                                                    ⚠️ Image hash matches an existing report!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="wizard-footer-buttons">
                                <button 
                                    type="button" 
                                    className="secondary-btn"
                                    onClick={() => setWizardStep(1)}
                                >
                                    ← Back
                                </button>
                                <button 
                                    type="button" 
                                    className="primary-action-btn"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Transmitting...' : 'Submit Incident Report'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {wizardStep === 3 && (
                        <div className="wizard-step-body confirmation-step">
                            <div className="success-icon-box">
                                <Check size={32} className="text-success" />
                            </div>
                            <h3 className="confirmation-title">Ground Report Transmitted</h3>
                            <p className="confirmation-desc">
                                Your incident is registered under tracking token:
                            </p>
                            <div className="tracking-token-display">
                                {submittedTrackingId || 'REP-VJ001'}
                            </div>
                            <p className="confirmation-note">
                                Multimodal verification has been dispatched to IMD correlation workers.
                            </p>
                            <button 
                                type="button" 
                                className="primary-action-btn"
                                onClick={resetForm}
                            >
                                File Another Observation
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side: Horizontal Incident Lifecycle Stepper */}
                <div className="lifecycle-card-container">
                    <div className="lifecycle-card-header">
                        <span className="card-subhead">Disaster Response Chain</span>
                        <h3 className="card-heading">End-to-End Incident Lifecycle</h3>
                        <div className="active-tracking-selector">
                            <label className="selector-label">Tracking Incident:</label>
                            <select 
                                value={selectedTrackId}
                                onChange={(e) => setSelectedTrackId(e.target.value)}
                                className="tracking-select"
                            >
                                {reports.map(r => (
                                    <option key={r.properties?.id} value={r.properties?.trackingId}>
                                        {r.properties?.trackingId} - {r.properties?.title?.slice(0, 30)}...
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 5-Stage Horizontal Stepper */}
                    <div className="horizontal-stepper">
                        {[
                            { step: 1, name: 'Reported', desc: 'Crowdsourced GPS Logged', icon: <MapPin size={16} /> },
                            { step: 2, name: 'AI Checked', desc: 'pHash & IMD Correlation', icon: <Cpu size={16} /> },
                            { step: 3, name: 'Authority Confirmed', desc: 'Commander Verification', icon: <Shield size={16} /> },
                            { step: 4, name: 'Teams Dispatched', desc: 'NDRF / Squad en Route', icon: <Truck size={16} /> },
                            { step: 5, name: 'Resolved', desc: 'Ground Safe / All Clear', icon: <Award size={16} /> }
                        ].map((s) => {
                            const isCompleted = s.step < currentStageIndex;
                            const isCurrent = s.step === currentStageIndex;

                            return (
                                <div key={s.step} className={`stepper-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                    <div className="stepper-icon-circle">
                                        {isCompleted ? <Check size={16} /> : s.icon}
                                    </div>
                                    <div className="stepper-text-group">
                                        <span className="stepper-node-name">{s.name}</span>
                                        <span className="stepper-node-desc">{s.desc}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Incident Summary Card */}
                    <div className="tracked-summary-box">
                        <div className="summary-row">
                            <span className="summary-label">Incident:</span>
                            <span className="summary-value">{activeIncident.title || 'Waterlogging Alert'}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Reported By:</span>
                            <span className="summary-value">{activeIncident.reportedBy || 'citizen_arun'} (Trust: {activeIncident.reporterTrustScore || 92} pts)</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Current Status:</span>
                            <span className="summary-value text-brand-primary">{activeIncident.status || 'REPORTED'}</span>
                        </div>
                        {activeIncident.actionNotes && (
                            <div className="summary-row">
                                <span className="summary-label">Dispatch Notes:</span>
                                <span className="summary-value text-success">{activeIncident.actionNotes}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

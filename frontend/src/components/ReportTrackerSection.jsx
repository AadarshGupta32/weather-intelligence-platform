/**
 * Report Tracker Section (Section 4: Citizen Incident Portal)
 * 3-Stage reporting wizard with client-side pHash media analysis,
 * 5-stage horizontal lifecycle stepper, and instant shelter finder
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { translations } from '../i18n/index.js';
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
    Navigation,
    Compass,
    ShieldAlert
} from 'lucide-react';

export default function ReportTrackerSection() {
    const { 
        submitReport, 
        reports, 
        language, 
        findNearestShelter, 
        nearestShelterResult,
        showToast,
        selectedCity
    } = useApp();

    const t = translations[language] || translations.en;

    // Wizard Form State
    const [wizardStep, setWizardStep] = useState(1);
    const [title, setTitle] = useState('');
    const [hazardType, setHazardType] = useState('WATERLOGGING');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState(selectedCity.lat.toString());
    const [longitude, setLongitude] = useState(selectedCity.lon.toString());
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
                    showToast('success', language === 'hi' ? 'GPS स्थान दर्ज किया गया' : 'GPS coordinates captured successfully');
                },
                () => {
                    // Fallback to selected city coordinates
                    setLatitude(selectedCity.lat.toString());
                    setLongitude(selectedCity.lon.toString());
                    showToast('info', language === 'hi' ? `${selectedCity.name} केंद्र निर्देशांक लागू किए गए` : `Centered to ${selectedCity.name} station coordinates`);
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

    const hazardChoices = [
        { id: 'WATERLOGGING', label: language === 'hi' ? 'जलभराव' : 'Waterlogging', icon: '🌧️' },
        { id: 'FLASH_FLOOD', label: language === 'hi' ? 'अचानक बाढ़' : 'Flash Flood', icon: '🌊' },
        { id: 'CYCLONE_WIND', label: language === 'hi' ? 'आंधी / तूफान' : 'Squall / Wind', icon: '🌪️' },
        { id: 'TREE_FALL', label: language === 'hi' ? 'पेड़ / मार्ग अवरोध' : 'Tree / Obstacle', icon: '🌲' }
    ];

    return (
        <section id="report-tracker-section" className="section-container report-tracker-section">
            <div className="section-header-meta">
                <span className="section-eyebrow">
                    {language === 'hi' ? 'नागरिक सहभागिता एवं पारदर्शिता' : 'Citizen Crowdsourcing & Transparency'}
                </span>
                <h2 className="section-title">{t.report.title}</h2>
                <p className="section-desc">{t.report.desc}</p>
            </div>

            <div className="report-tracker-layout">
                {/* Left Side: 3-Stage Reporting Wizard */}
                <div className="wizard-card-container">
                    <div className="wizard-header">
                        <div className="wizard-step-indicators">
                            <span className={`step-badge ${wizardStep >= 1 ? 'active' : ''}`}>{t.report.step1}</span>
                            <span className="step-arrow">→</span>
                            <span className={`step-badge ${wizardStep >= 2 ? 'active' : ''}`}>{t.report.step2}</span>
                            <span className="step-arrow">→</span>
                            <span className={`step-badge ${wizardStep === 3 ? 'active' : ''}`}>{t.report.step3}</span>
                        </div>
                    </div>

                    {/* Step 1: Category & Location */}
                    {wizardStep === 1 && (
                        <div className="wizard-step-body">
                            <h3 className="wizard-step-title">{t.report.catTitle}</h3>
                            <div className="hazard-select-grid">
                                {hazardChoices.map(h => (
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
                                <div className="location-label-row">
                                    <label className="input-label">
                                        {language === 'hi' ? 'जीपीएस भू-स्थान' : 'GPS Geolocation'}
                                    </label>
                                    <span className="city-anchor-tag">
                                        📍 {selectedCity.name}
                                    </span>
                                </div>
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
                                        title={t.report.detectLocation}
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
                                    {language === 'hi' ? 'साक्ष्य जोड़ें →' : 'Proceed to Evidence →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Description & Media Upload */}
                    {wizardStep === 2 && (
                        <div className="wizard-step-body">
                            <h3 className="wizard-step-title">{t.report.detailsTitle}</h3>
                            
                            <div className="input-field-group">
                                <label className="input-label">
                                    {language === 'hi' ? 'घटना का शीर्षक' : 'Incident Title'}
                                </label>
                                <input 
                                    type="text"
                                    placeholder={t.report.headlinePlaceholder}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-input"
                                    required
                                />
                            </div>

                            <div className="input-field-group">
                                <label className="input-label">
                                    {language === 'hi' ? 'विवरण एवं स्थिति' : 'Field Description'}
                                </label>
                                <textarea 
                                    placeholder={t.report.descPlaceholder}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="textarea-input"
                                    rows={3}
                                />
                            </div>

                            <div className="input-field-group">
                                <label className="input-label">
                                    {language === 'hi' 
                                        ? 'घटना की तस्वीर अपलोड करें (तुरंत pHash सत्यापन)' 
                                        : 'Upload Photo (with instant pHash verification)'}
                                </label>
                                <label className="upload-dropzone">
                                    <UploadCloud size={24} className="text-brand-primary" />
                                    <span>{t.report.uploadText}</span>
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
                                                    ⚠️ {language === 'hi' 
                                                        ? 'यह छवि पहले से दर्ज रिपोर्ट से मेल खाती है!' 
                                                        : 'Image hash matches an existing report!'}
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
                                    ← {language === 'hi' ? 'पीछे' : 'Back'}
                                </button>
                                <button 
                                    type="button" 
                                    className="primary-action-btn"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (language === 'hi' ? 'भेजा जा रहा है...' : 'Transmitting...') : t.report.submitBtn}
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
                            <h3 className="confirmation-title">
                                {language === 'hi' ? 'जमीनी रिपोर्ट सफलतापूर्वक प्रेषित' : 'Ground Report Transmitted'}
                            </h3>
                            <p className="confirmation-desc">
                                {language === 'hi' 
                                    ? 'आपकी घटना ट्रैकिंग टोकन के तहत पंजीकृत है:' 
                                    : 'Your incident is registered under tracking token:'}
                            </p>
                            <div className="tracking-token-display">
                                {submittedTrackingId || 'REP-VJ001'}
                            </div>
                            <p className="confirmation-note">
                                {language === 'hi' 
                                    ? 'बहु-मॉडल सत्यापन IMD सहसंबंध प्रणाली को भेज दिया गया है।' 
                                    : 'Multimodal verification has been dispatched to IMD correlation workers.'}
                            </p>
                            <button 
                                type="button" 
                                className="primary-action-btn"
                                onClick={resetForm}
                            >
                                {language === 'hi' ? 'एक और घटना दर्ज करें' : 'File Another Observation'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side: Horizontal Incident Lifecycle Stepper & Quick Shelter Widget */}
                <div className="lifecycle-card-container">
                    <div className="lifecycle-card-header">
                        <span className="card-subhead">
                            {language === 'hi' ? 'आपदा प्रतिक्रिया श्रृंखला' : 'Disaster Response Chain'}
                        </span>
                        <h3 className="card-heading">
                            {language === 'hi' ? 'घटना की प्रगति एवं जीवनचक्र' : 'End-to-End Incident Lifecycle'}
                        </h3>
                        <div className="active-tracking-selector">
                            <label className="selector-label">
                                {language === 'hi' ? 'सक्रिय घटना:' : 'Tracking Incident:'}
                            </label>
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
                            { 
                                step: 1, 
                                name: language === 'hi' ? 'दर्ज' : 'Reported', 
                                desc: language === 'hi' ? 'GPS आधारित' : 'Crowdsourced GPS', 
                                icon: <MapPin size={16} /> 
                            },
                            { 
                                step: 2, 
                                name: language === 'hi' ? 'AI जांच' : 'AI Checked', 
                                desc: language === 'hi' ? 'pHash व रडार' : 'pHash & IMD Match', 
                                icon: <Cpu size={16} /> 
                            },
                            { 
                                step: 3, 
                                name: language === 'hi' ? 'सत्यापित' : 'Confirmed', 
                                desc: language === 'hi' ? 'कमांड सेंटर' : 'Commander Verify', 
                                icon: <Shield size={16} /> 
                            },
                            { 
                                step: 4, 
                                name: language === 'hi' ? 'दल रवाना' : 'Dispatched', 
                                desc: language === 'hi' ? 'NDRF मार्ग में' : 'NDRF Squad Active', 
                                icon: <Truck size={16} /> 
                            },
                            { 
                                step: 5, 
                                name: language === 'hi' ? 'सुरक्षित' : 'Resolved', 
                                desc: language === 'hi' ? 'मार्ग साफ' : 'All Clear / Safe', 
                                icon: <Award size={16} /> 
                            }
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
                            <span className="summary-label">
                                {language === 'hi' ? 'घटना:' : 'Incident:'}
                            </span>
                            <span className="summary-value">{activeIncident.title || 'Waterlogging Alert'}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">
                                {language === 'hi' ? 'रिपोर्टकर्ता:' : 'Reported By:'}
                            </span>
                            <span className="summary-value">{activeIncident.reportedBy || 'citizen_arun'} ({language === 'hi' ? 'स्कोर' : 'Trust'}: {activeIncident.reporterTrustScore || 92} pts)</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">
                                {language === 'hi' ? 'वर्तमान स्थिति:' : 'Current Status:'}
                            </span>
                            <span className="summary-value text-brand-primary">{activeIncident.status || 'REPORTED'}</span>
                        </div>
                        {activeIncident.actionNotes && (
                            <div className="summary-row">
                                <span className="summary-label">
                                    {language === 'hi' ? 'प्रतिक्रिया विवरण:' : 'Dispatch Notes:'}
                                </span>
                                <span className="summary-value text-success">{activeIncident.actionNotes}</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Shelter Assistant Card */}
                    <div className="shelter-quick-assistant-card">
                        <div className="shelter-assistant-header">
                            <div className="assistant-title-group">
                                <Compass size={18} className="text-brand-primary" />
                                <div>
                                    <h4 className="assistant-heading">
                                        {language === 'hi' ? 'आपातकालीन राहत शिविर सहायक' : 'Emergency Shelter Assistant'}
                                    </h4>
                                    <p className="assistant-sub">
                                        {language === 'hi' 
                                            ? `${selectedCity.name} क्षेत्र में निकटतम सुरक्षित निकासी बिंदु खोजें` 
                                            : `Locate closest safe shelter & evacuation route in ${selectedCity.name}`}
                                    </p>
                                </div>
                            </div>
                            <button 
                                className="shelter-quick-trigger-btn"
                                onClick={() => findNearestShelter()}
                            >
                                <Navigation size={14} />
                                <span>{language === 'hi' ? 'खोजें' : 'Locate'}</span>
                            </button>
                        </div>

                        {nearestShelterResult && (
                            <div className="shelter-quick-result">
                                <div className="shelter-result-header">
                                    <span className="shelter-result-name">
                                        🏥 {nearestShelterResult.shelter.name}
                                    </span>
                                    <span className="shelter-result-dist">
                                        {nearestShelterResult.distanceKm} km {language === 'hi' ? 'दूर' : 'away'}
                                    </span>
                                </div>
                                <div className="shelter-result-details">
                                    <span>👥 {language === 'hi' ? 'क्षमता:' : 'Capacity:'} {nearestShelterResult.shelter.capacity} {language === 'hi' ? 'व्यक्ति' : 'people'}</span>
                                    <span>•</span>
                                    <span>📞 {nearestShelterResult.shelter.contact || '1077'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}


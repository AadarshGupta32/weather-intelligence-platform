/**
 * Incident Feed Section (Section 3: Verified Ground Truth Stream)
 * De-cluttered 2-column card layout with AI rumor forensics and instant action triggers
 * Enhanced with dual-language support, speech synthesis readout, and quick sharing
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { translations } from '../i18n/index.js';
import { 
    formatDate, 
    formatRelativeTime, 
    getSeverityStyle, 
    getStatusStyle, 
    getHazardMeta,
    getBadgeDetails 
} from '../utils/formatters.js';
import { 
    Search, 
    Filter, 
    MapPin, 
    ShieldCheck, 
    AlertCircle, 
    Navigation, 
    Cpu, 
    CheckCircle, 
    XCircle,
    CopyCheck,
    Volume2,
    VolumeX,
    Share2,
    Check
} from 'lucide-react';

export default function IncidentFeedSection() {
    const { 
        reports, 
        activeRole, 
        focusIncidentOnMap, 
        openForensics, 
        openActionModal,
        verifyReport,
        language,
        showToast
    } = useApp();

    const t = translations[language] || translations.en;

    const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'VERIFIED' | 'CRITICAL' | 'RUMORS'
    const [searchTerm, setSearchTerm] = useState('');
    const [speakingId, setSpeakingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // Text to Speech Accessibility for Emergency Reports
    const handleReadAloud = (feature) => {
        const p = feature.properties || {};
        if (!('speechSynthesis' in window)) {
            showToast('warning', 'Speech synthesis is not supported in this browser.');
            return;
        }

        if (speakingId === p.id) {
            window.speechSynthesis.cancel();
            setSpeakingId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const textToRead = `${p.title}. ${p.description}. Severity: ${p.severity}. Location: ${p.city || 'Indore'}.`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.95;

        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);

        setSpeakingId(p.id);
        window.speechSynthesis.speak(utterance);
    };

    // Quick Share or Copy Incident Details
    const handleShare = async (feature) => {
        const p = feature.properties || {};
        const shareData = {
            title: `SURAKSHA-NET: ${p.title}`,
            text: `[EMERGENCY GROUND TRUTH] ${p.title} - Severity: ${p.severity}. Location: ${p.city || 'Indore'}. Details: ${p.description}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                // Ignore user abort
            }
        }

        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareData.text} | ${shareData.url}`);
        setCopiedId(p.id);
        showToast('success', language === 'hi' ? 'आपदा चेतावनी लिंक कॉपी किया गया' : 'Emergency alert link copied to clipboard');
        setTimeout(() => setCopiedId(null), 2500);
    };

    const filteredReports = reports.filter(item => {
        const p = item.properties || {};
        const matchesSearch = 
            (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.hazardType || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'VERIFIED') {
            return p.status === 'ADMIN_VERIFIED' || p.status === 'ACTIONED';
        }
        if (activeTab === 'CRITICAL') {
            return p.severity === 'CRITICAL';
        }
        if (activeTab === 'RUMORS') {
            return p.isRumor || p.status === 'FALSE_ALARM' || (p.rumorScore && p.rumorScore > 0.6);
        }
        return true;
    });

    return (
        <section id="incident-feed-section" className="section-container incident-feed-section">
            <div className="section-header-meta">
                <span className="section-eyebrow">
                    {language === 'hi' ? 'नागरिक जमीनी अवलोकन' : 'Crowdsourced Ground Observation'}
                </span>
                <h2 className="section-title">{t.feed.title}</h2>
                <p className="section-desc">{t.feed.desc}</p>
            </div>

            {/* Filter Bar & Search */}
            <div className="feed-toolbar-container">
                <div className="feed-tabs">
                    <button 
                        className={`feed-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ALL')}
                    >
                        {t.feed.all} ({reports.length})
                    </button>
                    <button 
                        className={`feed-tab-btn ${activeTab === 'VERIFIED' ? 'active' : ''}`}
                        onClick={() => setActiveTab('VERIFIED')}
                    >
                        {t.feed.verified}
                    </button>
                    <button 
                        className={`feed-tab-btn ${activeTab === 'CRITICAL' ? 'active' : ''}`}
                        onClick={() => setActiveTab('CRITICAL')}
                    >
                        {t.feed.critical}
                    </button>
                    <button 
                        className={`feed-tab-btn ${activeTab === 'RUMORS' ? 'active' : ''}`}
                        onClick={() => setActiveTab('RUMORS')}
                    >
                        {t.feed.rumors}
                    </button>
                </div>

                <div className="feed-search-box">
                    <Search size={16} className="search-icon" />
                    <input 
                        type="text"
                        placeholder={t.feed.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="feed-search-input"
                    />
                </div>
            </div>

            {/* 2-Column De-cluttered Card Grid */}
            <div className="feed-cards-grid">
                {filteredReports.map((feature) => {
                    const p = feature.properties || {};
                    const sevStyle = getSeverityStyle(p.severity);
                    const statStyle = getStatusStyle(p.status);
                    const hazardMeta = getHazardMeta(p.hazardType);
                    const badgeMeta = getBadgeDetails(p.reporterBadge);

                    const isRumor = p.isRumor || p.rumorScore > 0.6;
                    const isSpeaking = speakingId === p.id;
                    const isCopied = copiedId === p.id;

                    return (
                        <div key={p.id || Math.random()} className={`incident-card ${isRumor ? 'card-rumor' : ''}`}>
                            {/* Card Top Row: Badges & ID */}
                            <div className="card-top-row">
                                <div className="card-badge-group">
                                    <span className="hazard-pill" style={{ borderColor: hazardMeta.color }}>
                                        <span>{hazardMeta.icon}</span>
                                        <span>{hazardMeta.label}</span>
                                    </span>
                                    <span className="severity-pill" style={{ backgroundColor: sevStyle.bg, color: sevStyle.text }}>
                                        {sevStyle.label}
                                    </span>
                                    <span className="status-pill" style={{ backgroundColor: statStyle.bg, color: statStyle.text }}>
                                        {statStyle.label}
                                    </span>
                                </div>
                                
                                <div className="card-top-actions">
                                    {/* Text to Speech audio button */}
                                    <button 
                                        className={`card-util-icon-btn ${isSpeaking ? 'active-audio' : ''}`}
                                        onClick={() => handleReadAloud(feature)}
                                        title={isSpeaking ? "Stop audio readout" : "Listen to incident"}
                                    >
                                        {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                                    </button>

                                    {/* Share Button */}
                                    <button 
                                        className="card-util-icon-btn"
                                        onClick={() => handleShare(feature)}
                                        title="Share or copy emergency alert"
                                    >
                                        {isCopied ? <Check size={15} className="text-success" /> : <Share2 size={15} />}
                                    </button>

                                    <span className="tracking-id-text">{p.trackingId || `REP-${p.id}`}</span>
                                </div>
                            </div>

                            {/* Card Title & Content */}
                            <h3 className="card-title">{p.title}</h3>
                            <p className="card-description">{p.description}</p>

                            {/* Duplicate Image Warning if detected */}
                            {p.duplicateFlag && (
                                <div className="duplicate-alert-banner">
                                    <CopyCheck size={14} className="text-warning" />
                                    <span>
                                        {language === 'hi' 
                                            ? 'pHash मिलान द्वारा पुरानी / भ्रामक छवि पाई गई' 
                                            : 'Recycled crisis image detected via pHash matching'}
                                    </span>
                                </div>
                            )}

                            {/* AI Verification & Sentinel Trust Bar */}
                            <div className="card-trust-metadata">
                                <div className="metadata-item">
                                    <span className="metadata-label">
                                        {language === 'hi' ? 'नागरिक' : 'Reporter'}
                                    </span>
                                    <div className="reporter-chip">
                                        <span>{badgeMeta.icon}</span>
                                        <span className="reporter-name">{p.reportedBy || 'citizen_scout'}</span>
                                        <span className="trust-score">({p.reporterTrustScore || 85} pts)</span>
                                    </div>
                                </div>

                                <div className="metadata-item">
                                    <span className="metadata-label">
                                        {language === 'hi' ? 'AI अफवाह जोखिम' : 'AI Rumor Risk'}
                                    </span>
                                    <div className="rumor-meter-wrapper">
                                        <div 
                                            className="rumor-meter-fill"
                                            style={{ 
                                                width: `${Math.round((p.rumorScore || 0.05) * 100)}%`,
                                                backgroundColor: isRumor ? '#FA383E' : '#31A24C'
                                            }}
                                        />
                                        <span className="rumor-percentage">
                                            {Math.round((p.rumorScore || 0.05) * 100)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="metadata-item">
                                    <span className="metadata-label">
                                        {language === 'hi' ? 'समय' : 'Time'}
                                    </span>
                                    <span className="metadata-value">{formatRelativeTime(p.createdAt)}</span>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="card-action-bar">
                                <button 
                                    className="card-btn btn-focus-map"
                                    onClick={() => focusIncidentOnMap(feature)}
                                >
                                    <Navigation size={14} />
                                    <span>{t.feed.focusMap}</span>
                                </button>

                                <button 
                                    className="card-btn btn-forensics"
                                    onClick={() => openForensics(feature)}
                                >
                                    <Cpu size={14} />
                                    <span>{t.feed.forensics}</span>
                                </button>

                                {activeRole === 'OPS_DISPATCHER' && (
                                    <>
                                        <button 
                                            className="card-btn btn-dispatch"
                                            onClick={() => openActionModal(feature)}
                                        >
                                            {t.feed.dispatch}
                                        </button>

                                        {p.status !== 'ADMIN_VERIFIED' && !isRumor && (
                                            <button 
                                                className="card-btn btn-verify-quick"
                                                onClick={() => verifyReport(p.id, true)}
                                                title="Confirm Ground Truth"
                                            >
                                                <CheckCircle size={14} />
                                            </button>
                                        )}

                                        {!isRumor && (
                                            <button 
                                                className="card-btn btn-flag-quick"
                                                onClick={() => verifyReport(p.id, false)}
                                                title="Flag as False Alarm"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredReports.length === 0 && (
                    <div className="empty-feed-placeholder">
                        <AlertCircle size={32} className="text-secondary" />
                        <p>
                            {language === 'hi' 
                                ? 'खोज या फ़िल्टर के अनुसार कोई घटना नहीं मिली।' 
                                : 'No incidents match the active search or filter criteria.'}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

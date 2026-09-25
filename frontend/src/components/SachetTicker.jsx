/**
 * NDMA SACHET National Disaster Alert Ticker
 * Real-time Common Alerting Protocol (CAP) live feed from National Disaster Management Authority
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Radio, AlertOctagon, ChevronDown, ChevronUp, ExternalLink, ShieldAlert } from 'lucide-react';

export default function SachetTicker() {
    const { nationalAlerts, language } = useApp();
    const [expanded, setExpanded] = useState(false);

    if (!nationalAlerts || nationalAlerts.length === 0) return null;

    const topAlert = nationalAlerts[0];
    const isExtreme = topAlert.severity?.toLowerCase() === 'extreme' || topAlert.severity?.toLowerCase() === 'high';

    return (
        <aside className={`sachet-marquee-container ${isExtreme ? 'sachet-alert-extreme' : 'sachet-alert-warning'}`} aria-label="National Disaster Alerts">
            <div className="sachet-marquee-inner">
                {/* Left Live Badge */}
                <div className="sachet-badge-group">
                    <span className="sachet-live-ping"></span>
                    <span className="sachet-agency-title">NDMA SACHET</span>
                    <span className="sachet-severity-tag">{topAlert.severity || 'Urgent'}</span>
                </div>

                {/* Marquee Content */}
                <div className="sachet-headline-text">
                    <strong>{topAlert.event || 'Severe Weather Warning'}:</strong> {topAlert.areaDesc || 'Central India'} — {topAlert.instruction || 'Follow local authorities & evacuation guidance.'}
                </div>

                {/* Expand / Collapse Button */}
                <div className="sachet-actions">
                    <button 
                        className="sachet-toggle-btn"
                        onClick={() => setExpanded(!expanded)}
                        title="Toggle Detailed SACHET Advisory"
                    >
                        <span>{expanded ? (language === 'hi' ? 'छिपाएं' : 'Less') : (language === 'hi' ? 'विवरण' : 'Details')}</span>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* Expanded Multi-Alert Drawer */}
            {expanded && (
                <div className="sachet-expanded-drawer">
                    <div className="sachet-drawer-header">
                        <span className="drawer-title">
                            <ShieldAlert size={16} className="text-danger" />
                            {language === 'hi' ? 'सक्रिय राष्ट्रीय चेतावनी बुलेटिन (NDMA CAP)' : 'Active National CAP Warning Feed'}
                        </span>
                        <span className="drawer-count">{nationalAlerts.length} Alerts Active</span>
                    </div>

                    <div className="sachet-alerts-grid">
                        {nationalAlerts.map((alt, idx) => (
                            <div key={alt.id || idx} className="sachet-alert-card">
                                <div className="card-severity-row">
                                    <span className={`alert-level-pill ${alt.severity?.toLowerCase() === 'extreme' ? 'level-extreme' : 'level-severe'}`}>
                                        {alt.severity}
                                    </span>
                                    <span className="alert-area">{alt.areaDesc}</span>
                                </div>
                                <h4 className="alert-event-name">{alt.event}</h4>
                                <p className="alert-instruction-text">{alt.instruction}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}

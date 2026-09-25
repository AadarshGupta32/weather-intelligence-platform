/**
 * Hero Section (Section 1: Operational Overview)
 * Meta-minimalist operational telemetry metrics with micro-trend badges
 * and multi-parameter meteorological sensors
 */
import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { 
    AlertTriangle, 
    ShieldCheck, 
    Home, 
    Wind, 
    Droplets, 
    Gauge,
    ArrowUpRight,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

export default function HeroSection() {
    const { reports, shelters, telemetry, selectedCity, t, language } = useApp();

    const totalReports = reports.length;
    const criticalCount = reports.filter(r => r.properties?.severity === 'CRITICAL').length;
    const verifiedCount = reports.filter(r => r.properties?.status === 'ADMIN_VERIFIED' || r.properties?.status === 'ACTIONED').length;
    const rumorCount = reports.filter(r => r.properties?.isRumor || r.properties?.status === 'FALSE_ALARM').length;
    const verificationRate = totalReports > 0 ? Math.round((verifiedCount / totalReports) * 100) : 85;

    const totalSlots = shelters.reduce((acc, s) => acc + (s.availableSlots || 0), 0);
    const totalCapacity = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);

    return (
        <section id="operational-overview" className="section-container hero-section">
            <div className="section-header-meta">
                <div className="section-badge-row">
                    <span className="section-eyebrow">
                        {language === 'hi' ? 'वास्तविक समय परिचालन तत्परता' : 'Real-Time Operational Readiness'}
                    </span>
                    <span className="station-lock-tag">
                        📍 {selectedCity} Meteorological Substation
                    </span>
                </div>
                <h1 className="section-title">
                    {language === 'hi' 
                        ? 'राष्ट्रीय मौसम आसूचना एवं आपातकालीन समन्वय केंद्र' 
                        : 'National Weather Intelligence & Emergency Response Platform'}
                </h1>
                <p className="section-desc">
                    {language === 'hi'
                        ? 'मौसम विज्ञान विभाग (IMD) के डॉपलर रडार, नागरिक रिपोर्टों और त्वरित बचाव इकाइयों का एकीकृत समन्वय मंच।'
                        : 'AI-powered multimodal verification synthesizing official IMD radar telemetry, crowdsourced sentinel feeds, and duplicate forensics.'}
                </p>
            </div>

            {/* 4-Card Meta-Minimalist Operational Metrics Grid */}
            <div className="hero-metrics-grid">
                {/* Metric 1: Active Incidents */}
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-card-title">{t.metrics.activeIncidents}</span>
                        <div className="metric-icon-box bg-danger-subtle">
                            <AlertTriangle size={18} className="text-danger" />
                        </div>
                    </div>
                    <div className="metric-value-row">
                        <span className="metric-value">{totalReports}</span>
                        <span className="metric-badge badge-danger">
                            {criticalCount} {t.metrics.critical}
                        </span>
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">
                            {language === 'hi' ? `${selectedCity} क्षेत्र में दर्ज नागरिक एवं सेंसर अवलोकन` : `Crowdsourced & sensor-reported across ${selectedCity} Metro`}
                        </span>
                    </div>
                </div>

                {/* Metric 2: AI Verification Rate */}
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-card-title">{t.metrics.accuracy}</span>
                        <div className="metric-icon-box bg-success-subtle">
                            <ShieldCheck size={18} className="text-success" />
                        </div>
                    </div>
                    <div className="metric-value-row">
                        <span className="metric-value">{verificationRate}%</span>
                        <span className="metric-badge badge-success">
                            {rumorCount} {t.metrics.rumorsFiltered}
                        </span>
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">
                            {language === 'hi' ? 'pHash छवि फिंगरप्रिंट और रडार वर्षा द्वारा सत्यापित' : 'Multimodal cross-check with IMD precipitation & pHash'}
                        </span>
                    </div>
                </div>

                {/* Metric 3: Evacuation Capacity */}
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-card-title">{t.metrics.shelters}</span>
                        <div className="metric-icon-box bg-primary-subtle">
                            <Home size={18} className="text-primary" />
                        </div>
                    </div>
                    <div className="metric-value-row">
                        <span className="metric-value">{totalSlots}</span>
                        <span className="metric-badge badge-primary">
                            {shelters.length} {t.metrics.facilitiesActive}
                        </span>
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">
                            {language === 'hi' ? `उपलब्ध बिस्तर: ${totalSlots} / ${totalCapacity} तुरंत भर्ती हेतु` : `Available capacity: ${totalSlots} / ${totalCapacity} beds ready`}
                        </span>
                    </div>
                </div>

                {/* Metric 4: IMD Doppler Telemetry */}
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-card-title">{t.metrics.radar}</span>
                        <div className="metric-icon-box bg-warning-subtle">
                            <Wind size={18} className="text-warning" />
                        </div>
                    </div>
                    <div className="metric-value-row">
                        <span className="metric-value">
                            {telemetry.precipitationMm !== undefined ? telemetry.precipitationMm : 0} 
                            <span className="metric-unit"> mm</span>
                        </span>
                        <span className="metric-badge badge-info">
                            {telemetry.windSpeedKmh || 13} km/h {t.metrics.wind}
                        </span>
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">
                            {language === 'hi' ? 'स्थिति:' : 'Status:'} {telemetry.floodRiskLevel || 'NORMAL_READINESS'} ({selectedCity} Doppler Station)
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

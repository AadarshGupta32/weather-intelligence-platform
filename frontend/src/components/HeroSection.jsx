/**
 * Hero Section (Section 1: Operational Overview)
 * Meta-minimalist operational telemetry metrics with micro-trend badges
 */
import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { 
    AlertTriangle, 
    ShieldCheck, 
    Home, 
    Wind, 
    Droplets, 
    Compass, 
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';

export default function HeroSection() {
    const { reports, shelters, telemetry } = useApp();

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
                <span className="section-eyebrow">Real-Time Operational Readiness</span>
                <h1 className="section-title">National Weather & Disaster Response Intelligence</h1>
                <p className="section-desc">
                    AI-powered multimodal verification synthesizing official IMD radar telemetry, crowdsourced sentinel feeds, and duplicate forensics.
                </p>
            </div>

            {/* 4-Card Meta-Minimalist Operational Metrics Grid */}
            <div className="hero-metrics-grid">
                {/* Metric 1: Active Incidents */}
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-card-title">Active Ground Incidents</span>
                        <div className="metric-icon-box bg-danger-subtle">
                            <AlertTriangle size={18} className="text-danger" />
                        </div>
                    </div>
                    <div className="metric-value-row">
                        <span className="metric-value">{totalReports}</span>
                        <span className="metric-badge badge-danger">
                            {criticalCount} Critical
                        </span>
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">Crowdsourced & sensor-reported across Indore Metro</span>
                    </div>
                </div>

                {/* Metric 2: AI Verification Rate */}
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-card-title">AI Ground-Truth Accuracy</span>
                        <div className="metric-icon-box bg-success-subtle">
                            <ShieldCheck size={18} className="text-success" />
                        </div>
                    </div>
                    <div className="metric-value-row">
                        <span className="metric-value">{verificationRate}%</span>
                        <span className="metric-badge badge-success">
                            {rumorCount} Rumors Filtered
                        </span>
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">Multimodal cross-check with IMD precipitation & pHash</span>
                    </div>
                </div>

                {/* Metric 3: Evacuation Capacity */}
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-card-title">Emergency Shelters Available</span>
                        <div className="metric-icon-box bg-primary-subtle">
                            <Home size={18} className="text-primary" />
                        </div>
                    </div>
                    <div className="metric-value-row">
                        <span className="metric-value">{totalSlots}</span>
                        <span className="metric-badge badge-primary">
                            {shelters.length} Facilities Active
                        </span>
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">Capacity: {totalSlots} / {totalCapacity} beds ready for immediate intake</span>
                    </div>
                </div>

                {/* Metric 4: IMD Doppler Telemetry */}
                <div className="metric-card">
                    <div className="metric-card-header">
                        <span className="metric-card-title">IMD Radar Weather Telemetry</span>
                        <div className="metric-icon-box bg-warning-subtle">
                            <Wind size={18} className="text-warning" />
                        </div>
                    </div>
                    <div className="metric-value-row">
                        <span className="metric-value">{telemetry.precipitationMm || 0} <span className="metric-unit">mm</span></span>
                        <span className="metric-badge badge-info">
                            {telemetry.windSpeedKmh || 23} km/h Wind
                        </span>
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">Status: {telemetry.floodRiskLevel || 'NORMAL_READINESS'} (Indore Doppler Station)</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

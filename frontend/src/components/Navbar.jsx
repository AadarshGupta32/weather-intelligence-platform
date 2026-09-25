/**
 * Navbar Component
 * Meta-minimalist navigation with role switcher, tactical actions, and audio/theme toggles
 */
import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { 
    Shield, 
    Radio, 
    FileText, 
    PlayCircle, 
    Volume2, 
    VolumeX, 
    Sun, 
    Moon, 
    User, 
    Flame,
    Activity
} from 'lucide-react';

export default function Navbar() {
    const { 
        activeRole, 
        toggleRole, 
        theme, 
        toggleTheme, 
        soundEnabled, 
        toggleSound, 
        downloadSitrep, 
        openSimulationModal,
        telemetry
    } = useApp();

    const isOps = activeRole === 'OPS_DISPATCHER';

    return (
        <header className="navbar-header">
            <div className="navbar-container">
                {/* Brand & Authority */}
                <div className="navbar-brand-group">
                    <div className="brand-logo-icon">
                        <Shield size={22} className="text-brand-primary" />
                    </div>
                    <div>
                        <div className="brand-title-row">
                            <span className="brand-title">SURAKSHA-NET</span>
                            <span className="brand-live-badge">
                                <span className="pulse-dot"></span>
                                LIVE
                            </span>
                        </div>
                        <span className="brand-subtitle">
                            National Weather Intelligence & Ground Truth System
                        </span>
                    </div>
                </div>

                {/* Center Weather Alert Badge */}
                <div className="navbar-center-telemetry">
                    <div className="telemetry-pill">
                        <Activity size={14} className="text-brand-primary" />
                        <span className="telemetry-city">{telemetry.city || 'Indore'}</span>
                        <span className="telemetry-divider">•</span>
                        <span className="telemetry-metric">{telemetry.temperature || 31}°C</span>
                        <span className="telemetry-divider">•</span>
                        <span className={`telemetry-status ${telemetry.precipitationMm > 50 ? 'status-alert' : 'status-ok'}`}>
                            {telemetry.precipitationMm > 0 ? `${telemetry.precipitationMm} mm rain` : 'Fair Weather'}
                        </span>
                    </div>
                </div>

                {/* Right Controls */}
                <div className="navbar-controls-group">
                    {/* Role Switcher Pill */}
                    <div className="role-switch-container">
                        <button 
                            className={`role-switch-btn ${!isOps ? 'active' : ''}`}
                            onClick={() => !isOps || toggleRole()}
                            title="Switch to Citizen Scout View"
                        >
                            <User size={14} />
                            <span>Citizen</span>
                        </button>
                        <button 
                            className={`role-switch-btn ${isOps ? 'active' : ''}`}
                            onClick={() => isOps || toggleRole()}
                            title="Switch to Ops Commander View"
                        >
                            <Radio size={14} />
                            <span>Ops Center</span>
                        </button>
                    </div>

                    {/* SITREP Tactical Export */}
                    <button 
                        className="control-icon-btn sitrep-btn"
                        onClick={downloadSitrep}
                        title="Download Operational SITREP Report"
                    >
                        <FileText size={16} />
                        <span className="btn-label-desktop">SITREP</span>
                    </button>

                    {/* Crisis Simulation Trigger */}
                    <button 
                        className="control-icon-btn simulation-btn"
                        onClick={openSimulationModal}
                        title="Open Crisis Simulation Scenarios"
                    >
                        <PlayCircle size={16} />
                        <span className="btn-label-desktop">Simulate</span>
                    </button>

                    {/* Audio Toggle */}
                    <button 
                        className="control-icon-btn"
                        onClick={toggleSound}
                        title={soundEnabled ? "Mute audio alerts" : "Enable audio alerts"}
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>

                    {/* Theme Toggle */}
                    <button 
                        className="control-icon-btn"
                        onClick={toggleTheme}
                        title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                    >
                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                </div>
            </div>
        </header>
    );
}

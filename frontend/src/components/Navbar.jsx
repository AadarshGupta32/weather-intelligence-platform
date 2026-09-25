/**
 * Navbar Component
 * Meta-minimalist navigation with bilingual switcher (EN/HI),
 * city weather picker, role toggle, and tactical commands
 */
import React from 'react';
import { useApp, INDIAN_CITIES } from '../context/AppContext.jsx';
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
    Languages,
    Activity,
    BellRing,
    MapPin
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
        openBroadcastModal,
        selectedCity,
        changeCity,
        telemetry,
        language,
        toggleLanguage,
        t
    } = useApp();

    const isOps = activeRole === 'OPS_DISPATCHER';

    return (
        <header className="navbar-header" aria-label="Main Navigation">
            <div className="navbar-container">
                {/* Brand & Authority */}
                <div className="navbar-brand-group">
                    <div className="brand-logo-icon">
                        <Shield size={22} className="text-brand-primary" />
                    </div>
                    <div>
                        <div className="brand-title-row">
                            <span className="brand-title">{t.app.title}</span>
                            <span className="brand-live-badge">
                                <span className="pulse-dot"></span>
                                {t.app.live}
                            </span>
                        </div>
                        <span className="brand-subtitle">{t.app.subtitle}</span>
                    </div>
                </div>

                {/* Center Weather & City Selector */}
                <div className="navbar-center-telemetry">
                    <div className="telemetry-pill">
                        <MapPin size={13} className="text-brand-primary" />
                        <select 
                            value={selectedCity}
                            onChange={(e) => changeCity(e.target.value)}
                            className="city-nav-select"
                            title="Switch City Meteorological Station"
                        >
                            {INDIAN_CITIES.map(c => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                        <span className="telemetry-divider">•</span>
                        <span className="telemetry-metric">{telemetry.temperature || 24}°C</span>
                        <span className="telemetry-divider">•</span>
                        <span className={`telemetry-status ${telemetry.precipitationMm > 40 ? 'status-alert' : 'status-ok'}`}>
                            {telemetry.precipitationMm > 0 ? `${telemetry.precipitationMm} mm` : '0 mm rain'}
                        </span>
                    </div>
                </div>

                {/* Right Controls */}
                <div className="navbar-controls-group">
                    {/* Bilingual Switcher (EN / HI) */}
                    <button 
                        className="control-icon-btn lang-switch-btn"
                        onClick={toggleLanguage}
                        title={language === 'en' ? "हिंदी में बदलें (Switch to Hindi)" : "Switch to English"}
                    >
                        <Languages size={15} />
                        <span className="lang-code-text">{language === 'en' ? 'हि' : 'EN'}</span>
                    </button>

                    {/* Role Switcher Pill */}
                    <div className="role-switch-container">
                        <button 
                            className={`role-switch-btn ${!isOps ? 'active' : ''}`}
                            onClick={() => !isOps || toggleRole()}
                            title="Switch to Citizen Scout View"
                        >
                            <User size={13} />
                            <span>{t.app.roleCitizen}</span>
                        </button>
                        <button 
                            className={`role-switch-btn ${isOps ? 'active' : ''}`}
                            onClick={() => isOps || toggleRole()}
                            title="Switch to Ops Commander View"
                        >
                            <Radio size={13} />
                            <span>{t.app.roleCommander}</span>
                        </button>
                    </div>

                    {/* Mass Broadcast Alert (Commander Only) */}
                    {isOps && (
                        <button 
                            className="control-icon-btn broadcast-trigger-btn"
                            onClick={openBroadcastModal}
                            title="Dispatch Mass Emergency Broadcast"
                        >
                            <BellRing size={15} className="text-danger" />
                            <span className="btn-label-desktop text-danger">{t.app.broadcast}</span>
                        </button>
                    )}

                    {/* SITREP Tactical Export */}
                    <button 
                        className="control-icon-btn sitrep-btn"
                        onClick={downloadSitrep}
                        title="Download Operational SITREP Report"
                    >
                        <FileText size={15} />
                        <span className="btn-label-desktop">{t.app.sitrep}</span>
                    </button>

                    {/* Crisis Simulation Trigger */}
                    <button 
                        className="control-icon-btn simulation-btn"
                        onClick={openSimulationModal}
                        title="Open Crisis Simulation Scenarios"
                    >
                        <PlayCircle size={15} />
                        <span className="btn-label-desktop">{t.app.simulate}</span>
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

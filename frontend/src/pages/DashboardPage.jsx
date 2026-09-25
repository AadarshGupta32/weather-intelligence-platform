/**
 * Dashboard Page
 * Main page coordinating the 5 meta-minimalist vertical sections,
 * sticky sub-navigation, tactical modals, NDMA SACHET alert ticker,
 * emergency speed-dial bar, and live toast notifications
 */
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import SachetTicker from '../components/SachetTicker.jsx';
import EmergencyHotlineBar from '../components/EmergencyHotlineBar.jsx';
import HeroSection from '../components/HeroSection.jsx';
import GisMapSection from '../components/GisMapSection.jsx';
import IncidentFeedSection from '../components/IncidentFeedSection.jsx';
import ReportTrackerSection from '../components/ReportTrackerSection.jsx';
import CivicTrustSection from '../components/CivicTrustSection.jsx';
import ActionModal from '../components/ActionModal.jsx';
import ForensicsModal from '../components/ForensicsModal.jsx';
import SimulationModal from '../components/SimulationModal.jsx';
import BroadcastModal from '../components/BroadcastModal.jsx';
import { useApp } from '../context/AppContext.jsx';
import { translations } from '../i18n/index.js';
import { Activity, Map, Radio, Send, Award, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function DashboardPage() {
    const { notification, language } = useApp();
    const t = translations[language] || translations.en;
    const [activeSection, setActiveSection] = useState('operational-overview');

    // Track active scrolling section
    useEffect(() => {
        const handleScroll = () => {
            const sections = [
                'operational-overview',
                'gis-map-section',
                'incident-feed-section',
                'report-tracker-section',
                'civic-trust-section'
            ];

            const scrollPos = window.scrollY + 200;
            for (const sectionId of sections) {
                const el = document.getElementById(sectionId);
                if (el) {
                    const top = el.offsetTop;
                    const height = el.offsetHeight;
                    if (scrollPos >= top && scrollPos < top + height) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Top Navigation Bar */}
            <Navbar />

            {/* NDMA SACHET Live Emergency Broadcast Ticker */}
            <SachetTicker />

            {/* Quick 1-Tap Emergency Speed-Dial Hotline Strip */}
            <EmergencyHotlineBar />

            {/* Sticky Sub-Navigation Bar */}
            <div className="subnav-sticky-bar">
                <div className="subnav-container">
                    <button 
                        className={`subnav-pill ${activeSection === 'operational-overview' ? 'active' : ''}`}
                        onClick={() => scrollTo('operational-overview')}
                    >
                        <Activity size={14} />
                        <span>{t.sections.overview}</span>
                    </button>
                    <button 
                        className={`subnav-pill ${activeSection === 'gis-map-section' ? 'active' : ''}`}
                        onClick={() => scrollTo('gis-map-section')}
                    >
                        <Map size={14} />
                        <span>{t.sections.gisMap}</span>
                    </button>
                    <button 
                        className={`subnav-pill ${activeSection === 'incident-feed-section' ? 'active' : ''}`}
                        onClick={() => scrollTo('incident-feed-section')}
                    >
                        <Radio size={14} />
                        <span>{t.sections.feed}</span>
                    </button>
                    <button 
                        className={`subnav-pill ${activeSection === 'report-tracker-section' ? 'active' : ''}`}
                        onClick={() => scrollTo('report-tracker-section')}
                    >
                        <Send size={14} />
                        <span>{t.sections.report}</span>
                    </button>
                    <button 
                        className={`subnav-pill ${activeSection === 'civic-trust-section' ? 'active' : ''}`}
                        onClick={() => scrollTo('civic-trust-section')}
                    >
                        <Award size={14} />
                        <span>{t.sections.trust}</span>
                    </button>
                </div>
            </div>

            {/* 5 Vertical Thematic Sections */}
            <main className="dashboard-main-content">
                <HeroSection />
                <GisMapSection />
                <IncidentFeedSection />
                <ReportTrackerSection />
                <CivicTrustSection />
            </main>

            {/* Minimalist Meta-Style Footer */}
            <footer className="dashboard-footer">
                <div className="footer-container">
                    <div className="footer-left">
                        <span className="footer-brand">{t.app.title}</span>
                        <span className="footer-tagline">
                            {t.app.authorityBadge}
                        </span>
                    </div>
                    <div className="footer-right">
                        <span>Smart India Hackathon • Problem Statement 69</span>
                        <span className="footer-divider">•</span>
                        <span>Zero-Distraction Architecture</span>
                    </div>
                </div>
            </footer>

            {/* Floating Tactical Modals */}
            <ActionModal />
            <ForensicsModal />
            <SimulationModal />
            <BroadcastModal />

            {/* Live Floating Toast Notification */}
            {notification && (
                <div className={`floating-toast toast-${notification.type}`}>
                    {notification.type === 'success' && <CheckCircle size={18} className="text-success" />}
                    {notification.type === 'warning' && <AlertTriangle size={18} className="text-warning" />}
                    {notification.type === 'danger' && <AlertTriangle size={18} className="text-danger" />}
                    {notification.type === 'info' && <Info size={18} className="text-primary" />}
                    <span className="toast-text">{notification.message}</span>
                </div>
            )}
        </div>
    );
}


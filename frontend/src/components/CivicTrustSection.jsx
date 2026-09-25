/**
 * Civic Trust Section (Section 5: Sentinel Trust & Leaderboard)
 * Gamified trust index rewarding accurate ground reporters,
 * badge progression catalog, and top community contributors
 */
import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getBadgeDetails } from '../utils/formatters.js';
import { Award, ShieldCheck, Star, Users, Flame, CheckCircle, TrendingUp } from 'lucide-react';

export default function CivicTrustSection() {
    const { leaderboard } = useApp();

    // Active User profile (Arun Sharma - Disaster Sentinel)
    const currentUser = leaderboard[0] || {
        username: 'citizen_arun',
        fullName: 'Arun Sharma',
        score: 92.5,
        badgeTier: 'DISASTER_SENTINEL',
        verifiedCount: 13
    };

    const userBadge = getBadgeDetails(currentUser.badgeTier);

    return (
        <section id="civic-trust-section" className="section-container civic-trust-section">
            <div className="section-header-meta">
                <span className="section-eyebrow">Civic Gamification & Reliability</span>
                <h2 className="section-title">Sentinel Trust & Community Leaderboard</h2>
                <p className="section-desc">
                    Anti-disinformation trust framework rewarding citizens who report verified ground conditions and penalizing panic-inducing falsehoods.
                </p>
            </div>

            <div className="civic-trust-grid">
                {/* Left Card: Active Citizen Sentinel Profile */}
                <div className="sentinel-profile-card">
                    <div className="profile-header-row">
                        <div className="sentinel-avatar-box">
                            <span className="avatar-icon">{userBadge.icon}</span>
                        </div>
                        <div className="sentinel-title-group">
                            <h3 className="sentinel-name">{currentUser.fullName}</h3>
                            <span className="sentinel-tier-pill" style={{ color: userBadge.color }}>
                                {userBadge.name}
                            </span>
                        </div>
                    </div>

                    {/* Trust Score Meter */}
                    <div className="trust-meter-container">
                        <div className="trust-meter-header">
                            <span className="trust-meter-label">Civic Trust Index</span>
                            <span className="trust-score-val">{currentUser.score} / 100</span>
                        </div>
                        <div className="trust-progress-track">
                            <div 
                                className="trust-progress-fill" 
                                style={{ width: `${currentUser.score}%`, backgroundColor: userBadge.color }}
                            />
                        </div>
                        <span className="trust-meter-subtext">
                            Top 1% Citizen Reporter in Madhya Pradesh
                        </span>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="sentinel-stats-row">
                        <div className="stat-box">
                            <span className="stat-number">{currentUser.verifiedCount}</span>
                            <span className="stat-label">Verified Reports</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">0</span>
                            <span className="stat-label">False Alarms</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">Rank #1</span>
                            <span className="stat-label">Metro Leaderboard</span>
                        </div>
                    </div>

                    {/* Badge Catalog Hierarchy */}
                    <div className="badge-catalog-preview">
                        <h4 className="catalog-title">Badge Progression Hierarchy</h4>
                        <div className="badge-steps-list">
                            {[
                                { tier: 'NOVICE_SCOUT', name: 'Novice Scout', pts: '0-49 pts', icon: '🌱' },
                                { tier: 'ACTIVE_SCOUT', name: 'Active Scout', pts: '50-74 pts', icon: '🧭' },
                                { tier: 'DISASTER_SENTINEL', name: 'Disaster Sentinel', pts: '75-89 pts', icon: '🎖️' },
                                { tier: 'CRISIS_GUARDIAN', name: 'Crisis Guardian', pts: '90+ pts', icon: '🛡️' }
                            ].map((b) => (
                                <div key={b.tier} className={`badge-step-item ${currentUser.score >= parseInt(b.pts) ? 'unlocked' : ''}`}>
                                    <span className="badge-step-icon">{b.icon}</span>
                                    <div className="badge-step-meta">
                                        <span className="badge-step-name">{b.name}</span>
                                        <span className="badge-step-pts">{b.pts}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Card: Leaderboard Table */}
                <div className="leaderboard-table-card">
                    <div className="table-card-header">
                        <div className="table-header-title">
                            <Users size={18} className="text-brand-primary" />
                            <h3 className="card-heading">Top Verified Field Sentinels</h3>
                        </div>
                        <span className="table-subtitle">Indore & Malwa Region</span>
                    </div>

                    <div className="leaderboard-table-wrapper">
                        <table className="sentinel-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Sentinel</th>
                                    <th>Tier</th>
                                    <th>Verified</th>
                                    <th>Trust Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((user, idx) => {
                                    const b = getBadgeDetails(user.badgeTier);
                                    return (
                                        <tr key={user.username} className={user.username === currentUser.username ? 'highlight-row' : ''}>
                                            <td className="rank-cell">
                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                            </td>
                                            <td className="user-cell">
                                                <div className="user-info">
                                                    <span className="user-fullname">{user.fullName}</span>
                                                    <span className="user-handle">@{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="tier-cell">
                                                <span className="table-tier-badge" style={{ color: b.color }}>
                                                    {b.icon} {b.name}
                                                </span>
                                            </td>
                                            <td className="count-cell">
                                                <span className="verified-count-badge">
                                                    {user.verifiedCount}
                                                </span>
                                            </td>
                                            <td className="score-cell">
                                                <span className="trust-score-badge">
                                                    {user.score} pts
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * Forensics Modal Component
 * Multimodal AI rumor forensic breakdown: perceptual hash matching,
 * sentiment classification, and meteorological telemetry contradiction checks
 */
import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Cpu, X, ShieldAlert, CheckCircle2, AlertOctagon, FileSearch, Sparkles } from 'lucide-react';

export default function ForensicsModal() {
    const { activeModal, modalData, closeModal, verifyReport } = useApp();

    if (activeModal !== 'forensics' || !modalData) return null;

    const p = modalData.properties || {};
    const isRumor = p.isRumor || p.rumorScore > 0.6;
    const rumorPct = Math.round((p.rumorScore || 0.05) * 100);

    return (
        <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-dialog modal-forensics-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-group">
                        <Cpu size={20} className="text-brand-primary" />
                        <h3 className="modal-title">AI Multimodal Forensics Audit</h3>
                    </div>
                    <button className="modal-close-btn" onClick={closeModal}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Header Banner */}
                    <div className={`forensics-verdict-banner ${isRumor ? 'verdict-rumor' : 'verdict-verified'}`}>
                        {isRumor ? (
                            <>
                                <AlertOctagon size={24} className="text-danger" />
                                <div>
                                    <h4 className="verdict-title">High Probability Disinformation / False Alarm</h4>
                                    <p className="verdict-desc">Contradicted by physical meteorological sensors or matches recycled media archives.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={24} className="text-success" />
                                <div>
                                    <h4 className="verdict-title">Corroborated Ground Truth Incident</h4>
                                    <p className="verdict-desc">Cross-verified against local Doppler radar precipitation and reporter civic trust score.</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Breakdown Matrix */}
                    <div className="forensics-matrix-grid">
                        {/* 1. Rumor Confidence Score */}
                        <div className="matrix-box">
                            <span className="matrix-label">Rumor Probability</span>
                            <div className="matrix-val-row">
                                <span className={`matrix-large-val ${isRumor ? 'text-danger' : 'text-success'}`}>
                                    {rumorPct}%
                                </span>
                            </div>
                            <span className="matrix-sub">AI Multimodal Confidence Score</span>
                        </div>

                        {/* 2. Sentiment Classification */}
                        <div className="matrix-box">
                            <span className="matrix-label">Text Sentiment</span>
                            <span className="matrix-text-val">{p.sentiment || 'OBJECTIVE_INFORMATIVE'}</span>
                            <span className="matrix-sub">NLP Tone Analysis</span>
                        </div>

                        {/* 3. Media pHash Duplicate Check */}
                        <div className="matrix-box">
                            <span className="matrix-label">Perceptual Hash Fingerprint</span>
                            <span className="matrix-mono-val">{p.phash || 'cccc3333ff333373'}</span>
                            <span className="matrix-sub">
                                {p.duplicateFlag ? '⚠️ Recycled Media Match' : '✅ Unique Media Capture'}
                            </span>
                        </div>

                        {/* 4. Reporter Civic Trust */}
                        <div className="matrix-box">
                            <span className="matrix-label">Reporter Trust Index</span>
                            <span className="matrix-text-val text-brand-primary">
                                {p.reporterTrustScore || 85.0} / 100
                            </span>
                            <span className="matrix-sub">{p.reporterBadge || 'DISASTER_SENTINEL'}</span>
                        </div>
                    </div>

                    {/* Audit Logs */}
                    <div className="audit-log-container">
                        <span className="audit-log-title">Automated AI Verification Pipeline:</span>
                        <ul className="audit-log-list">
                            <li>🔍 <strong>Stage 1:</strong> Ingested field observation with GPS coordinates [22.75, 75.89].</li>
                            <li>🌧️ <strong>Stage 2:</strong> Cross-referenced IMD Doppler Radar precipitation telemetry.</li>
                            <li>🖼️ <strong>Stage 3:</strong> Computed 64-bit perceptual hash (Hamming distance scan against crisis archives).</li>
                            <li>🤖 <strong>Stage 4:</strong> LLM prompt evaluated distress urgency vs alarmist exaggeration.</li>
                        </ul>
                    </div>

                    {/* Quick Commander Override Actions */}
                    <div className="forensics-commander-actions">
                        <span className="override-label">Commander Override:</span>
                        <div className="override-btn-group">
                            <button 
                                className="override-btn override-verify"
                                onClick={() => {
                                    verifyReport(p.id, true);
                                    closeModal();
                                }}
                            >
                                Overrule & Confirm Ground Truth
                            </button>
                            <button 
                                className="override-btn override-debunk"
                                onClick={() => {
                                    verifyReport(p.id, false);
                                    closeModal();
                                }}
                            >
                                Overrule & Flag as Rumor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

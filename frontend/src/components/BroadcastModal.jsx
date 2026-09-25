/**
 * Emergency Broadcast Modal
 * Authorizes Ops Commanders to issue mass CAP alerts and audible sirens to citizens
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Radio, X, AlertTriangle, Send, BellRing, ShieldCheck } from 'lucide-react';

export default function BroadcastModal() {
    const { activeModal, closeModal, showToast, speakText, language } = useApp();
    const [urgency, setUrgency] = useState('CRITICAL');
    const [headline, setHeadline] = useState('IMD RED ALERT: Flash Flood Evacuation Notice');
    const [advisory, setAdvisory] = useState('Immediate voluntary evacuation advised along Kahn River lowlands. Shelters active at Holkar & Nehru Stadiums.');
    const [broadcastTarget, setBroadcastTarget] = useState('Indore Metro & Lowland Slums');
    const [submitting, setSubmitting] = useState(false);

    if (activeModal !== 'broadcast') return null;

    const handleBroadcast = (e) => {
        e.preventDefault();
        setSubmitting(true);

        setTimeout(() => {
            setSubmitting(false);
            showToast('🚨 MASS EMERGENCY BROADCAST DISPATCHED VIA SMS & CELL TOWERS', 'danger');
            speakText(`Emergency Warning: ${headline}. Follow official instructions.`);
            closeModal();
        }, 800);
    };

    return (
        <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-dialog modal-broadcast-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header modal-header-danger">
                    <div className="modal-title-group">
                        <Radio size={20} className="text-danger" />
                        <h3 className="modal-title">
                            {language === 'hi' ? 'सामूहिक आपातकालीन प्रसारण (CAP ब्रॉडकास्ट)' : 'Mass Emergency Broadcast Console'}
                        </h3>
                    </div>
                    <button className="modal-close-btn" onClick={closeModal}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleBroadcast} className="modal-body">
                    <div className="broadcast-warning-box">
                        <AlertTriangle size={20} className="text-danger" />
                        <span className="broadcast-warning-text">
                            Transmits instant sirens and cellular alert popups to all connected citizen devices in the designated zone.
                        </span>
                    </div>

                    <div className="input-field-group">
                        <label className="input-label">Alert Headline</label>
                        <input 
                            type="text"
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            className="text-input"
                            required
                        />
                    </div>

                    <div className="input-field-group">
                        <label className="input-label">Urgency & Threat Level (CAP Standard)</label>
                        <select 
                            value={urgency}
                            onChange={(e) => setUrgency(e.target.value)}
                            className="select-input"
                        >
                            <option value="CRITICAL">🔴 Critical Red Alert (Immediate Action Required)</option>
                            <option value="HIGH">🟠 High Orange Alert (Severe Threat Imminent)</option>
                            <option value="MEDIUM">🟡 Yellow Watch (Advisory Warning)</option>
                        </select>
                    </div>

                    <div className="input-field-group">
                        <label className="input-label">Target Broadcast Zone</label>
                        <input 
                            type="text"
                            value={broadcastTarget}
                            onChange={(e) => setBroadcastTarget(e.target.value)}
                            className="text-input"
                            required
                        />
                    </div>

                    <div className="input-field-group">
                        <label className="input-label">Official Advisory Directives & Safe Havens</label>
                        <textarea 
                            value={advisory}
                            onChange={(e) => setAdvisory(e.target.value)}
                            className="textarea-input"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="secondary-btn" onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-action-btn btn-danger-action" disabled={submitting}>
                            <BellRing size={16} />
                            <span>{submitting ? 'Transmitting Cellular Alerts...' : 'Broadcast Siren & SMS'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

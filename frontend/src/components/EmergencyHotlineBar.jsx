/**
 * Emergency Hotline & Quick Speed-Dial Bar
 * Provides instant 1-tap dial / copy for critical disaster helplines
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { PhoneCall, Shield, HeartPulse, Flame, AlertCircle, Copy, Check } from 'lucide-react';

const HOTLINES = [
    { id: 'ndrf', number: '1078', label: 'NDRF Disaster Response', icon: Shield, color: '#0866FF' },
    { id: 'disaster', number: '1077', label: 'Control Room (DEOC)', icon: AlertCircle, color: '#EA580C' },
    { id: 'ambulance', number: '108', label: 'Emergency Medical', icon: HeartPulse, color: '#16A34A' },
    { id: 'police', number: '112', label: 'National Emergency', icon: PhoneCall, color: '#DC2626' },
    { id: 'fire', number: '101', label: 'Fire Service', icon: Flame, color: '#D97706' }
];

export default function EmergencyHotlineBar() {
    const { language, showToast } = useApp();
    const [copiedNum, setCopiedNum] = useState(null);

    const handleCopy = (num, label) => {
        navigator.clipboard.writeText(num);
        setCopiedNum(num);
        showToast(`${label} (${num}) copied to clipboard`, 'success');
        setTimeout(() => setCopiedNum(null), 2500);
    };

    return (
        <section className="hotline-strip" aria-label="Emergency Speed Dial">
            <div className="hotline-container">
                <div className="hotline-title-group">
                    <PhoneCall size={16} className="text-danger" />
                    <span className="hotline-main-label">
                        {language === 'hi' ? 'त्वरित आपातकालीन हेल्पलाइन:' : 'Emergency Response Helplines:'}
                    </span>
                </div>

                <div className="hotline-chips-list">
                    {HOTLINES.map(h => {
                        const Icon = h.icon;
                        const isCopied = copiedNum === h.number;

                        return (
                            <div key={h.id} className="hotline-chip">
                                <a href={`tel:${h.number}`} className="hotline-call-link" title={`Dial ${h.label}`}>
                                    <Icon size={14} style={{ color: h.color }} />
                                    <span className="hotline-name">{h.label}:</span>
                                    <strong className="hotline-digits">{h.number}</strong>
                                </a>
                                <button 
                                    className="hotline-copy-btn"
                                    onClick={() => handleCopy(h.number, h.label)}
                                    title="Copy helpline number"
                                >
                                    {isCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

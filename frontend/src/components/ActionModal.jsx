/**
 * Action Modal Component
 * Tactical emergency dispatch interface for Ops Commanders
 */
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Truck, X, ShieldAlert, CheckCircle, Radio } from 'lucide-react';

export default function ActionModal() {
    const { activeModal, modalData, closeModal, dispatchAction } = useApp();

    const [unitType, setUnitType] = useState('NDRF_WATER_RESCUE');
    const [notes, setNotes] = useState('Immediate inflatable boats deployment for waterlogged intersection.');
    const [submitting, setSubmitting] = useState(false);

    if (activeModal !== 'action' || !modalData) return null;

    const p = modalData.properties || {};

    const handleDispatch = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await dispatchAction(p.id, {
                assignedUnit: unitType,
                notes: notes,
                dispatchedAt: new Date().toISOString()
            });
            closeModal();
        } catch (err) {
            console.error('Dispatch error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-group">
                        <Truck size={20} className="text-brand-primary" />
                        <h3 className="modal-title">Dispatch Tactical Response Squad</h3>
                    </div>
                    <button className="modal-close-btn" onClick={closeModal}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleDispatch} className="modal-body">
                    <div className="modal-incident-summary">
                        <span className="summary-tracking">{p.trackingId || `REP-${p.id}`}</span>
                        <h4 className="summary-title">{p.title}</h4>
                        <p className="summary-location">📍 {p.city || 'Indore'} ({p.district || 'Indore'})</p>
                    </div>

                    <div className="input-field-group">
                        <label className="input-label">Select Response Unit / Squad</label>
                        <select 
                            value={unitType}
                            onChange={(e) => setUnitType(e.target.value)}
                            className="select-input"
                        >
                            <option value="NDRF_WATER_RESCUE">NDRF Inflatable Boat & Flood Rescue Team</option>
                            <option value="SDRF_PUMP_CREW">SDRF Heavy High-Capacity Dewatering Pumps</option>
                            <option value="MUNICIPAL_TREE_SQUAD">Municipal Road Clearing & Tree Removal Squad</option>
                            <option value="RED_CROSS_MEDICAL">Red Cross Mobile Trauma & Medical Ambulance</option>
                            <option value="TRAFFIC_DIVERSION_POLICE">Traffic Police Ring Road Diversion Unit</option>
                        </select>
                    </div>

                    <div className="input-field-group">
                        <label className="input-label">Tactical Mission Directives & Route Notes</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="textarea-input"
                            rows={3}
                            placeholder="Enter specific route instructions, staging points, or safety gear..."
                            required
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="secondary-btn" onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-action-btn" disabled={submitting}>
                            {submitting ? 'Transmitting Directives...' : 'Authorize & Dispatch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

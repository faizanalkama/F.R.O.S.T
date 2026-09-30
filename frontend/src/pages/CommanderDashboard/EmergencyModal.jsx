import React, { useState } from 'react';
import { AlertOctagon, Send, X } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose, onDispatch }) {
  const [optionalInfo, setOptionalInfo] = useState('');
  const [severity, setSeverity] = useState('High');

  if (!isOpen) return null;

  const handleDispatch = () => {
    onDispatch({ optionalInfo, severity });
    setOptionalInfo('');
    setSeverity('High');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-[var(--bg-panel)] border-2 border-orange-500/50 shadow-[0_0_50px_-12px_rgba(249,115,22,0.5)] rounded-2xl w-[95%] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border/50 bg-orange-500/10">
          <div className="flex items-center gap-2 text-orange-500">
            <AlertOctagon size={24} />
            <h2 className="text-xl font-['Bebas_Neue'] tracking-widest mt-1">EMERGENCY DISPATCH PROTOCOL</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white transition-colors transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 md:p-6 flex flex-col gap-5 text-sm">
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded text-red-200 leading-relaxed">
            <p className="font-semibold mb-1 text-red-400">WARNING: CRITICAL ACTION</p>
            This will notify the command team and admin. False alarms are logged.
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">Severity Level</label>
            <select 
              value={severity} 
              onChange={e => setSeverity(e.target.value)} 
              className="bg-[var(--bg-primary)] border border-border/50 rounded p-2 text-[var(--text-primary)] focus:border-orange-500 outline-none"
            >
              <option value="Critical">Critical (Immediate Evacuation / SOS)</option>
              <option value="High">High (Severe Hazard / Asset Loss)</option>
              <option value="Moderate">Moderate (System Failure / Weather Threat)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">Optional Incident Details</label>
            <textarea 
              rows={4} 
              placeholder="Describe the situation briefly... (e.g. Hostile weather, power failure at grid 4)"
              value={optionalInfo} 
              onChange={e => setOptionalInfo(e.target.value)} 
              className="bg-[var(--bg-primary)] border border-border/50 rounded p-3 text-[var(--text-primary)] resize-none focus:border-orange-500 outline-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border/50 flex justify-end gap-3 bg-[var(--bg-primary)]">
          <button onClick={onClose} className="px-5 py-2.5 rounded text-sm text-[var(--text-primary)] border border-border/50 hover:bg-[var(--bg-panel-raised)] transition-colors transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto">
            Cancel
          </button>
          <button onClick={handleDispatch} className="px-5 py-2.5 rounded text-sm bg-orange-600 text-white hover:bg-orange-500 flex items-center gap-2 shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)] transition-all font-semibold tracking-wide w-full md:w-auto">
            <Send size={16}/> 
            CONFIRM & DISPATCH
          </button>
        </div>
      </div>
    </div>
  );
}

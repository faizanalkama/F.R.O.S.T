import React, { useState } from 'react';
import { X, UserPlus, MapPin, Briefcase, Anchor } from 'lucide-react';
import { BACKEND_URL, safeFetch } from '../../api';

export default function AddPersonnelModal({ isOpen, onClose, onPersonnelAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'Station Lead',
    station: 'Maitri',
    expeditionTeam: 'Summer Operational'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      console.log("Submitting personnel...", formData);
      const response = await safeFetch(`${BACKEND_URL}/api/v1/personnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (!data.success) {
        console.error("Failed to add personnel:", data);
        throw new Error(data.message || data.error || 'Failed to add personnel');
      }
      
      console.log("Personnel added to DB successfully!", data.data);
      // Ensure the backend GET is triggered and completed before modal closes
      await onPersonnelAdded();
      
      setFormData({ name: '', role: 'Station Lead', station: 'Maitri', expeditionTeam: 'Summer Operational' });
      onClose();
    } catch (err) {
      console.error("Form Submit Error:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-panel-raised)] border border-border/50 shadow-sm hover:shadow-md rounded-2xl w-[95%] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto font-['Work_Sans']">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-[var(--bg-primary)]">
          <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2 text-sm uppercase tracking-wider">
            <UserPlus size={16} className="text-[var(--accent-primary)]" />
            Add Personnel
          </h3>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 flex flex-col gap-4">
          {error && <div className="text-xs text-[var(--critical)] bg-[var(--critical)]/10 p-2 rounded border border-[var(--critical)]">{error}</div>}
          
          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold mb-1 block">Full Name</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[var(--bg-panel)] border border-border/50 px-3 py-2 text-sm text-[var(--text-primary)] rounded focus:outline-none focus:border-[var(--accent-primary)]"
              placeholder="e.g. Dr. Rajesh Kumar"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold mb-1 flex items-center gap-1.5"><Briefcase size={12}/> Role</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full bg-[var(--bg-panel)] border border-border/50 px-3 py-2 text-sm text-[var(--text-primary)] rounded focus:outline-none focus:border-[var(--accent-primary)] appearance-none"
            >
              <option value="Station Lead">Station Lead</option>
              <option value="Meteorologist">Meteorologist</option>
              <option value="Glaciologist">Glaciologist</option>
              <option value="Logistics Officer">Logistics Officer</option>
              <option value="Field Researcher">Field Researcher</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold mb-1 flex items-center gap-1.5"><MapPin size={12}/> Destination Station</label>
            <select 
              value={formData.station}
              onChange={(e) => setFormData({...formData, station: e.target.value})}
              className="w-full bg-[var(--bg-panel)] border border-border/50 px-3 py-2 text-sm text-[var(--text-primary)] rounded focus:outline-none focus:border-[var(--accent-primary)] appearance-none"
            >
              <option value="Maitri">Maitri</option>
              <option value="Bharati">Bharati</option>
              <option value="Himadri">Himadri</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase font-semibold mb-1 flex items-center gap-1.5"><Anchor size={12}/> Expedition Team</label>
            <select 
              value={formData.expeditionTeam}
              onChange={(e) => setFormData({...formData, expeditionTeam: e.target.value})}
              className="w-full bg-[var(--bg-panel)] border border-border/50 px-3 py-2 text-sm text-[var(--text-primary)] rounded focus:outline-none focus:border-[var(--accent-primary)] appearance-none"
            >
              <option value="Summer Operational">Summer Operational</option>
              <option value="Winter-Over">Winter-Over</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition-colors transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white text-xs font-semibold rounded transition-colors disabled:opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto"
            >
              {isSubmitting ? 'Saving...' : 'Add to Roster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

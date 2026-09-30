import { BACKEND_URL } from '../../api';
import React, { useState, useRef, useEffect } from 'react';
import { HeartPulse, User, ShieldCheck, Edit2, Plus, X, Upload, Trash2, AlertTriangle } from 'lucide-react';

const initialScientists = [];

function PersonnelCard({ person, onEdit }) {
 const isElevated = person.status === 'elevated';

 return (
  <div className="bg-[var(--bg-panel-raised)] shadow-sm hover:shadow-md border border-border/50 p-5 rounded-2xl flex flex-col gap-4 relative group transition-all duration-300 hover:shadow-lg hover:border-[var(--accent-primary)] hover:border-opacity-50">
   
   {/* Edit Button - Appears on hover */}
   <button 
    onClick={() => onEdit(person)}
    className="absolute top-4 right-4 p-2 rounded-full bg-[var(--bg-panel)] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 z-10"
    title="Edit Scientist"
   >
    <Edit2 size={16} />
   </button>

   {/* Header */}
   <div className="flex items-start gap-4">
    <div className="relative w-16 h-16 shrink-0 rounded-full bg-[var(--bg-panel)] shadow-sm hover:shadow-md border-2 border-border/50 flex items-center justify-center overflow-hidden">
     {person.imageUrl ? (
      <img src={person.imageUrl} alt={person.name} className="w-full h-full object-cover" />
     ) : (
      <User size={24} className="text-[var(--text-secondary)]" />
     )}
     {isElevated && (
      <div className="absolute inset-0 border-2 border-[var(--critical)] rounded-full pointer-events-none" />
     )}
    </div>
    <div className="flex-1 min-w-0 pr-8">
     <div className="flex items-center justify-between mb-1">
      <p className="text-[var(--text-primary)] font-bold text-lg truncate">{person.name}</p>
     </div>
     <p className="text-[var(--accent-primary)] font-medium text-sm truncate">{person.role}</p>
     <p className="text-[var(--text-secondary)] text-xs mt-1 bg-[var(--bg-panel)] inline-block px-2 py-0.5 rounded-full border border-border/50">
      {person.department || 'General'}
     </p>
    </div>
   </div>

   {/* Details */}
   <div className="text-[var(--text-secondary)] text-sm line-clamp-2 h-10 italic border-l-2 border-border/50 pl-3">
    "{person.bio || 'No specialized biography provided.'}"
   </div>

   {/* Vitals */}
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
    <div className="text-center bg-[var(--bg-panel)] rounded-xl px-2 py-2 border border-border/50 relative overflow-hidden group/vital">
     <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-panel-raised)] opacity-0 group-hover/vital:opacity-100 transition-opacity" />
     <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider mb-1 relative z-10">Heart</p>
     <p className={`font-bold text-lg relative z-10 ${isElevated ? 'text-[var(--critical)]' : 'text-[var(--ok)]'}`}>
      {person.heartRate || 72} <span className="text-xs font-normal opacity-70">bpm</span>
     </p>
    </div>
    <div className="text-center bg-[var(--bg-panel)] rounded-xl px-2 py-2 border border-border/50 relative overflow-hidden group/vital">
     <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-panel-raised)] opacity-0 group-hover/vital:opacity-100 transition-opacity" />
     <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider mb-1 relative z-10">Temp</p>
     <p className={`font-bold text-lg relative z-10 ${person.temp && person.temp > 37.5 ? 'text-[var(--critical)]' : 'text-[var(--text-primary)]'}`}>
      {person.temp || 36.6}°C
     </p>
    </div>
    <div className="text-center bg-[var(--bg-panel)] rounded-xl px-2 py-2 border border-border/50 relative overflow-hidden group/vital">
     <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-panel-raised)] opacity-0 group-hover/vital:opacity-100 transition-opacity" />
     <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider mb-1 relative z-10">SpO₂</p>
     <p className={`font-bold text-lg relative z-10 ${person.o2 && person.o2 < 95 ? 'text-[var(--critical)]' : 'text-[var(--text-primary)]'}`}>
      {person.o2 || 98}%
     </p>
    </div>
   </div>

   {/* Status Bar */}
   <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl font-medium mt-auto ${
    isElevated
     ? 'bg-[var(--critical)]/10 text-[var(--critical)] border border-[var(--critical)]/20'
     : 'bg-[var(--ok)]/10 text-[var(--ok)] border border-[var(--ok)]/20'
   }`}>
    <ShieldCheck size={14} />
    {isElevated ? 'Vitals Elevated — Intervention Required' : 'All Vitals Optimal'}
   </div>
  </div>
 );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, personName }) {
 const [confirmText, setConfirmText] = useState('');

 if (!isOpen) return null;

 const handleSubmit = (e) => {
  e.preventDefault();
  if (confirmText === 'Remove') {
   onConfirm();
   setConfirmText('');
  }
 };

 return (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
   <div className="bg-[var(--bg-panel-raised)] border border-[var(--critical)]/50 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col relative">
    <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--critical)]" />
    <div className="p-4 md:p-6">
     <div className="flex items-center gap-3 mb-4 text-[var(--critical)]">
      <AlertTriangle size={24} />
      <h3 className="text-lg font-bold font-['Space_Grotesk']">Confirm Deletion</h3>
     </div>
     <p className="text-[var(--text-secondary)] text-sm mb-4">
      You are about to remove <strong className="text-[var(--text-primary)]">{personName}</strong> from the roster. This action cannot be undone.
     </p>
     <p className="text-[var(--text-primary)] text-sm mb-2 font-medium">
      Please type <strong className="text-[var(--critical)]">Remove</strong> to confirm:
     </p>
     <form onSubmit={handleSubmit}>
      <input
       type="text"
       value={confirmText}
       onChange={(e) => setConfirmText(e.target.value)}
       placeholder="Type 'Remove' here"
       className="w-full bg-[var(--bg-panel)] border border-border/50 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--critical)] transition-colors mb-6"
      />
      <div className="flex justify-end gap-3">
       <button
        type="button"
        onClick={() => {
         onClose();
         setConfirmText('');
        }}
        className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors"
       >
        Cancel
       </button>
       <button
        type="submit"
        disabled={confirmText !== 'Remove'}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--critical)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_var(--critical)] shadow-opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto"
       >
        Confirm Removal
       </button>
      </div>
     </form>
    </div>
   </div>
  </div>
 );
}

function ScientistFormModal({ isOpen, onClose, onSave, onDelete, initialData }) {
 const [formData, setFormData] = useState({
  name: '',
  role: '',
  department: '',
  specialization: '',
  imageUrl: ''
 });
 const fileInputRef = useRef(null);
 const [showPhotoConfirm, setShowPhotoConfirm] = useState(false);

 useEffect(() => {
  setShowPhotoConfirm(false);
  if (initialData) {
   setFormData({
    ...initialData,
    department: initialData.team || '',
    specialization: initialData.specialization || ''
   });
  } else {
   setFormData({ name: '', role: '', department: '', specialization: '', imageUrl: '' });
  }
 }, [initialData, isOpen]);

 if (!isOpen) return null;

 const handleSubmit = (e) => {
  e.preventDefault();
  onSave(formData);
 };

 const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
   const reader = new FileReader();
   reader.onloadend = () => {
    setFormData(prev => ({ ...prev, imageUrl: reader.result }));
   };
   reader.readAsDataURL(file);
  }
 };

 return (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
   <div className="bg-[var(--bg-panel-raised)] border border-border/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
    <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/50">
     <h3 className="text-xl font-bold text-[var(--text-primary)] font-['Space_Grotesk']">
      {initialData ? 'Edit Personnel' : 'Register New Personnel'}
     </h3>
     <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md hover:bg-[var(--bg-panel)] transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto">
      <X size={20} />
     </button>
    </div>
    
    <form onSubmit={handleSubmit} className="p-4 md:p-6 flex flex-col gap-4">
     <div className="flex flex-col md:flex-row gap-4 items-center">
       <div 
        className="w-16 h-16 rounded-full bg-[var(--bg-panel)] border border-border/50 flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        title="Upload Image"
       >
        {formData.imageUrl ? (
         <>
          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
           <Upload size={16} className="text-white" />
          </div>
         </>
        ) : (
         <Upload size={20} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
        )}
       </div>
       <div className="flex-1">
        <label className="block text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Profile Picture</label>
        {formData.imageUrl && (
         <div className="mt-2 flex flex-row items-center gap-4">
          <button 
           type="button"
           onClick={() => setShowPhotoConfirm(true)}
           className="text-xs text-[var(--critical)] hover:underline flex items-center gap-1 whitespace-nowrap"
          >
           <X size={12} /> Remove Photo
          </button>
          
          {showPhotoConfirm && (
           <div className="bg-[var(--bg-panel-raised)] border border-[var(--critical)]/50 rounded-xl p-2 shadow-lg flex flex-col gap-2 min-w-[140px] animate-in fade-in zoom-in duration-200">
            <p className="text-[10px] text-[var(--text-secondary)] font-bold text-center m-0">Confirm Removal?</p>
            <div className="flex flex-col md:flex-row gap-2">
             <button
              type="button"
              onClick={() => setShowPhotoConfirm(false)}
              className="flex-1 py-1 px-2 text-[10px] bg-[var(--bg-panel)] rounded border border-border/50 hover:text-[var(--text-primary)] transition-colors"
             >
              Cancel
             </button>
             <button
              type="button"
              onClick={() => {
               setFormData(prev => ({ ...prev, imageUrl: '' }));
               setShowPhotoConfirm(false);
              }}
              className="flex-1 py-1 px-2 text-[10px] bg-[var(--critical)] text-white rounded shadow-[0_0_8px_var(--critical)] shadow-opacity-50 hover:opacity-90 transition-opacity"
             >
              Yes
             </button>
            </div>
           </div>
          )}
         </div>
        )}
        <input 
         type="file"
         ref={fileInputRef}
         onChange={handleImageUpload}
         accept="image/*"
         className="hidden"
        />
       </div>
     </div>

     <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Full Name *</label>
      <input 
       type="text" 
       required
       value={formData.name}
       onChange={e => setFormData({...formData, name: e.target.value})}
       className="w-full bg-[var(--bg-panel)] border border-border/50 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
      />
     </div>
     
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
       <label className="block text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Role *</label>
       <input 
        type="text" 
        required
        value={formData.role}
        onChange={e => setFormData({...formData, role: e.target.value})}
        className="w-full bg-[var(--bg-panel)] border border-border/50 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
       />
      </div>
      <div>
       <label className="block text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Department</label>
       <input 
        type="text" 
        value={formData.department}
        onChange={e => setFormData({...formData, department: e.target.value})}
        className="w-full bg-[var(--bg-panel)] border border-border/50 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
       />
      </div>
     </div>

     <div>
      <label className="block text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Biography / Specialization</label>
      <textarea 
       rows={3}
       value={formData.bio}
       onChange={e => setFormData({...formData, bio: e.target.value})}
       className="w-full bg-[var(--bg-panel)] border border-border/50 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors resize-none"
      />
     </div>

     <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
      {initialData ? (
       <button 
        type="button"
        onClick={() => onDelete(initialData.id || initialData.personnel_id)}
        className="px-3 py-2 rounded-xl text-sm font-medium text-[var(--critical)] hover:bg-[var(--critical)]/10 transition-colors flex items-center gap-2"
       >
        <Trash2 size={16} />
        Delete
       </button>
      ) : (
       <div></div>
      )}
      <div className="flex flex-col md:flex-row gap-3">
       <button 
        type="button" 
        onClick={onClose}
        className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto"
       >
        Cancel
       </button>
       <button 
        type="submit"
        className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity shadow-[0_0_15px_var(--accent-primary)] shadow-opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto"
       >
        {initialData ? 'Save Changes' : 'Add Personnel'}
       </button>
      </div>
     </div>
    </form>
   </div>
  </div>
 );
}

export default function ScientistsRoster() {
 const [roster, setRoster] = useState(initialScientists);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingPerson, setEditingPerson] = useState(null);
 const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
 const [personToDelete, setPersonToDelete] = useState(null);

 const handleOpenAdd = () => {
  setEditingPerson(null);
  setIsModalOpen(true);
 };

 const handleOpenEdit = (person) => {
  setEditingPerson(person);
  setIsModalOpen(true);
 };

 useEffect(() => {
  const fetchRoster = async () => {
   try {
    const res = await fetch(`${BACKEND_URL}/api/v1/roster`);
    if (res.ok) {
     const data = await res.json();
     setRoster(data);
    }
   } catch (e) {
    console.error('Failed to fetch roster:', e);
   }
  };
  fetchRoster();
 }, []);

 const handleSaveScientist = async (scientistData) => {
  const payload = {
   name: scientistData.name,
   role: scientistData.role,
   team: scientistData.department,
   specialization: scientistData.bio,
  };

  try {
   if (editingPerson) {
    const res = await fetch(`${BACKEND_URL}/api/v1/roster/${editingPerson.personnel_id}`, {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload)
    });
    if (res.ok) {
     const updated = await res.json();
     setRoster(prev => prev.map(p => p.personnel_id === updated.personnel.personnel_id ? updated.personnel : p));
    }
   } else {
    const res = await fetch(`${BACKEND_URL}/api/v1/roster`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload)
    });
    if (res.ok) {
     const created = await res.json();
     setRoster(prev => [created.personnel, ...prev]);
    }
   }
  } catch (e) {
   console.error('Failed to save scientist:', e);
  }
  setIsModalOpen(false);
 };

 const handleRequestDelete = (id) => {
  const person = roster.find(p => p.id === id || p.personnel_id === id);
  if (person) {
   setPersonToDelete(person);
   setIsDeleteModalOpen(true);
  }
 };

 const handleConfirmDelete = async () => {
  if (personToDelete) {
   try {
    const res = await fetch(`${BACKEND_URL}/api/v1/roster/${personToDelete.personnel_id}`, {
     method: 'DELETE'
    });
    if (res.ok) {
     setRoster(prev => prev.filter(p => p.personnel_id !== personToDelete.personnel_id));
    }
   } catch (e) {
    console.error('Failed to delete scientist:', e);
   }
   setIsDeleteModalOpen(false);
   setPersonToDelete(null);
   setIsModalOpen(false);
  }
 };

 return (
  <div className="bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 rounded-2xl p-4 sm:p-6 min-h-full flex flex-col relative overflow-hidden">
   {/* Decorative Background Glow */}
   <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-primary)]/5 rounded-full blur-[100px] pointer-events-none" />
   
   <div className="flex items-center justify-between mb-8 relative z-10">
    <div>
     <h2 className="text-[var(--accent-primary)] font-['Space_Grotesk'] font-bold text-3xl tracking-wide mb-1 flex items-center gap-3">
      SCIENTISTS ROSTER
      <span className="bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs px-2 py-1 rounded-md tracking-normal font-medium border border-[var(--accent-primary)]/30">
       {roster.length} Active
      </span>
     </h2>
     <p className="text-[var(--text-secondary)] text-sm font-['Work_Sans'] flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse shadow-[0_0_8px_var(--ok)]"></span>
      Real-time vital monitoring engaged
     </p>
    </div>
    
    <button 
     onClick={handleOpenAdd}
     className="flex items-center gap-2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)] hover:text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0)] hover:shadow-[0_0_15px_var(--accent-primary)] w-full md:w-auto"
    >
     <Plus size={18} />
     <span>Add Personnel</span>
    </button>
   </div>

   {roster.length === 0 ? (
    <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50 relative z-10 border-2 border-dashed border-border/50 rounded-2xl m-4 bg-[var(--bg-panel-raised)]/30">
     <User size={64} className="mb-4 opacity-50" />
     <p className="text-lg">No personnel registered</p>
    </div>
   ) : (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 relative z-10 overflow-y-auto pr-2 pb-4">
     {roster.map((person) => (
      <PersonnelCard 
       key={person.id || person.personnel_id} 
       person={person} 
       onEdit={handleOpenEdit}
      />
     ))}
    </div>
   )}

   <ScientistFormModal 
    isOpen={isModalOpen} 
    onClose={() => setIsModalOpen(false)}
    onSave={handleSaveScientist}
    onDelete={handleRequestDelete}
    initialData={editingPerson}
   />

   <DeleteConfirmModal
    isOpen={isDeleteModalOpen}
    onClose={() => setIsDeleteModalOpen(false)}
    onConfirm={handleConfirmDelete}
    personName={personToDelete?.name}
   />
  </div>
 );
}

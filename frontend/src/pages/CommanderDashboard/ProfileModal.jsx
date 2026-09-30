import React, { useState, useRef } from 'react';
import { X, Save, User, Upload } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const [profile, setProfile] = useState({
    name: 'Commander John Doe',
    base: 'Base Alpha - Sector 7',
    contact: '+1-555-0198',
    email: 'johndoe@icenet.local',
    role: 'Senior Operations Commander',
    bio: 'Assigned to Sector 7 since 2024. Expert in harsh environment logistics.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-panel)] border border-border/50 shadow-sm hover:shadow-md rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-border/50">
          <h2 className="text-xl font-['Bebas_Neue'] tracking-wider text-[var(--text-primary)]">Commander Profile</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 md:p-6 flex flex-col gap-4 text-sm">
          {/* Profile Picture */}
          <div className="flex items-center gap-4 md:gap-6 mb-2">
            <div 
              className={`w-24 h-24 rounded-full bg-[var(--bg-primary)] border-2 border-border/50 flex items-center justify-center shrink-0 overflow-hidden relative group ${isEditing ? 'cursor-pointer hover:border-[var(--accent-primary)]' : ''}`}
              onClick={() => isEditing && fileInputRef.current?.click()}
              title={isEditing ? "Upload new picture" : ""}
            >
              {(isEditing ? tempProfile.imageUrl : profile.imageUrl) ? (
                <img src={isEditing ? tempProfile.imageUrl : profile.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-[var(--text-secondary)]" />
              )}
              
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center transition-all">
                  <Upload size={24} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">{profile.name}</h3>
              <p className="text-[var(--accent-primary)] text-sm">{profile.role}</p>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Name (Non-editable)</label>
            <input type="text" value={profile.name} disabled className="bg-[var(--bg-primary)] border border-border/50 rounded p-2 text-[var(--text-primary)] opacity-70 cursor-not-allowed" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Base Details (Non-editable)</label>
            <input type="text" value={profile.base} disabled className="bg-[var(--bg-primary)] border border-border/50 rounded p-2 text-[var(--text-primary)] opacity-70 cursor-not-allowed" />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Contact Number</label>
            <input type="text" value={isEditing ? tempProfile.contact : profile.contact} disabled={!isEditing} onChange={e => setTempProfile({...tempProfile, contact: e.target.value})} className={`bg-[var(--bg-primary)] border border-border/50 rounded p-2 text-[var(--text-primary)] ${!isEditing && 'opacity-70 cursor-not-allowed'}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Email</label>
            <input type="email" value={isEditing ? tempProfile.email : profile.email} disabled={!isEditing} onChange={e => setTempProfile({...tempProfile, email: e.target.value})} className={`bg-[var(--bg-primary)] border border-border/50 rounded p-2 text-[var(--text-primary)] ${!isEditing && 'opacity-70 cursor-not-allowed'}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Role</label>
            <input type="text" value={isEditing ? tempProfile.role : profile.role} disabled={!isEditing} onChange={e => setTempProfile({...tempProfile, role: e.target.value})} className={`bg-[var(--bg-primary)] border border-border/50 rounded p-2 text-[var(--text-primary)] ${!isEditing && 'opacity-70 cursor-not-allowed'}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Biography</label>
            <textarea rows={3} value={isEditing ? tempProfile.bio : profile.bio} disabled={!isEditing} onChange={e => setTempProfile({...tempProfile, bio: e.target.value})} className={`bg-[var(--bg-primary)] border border-border/50 rounded p-2 text-[var(--text-primary)] resize-none ${!isEditing && 'opacity-70 cursor-not-allowed'}`} />
          </div>
        </div>
        <div className="p-4 border-t border-border/50 flex justify-end gap-3">
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); setTempProfile(profile); }} className="px-4 py-2 rounded text-sm text-[var(--text-primary)] border border-border/50 hover:bg-[var(--bg-panel-raised)]">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded text-sm bg-[var(--accent-primary)] text-white hover:bg-blue-600 flex items-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto"><Save size={16}/> Save Changes</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded text-sm bg-[var(--bg-panel-raised)] text-[var(--text-primary)] border border-border/50 hover:border-[var(--accent-primary)]">Edit Details</button>
          )}
        </div>
      </div>
    </div>
  );
}

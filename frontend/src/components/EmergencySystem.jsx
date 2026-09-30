import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Activity, User, X } from 'lucide-react';

export default function EmergencySystem() {
 const [activeEmergency, setActiveEmergency] = useState(null);

 useEffect(() => {
  const handleTelemetry = (e) => {
   const data = e.detail;
   // Trigger emergency if status is DISTRESS, SOS or FALL_DETECTED
   if (['DISTRESS', 'SOS', 'FALL_DETECTED'].includes(data.status)) {
    if(!activeEmergency || activeEmergency.node_id !== data.node_id) {
     setActiveEmergency(data);
     // Play siren
     try {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='); // Stubbed for siren
      audio.play().catch(e => {});
     } catch(e) {}
    }
   }
  };

  window.addEventListener('telemetryUpdate', handleTelemetry);
  
  // Test simulator
  window.triggerSOS = () => {
    window.dispatchEvent(new CustomEvent('telemetryUpdate', {
      detail: {
        node_id:"EXP-BIO-04",
        personnel_id:"DR-SHARMA-01",
        lat: -70.768,
        lng: 11.734,
        battery_pct: 12,
        status:"SOS",
        timestamp: new Date().toISOString()
      }
    }));
  };

  return () => window.removeEventListener('telemetryUpdate', handleTelemetry);
 }, [activeEmergency]);

 if (!activeEmergency) return null;

 return (
  <div style={{
   position: 'fixed',
   top: 0, left: 0, right: 0, bottom: 0,
   backgroundColor: 'rgba(239, 68, 68, 0.95)',
   backdropFilter: 'blur(10px)',
   zIndex: 9999,
   display: 'flex',
   alignItems: 'center',
   justifyContent: 'center',
   padding: '24px',
   color: 'white',
   animation: 'emergency-flash 1s infinite alternate'
  }}>
   <div className="glass-panel" style={{ background: '#b91c1c', maxWidth: '600px', width: '100%', border: '2px solid #fca5a5' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
     <h1 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '16px', margin: 0, background: 'none', WebkitBackgroundClip: 'unset' }}>
      <AlertTriangle size={48} color="#fca5a5" />
      EMERGENCY ACTION SYSTEM
     </h1>
     <button onClick={() => setActiveEmergency(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
      <X size={32} />
     </button>
    </div>
    
    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
     <h2 style={{ color: '#fca5a5', marginBottom: '16px', fontSize: '1.2rem', textTransform: 'uppercase' }}>Distress Signal Received</h2>
     
     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div>
       <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginBottom: '4px' }}><User size={16} style={{display:'inline', marginRight:4}}/>Personnel ID</div>
       <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{activeEmergency.personnel_id}</div>
      </div>
      
      <div>
       <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginBottom: '4px' }}><Activity size={16} style={{display:'inline', marginRight:4}}/>Status Trigger</div>
       <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fef08a' }}>{activeEmergency.status}</div>
      </div>
      
      <div style={{ gridColumn: 'span 2' }}>
       <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginBottom: '4px' }}><MapPin size={16} style={{display:'inline', marginRight:4}}/>Coordinates (GNSS)</div>
       <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
        {activeEmergency.lat.toFixed(6)}°, {activeEmergency.lng.toFixed(6)}°
       </div>
      </div>
     </div>
    </div>

    <div style={{ display: 'flex', gap: '16px' }}>
     <button className="btn transition-all duration-300 ease-out hover:-translate-y-0.5 shadow-sm ring-1 ring-inset ring-black/10 dark:ring-white/10 w-full md:w-auto" style={{ flex: 1, background: '#fef08a', color: '#b91c1c', justifyContent: 'center', padding: '16px', fontSize: '1.2rem' }}>
      Dispatch Rescue Team
     </button>
     <button className="btn transition-all duration-300 ease-out hover:-translate-y-0.5 shadow-sm ring-1 ring-inset ring-black/10 dark:ring-white/10 secondary w-full md:w-auto" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setActiveEmergency(null)}>
      Acknowledge & Mute
     </button>
    </div>
   </div>
  </div>
 );
}

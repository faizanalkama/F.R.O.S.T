import { motion } from 'framer-motion';
import { AlertTriangle, MapPin, Activity, Radio, Siren, VolumeX } from 'lucide-react';

export default function EmergencyOverlay({ onClose }) {
 return (
  <motion.div
   className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
   initial={{ opacity: 0 }}
   animate={{ opacity: 1 }}
   exit={{ opacity: 0 }}
  >
   {/* Pulsing red backdrop */}
   <motion.div
    className="absolute inset-0 backdrop-blur-sm"
    animate={{
     backgroundColor: [
      'rgba(232, 62, 47, 0.2)',
      'rgba(232, 62, 47, 0.6)',
      'rgba(232, 62, 47, 0.2)',
     ],
    }}
    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
   />

   {/* Modal Card */}
   <motion.div
    className="relative bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border-2 border-[var(--critical)] rounded-2xl p-4 md:p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(232,62,47,0.5)]"
    initial={{ scale: 0.85, y: 30 }}
    animate={{ scale: 1, y: 0 }}
    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
   >
    {/* Header */}
    <div className="flex items-center gap-4 mb-8">
     <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 0.6, repeat: Infinity }}
     >
      <AlertTriangle size={48} className="text-[var(--critical)]" />
     </motion.div>
     <div>
      <h2 className="text-[var(--critical)] font-['Space_Grotesk'] font-bold text-2xl tracking-wide leading-tight">
       CRITICAL: EMERGENCY ACTION SYSTEM TRIGGERED
      </h2>
      <p className="text-[var(--text-secondary)] text-sm mt-1 font-['Work_Sans']">
       LoRa mesh relay received — manual SOS activation confirmed
      </p>
     </div>
    </div>

    {/* Distress Details Grid */}
    <div className="grid grid-cols-1 gap-4 mb-8">
     {/* Source */}
     <div className="bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md border border-border/50 rounded-xl p-4 flex items-start gap-3">
      <Radio size={18} className="text-[var(--critical)] mt-0.5 shrink-0" />
      <div>
       <p className="text-[var(--text-secondary)] text-xs uppercase tracking-widest font-semibold mb-1">
        Signal Source
       </p>
       <p className="text-[var(--text-primary)] text-sm font-semibold">
        Wearable ID: ICE-ENG-04 (Manual SOS)
       </p>
       <p className="text-[var(--text-secondary)] text-xs mt-1">
        Personnel: Eng. Kofi Mensah — Power Systems Engineer
       </p>
      </div>
     </div>

     {/* Location */}
     <div className="bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md border border-border/50 rounded-xl p-4 flex items-start gap-3">
      <MapPin size={18} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
      <div>
       <p className="text-[var(--text-secondary)] text-xs uppercase tracking-widest font-semibold mb-1">
        GPS Location
       </p>
       <p className="text-[var(--text-primary)] text-sm font-semibold">
        70°45′S 11°44′E
       </p>
       <p className="text-[var(--text-secondary)] text-xs mt-1">
        1.2km North-East of Maitri Station — Outside heated perimeter
       </p>
      </div>
     </div>

     {/* Vitals */}
     <div className="bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md border border-border/50 rounded-xl p-4 flex items-start gap-3">
      <Activity size={18} className="text-[var(--critical)] mt-0.5 shrink-0 animate-pulse" />
      <div>
       <p className="text-[var(--text-secondary)] text-xs uppercase tracking-widest font-semibold mb-1">
        Last Known Vitals
       </p>
       <div className="flex items-center gap-4 md:gap-6">
        <p className="text-[var(--text-primary)] text-sm">
         Heart Rate: <span className="text-[var(--critical)] font-bold text-lg">140 BPM</span>
        </p>
        <p className="text-[var(--text-primary)] text-sm">
         SpO₂: <span className="text-[var(--critical)] font-bold text-lg">94%</span>
        </p>
        <p className="text-[var(--text-primary)] text-sm">
         Temp: <span className="text-[var(--accent-primary)] font-bold text-lg">35.1°C</span>
        </p>
       </div>
      </div>
     </div>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center gap-4">
     <motion.button
      className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[var(--critical)] text-[var(--text-primary)] rounded-xl font-['Space_Grotesk'] font-bold text-lg tracking-wider"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
      onClick={onClose}
     >
      <Siren size={22} />
      DISPATCH RESCUE TEAM
     </motion.button>

     <button
      onClick={onClose}
      className="flex items-center gap-2 px-5 py-4 bg-transparent border border-border/50 text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-300 ease-out rounded-xl text-sm font-semibold hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors w-full md:w-auto"
     >
      <VolumeX size={16} />
      Acknowledge & Silence
     </button>
    </div>

    {/* Timestamp */}
    <p className="text-[var(--text-secondary)] text-xs text-center mt-6 font-mono">
     EAS ACTIVATED AT {new Date().toLocaleTimeString('en-GB')} UTC+5:30 — AUTO-LOGGED
    </p>
   </motion.div>
  </motion.div>
 );
}

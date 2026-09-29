import { useState, useEffect } from 'react';
import {
 Ship,
 MapPin,
 Clock,
 Anchor,
 Navigation,
 Package,
 Activity,
 X,
 Lock,
 Wifi,
 Radio,
 CheckCircle,
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, Graticule, Marker, Line } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';

const geoUrl = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

const shipments = [];

const statusStyles = {
 'In Transit': 'text-[var(--accent-primary)] border-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
 Docked: 'text-[var(--ok)] border-[var(--ok)] bg-[var(--ok)]/10',
 Delayed: 'text-[var(--critical)] border-[var(--critical)] bg-[var(--critical)]/10',
};

const markerFill = (status) => {
 if (status === 'Docked') return 'var(--ok)';
 if (status === 'Delayed') return 'var(--critical)';
 return 'var(--accent-primary)';
};

export default function GlobalCargoTracker() {
 const [selectedVessel, setSelectedVessel] = useState(null);
 const [isPinging, setIsPinging] = useState(false);
 const [pingSuccess, setPingSuccess] = useState(false);
 const [activeShipments, setActiveShipments] = useState(shipments);

 useEffect(() => {
  Promise.all([
    fetch('http://localhost:5000/api/v1/cargo/manifests').then(res => res.json()).catch(() => []),
    fetch('http://localhost:5000/api/v1/expeditions?status=In%20Transit').then(res => res.json()).catch(() => [])
  ])
   .then(([manifests, expeditions]) => {
    let combined = [];

    // Map Manifests
    if (manifests && manifests.length > 0) {
     const mapped = manifests.map((m, i) => {
      const destName = (m.destination || '').toLowerCase();
      const destCoords = destName.includes('bharati') ? [76.1, -69.4] : 
                         destName.includes('maitri') ? [11.8, -70.7] : [11.9, 78.9];
      const isDelivered = m.status === 'Delivered (Base)';
      
      return {
       id: m.manifest_id,
       vessel: m.vessel || `Vessel ${i+1}`,
       cargo: 'Sealed Cargo',
       destination: m.destination || 'Unknown',
       eta: new Date(m.created_at).toLocaleDateString(),
       status: m.status === 'Draft' ? 'Delayed' : isDelivered ? 'Docked' : 'In Transit',
       start: [-40, -30],
       current: isDelivered ? destCoords : [-40, -50],
       end: destCoords,
       heading: isDelivered ? '000° Docked' : '184° S',
       speed: isDelivered ? '0.0 knots' : '14.2 knots',
       manifest: Array.isArray(m.items) ? m.items.map(item => `${item.qty} ${item.unit} ${item.name}`) : []
      };
     });
     combined = [...combined, ...mapped];
    }

    // Map Expeditions
    if (expeditions && expeditions.length > 0) {
     const mappedExps = expeditions.map((e) => {
      const destName = (e.route || '').toLowerCase();
      const destCoords = destName.includes('bharati') ? [76.1, -69.4] : 
                         destName.includes('maitri') ? [11.8, -70.7] : [11.9, 78.9];
      const isDelivered = e.status === 'Arrived';
      
      return {
       id: e._id,
       vessel: e.vesselName || 'Expedition Vessel',
       cargo: 'Expedition Charter',
       destination: e.route || 'Unknown Route',
       eta: e.arrivalDate ? new Date(e.arrivalDate).toLocaleDateString() : 'Unknown',
       status: e.status === 'Pending' ? 'Delayed' : isDelivered ? 'Docked' : 'In Transit',
       start: [-40, -30],
       current: e.currentCoordinates && e.currentCoordinates.length === 2 && e.currentCoordinates[0] !== 0 ? e.currentCoordinates : [-40, -50],
       end: destCoords,
       heading: isDelivered ? '000° Docked' : '184° S',
       speed: isDelivered ? '0.0 knots' : '14.2 knots',
       manifest: ['Expedition Staff & Equipment']
      };
     });
     combined = [...combined, ...mappedExps];
    }

    setActiveShipments(combined);
   })
   .catch(err => console.error('Failed to fetch tracking data:', err));
 }, []);

 const handlePingAIS = () => {
  setIsPinging(true);
  setPingSuccess(false);

  setTimeout(() => {
   setIsPinging(false);
   setPingSuccess(true);
   setTimeout(() => {
    setPingSuccess(false);
   }, 3000);
  }, 1500);
 };

 return (
  <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--border)] rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
   <h2 className="text-[var(--accent-primary)] font-['Space_Grotesk'] font-bold text-2xl mb-6 tracking-wide">
    GLOBAL CARGO TRACKER
   </h2>

   {/* Summary Counters */}
   <div className="flex gap-4 mb-6">
    <div className="flex items-center gap-2 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] px-4 py-2 rounded-lg border border-[var(--border)]">
     <Ship size={16} className="text-[var(--accent-primary)]" />
     <span className="text-[var(--text-secondary)] text-sm">
      Active Vessels: <span className="text-[var(--text-primary)] font-bold">{activeShipments.length}</span>
     </span>
    </div>
    <div className="flex items-center gap-2 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] px-4 py-2 rounded-lg border border-[var(--border)]">
     <Anchor size={16} className="text-[var(--ok)]" />
     <span className="text-[var(--text-secondary)] text-sm">
      Docked:{' '}
      <span className="text-[var(--ok)] font-bold">
       {activeShipments.filter((s) => s.status === 'Docked').length}
      </span>
     </span>
    </div>
    <div className="flex items-center gap-2 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] px-4 py-2 rounded-lg border border-[var(--border)]">
     <Clock size={16} className="text-[var(--critical)]" />
     <span className="text-[var(--text-secondary)] text-sm">
      Delayed:{' '}
      <span className="text-[var(--critical)] font-bold">
       {activeShipments.filter((s) => s.status === 'Delayed').length}
      </span>
     </span>
    </div>
   </div>

   {/* GIS Tactical Map with Radar Sweep Effect */}
   <div
    className="cargo-map-surface w-full h-[500px] mb-8 border border-[var(--border)] rounded-lg overflow-hidden relative"
    role="img"
    aria-label="World map showing cargo vessel routes and current locations"
   >
    <div className="cargo-map-grid absolute inset-0 pointer-events-none" />
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
     <motion.div
      className="cargo-map-radar w-full h-full"
      style={{
       background:
        'radial-gradient(ellipse at 50% 58%, rgba(45, 165, 221, 0.2) 0%, rgba(27, 104, 163, 0.08) 42%, transparent 72%)',
      }}
      animate={{ opacity: [0.45, 0.85, 0.45] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
     />
    </div>

    <ComposableMap
     projectionConfig={{ scale: 180, center: [0, 4] }}
     style={{ width: '100%', height: '100%' }}
    >
     <Graticule stroke="#4e89ae" strokeWidth={0.35} strokeOpacity={0.3} />
     <Geographies geography={geoUrl}>
      {({ geographies }) =>
       geographies.map((geo) => (
        <Geography
         key={geo.rsmKey}
         geography={geo}
         fill="#193653"
         stroke="#456b89"
         strokeWidth={0.55}
         style={{
          default: { outline: 'none' },
          hover: { outline: 'none', fill: '#285477', stroke: '#91d8f4' },
          pressed: { outline: 'none' },
         }}
        />
       ))
      }
     </Geographies>

     {/* Planned Trajectory Lines */}
    {activeShipments.map((ship) => (
     <g key={`route-${ship.vessel}`}>
      <Line
       from={ship.start}
       to={ship.end}
       stroke="#85a9c2"
       strokeOpacity={0.3}
       strokeDasharray="2 7"
       strokeWidth={1}
      />
      <Line
       className="cargo-route-flow"
       from={ship.start}
       to={ship.current}
       stroke={markerFill(ship.status)}
       strokeOpacity={0.92}
       strokeDasharray="3 7"
       strokeLinecap="round"
       strokeWidth={1.8}
      />
      <Marker coordinates={ship.end}>
       <circle r={3.5} fill="#071526" stroke={markerFill(ship.status)} strokeWidth={1.5} />
      </Marker>
     </g>
    ))}

     {/* Interactive Vessel Markers */}
     {activeShipments.map((ship) => {
      const isDelayed = ship.status === 'Delayed';

      return (
       <Marker
        key={ship.vessel}
        coordinates={ship.current}
        onClick={() =>
         setSelectedVessel(
          selectedVessel?.vessel === ship.vessel ? null : ship
         )
        }
        className="cursor-pointer"
       >
        {/* Large, forgiving hit area */}
        <circle r={20} fill="transparent" style={{ cursor: 'pointer' }} />

        {/* Soft status halo and stronger pulse for delayed vessels */}
        <motion.circle
         r={isDelayed ? 10 : 8}
         fill={markerFill(ship.status)}
         fillOpacity={0.2}
         animate={{ scale: isDelayed ? [1, 1.8, 1] : [1, 1.35, 1], opacity: [0.55, 0.12, 0.55] }}
         transition={{ repeat: Infinity, duration: isDelayed ? 1.5 : 3.2, ease: 'easeInOut' }}
         style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
        {isDelayed && (
         <motion.circle
          r={12}
          fill="var(--critical)"
          fillOpacity={0.35}
          animate={{ scale: [1, 1.75, 1], opacity: [0.7, 0.12, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
         />
        )}

        {/* Visual dot with hover scaling */}
        <motion.circle
         r={selectedVessel?.vessel === ship.vessel ? 7.5 : 6}
         whileHover={{ scale: 1.6 }}
         fill={
          ship.status === 'Docked'
           ? 'var(--ok)'
           : ship.status === 'Delayed'
           ? 'var(--critical)'
           : 'var(--accent-primary)'
         }
         stroke="#e5f6ff"
         strokeWidth={1.25}
         style={{ cursor: 'pointer' }}
        />

        {/* Larger high-visibility vessel label */}
        <text
         textAnchor="middle"
         y={-15}
         style={{
          fill: 'var(--text-primary)',
          fontSize: '12px',
          fontWeight: 'bold',
          fontFamily: 'Work Sans',
          paintOrder: 'stroke',
          stroke: '#071526',
          strokeWidth: 3,
          pointerEvents: 'none',
         }}
        >
         {ship.vessel}
        </text>
       </Marker>
      );
     })}
    </ComposableMap>
   </div>

   {/* Shipments Table */}
   <div className="flex-1 overflow-auto">
    <table className="w-full text-left font-['Work_Sans'] text-[var(--text-primary)]">
     <thead>
      <tr className="text-[var(--text-secondary)] text-xs uppercase tracking-widest border-b border-[var(--border)]">
       <th className="pb-3 pr-4">Vessel</th>
       <th className="pb-3 pr-4">Cargo Type</th>
       <th className="pb-3 pr-4">Destination</th>
       <th className="pb-3 pr-4">ETA</th>
       <th className="pb-3 text-right">Status</th>
      </tr>
     </thead>
     <tbody>
      {activeShipments.length === 0 && (
       <tr>
        <td colSpan="5" className="py-8 text-center text-sm text-[var(--text-secondary)] italic">
         Zero active shipments found.
        </td>
       </tr>
      )}
      {activeShipments.map((s, i) => {
       const isSelected = selectedVessel?.vessel === s.vessel;
       return (
        <tr
         key={i}
         onClick={() => setSelectedVessel(s)}
         className={`border-b border-[var(--border)] hover:bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] transition-colors cursor-pointer ${
          isSelected ? 'bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] border-l-2 border-l-[var(--accent-primary)]' : ''
         }`}
        >
         <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
           <Ship size={14} className={isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-primary)]'} />
           <span className="font-medium text-sm">{s.vessel}</span>
          </div>
         </td>
         <td className="py-3 pr-4 text-sm text-[var(--text-secondary)]">{s.cargo}</td>
         <td className="py-3 pr-4 text-sm">
          <div className="flex items-center gap-1.5">
           <MapPin size={12} className="text-[var(--text-secondary)]" />
           {s.destination}
          </div>
         </td>
         <td className="py-3 pr-4 text-sm">
          <div className="flex items-center gap-1.5">
           <Clock size={12} className="text-[var(--text-secondary)]" />
           {s.eta}
          </div>
         </td>
         <td className="py-3 text-right">
          <span
           className={`inline-block text-xs font-semibold px-3 py-1 rounded border ${statusStyles[s.status]}`}
          >
           {s.status}
          </span>
         </td>
        </tr>
       );
      })}
     </tbody>
    </table>
   </div>

   {/* Tactical Side-Panel Overlay */}
   <AnimatePresence>
    {selectedVessel && (
     <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="absolute top-0 right-0 w-96 h-full bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] border-l border-[var(--border)] shadow-2xl p-6 flex flex-col z-50 overflow-y-auto"
     >
      {/* Panel Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[var(--border)] mb-6">
       <div>
        <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] tracking-widest block mb-1">
         Tactical AIS Telemetry
        </span>
        <h3 className="text-[var(--accent-primary)] font-['Space_Grotesk'] font-bold text-xl tracking-wide">
         {selectedVessel.vessel}
        </h3>
       </div>
       <button
        type="button"
        onClick={() => setSelectedVessel(null)}
        className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] transition-colors cursor-pointer"
       >
        <X size={18} />
       </button>
      </div>

      {/* Status Badge & Destination */}
      <div className="flex items-center justify-between bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] p-3 rounded-lg border border-[var(--border)] mb-6">
       <span
        className={`text-xs font-semibold px-3 py-1 rounded border ${statusStyles[selectedVessel.status]}`}
       >
        {selectedVessel.status}
       </span>
       <span className="text-xs text-[var(--text-secondary)] font-mono">
        ETA: <strong className="text-[var(--text-primary)]">{selectedVessel.eta}</strong>
       </span>
      </div>

      {/* Live Telemetry Section */}
      <div className="mb-6">
       <h4 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Activity size={14} className="text-[var(--accent-primary)]" />
        Live Navigational Telemetry
       </h4>

       <div className="grid grid-cols-2 gap-3 font-['Work_Sans']">
        <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] p-3 rounded-lg border border-[var(--border)]">
         <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[10px] uppercase mb-1">
          <Navigation size={12} className="text-[var(--accent-primary)]" />
          <span>Heading</span>
         </div>
         <p className="text-[var(--text-primary)] font-bold text-sm font-mono">
          {selectedVessel.heading}
         </p>
        </div>

        <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] p-3 rounded-lg border border-[var(--border)]">
         <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[10px] uppercase mb-1">
          <Activity size={12} className="text-[var(--accent-primary)]" />
          <span>Speed</span>
         </div>
         <p className="text-[var(--text-primary)] font-bold text-sm font-mono">
          {selectedVessel.speed}
         </p>
        </div>

        <div className="col-span-2 bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] p-3 rounded-lg border border-[var(--border)]">
         <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[10px] uppercase mb-1">
          <MapPin size={12} className="text-[var(--ok)]" />
          <span>Coordinates</span>
         </div>
         <p className="text-[var(--text-primary)] font-mono text-xs">
          {selectedVessel.current[1] >= 0
           ? `${selectedVessel.current[1]}° N`
           : `${Math.abs(selectedVessel.current[1])}° S`}
          ,{' '}
          {selectedVessel.current[0] >= 0
           ? `${selectedVessel.current[0]}° E`
           : `${Math.abs(selectedVessel.current[0])}° W`}
         </p>
        </div>
       </div>
      </div>

      {/* Simulated AIS Ping Button */}
      <div className="mb-6">
       <button
        type="button"
        onClick={handlePingAIS}
        disabled={isPinging}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
         pingSuccess
          ? 'bg-[var(--ok)]/20 border border-[var(--ok)] text-[var(--ok)]'
          : 'bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]'
        }`}
       >
        {isPinging ? (
         <>
          <Radio size={14} className="animate-spin text-[var(--accent-primary)]" />
          <span>Pinging Satellite (AIS)...</span>
         </>
        ) : pingSuccess ? (
         <>
          <CheckCircle size={14} className="text-[var(--ok)]" />
          <span>Ping Acknowledged (42ms ACK)</span>
         </>
        ) : (
         <>
          <Wifi size={14} />
          <span>Ping Satellite (AIS)</span>
         </>
        )}
       </button>
      </div>

      {/* Sealed Manifest Section */}
      <div className="flex-1 flex flex-col justify-end">
       <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] p-4 rounded-lg border border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border)]">
         <Lock size={14} className="text-[var(--accent-primary)]" />
         <h4 className="text-[var(--accent-primary)] text-xs font-bold uppercase tracking-wider">
          Sealed Cargo Manifest
         </h4>
        </div>

        <div className="space-y-2 mb-3">
         {selectedVessel.manifest.map((item, idx) => (
          <div
           key={idx}
           className="flex items-center gap-2 text-xs text-[var(--text-primary)] font-['Work_Sans']"
          >
           <Package size={12} className="text-[var(--accent-primary)] shrink-0" />
           <span>{item}</span>
          </div>
         ))}
        </div>

        <p className="text-[var(--text-secondary)] text-[10px] font-mono border-t border-[var(--border)] pt-2">
         🔒 Cryptographic hash verified by edge mesh
        </p>
       </div>
      </div>
     </motion.div>
    )}
   </AnimatePresence>
  </div>
 );
}

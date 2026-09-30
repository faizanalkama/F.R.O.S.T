import { backendApi, getWsUrl } from '../api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { setupSync } from '../utils/store';
import { Activity, Radio, AlertTriangle, Ship, Power, Play, Square } from 'lucide-react';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
 iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
 iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const personnelIcon = new L.Icon({
 iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzBlYTVlOSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ii8+PHBhdGggZD0iTTUuNSA4LjVjLS42NSAwLTEuMi40NS0xLjIgMS4wOXYyYTEgMSAwIDAgMC4zLjcxTDEyIDIyaDBlNy40LTkuNy4zLS43MXYtMmEwLjktLjktLjktLjlsLTEuMS00Ii8+PC9zdmc+',
 iconSize: [24, 24],
 iconAnchor: [12, 12],
});

const vesselIcon = new L.Icon({
 iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlYWJjMDgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMnggYyAwIDAgNC41IDEgNyAxcyA3IC0xIDcgLTFsIC0xIC0xMGgtMTJ6Ii8+PHBhdGggZD0iTTEyIDN2NiIvPjxwYXRoIGQ9Ik0xMCA2aDQiLz48L3N2Zz4=',
 iconSize: [32, 32],
 iconAnchor: [16, 16],
});

export default function Dashboard() {
 const [personnel, setPersonnel] = useState({});
 const [logs, setLogs] = useState([]);
 const [geofences, setGeofences] = useState([]);
 const [vessel, setVessel] = useState(null);
 const [simulatorRunning, setSimulatorRunning] = useState(false);

 useEffect(() => {
  const fetchGeofences = async () => {
   try {
    const res = await backendApi.get('/api/v1/geofences');
    setGeofences(res.data);
   } catch (e) { console.error('Failed to fetch geofences', e); }
  };
  
  const fetchVessel = async () => {
   try {
    const res = await backendApi.get('/api/v1/ais/vessel/419000000');
    setVessel(res.data);
   } catch (e) { console.error('Failed to fetch vessel', e); }
  };

  fetchGeofences();
  fetchVessel();

  // Setup WS sync for telemetry
  const sync = setupSync(getWsUrl('/crdt'));
  
  const handleTelemetry = (e) => {
   const data = e.detail;
   setPersonnel(prev => ({
    ...prev,
    [data.node_id]: data
   }));
   setLogs(prev => [data, ...prev].slice(0, 15));
  };
  
  window.addEventListener('telemetryUpdate', handleTelemetry);
  
  return () => {
   window.removeEventListener('telemetryUpdate', handleTelemetry);
   sync.disconnect();
  };
 }, []);

 const toggleSimulator = async () => {
  try {
   if (simulatorRunning) {
    await backendApi.post('/api/v1/simulator/lora/stop');
   } else {
    await backendApi.post('/api/v1/simulator/lora/start');
   }
   setSimulatorRunning(!simulatorRunning);
  } catch (e) { console.error(e); }
 };

 const triggerMockSOS = async () => {
  try {
   await backendApi.post('/api/v1/simulator/lora/sos', { personnel_id: 'EXP-BIO-04' });
  } catch (e) { console.error(e); }
 };

 return (
  <div className="page-container">
   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
    <h1>Live Operations Map</h1>
    <button className="btn danger" onClick={triggerMockSOS}>
     <AlertTriangle size={18} /> Simulate SOS (Node 04)
    </button>
   </div>
   
   <div className="grid-2">
    <div className="glass-panel" style={{ height: '600px', padding: 0, overflow: 'hidden', position: 'relative' }}>
     <MapContainer center={[-70.768, 11.734]} zoom={13} style={{ height: '100%', width: '100%' }}>
      {/* Service Worker caching can be applied to this tile layer for offline mapping */}
      <TileLayer
       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
       attribution='&copy; OpenStreetMap contributors'
      />
      
      {/* Geofences */}
      {geofences.map(gf => (
       <Polygon 
        key={gf.geofence_id}
        positions={gf.coordinates}
        pathOptions={{ 
         color: gf.type === 'crevasse' ? '#ef4444' : '#f59e0b', 
         fillColor: gf.type === 'crevasse' ? '#ef4444' : '#f59e0b', 
         fillOpacity: 0.2 
        }}
       >
        <Popup>
         <strong>{gf.name}</strong><br/>
         Type: {gf.type}
        </Popup>
       </Polygon>
      ))}
      
      <Marker position={[-70.768, 11.734]}>
       <Popup>Maitri Station (Base)</Popup>
      </Marker>
      
      {/* Vessel tracking */}
      {vessel && (
       <Marker position={[vessel.lat, vessel.lng]} icon={vesselIcon}>
        <Popup>
         <strong>{vessel.vessel_name}</strong> (MMSI: {vessel.mmsi})<br/>
         Speed: {vessel.speed_knots.toFixed(1)} kn<br/>
         Destination: {vessel.destination}
        </Popup>
       </Marker>
      )}

      {Object.values(personnel).map(p => (
       <Marker key={p.node_id} position={[p.lat, p.lng]} icon={personnelIcon}>
        <Popup>
         <strong>{p.personnel_id}</strong><br/>
         Battery: {p.battery_pct}%<br/>
         Status: <span style={{ color: p.status === 'SOS' ? 'red' : 'inherit', fontWeight: p.status === 'SOS' ? 'bold' : 'normal' }}>{p.status}</span>
        </Popup>
       </Marker>
      ))}
     </MapContainer>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
     
     <div className="glass-panel">
      <h2><Power size={20} style={{display:'inline', marginRight:8}}/> LoRa Gateway Control</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
       Control the edge gateway simulator. When running, it polls seeded personnel locations and emits telemetry payloads over WebSocket.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
       <button className={`btn ${simulatorRunning ? 'danger' : ''}`} onClick={toggleSimulator}>
        {simulatorRunning ? <><Square size={18} /> Stop Simulator</> : <><Play size={18} /> Start Simulator (15s polling)</>}
       </button>
      </div>
     </div>

     {vessel && (
       <div className="glass-panel">
        <h2><Ship size={20} style={{display:'inline', marginRight:8, color: '#3B82F6'}}/> Chartered Vessel Tracking</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
         <div><strong style={{color:'var(--text-muted)'}}>Name:</strong> {vessel.vessel_name}</div>
         <div><strong style={{color:'var(--text-muted)'}}>MMSI:</strong> {vessel.mmsi}</div>
         <div><strong style={{color:'var(--text-muted)'}}>Speed:</strong> {vessel.speed_knots.toFixed(1)} kn</div>
         <div><strong style={{color:'var(--text-muted)'}}>ETA:</strong> {new Date(vessel.eta).toLocaleDateString()}</div>
        </div>
       </div>
     )}

     <div className="glass-panel" style={{ flex: 1 }}>
      <h2><Radio size={20} style={{display:'inline', marginRight:8}}/> Live Telemetry Feed</h2>
      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
       {logs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Waiting for LoRa packets...</p>}
       {logs.map((log, i) => (
        <div key={i} style={{ 
         padding: '8px', 
         borderBottom: '1px solid rgba(255,255,255,0.05)',
         fontSize: '0.85rem',
         display: 'flex',
         justifyContent: 'space-between'
        }}>
         <span><strong style={{color:'var(--accent-primary)'}}>{log.personnel_id || log.node_id}</strong>: {log.lat.toFixed(4)}, {log.lng.toFixed(4)}</span>
         <span className={`badge ${log.status === 'SOS' ? 'unsafe' : 'safe'}`}>{log.status}</span>
        </div>
       ))}
      </div>
     </div>

    </div>
   </div>
  </div>
 );
}

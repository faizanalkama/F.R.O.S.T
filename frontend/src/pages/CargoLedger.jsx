import { BACKEND_URL } from '../api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, ShieldCheck, ShieldAlert, FileText, QrCode, ArrowRight, Lock, Unlock, Eye, Hash, ChevronRight } from 'lucide-react';

const API = `${BACKEND_URL}/api/v1`;

const STATUS_PIPELINE = [
 'Draft',
 'Procured',
 'Packed (Goa)',
 'In Transit (Ocean)',
 'Awaiting Heli-lift',
 'Delivered (Base)',
];

export default function CargoLedger() {
 const [manifestId, setManifestId] = useState('ISEA-45-M01');
 const [vesselMmsi, setVesselMmsi] = useState('419000000');
 const [toast, setToast] = useState(null);
 const [manifest, setManifest] = useState(null);
 const [loading, setLoading] = useState(false);

 const sampleItems = [
  { item_id: '1', qty: 50, name: 'Diesel Drums' },
  { item_id: '2', qty: 200, name: 'Rations' },
  { item_id: '3', qty: 30, name: 'Medical Kits' },
 ];

 function showToast(type, msg) {
  setToast({ type, msg });
  setTimeout(() => setToast(null), 8000);
 }

 // ── 1. Create manifest (Draft) ────────────────────────────────────────────
 const createManifest = async () => {
  setLoading(true);
  try {
   const res = await axios.post(`${API}/cargo/manifest`, {
    manifest_id: manifestId,
    vessel_mmsi: vesselMmsi,
    items: sampleItems,
   });
   setManifest(res.data.manifest || res.data);
   showToast('success', `Manifest ${manifestId} created in Draft status`);
  } catch (e) {
   showToast('error', e.response?.data?.error || 'Failed to create manifest');
  }
  setLoading(false);
 };

 // ── 2. Seal manifest (hash it) ───────────────────────────────────────────
 const sealManifest = async () => {
  setLoading(true);
  try {
   const res = await axios.post(`${API}/cargo/manifest/${manifestId}/seal`);
   setManifest(res.data.manifest);
   showToast('success', `Manifest sealed! SHA-256: ${res.data.crypto_hash.substring(0, 24)}…`);
  } catch (e) {
   showToast('error', e.response?.data?.error || 'Failed to seal manifest');
  }
  setLoading(false);
 };

 // ── 3. Advance status ────────────────────────────────────────────────────
 const advanceStatus = async (newStatus) => {
  setLoading(true);
  try {
   const res = await axios.patch(`${API}/cargo/manifest/${manifestId}/status`, { status: newStatus });
   setManifest(res.data.manifest);
   showToast('success', `Status advanced to"${newStatus}"`);
  } catch (e) {
   showToast('error', e.response?.data?.error || 'Failed to advance status');
  }
  setLoading(false);
 };

 // ── 4. Verify at arrival ─────────────────────────────────────────────────
 const verifyManifest = async (tamper) => {
  setLoading(true);
  const itemsToVerify = tamper
   ? [
     { item_id: '1', qty: 40, name: 'Diesel Drums' },  // tampered
     { item_id: '2', qty: 200, name: 'Rations' },
     { item_id: '3', qty: 30, name: 'Medical Kits' },
    ]
   : sampleItems;
  try {
   const res = await axios.post(`${API}/cargo/verify`, {
    manifest_id: manifestId,
    vessel_mmsi: vesselMmsi,
    items: itemsToVerify,
   });
   showToast('success', `Integrity Verified — hashes match (${res.data.stored_hash.substring(0, 16)}…)`);
   // Refresh manifest
   fetchManifest();
  } catch (e) {
   if (e.response?.status === 400 && e.response.data.hash_mismatch) {
    showToast('error', 'TAMPER ALERT: Cryptographic hash mismatch detected!');
    fetchManifest();
   } else {
    showToast('error', e.response?.data?.error || 'Verification failed');
   }
  }
  setLoading(false);
 };

 // ── Fetch current state ──────────────────────────────────────────────────
 const fetchManifest = async () => {
  try {
   const res = await axios.get(`${API}/cargo/manifest/${manifestId}`);
   setManifest(res.data);
  } catch (_) {
   setManifest(null);
  }
 };

 useEffect(() => { fetchManifest(); }, [manifestId]);

 // ── Derived state ─────────────────────────────────────────────────────────
 const currentIdx = manifest ? STATUS_PIPELINE.indexOf(manifest.status) : -1;
 const isSealed = manifest?.crypto_hash != null;
 const nextStatus = currentIdx >= 0 && currentIdx < STATUS_PIPELINE.length - 1
  ? STATUS_PIPELINE[currentIdx + 1]
  : null;

 return (
  <div className="page-container">
   <h1><Package style={{display:'inline', marginRight:12, verticalAlign:'bottom'}} /> Immutable Cargo Ledger</h1>

   {/* ── Toast ──────────────────────────────────────────────────────────── */}
   {toast && (
    <div style={{
     padding: '16px', marginBottom: '24px', borderRadius: '8px',
     background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
     color: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
     border: `1px solid ${toast.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
     display: 'flex', alignItems: 'center', gap: '12px',
    }}>
     {toast.type === 'error' ? <ShieldAlert size={24}/> : <ShieldCheck size={24}/>}
     <strong>{toast.msg}</strong>
    </div>
   )}

   {/* ── Status Pipeline Visualisation ──────────────────────────────────── */}
   {manifest && (
    <div className="glass-panel" style={{ marginBottom: '24px' }}>
     <h2 style={{ marginBottom: '16px' }}>Status Pipeline</h2>
     <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
      {STATUS_PIPELINE.map((s, i) => {
       const isCurrent = s === manifest.status;
       const isPast = i < currentIdx;
       return (
        <React.Fragment key={s}>
         <div style={{
          padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
          background: isCurrent ? 'var(--accent-primary)' : isPast ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.06)',
          color: isCurrent ? '#0f172a' : isPast ? 'var(--success)' : 'var(--text-muted)',
          border: isCurrent ? '2px solid var(--accent-primary)' : '1px solid transparent',
          transition: 'all 0.3s',
         }}>
          {s}
         </div>
         {i < STATUS_PIPELINE.length - 1 && <ChevronRight size={16} color="var(--text-muted)" />}
        </React.Fragment>
       );
      })}
     </div>

     {/* Advance button */}
     {nextStatus && (
      <button
       className="btn"
       style={{ marginTop: '16px' }}
       disabled={loading || (!isSealed && STATUS_PIPELINE.indexOf(nextStatus) >= 2)}
       onClick={() => advanceStatus(nextStatus)}
      >
       Advance to"{nextStatus}" <ArrowRight size={16} />
      </button>
     )}
     {!isSealed && nextStatus && STATUS_PIPELINE.indexOf(nextStatus) >= 2 && (
      <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: 'var(--warning)' }}>
       ⚠ Must seal manifest first
      </span>
     )}
    </div>
   )}

   <div className="grid-2">
    {/* ── Left: Create & Seal ────────────────────────────────────────── */}
    <div className="glass-panel">
     <h2><FileText size={20} style={{display:'inline', marginRight:8}}/> 1. Create & Seal (Goa HQ)</h2>
     <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
      Create a manifest, then seal it to generate an immutable SHA-256 hash of the full payload.
     </p>

     <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '0.85rem' }}>Manifest ID</label>
      <input type="text" value={manifestId} onChange={e => setManifestId(e.target.value)} style={{marginTop:'6px'}} />
     </div>

     <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '0.85rem' }}>Payload ({sampleItems.length} items)</label>
      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', marginTop: '6px', fontSize: '0.78rem', maxHeight: '140px', overflowY: 'auto' }}>
       {JSON.stringify(sampleItems, null, 2)}
      </pre>
     </div>

     <div style={{ display: 'flex', gap: '12px' }}>
      <button className="btn secondary" onClick={createManifest} disabled={loading}>
       <Unlock size={16}/> Create Draft
      </button>
      <button className="btn" onClick={sealManifest} disabled={loading || !manifest || isSealed}>
       <Lock size={16}/> Seal & Hash
      </button>
     </div>
    </div>

    {/* ── Right: Verify at Arrival ───────────────────────────────────── */}
    <div className="glass-panel">
     <h2><QrCode size={20} style={{display:'inline', marginRight:8}}/> 2. Verify at Ice Shelf</h2>
     <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
      Re-hash the scanned contents on arrival and compare against the sealed hash. Any byte difference triggers a Tamper Alert.
     </p>

     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
      <button
       className="btn" style={{ background: 'var(--success)' }}
       onClick={() => verifyManifest(false)}
       disabled={loading || !isSealed}
      >
       <ShieldCheck size={16}/> Simulate Scan: Untampered Cargo
      </button>
      <button
       className="btn danger"
       onClick={() => verifyManifest(true)}
       disabled={loading || !isSealed}
      >
       <ShieldAlert size={16}/> Simulate Scan: Tampered (Qty 50 → 40)
      </button>
      {!isSealed && (
       <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Seal the manifest first to enable verification.
       </span>
      )}
     </div>
    </div>
   </div>

   {/* ── Hash Audit Trail ─────────────────────────────────────────────── */}
   {manifest && isSealed && (
    <div className="glass-panel" style={{ marginTop: '24px' }}>
     <h2><Hash size={20} style={{display:'inline', marginRight:8}}/> Cryptographic Audit Trail</h2>

     <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', fontSize: '0.9rem', marginTop: '12px' }}>
      <span style={{ color: 'var(--text-muted)' }}>Sealed At</span>
      <span style={{ fontFamily: 'monospace' }}>{new Date(manifest.sealed_at).toISOString()}</span>

      <span style={{ color: 'var(--text-muted)' }}>SHA-256 Hash</span>
      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#3B82F6' }}>{manifest.crypto_hash}</span>

      <span style={{ color: 'var(--text-muted)' }}>Canonical JSON</span>
      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
       {manifest.sealed_payload_json}
      </pre>

      <span style={{ color: 'var(--text-muted)' }}>Tamper Status</span>
      <span>
       {manifest.tamper_detected
        ? <span className="badge unsafe">TAMPERED</span>
        : <span className="badge safe">CLEAN</span>
       }
      </span>
     </div>

     {/* Tamper alert log */}
     {manifest.tamper_alerts && manifest.tamper_alerts.length > 0 && (
      <div style={{ marginTop: '20px' }}>
       <h3 style={{ color: 'var(--danger)', marginBottom: '12px' }}>⚠ Tamper Alerts ({manifest.tamper_alerts.length})</h3>
       {manifest.tamper_alerts.map((alert, i) => (
        <div key={i} style={{
         background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)',
         borderRadius: '8px', padding: '12px', marginBottom: '8px', fontSize: '0.85rem',
        }}>
         <div><strong>Detected:</strong> {new Date(alert.detected_at).toISOString()}</div>
         <div style={{ marginTop: '4px' }}>
          <strong>Stored:</strong>{' '}
          <code style={{ color: 'var(--success)' }}>{alert.stored_hash?.substring(0, 24)}…</code>
         </div>
         <div>
          <strong>Incoming:</strong>{' '}
          <code style={{ color: 'var(--danger)' }}>{alert.incoming_hash?.substring(0, 24)}…</code>
         </div>
        </div>
       ))}
      </div>
     )}
    </div>
   )}
  </div>
 );
}

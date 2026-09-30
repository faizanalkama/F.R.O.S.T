import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Database, Plus, Minus, Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { doc, inventoryMap, syncStatus, setupSync } from '../utils/store';
import * as Y from 'yjs';
import { getWsUrl } from '../api';

export default function Inventory() {
 const [items, setItems] = useState([]);
 const [connected, setConnected] = useState(false);
 const [changeLog, setChangeLog] = useState([]);
 const syncRef = useRef(null);

 useEffect(() => {
  // Connect CRDT sync
  syncRef.current = setupSync(getWsUrl('/crdt'));

  // Track connection state changes
  const onStatus = (e) => setConnected(e.detail.connected);
  window.addEventListener('syncStatusChange', onStatus);

  return () => {
   window.removeEventListener('syncStatusChange', onStatus);
   if (syncRef.current) syncRef.current.disconnect();
  };
 }, []);

 useEffect(() => {
  // Sync UI state from Yjs map
  const updateState = () => {
   const arr = [];
   inventoryMap.forEach((val, key) => arr.push({ id: key, ...val }));
   setItems(arr);
  };
  updateState();
  inventoryMap.observe(updateState);
  return () => inventoryMap.unobserve(updateState);
 }, []);

 // Seed initial data if empty
 useEffect(() => {
  if (inventoryMap.size === 0) {
   const seed = [
    { name: 'Aviation Turbine Fuel (ATF)', category: 'Fuel',       qty: 15000, unit: 'Liters', threshold: 2000 },
    { name: 'Epinephrine',         category: 'Medical',     qty: 50,  unit: 'Vials', threshold: 10  },
    { name: 'Generator Bearings',     category: 'Technical Spares', qty: 12,  unit: 'Units', threshold: 5  },
    { name: 'Freeze-Dried Rations',    category: 'Perishables',   qty: 800,  unit: 'Packs', threshold: 200 },
    { name: 'Diesel (Ground Transport)',  category: 'Fuel',       qty: 8000, unit: 'Liters', threshold: 1500 },
    { name: 'Ibuprofen Tablets',      category: 'Medical',     qty: 300,  unit: 'Tabs',  threshold: 50  },
   ];
   seed.forEach((item, i) => inventoryMap.set(String(i + 1), item));
  }
 }, []);

 const updateQuantity = (id, delta) => {
  const item = inventoryMap.get(id);
  if (!item) return;
  const newQty = Math.max(0, item.qty + delta);
  inventoryMap.set(id, { ...item, qty: newQty });

  setChangeLog(prev => [
   {
    time: new Date().toLocaleTimeString(),
    item: item.name,
    from: item.qty,
    to: newQty,
    offline: !connected,
   },
   ...prev,
  ].slice(0, 20));
 };

 // Quick action: large decrement
 const quickDecrement = (id, amount) => updateQuantity(id, -amount);

 // ── Category tabs ─────────────────────────────────────────────────────────
 const [activeCategory, setActiveCategory] = useState('All');
 const categories = ['All', ...new Set(items.map(i => i.category))];
 const filteredItems = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

 return (
  <div className="page-container">
   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
    <h1><Database style={{display:'inline', marginRight:12, verticalAlign:'bottom'}} /> Offline-First Inventory</h1>
    <div style={{
     display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
     borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600,
     background: connected ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
     color: connected ? 'var(--success)' : 'var(--warning)',
     border: `1px solid ${connected ? 'var(--success)' : 'var(--warning)'}`,
    }}>
     {connected ? <Wifi size={16}/> : <WifiOff size={16}/>}
     {connected ? 'Cloud Synced' : 'Edge / Offline'}
    </div>
   </div>

   <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
    All changes are recorded locally via CRDT (Yjs). When offline, edits are queued to IndexedDB and automatically merged conflict-free on reconnect.
   </p>

   {/* ── Category Filter Tabs ─────────────────────────────────────────── */}
   <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
    {categories.map(cat => (
     <button
      key={cat}
      className={`btn ${activeCategory === cat ? '' : 'secondary'}`}
      style={{ padding: '6px 16px', fontSize: '0.85rem' }}
      onClick={() => setActiveCategory(cat)}
     >
      {cat}
     </button>
    ))}
   </div>

   {/* ── Inventory Cards ──────────────────────────────────────────────── */}
   <div className="grid-3">
    {filteredItems.map(item => {
     const isCritical = item.qty <= item.threshold;
     const burnRate = item.category === 'Fuel' ? 150 : item.category === 'Perishables' ? 10 : 1;
     const daysRemaining = burnRate > 0 ? Math.floor(item.qty / burnRate) : Infinity;
     const nextResupply = 45; // days until next scheduled vessel
     const willDeplete = daysRemaining < nextResupply;

     return (
      <div key={item.id} className="glass-panel" style={{
       border: isCritical ? '2px solid var(--danger)' : willDeplete ? '1px solid var(--warning)' : '',
       animation: isCritical ? 'pulse-red 2s infinite' : 'none',
      }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
         <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name}</h3>
         <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.category}</span>
        </div>
        {isCritical && <AlertTriangle color="var(--danger)" />}
       </div>

       <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '4px', color: isCritical ? 'var(--danger)' : 'var(--text-main)' }}>
        {item.qty.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{item.unit}</span>
       </div>

       {/* Burn-rate depletion warning (runs fully offline) */}
       {willDeplete && (
        <div style={{
         background: isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
         color: isCritical ? 'var(--danger)' : 'var(--warning)',
         padding: '8px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '12px',
         display: 'flex', alignItems: 'center', gap: '6px',
        }}>
         <Clock size={14}/>
         {isCritical
          ? `CRITICAL — ≈${daysRemaining}d left (resupply in ${nextResupply}d)`
          : `Will deplete in ≈${daysRemaining}d — resupply in ${nextResupply}d`
         }
        </div>
       )}

       {/* Quick actions — touch-friendly large buttons */}
       <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button className="btn secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={() => quickDecrement(item.id, 50)}>
         <Minus size={16}/> 50
        </button>
        <button className="btn secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={() => quickDecrement(item.id, 10)}>
         <Minus size={16}/> 10
        </button>
        <button className="btn" style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={() => updateQuantity(item.id, 10)}>
         <Plus size={16}/> 10
        </button>
       </div>
      </div>
     );
    })}
   </div>

   {/* ── Change Log (CRDT merge audit) ────────────────────────────────── */}
   <div className="glass-panel" style={{ marginTop: '24px' }}>
    <h2><RefreshCw size={20} style={{display:'inline', marginRight:8}}/> CRDT Change Log</h2>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
     Every change is a Y.js CRDT operation. Offline changes (marked ⚡) are queued to IndexedDB and merged on reconnect — zero data loss.
    </p>

    {changeLog.length === 0 && (
     <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No changes yet — adjust quantities above to see the log.</p>
    )}

    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
     {changeLog.map((entry, i) => (
      <div key={i} style={{
       padding: '8px 12px', borderBottom: '1px solid var(--border-color)',
       fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
       <span>
        <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>{entry.time}</span>
        <strong>{entry.item}</strong>: {entry.from} → {entry.to}
       </span>
       <span style={{
        padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
        background: entry.offline ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
        color: entry.offline ? 'var(--warning)' : 'var(--success)',
       }}>
        {entry.offline ? '⚡ QUEUED' : '✓ SYNCED'}
       </span>
      </div>
     ))}
    </div>
   </div>
  </div>
 );
}

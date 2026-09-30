import { BACKEND_URL } from '../../api';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Search, Plus, Minus, AlertCircle, Send, X, Clock, CloudOff, RefreshCw, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';

const mockData = [];

const API_BASE = `${BACKEND_URL}/api/v1`;
const MOVEMENT_QUEUE_KEY = 'icenet.inventoryMovementQueue';
let movementSyncPromise = null;

function readMovementQueue() {
  try {
    return JSON.parse(localStorage.getItem(MOVEMENT_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function flushMovementQueue() {
  if (movementSyncPromise) return movementSyncPromise;

  movementSyncPromise = (async () => {
    while (true) {
      const [movement] = readMovementQueue();
      if (!movement) break;

      try {
        const response = await fetch(`${API_BASE}/inventory/movements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movement),
        });
        if (!response.ok) break;
        const currentQueue = readMovementQueue();
        localStorage.setItem(
          MOVEMENT_QUEUE_KEY,
          JSON.stringify(currentQueue.filter(queued => queued.client_event_id !== movement.client_event_id))
        );
      } catch {
        break;
      }
    }
  })().finally(() => {
    movementSyncPromise = null;
  });

  return movementSyncPromise;
}

function queueMovement(station, item, quantityDelta, stockAfter, movementType) {
  const clientEventId = globalThis.crypto?.randomUUID?.()
    || `${station}-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const movement = {
    client_event_id: clientEventId,
    station,
    item_id: String(item.id),
    name: item.name,
    category: item.category,
    unit: item.unit,
    quantity_delta: quantityDelta,
    stock_after: stockAfter,
    movement_type: movementType || (quantityDelta === 0 ? 'snapshot' : quantityDelta < 0 ? 'consumption' : 'restock'),
    critical_threshold: item.criticalThreshold,
    lead_time_days: item.leadTimeDays,
    unit_cost: item.unitCost,
    recorded_at: new Date().toISOString(),
  };

  localStorage.setItem(MOVEMENT_QUEUE_KEY, JSON.stringify([...readMovementQueue(), movement]));
  void flushMovementQueue();
}

function InventoryCard({ item, onRemove, onAdjust }) {
  const [draftQty, setDraftQty] = useState('');

  const handleAdjustDraft = (amount) => {
    const current = parseInt(draftQty) || 0;
    setDraftQty((current + amount).toString());
  };

  const handleApplyAdd = () => {
    const val = parseInt(draftQty);
    if (!isNaN(val) && val !== 0) {
      onAdjust(item.id, Math.abs(val), 'restock');
      setDraftQty('');
    }
  };

  const handleApplyRemove = () => {
    const val = parseInt(draftQty);
    if (!isNaN(val) && val !== 0) {
      onAdjust(item.id, -Math.abs(val), 'consumption');
      setDraftQty('');
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-surface/80 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col hover:border-[var(--border-hover)] transition-colors relative group"
    >
      <button 
        onClick={() => onRemove(item.id)}
        className="absolute top-4 right-4 p-2 rounded-full bg-[var(--bg-panel-raised)] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--critical)] hover:bg-[var(--critical)]/10 z-10"
        title="Remove Item"
      >
        <Trash2 size={16} />
      </button>

      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 leading-tight pr-8">{item.name}</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">{item.category}</span>
        {item.shelfNumber && (
          <span className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] border border-border/50 px-1.5 py-0.5 rounded-sm uppercase">SHELF: {item.shelfNumber}</span>
        )}
      </div>
      
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-black font-['Space_Grotesk'] text-[var(--text-primary)] tracking-tight">
          {item.qty.toLocaleString()}
        </span>
        <span className="text-sm font-medium text-[var(--text-secondary)]">{item.unit}</span>
      </div>

      {item.warning && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-500 text-xs font-semibold">
          <AlertCircle size={14} />
          {item.warning}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button onClick={() => handleAdjustDraft(-10)} className="py-2 bg-[var(--bg-primary)] border border-border/50 rounded text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors">- 10</button>
          <button onClick={() => handleAdjustDraft(10)} className="py-2 bg-[var(--bg-panel-raised)] border border-border/50 rounded text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors">+ 10</button>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <input 
            type="number" 
            placeholder="Custom qty..." 
            value={draftQty}
            onChange={(e) => setDraftQty(e.target.value)}
            className="flex-1 min-w-0 bg-[var(--bg-primary)] border border-border/50 rounded px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
          <button onClick={handleApplyRemove} className="px-3 py-2 bg-[var(--bg-primary)] border border-border/50 rounded text-[var(--text-secondary)] hover:text-[var(--critical)] hover:border-[var(--critical)] transition-colors shrink-0 transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto">
            <Minus size={14} />
          </button>
          <button onClick={handleApplyAdd} className="px-4 py-2 bg-[var(--bg-panel-raised)] border border-border/50 rounded flex items-center gap-1 text-xs font-bold text-[var(--text-primary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-colors shrink-0 transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CommanderInventory() {
  const [station] = useState(() => localStorage.getItem('activeStation') || 'maitri');
  const [items, setItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem(`icenet.inventory.${station}`);
      return savedItems ? JSON.parse(savedItems) : mockData;
    } catch {
      return mockData;
    }
  });
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [runwayItems, setRunwayItems] = useState([]);
  const [runwayError, setRunwayError] = useState('');

  useEffect(() => {
    localStorage.setItem(`icenet.inventory.${station}`, JSON.stringify(items));
  }, [items, station]);

  useEffect(() => {
    const snapshotKey = `icenet.inventorySnapshot.${station}.${new Date().toISOString().slice(0, 10)}`;
    if (!localStorage.getItem(snapshotKey)) {
      localStorage.setItem(snapshotKey, 'recorded');
      items.forEach(item => queueMovement(station, item, 0, item.qty));
    }

    void flushMovementQueue();
    window.addEventListener('online', flushMovementQueue);
    return () => window.removeEventListener('online', flushMovementQueue);
  }, [station]);

  useEffect(() => {
    let active = true;
    const loadRunway = async () => {
      try {
        const response = await fetch(`${API_BASE}/inventory/forecast?station=${encodeURIComponent(station)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load stock outlook');
        if (active) {
          setRunwayItems(result.items || []);
          setRunwayError('');
        }
      } catch (error) {
        if (active) setRunwayError(error.message || 'Could not load stock outlook');
      }
    };

    loadRunway();
    const refreshTimer = setInterval(loadRunway, 15000);
    return () => {
      active = false;
      clearInterval(refreshTimer);
    };
  }, [station]);

  // Add Item Modal State
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItemData, setNewItemData] = useState({ name: '', category: 'FUEL', qty: '', unit: '', warning: '', shelfNumber: '' });

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      ...newItemData,
      id: Date.now(),
      qty: Number(newItemData.qty)
    };
    setItems([newItem, ...items]);
    queueMovement(station, newItem, 0, newItem.qty);
    setIsAddItemModalOpen(false);
    setNewItemData({ name: '', category: 'FUEL', qty: '', unit: '', warning: '', shelfNumber: '' });
  };

  // Delete Item State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleRequestRemoveItem = (id) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setItemToDelete(item);
      setDeleteConfirmText('');
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = (e) => {
    e.preventDefault();
    if (deleteConfirmText === 'REMOVE' && itemToDelete) {
      queueMovement(station, itemToDelete, -itemToDelete.qty, 0, 'disposal');
      setItems(items.filter(item => item.id !== itemToDelete.id));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Requisition State
  const [reqAsset, setReqAsset] = useState('');
  const [customAsset, setCustomAsset] = useState('');
  const [reqQty, setReqQty] = useState('');
  const [reqUrgency, setReqUrgency] = useState('ROUTINE');
  const [syncState, setSyncState] = useState('IDLE');

  // Status Log State
  const [reqHistory, setReqHistory] = useState([]);
  const [requisitionError, setRequisitionError] = useState('');

  useEffect(() => {
    let active = true;
    const loadRequisitions = async () => {
      try {
        const response = await fetch(`${API_BASE}/requisitions?station=${encodeURIComponent(station)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load requisitions');
        if (active) {
          setReqHistory(data.map(req => ({
            id: req.requisition_id,
            item: req.item,
            qty: req.quantity,
            unit: req.unit,
            urgency: req.urgency,
            status: req.status,
            time: new Date(req.created_at).toLocaleTimeString(),
          })));
          setRequisitionError('');
        }
      } catch (error) {
        if (active) setRequisitionError(error.message || 'Could not load requisitions');
      }
    };

    loadRequisitions();
    const refreshTimer = setInterval(loadRequisitions, 15000);
    return () => {
      active = false;
      clearInterval(refreshTimer);
    };
  }, [station]);

  const tabs = ['All', 'Fuel', 'Medical', 'Technical Spares', 'Perishables'];

  const handleAdjust = (id, amount, movementType) => {
    const item = items.find(existingItem => existingItem.id === id);
    if (!item) return;
    const stockAfter = Math.max(0, item.qty + amount);
    const quantityDelta = stockAfter - item.qty;
    if (quantityDelta === 0) return;

    setItems(items.map(existingItem => existingItem.id === id ? { ...existingItem, qty: stockAfter } : existingItem));
    queueMovement(station, item, quantityDelta, stockAfter, movementType);
  };

  const handleRequisition = async (e) => {
    e.preventDefault();
    const finalAsset = reqAsset === 'OTHER' ? customAsset : reqAsset;
    if (!finalAsset || !reqQty) return;
    
    setSyncState('SYNCING');
    setRequisitionError('');
    
    const matched = items.find(i => i.name === reqAsset);
    const unit = matched ? matched.unit : (reqAsset === 'OTHER' ? 'Units' : '');
    
    try {
      const response = await fetch(`${API_BASE}/requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station, item: finalAsset, quantity: Number(reqQty), unit, urgency: reqUrgency }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not submit requisition');

      const req = result.requisition;
      setReqHistory(previous => [{
        id: req.requisition_id,
        item: req.item,
        qty: req.quantity,
        unit: req.unit,
        urgency: req.urgency,
        status: req.status,
        time: new Date(req.created_at).toLocaleTimeString(),
      }, ...previous]);
      setSyncState('QUEUED');
      setTimeout(() => setSyncState('IDLE'), 1200);
      setReqAsset('');
      setCustomAsset('');
      setReqQty('');
      setReqUrgency('ROUTINE');
      setIsModalOpen(false);
    } catch (error) {
      setSyncState('IDLE');
      setRequisitionError(error.message || 'Could not submit requisition');
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab !== 'All' && item.category !== activeTab.toUpperCase()) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const matchedItem = items.find(i => i.name === reqAsset);
  const derivedUnit = matchedItem ? matchedItem.unit : (reqAsset === 'OTHER' ? 'Units' : '');

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'QUEUED_LOCALLY':
        return { label: 'Queued Locally (Awaiting Uplink)', icon: CloudOff, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' };
      case 'IN_TRANSIT_UNCONFIRMED':
        return { label: 'In Transit (No HQ Delivery Confirmation)', icon: Radio, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' };
      case 'PENDING_APPROVAL':
        return { label: 'Received at HQ (Awaiting Decision)', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' };
      case 'DECISION_IN_TRANSIT':
        return { label: 'Decision In Transit (Sync Pending)', icon: RefreshCw, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' };
      case 'ACKNOWLEDGED':
        return { label: 'Decision Acknowledged by Edge Node', icon: CheckCircle, color: 'text-[var(--ok)]', bg: 'bg-[var(--ok)]/10 border-[var(--ok)]/30' };
      case 'APPROVED':
        return { label: 'Approved by Admin', icon: CheckCircle, color: 'text-[var(--ok)]', bg: 'bg-[var(--ok)]/10 border-[var(--ok)]/30' };
      case 'DENIED':
        return { label: 'Denied', icon: XCircle, color: 'text-[var(--critical)]', bg: 'bg-[var(--critical)]/10 border-[var(--critical)]/30' };
      default:
        return { label: status, icon: Clock, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--bg-panel-raised)] border-border/50' };
    }
  };

  return (
    <div className="w-full h-full p-4 lg:p-8 overflow-y-auto font-['Work_Sans'] flex flex-col relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foregroundfont-['Space_Grotesk'] text-[var(--text-primary)] tracking-tight mb-2">Offline-First Inventory</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--ok)]/10 border border-[var(--ok)]/30 rounded-full text-[var(--ok)] shadow-sm hover:shadow-md">
          <Wifi size={16} />
          <span className="text-sm font-bold tracking-wide">Local Stock</span>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] border border-border/50 hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-raised)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Add Item */}
        <div className="flex w-full lg:w-auto gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-panel)] border border-border/50 rounded-xl pl-9 pr-4 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)] shadow-sm hover:shadow-md transition-colors"
            />
          </div>
          {/* Restored Add Item Button */}
          <button 
            onClick={() => setIsAddItemModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 bg-[var(--bg-panel-raised)] text-[var(--text-primary)] border border-border/50 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md shrink-0"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8 shrink-0">
        <AnimatePresence>
          {filteredItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="col-span-full py-16 flex flex-col items-center justify-center text-[var(--text-secondary)]"
            >
              <AlertCircle size={40} className="mb-4 opacity-50 text-[var(--accent-primary)]" />
              <p className="text-sm font-semibold tracking-wide">Zero active items match your criteria.</p>
              <p className="text-xs opacity-70 mt-1">Try adjusting your filters or adding a new item.</p>
            </motion.div>
          ) : (
            filteredItems.map(item => (
              <InventoryCard 
                key={item.id} 
                item={item} 
                onRemove={handleRequestRemoveItem} 
                onAdjust={handleAdjust} 
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <section className="mb-8 border border-border/50 bg-[var(--bg-panel)] p-4" aria-labelledby="stock-runway-heading">
        <h2 id="stock-runway-heading" className="mb-3 text-sm font-bold text-[var(--text-primary)]">Stock Runway</h2>
        {runwayError ? (
          <p role="alert" className="text-xs text-[var(--critical)]">{runwayError}</p>
        ) : runwayItems.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)]">Waiting for stock snapshot.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {runwayItems.map(item => (
              <div key={item.item_id} className="flex items-center justify-between gap-3 border border-border/50 bg-[var(--bg-primary)] px-3 py-2">
                <div className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">{item.name}</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">{Number(item.current_stock).toLocaleString()} {item.unit}</span>
                </div>
                <span className={`shrink-0 text-right text-[10px] font-semibold ${item.status === 'reorder_now' ? 'text-[var(--critical)]' : 'text-[var(--accent-primary)]'}`}>
                  {item.days_until_stockout !== null
                    ? `Run out ~${Math.ceil(item.days_until_stockout)}d`
                    : item.status === 'reorder_now' ? 'Reorder now' : 'Collecting history'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────
          BOTTOM SECTION: REQUEST ASSET BUTTON + LIFECYCLE LOG
          ────────────────────────────────────────────────────────── */}
      <div className="mt-auto grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 shrink-0">
        
        {/* Request Asset Action Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 xl:col-span-8 bg-surface/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm hover:shadow-md p-4 md:p-8 flex flex-col items-center justify-center min-h-[250px]"
        >
          <div className="text-center max-w-md">
            <h3 className="text-xl font-bold text-[var(--text-primary)] font-['Space_Grotesk'] mb-3">Official Station Requisition</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto px-10 py-4 bg-gradient-to-b from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 border border-blue-400/30 rounded-2xl text-base font-bold transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto"
            >
              <Send size={20} /> Request Asset
            </button>
          </div>
        </motion.div>

        {/* Status Lifecycle Log */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 xl:col-span-4 bg-surface/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm hover:shadow-md p-5 flex flex-col h-full min-h-[250px] max-h-[300px]"
        >
          <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={16} /> Request Lifecycle Status
          </h3>
          {requisitionError && <p role="alert" className="mb-3 text-xs text-[var(--critical)]">{requisitionError}</p>}
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {reqHistory.length === 0 && (
                <p className="text-xs text-[var(--text-secondary)] italic">No active requests.</p>
              )}
              {reqHistory.map((req) => {
                const ui = getStatusDisplay(req.status);
                const Icon = ui.icon;
                return (
                  <motion.div 
                    key={req.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-xl border ${ui.bg} flex flex-col gap-2 shadow-sm transition-colors duration-500`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-[var(--text-primary)] leading-tight">{req.qty} {req.unit} <br/><span className="text-[var(--text-secondary)] text-xs font-normal">{req.item}</span></span>
                      <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-80">{req.time}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-[11px] font-bold tracking-wide ${ui.color}`}>
                      <Icon size={14} className={req.status === 'DECISION_QUEUED' ? 'animate-spin' : ''} />
                      {ui.label}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>

      {/* ──────────────────────────────────────────────────────────
          MODAL: Submit Official Station Requisition
          ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[var(--bg-panel-raised)] border border-border/50 rounded-2xl shadow-2xl overflow-hidden font-['Work_Sans'] relative"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center bg-[var(--bg-panel)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent pointer-events-none"></div>
                <h2 className="text-lg font-bold text-[var(--accent-primary)] font-['Space_Grotesk'] tracking-wide relative z-10">
                  Submit Official Station Requisition
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-[var(--text-secondary)] hover:text-[var(--critical)] transition-colors relative z-10"
                >
                  <X size={20}/>
                </button>
              </div>
              
              {/* Modal Body */}
              <form onSubmit={handleRequisition} className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
                
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                    Target Inventory Item
                  </label>
                  <div className="relative">
                    <select 
                      value={reqAsset}
                      onChange={(e) => setReqAsset(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-border/50 text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors appearance-none shadow-inner cursor-pointer"
                    >
                      <option value="" disabled>Select from database...</option>
                      {items.map(i => (
                        <option key={i.id} value={i.name}>
                          {i.name}
                        </option>
                      ))}
                      <option value="OTHER">Other (Add New Asset)...</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>

                  <AnimatePresence>
                    {reqAsset === 'OTHER' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <input 
                          type="text" 
                          required
                          placeholder="Enter new asset name..." 
                          value={customAsset}
                          onChange={(e) => setCustomAsset(e.target.value)}
                          className="mt-3 w-full bg-[var(--bg-primary)] border border-border/50 text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors shadow-inner"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest flex justify-between">
                    <span>Requested Quantity</span>
                    {derivedUnit && <span className="text-[var(--accent-primary)]">({derivedUnit.toUpperCase()})</span>}
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-[var(--bg-primary)] border border-border/50 text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                    Priority Level
                  </label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <button 
                      type="button" 
                      onClick={() => setReqUrgency('ROUTINE')}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all duration-300 ${
                        reqUrgency === 'ROUTINE' 
                          ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                          : 'bg-[var(--bg-primary)] border-border/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
                      }`}
                    >
                      ROUTINE
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setReqUrgency('CRITICAL')}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all duration-300 ${
                        reqUrgency === 'CRITICAL' 
                          ? 'bg-[var(--critical)] text-white border-[var(--critical)] shadow-[0_0_15px_rgba(225,29,72,0.3)]' 
                          : 'bg-[var(--bg-primary)] border-border/50 text-[var(--text-secondary)] hover:text-[var(--critical)] hover:bg-[var(--critical)]/10 hover:border-[var(--critical)]/50'
                      }`}
                    >
                      CRITICAL
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-2 pt-5 border-t border-border/50 flex justify-end items-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={syncState !== 'IDLE'}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-80 min-w-[200px] flex justify-center items-center ${
                      syncState === 'QUEUED' 
                        ? 'bg-[var(--ok)] text-white' 
                        : 'bg-gradient-to-b from-[var(--accent-primary)] to-blue-600 hover:from-blue-400 hover:to-[var(--accent-primary)] text-white border border-blue-400/30'
                    }`}
                  >
                    {syncState === 'IDLE' ? 'Transmit Requisition' : (syncState === 'SYNCING' ? 'SYNCING...' : 'QUEUED')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────
          MODAL: Add New Local Item
          ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddItemModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[var(--bg-panel-raised)] border border-border/50 rounded-2xl shadow-2xl overflow-hidden font-['Work_Sans'] relative"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center bg-[var(--bg-panel)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--ok)]/10 to-transparent pointer-events-none"></div>
                <h2 className="text-lg font-bold text-[var(--ok)] font-['Space_Grotesk'] tracking-wide relative z-10">
                  Add Local Inventory Item
                </h2>
                <button 
                  onClick={() => setIsAddItemModalOpen(false)} 
                  className="text-[var(--text-secondary)] hover:text-[var(--critical)] transition-colors relative z-10"
                >
                  <X size={20}/>
                </button>
              </div>
              
              {/* Modal Body */}
              <form onSubmit={handleAddItemSubmit} className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                    Item Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={newItemData.name}
                    onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                    placeholder="e.g. Spare Battery Pack"
                    className="w-full bg-[var(--bg-primary)] border border-border/50 text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ok)] transition-colors shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                      Category
                    </label>
                    <select 
                      value={newItemData.category}
                      onChange={(e) => setNewItemData({...newItemData, category: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-border/50 text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ok)] transition-colors appearance-none shadow-inner cursor-pointer"
                    >
                      <option value="FUEL">FUEL</option>
                      <option value="MEDICAL">MEDICAL</option>
                      <option value="TECHNICAL SPARES">TECHNICAL SPARES</option>
                      <option value="PERISHABLES">PERISHABLES</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                      Unit
                    </label>
                    <input 
                      type="text" 
                      required
                      value={newItemData.unit}
                      onChange={(e) => setNewItemData({...newItemData, unit: e.target.value})}
                      placeholder="e.g. Liters, Units"
                      className="w-full bg-[var(--bg-primary)] border border-border/50 text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ok)] transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                      Initial Quantity
                    </label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={newItemData.qty}
                      onChange={(e) => setNewItemData({...newItemData, qty: e.target.value})}
                      placeholder="Enter amount..."
                      className="w-full bg-[var(--bg-primary)] border border-border/50 text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ok)] transition-colors shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                      Shelf Number
                    </label>
                    <input 
                      type="text" 
                      value={newItemData.shelfNumber}
                      onChange={(e) => setNewItemData({...newItemData, shelfNumber: e.target.value})}
                      placeholder="e.g. TNK-04"
                      className="w-full bg-[var(--bg-primary)] border border-border/50 text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--ok)] transition-colors shadow-inner"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-2 pt-5 border-t border-border/50 flex justify-end items-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddItemModalOpen(false)} 
                    className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md bg-gradient-to-b from-[var(--ok)] to-green-600 hover:from-green-500 hover:to-[var(--ok)] text-white border border-green-400/30 w-full md:w-auto"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────
          MODAL: Confirm Delete Item
          ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDeleteModalOpen && itemToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[var(--bg-panel-raised)] border border-[var(--critical)]/50 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col relative font-['Work_Sans']"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--critical)]" />
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4 text-[var(--critical)]">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-bold font-['Space_Grotesk']">Confirm Deletion</h3>
                </div>
                <p className="text-[var(--text-secondary)] text-sm mb-4">
                  You are about to remove <strong className="text-[var(--text-primary)]">{itemToDelete.name}</strong> from the inventory. This action cannot be undone.
                </p>
                <p className="text-[var(--text-primary)] text-sm mb-2 font-medium">
                  Please type <strong className="text-[var(--critical)]">REMOVE</strong> to confirm:
                </p>
                <form onSubmit={handleConfirmDelete}>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type 'REMOVE' here"
                    className="w-full bg-[var(--bg-panel)] border border-border/50 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--critical)] transition-colors mb-6"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={deleteConfirmText !== 'REMOVE'}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--critical)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_var(--critical)] shadow-opacity-50 transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto"
                    >
                      Confirm Removal
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, CheckCircle, Clock, Search, X, Satellite, MapPin, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BACKEND_URL } from '../../api';

export default function AdminInventory() {
  const [activeCenter, setActiveCenter] = useState('Himadri');
  const [inventoryData, setInventoryData] = useState({ Himadri: [], Bharati: [], Maitri: [] });
  const [reqQueue, setReqQueue] = useState({ Himadri: [], Bharati: [], Maitri: [] });
  const [outboundQueue, setOutboundQueue] = useState({ Himadri: [], Bharati: [], Maitri: [] });
  const [mlInsights, setMlInsights] = useState({ Himadri: null, Bharati: null, Maitri: null });
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    let active = true;
    const loadStationData = async () => {
      setInventoryLoading(true);
      try {
        const [forecastResponse, requisitionResponse, insightsResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/api/v1/inventory/forecast?station=${activeCenter.toLowerCase()}`),
          fetch(`${BACKEND_URL}/api/v1/requisitions?station=${activeCenter.toLowerCase()}`),
          fetch(`${BACKEND_URL}/api/v1/ml/insights?station=${activeCenter.toLowerCase()}`)
        ]);
        const [forecast, requisitions, insights] = await Promise.all([forecastResponse.json(), requisitionResponse.json(), insightsResponse.json()]);
        
        if (!forecastResponse.ok) throw new Error(forecast.error || 'Could not load station inventory');
        if (!requisitionResponse.ok) throw new Error(requisitions.error || 'Could not load requisitions');
        if (!active) return;

        const stationRequests = requisitions.map(req => ({
          id: req.requisition_id,
          item: req.item,
          qty: req.quantity,
          unit: req.unit,
          time: req.created_at,
          urgency: req.urgency,
          status: req.status,
          decision: req.status === 'APPROVED' ? 'Approve' : 'Deny',
          outId: req.requisition_id,
        }));
        const pendingRequests = stationRequests.filter(req => req.status === 'PENDING_APPROVAL');
        const decidedRequests = stationRequests.filter(req => req.status === 'APPROVED' || req.status === 'DENIED');
        const pendingByItem = new Map();
        pendingRequests.forEach(req => pendingByItem.set(req.item, [...(pendingByItem.get(req.item) || []), req]));

        setInventoryData(previous => ({
          ...previous,
          [activeCenter]: (forecast.items || []).map(item => {
            const itemRequests = pendingByItem.get(item.name) || [];
            return {
              id: item.item_id,
              name: item.name,
              qty: item.current_stock,
              currentQty: item.current_stock,
              reqQty: itemRequests.reduce((total, req) => total + Number(req.qty), 0),
              reqTime: itemRequests[0]?.time || null,
              unit: item.unit,
              threshold: item.critical_threshold,
              daysToStockout: item.days_until_stockout,
              status: item.status,
            };
          }),
        }));
        setReqQueue(previous => ({ ...previous, [activeCenter]: pendingRequests }));
        setOutboundQueue(previous => ({ ...previous, [activeCenter]: decidedRequests }));
        
        if (insightsResponse.ok) {
           setMlInsights(prev => ({ ...prev, [activeCenter]: insights }));
        }

        setInventoryError('');
        setRequestError('');
      } catch (error) {
        if (active) setInventoryError(error.message || 'Could not load station data');
      } finally {
        if (active) setInventoryLoading(false);
      }
    };

    loadStationData();
    const refreshTimer = setInterval(loadStationData, 15000);
    return () => {
      active = false;
      clearInterval(refreshTimer);
    };
  }, [activeCenter]);

  const handleDecision = async (id, decision) => {
    setRequestError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/requisitions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update requisition');
      const requisition = result.requisition;
      const decided = {
        id: requisition.requisition_id,
        item: requisition.item,
        qty: requisition.quantity,
        unit: requisition.unit,
        time: requisition.created_at,
        urgency: requisition.urgency,
        status: requisition.status,
        decision: requisition.status === 'APPROVED' ? 'Approve' : 'Deny',
        outId: requisition.requisition_id,
      };
      setReqQueue(previous => ({ ...previous, [activeCenter]: previous[activeCenter].filter(req => req.id !== id) }));
      setOutboundQueue(previous => ({ ...previous, [activeCenter]: [decided, ...previous[activeCenter]] }));
      setInventoryData(previous => ({
        ...previous,
        [activeCenter]: previous[activeCenter].map(item => item.name === requisition.item
          ? { ...item, reqQty: Math.max(0, item.reqQty - Number(requisition.quantity)) }
          : item),
      }));
    } catch (error) {
      setRequestError(error.message || 'Could not update requisition');
    }
  };

  const handleApprove = id => handleDecision(id, 'APPROVED');
  const handleDeny = id => handleDecision(id, 'DENIED');

  const currentInventory = inventoryData[activeCenter];
  const currentReqs = reqQueue[activeCenter];
  const currentOutbound = outboundQueue[activeCenter];
  const currentInsights = mlInsights[activeCenter];

  return (
    <div className="w-full h-full p-4 lg:p-8 overflow-y-auto font-['Work_Sans']">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--bg-panel-raised)] rounded-xl shadow-[var(--shadow-glass)] border border-[var(--border)] text-[var(--accent-primary)]">
            <Database size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-[var(--text-primary)] tracking-tight">Station Inventory</h2>
          </div>
        </div>
      </div>

      {/* Station Selector */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-2">
          <MapPin size={14} /> Station
        </h3>
        <div className="flex flex-wrap gap-3">
          {['Himadri', 'Bharati', 'Maitri'].map(center => (
            <button 
              key={center}
              onClick={() => setActiveCenter(center)}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-3 ${
                activeCenter === center 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-400/30' 
                  : 'bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-raised)] hover:border-[var(--border-hover)]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${activeCenter === center ? 'bg-white animate-pulse' : 'bg-[var(--ok)]'}`}></span>
              <div className="flex flex-col items-start text-left">
                <span>{center} Station</span>
                <span className={`text-[9px] font-normal font-mono mt-0.5 ${activeCenter === center ? 'text-white/80' : 'text-[var(--text-secondary)] opacity-80'}`}>
                  {inventoryData[center].length} items · {reqQueue[center].length} pending
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {inventoryError && <p role="alert" className="mb-4 text-xs text-[var(--critical)]">{inventoryError}</p>}

      {/* ML Predictive Dashboard */}
      <AnimatePresence mode="wait">
        {currentInsights && (
          <motion.div
            key={`ml-${activeCenter}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 bg-[var(--bg-panel)] backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-[var(--shadow-glass)] p-6 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Activity size={100} />
            </div>
            
            <div className="flex items-center gap-2 mb-6">
              <Activity size={20} className="text-purple-400" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-['Space_Grotesk']">Predictive Insights</h3>
              <span className="ml-2 px-2 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded uppercase tracking-wider">AI Powered</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
              <div className="col-span-1 lg:col-span-1 flex flex-col gap-4">
                <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Flight Viability</p>
                  <p className={`text-xl font-black ${currentInsights.transport_viability?.safe ? 'text-[var(--ok)]' : 'text-[var(--critical)]'}`}>
                    {currentInsights.transport_viability?.safe ? 'SAFE TO FLY' : 'GROUNDED'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                    Whiteout Prob: {((currentInsights.transport_viability?.probability || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Aggregated Stock Level</p>
                  <p className="text-2xl font-black text-[var(--text-primary)]">
                    {currentInsights.projected_burn_rate?.[0]?.stock.toLocaleString() || '0'} <span className="text-sm text-[var(--text-secondary)]">units</span>
                  </p>
                </div>
              </div>

              <div className="col-span-1 lg:col-span-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-4 h-[250px]">
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-4">14-Day Projected Inventory Burn Rate</p>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={currentInsights.projected_burn_rate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-panel-raised)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}
                      itemStyle={{ color: 'var(--accent-primary)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stock" 
                      stroke="var(--accent-primary)" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'var(--bg-panel)', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'var(--accent-primary)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Module 1: Read-Only Inventory Mirror */}
        <div className="flex flex-col gap-6">
          <motion.div 
            key={`mirror-${activeCenter}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[var(--bg-panel)] backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-[var(--shadow-glass)] p-6"
          >
            <h3 className="text-lg font-bold text-[var(--text-primary)] font-['Space_Grotesk'] mb-4 flex items-center gap-2">
              <Search size={18} className="text-[var(--accent-primary)]" />
              {activeCenter} Inventory Mirror
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    <th className="pb-3 font-semibold">Asset ID</th>
                    <th className="pb-3 font-semibold">Asset Name</th>
                    <th className="pb-3 font-semibold text-right pr-4">Stock</th>
                    <th className="pb-3 font-semibold text-right pr-4">AI Forecast</th>
                    <th className="pb-3 font-semibold text-right pr-4">Requested Qty</th>
                    <th className="pb-3 font-semibold text-right">Req. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInventory.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-xs text-[var(--text-secondary)]">{inventoryLoading ? 'Loading station stock...' : 'No stock snapshots for this station yet.'}</td></tr>
                  )}
                  {currentInventory.map(item => (
                    <tr key={item.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-panel-raised)] transition-colors">
                      <td className="py-3 text-xs font-mono text-[var(--text-secondary)] opacity-50">SYS-{item.id}</td>
                      <td className="py-3 text-sm font-semibold text-[var(--text-primary)]">{item.name}</td>
                      <td className="py-3 text-sm font-mono text-amber-500 opacity-80">
                        <div className="flex justify-end items-baseline gap-2 w-[110px] ml-auto">
                          <span className="text-right flex-1">{item.qty}</span>
                          <span className="text-[10px] text-amber-500/50 w-10 text-left">{item.unit}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm font-mono text-[var(--text-primary)]">
                        <span className={`text-[10px] font-bold ${item.status === 'reorder_now' ? 'text-[var(--critical)]' : 'text-[var(--accent-primary)]'}`}>
                          {item.daysToStockout != null
                            ? `Run out ~${Math.ceil(item.daysToStockout)}d`
                            : item.status === 'reorder_now' ? 'Reorder now' : 'Collecting history'}
                        </span>
                      </td>
                      <td className="py-3 text-sm font-mono text-[var(--text-primary)]">
                        {item.reqQty > 0 ? (
                          <div className="flex justify-end items-baseline gap-2 w-[110px] ml-auto">
                            <span className="text-[var(--accent-primary)] font-bold text-right flex-1">+{item.reqQty}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] w-10 text-left">{item.unit}</span>
                          </div>
                        ) : (
                          <div className="flex justify-end items-baseline gap-2 w-[110px] ml-auto">
                            <span className="text-[var(--text-secondary)] text-right flex-1">-</span>
                            <span className="text-[10px] text-[var(--text-secondary)] w-10 text-left"></span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-[11px] font-mono text-[var(--text-secondary)] text-right">
                        {item.reqTime ? (
                          <div className="flex flex-col items-end">
                            <span>{new Date(item.reqTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            <span className="text-[10px] opacity-70 mt-0.5">{new Date(item.reqTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                          </div>
                        ) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          {/* Module 2: Requisition Queue */}
          {requestError && <p role="alert" className="text-xs text-[var(--critical)]">{requestError}</p>}
          <motion.div 
            key={`reqs-${activeCenter}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[var(--bg-panel)] backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-[var(--shadow-glass)] p-6"
          >
            <h3 className="text-lg font-bold text-[var(--text-primary)] font-['Space_Grotesk'] mb-4 flex items-center gap-2">
              <Database size={18} className="text-rose-500" />
              {activeCenter} Active Requisition Feed
            </h3>
            
            <div className="flex flex-col gap-4 min-h-[200px]">
              <AnimatePresence>
                {currentReqs.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-[var(--text-secondary)] italic">No pending requisitions from {activeCenter}.</p>
                  </motion.div>
                )}
                {currentReqs.map((req) => (
                  <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.9 }}
                    className="p-4 rounded-lg bg-[var(--bg-panel-raised)] border border-[var(--border)] shadow-[var(--shadow-glass)] hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-[var(--text-primary)] text-sm">Edge Request: <span className="text-rose-500">{req.qty}x {req.item}</span></h4>
                        <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-1"><Clock size={10} className="inline mr-1"/>{new Date(req.time).toLocaleString()}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border)] ${req.urgency === 'CRITICAL' ? 'text-[var(--critical)] animate-pulse' : 'text-[var(--text-secondary)]'}`}>
                        [{req.urgency}]
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(req.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-[var(--ok)]/10 hover:bg-[var(--ok)] text-[var(--ok)] hover:text-white border border-[var(--ok)]/30 rounded text-xs font-bold transition-colors shadow-sm"
                      >
                        <CheckCircle size={14} /> APPROVE
                      </button>
                      <button 
                        onClick={() => handleDeny(req.id)}
                        className="flex-none px-4 py-2 bg-[var(--bg-primary)] hover:bg-[var(--critical)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] rounded text-xs font-bold transition-colors shadow-sm"
                      >
                        <X size={14} /> DENY
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Module 3: Outbound Decision Queue */}
          <motion.div 
            key={`outbound-${activeCenter}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--bg-panel)] backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-[var(--shadow-glass)] p-6 overflow-hidden relative"
          >
            {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 bg-black/80 px-6 py-2 flex items-center justify-between border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Satellite size={14} className="text-[var(--accent-primary)]" />
                <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] tracking-widest">ADMIN DECISIONS</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">{currentOutbound.length} recorded</span>
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)] font-['Space_Grotesk'] mb-4 mt-8 flex items-center gap-2">
              <Clock size={18} className="text-[var(--text-secondary)]" />
              {activeCenter} Outbound Decision Queue
            </h3>

            <div className="bg-[var(--bg-primary)] rounded-lg border border-[var(--border)] p-4 shadow-inner min-h-[120px]">
              {currentOutbound.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] opacity-50 text-center mt-6">No decisions queued for next {activeCenter} pass.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  <AnimatePresence>
                    {currentOutbound.map(item => (
                      <motion.li 
                        key={item.outId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-sm font-mono flex items-center justify-between p-2 bg-[var(--bg-panel-raised)] rounded border border-[var(--border)]"
                      >
                        <span className="text-[var(--text-primary)] truncate max-w-[200px]">{item.qty}x {item.item}</span>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.decision === 'Approve' ? 'bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/30' : 'bg-[var(--critical)]/20 text-[var(--critical)] border border-[var(--critical)]/30'}`}>
                            {item.decision}
                          </span>
                          <span className="text-[9px] text-[var(--text-secondary)] opacity-80">{item.status}</span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
            <p className="text-[10px] text-center text-[var(--text-secondary)] mt-3">Waiting for next orbital pass to sync decisions to {activeCenter} Edge Node...</p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

import { BACKEND_URL } from '../../api';
import { Clock, Zap, PackageCheck, Radio, Thermometer, Shield, AlertTriangle } from 'lucide-react';

import { useState, useEffect } from 'react';

const severityColors = {
 normal:  'text-[var(--ok)]',
 warning: 'text-[var(--accent-primary)]',
 critical: 'text-[var(--critical)]',
};

const severityBorder = {
 normal:  'border-[var(--ok)]',
 warning: 'border-[var(--accent-primary)]',
 critical: 'border-[var(--critical)]',
};

export default function CommanderHistory() {
 const [station] = useState(() => localStorage.getItem('activeStation') || 'maitri');
 const [historyEntries, setHistoryEntries] = useState([]);

 useEffect(() => {
  const fetchLogs = async () => {
   try {
    const res = await fetch(`${BACKEND_URL}/api/v1/audit`);
    if (res.ok) {
     const data = await res.json();
     setHistoryEntries(data.filter(log => log.metadata?.commanderId === `CMD-${station.toUpperCase()}`).map(log => ({
      time: new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      action: log.action,
      icon: log.category === 'Inventory Request' ? Radio : log.category === 'Transport' ? PackageCheck : Zap,
      severity: log.severity === 'info' ? 'normal' : log.severity === 'warning' ? 'warning' : 'critical'
     })));
    }
   } catch (e) {
    console.error('Failed to fetch audit logs:', e);
   }
  };
  fetchLogs();
  const interval = setInterval(fetchLogs, 12000);
  return () => clearInterval(interval);
 }, [station]);

 return (
  <div className="bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 rounded-2xl p-4 md:p-6 min-h-full flex flex-col">
   <h2 className="text-[var(--accent-primary)] font-['Space_Grotesk'] font-bold text-2xl tracking-wide mb-2">
    COMMANDER HISTORY
   </h2>
   <p className="text-[var(--text-secondary)] text-sm mb-6 font-['Work_Sans']">
    Today's command log • {historyEntries.length} actions recorded
   </p>

   {/* Timeline */}
   <div className="flex-1 overflow-y-auto space-y-0">
    {historyEntries.length === 0 && (
     <div className="py-12 flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-70">
      <Clock size={32} className="mb-3 opacity-50" />
      <p className="text-sm font-semibold">Zero active records today.</p>
     </div>
    )}
    {historyEntries.map((entry, i) => {
     const Icon = entry.icon;
     return (
      <div
       key={i}
       className={`flex items-start gap-4 border-l-2 ${severityBorder[entry.severity]} pl-4 py-4 hover:bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md transition-colors rounded-r-lg`}
      >
       <div className={`mt-0.5 ${severityColors[entry.severity]}`}>
        <Icon size={18} />
       </div>
       <div className="flex-1 min-w-0">
        <p className="text-[var(--text-primary)] text-sm font-medium leading-snug">
         {entry.action}
        </p>
       </div>
       <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs font-mono whitespace-nowrap shrink-0">
        <Clock size={12} />
        {entry.time}
       </div>
      </div>
     );
    })}
   </div>
  </div>
 );
}

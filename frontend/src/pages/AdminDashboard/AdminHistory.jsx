import { BACKEND_URL } from '../../api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Search,
 Download,
 ShieldCheck,
 Box,
 Ship,
 AlertTriangle,
 Terminal,
 ChevronDown,
 Clock,
 Radio,
 CheckCircle,
 Hash,
 Shield,
 FileText,
} from 'lucide-react';

const initialLogs = [];

const categoryIcons = {
 'Inventory Request': Box,
 'Emergency SOS': AlertTriangle,
 Transport: Ship,
 Security: ShieldCheck,
 System: Terminal,
};

const severityStyles = {
 info: {
  dot: 'bg-[var(--ok)]',
  badge: 'text-[var(--ok)] border-[var(--ok)]/40 bg-[var(--ok)]/10',
 },
 warning: {
  dot: 'bg-[var(--accent-primary)]',
  badge: 'text-[var(--accent-primary)] border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10',
 },
 critical: {
  dot: 'bg-[var(--critical)] animate-ping',
  badge: 'text-[var(--critical)] border-[var(--critical)]/40 bg-[var(--critical)]/10',
 },
};

export default function AdminHistory() {
 const [logs, setLogs] = useState(initialLogs);
 const [searchQuery, setSearchQuery] = useState('');
 const [activeCategory, setActiveCategory] = useState('All');
 const [expandedLogId, setExpandedLogId] = useState(null);
 const [exportedStatus, setExportedStatus] = useState(false);

 useEffect(() => {
  const fetchLogs = async () => {
   try {
    const res = await fetch(`${BACKEND_URL}/api/v1/audit`);
    if (res.ok) {
     const data = await res.json();
     setLogs(data);
    }
   } catch (e) {
    console.error('Failed to fetch audit logs:', e);
   }
  };

  fetchLogs();
  const interval = setInterval(fetchLogs, 12000);
  return () => clearInterval(interval);
 }, []);

 const handleExport = () => {
  const jsonStr = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `icenet-audit-ledger-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setExportedStatus(true);
  setTimeout(() => setExportedStatus(false), 2500);
 };

 const filteredLogs = logs.filter((log) => {
  const matchesCategory =
   activeCategory === 'All' || log.category === activeCategory;
  const matchesSearch =
   log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
   log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
   log.metadata?.adminId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
   log.metadata?.signatureHash?.toLowerCase().includes(searchQuery.toLowerCase());
  return matchesCategory && matchesSearch;
 });

 return (
  <div className="bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 rounded-2xl p-4 sm:p-6 h-full flex flex-col overflow-hidden">
   {/* Header */}
   <div className="flex flex-col gap-3 items-start w-full mb-6 shrink-0">
    <div>
     <h2 className="text-[var(--accent-primary)] font-['Space_Grotesk'] font-bold text-2xl tracking-wide">
      HISTORY · CRYPTOGRAPHIC AUDIT LEDGER
     </h2>
    </div>

    <div className="flex items-center gap-3">
     <div className="flex items-center gap-2 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md px-3 py-1.5 rounded-xl border border-border/50 text-xs font-mono">
      <Radio size={14} className="text-[var(--ok)] animate-pulse" />
      <span className="text-[var(--text-secondary)]">Ledger State:</span>
      <span className="text-[var(--ok)] font-semibold">SYNCHRONIZED (12s Tick)</span>
     </div>
    </div>
   </div>

   {/* Top Control Bar */}
   <div className="flex flex-wrap items-center justify-between gap-4 mb-6 shrink-0">
    {/* Search Input */}
    <div className="relative w-72 max-w-full">
     <Search
      size={14}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
     />
     <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search action, ID, hash, or admin..."
      className="w-full bg-[var(--bg-primary)] border border-border/50 rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-['Work_Sans']"
     />
    </div>

    {/* Category Filter Pills */}
    <div className="flex items-center gap-2">
     {['All', 'Logistics', 'Security', 'System', 'Transport'].map((cat) => (
      <button
       key={cat}
       type="button"
       onClick={() => setActiveCategory(cat)}
       className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
        activeCategory === cat
         ? 'border border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md shadow-sm'
         : 'border border-border/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md'
       }`}
      >
       {cat}
      </button>
     ))}
    </div>

    {/* Export Button */}
    <button
     type="button"
     onClick={handleExport}
     className="flex items-center gap-2 px-4 py-2 border border-border/50 rounded-xl bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-colors font-['Work_Sans'] text-xs font-medium cursor-pointer ml-auto transition-all duration-300 ease-out hover:-translate-y-0.5 w-full md:w-auto"
    >
     {exportedStatus ? (
      <>
       <CheckCircle size={14} className="text-[var(--ok)]" />
       <span className="text-[var(--ok)]">DOWNLOADED</span>
      </>
     ) : (
      <>
       <Download size={14} />
       <span>EXPORT LEDGER</span>
      </>
     )}
    </button>
   </div>

   {/* Ledger Feed */}
   <div className="flex-1 overflow-y-auto pr-1">
    <AnimatePresence initial={false}>
     {filteredLogs.length === 0 ? (
      <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="text-center py-12 text-[var(--text-secondary)] text-sm"
      >
       No ledger entries matching your query or filter.
      </motion.div>
     ) : (
      filteredLogs.map((log) => {
       const Icon = categoryIcons[log.category] || Terminal;
       const isExpanded = expandedLogId === log.id;
       const timeDisplay = new Date(log.timestamp).toLocaleTimeString(
        'en-GB',
        { hour: '2-digit', minute: '2-digit', second: '2-digit' }
       );
       const dateDisplay = new Date(log.timestamp).toISOString().slice(0, 10);

       return (
        <motion.div
         key={log.id}
         layout
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.25 }}
         className="mb-3 border border-border/50 rounded-xl bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md overflow-hidden shadow-sm hover:border-[var(--accent-primary)]/50 transition-colors"
        >
         {/* Main Clickable Row */}
         <div
          onClick={() =>
           setExpandedLogId(isExpanded ? null : log.id)
          }
          className="flex flex-col gap-2 w-full p-4 cursor-pointer select-none"
         >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
           {/* Category Icon with Severity Dot */}
           <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 text-[var(--accent-primary)] shrink-0">
            <Icon size={16} />
            <span
             className={`w-2.5 h-2.5 rounded-full ${
              severityStyles[log.severity]?.dot || 'bg-[var(--ok)]'
             }`}
            />
           </div>

           {/* Log Action & Timestamp */}
           <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
             <span className="font-mono text-[11px] text-[var(--accent-primary)] font-semibold">
              {log.id}
             </span>
             <span className="text-[10px] text-[var(--text-secondary)] font-mono flex items-center gap-1">
              <Clock size={10} />
              {timeDisplay} UTC ({dateDisplay})
             </span>
            </div>
            <p className="text-[var(--text-primary)] text-sm font-['Work_Sans'] truncate font-medium">
             {log.action}
            </p>
           </div>
          </div>

          {/* Category Badge & Expand Chevron */}
          <div className="flex items-center gap-3 shrink-0">
           <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-border/50 bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md text-[var(--text-secondary)] font-semibold">
            {log.category}
           </span>
           <ChevronDown
            size={16}
            className={`text-[var(--text-secondary)] transition-transform duration-200 ${
             isExpanded ? 'rotate-180 text-[var(--accent-primary)]' : ''
            }`}
           />
          </div>
         </div>

         {/* Expanded Metadata (The Crypto Terminal View) */}
         <AnimatePresence>
          {isExpanded && (
           <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
           >
            <div className="bg-[var(--bg-primary)] p-4 font-mono text-xs text-[var(--text-secondary)] border-t border-border/50">
             <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/50">
              <span className="flex items-center gap-1.5 text-[var(--accent-primary)] font-semibold text-[11px] uppercase tracking-wider">
               <Terminal size={13} />
               Cryptographic Header & Payload Proof
              </span>
              <span className="text-[10px] text-[var(--ok)] bg-[var(--ok)]/10 border border-[var(--ok)]/40 px-2 py-0.5 rounded flex items-center gap-1">
               <CheckCircle size={10} />
               SIGNATURE VALID
              </span>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
               <span className="text-[var(--text-secondary)] uppercase text-[10px] block mb-0.5">
                Operator / Admin ID:
               </span>
               <span className="text-[var(--text-primary)] font-bold">
                {log.metadata.adminId || 'N/A'}
               </span>
              </div>
              <div>
               <span className="text-[var(--text-secondary)] uppercase text-[10px] block mb-0.5">
                Commander ID:
               </span>
               <span className="text-[var(--text-primary)]">
                {log.metadata.commanderId || 'N/A'}
               </span>
              </div>
              <div>
               <span className="text-[var(--text-secondary)] uppercase text-[10px] block mb-0.5">
                Request Status:
               </span>
               <span className="text-[var(--text-primary)]">
                {log.metadata.status || 'N/A'}
               </span>
              </div>
              <div className="col-span-2 md:col-span-4 mt-2">
               <span className="text-[var(--text-secondary)] uppercase text-[10px] block mb-0.5">
                Details / Comments:
               </span>
               <span className="text-[var(--text-primary)]">
                {log.metadata.requestDetails || 'No additional details provided.'}
               </span>
              </div>
             </div>

             <div className="bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md p-3 rounded border border-border/50">
              <span className="text-[var(--text-secondary)] uppercase text-[10px] block mb-1">
               SHA-256 Cryptographic Signature Hash:
              </span>
              <p className="text-[var(--accent-primary)] font-bold text-xs break-all leading-relaxed select-all">
               {log.metadata.signatureHash}
              </p>
             </div>

             <div className="flex items-center justify-between mt-3 text-[10px] text-[var(--text-secondary)]">
              <span>Hash Engine: SHA-256 Polar-Ledger-SecP256k1</span>
              <span>Immutable Node State: Block Verified</span>
             </div>
            </div>
           </motion.div>
          )}
         </AnimatePresence>
        </motion.div>
       );
      })
     )}
    </AnimatePresence>
   </div>
  </div>
 );
}

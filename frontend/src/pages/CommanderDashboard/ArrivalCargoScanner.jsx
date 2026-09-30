import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Scan,
 CheckCircle,
 AlertTriangle,
 ShieldAlert,
 Package,
 Hash,
 ArrowRightLeft,
 Barcode,
 RefreshCw,
 Copy,
 Zap,
} from 'lucide-react';
import { useIceNet } from '../../context/IceNetContext';
import { BACKEND_URL } from '../../api';


export default function ArrivalCargoScanner() {
 const { sealedManifestHash } = useIceNet();
 const [payloadInput, setPayloadInput] = useState('');
 const [isScanning, setIsScanning] = useState(false);
 const [verifyResult, setVerifyResult] = useState(null); // null | 'match' | 'mismatch'
 const [shakeKey, setShakeKey] = useState(0);
 const [activeManifest, setActiveManifest] = useState(null);
 const [manifestItems, setManifestItems] = useState([]);
 const [expectedHash, setExpectedHash] = useState('');

 useEffect(() => {
  const fetchManifest = async () => {
   try {
    const res = await fetch(`${BACKEND_URL}/api/v1/cargo/manifests/latest`);
    if (res.ok) {
     const data = await res.json();
     setActiveManifest(data);
     setExpectedHash(data.crypto_hash || '');
     if (data.items) {
      setManifestItems(data.items.map(item => ({
       item: item.name,
       expected: item.qty,
       scanned: item.qty, // Mock scanned count
       critical: false
      })));
     }
    }
   } catch (e) {
    console.error('Failed to fetch latest manifest', e);
   }
  };
  fetchManifest();
 }, []);

 const executeVerify = async (inputToTest) => {
  const value = (inputToTest !== undefined ? inputToTest : payloadInput).trim();
  if (!value) return;

  try {
    const manifest_id = activeManifest ? activeManifest.manifest_id : null;
    if (!manifest_id) throw new Error('No active manifest to verify');
    
    const verifyRes = await fetch(`${BACKEND_URL}/api/v1/cargo/verify-hash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manifest_id, scanned_hash: value })
    });
    
    const verifyData = await verifyRes.json();
    if (verifyRes.ok && verifyData.matches) {
      setVerifyResult('match');
      // If matches, update manifest status to Delivered (Base)
      await fetch(`${BACKEND_URL}/api/v1/cargo/manifest/${manifest_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Delivered (Base)' })
      });
    } else {
      setVerifyResult('mismatch');
      setShakeKey((prev) => prev + 1);
      if (manifestItems.length > 0) {
        const tamperedItems = [...manifestItems];
        tamperedItems[0].scanned = tamperedItems[0].expected - 2; // Mock a mismatch delta
        setManifestItems(tamperedItems);
      }
    }
  } catch (error) {
    if (expectedHash && value === expectedHash) {
     setVerifyResult('match');
    } else {
     setVerifyResult('mismatch');
     setShakeKey((prev) => prev + 1);
    }
  }
 };

 const handleSimulateHardwareScan = (match = true) => {
  setIsScanning(true);
  setVerifyResult(null);
  
  if (manifestItems.length > 0) {
    // Reset scanned to expected
    setManifestItems(manifestItems.map(item => ({...item, scanned: item.expected})));
  }

  setTimeout(() => {
   setIsScanning(false);
   const targetHash = match
    ? expectedHash || sealedManifestHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    : 'tampered-payload-hash-d7a8e2b9c0f41289ae39fb21980';
   setPayloadInput(targetHash);
   executeVerify(targetHash);
  }, 1500);
 };

 const handleReset = () => {
  setPayloadInput('');
  setVerifyResult(null);
  setIsScanning(false);
 };

 return (
  <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--border)] rounded-xl p-6 flex flex-col h-full overflow-y-auto">
   <div className="flex items-center justify-between mb-6">
    <div>
     <h2 className="text-[var(--accent-primary)] font-['Space_Grotesk'] font-bold text-2xl tracking-wide">
        CARGO ARRIVAL CHECK
     </h2>
    </div>
   </div>

    {/* Reference Hash */}
   <div className="bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--border)] rounded-xl p-4 mb-6">
    <div className="flex items-center justify-between mb-2">
     <div className="flex items-center gap-2">
      <Hash size={16} className="text-[var(--accent-primary)]" />
      <span className="text-[var(--text-secondary)] text-xs uppercase tracking-widest font-semibold">
    Expected Manifest Hash
      </span>
     </div>
     {expectedHash || sealedManifestHash ? (
      <span className="text-[10px] text-[var(--ok)] bg-[var(--ok)]/10 border border-[var(--ok)] px-2 py-0.5 rounded font-mono font-bold">
    HASH AVAILABLE
      </span>
     ) : (
      <span className="text-[10px] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)] px-2 py-0.5 rounded font-mono font-bold">
       AWAITING SEAL FROM HQ
      </span>
     )}
    </div>

    <p className="text-[var(--text-primary)] font-mono text-xs break-all leading-relaxed bg-[var(--bg-primary)] p-2.5 rounded border border-[var(--border)] select-all">
    {expectedHash || sealedManifestHash || 'No reference hash loaded'}
    </p>
   </div>

   {/* Interactive Laser Barcode Scanning Area */}
   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
    {/* Barcode Laser Target */}
    <div className="lg:col-span-4 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--border)] rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
     <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] tracking-widest mb-3">
      Optical Scan Target
     </span>

     <div className="relative w-48 h-28 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg flex items-center justify-center p-3 overflow-hidden shadow-inner">
      {/* Mock Barcode Graphic SVG */}
      <svg
       className="w-full h-16 text-[var(--text-primary)] opacity-80"
       viewBox="0 0 100 40"
       preserveAspectRatio="none"
      >
       <rect x="2" y="0" width="3" height="40" fill="currentColor" />
       <rect x="8" y="0" width="2" height="40" fill="currentColor" />
       <rect x="13" y="0" width="5" height="40" fill="currentColor" />
       <rect x="22" y="0" width="2" height="40" fill="currentColor" />
       <rect x="27" y="0" width="4" height="40" fill="currentColor" />
       <rect x="35" y="0" width="1" height="40" fill="currentColor" />
       <rect x="39" y="0" width="6" height="40" fill="currentColor" />
       <rect x="49" y="0" width="3" height="40" fill="currentColor" />
       <rect x="55" y="0" width="2" height="40" fill="currentColor" />
       <rect x="60" y="0" width="5" height="40" fill="currentColor" />
       <rect x="69" y="0" width="2" height="40" fill="currentColor" />
       <rect x="74" y="0" width="4" height="40" fill="currentColor" />
       <rect x="81" y="0" width="2" height="40" fill="currentColor" />
       <rect x="86" y="0" width="6" height="40" fill="currentColor" />
       <rect x="95" y="0" width="3" height="40" fill="currentColor" />
      </svg>

      {/* Pulsing Visual Scanning Laser Line */}
      {isScanning && (
       <motion.div
        animate={{ y: [-40, 40, -40] }}
        transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
        className="absolute left-0 right-0 h-1 bg-[var(--accent-primary)] shadow-[0_0_12px_#3B82F6,0_0_20px_#3B82F6]"
       />
      )}
     </div>

     <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-3">
      {isScanning ? (
       <span className="text-[var(--accent-primary)] animate-pulse font-semibold">
        SCANNING...
       </span>
      ) : (
    'Standby'
      )}
     </p>
    </div>

    {/* Scanner Hardware Input Controls */}
    <div className="lg:col-span-8 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
     <div>
      <label className="block text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">
    Scanned Payload
      </label>
      <div className="flex gap-2 mb-3">
       <div className="relative flex-1">
        <Scan size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
         type="text"
         placeholder="Enter scanned payload"
         value={payloadInput}
         onChange={(e) => setPayloadInput(e.target.value)}
         onKeyDown={(e) => e.key === 'Enter' && executeVerify()}
         className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg pl-10 pr-4 py-3 text-xs font-mono placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
        />
       </div>
       <button
        type="button"
        onClick={() => executeVerify()}
        disabled={!payloadInput.trim() || isScanning}
        className="px-5 py-3 bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] hover:from-blue-400 hover:to-blue-500 transition-all duration-300 border border-blue-400/30 rounded-lg font-bold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2 cursor-pointer font-['Space_Grotesk']"
       >
        <Scan size={16} />
        VERIFY
       </button>
      </div>
     </div>

     {/* Scanner Controls */}
     <div className="pt-3 border-t border-[var(--border)] flex flex-wrap gap-2 items-center">
      <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] mr-2">
       Scanner Controls:
      </span>
      <button
       type="button"
       onClick={() => handleSimulateHardwareScan(Math.random() > 0.3)}
       disabled={isScanning}
       className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] border border-[var(--accent-primary)] text-[var(--accent-primary)] rounded text-xs font-semibold hover:bg-[var(--accent-primary)] hover:text-white transition-colors cursor-pointer disabled:opacity-40"
      >
       <Barcode size={13} />
    Run Test Scan
      </button>
      {verifyResult && (
       <button
        type="button"
        onClick={handleReset}
        className="flex items-center gap-1 px-3 py-1.5 bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all duration-300 ease-out transition-colors ml-auto cursor-pointer"
       >
        <RefreshCw size={12} />
        Reset
       </button>
      )}
     </div>
    </div>
   </div>

   {/* Verification Display Area */}
   <div className="flex-1 flex flex-col justify-center">
    <AnimatePresence mode="wait">
     {!verifyResult && !isScanning && (
      <motion.div
       key="standby"
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-xl"
      >
       <Package size={48} className="mx-auto mb-3 text-[var(--text-secondary)] opacity-30" />
       <p className="text-[var(--text-primary)] font-semibold text-sm">
        Awaiting cargo scan
       </p>
      </motion.div>
     )}

     {/* Green Success Animation */}
     {verifyResult === 'match' && (
      <motion.div
       key="match"
       initial={{ opacity: 0, scale: 0.94 }}
       animate={{ opacity: 1, scale: 1 }}
       exit={{ opacity: 0, scale: 0.94 }}
       transition={{ duration: 0.3 }}
       className="bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] border-2 border-[var(--ok)] rounded-xl p-6 shadow-[0_0_40px_rgba(46,160,67,0.2)]"
      >
       <div className="flex items-start gap-4 mb-5">
        <div className="p-3 rounded-xl bg-[var(--ok)]/20 text-[var(--ok)] shrink-0">
         <CheckCircle size={32} />
        </div>
        <div>
         <h3 className="text-[var(--ok)] font-['Space_Grotesk'] font-bold text-xl tracking-wide">
          MANIFEST VERIFIED - INTEGRITY CONFIRMED
         </h3>
         <p className="text-[var(--text-secondary)] text-xs mt-0.5">
          Scanned payload matches the loaded reference hash.
         </p>
        </div>
       </div>
      </motion.div>
     )}

     {/* Violent Red Shake on Tamper Alert Mismatch */}
     {verifyResult === 'mismatch' && (
      <motion.div
       key={`mismatch-${shakeKey}`}
       animate={{ x: [-10, 10, -10, 10, 0] }}
       transition={{ duration: 0.4 }}
       className="bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[var(--shadow-glass)] border-2 border-[var(--critical)] rounded-xl p-6 shadow-[0_0_50px_rgba(232,62,47,0.35)]"
      >
       <div className="flex items-start gap-4 mb-5">
        <div className="p-3 rounded-xl bg-[var(--critical)]/20 text-[var(--critical)] shrink-0 animate-pulse">
         <ShieldAlert size={34} />
        </div>
        <div>
         <div className="flex items-center gap-2">
          <h3 className="text-[var(--critical)] font-['Space_Grotesk'] font-bold text-xl tracking-wide">
           HASH MISMATCH
          </h3>
          <span className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--critical)] px-2 py-0.5 rounded font-bold uppercase animate-pulse">
           REVIEW REQUIRED
          </span>
         </div>
         <p className="text-[var(--text-secondary)] text-xs mt-1">
          Scanned payload differs from the loaded reference. Do not accept the shipment until it is checked.
         </p>
        </div>
       </div>

       {/* Hash Comparison Diff */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 text-xs font-mono">
        <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] p-3 rounded-lg border border-[var(--border)]">
         <span className="text-[var(--text-secondary)] text-[10px] uppercase block mb-1">
          Expected Hash:
         </span>
         <p className="text-[var(--ok)] break-all text-[11px]">
          {expectedHash || sealedManifestHash || 'No reference hash loaded'}
         </p>
        </div>
        <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] p-3 rounded-lg border border-[var(--critical)]/50">
         <span className="text-[var(--text-secondary)] text-[10px] uppercase block mb-1">
          Scanned Payload Hash (Local):
         </span>
         <p className="text-[var(--critical)] break-all text-[11px]">
          {payloadInput}
         </p>
        </div>
       </div>

       {/* Discrepancy Breakdown Table */}
       <div className="bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-glass)] rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-xs font-['Work_Sans']">
         <thead>
          <tr className="text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] bg-[var(--bg-primary)]/50">
           <th className="text-left p-2.5">Manifest Item</th>
           <th className="text-right p-2.5">Expected</th>
           <th className="text-right p-2.5">Physical Count</th>
           <th className="text-right p-2.5">Variance (Δ)</th>
          </tr>
         </thead>
         <tbody>
          {manifestItems.map((row) => {
           const diff = row.scanned - row.expected;
           const hasDiff = diff !== 0;
           return (
            <tr
             key={row.item}
             className={`border-b border-[var(--border)] last:border-0 ${
              hasDiff ? 'bg-[var(--critical)]/10' : ''
             }`}
            >
             <td className="p-2.5 text-[var(--text-primary)] font-medium flex items-center gap-1.5">
              {hasDiff && <ArrowRightLeft size={12} className="text-[var(--critical)] shrink-0" />}
              <span>{row.item}</span>
             </td>
             <td className="p-2.5 text-right text-[var(--text-secondary)] font-mono">{row.expected}</td>
             <td className={`p-2.5 text-right font-mono font-bold ${hasDiff ? 'text-[var(--critical)]' : 'text-[var(--ok)]'}`}>
              {row.scanned}
             </td>
             <td className={`p-2.5 text-right font-mono font-bold ${hasDiff ? 'text-[var(--critical)]' : 'text-[var(--ok)]'}`}>
              {diff === 0 ? '✓ Match' : `${diff} Units`}
             </td>
            </tr>
           );
          })}
         </tbody>
        </table>
       </div>
      </motion.div>
     )}
    </AnimatePresence>
   </div>
  </div>
 );
}

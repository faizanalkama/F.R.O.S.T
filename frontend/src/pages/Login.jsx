import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Radio, MapPin, Lock, Home } from 'lucide-react';

export default function Login() {
 const navigate = useNavigate();
 const [role, setRole] = useState('admin');
 const [station, setStation] = useState('maitri');
 const [operatorId, setOperatorId] = useState('');
 const [passcode, setPasscode] = useState('');
 const [error, setError] = useState('');

 const handleSubmit = (e) => {
  e.preventDefault();
  setError('');

  const opId = operatorId.trim().toLowerCase();
  const pass = passcode.trim();

  let isValid = false;
  if (role === 'admin') {
   if (opId === 'admin' && pass === 'admin123') {
    isValid = true;
   }
  } else if (role === 'commander') {
   if (station === 'maitri' && opId === 'commander1' && pass === 'pass123') {
    isValid = true;
   } else if (station === 'bharati' && opId === 'commander2' && pass === 'pass123') {
    isValid = true;
   } else if (station === 'himadri' && opId === 'commander3' && pass === 'pass123') {
    isValid = true;
   }
  }

  if (!isValid) {
   setError('Invalid credentials entered.');
   return;
  }

  if (role === 'commander') {
   localStorage.setItem('activeStation', station);
  }
  navigate(role === 'admin' ? '/admin' : '/commander');
 };

 return (
  <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-4 md:p-6 relative">
   {/* Return to Landing Button */}
   <button
    onClick={() => navigate('/')}
    className="absolute top-4 left-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
   >
    ← Back to Landing Page
   </button>

   <div className="bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 rounded-2xl p-4 md:p-8 w-full max-w-md shadow-2xl">
    <h2 className="font-['Space_Grotesk'] font-bold text-[var(--accent-primary)] text-2xl mb-6 text-center tracking-wide">
     F.R.O.S.T SYSTEM ACCESS
    </h2>

    {/* Role Selection */}
    <div className="flex flex-col md:flex-row gap-3 mb-6">
     <button
      type="button"
      onClick={() => setRole('admin')}
      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
       role === 'admin'
        ? 'bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md border border-[var(--accent-primary)] text-[var(--accent-primary)]'
        : 'border border-border/50 text-[var(--text-secondary)] hover:bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md'
      }`}
     >
      <Shield size={18} />
      <span>Admin Gateway</span>
     </button>

     <button
      type="button"
      onClick={() => setRole('commander')}
      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
       role === 'commander'
        ? 'bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md border border-[var(--accent-primary)] text-[var(--accent-primary)]'
        : 'border border-border/50 text-[var(--text-secondary)] hover:bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md'
      }`}
     >
      <Radio size={18} />
      <span>Base Commander</span>
     </button>
    </div>

    {/* Station Selection (Conditional for Commander) */}
    {role === 'commander' && (
     <div className="mb-6">
      <label className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">
       <MapPin size={14} className="text-[var(--accent-primary)]" />
       Select Edge Server
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
       {[
        { id: 'maitri', label: 'Maitri' },
        { id: 'bharati', label: 'Bharati' },
        { id: 'himadri', label: 'Himadri' },
       ].map((st) => (
        <button
         key={st.id}
         type="button"
         onClick={() => setStation(st.id)}
         className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all duration-200 ${
          station === st.id
           ? 'text-[var(--accent-primary)] border-[var(--accent-primary)] bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md'
           : 'border-border/50 text-[var(--text-secondary)] hover:bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md'
         }`}
        >
         {st.label}
        </button>
       ))}
      </div>
     </div>
    )}

    {/* Credentials Form */}
    <form onSubmit={handleSubmit}>
     <div className="mb-4">
      <label className="block text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">
       Operator ID
      </label>
      <input
       type="text"
       required
       value={operatorId}
       onChange={(e) => setOperatorId(e.target.value)}
       placeholder="e.g. MOES-ADM-01"
       className="w-full bg-[var(--bg-primary)] border border-border/50 rounded p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
      />
     </div>

     <div className="mb-6">
      <label className="block text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">
       Passcode
      </label>
      <div className="relative">
       <input
        type="password"
        required
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="Enter access passcode"
        className="w-full bg-[var(--bg-primary)] border border-border/50 rounded p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
       />
       <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
      </div>
     </div>

     {error && (
      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold rounded text-center">
       {error}
      </div>
     )}

     <button
      type="submit"
      className="w-full py-3 bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] hover:from-blue-400 hover:to-blue-500 transition-all duration-300 border border-blue-400/30 font-['Space_Grotesk'] text-base tracking-wider rounded hover:opacity-90 transition-opacity font-bold flex items-center justify-center gap-2 cursor-pointer uppercase"
     >
      AUTHENTICATE
     </button>
    </form>

    <div className="mt-8 border-t border-border/50 pt-6 w-full text-xs">
     <h3 className="text-[var(--text-primary)] font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
       <Lock size={14} className="text-[var(--accent-primary)]" />
       Test Credentials
     </h3>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[var(--text-secondary)]">
       <div>
         <p className="font-semibold text-[var(--text-primary)] mb-1 uppercase tracking-widest text-[10px]">Admin Access</p>
         <p>ID: <span className="font-mono text-[var(--accent-primary)]">admin</span></p>
         <p>Pass: <span className="font-mono">admin123</span></p>
       </div>
       <div className="space-y-2">
         <p className="font-semibold text-[var(--text-primary)] uppercase tracking-widest text-[10px]">Commander Access</p>
         <div>
           <p>Maitri: <span className="font-mono text-[var(--accent-primary)]">commander1</span> / <span className="font-mono">pass123</span></p>
           <p>Bharati: <span className="font-mono text-[var(--accent-primary)]">commander2</span> / <span className="font-mono">pass123</span></p>
           <p>Himadri: <span className="font-mono text-[var(--accent-primary)]">commander3</span> / <span className="font-mono">pass123</span></p>
         </div>
       </div>
     </div>
    </div>
   </div>


  </div>
 );
}

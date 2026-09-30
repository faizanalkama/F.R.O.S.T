import { useState } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { Radar, Cloud, Package, Scan, Users, History, AlertTriangle, User, Siren } from 'lucide-react';
import NavigationBar from '../../components/Shared/NavigationBar';
import LiveTelemetryRadar from './LiveTelemetryRadar';
import WeatherAnalysis from './WeatherAnalysis';
import OfflineInventory from './Inventory';
import ArrivalCargoScanner from './ArrivalCargoScanner';
import ScientistsRoster from './ScientistsRoster';
import CommanderHistory from './CommanderHistory';
import EmergencyOverlay from './EmergencyOverlay';
import ProfileModal from './ProfileModal';
import EmergencyModal from './EmergencyModal';

const sidebarLinks = [
 { to: '/commander',      label: 'Telemetry',     icon: Radar, end: true },
 { to: '/commander/weather',  label: 'Weather',      icon: Cloud },
 { to: '/commander/inventory', label: 'Offline Inventory', icon: Package },
 { to: '/commander/cargo',   label: 'Cargo Scanner',   icon: Scan },
 { to: '/commander/roster',   label: 'Roster',      icon: Users },
 { to: '/commander/history',  label: 'History',      icon: History },
];

function SidebarLink({ to, label, icon: Icon, end }) {
 return (
  <NavLink
   to={to}
   end={end}
   className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors duration-200 ${
     isActive
      ? 'bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md text-[var(--accent-primary)] border-l-2 border-[var(--accent-primary)] font-semibold'
      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md hover:text-[var(--text-primary)]'
    }`
   }
  >
   <Icon size={18} />
   <span>{label}</span>
  </NavLink>
 );
}

export default function CommanderLayout() {
 const [isEmergencyActive, setIsEmergencyActive] = useState(false);
 const [isProfileOpen, setIsProfileOpen] = useState(false);
 const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
 const [notification, setNotification] = useState(null);

 const handleEmergencyDispatch = (data) => {
   setIsEmergencyModalOpen(false);
   setNotification(`EMERGENCY SENT [${data.severity}]: Notifications dispatched to remaining dashboards.`);
   setTimeout(() => setNotification(null), 5000);
 };

 return (
  <div className="dashboard-shell h-screen w-full bg-[var(--bg-primary)] flex flex-col relative overflow-hidden">
   <NavigationBar />

   <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
    {/* Desktop Left Sidebar */}
    <aside className="hidden md:flex w-64 bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border-r border-border/50 flex-col p-4 gap-2 overflow-y-auto shrink-0 z-10">
     <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest px-4 mb-2">
      Commander Modules
     </h3>
     {sidebarLinks.map((link) => (
      <SidebarLink key={link.to} {...link} />
     ))}

     {/* Bottom Buttons */}
     <div className="mt-auto flex flex-col gap-2">
       <button onClick={() => setIsProfileOpen(true)} className="flex items-center justify-center gap-2 text-[var(--accent-primary)] text-xs border border-[var(--accent-primary)] p-2 rounded hover:bg-[var(--accent-primary)] hover:text-white transition-colors cursor-pointer">
         <User size={14} />
         Profile
       </button>
       <button onClick={() => setIsEmergencyModalOpen(true)} className="flex items-center justify-center gap-2 text-orange-500 text-xs border border-orange-500 p-2 rounded hover:bg-orange-500 hover:text-white transition-colors cursor-pointer">
         <Siren size={14} />
         Emergency
       </button>
       <button
        onClick={() => setIsEmergencyActive(true)}
        className="flex items-center justify-center gap-2 text-[var(--critical)] text-xs border border-[var(--critical)] p-2 rounded hover:bg-[var(--critical)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
       >
        <AlertTriangle size={14} />
        Test SOS
       </button>
     </div>
    </aside>

    {/* Dynamic Main Content */}
    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto bg-[var(--bg-primary)] min-w-0 flex flex-col pb-24">
     <Routes>
      <Route index element={<LiveTelemetryRadar />} />
      <Route path="telemetry" element={<Navigate to="/commander" replace />} />
      <Route path="weather" element={<WeatherAnalysis />} />
      <Route path="inventory" element={<OfflineInventory />} />
      <Route path="cargo" element={<ArrivalCargoScanner />} />
      <Route path="roster" element={<ScientistsRoster />} />
      <Route path="history" element={<CommanderHistory />} />
     </Routes>
    </main>

    {/* Mobile Bottom Navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.2)] border-t border-border/50 flex items-center justify-around p-2 z-[100] pb-safe">
      {sidebarLinks.map((link) => (
       <NavLink
        key={link.to}
        to={link.to}
        end={link.end}
        className={({ isActive }) =>
         `flex flex-col items-center justify-center gap-1 p-2 flex-1 rounded-xl transition-all min-h-[48px] ${
          isActive ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)]'
         }`
        }
       >
        <link.icon size={20} className={link.isActive ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''} />
        <span className="text-[9px] uppercase tracking-wider">{link.label.split(' ')[0]}</span>
       </NavLink>
      ))}
    </nav>
   </div>

   {/* Emergency Action System Overlay */}
   {isEmergencyActive && (
    <EmergencyOverlay onClose={() => setIsEmergencyActive(false)} />
   )}

   {/* Profile Modal */}
   <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

   {/* Emergency Modal */}
   <EmergencyModal 
     isOpen={isEmergencyModalOpen} 
     onClose={() => setIsEmergencyModalOpen(false)} 
     onDispatch={handleEmergencyDispatch} 
   />

   {/* Notification Toast */}
   {notification && (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-600/90 backdrop-blur border border-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300">
      <Siren size={20} className="animate-pulse" />
      <span className="font-semibold text-sm tracking-wide">{notification}</span>
    </div>
   )}
  </div>
 );
}
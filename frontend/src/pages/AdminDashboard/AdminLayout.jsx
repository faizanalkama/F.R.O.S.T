import { NavLink, Routes, Route } from 'react-router-dom';
import { Building2, Compass, Ship, PackageSearch, History } from 'lucide-react';
import NavigationBar from '../../components/Shared/NavigationBar';
import ResearchCenters from './ResearchCenters';
import ExpeditionPlanner from './ExpeditionPlanner';
import GlobalCargoTracker from './GlobalCargoTracker';
import InventoryRequests from './Inventory';
import AdminHistory from './AdminHistory';

const sidebarLinks = [
 { to: '/admin',      label: 'Research Centers',  icon: Building2,   end: true },
 { to: '/admin/expedition', label: 'Expedition Planner', icon: Compass },
 { to: '/admin/cargo',   label: 'Global Cargo',    icon: Ship },
 { to: '/admin/inventory', label: 'Inventory',     icon: PackageSearch },
 { to: '/admin/history',  label: 'History',   icon: History },
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

export default function AdminLayout() {
 return (
  <div className="dashboard-shell min-h-screen w-full bg-[var(--bg-primary)] flex flex-col relative">
   <NavigationBar />

   <div className="flex flex-1 min-h-0 flex-col md:flex-row">
    {/* Desktop Left Sidebar */}
    <aside className="hidden md:flex w-64 bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border-r border-border/50 flex-col p-4 gap-2 overflow-y-auto shrink-0 z-10">
     <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest px-4 mb-2">
      Admin Modules
     </h3>
     {sidebarLinks.map((link) => (
      <SidebarLink key={link.to} {...link} />
     ))}
    </aside>

    {/* Dynamic Main Content */}
    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 min-h-screen overflow-y-auto bg-[var(--bg-primary)] min-w-0 flex flex-col pb-40 mb-12">
      <Routes>
       <Route index element={<ResearchCenters />} />
       <Route path="expedition" element={<ExpeditionPlanner />} />
       <Route path="cargo" element={<GlobalCargoTracker />} />
       <Route path="inventory" element={<InventoryRequests />} />
       <Route path="history" element={<AdminHistory />} />
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
  </div>
 );
}
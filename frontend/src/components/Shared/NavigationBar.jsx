import { useNavigate } from 'react-router-dom';
import { Home, LogOut, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function NavigationBar() {
 const navigate = useNavigate();
 const { theme, toggleTheme } = useTheme();

 return (
  <nav className="bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border-b border-border/50 flex flex-row items-center justify-between w-full px-4 py-3">
   <div className="flex items-center gap-2">
    <span className="text-[var(--accent-primary)] text-3xl md:text-4xl font-light tracking-tight text-foregroundfont-['Space_Grotesk'] tracking-wider">
     F.R.O.S.T
    </span>
    <span className="text-[var(--text-secondary)] text-sm hidden sm:inline">
     | Polar Logistics Command
    </span>
   </div>

   <div className="flex flex-row items-center gap-2 shrink-0">
    <motion.button
     whileHover={{ scale: 1.1 }}
     whileTap={{ scale: 0.9 }}
     onClick={toggleTheme}
     className="p-2 rounded-full bg-[var(--bg-panel-raised)] border border-border/50 text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center shadow-sm hover:shadow-md"
    >
     <AnimatePresence mode="wait">
      <motion.div
       key={theme}
       initial={{ opacity: 0, rotate: -90 }}
       animate={{ opacity: 1, rotate: 0 }}
       exit={{ opacity: 0, rotate: 90 }}
       transition={{ duration: 0.2 }}
      >
       {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </motion.div>
     </AnimatePresence>
    </motion.button>

    {/* Logout Button */}
    <button
     onClick={() => {
      localStorage.removeItem('activeStation');
      navigate('/login');
     }}
     className="flex items-center gap-2 px-4 py-2 border border-border/50 rounded bg-[var(--bg-panel-raised)] backdrop-blur-xl shadow-sm hover:shadow-md text-[var(--critical)] hover:bg-[var(--critical)] hover:text-[var(--text-primary)] transition-colors font-['Work_Sans'] font-medium cursor-pointer"
    >
     <LogOut size={18} />
     <span>Logout</span>
    </button>
   </div>
  </nav>
 );
}

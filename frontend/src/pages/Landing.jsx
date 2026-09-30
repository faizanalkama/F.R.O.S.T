import React, { Suspense, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Float, Environment } from '@react-three/drei';
import { Server, Zap, Map, Cpu, ShieldCheck, Activity, ChevronRight, Compass, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Landing.css';

/* ── Animation Variants ─────────────────────────────────────────── */
const fadeUp = {
 hidden: { opacity: 0, y: 30 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

/* ── 3D Interactive Model ────────────────────────────────────────── */
function InteractiveModel() {
 const { scene } = useGLTF('/clock_model.glb');
 const [hovered, setHover] = useState(false);
 const modelRef = useRef();

 useFrame(() => {
  // Relying on OrbitControls autoRotate for constant speed
 });

 return (
  <Float floatIntensity={1} rotationIntensity={1} speed={2}>
   <primitive
    ref={modelRef}
    object={scene}
    scale={hovered ? 4.5 : 4}
    onPointerOver={() => setHover(true)}
    onPointerOut={() => setHover(false)}
   />
  </Float>
 );
}

useGLTF.preload('/clock_model.glb');

/* ── Landing Page ────────────────────────────────────────────────── */
export default function Landing() {
 const navigate = useNavigate();
 const { theme, toggleTheme } = useTheme();
 const handleScroll = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
 };

 return (
  <div className="w-full min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Work_Sans'] overflow-x-hidden selection:bg-[var(--accent-primary)] selection:text-[var(--bg-primary)]">

   {/* ═══════════════════════════════════════════════════════════
     1. FIXED GLASSMORPHISM NAVBAR
     ═══════════════════════════════════════════════════════════ */}
   <nav className="fixed top-0 left-0 w-full z-50 bg-[var(--bg-primary)]/40 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
    {/* Logo */}
    <div className="font-black text-xl tracking-widest text-[var(--text-primary)] font-['Bebas_Neue'] flex items-center gap-2">
     <ShieldCheck size={22} className="text-[var(--accent-primary)]" />
     F.R.O.S.T
    </div>

    <div className="hidden md:flex items-center gap-4 md:gap-8 text-sm font-medium tracking-wide text-[var(--text-secondary)]">
     <motion.a href="#features" onClick={handleScroll('features')} whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="hover:text-[var(--accent-primary)] duration-0 cursor-pointer">FEATURES</motion.a>
     <motion.a href="#hardware" onClick={handleScroll('hardware')} whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="hover:text-[var(--accent-primary)] duration-0 cursor-pointer">HARDWARE</motion.a>
     <motion.a href="#workflow" onClick={handleScroll('workflow')} whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="hover:text-[var(--accent-primary)] duration-0 cursor-pointer">WORKFLOW</motion.a>
    </div>

    {/* Right Actions */}
    <div className="flex items-center gap-4">
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

     <button
      onClick={() => navigate('/login')}
      className="hidden sm:block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors tracking-wide"
     >
      LOG IN
     </button>
     <button
      onClick={() => navigate('/login')}
      className="bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold rounded-xl px-6 py-2 shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] hover:from-blue-400 hover:to-blue-500 transition-all duration-300 border border-blue-400/30 text-sm tracking-wider"
     >
      SIGN UP
     </button>
    </div>
   </nav>

   {/* ═══════════════════════════════════════════════════════════
     2. CINEMATIC HERO SECTION (Contained Video)
     ═══════════════════════════════════════════════════════════ */}
   <section className="relative w-full h-screen flex flex-col justify-center overflow-hidden">
    {/* Video Background */}
    <video
     autoPlay loop muted playsInline
     className="absolute inset-0 w-full h-full object-cover z-0 opacity-50 pointer-events-none"
     src="/antarctica.mp4"
    />

    {/* Premium Blue Tint Overlay */}
    <div className="absolute inset-0 bg-blue-600/10 mix-blend-color z-10 pointer-events-none"></div>

    {/* Gradient Overlay */}
    <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, var(--bg-primary) 0%, transparent 100%)', opacity: 0.85 }}></div>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-primary)] z-10 pointer-events-none"></div>

    {/* Hero Content — Left Aligned */}
    <motion.div
     initial="hidden"
     animate="visible"
     variants={fadeUp}
     className="relative z-20 flex flex-col items-start text-left px-8 md:px-16 max-w-3xl w-full pt-20"
    >
     <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight mb-5 font-['Bebas_Neue'] uppercase">
      The ice doesn't wait.<br />
      Neither should your logistics.
     </h1>

     <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-lg leading-relaxed mb-8">
      An offline-first, high-resilience command deck built for extreme environments where connectivity is a luxury, not a guarantee.
     </p>

     <div className="flex flex-row items-center gap-4">
      <motion.button
       onClick={() => navigate('/login')}
       whileHover={{ scale: 1.04 }}
       whileTap={{ scale: 0.97 }}
       transition={{ duration: 0.3, ease: 'easeOut' }}
       className="bg-gradient-to-b from-blue-500 to-blue-600 px-7 py-3 font-bold text-base rounded-xl tracking-wider text-white shadow-[0_0_30px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] hover:from-blue-400 hover:to-blue-500 transition-all duration-300 border border-blue-400/30"
      >
       ENTER THE PLATFORM
      </motion.button>
      <motion.a
       href="#workflow"
       onClick={handleScroll('workflow')}
       whileHover={{ scale: 1.04 }}
       whileTap={{ scale: 0.97 }}
       transition={{ duration: 0.3, ease: 'easeOut' }}
       className="backdrop-blur-xl bg-[var(--bg-panel-raised)] border border-border/50 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] shadow-sm hover:shadow-md px-7 py-3 font-bold text-base rounded-sm tracking-wider text-center transition-colors text-[var(--text-primary)]"
      >
       SEE THE MISSION
      </motion.a>
     </div>
    </motion.div>
   </section>

   {/* ═══════════════════════════════════════════════════════════
     3. BENTO BOX: THREE TIERS
     ═══════════════════════════════════════════════════════════ */}
   <section id="features" className="relative z-20 w-full max-w-6xl mx-auto px-6 py-24">
    <motion.div
     initial="hidden"
     whileInView="visible"
     variants={fadeUp}
     viewport={{ once: true }}
     className="flex flex-col items-center justify-center gap-3 mb-16 text-center"
    >
     <div className="flex items-center gap-3">
       <span className="text-[var(--accent-primary)] text-sm">◆</span>
       <ShieldCheck size={24} className="text-[var(--accent-primary)]" />
       <h2 className="text-3xl md:text-5xl font-['Bebas_Neue'] tracking-widest text-[var(--text-primary)]">
        FEATURES
       </h2>
       <span className="text-[var(--accent-primary)] text-sm">◆</span>
     </div>
     <p className="text-[var(--text-secondary)] max-w-2xl text-sm md:text-base mt-2">
       Experience the next generation of digital infrastructure. Our platform combines powerful analytics, unbreakable security, and global reach.
     </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
     {/* Card 1 — Left Tall (Analytics) */}
     <motion.div
      whileInView="visible"
      initial="hidden"
      variants={fadeUp}
      viewport={{ once: true }}
      className="md:col-span-5 md:row-span-2 bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 rounded-2xl p-4 md:p-8 flex flex-col hover:border-[var(--accent-primary)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)] transition-all duration-500 ease-out group relative overflow-hidden"
     >
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)] opacity-5 rounded-full blur-3xl -mr-20 -mt-20 transition-opacity group-hover:opacity-10"></div>
      
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-8">
        <Activity size={24} className="text-[var(--accent-primary)]" />
      </div>
      
      <h3 className="text-2xl font-['Bebas_Neue'] text-[var(--text-primary)] tracking-wider mb-4">Real-Time Analytics</h3>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-8 flex-grow">
       Monitor system performance and user engagement in real-time with our advanced metrics dashboard. Get instant actionable insights that drive growth.
      </p>

      {/* Decorative element simulating a chart */}
      <div className="flex items-end gap-2 h-32 mt-auto w-full pt-6 border-t border-border/50">
        {[40, 70, 45, 90, 65, 80, 100, 60].map((h, i) => (
          <div key={i} className="flex-1 bg-[var(--accent-primary)] rounded-t-sm opacity-20 group-hover:opacity-60 transition-opacity duration-500" style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}></div>
        ))}
      </div>
     </motion.div>

     {/* Card 2 — Top Right Wide (AI Insights) */}
     <motion.div
      whileInView="visible"
      initial="hidden"
      variants={fadeUp}
      viewport={{ once: true }}
      className="md:col-span-7 bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 rounded-2xl p-4 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-8 hover:border-purple-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.15)] transition-all duration-500 ease-out group relative overflow-hidden"
     >
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 opacity-0 rounded-full blur-3xl -ml-20 -mb-20 transition-opacity group-hover:opacity-100"></div>
      
      <div className="flex-1 z-10">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-6">
          <Cpu size={24} className="text-purple-400" />
        </div>
        <h3 className="text-2xl font-['Bebas_Neue'] text-[var(--text-primary)] tracking-wider mb-3">Intelligent Processing</h3>
        <p className="text-[var(--text-secondary)] leading-relaxed">
         Harness the power of machine learning algorithms to automate complex decisions and predict trends before they happen.
        </p>
      </div>
      
      {/* Decorative element */}
      <div className="w-full md:w-1/3 aspect-square rounded-full border border-dashed border-border/50 flex items-center justify-center relative animate-[spin_30s_linear_infinite] group-hover:border-purple-500/30 transition-colors">
        <div className="w-2/3 h-2/3 rounded-full border border-border/50 flex items-center justify-center absolute group-hover:border-purple-500/50 transition-colors">
          <div className="w-1/3 h-1/3 bg-purple-500/20 rounded-full group-hover:bg-purple-500/40 transition-colors blur-sm"></div>
        </div>
        <div className="absolute top-0 w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
      </div>
     </motion.div>

     {/* Card 3 — Bottom Middle (Security) */}
     <motion.div
      whileInView="visible"
      initial="hidden"
      variants={fadeUp}
      viewport={{ once: true }}
      className="md:col-span-3 bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 rounded-2xl p-4 md:p-6 flex flex-col hover:border-green-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(34,197,94,0.15)] transition-all duration-500 ease-out group"
     >
      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-5">
        <ShieldCheck size={20} className="text-green-400" />
      </div>
      <h3 className="text-xl font-['Bebas_Neue'] text-[var(--text-primary)] tracking-wider mb-2">Zero-Trust Security</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
       End-to-end encryption with military-grade architecture.
      </p>
     </motion.div>

     {/* Card 4 — Bottom Right (Global Connectivity) */}
     <motion.div
      whileInView="visible"
      initial="hidden"
      variants={fadeUp}
      viewport={{ once: true }}
      className="md:col-span-4 bg-surface/80 backdrop-blur-md shadow-sm hover:shadow-md border border-border/50 rounded-2xl p-4 md:p-6 flex flex-col hover:border-orange-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)] transition-all duration-500 ease-out group"
     >
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-5">
        <Compass size={20} className="text-orange-400" />
      </div>
      <h3 className="text-xl font-['Bebas_Neue'] text-[var(--text-primary)] tracking-wider mb-2">Global Access</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
       Multi-region CDN deployment ensures ultra-low latency worldwide.
      </p>
     </motion.div>
    </div>
   </section>



   {/* ═══════════════════════════════════════════════════════════
     4. 3D HARDWARE SHOWCASE
     ═══════════════════════════════════════════════════════════ */}
   <section id="hardware" className="w-full bg-[var(--bg-primary)] relative py-16">
    {/* Top gradient divider */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-900/50 to-transparent"></div>
    {/* Bottom gradient divider */}
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-900/50 to-transparent"></div>
    {/* Title Overlay */}
    <div className="absolute top-8 left-0 w-full text-center z-20 pointer-events-none">
     <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foregroundtracking-widest text-[var(--text-primary)] font-['Bebas_Neue']">HARDWARE SPECIFICATIONS</h2>
    </div>

    {/* 3D Canvas */}
    <div className="w-full max-w-5xl mx-auto h-[30vh] min-h-[260px] relative z-10 cursor-grab active:cursor-grabbing">
     <Canvas camera={{ position: [0, 1.5, 4.5], fov: 45 }}>
      <ambientLight intensity={1.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={3} />
      <directionalLight position={[-5, 5, 5]} intensity={2} />
      <Environment preset="city" />
      <Suspense fallback={null}>
       <InteractiveModel />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={1} enablePan={false} enableZoom={false} />
     </Canvas>
    </div>

    {/* Specs Strip */}
    <motion.div
     initial="hidden"
     whileInView="visible"
     variants={fadeUp}
     viewport={{ once: true }}
     className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-3 px-6 mt-8 relative z-20"
    >
     <motion.div className="bg-[var(--bg-primary)] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[rgba(59,130,246,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_25px_-8px_rgba(59,130,246,0.1)] transition-all duration-500 ease-out">
      <span className="text-[var(--accent-primary)] font-mono text-[10px] tracking-widest block mb-2">HW-ID: ESP-32S3</span>
      <h4 className="font-['Bebas_Neue'] text-lg text-[var(--text-primary)] tracking-wide mb-2">Core Processing</h4>
      <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono border-t border-white/5 pt-2 mt-2">
       <span>Freq</span><span className="text-[var(--text-primary)]">240MHz</span>
      </div>
      <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono border-t border-white/5 pt-2 mt-2">
       <span>SRAM</span><span className="text-[var(--text-primary)]">512KB</span>
      </div>
     </motion.div>

     <motion.div className="bg-[var(--bg-primary)] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[rgba(59,130,246,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_25px_-8px_rgba(59,130,246,0.15)] transition-all duration-500 ease-out">
      <span className="text-[var(--accent-primary)] font-mono text-[10px] tracking-widest block mb-2">HW-ID: SX1262</span>
      <h4 className="font-['Bebas_Neue'] text-lg text-[var(--text-primary)] tracking-wide mb-2">LoRa Radio</h4>
      <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono border-t border-white/5 pt-2 mt-2">
       <span>Band</span><span className="text-[var(--text-primary)]">868/915MHz</span>
      </div>
      <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono border-t border-white/5 pt-2 mt-2">
       <span>Range</span><span className="text-[var(--text-primary)]">15km+ LOS</span>
      </div>
     </motion.div>

     <motion.div className="bg-[var(--bg-primary)] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[rgba(59,130,246,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_25px_-8px_rgba(59,130,246,0.1)] transition-all duration-500 ease-out">
      <span className="text-[var(--accent-primary)] font-mono text-[10px] tracking-widest block mb-2">HW-ID: NEO-M9N</span>
      <h4 className="font-['Bebas_Neue'] text-lg text-[var(--text-primary)] tracking-wide mb-2">GNSS Module</h4>
      <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono border-t border-white/5 pt-2 mt-2">
       <span>Constel</span><span className="text-[var(--text-primary)]">4 Concurrent</span>
      </div>
      <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono border-t border-white/5 pt-2 mt-2">
       <span>Accuracy</span><span className="text-[var(--text-primary)]">1.5m CEP</span>
      </div>
     </motion.div>

     <motion.div className="bg-[var(--bg-primary)] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[rgba(59,130,246,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_25px_-8px_rgba(59,130,246,0.1)] transition-all duration-500 ease-out">
      <span className="text-[var(--accent-primary)] font-mono text-[10px] tracking-widest block mb-2">HW-ID: BME280</span>
      <h4 className="font-['Bebas_Neue'] text-lg text-[var(--text-primary)] tracking-wide mb-2">Env Sensor</h4>
      <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono border-t border-white/5 pt-2 mt-2">
       <span>Temp</span><span className="text-[var(--text-primary)]">-40°C to +85°C</span>
      </div>
      <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono border-t border-white/5 pt-2 mt-2">
       <span>Humid</span><span className="text-[var(--text-primary)]">0% to 100%</span>
      </div>
     </motion.div>
    </motion.div>
   </section>

   {/* ═══════════════════════════════════════════════════════════
     5. EXPEDITION WORKFLOW (Contained Flex Nodes)
     ═══════════════════════════════════════════════════════════ */}
   <section id="workflow" className="w-full max-w-6xl mx-auto px-6 py-20">
    <motion.h2
     initial="hidden"
     whileInView="visible"
     variants={fadeUp}
     viewport={{ once: true }}
     className="text-3xl md:text-4xl font-['Bebas_Neue'] text-center text-[var(--text-primary)] tracking-widest mb-4"
    >
     EXPEDITION WORKFLOW
    </motion.h2>
    <motion.p
     initial="hidden"
     whileInView="visible"
     variants={fadeUp}
     viewport={{ once: true }}
     className="text-center text-[var(--text-secondary)] text-sm max-w-lg mx-auto mb-12"
    >
     Four phases from manifest to merge. Each step is designed to function independently even without connectivity.
    </motion.p>
    <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-10 relative mt-10">
     {/* Animated connecting line (desktop) */}
     <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-0.5 z-0 overflow-hidden">
      <div
       className="w-full h-full"
       style={{
        backgroundImage: 'linear-gradient(to right, var(--accent-primary) 50%, transparent 50%)',
        backgroundSize: '16px 2px',
        backgroundRepeat: 'repeat-x',
        opacity: 0.4,
        animation: 'move-line 1s linear infinite'
       }}
      ></div>
     </div>

     {/* Step 1 */}
     <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeUp}
      viewport={{ once: true }}
      className="flex flex-col items-start md:items-center text-left md:text-center w-full gap-4 z-10"
     >
      <motion.div
       whileHover={{ scale: 1.2, backgroundColor: 'var(--accent-primary)', color: '#fff' }}
       transition={{ duration: 0.35, ease: 'easeOut' }}
       className="w-12 h-12 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)] flex items-center justify-center text-[var(--accent-primary)] font-bold text-xl font-['Bebas_Neue'] cursor-pointer"
      >
       1
      </motion.div>
      <h4 className="text-lg font-bold text-[var(--text-primary)] font-['Bebas_Neue'] tracking-wide">Seal Manifest</h4>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
       HQ finalizes the cargo packing list before departure. Every item is tagged, weighed, and digitally sealed.
      </p>
     </motion.div>

     {/* Step 2 */}
     <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeUp}
      viewport={{ once: true }}
      className="flex flex-col items-start md:items-center text-left md:text-center w-full gap-4 z-10"
     >
      <motion.div
       whileHover={{ scale: 1.2, backgroundColor: 'var(--accent-primary)', color: '#fff' }}
       transition={{ duration: 0.35, ease: 'easeOut' }}
       className="w-12 h-12 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)] flex items-center justify-center text-[var(--accent-primary)] font-bold text-xl font-['Bebas_Neue'] cursor-pointer"
      >
       2
      </motion.div>
      <h4 className="text-lg font-bold text-[var(--text-primary)] font-['Bebas_Neue'] tracking-wide">Scan on Arrival</h4>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
       Edge nodes verify incoming hardware against the manifest. Discrepancies are flagged instantly.
      </p>
     </motion.div>

     {/* Step 3 */}
     <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeUp}
      viewport={{ once: true }}
      className="flex flex-col items-start md:items-center text-left md:text-center w-full gap-4 z-10"
     >
      <motion.div
       whileHover={{ scale: 1.2, backgroundColor: 'var(--accent-primary)', color: '#fff' }}
       transition={{ duration: 0.35, ease: 'easeOut' }}
       className="w-12 h-12 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)] flex items-center justify-center text-[var(--accent-primary)] font-bold text-xl font-['Bebas_Neue'] cursor-pointer"
      >
       3
      </motion.div>
      <h4 className="text-lg font-bold text-[var(--text-primary)] font-['Bebas_Neue'] tracking-wide">Work Offline</h4>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
       The mission proceeds with localized data and mesh tracking. No uplink required.
      </p>
     </motion.div>

     {/* Step 4 */}
     <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeUp}
      viewport={{ once: true }}
      className="flex flex-col items-start md:items-center text-left md:text-center w-full gap-4 z-10"
     >
      <motion.div
       whileHover={{ scale: 1.2, backgroundColor: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' }}
       transition={{ duration: 0.35, ease: 'easeOut' }}
       className="w-12 h-12 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)] flex items-center justify-center text-[var(--accent-primary)] font-bold text-xl font-['Bebas_Neue'] cursor-pointer"
      >
       4
      </motion.div>
      <h4 className="text-lg font-bold text-[var(--text-primary)] font-['Bebas_Neue'] tracking-wide">Merge & Alert</h4>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
       Data syncs to cloud on uplink; automated SOS logic runs 24/7. Conflicts resolved via CRDTs.
      </p>
     </motion.div>
    </div>
   </section>

   {/* ═══════════════════════════════════════════════════════════
     6. FOOTER
     ═══════════════════════════════════════════════════════════ */}
   <footer className="w-full bg-[var(--bg-panel)] relative z-20 overflow-hidden pt-12 pb-8 px-6 border-t border-border/50 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
    {/* Glowing background effects */}
    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--accent-primary)]/5 rounded-full blur-[120px] pointer-events-none"></div>
    <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 relative z-10">
     {/* Brand Col */}
     <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 font-['Bebas_Neue'] text-3xl text-[var(--text-primary)] tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
       <Compass size={28} className="text-[var(--accent-primary)] animate-pulse" />
       F.R.O.S.T
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
       Advanced logistics and asset tracking system engineered for extreme polar environments.
       Ensuring 100% mission integrity when connectivity is a luxury.
      </p>
     </div>

     {/* Platform Links */}
     <div className="flex flex-col gap-4">
      <h4 className="font-['Bebas_Neue'] text-xl text-[var(--text-primary)] tracking-widest mb-2 border-b border-[var(--accent-primary)]/20 pb-2 w-fit">PLATFORM</h4>
      <a href="#features" onClick={handleScroll('features')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all hover:translate-x-1 cursor-pointer w-fit">Features & Tiers</a>
      <a href="#workflow" onClick={handleScroll('workflow')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all hover:translate-x-1 cursor-pointer w-fit">Mission Workflow</a>
      <a href="#hardware" onClick={handleScroll('hardware')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all hover:translate-x-1 cursor-pointer w-fit">Hardware Specs</a>
      <span onClick={() => navigate('/login')} className="text-sm text-[var(--accent-primary)] hover:text-[var(--text-primary)] font-semibold transition-all hover:translate-x-1 cursor-pointer w-fit flex items-center gap-2">
        Commander Login <ChevronRight size={14} />
      </span>
     </div>

     {/* Legal & Info */}
     <div className="flex flex-col gap-4">
      <h4 className="font-['Bebas_Neue'] text-xl text-[var(--text-primary)] tracking-widest mb-2 border-b border-[var(--accent-primary)]/20 pb-2 w-fit">LEGAL & INFO</h4>
      <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">About Project</a>
      <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">Disclaimer</a>
      <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">Privacy Policy</a>
      <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">Terms of Service</a>
     </div>

     {/* Developed By */}
     <div className="flex flex-col gap-4">
      <h4 className="font-['Bebas_Neue'] text-xl text-[var(--accent-primary)] tracking-widest mb-2 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">DEVELOPED BY</h4>
      <div className="text-sm text-[var(--text-secondary)] flex flex-col gap-1">
       <span className="text-[var(--text-primary)] font-bold text-base tracking-wide">Team HackCypher</span>
       <span className="text-[var(--text-secondary)] font-medium">Heritage Institute of Technology</span>
       <span className="text-xs opacity-75">Kolkata, India</span>
      </div>
      <a href="mailto:hackcypher2025@gmail.com" className="group text-sm mt-3 flex items-center gap-2 bg-[var(--bg-primary)] border border-border/50 px-4 py-2 rounded-xl hover:border-[var(--accent-primary)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all w-fit">
       <div className="text-[var(--accent-primary)] group-hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
       </div>
       <span className="text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">hackcypher2025@gmail.com</span>
      </a>
     </div>
    </div>

    {/* Bottom Bar */}
    <div className="max-w-6xl mx-auto pt-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-xs font-mono text-[var(--text-secondary)] relative z-10">
     {/* Bottom gradient divider */}
     <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent"></div>
     <div>
      &copy; {new Date().getFullYear()} F.R.O.S.T. Built with ❄️ by <span className="text-[var(--accent-primary)]">Team HackCypher</span>.
     </div>
     <div className="flex items-center gap-3 bg-[var(--bg-primary)] border border-border/50 px-3 py-1.5 rounded-full">
      <div className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse shadow-[0_0_8px_var(--ok)]"></div>
      <span className="text-[var(--ok)] font-bold tracking-wider text-[10px]">ALL SYSTEMS NOMINAL</span>
     </div>
    </div>
   </footer>
  </div>
 );
}

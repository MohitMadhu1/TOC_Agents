import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Zap, Terminal, GitBranch, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const modules = [
  { id: '1.1', title: 'DFA Architect', icon: <Terminal size={32}/>, color: '#C5A021', desc: 'Precision deterministic design workspace.' },
  { id: '1.2', title: 'NFA Simulator', icon: <GitBranch size={32}/>, color: '#00FF88', desc: 'Quantum branching and backtracking lab.' },
  { id: '1.3', title: 'Conversion Lab', icon: <Share2 size={32}/>, color: '#3A86FF', desc: 'Subset construction transformation engine.' },
  { id: '1.4', title: 'Minimizer Suite', icon: <Zap size={32}/>, color: '#FF006E', desc: 'Myhill-Nerode optimization wizard.' },
];

const Phase1Dashboard: React.FC<{ onBack: () => void, onLaunchDFA: () => void, onLaunchNFA: () => void, onLaunchConversion: () => void, onLaunchMinimizer: () => void }> = ({ onBack, onLaunchDFA, onLaunchNFA, onLaunchConversion, onLaunchMinimizer }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeMod = modules[activeIdx];

  const handleLaunch = () => {
    if (activeMod.id === '1.1') onLaunchDFA();
    if (activeMod.id === '1.2') onLaunchNFA();
    if (activeMod.id === '1.3') onLaunchConversion();
    if (activeMod.id === '1.4') onLaunchMinimizer();
  };

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col items-center justify-center p-12 overflow-hidden font-sans select-none">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <motion.div 
            animate={{ 
                x: [0, -20, 0], 
                rotate: [0, 5, 0],
                opacity: [0.1, 0.15, 0.1]
            }} 
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute -top-1/4 -left-1/4 w-full h-full text-[40rem] font-black italic tracking-tighter text-white select-none whitespace-nowrap"
         >
            {activeMod.id}
         </motion.div>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000816_70%)]" />
         <div className="absolute inset-0 z-0 opacity-10" 
              style={{ backgroundImage: 'linear-gradient(#C5A021 1px, transparent 1px), linear-gradient(90deg, #C5A021 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Floating Header */}
      <div className="absolute top-12 left-12 z-50">
        <button onClick={onBack} className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.6em] text-white/30 hover:text-[#C5A021] transition-all group">
            <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Central Registry
        </button>
      </div>

      {/* Central Holographic Terminal */}
      <div className="relative z-20 w-full max-w-6xl flex flex-col items-center text-center gap-12 -translate-y-16">
        <AnimatePresence mode="wait">
            <motion.div
                key={activeMod.id}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -30 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-6"
            >
                <div 
                    className="p-1 w-24 h-24 rounded-full border border-white/10 flex items-center justify-center relative group backdrop-blur-3xl overflow-hidden"
                    style={{ background: `radial-gradient(circle at center, ${activeMod.color}10 0%, transparent 70%)` }}
                >
                    <div className="absolute inset-0 animate-pulse bg-white/[0.02]" />
                    <div style={{ color: activeMod.color }} className="relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        {activeMod.icon}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-white/10" />
                        <span className="text-[10px] font-mono tracking-[0.5em] text-white/30 italic">STATION_PROTOCOL // {activeMod.id}</span>
                        <div className="h-px w-12 bg-white/10" />
                    </div>
                    <h2 className="text-[7.5rem] font-black uppercase leading-none italic tracking-tighter text-white drop-shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        {activeMod.title.split(' ')[0]} <span style={{ color: activeMod.color }}>{activeMod.title.split(' ')[1]}</span>
                    </h2>
                    <p className="max-w-xl mx-auto text-[11px] font-black uppercase tracking-[0.4em] text-white/40 leading-loose">
                        {activeMod.desc}
                    </p>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLaunch}
                    style={{ backgroundColor: activeMod.color }}
                    className="mt-8 px-16 py-6 text-black font-black uppercase text-xs tracking-[0.6em] rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] hover:brightness-110 transition-all flex items-center gap-4"
                >
                    Initialize Lab <ArrowRight size={16} />
                </motion.button>
            </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Horizontal Navigation */}
      <div className="absolute bottom-16 left-0 right-0 z-50 flex items-center justify-center gap-6 px-12">
         {modules.map((mod, i) => (
            <motion.div
                key={mod.id}
                onClick={() => setActiveIdx(i)}
                whileHover={{ y: -10 }}
                className={`relative group cursor-pointer w-48 transition-all duration-500`}
            >
                <div className={`h-[2px] w-full mb-6 transition-all duration-500 ${activeIdx === i ? 'bg-white' : 'bg-white/10 group-hover:bg-white/30'}`} />
                <div className="flex flex-col gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all ${activeIdx === i ? 'text-white' : 'text-white/20'}`}>
                        {mod.id}
                    </span>
                    <span className={`text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeIdx === i ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                        {mod.title}
                    </span>
                </div>
                {activeIdx === i && (
                    <motion.div 
                        layoutId="active-nav"
                        className="absolute -top-12 left-0 w-8 h-8 rounded-full blur-xl"
                        style={{ backgroundColor: mod.color }}
                    />
                )}
            </motion.div>
         ))}
      </div>

      {/* Controller Controls */}
      <div className="absolute bottom-24 right-12 z-50 flex items-center gap-4 text-white/20">
         <button onClick={() => setActiveIdx((prev) => (prev - 1 + modules.length) % modules.length)} className="p-4 hover:bg-white/5 rounded-full hover:text-white transition-all"><ChevronLeft size={24} /></button>
         <button onClick={() => setActiveIdx((prev) => (prev + 1) % modules.length)} className="p-4 hover:bg-white/5 rounded-full hover:text-white transition-all"><ChevronRight size={24} /></button>
      </div>

    </div>
  );
};

export default Phase1Dashboard;

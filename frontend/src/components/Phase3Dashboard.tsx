import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Box, Cpu, GitBranch, Globe, Zap, ArrowRight, Activity, Terminal, ShieldAlert } from 'lucide-react';

const modules = [
  {
    id: '05',
    title: 'Turing Machine Studio',
    desc: 'The universal model of computation. Infinite memory tape and deterministic states.',
    icon: <Terminal size={24} />,
    color: '#FFEA00', // Neon Yellow / Gold
    status: 'ACTIVE',
    station: 'Station 5.1'
  },
  {
    id: '06',
    title: 'Complexity Vault',
    desc: 'The limits of logic. P vs NP, Decidability, and the Halting Problem Paradox.',
    icon: <ShieldAlert size={24} />,
    color: '#FF3D00', // Deep Orange / Red
    status: 'ACTIVE',
    station: 'Station 6.1'
  }
];

interface Phase3DashboardProps {
  onBack: () => void;
  onLaunchTuring: () => void;
  onLaunchComplexity: () => void;
}

const Phase3Dashboard: React.FC<Phase3DashboardProps> = ({ onBack, onLaunchTuring, onLaunchComplexity }) => {
  const [hoveredMod, setHoveredMod] = useState(modules[0]);

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col items-center justify-center p-12 overflow-hidden font-sans select-none relative">
      
      {/* Background Ambience - Unit 3 Royal Theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#000816]">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a0033_0%,#000816_100%)] opacity-60" />
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
         <motion.div 
            key={hoveredMod.id}
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 0.1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center text-[30rem] font-black italic tracking-tighter text-white opacity-5"
         >
            {hoveredMod.id}
         </motion.div>
         <div className="absolute inset-0 z-0 opacity-[0.03]" 
              style={{ backgroundImage: 'linear-gradient(#C5A021 1px, transparent 1px), linear-gradient(90deg, #C5A021 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      {/* Floating Header */}
      <div className="absolute top-12 left-12 right-12 flex justify-between items-center z-50">
        <button onClick={onBack} className="flex items-center gap-4 text-white/40 hover:text-white transition-all group">
            <div className="p-3 bg-white/5 rounded-full border border-white/10 group-hover:border-[#C5A021]/50 transition-all">
                <ChevronLeft size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">System Hub</span>
        </button>
        <div className="flex flex-col items-end">
            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[#C5A021]">Phase 03 / The Terminal</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Universal Computation Engine</div>
        </div>
      </div>

      {/* Main Module Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center z-10 w-full max-w-7xl">
        {modules.map((mod) => (
          <motion.div
            key={mod.id}
            onMouseEnter={() => setHoveredMod(mod)}
            onClick={mod.id === '05' ? onLaunchTuring : onLaunchComplexity}
            whileHover={{ y: -20, scale: 1.02 }}
            className="w-full lg:w-[450px] group cursor-pointer"
          >
            <div className="relative p-12 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden group-hover:border-[#C5A021]/30 transition-all shadow-2xl h-[500px] flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-12">
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 text-white group-hover:border-[#C5A021]/50 transition-all">
                            {mod.icon}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                            {mod.station}
                        </div>
                    </div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter mb-6 group-hover:text-[#C5A021] transition-colors leading-none">
                        {mod.title}
                    </h2>
                    <p className="text-lg font-medium text-white/40 leading-relaxed italic pr-6 group-hover:text-white/60 transition-all">
                        {mod.desc}
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-[#C5A021] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A021]">{mod.status}</span>
                    </div>
                    <div className="p-5 bg-[#C5A021] text-black rounded-full shadow-[0_0_30px_rgba(197,160,33,0.3)] opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 transition-all duration-500">
                        <Zap size={20} fill="currentColor" />
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-24 -right-24 text-[12rem] font-black italic text-[#C5A021]/5 pointer-events-none">
                    {mod.id}
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interactive Legend */}
      <div className="absolute bottom-12 flex gap-12 text-[8px] font-black uppercase tracking-[0.5em] text-white/10 italic">
          <div className="flex items-center gap-3"><Activity size={12} /> Live Trace Active</div>
          <div className="flex items-center gap-3"><Globe size={12} /> Undecidability Engine Locked</div>
          <div className="flex items-center gap-3"><Cpu size={12} /> Universal Tape Optimized</div>
      </div>

    </div>
  );
};

export default Phase3Dashboard;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const units = [
  { id: '01', title: 'Finite Automata', desc: 'The fundamental mathematical models of computation including DFA, NFA, and the logic of Regular Expressions.', stats: 'Unit Core / Stable' },
  { id: '02', title: 'Context-Free Logic', desc: 'Pushdown Automata and the architecture of Context-Free Grammars used in compiler design.', stats: 'Locked / Sequential' },
  { id: '03', title: 'Turing Architecture', desc: 'Universal computation, decidability, and the theoretical limits of modern computing machines.', stats: 'Locked / Terminal' },
];

const UnitHub: React.FC<{ onSelectUnit: () => void }> = ({ onSelectUnit }) => {
  const [activeUnit, setActiveUnit] = useState(units[0]);

  return (
    <div className="min-h-screen w-full bg-[#000816] flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Ghost Background Number */}
      <AnimatePresence mode="wait">
        <motion.div
            key={activeUnit.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 0.03, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 1 }}
            className="absolute bottom-[-100px] right-[-50px] text-[40rem] font-black pointer-events-none select-none text-white italic"
        >
            {activeUnit.id}
        </motion.div>
      </AnimatePresence>

      {/* Left Selection Rail */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center p-12 lg:p-24 z-20 space-y-12">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20 mb-12"
        >
            System Syllabus / Index
        </motion.div>

        {units.map((unit) => (
          <motion.div
            key={unit.id}
            onMouseEnter={() => setActiveUnit(unit)}
            onClick={unit.id === '01' ? onSelectUnit : undefined}
            className={`group cursor-pointer relative ${unit.id !== '01' ? 'opacity-30' : ''}`}
          >
            <div className="flex items-baseline gap-8">
              <span className={`text-xl font-mono tracking-tighter ${activeUnit.id === unit.id ? 'text-[#C5A021]' : 'text-white/20'}`}>
                [{unit.id}]
              </span>
              <h2 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter transition-all duration-500 ${
                activeUnit.id === unit.id ? 'text-white scale-105' : 'text-white/10 group-hover:text-white/40'
              }`}>
                {unit.title}
              </h2>
            </div>
            
            {/* The Focus Beam */}
            {activeUnit.id === unit.id && (
                <motion.div 
                    layoutId="beam"
                    className="absolute -bottom-2 left-0 h-[2px] bg-[#C5A021] shadow-[0_0_20px_#C5A021]" 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                />
            )}
          </motion.div>
        ))}
      </div>

      {/* Right Detail Panel */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center p-12 lg:p-24 z-20">
        <AnimatePresence mode="wait">
            <motion.div
                key={activeUnit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="max-w-md"
            >
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C5A021] mb-6">
                    {activeUnit.stats}
                </div>
                <p className="text-xl md:text-2xl font-medium leading-relaxed text-white/60 mb-12 italic">
                    {activeUnit.desc}
                </p>
                
                {activeUnit.id === '01' ? (
                    <button 
                        onClick={onSelectUnit}
                        className="py-4 px-10 border border-[#C5A021] text-[#C5A021] text-[10px] uppercase font-black tracking-[0.4em] rounded-full hover:bg-[#C5A021] hover:text-black transition-all"
                    >
                        Initialize Module
                    </button>
                ) : (
                    <div className="text-[10px] uppercase font-black tracking-[0.4em] text-white/10">
                        Module Encrypted / Restricted
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
      </div>

      {/* Edge Accents */}
      <div className="absolute top-12 right-12 text-[9px] font-black uppercase tracking-[0.5em] text-white/10">
          Core Engine v1.0
      </div>
      <div className="absolute bottom-12 left-12 flex gap-12 text-[9px] font-black uppercase tracking-[0.5em] text-white/10">
          <span>Scale: Global</span>
          <span>Status: Verified</span>
      </div>
    </div>
  );
};

export default UnitHub;

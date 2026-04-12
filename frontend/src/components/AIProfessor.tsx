import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Compass } from 'lucide-react';

interface AIProfessorProps {
  context: string;
}

const AIProfessor: React.FC<AIProfessorProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <>
      {/* ── MINIMALIST TRIGGER ── */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-12 right-12 z-[200] flex items-center gap-4 group"
        >
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-[#C5A021] transition-colors">Invoke</div>
            <div className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-0.5">Theory Assistant</div>
          </div>
          <div className="w-16 h-16 bg-[#000816] border border-[#C5A021]/30 rounded-full flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[#C5A021]/5 animate-pulse" />
             <Sparkles size={24} className="text-[#C5A021] relative z-10" />
          </div>
        </motion.button>
      )}

      {/* ── THE KNOWLEDGE MONOLITH ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Global Dimmer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#000816]/60 backdrop-blur-sm z-[201]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-[480px] z-[202] bg-[#000816] shadow-[-20px_0_100px_rgba(0,0,0,0.5)] border-l border-[#C5A021]/20 flex flex-col"
            >
              {/* Subtle Gold Grain Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

              {/* Header */}
              <div className="p-12 pb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#C5A021] flex items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-2 h-2 bg-[#C5A021] rounded-full shadow-[0_0_15px_#C5A021]" 
                    />
                  </div>
                  <div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#C5A021]">Theory Professor</h2>
                    <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1 italic">Knowledge Monolith v2.0</div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Main Knowledge Column */}
              <div className="flex-1 overflow-y-auto px-12 space-y-16 py-8 custom-scrollbar">
                {/* Introduction Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Compass size={14} className="text-[#C5A021]/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Current Anchor</span>
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter text-white/90 leading-tight">
                    Understanding the <span className="text-[#C5A021]">{context}</span>
                  </h3>
                  <p className="text-base text-white/40 leading-relaxed font-medium italic">
                    I am synthesizing your current machine state. From this vantage point, we can explore the formal architecture of your transitions or dive into the deeper implications of decidability.
                  </p>
                </section>

                {/* Conceptual Breakdown (Placeholders) */}
                <section className="space-y-8">
                  <div className="h-px bg-white/5 w-full" />
                  <div className="space-y-4 opacity-30">
                     <div className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C5A021]">System Insights</div>
                     <div className="p-8 border border-white/5 rounded-3xl bg-white/[0.01] space-y-3">
                        <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                        <div className="h-2 w-full bg-white/5 rounded-full" />
                        <div className="h-2 w-3/4 bg-white/5 rounded-full" />
                     </div>
                  </div>
                </section>

                {/* Critical Theory Note */}
                <div className="p-10 bg-[#C5A021]/5 border border-[#C5A021]/10 rounded-[3rem] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A021]/30" />
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#C5A021] mb-2 opacity-60 italic">Professor's Note</div>
                  <p className="text-sm text-[#C5A021] font-medium leading-relaxed italic">
                    "Computation is not merely the execution of steps, but the exploration of what is provably possible."
                  </p>
                </div>
              </div>

              {/* Dialogue Input */}
              <div className="p-12 bg-black/20">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[#C5A021]/10 to-transparent blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Consult the oracle..."
                    className="w-full bg-transparent border-b border-white/10 py-6 text-xl font-medium text-white placeholder:text-white/10 focus:outline-none focus:border-[#C5A021] transition-all"
                  />
                  <button className="absolute right-0 bottom-6 p-2 text-[#C5A021] hover:scale-125 transition-transform">
                    <Send size={24} />
                  </button>
                </div>
                <div className="mt-6 flex justify-between text-[8px] font-black uppercase tracking-widest text-white/10">
                   <span>Awaiting Prompt</span>
                   <span>TOC_AGENT // UNIT_INF</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIProfessor;

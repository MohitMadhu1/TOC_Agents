import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import AIProfessor from './AIProfessor';

/* ──────────────────────────────────────────────────────────
   DATA
────────────────────────────────────────────────────────── */
const CLASSES = [
  {
    id: 'P',
    name: 'Class P',
    subtitle: 'Polynomial Time',
    color: '#22d3ee',
    ring: 50,
    def: 'Problems solvable by a deterministic TM in O(nᵏ) time. These are "efficiently computable" by a computer.',
    problems: [
      { name: 'Sorting',       desc: 'MergeSort / QuickSort solves this in O(n log n).' },
      { name: 'Shortest Path', desc: 'Dijkstra\'s algorithm finds it in O(n²).' },
    ],
    badge: 'Efficient'
  },
  {
    id: 'NP',
    name: 'Class NP',
    subtitle: 'Non-deterministic Polynomial',
    color: '#C5A021',
    ring: 90,
    def: 'Problems whose solutions can be VERIFIED in polynomial time. Finding the solution may take exponential time.',
    problems: [
      { name: 'Factorization',  desc: 'Hard to factor, easy to verify: Is 29 × 31 = 899? Yes.' },
      { name: 'Knapsack',       desc: 'Hard to optimize; easy to verify a proposed subset.' },
    ],
    badge: 'Verifiable'
  },
  {
    id: 'NPC',
    name: 'NP-Complete',
    subtitle: 'Hardest of NP',
    color: '#f97316',
    ring: 130,
    def: 'The hardest problems in NP. Every NP problem reduces to NPC in polynomial time. Solve one → solve all.',
    problems: [
      { name: 'SAT',             desc: 'First proven NP-Complete (Cook 1971). Boolean satisfiability.' },
      { name: 'Traveling Salesman', desc: 'Find the shortest tour visiting n cities.' },
    ],
    badge: 'Universal'
  },
  {
    id: 'NPH',
    name: 'NP-Hard',
    subtitle: 'Beyond NP',
    color: '#ef4444',
    ring: 170,
    def: 'At least as hard as every NP problem, but not necessarily in NP themselves. May be undecidable.',
    problems: [
      { name: 'Halting Problem',    desc: 'Undecidable. No TM can determine if M halts on input w.' },
      { name: 'EXPTIME',            desc: 'Generalized board games like Chess or Go.' },
    ],
    badge: 'Intractable'
  }
];

/* ──────────────────────────────────────────────────────────
   COMPONENT
────────────────────────────────────────────────────────── */
const ComplexityLab: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<'explorer' | 'halting'>('explorer');
  const [selected, setSelected] = useState(CLASSES[0]);
  const [paradoxStage, setParadoxStage] = useState(0);

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col text-white font-sans overflow-hidden relative select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#200010_0%,#000816_55%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* ── HEADER ── */}
      <div className="h-16 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-base font-black uppercase tracking-[0.2em] italic">
            Station 6.1 / <span className="text-[#ef4444]">Complexity Vault</span>
          </h1>
        </div>
        <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
          {(['explorer', 'halting'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all ${tab === t ? 'bg-[#ef4444] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              {t === 'explorer' ? 'Explorer' : 'Halting Paradox'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {/* ... content ... */}
          {tab === 'explorer' && (
            <motion.div
              key="explorer"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex overflow-hidden"
            >
              {/* Left: Nested Euler Diagram */}
              <div className="w-[45%] shrink-0 flex items-center justify-center relative border-r border-white/5 bg-black/5">
                <div className="relative flex items-center justify-center" style={{ width: 400, height: 400 }}>
                  {/* Draw rings from outside in */}
                  {[...CLASSES].reverse().map((cls, ri) => (
                    <motion.button
                      key={cls.id}
                      onClick={() => setSelected(cls)}
                      whileHover={{ scale: 1.02 }}
                      animate={{ 
                        opacity: selected.id === cls.id ? 1 : 0.4,
                        scale: selected.id === cls.id ? 1.05 : 1
                      }}
                      style={{
                        width: cls.ring * 2,
                        height: cls.ring * 2,
                        borderColor: cls.color,
                        boxShadow: selected.id === cls.id ? `0 0 50px ${cls.color}20` : 'none',
                        backgroundColor: selected.id === cls.id ? `${cls.color}05` : 'transparent',
                      }}
                      className="absolute rounded-full border-2 border-dashed flex items-center justify-center transition-all cursor-pointer"
                    >
                      <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#000816]/90 border border-white/5 absolute -bottom-2"
                        style={{ color: cls.color }}
                      >
                        {cls.id}
                      </span>
                    </motion.button>
                  ))}
                  {/* Center label */}
                  <div className="relative z-10 text-center pointer-events-none">
                    <div className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: selected.color }}>{selected.id}</div>
                    <div className="text-[8px] text-white/20 font-mono uppercase tracking-widest">{selected.subtitle}</div>
                  </div>
                </div>

                {/* P=NP question mark */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center space-y-1">
                  <div className="text-[8px] font-black uppercase tracking-widest text-white/20">Open Problem</div>
                  <div className="text-xl font-black italic text-white/30 tracking-widest">P = NP ?</div>
                </div>
              </div>

              {/* Right: Detail panel */}
              <div className="flex-1 flex flex-col overflow-hidden bg-black/10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selected.id}
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col overflow-y-auto p-12"
                  >
                    {/* Class header */}
                    <div className="mb-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border"
                          style={{ color: selected.color, borderColor: `${selected.color}30`, backgroundColor: `${selected.color}05` }}>
                          {selected.badge}
                        </div>
                      </div>
                      <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-4" style={{ color: selected.color }}>
                        {selected.name}
                      </h2>
                      <p className="text-base font-medium text-white/40 leading-relaxed italic max-w-lg">{selected.def}</p>
                    </div>

                    {/* Problems */}
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-6">Architypal Problems</div>
                    <div className="grid grid-cols-1 gap-4 max-w-xl">
                      {selected.problems.map(p => (
                        <div key={p.name}
                          className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                          style={{ borderLeftColor: `${selected.color}30`, borderLeftWidth: 3 }}>
                          <div className="font-black uppercase tracking-widest text-sm mb-1" style={{ color: selected.color }}>{p.name}</div>
                          <p className="text-xs text-white/40 leading-relaxed font-medium">{p.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Relationships */}
                    <div className="mt-12 p-8 rounded-[2rem] border border-white/5 bg-black/40 max-w-xl">
                      <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/15 mb-4">Theoretic Mapping</div>
                      <div className="font-mono text-sm text-white/40 leading-loose">
                        <span className="text-[#22d3ee]">P</span> ⊆ <span className="text-[#C5A021]">NP</span> ⊆ <span className="text-[#ef4444]">NP-Hard</span><br />
                        <span className="text-[#f97316]">NP-Complete</span> = NP ∩ NP-Hard
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {tab === 'halting' && (
            <motion.div
              key="halting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-12 gap-12 overflow-y-auto"
            >
              <div className="text-center">
                <div className="text-[10px] font-black uppercase tracking-[1em] text-[#ef4444]/60 mb-4">Alan Turing, 1936</div>
                <h2 className="text-6xl font-black uppercase tracking-tighter italic">The Paradox</h2>
                <p className="text-white/30 text-base font-medium italic mt-4 max-w-2xl leading-relaxed">
                  Can a machine <b className="text-white/60">H</b> decide if any machine <b className="text-white/60">M</b> halts?
                </p>
              </div>

              {/* Interactive stage */}
              <div className="w-full max-w-5xl">
                {/* Stage progress */}
                <div className="flex gap-3 justify-center mb-12">
                  {[0,1,2,3].map(s => (
                    <div key={s} className={`h-1.5 w-20 rounded-full transition-all duration-500 ${paradoxStage >= s ? 'bg-[#ef4444] shadow-[0_0_15px_#ef4444]' : 'bg-white/5'}`} />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {paradoxStage === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                      className="flex flex-col items-center gap-12">
                      <div className="flex items-center gap-10">
                        <MachineBox label="M" sub="Program" color="#C5A021" />
                        <Arrow label="(M, w)" />
                        <OracleBox label="H" sub="Oracle" />
                        <Arrow label="" />
                        <OutputBox label="RESULT" color="#22d3ee" />
                      </div>
                      <NavBtn label="Build Machine G →" onClick={() => setParadoxStage(1)} />
                    </motion.div>
                  )}

                  {paradoxStage === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-12">
                      <div className="flex items-center gap-10 p-12 border border-white/10 rounded-[4rem] bg-white/[0.02]">
                        <OracleBox label="H" sub="H(M,M)" />
                        <Arrow label="Opposite" />
                        <div className="text-center space-y-2">
                          <div className="text-2xl font-black text-[#ef4444]">LOOP ∞</div>
                          <div className="text-xs font-bold text-white/20">VS</div>
                          <div className="text-2xl font-black text-[#22d3ee]">HALT</div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <NavBtn label="Back" onClick={() => setParadoxStage(0)} secondary />
                        <NavBtn label="Test G(G) →" onClick={() => setParadoxStage(2)} />
                      </div>
                    </motion.div>
                  )}

                  {paradoxStage === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                      className="flex flex-col items-center gap-12">
                      <div className="flex items-center gap-12">
                        <MachineBox label="G" sub="Input" color="#ef4444" />
                        <Arrow label="Self-Reference" />
                        <div className="p-10 border-2 border-[#ef4444]/40 rounded-[3rem] bg-[#ef4444]/5 text-center">
                          <div className="text-xl font-bold italic text-white/60 max-w-xs"> If H says G halts, G loops. If H says G loops, G halts.</div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <NavBtn label="Back" onClick={() => setParadoxStage(1)} secondary />
                        <NavBtn label="Visualize Contradiction →" onClick={() => setParadoxStage(3)} />
                      </div>
                    </motion.div>
                  )}

                  {paradoxStage === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-12">
                      <div className="px-16 py-10 border-4 border-[#ef4444] rounded-[4rem] bg-[#ef4444]/15 shadow-[0_0_80px_rgba(239,68,68,0.2)]">
                        <div className="text-8xl font-black italic uppercase text-[#ef4444] tracking-tighter">ERROR</div>
                      </div>
                      <p className="text-white/40 text-sm font-bold uppercase tracking-[0.5em] text-center">
                        Undecidability Confirmed. Oracle H cannot exist.
                      </p>
                      <NavBtn label="Reset Proof" onClick={() => setParadoxStage(0)} secondary />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-8 shrink-0 px-6 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.5em] text-white/10 italic z-50">
        <span>Undecidability Engine // Station 6.1</span>
        <span>Complexity Vault // Unit 06</span>
      </div>

      <AIProfessor context={tab === 'explorer' ? 'Complexity Class Euler Hierarchy' : 'Halting Problem Paradox'} />
    </div>
  );
};

/* ─── Helpers ─── */
const MachineBox: React.FC<{ label: string; sub: string; color?: string }> = ({ label, sub, color = '#C5A021' }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-20 h-20 border-2 rounded-2xl flex items-center justify-center text-3xl font-black"
      style={{ borderColor: color, color, backgroundColor: `${color}10` }}>{label}</div>
    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{sub}</span>
  </div>
);

const OracleBox: React.FC<{ label: string; sub: string }> = ({ label, sub }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-20 h-20 border-2 border-dashed border-[#ef4444]/60 rounded-full flex items-center justify-center text-3xl font-black text-[#ef4444] bg-[#ef4444]/5">{label}</div>
    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{sub}</span>
  </div>
);

const OutputBox: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div className="px-5 py-4 border-2 rounded-2xl text-sm font-black uppercase tracking-wider"
    style={{ borderColor: `${color}60`, color, backgroundColor: `${color}10` }}>{label}</div>
);

const Arrow: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center gap-1">
    {label && <span className="text-[9px] font-bold font-mono text-white/30">{label}</span>}
    <div className="text-white/20 text-2xl leading-none">→</div>
  </div>
);

const NavBtn: React.FC<{ label: string; onClick: () => void; secondary?: boolean }> = ({ label, onClick, secondary }) => (
  <button onClick={onClick}
    className={`px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 ${
      secondary ? 'border border-white/20 text-white/40 hover:text-white hover:border-white/40' : 'bg-[#ef4444] text-white shadow-xl'
    }`}>
    {label}
  </button>
);

export default ComplexityLab;

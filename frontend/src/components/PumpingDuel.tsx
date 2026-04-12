import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Swords, Zap, ArrowRight, Shield, Target, Cpu, AlertTriangle, Trophy } from 'lucide-react';

const levels = [
  { 
    id: 'L1', title: 'Equivalence Duel', language: 'L = {0ⁿ 1ⁿ | n ≥ 0}', 
    desc: 'The classic non-regular challenge. Prove the machine cannot count.',
    generateS: (p: number) => '0'.repeat(p) + '1'.repeat(p),
    isMember: (s: string) => {
        const zeros = (s.match(/0/g) || []).length;
        const ones = (s.match(/1/g) || []).length;
        // Also must be in 0* 1* format
        return /^0*1*$/.test(s) && zeros === ones;
    }
  },
  { 
    id: 'L2', title: 'Palindrome Duel', language: 'L = {wwᴿ | w ∈ {0,1}*}', 
    desc: 'Symmetry check. Prove the machine lacks a stack memory.',
    generateS: (p: number) => '0'.repeat(p) + '1' + '1' + '0'.repeat(p),
    isMember: (s: string) => s === s.split('').reverse().join('')
  },
  { 
    id: 'L3', title: 'Prime Duel', language: 'L = {1ⁿ | n is prime}', 
    desc: 'The density battle. Prove the machine cannot handle prime distributions.',
    generateS: (p: number) => {
        const isPrime = (num: number) => {
            for(let i = 2, s = Math.sqrt(num); i <= s; i++) if(num % i === 0) return false;
            return num > 1;
        };
        let n = p;
        while (!isPrime(n)) n++;
        return '1'.repeat(n);
    },
    isMember: (s: string) => {
        const num = s.length;
        for(let i = 2, sq = Math.sqrt(num); i <= sq; i++) if(num % i === 0) return false;
        return num > 1;
    }
  },
  {
    id: 'L4', title: 'Equal Count', language: 'L = {w | #0(w) = #1(w)}',
    desc: 'Unordered balance. Prove the machine cannot track parity across any permutation.',
    generateS: (p: number) => '0'.repeat(p) + '1'.repeat(p),
    isMember: (s: string) => (s.match(/0/g) || []).length === (s.match(/1/g) || []).length
  },
  {
    id: 'L5', title: 'Square Power', language: 'L = {0ⁿ² | n ≥ 0}',
    desc: 'Exponential growth. Prove the machine cannot handle non-linear spacings.',
    generateS: (p: number) => '0'.repeat(p * p),
    isMember: (s: string) => {
        const n = Math.sqrt(s.length);
        return n === Math.floor(n);
    }
  },
  {
    id: 'L6', title: 'Triple Threat', language: 'L = {aⁿ bⁿ cⁿ | n ≥ 0}',
    desc: 'The ultimate context check. Multi-symbol synchronization battle.',
    generateS: (p: number) => 'a'.repeat(p) + 'b'.repeat(p) + 'c'.repeat(p),
    isMember: (s: string) => {
        const a = (s.match(/a/g) || []).length;
        const b = (s.match(/b/g) || []).length;
        const c = (s.match(/c/g) || []).length;
        return /^a*b*c*$/.test(s) && a === b && b === c;
    }
  }
];

const PumpingDuel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'selection' | 'p-choice' | 's-input' | 'split-view' | 'pump-choose' | 'result'>('selection');
  const [selectedLevel, setSelectedLevel] = useState(levels[0]);
  const [p, setP] = useState(4);
  const [userS, setUserS] = useState('');
  const [error, setError] = useState('');
  const [split, setSplit] = useState({ x: '', y: '', z: '' });
  const [i, setI] = useState(2);
  const [win, setWin] = useState(false);

  // CPU chooses a harder p
  const startDuel = (level: typeof levels[0]) => {
    setSelectedLevel(level);
    setP(Math.floor(Math.random() * 5) + 6); // p between 6-10
    setUserS('');
    setError('');
    setGameState('s-input');
  };

  const findOptimalSplit = (s: string) => {
    // Strategic Adversary: Try all splits |xy| <= p, |y| > 0
    // Pick the y that stays in the language for MOST i in [0, 2, 3]
    let bestSplit = { x: '', y: '', z: '' };
    let minFailures = 999;

    for (let xLen = 0; xLen < p; xLen++) {
        for (let yLen = 1; xLen + yLen <= p; yLen++) {
            const x = s.substring(0, xLen);
            const y = s.substring(xLen, xLen + yLen);
            const z = s.substring(xLen + yLen);
            
            let failures = 0;
            [0, 2, 3].forEach(pumpI => {
                if (selectedLevel.isMember(x + y.repeat(pumpI) + z)) failures++;
            });

            // The CPU wants to KEEP failures low (staying in language is CPU's goal)
            if (failures < minFailures) {
                minFailures = failures;
                bestSplit = { x, y, z };
            }
        }
    }
    return bestSplit;
  };

  const handleManualS = () => {
    if (userS.length < p) {
        setError(`String too short! Must be |s| \u2265 ${p}`);
        return;
    }
    if (!selectedLevel.isMember(userS)) {
        setError(`Invalid string! Not a member of the language.`);
        return;
    }

    const optimal = findOptimalSplit(userS);
    setSplit(optimal);
    setGameState('split-view');
  };

  const checkPump = () => {
    const pumpedS = split.x + split.y.repeat(i) + split.z;
    const isStillMember = selectedLevel.isMember(pumpedS);
    
    if (!isStillMember) {
        setWin(true);
    } else {
        setWin(false);
    }
    setGameState('result');
  };

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col text-white font-sans overflow-hidden select-none relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#001a33_0%,#000816_100%)] opacity-40 pointer-events-none" />
      {/* Header */}
      <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Station 2.3 / <span className="text-[#C5A021]">Pumping Duel</span></h1>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Non-Regularity Prover</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <Cpu size={14} className="text-[#C5A021]" /> Adversary: v_Alpha_01
            </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-20 relative overflow-hidden">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #BDFF00 1px, transparent 0)', backgroundSize: '30px 30px' }} />

        <AnimatePresence mode="wait">
          {gameState === 'selection' && (
            <motion.div 
               key="selection" 
               initial={{ opacity: 0, y: 30 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.9 }}
               className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl z-10"
            >
               {levels.map(level => (
                   <button 
                        key={level.id} 
                        onClick={() => startDuel(level)}
                        className="group bg-black/40 border border-white/10 p-10 rounded-[3rem] text-left hover:border-[#C5A021]/50 hover:bg-[#C5A021]/5 transition-all relative overflow-hidden flex flex-col items-start gap-4"
                   >
                        <div className="text-[10px] font-black uppercase tracking-thick text-[#C5A021] mb-2">{level.id}</div>
                        <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-[#C5A021] transition-colors">{level.title}</h3>
                        <code className="text-[#C5A021] font-mono text-sm bg-black/60 px-3 py-1 rounded-lg">{level.language}</code>
                        <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mt-4 leading-loose">{level.desc}</p>
                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                            <ArrowRight className="text-[#C5A021]" />
                        </div>
                   </button>
               ))}
            </motion.div>
          )}

          {gameState === 's-input' && (
            <motion.div key="s-input" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-12 z-10 text-center w-full max-w-4xl">
                 <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[1em] text-white/20">Phase 01 // Input Synthesis</div>
                    <div className="flex items-center gap-6 justify-center">
                        <div className="p-8 bg-white/5 border border-white/10 rounded-full text-white/30 animate-pulse"><Cpu size={40} /></div>
                        <div className="h-px w-20 bg-white/10" />
                        <div className="text-6xl font-black italic tracking-tighter text-[#C5A021]">p = {p}</div>
                    </div>
                 </div>
                 
                 <div className="bg-black/40 border border-white/5 p-12 rounded-[4rem] shadow-2xl space-y-8 w-full relative">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Synthesize String s </h2>
                    <p className="text-white/40 text-[11px] uppercase tracking-widest leading-loose max-w-2xl mx-auto">Provide a string <b>s</b> from {selectedLevel.language} where <b>|s| \u2265 {p}</b>. The Adversary will then calculate a split <b>xyz</b> to trap you.</p>
                    
                    <div className="relative group">
                        <input 
                            value={userS}
                            onChange={(e) => { setUserS(e.target.value); setError(''); }}
                            placeholder="Type string s..."
                            className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'} p-8 rounded-3xl text-4xl font-black italic tracking-tight text-[#C5A021] focus:outline-none focus:border-[#C5A021]/50 transition-all text-center uppercase`}
                        />
                        {error && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-8 left-0 right-0 text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <AlertTriangle size={12} className="inline mr-2 mb-1" /> {error}
                            </motion.div>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20 pt-1">Suggestions:</span>
                        <button onClick={() => setUserS(selectedLevel.generateS(p))} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase hover:bg-[#C5A021]/10 transition-all tracking-widest leading-none">Standard Proof</button>
                        <button onClick={() => setUserS(selectedLevel.generateS(p+4))} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase hover:bg-[#C5A021]/10 transition-all tracking-widest leading-none">Long Synthesis</button>
                    </div>

                    <button 
                        onClick={handleManualS}
                        className="w-full py-6 bg-[#C5A021] text-black font-black uppercase text-xs tracking-[1em] rounded-full hover:scale-105 transition-all shadow-xl"
                    >
                        Submit Synthesis
                    </button>
                 </div>
            </motion.div>
          )}

          {gameState === 'split-view' && (
             <motion.div key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-16 z-10">
                <div className="text-[10px] font-black uppercase tracking-[1em] text-white/20 animate-pulse italic">Critical Split Detected</div>
                <div className="flex items-center gap-4 text-6xl font-black tracking-tighter">
                   <div className="flex flex-col items-center gap-4">
                        <div className="text-[10px] uppercase text-white/20 tracking-widest">x</div>
                        <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/40">{split.x || 'ε'}</div>
                   </div>
                   <div className="flex flex-col items-center gap-4 group">
                        <div className="text-[10px] uppercase text-[#C5A021] tracking-widest font-black">y</div>
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }} className="px-8 py-6 bg-[#C5A021]/10 border border-[#C5A021]/50 rounded-2xl text-[#C5A021] shadow-[0_0_50px_rgba(197,160,33,0.2)]">{split.y}</motion.div>
                   </div>
                   <div className="flex flex-col items-center gap-4">
                        <div className="text-[10px] uppercase text-white/20 tracking-widest">z</div>
                        <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/40">{split.z}</div>
                   </div>
                </div>

                <div className="max-w-md text-center space-y-6">
                    <div className="text-[11px] font-black uppercase tracking-widest text-white/40 underline decoration-[#C5A021]/50 underline-offset-8">Rules Observed: |xy| ≤ p ({p}) AND |y| {">"} 0</div>
                    <p className="text-lg font-bold italic tracking-tight text-white/60">The Adversary has split s into xyz. Now, choose the Pumping Factor to break the language.</p>
                    <div className="flex items-center gap-6 justify-center">
                        <input 
                            type="range" min="0" max="5" value={i} 
                            onChange={(e) => setI(parseInt(e.target.value))}
                            className="w-48 accent-[#C5A021]"
                        />
                        <div className="text-4xl font-black text-[#C5A021]">i = {i}</div>
                    </div>
                    <button 
                        onClick={checkPump}
                        className="px-16 py-5 bg-[#C5A021] text-black font-black uppercase text-[10px] tracking-[0.5em] rounded-full hover:scale-110 transition-all shadow-2xl"
                    >
                        Execute Pump <Zap size={16} />
                    </button>
                </div>
             </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div key="result" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-10 z-10 text-center">
                {win ? (
                    <>
                        <div className="p-12 bg-[#C5A021]/10 border-2 border-[#C5A021] rounded-full shadow-[0_0_100px_rgba(197,160,33,0.3)] animate-bounce">
                            <Trophy size={80} className="text-[#C5A021]" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-7xl font-black italic tracking-tighter uppercase leading-none">DUEL WON</h2>
                            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.5em]">String s = {split.x}{split.y.repeat(i)}{split.z} ∉ {selectedLevel.id}</p>
                        </div>
                        <div className="max-w-md text-sm font-medium text-white/60 uppercase tracking-widest leading-loose">
                            You successfully proved that the language is <span className="text-[#C5A021] font-black underline">NON-REGULAR</span>. The pumping condition failed for i = {i}.
                        </div>
                    </>
                ) : (
                    <>
                         <div className="p-12 bg-red-500/10 border-2 border-red-500 rounded-full shadow-[0_0_100px_rgba(239,68,68,0.3)]">
                            <AlertTriangle size={80} className="text-red-500" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-7xl font-black italic tracking-tighter uppercase leading-none text-red-500">DUEL LOST</h2>
                            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.5em]">The pumped string remained valid according to the machine's constraints.</p>
                        </div>
                    </>
                )}
                <button 
                    onClick={() => { setGameState('selection'); setWin(false); }}
                    className="px-12 py-5 border border-white/20 text-white/40 hover:text-white hover:border-[#C5A021] transition-all font-black uppercase text-[10px] tracking-[0.4em] rounded-full"
                >
                    Restart Duel Protocol
                </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <div className="h-10 px-8 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.6em] text-white/10 italic z-50">
          <span>Simulation Mode: Pumping_Lemma_Tactical // vs_vAlpha</span>
          <span>Pumping Duel // Unit_02_Station_03</span>
      </div>
    </div>
  );
};

export default PumpingDuel;

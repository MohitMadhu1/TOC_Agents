import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Terminal, Zap, Search, Sparkles, Wand2, Info, Layers, Box, Loader2, ArrowUpRight, AlertCircle } from 'lucide-react';
import { AIService } from '../utils/aiService';

const RegexPlayground: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [regex, setRegex] = useState('');
  const [generatedStrings, setGeneratedStrings] = useState<string[]>([]);
  const [isInfinite, setIsInfinite] = useState(false);
  const [optimizerActive, setOptimizerActive] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formal TOC Language Generator
  useEffect(() => {
    setIsInfinite(false);
    if (!regex) {
      setGeneratedStrings([]);
      return;
    }

    try {
        // Advanced Recursive Set Generator
        const solve = (expr: string): Set<string> => {
            let s = expr.trim();
            if (!s || s === 'ε' || s === 'ϵ') return new Set(['ε']);
            if (s === 'Ø' || s === '∅') return new Set();

            // 1. Handle Top-Level Union (r1 + r2)
            let parenLevel = 0;
            for (let i = 0; i < s.length; i++) {
                if (s[i] === '(') parenLevel++;
                if (s[i] === ')') parenLevel--;
                if (s[i] === '+' && parenLevel === 0) {
                    const left = solve(s.substring(0, i));
                    const right = solve(s.substring(i + 1));
                    return new Set([...left, ...right]);
                }
            }

            // 2. Token-Based Concatenation
            // Find the first atomic token: a, (expr), or x*
            let firstTokenEnd = 0;
            if (s[0] === '(') {
                let p = 1;
                let j = 1;
                while (p > 0 && j < s.length) {
                    if (s[j] === '(') p++;
                    if (s[j] === ')') p--;
                    j++;
                }
                firstTokenEnd = j;
            } else {
                firstTokenEnd = 1;
            }
            // Check for Star suffix on the token
            if (s[firstTokenEnd] === '*') firstTokenEnd++;

            if (firstTokenEnd < s.length) {
                const head = solve(s.substring(0, firstTokenEnd));
                const tail = solve(s.substring(firstTokenEnd));
                const res = new Set<string>();
                head.forEach(h => {
                    tail.forEach(t => {
                        const s1 = h === 'ε' ? '' : h;
                        const s2 = t === 'ε' ? '' : t;
                        res.add(s1 + s2 || 'ε');
                    });
                });
                return res;
            }

            // 3. Handle Star (r*)
            if (s.endsWith('*')) {
                setIsInfinite(true);
                const base = solve(s.slice(0, -1));
                const baseArr = Array.from(base).filter(x => x !== 'ε');
                if (baseArr.length === 0) return new Set(['ε']);
                
                const res = new Set(['ε']);
                let current = new Set(['']);
                for (let k = 0; k < 3; k++) {
                    const next = new Set<string>();
                    current.forEach(c => {
                        baseArr.forEach(b => {
                            if (c.length + b.length < 10) next.add(c + b);
                        });
                    });
                    next.forEach(n => res.add(n));
                    current = next;
                }
                return res;
            }

            // 4. Handle Parentheses
            if (s.startsWith('(') && s.endsWith(')')) {
                return solve(s.slice(1, -1));
            }

            return new Set([s]);
        };

        const resultSet = solve(regex);
        const sortedResults = Array.from(resultSet).sort((a, b) => {
            if (a === 'ε') return -1;
            if (b === 'ε') return 1;
            return a.length - b.length || a.localeCompare(b);
        });

        setGeneratedStrings(sortedResults.slice(0, 10));
    } catch (e) {
        setGeneratedStrings(['ERROR: Syntax']);
    }
  }, [regex]);

  const handleOptimize = async () => {
    if (!regex.trim() || isOptimizing) return;
    setIsOptimizing(true);
    setErrorMessage(null);
    try {
      const ai = new AIService();
      // We pass the current regex as both prompt and current value
      const newRegex = await ai.optimizeRegex("Minimize and simplify this formal regular expression as much as possible while maintaining the same language.", regex);
      setRegex(newRegex);
    } catch (err: any) {
      setErrorMessage(err.message || "Oracle failed to optimize.");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col text-white font-sans overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#001a33_0%,#000816_100%)] opacity-40 pointer-events-none" />
      
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl font-black uppercase text-[10px] tracking-widest cursor-pointer" 
            onClick={() => setErrorMessage(null)}
          >
            <AlertCircle size={16} /> {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Station 2.1 / <span className="text-[#C5A021]">Regex Playground</span></h1>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Regular Language Workspace</div>
          </div>
        </div>
        <button 
            onClick={() => setOptimizerActive(!optimizerActive)}
            className={`px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${optimizerActive ? 'bg-[#C5A021] text-black border-[#C5A021]' : 'bg-white/5 text-[#C5A021] border-[#C5A021]/30 hover:bg-[#C5A021]/10'}`}
        >
            <Sparkles size={14} /> AI Optimizer
        </button>
      </div>

      <div className="flex-grow flex p-8 gap-8 overflow-hidden relative">
        
        {/* Left Side: The Engine */}
        <div className="flex-grow flex flex-col gap-8">
            {/* Input Terminal */}
            <div className="bg-black/40 border border-white/5 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A021]/40 block" />
                <div className="flex items-center gap-4 mb-6 text-[#C5A021]/40">
                    <Terminal size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Input Console</span>
                </div>
                <div className="relative">
                    <input 
                        value={regex}
                        onChange={(e) => setRegex(e.target.value)}
                        placeholder="e.g. (a+b)*.a"
                        className="w-full bg-transparent text-5xl font-black italic tracking-tighter text-white focus:outline-none placeholder:text-white/5 pr-48"
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-6">
                        <div className="flex gap-4 opacity-40">
                            <kbd className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">+ Union</kbd>
                            <kbd className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono">* Star</kbd>
                        </div>
                        <button 
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className={`p-4 rounded-2xl bg-[#C5A021]/10 border border-[#C5A021]/30 text-[#C5A021] transition-all ${isOptimizing ? 'animate-spin' : 'hover:bg-[#C5A021] hover:text-black shadow-xl hover:shadow-[#C5A021]/20'}`}
                            title="Consult Logic Oracle"
                        >
                            {isOptimizing ? <Loader2 size={24} /> : <Zap size={24} fill="currentColor" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Matcher Area (Now Language Generator) */}
            <div className="flex-grow flex-col bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-inner relative">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <div className="flex items-center gap-3 text-white/40">
                        <Layers size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Language Generator Output</span>
                    </div>
                    <div className="px-4 py-1 bg-[#C5A021]/10 text-[#C5A021] text-[10px] font-black uppercase rounded-full border border-[#C5A021]/20">
                        {isInfinite ? 'Infinite Set' : 'Finite Set'}
                    </div>
                </div>
                <div className="flex-grow p-12 flex flex-wrap content-start gap-4 overflow-y-auto custom-scrollbar">
                    {generatedStrings.map((str, i) => (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={i} 
                            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[#C5A021] text-3xl font-black italic tracking-tighter"
                        >
                            {str}
                        </motion.div>
                    ))}
                    {isInfinite && (
                        <div className="px-8 py-4 text-white/20 text-3xl font-black tracking-widest">
                            ...
                        </div>
                    )}
                    {generatedStrings.length === 0 && (
                        <div className="h-full w-full flex flex-col items-center justify-center opacity-10 gap-6">
                            <Box size={80} />
                            <span className="text-[11px] uppercase font-black tracking-[0.6em] text-center max-w-xs">
                                Enter Regex to <br/>Generate Language Set
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Side: Tactical Sidebar */}
        <AnimatePresence>
            {optimizerActive && (
                <motion.div 
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="w-80 h-full bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl relative"
                >
                    <div className="flex items-center gap-4 text-[#C5A021]">
                        <Sparkles size={20} />
                        <h3 className="text-sm font-black uppercase tracking-widest italic">Algebraic Agent</h3>
                    </div>
                    <div className="flex-grow flex flex-col gap-4 overflow-y-auto">
                        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C5A021] mb-2">Current Insight</div>
                            <p className="text-[11px] text-white/40 leading-relaxed">
                                The algebraic agent is monitoring your input. Click the <span className="text-[#C5A021]">Zap</span> icon in the console to trigger an automated minimization based on Kleene's algebra.
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3">
                             <div className="text-[10px] font-black uppercase tracking-widest text-[#C5A021]/40 flex items-center gap-2 underline decoration-dashed underline-offset-4">
                                <Info size={12} /> Optimization Laws
                             </div>
                             <ul className="space-y-2 text-[10px] text-white/30 font-medium">
                                <li>• Identity: r + φ = r</li>
                                <li>• Idempotence: r + r = r</li>
                                <li>• Star: (r*)* = r*</li>
                             </ul>
                        </div>
                    </div>
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 h-20 w-1 bg-[#C5A021] rounded-full blur-sm" />
                </motion.div>
            )}
        </AnimatePresence>

      </div>

      {/* Footer Ambient Info */}
      <div className="h-10 px-8 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.6em] text-white/10 italic">
          <span>Engine Status: Standard_TOC_Parser // online</span>
          <span>Regex Lab // Unit_02_Station_01</span>
      </div>
    </div>
  );
};

export default RegexPlayground;

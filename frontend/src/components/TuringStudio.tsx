import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Play, Square, FastForward, RotateCcw,
  Trash2, BookOpen, Plus, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock
} from 'lucide-react';
import AIProfessor from './AIProfessor';

interface Transition {
  id: string;
  fromState: string;
  readSymbol: string;
  writeSymbol: string;
  move: 'L' | 'R' | 'S';
  toState: string;
}

interface Library {
  name: string;
  station: string;
  desc: string;
  tape: string[];
  headStart: number;
  transitions: Transition[];
}

const TAPE_SIZE = 60;
const HEAD_START = 15;

const LIBRARIES: Record<string, Library> = {
  adder: {
    name: 'Unary Adder',
    station: '5.A',
    desc: 'Adds two unary numbers separated by "+". Input: 111+11 → Output: 11111',
    tape: [...Array(HEAD_START).fill('B'), '1','1','1','+','1','1', ...Array(TAPE_SIZE - HEAD_START - 6).fill('B')],
    headStart: HEAD_START,
    transitions: [
      { id:'a1', fromState:'q0', readSymbol:'1',  writeSymbol:'1',  move:'R', toState:'q0'   },
      { id:'a2', fromState:'q0', readSymbol:'+',  writeSymbol:'1',  move:'R', toState:'q1'   },
      { id:'a3', fromState:'q1', readSymbol:'1',  writeSymbol:'1',  move:'R', toState:'q1'   },
      { id:'a4', fromState:'q1', readSymbol:'B',  writeSymbol:'B',  move:'L', toState:'q2'   },
      { id:'a5', fromState:'q2', readSymbol:'1',  writeSymbol:'B',  move:'L', toState:'halt'  },
    ]
  },
  palindrome: {
    name: 'Palindrome Checker',
    station: '5.B',
    desc: 'Accepts if the string over {0,1} is a palindrome. Input: 0110 → ACCEPT',
    tape: [...Array(HEAD_START).fill('B'), '0','1','1','0', ...Array(TAPE_SIZE - HEAD_START - 4).fill('B')],
    headStart: HEAD_START,
    transitions: [
      { id:'p0',  fromState:'q0',         readSymbol:'B',  writeSymbol:'B',  move:'R', toState:'accept'    },
      { id:'p1',  fromState:'q0',         readSymbol:'0',  writeSymbol:'X',  move:'R', toState:'seek0'     },
      { id:'p2',  fromState:'q0',         readSymbol:'1',  writeSymbol:'X',  move:'R', toState:'seek1'     },
      { id:'p3',  fromState:'q0',         readSymbol:'X',  writeSymbol:'X',  move:'R', toState:'q0'        },
      { id:'s00', fromState:'seek0',      readSymbol:'0',  writeSymbol:'0',  move:'R', toState:'seek0'     },
      { id:'s01', fromState:'seek0',      readSymbol:'1',  writeSymbol:'1',  move:'R', toState:'seek0'     },
      { id:'s0x', fromState:'seek0',      readSymbol:'X',  writeSymbol:'X',  move:'R', toState:'seek0'     },
      { id:'s0B', fromState:'seek0',      readSymbol:'B',  writeSymbol:'B',  move:'L', toState:'check0'    },
      { id:'c00', fromState:'check0',     readSymbol:'0',  writeSymbol:'X',  move:'L', toState:'back'      },
      { id:'c0e', fromState:'check0',     readSymbol:'X',  writeSymbol:'X',  move:'L', toState:'back'      },
      { id:'c0r', fromState:'check0',     readSymbol:'1',  writeSymbol:'1',  move:'S', toState:'reject'    },
      { id:'s10', fromState:'seek1',      readSymbol:'0',  writeSymbol:'0',  move:'R', toState:'seek1'     },
      { id:'s11', fromState:'seek1',      readSymbol:'1',  writeSymbol:'1',  move:'R', toState:'seek1'     },
      { id:'s1x', fromState:'seek1',      readSymbol:'X',  writeSymbol:'X',  move:'R', toState:'seek1'     },
      { id:'s1B', fromState:'seek1',      readSymbol:'B',  writeSymbol:'B',  move:'L', toState:'check1'    },
      { id:'c11', fromState:'check1',     readSymbol:'1',  writeSymbol:'X',  move:'L', toState:'back'      },
      { id:'c1e', fromState:'check1',     readSymbol:'X',  writeSymbol:'X',  move:'L', toState:'back'      },
      { id:'c1r', fromState:'check1',     readSymbol:'0',  writeSymbol:'0',  move:'S', toState:'reject'    },
      { id:'bk0', fromState:'back',       readSymbol:'0',  writeSymbol:'0',  move:'L', toState:'back'      },
      { id:'bk1', fromState:'back',       readSymbol:'1',  writeSymbol:'1',  move:'L', toState:'back'      },
      { id:'bkX', fromState:'back',       readSymbol:'X',  writeSymbol:'X',  move:'L', toState:'back'      },
      { id:'bkB', fromState:'back',       readSymbol:'B',  writeSymbol:'B',  move:'R', toState:'q0'        },
    ]
  },
  multiplier: {
    name: 'Unary Multiplier',
    station: '5.C',
    desc: 'Multiplies two unary numbers separated by "×". Input: 11×111 → Output: 111111',
    tape: [...Array(HEAD_START).fill('B'), '1','1','×','1','1','1', ...Array(TAPE_SIZE - HEAD_START - 6).fill('B')],
    headStart: HEAD_START,
    transitions: [
      // Phase 1: Mark first 1 as A, then copy group B to result zone (after #)
      // State q0: scan first operand
      { id:'m01', fromState:'q0',   readSymbol:'1',  writeSymbol:'A',  move:'R', toState:'q1'    },
      { id:'m0x', fromState:'q0',   readSymbol:'A',  writeSymbol:'A',  move:'R', toState:'q0'    },
      { id:'m0X', fromState:'q0',   readSymbol:'×',  writeSymbol:'×',  move:'R', toState:'q5'    }, // done first operand

      // q1: march right past × to reach second operand
      { id:'m11', fromState:'q1',   readSymbol:'1',  writeSymbol:'1',  move:'R', toState:'q1'    },
      { id:'m1x', fromState:'q1',   readSymbol:'×',  writeSymbol:'×',  move:'R', toState:'q2'    },

      // q2: mark each 1 in second operand as B, write 1 in result zone
      { id:'m21', fromState:'q2',   readSymbol:'1',  writeSymbol:'B',  move:'R', toState:'q3'    },
      { id:'m2B', fromState:'q2',   readSymbol:'B',  writeSymbol:'B',  move:'R', toState:'q2'    },
      { id:'m2#', fromState:'q2',   readSymbol:'#',  writeSymbol:'#',  move:'L', toState:'q4'    }, // second done
      { id:'m2e', fromState:'q2',   readSymbol:'C',  writeSymbol:'C',  move:'R', toState:'q2'    },

      // q3: go to result zone (past #) and write C
      { id:'m31', fromState:'q3',   readSymbol:'1',  writeSymbol:'1',  move:'R', toState:'q3'    },
      { id:'m3B', fromState:'q3',   readSymbol:'B',  writeSymbol:'B',  move:'R', toState:'q3'    },
      { id:'m3C', fromState:'q3',   readSymbol:'C',  writeSymbol:'C',  move:'R', toState:'q3'    },
      { id:'m3#', fromState:'q3',   readSymbol:'#',  writeSymbol:'#',  move:'R', toState:'q3'    },
      { id:'m3e', fromState:'q3',   readSymbol:'B',  writeSymbol:'C',  move:'L', toState:'q2'    }, // write result

      // q4: unmark all B back to 1 in second operand, then go back to start
      { id:'m4B', fromState:'q4',   readSymbol:'B',  writeSymbol:'1',  move:'L', toState:'q4'    },
      { id:'m4x', fromState:'q4',   readSymbol:'×',  writeSymbol:'×',  move:'L', toState:'q4'    },
      { id:'m41', fromState:'q4',   readSymbol:'1',  writeSymbol:'1',  move:'L', toState:'q4'    },
      { id:'m4A', fromState:'q4',   readSymbol:'A',  writeSymbol:'A',  move:'R', toState:'q0'    },

      // q5: cleanup — replace all A×1 with 1s in result, blank input
      { id:'m5A', fromState:'q5',   readSymbol:'A',  writeSymbol:'B',  move:'R', toState:'q5'    },
      { id:'m5x', fromState:'q5',   readSymbol:'×',  writeSymbol:'B',  move:'R', toState:'q5'    },
      { id:'m51', fromState:'q5',   readSymbol:'1',  writeSymbol:'B',  move:'R', toState:'q5'    },
      { id:'m5#', fromState:'q5',   readSymbol:'#',  writeSymbol:'B',  move:'R', toState:'q5'    },
      { id:'m5C', fromState:'q5',   readSymbol:'C',  writeSymbol:'1',  move:'R', toState:'q5'    },
      { id:'m5e', fromState:'q5',   readSymbol:'B',  writeSymbol:'B',  move:'S', toState:'halt'  },
    ]
  }
};

const DEFAULT_TRANSITIONS: Transition[] = [
  { id:'d1', fromState:'q0', readSymbol:'0', writeSymbol:'0', move:'R', toState:'q0' },
  { id:'d2', fromState:'q0', readSymbol:'1', writeSymbol:'1', move:'R', toState:'q0' },
  { id:'d3', fromState:'q0', readSymbol:'B', writeSymbol:'B', move:'S', toState:'halt' },
];

type MachineStatus = 'idle' | 'running' | 'halted' | 'accepted' | 'rejected';

const TuringStudio: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tape, setTape] = useState<string[]>(Array(TAPE_SIZE).fill('B'));
  const [head, setHead] = useState(HEAD_START);
  const [state, setState] = useState('q0');
  const [status, setStatus] = useState<MachineStatus>('idle');
  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState(400);
  const [transitions, setTransitions] = useState<Transition[]>(DEFAULT_TRANSITIONS);
  const [idLog, setIdLog] = useState<string[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeView, setActiveView] = useState<'transitions' | 'id_log'>('transitions');
  const [tapeInput, setTapeInput] = useState('');

  const tapeRef = useRef<HTMLDivElement>(null);
  const isRunningRef = useRef(false);
  const stepRef = useRef({ tape, head, state });
  stepRef.current = { tape, head, state };

  // Auto-scroll tape to head
  useEffect(() => {
    if (tapeRef.current) {
      const cellW = 56;
      tapeRef.current.scrollLeft = head * cellW - tapeRef.current.clientWidth / 2 + cellW / 2;
    }
  }, [head]);

  // ID log auto-scroll
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [idLog]);

  const buildID = (t: string[], h: number, s: string, stepN: number) => {
    // Standard ID format: w1 q w2 where w1 is left of head, q is state, w2 is right+head
    const leftRaw = t.slice(0, h).join('');
    const rightRaw = t.slice(h).join('').replace(/B+$/, '') || 'B';
    const left = leftRaw.replace(/^B+/, '') || 'ε';
    return `Step ${stepN}: ${left} [${s}] ${rightRaw}`;
  };

  const doStep = useCallback(() => {
    const { tape: t, head: h, state: s } = stepRef.current;
    if (s === 'halt' || s === 'accept' || s === 'reject') {
      setStatus(s === 'accept' ? 'accepted' : s === 'reject' ? 'rejected' : 'halted');
      isRunningRef.current = false;
      setStep(prev => prev); // trigger re-render to kill interval
      return false;
    }
    const sym = t[h] || 'B';
    const trans = transitions.find(tr => tr.fromState === s && tr.readSymbol === sym);
    if (!trans) {
      setStatus('halted');
      isRunningRef.current = false;
      return false;
    }
    const newTape = [...t];
    // Expand tape if needed
    while (newTape.length <= h + 2) newTape.push('B');
    newTape[h] = trans.writeSymbol;
    const newHead = trans.move === 'L' ? Math.max(0, h - 1) : trans.move === 'R' ? h + 1 : h;
    const newState = trans.toState;

    setTape(newTape);
    setHead(newHead);
    setState(newState);
    setStep(prev => {
      const n = prev + 1;
      setIdLog(log => [buildID(newTape, newHead, newState, n), ...log].slice(0, 200));
      return n;
    });
    return true;
  }, [transitions]);

  // Run engine
  useEffect(() => {
    if (status !== 'running') return;
    isRunningRef.current = true;
    const interval = setInterval(() => {
      if (!isRunningRef.current) { clearInterval(interval); return; }
      const cont = doStep();
      if (!cont) clearInterval(interval);
    }, speed);
    return () => { clearInterval(interval); isRunningRef.current = false; };
  }, [status, speed, doStep]);

  const handleRun = () => {
    if (status === 'running') {
      setStatus('idle');
      isRunningRef.current = false;
    } else {
      setStatus('running');
    }
  };

  const handleStep = () => {
    if (status === 'running') return;
    setStatus('idle');
    doStep();
  };

  const handleReset = () => {
    isRunningRef.current = false;
    setStatus('idle');
    setHead(HEAD_START);
    setState('q0');
    setStep(0);
    setIdLog([]);
    setTape(Array(TAPE_SIZE).fill('B'));
  };

  const applyTapeInput = () => {
    const newTape = Array(TAPE_SIZE).fill('B');
    [...tapeInput].forEach((ch, i) => { if (HEAD_START + i < TAPE_SIZE) newTape[HEAD_START + i] = ch; });
    setTape(newTape);
    setHead(HEAD_START);
    setState('q0');
    setStep(0);
    setIdLog([]);
    setStatus('idle');
  };

  const loadLib = (key: string) => {
    const lib = LIBRARIES[key];
    isRunningRef.current = false;
    setTape([...lib.tape]);
    setHead(lib.headStart);
    setTransitions(lib.transitions.map(t => ({ ...t })));
    setState('q0');
    setStep(0);
    setStatus('idle');
    setIdLog([`// Loaded: ${lib.name}`]);
    setShowLibrary(false);
  };

  const updateTransition = (idx: number, field: keyof Transition, val: string) => {
    setTransitions(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  };

  const statusColor: Record<MachineStatus, string> = {
    idle: 'text-white/40',
    running: 'text-[#C5A021]',
    halted: 'text-white/60',
    accepted: 'text-green-400',
    rejected: 'text-red-500',
  };

  const StatusIcon = () => {
    if (status === 'accepted') return <CheckCircle size={16} className="text-green-400" />;
    if (status === 'rejected') return <XCircle size={16} className="text-red-500" />;
    if (status === 'running') return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Clock size={16} className="text-[#C5A021]" /></motion.div>;
    return null;
  };

  const activeTransIdx = transitions.findIndex(t => t.fromState === state && t.readSymbol === (tape[head] || 'B'));

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col text-white font-sans overflow-hidden relative select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#001230_0%,#000816_60%)] pointer-events-none" />

      {/* ── HEADER ── */}
      <div className="h-14 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-base font-black uppercase tracking-[0.2em] italic">
            Station 5.1 / <span className="text-[#C5A021]">Turing Studio</span>
          </h1>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <StatusIcon />
            <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor[status]}`}>
              {status === 'running' ? `Running — Step ${step}` : status === 'idle' ? `State: ${state} / Step: ${step}` : `${status.toUpperCase()} — ${step} steps`}
            </span>
          </div>
          <button
            onClick={() => setShowLibrary(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${showLibrary ? 'bg-[#C5A021] text-black border-[#C5A021]' : 'bg-white/5 text-[#C5A021] border-[#C5A021]/30 hover:bg-[#C5A021]/10'}`}
          >
            <BookOpen size={14} /> Library
          </button>
        </div>
      </div>

      {/* ── TAPE EDITOR AREA ── */}
      <div className="shrink-0 border-b border-white/5 bg-black/10 backdrop-blur-sm relative" style={{ paddingBottom: '8px' }}>
        {/* Tape input bar */}
        <div className="flex items-center gap-3 px-6 py-2 border-b border-white/5">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/20 shrink-0">Tape Pre-fill:</span>
          <input
            value={tapeInput}
            onChange={e => setTapeInput(e.target.value)}
            placeholder="e.g. 111+11 or 0110..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#C5A021]/50 transition-all placeholder:text-white/10 max-w-sm"
          />
          <button onClick={applyTapeInput} className="px-5 py-1.5 bg-[#C5A021] text-black rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all">
            Load Tape
          </button>
        </div>

        {/* Read/Write Head Visualizer */}
        <div className="relative pt-10 pb-1">
          {/* Head arrow + label */}
          <div
            className="absolute top-0 flex flex-col items-center pointer-events-none z-20 transition-all duration-200"
            style={{
              left: `${head * 56 + 24 - tapeRef.current?.scrollLeft || 0}px`,
              width: 56
            }}
          >
            <span className="text-[8px] font-black uppercase tracking-widest text-[#C5A021]">R/W HEAD</span>
            <div className="w-px h-3 bg-[#C5A021] shadow-[0_0_8px_#C5A021]" />
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#C5A021]" />
          </div>

          {/* Tape cells */}
          <div
            ref={tapeRef}
            className="overflow-x-scroll flex items-center gap-1 px-6 py-4 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {tape.map((sym, idx) => (
              <motion.div
                key={idx}
                animate={{
                  borderColor: head === idx ? '#C5A021' : head === idx - 1 || head === idx + 1 ? 'rgba(197,160,33,0.15)' : 'rgba(255,255,255,0.04)',
                  backgroundColor: head === idx ? 'rgba(197,160,33,0.15)' : 'rgba(255,255,255,0.01)',
                  scale: head === idx ? 1.05 : 1,
                  boxShadow: head === idx ? '0 0 20px rgba(197,160,33,0.1)' : 'none'
                }}
                transition={{ duration: 0.15 }}
                className="w-14 h-14 shrink-0 border-2 rounded-xl flex items-center justify-center relative"
              >
                <input
                  value={sym === 'B' ? '□' : sym}
                  onChange={e => {
                    const v = e.target.value.replace('□', 'B') || 'B';
                    const nt = [...tape]; nt[idx] = v.charAt(v.length - 1) || 'B';
                    setTape(nt);
                  }}
                  className="w-full bg-transparent text-center text-xl font-black focus:outline-none text-white"
                  title={`Cell ${idx}`}
                />
                {/* Cell index (only every 5) */}
                {idx % 5 === 0 && (
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-white/15 font-mono">{idx}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex gap-0 overflow-hidden z-10">

        {/* LEFT: Transition Table + ID Log */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
          {/* View switcher */}
          <div className="flex border-b border-white/5 bg-black/20">
            {(['transitions', 'id_log'] as const).map(v => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeView === v ? 'border-[#C5A021] text-[#C5A021]' : 'border-transparent text-white/30 hover:text-white/60'}`}
              >
                {v === 'transitions' ? 'Transition Function δ' : 'ID Trace / Code View'}
              </button>
            ))}
          </div>

          {activeView === 'transitions' && (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_80px_80px_90px_1fr_40px] gap-3 mb-3 px-4">
                {['State (q)', 'Read (σ)', 'Write (σ\')', 'Move', 'Next State (q\')', ''].map(h => (
                  <div key={h} className="text-[9px] font-black uppercase tracking-widest text-white/25">{h}</div>
                ))}
              </div>

              <div className="space-y-2">
                {transitions.map((t, idx) => {
                  const isActive = idx === activeTransIdx;
                  return (
                    <motion.div
                      key={t.id}
                      animate={{ backgroundColor: isActive ? 'rgba(197,160,33,0.08)' : 'rgba(255,255,255,0.02)' }}
                      className={`grid grid-cols-[1fr_80px_80px_90px_1fr_40px] gap-3 items-center px-4 py-3 rounded-2xl border transition-colors ${isActive ? 'border-[#C5A021]/40' : 'border-white/5 hover:border-white/10'}`}
                    >
                      <input value={t.fromState} onChange={e => updateTransition(idx, 'fromState', e.target.value)}
                        className="bg-transparent font-bold font-mono text-sm focus:outline-none text-white/80" />
                      <input value={t.readSymbol} onChange={e => updateTransition(idx, 'readSymbol', e.target.value)}
                        className="bg-transparent font-bold font-mono text-sm text-[#C5A021] focus:outline-none" />
                      <input value={t.writeSymbol} onChange={e => updateTransition(idx, 'writeSymbol', e.target.value)}
                        className="bg-transparent font-bold font-mono text-sm text-[#C5A021] focus:outline-none" />
                      <select value={t.move} onChange={e => updateTransition(idx, 'move', e.target.value as 'L'|'R'|'S')}
                        className="bg-[#000816] border border-white/10 rounded-lg px-2 py-1 text-[11px] font-black uppercase focus:outline-none cursor-pointer text-white/70">
                        <option value="L">← LEFT</option>
                        <option value="R">RIGHT →</option>
                        <option value="S">STAY</option>
                      </select>
                      <input value={t.toState} onChange={e => updateTransition(idx, 'toState', e.target.value)}
                        className="bg-transparent font-bold font-mono text-sm focus:outline-none text-[#C5A021]/80" />
                      <button onClick={() => setTransitions(prev => prev.filter(tr => tr.id !== t.id))}
                        className="text-white/10 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={() => setTransitions(prev => [...prev, { id: Date.now().toString(), fromState: 'q0', readSymbol: '0', writeSymbol: '0', move: 'R', toState: 'q0' }])}
                className="mt-4 w-full py-3 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/20 hover:border-[#C5A021]/30 hover:text-[#C5A021]/50 transition-all flex items-center justify-center gap-3"
              >
                <Plus size={14} /> Add Transition
              </button>
            </div>
          )}

          {activeView === 'id_log' && (
            <div ref={logRef} className="flex-1 overflow-y-auto p-6 font-mono">
              <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-4">
                Format: Left [State] Right — Standard Instantaneous Description
              </div>
              {idLog.length === 0 && (
                <div className="text-white/10 text-center text-sm italic mt-20">Awaiting computation...</div>
              )}
              {idLog.map((line, i) => (
                <div key={i} className={`text-xs py-1.5 border-l-2 pl-4 mb-1 transition-colors ${i === 0 ? 'border-[#C5A021] text-[#C5A021]' : 'border-white/5 text-white/30 hover:text-white/50'}`}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Controls (compact) */}
        <div className="w-64 shrink-0 flex flex-col gap-4 p-5 bg-black/20">
          {/* Run controls */}
          <div className="space-y-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Machine Control</div>
            <button
              onClick={handleRun}
              className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 ${status === 'running' ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-[#C5A021] text-black shadow-lg'}`}
            >
              {status === 'running' ? <><Square size={14} fill="currentColor" /> HALT</> : <><Play size={14} fill="currentColor" /> RUN</>}
            </button>
            <div className="flex gap-2">
              <button onClick={handleStep} disabled={status === 'running'}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-[#C5A021]/10 hover:text-[#C5A021] transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                <FastForward size={14} /> Step
              </button>
              <button onClick={handleReset}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:border-red-500/30 hover:text-red-500 transition-all flex items-center justify-center gap-2">
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>

          {/* Speed */}
          <div className="space-y-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/20">Clock Speed</div>
            <input type="range" min="50" max="1000" step="50" value={speed}
              onChange={e => setSpeed(parseInt(e.target.value))}
              className="w-full accent-[#C5A021]" />
            <div className="flex justify-between text-[8px] font-black uppercase text-white/20">
              <span>50ms</span>
              <span className="text-[#C5A021]">{speed}ms</span>
              <span>1s</span>
            </div>
          </div>

          {/* Machine info */}
          <div className="flex-1 border border-[#C5A021]/15 rounded-2xl p-5 bg-[#C5A021]/3 space-y-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-[#C5A021]/60">Machine Properties</div>
            <div className="space-y-2 text-[10px] text-white/40 font-mono">
              <div>States: <span className="text-white/70">{new Set(transitions.flatMap(t => [t.fromState, t.toState])).size}</span></div>
              <div>Transitions: <span className="text-white/70">{transitions.length}</span></div>
              <div>Tape Used: <span className="text-white/70">{tape.filter(c => c !== 'B').length} cells</span></div>
              <div>Head at: <span className="text-white/70">cell {head}</span></div>
            </div>
            <div className="pt-3 border-t border-white/5 space-y-1.5">
              {['halt', 'accept', 'reject'].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5A021]/60" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{s} = terminal state</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Library overlay */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 z-[100] w-96 bg-black/90 backdrop-blur-3xl border border-[#C5A021]/20 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black text-[#C5A021] uppercase tracking-[0.4em]">Algorithm Repository</h3>
              <button onClick={() => setShowLibrary(false)} className="text-white/30 hover:text-white transition-colors">
                <XCircle size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(LIBRARIES).map(([key, lib]) => (
                <button key={key} onClick={() => loadLib(key)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#C5A021]/10 hover:border-[#C5A021]/40 transition-all text-left group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-black uppercase text-[#C5A021] tracking-widest">Station {lib.station}</span>
                    <span className="text-[9px] text-white/20 font-mono">{lib.transitions.length} transitions</span>
                  </div>
                  <div className="text-sm font-black uppercase tracking-tight group-hover:translate-x-1 transition-transform">{lib.name}</div>
                  <p className="text-[9px] font-medium text-white/30 mt-1 leading-relaxed">{lib.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-8 shrink-0 px-6 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.5em] text-white/10 italic z-50">
        <span>Tape: Semi-Infinite // Deterministic TM</span>
        <span>Turing Studio // Unit 05</span>
      </div>

      {/* AI Professor Integration */}
      <AIProfessor context="Turing Machine Simulator" />
    </div>
  );
};

export default TuringStudio;

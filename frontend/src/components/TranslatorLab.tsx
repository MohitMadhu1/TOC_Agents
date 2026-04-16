import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share2, Zap, ArrowRight, Layers, Trash2, RotateCcw, Box, GitBranch, Terminal, Loader2, AlertCircle } from 'lucide-react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { AIService } from '../utils/aiService';
// edgehandles/dagre are registered globally in main.tsx

const TranslatorLab: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [mode, setMode] = useState<'re2nfa' | 'dfa2re'>('re2nfa');
  const [regex, setRegex] = useState('a+b*');
  const [nfaElements, setNfaElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [dfaElements, setDfaElements] = useState<cytoscape.ElementDefinition[]>([
    { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false }, position: { x: 200, y: 200 } }
  ]);
  const [resultRegex, setResultRegex] = useState('');
  const [cyKey, setCyKey] = useState(0);
  const [selectedDfaId, setSelectedDfaId] = useState<string | null>(null);
  const [dfaMenu, setDfaMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [oracleInput, setOracleInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDfaBlueprints, setShowDfaBlueprints] = useState(false);
  
  const cyRef = useRef<cytoscape.Core | null>(null);
  const cyDfaRef = useRef<cytoscape.Core | null>(null);
  const ehDfaRef = useRef<any>(null);

  const style: any[] = [
    {
      selector: 'node',
      style: {
        'background-color': '#000816',
        'border-width': 2,
        'border-color': '#C5A021',
        'width': 40,
        'height': 40,
        'label': 'data(label)',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-family': 'Outfit, sans-serif',
        'font-weight': 800,
        'font-size': 11,
        'overlay-opacity': 0,
      }
    },
    {
        selector: 'node[?isInitial]',
        style: { 'border-width': 4, 'border-color': '#C5A021' }
    },
    {
        selector: 'node[?isFinal]',
        style: { 'border-style': 'double', 'border-width': 6 }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#C5A021',
        'target-arrow-color': '#C5A021',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'color': '#fff',
        'font-size': 10,
        'text-background-opacity': 1,
        'text-background-color': '#000816',
        'text-background-padding': '2px',
        'edge-distances': 'node-position',
      }
    }
  ];

  // Professional Thompson Construction Engine
  const rebuildNFA = () => {
    setCyKey(prev => prev + 1);
    setNfaElements([]); // Mandatory Flush
    
    let nodeId = 0;
    const runId = Date.now();
    const nextId = () => {
        const base = `q${nodeId++}`;
        return { id: `${base}_${runId}`, label: base };
    };

    const construct = (expr: string): { nodes: any[], edges: any[], start: string, end: string } => {
        let s = expr.trim();
        if (s.startsWith('(') && s.endsWith(')')) {
            let level = 1, balanced = true;
            for (let i = 1; i < s.length - 1; i++) {
                if (s[i] === '(') level++; if (s[i] === ')') level--;
                if (level === 0) { balanced = false; break; }
            }
            if (balanced) return construct(s.slice(1, -1));
        }

        // 1. Union (+) - Lowest Precedence
        let level = 0;
        for (let i = s.length - 1; i >= 0; i--) {
            if (s[i] === ')') level++; if (s[i] === '(') level--;
            if (s[i] === '+' && level === 0) {
                const left = construct(s.substring(0, i));
                const right = construct(s.substring(i + 1));
                const s0 = nextId(), e0 = nextId();
                return {
                    nodes: [{ data: { id: s0.id, label: s0.label } }, { data: { id: e0.id, label: e0.label } }, ...left.nodes, ...right.nodes],
                    edges: [
                        { data: { source: s0.id, target: left.start, label: 'ε' } },
                        { data: { source: s0.id, target: right.start, label: 'ε' } },
                        { data: { source: left.end, target: e0.id, label: 'ε' } },
                        { data: { source: right.end, target: e0.id, label: 'ε' } },
                        ...left.edges, ...right.edges
                    ],
                    start: s0.id, end: e0.id
                };
            }
        }

        // 2. Concatenation
        level = 0;
        for (let i = 0; i < s.length - 1; i++) {
            if (s[i] === '(') level++; if (s[i] === ')') level--;
            if (level === 0) {
                let nextIsStar = s[i+1] === '*';
                let splitIdx = nextIsStar ? i + 2 : i + 1;
                if (splitIdx < s.length && s[splitIdx] !== '+') {
                    const left = construct(s.substring(0, splitIdx));
                    const right = construct(s.substring(splitIdx));
                    return {
                        nodes: [...left.nodes, ...right.nodes],
                        edges: [
                            ...left.edges, ...right.edges,
                            { data: { source: left.end, target: right.start, label: 'ε' } }
                        ],
                        start: left.start, end: right.end
                    };
                }
            }
        }

        // 3. Star (*)
        if (s.endsWith('*')) {
            const base = construct(s.slice(0, -1));
            const s0 = nextId(), e0 = nextId();
            return {
                nodes: [{ data: { id: s0.id, label: s0.label } }, { data: { id: e0.id, label: e0.label } }, ...base.nodes],
                edges: [
                    { data: { source: s0.id, target: base.start, label: 'ε' } },
                    { data: { source: base.end, target: e0.id, label: 'ε' } },
                    { data: { source: base.end, target: base.start, label: 'ε' } },
                    { data: { source: s0.id, target: e0.id, label: 'ε' } },
                    ...base.edges
                ],
                start: s0.id, end: e0.id
            };
        }

        // 4. Atomic
        const s0 = nextId(), e0 = nextId();
        return {
            nodes: [{ data: { id: s0.id, label: s0.label } }, { data: { id: e0.id, label: e0.label } }],
            edges: [{ data: { source: s0.id, target: e0.id, label: s } }],
            start: s0.id, end: e0.id
        };
    };

    try {
        const result = construct(regex.trim());
        const elements = [
            ...result.nodes.map(n => ({
                data: { ...n.data, isInitial: n.data.id === result.start, isFinal: n.data.id === result.end }
            })),
            ...result.edges.map((e, i) => ({ data: { ...e.data, id: `e${i}` } }))
        ];
        setNfaElements(elements);
        setTimeout(() => {
            cyRef.current?.layout({ name: 'dagre', rankDir: 'LR', nodeSep: 50, edgeSep: 50 }).run();
        }, 200);
    } catch (e) { console.error(e); }
  };

  const solveArden = () => {
    try {
        const nodes = dfaElements.filter(e => !e.data.source);
        const edges = dfaElements.filter(e => e.data.source);
        if (nodes.length === 0) return;

        const startId = nodes.find(n => n.data.isInitial)?.data.id || nodes[0].data.id;
        const finalIds = new Set(nodes.filter(n => n.data.isFinal).map(n => n.data.id));
        if (finalIds.size === 0) { setResultRegex('∅'); return; }

        // ── helpers ───────────────────────────────────────────────────────────
        const needsWrap = (r: string) => r.length > 1 && !r.startsWith('(');
        const alt  = (a: string, b: string): string => !a ? b : !b ? a : `(${a}+${b})`;
        const cat  = (a: string, b: string): string => {
            if (!a || !b) return '';
            return `${needsWrap(a) ? `(${a})` : a}${needsWrap(b) ? `(${b})` : b}`;
        };
        const star = (r: string): string => !r ? '' : r.length === 1 ? `${r}*` : `(${r})*`;

        // Normalize "a, b" → "(a+b)" for multi-symbol edge labels
        const toRE = (label: string): string => {
            const syms = label.split(',').map(s => s.trim()).filter(Boolean);
            return syms.length === 1 ? syms[0] : `(${syms.join('+')})`;
        };

        // ── build transition matrix R[i][j] ───────────────────────────────────
        let remaining = nodes.map(n => n.data.id);
        const R: Record<string, Record<string, string>> = {};
        remaining.forEach(i => { R[i] = {}; remaining.forEach(j => { R[i][j] = ''; }); });
        edges.forEach(e => {
            const { source: s, target: t, label } = e.data;
            if (R[s] && t in R[s]) R[s][t] = alt(R[s][t], toRE(label));
        });

        // ── eliminate ONLY intermediate states (not start, not finals) ────────
        // We must keep finals alive so R[start][final] is readable at the end
        const toElim = remaining.filter(id => id !== startId && !finalIds.has(id));

        for (const k of toElim) {
            const selfLoop = star(R[k]?.[k] || '');
            const preds = remaining.filter(i => i !== k && R[i]?.[k]);
            const succs = remaining.filter(j => j !== k && R[k]?.[j]);
            for (const i of preds) {
                for (const j of succs) {
                    const bypass = cat(cat(R[i][k], selfLoop), R[k][j]);
                    R[i][j] = alt(R[i][j], bypass);
                }
            }
            remaining = remaining.filter(id => id !== k);
            remaining.forEach(i => { if (R[i]) delete R[i][k]; });
            delete R[k];
        }

        // ── collect RE: start → each final ────────────────────────────────────
        const startStar = star(R[startId]?.[startId] || '');
        const parts: string[] = [];

        for (const f of finalIds) {
            if (f === startId) {
                // start itself is accepting
                parts.push(startStar || 'ε');
            } else {
                const path = R[startId]?.[f] || '';
                if (path) parts.push(cat(startStar, path));
                else if (!path && startStar) parts.push(startStar); // only reachable via self-loop edge case
            }
        }

        setResultRegex(parts.length ? parts.join('+') : 'ε');
    } catch (err) {
        console.error('Arden solve error:', err);
        setResultRegex('Analysis Error');
    }
  };



  const addDfaState = (pos?: { x: number, y: number }) => {
    setDfaElements(prev => {
      const nodes = prev.filter(e => !e.data.source);
      const maxNum = nodes.reduce((max, n) => Math.max(max, parseInt(n.data.id?.replace('q','') || '0')), -1);
      const id = `q${maxNum + 1}`;
      return [...prev, { data: { id, label: id.toUpperCase(), isInitial: false, isFinal: false, width: 50, height: 50 }, position: pos || { x: 300, y: 300 } }];
    });
  };

  const addDfaTransition = (source: string, target: string, symbol: string) => {
    if (!symbol) return;
    setDfaElements(prev => {
      const existing = prev.find(e => e.data.source === source && e.data.target === target);
      if (existing) {
        const labels = new Set([...existing.data.label.split(',').map((s: string) => s.trim()), symbol.trim()]);
        return prev.map(e => e.data.id === existing.data.id ? { ...e, data: { ...e.data, label: Array.from(labels).sort().join(', ') } } : e);
      }
      return [...prev, { data: { id: `e-${source}-${target}-${Date.now()}`, source, target, label: symbol.trim() } }];
    });
  };

  const toggleDfaFinal = (id: string) => {
    setDfaElements(prev => prev.map(el => el.data.id === id ? { ...el, data: { ...el.data, isFinal: !el.data.isFinal } } : el));
    setDfaMenu(null);
  };

  const toggleDfaInitial = (id: string) => {
    setDfaElements(prev => prev.map(el => el.data.source ? el : { ...el, data: { ...el.data, isInitial: el.data.id === id } }));
    setDfaMenu(null);
  };

  const deleteDfaItem = (id: string) => {
    setDfaElements(prev => prev.filter(e => e.data.id !== id && e.data.source !== id && e.data.target !== id));
    setSelectedDfaId(null);
    setDfaMenu(null);
  };

  const loadDfaExample = (type: 'ends-01' | 'parity') => {
    const examples: Record<string, cytoscape.ElementDefinition[]> = {
      'ends-01': [
        { data: { id: 'q0', label: 'Q0', isInitial: true,  isFinal: false, width: 50, height: 50 }, position: { x: 150, y: 300 } },
        { data: { id: 'q1', label: 'Q1', isInitial: false, isFinal: false, width: 50, height: 50 }, position: { x: 350, y: 300 } },
        { data: { id: 'q2', label: 'Q2', isInitial: false, isFinal: true,  width: 50, height: 50 }, position: { x: 550, y: 300 } },
        { data: { id: 'e1', source: 'q0', target: 'q0', label: '0, 1' } },
        { data: { id: 'e2', source: 'q0', target: 'q1', label: '0' } },
        { data: { id: 'e3', source: 'q1', target: 'q2', label: '1' } },
      ],
      'parity': [
        { data: { id: 'q0', label: 'EVEN', isInitial: true,  isFinal: true,  width: 50, height: 50 }, position: { x: 200, y: 300 } },
        { data: { id: 'q1', label: 'ODD',  isInitial: false, isFinal: false, width: 50, height: 50 }, position: { x: 500, y: 300 } },
        { data: { id: 'e1', source: 'q0', target: 'q1', label: '1' } },
        { data: { id: 'e2', source: 'q1', target: 'q0', label: '1' } },
        { data: { id: 'e3', source: 'q0', target: 'q0', label: '0' } },
        { data: { id: 'e4', source: 'q1', target: 'q1', label: '0' } },
      ],
    };
    // Full reset before loading new blueprint
    setSelectedDfaId(null);
    setDfaMenu(null);
    setResultRegex('');
    setDfaElements([]);          // clear first so Cytoscape unmounts old nodes
    setShowDfaBlueprints(false);
    setTimeout(() => {
      setDfaElements(examples[type]);
      setTimeout(() => cyDfaRef.current?.fit(), 150);
    }, 50);
  };

  const handleOracleInquiry = async () => {
    if (!oracleInput.trim() || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const ai = new AIService();
      const result = await ai.generateMachine(oracleInput, 'dfa');
      
      const newNodes = result.nodes.map(n => ({
        data: { id: n.id, label: n.label, isInitial: n.isInitial, isFinal: n.isFinal, width: 50, height: 50 },
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 }
      }));

      const newEdges = result.edges.map((e, idx) => ({
        data: { id: `edge-${idx}-${Date.now()}`, source: e.source, target: e.target, label: e.label }
      }));

      setDfaElements([...newNodes, ...newEdges]);
      setOracleInput('');
      
      setTimeout(() => {
        if (cyDfaRef.current) {
          cyDfaRef.current.layout({ name: 'cose', animate: true }).run();
        }
      }, 200);

    } catch (error: any) {
      console.error("Oracle Error:", error);
      setErrorMessage(error.message || "Oracle failed to synthesize the machine.");
    } finally {
      setIsGenerating(false);
    }
  };

  const onDfaCyReady = (cy: cytoscape.Core) => {
    cyDfaRef.current = cy;
    cy.minZoom(0.1); cy.maxZoom(4);
    if (ehDfaRef.current) ehDfaRef.current.destroy();
    ehDfaRef.current = (cy as any).edgehandles({ canConnect: () => true, hoverDelay: 50, snap: true, handleOutside: true });
    cy.off('ehcomplete');
    cy.on('ehcomplete', (_evt: any, sourceNode: any, targetNode: any, addedEdge: any) => {
      addedEdge.remove();
      const s = prompt('Assign Transition Symbol:');
      if (s) addDfaTransition(sourceNode.id(), targetNode.id(), s);
    });
    cy.off('dblclick');
    cy.on('dblclick', (evt: any) => { if (evt.target === cy) addDfaState(evt.position); });
    cy.off('cxttap');
    cy.on('cxttap', 'node', (evt: any) => {
      setSelectedDfaId(evt.target.id());
      setDfaMenu({ x: evt.renderedPosition.x, y: evt.renderedPosition.y, id: evt.target.id() });
    });
    cy.off('tap');
    cy.on('tap', 'node', (evt: any) => { setSelectedDfaId(evt.target.id()); setDfaMenu(null); });
    cy.on('tap', 'edge', (evt: any) => { setSelectedDfaId(evt.target.id()); setDfaMenu(null); });
    cy.on('tap', (evt: any) => { if (evt.target === cy) { setDfaMenu(null); setSelectedDfaId(null); } });
  };

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col text-white font-sans overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#001a33_0%,#000816_100%)] opacity-40 pointer-events-none" />
      
      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl font-black uppercase text-[10px] tracking-widest cursor-pointer" onClick={() => setErrorMessage(null)}>
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
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Station 2.2 / <span className="text-[#C5A021]">RE-FA Translator</span></h1>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Babel-Fish Engine</div>
          </div>
        </div>
        <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
            <button 
                onClick={() => setMode('re2nfa')}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 're2nfa' ? 'bg-[#C5A021] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
                RE &rarr; NFA
            </button>
            <button 
                onClick={() => setMode('dfa2re')}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'dfa2re' ? 'bg-[#C5A021] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
                FA &rarr; RE
            </button>
        </div>
      </div>

      <div className="flex-grow flex p-8 gap-8 overflow-hidden relative">
        {mode === 're2nfa' ? (
            <div className="flex w-full gap-8">
                {/* Left: Input */}
                <div className="w-1/3 flex flex-col gap-6">
                    <div className="bg-black/40 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group h-fit">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Box size={80} />
                        </div>
                        <div className="flex items-center gap-4 mb-8 text-[#C5A021]/40">
                            <GitBranch size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Regex Source</span>
                        </div>
                        <input 
                            value={regex}
                            onChange={(e) => setRegex(e.target.value)}
                            className="w-full bg-transparent text-5xl font-black italic tracking-tighter text-white focus:outline-none mb-4"
                            placeholder="e.g. a+b*"
                        />
                        <button 
                            onClick={rebuildNFA}
                            className="w-full py-5 bg-[#C5A021] text-black font-black uppercase text-[10px] tracking-[0.6em] rounded-2xl hover:scale-[1.02] transition-all shadow-[0_20px_40px_rgba(0,229,255,0.2)] flex items-center justify-center gap-3"
                        >
                            Translate Machine <Zap size={14} />
                        </button>
                    </div>

                    <div className="flex-grow bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
                        <h3 className="text-[10px] font-black text-[#C5A021]/40 uppercase tracking-[0.5em] mb-6">Translation Modules</h3>
                        <div className="space-y-4">
                            {['Union (a+b)', 'Concat (ab)', 'Kleene (*)'].map(item => (
                                <div key={item} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-[#C5A021]/30 transition-all cursor-crosshair">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">{item}</span>
                                    <Share2 size={12} className="text-[#C5A021]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Visualization */}
                <div className="flex-grow bg-[#000816] border border-white/10 rounded-[3rem] relative overflow-hidden group shadow-inner">
                    <div className="absolute inset-0 z-0 opacity-[0.03]" 
                         style={{ backgroundImage: 'linear-gradient(#C5A021 1px, transparent 1px), linear-gradient(90deg, #C5A021 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
                        <div className="px-5 py-1.5 bg-[#C5A021]/10 border border-[#C5A021]/30 rounded-full text-[#C5A021] text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md">
                            NFA Synthesis Output
                        </div>
                    </div>
                    <CytoscapeComponent
                        key={cyKey}
                        elements={nfaElements}
                        cy={cy => cyRef.current = cy}
                        style={{ width: '100%', height: '100%', background: 'transparent' }}
                        stylesheet={style}
                        userZoomingEnabled={true}
                    />
                </div>
            </div>
        ) : (
            // DFA to RE Mode — ConversionLab-mirrored layout
            <div className="flex-grow flex flex-col border-t border-white/5 overflow-hidden">
                {/* Logic Oracle Bar (top) — NLP text input like ConversionLab */}
                <div className="w-full px-12 py-6 bg-black/20 border-b border-white/5">
                    <div className="max-w-4xl mx-auto relative flex bg-white/5 p-2 rounded-3xl border border-white/10 focus-within:border-[#C5A021]/50 transition-all">
                        <div className="flex items-center gap-3 px-4 text-[#C5A021]/40"><Terminal size={20} /><span className="text-[10px] uppercase font-black tracking-widest">Logic Oracle :</span></div>
                        <input 
                            value={oracleInput} 
                            onChange={e => setOracleInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleOracleInquiry()}
                            placeholder={isGenerating ? "CONSULTING ORACLE..." : "Type natural language rules (e.g. 'Accepts strings ending in 01')..."} 
                            disabled={isGenerating}
                            className="flex-grow bg-transparent p-4 text-sm font-medium focus:outline-none placeholder:text-white/10" 
                        />
                        <button 
                            onClick={handleOracleInquiry} 
                            disabled={isGenerating}
                            className="px-10 bg-[#C5A021] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
                        >
                            {isGenerating && <Loader2 size={14} className="animate-spin" />}
                            {isGenerating ? "Processing" : "Process"}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showDfaBlueprints && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-40 right-8 z-[100] w-64 bg-black/80 backdrop-blur-3xl border border-[#C5A021]/20 rounded-2xl p-4 shadow-2xl">
                            <h3 className="text-[10px] font-black text-[#C5A021] uppercase tracking-[0.4em] mb-3">Select Source DFA</h3>
                            <div className="space-y-2">
                                <button onClick={() => loadDfaExample('ends-01')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all"><div className="text-[10px] font-black uppercase tracking-widest">Ends with '01'</div></button>
                                <button onClick={() => loadDfaExample('parity')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all"><div className="text-[10px] font-black uppercase tracking-widest">Even # of 1s</div></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main split area */}
                <div className="flex-grow flex gap-px bg-white/5">
                    {/* LEFT: Source DFA (same as ConversionLab NFA side) */}
                    <div className="w-1/2 h-full bg-[#000816] relative overflow-hidden">
                        <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
                            <div className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A021]">Source DFA</span></div>
                            <button onClick={() => setShowDfaBlueprints(p => !p)} className={`px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showDfaBlueprints ? 'bg-[#C5A021] text-black border-[#C5A021]' : 'bg-white/5 text-[#C5A021] border-[#C5A021]/30 hover:bg-[#C5A021]/10'}`}>Blueprints</button>
                            <button onClick={() => cyDfaRef.current?.layout({ name: 'cose', animate: true, padding: 50 }).run()} className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#C5A021]/10 transition-all">Restore Balance</button>
                        </div>
                        <CytoscapeComponent elements={dfaElements} stylesheet={style} style={{ width: '100%', height: '100%' }} cy={onDfaCyReady} />
                        <AnimatePresence>
                            {selectedDfaId && !dfaElements.find(e => e.data.id === selectedDfaId)?.data.source && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute bottom-8 left-8 right-8 z-40 bg-black/60 backdrop-blur-3xl border border-[#C5A021]/20 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-[#C5A021]/10 border border-[#C5A021]/20 rounded-2xl">
                                            <span className="text-[8px] font-black text-[#C5A021] uppercase tracking-widest block mb-1">Inspecting</span>
                                            <input value={dfaElements.find(e => e.data.id === selectedDfaId)?.data.label || ''} onChange={e => setDfaElements(prev => prev.map(el => el.data.id === selectedDfaId ? { ...el, data: { ...el.data, label: e.target.value } } : el))} className="bg-transparent text-lg font-black focus:outline-none w-32 border-b border-[#C5A021]/30 text-white" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => ehDfaRef.current?.start(cyDfaRef.current?.getElementById(selectedDfaId))} className="px-6 py-4 bg-[#C5A021] text-black rounded-2xl font-black uppercase text-[9px] tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"><ArrowRight size={14} /> New Branching</button>
                                            <button onClick={() => { const s = prompt('Symbol:'); if(s) addDfaTransition(selectedDfaId, selectedDfaId, s); }} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"><RotateCcw size={14} /> Add Loop</button>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteDfaItem(selectedDfaId)} className="p-4 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={20} /></button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {dfaMenu && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ top: dfaMenu.y, left: dfaMenu.x }} className="absolute z-[100] w-52 bg-black/80 backdrop-blur-3xl border border-[#C5A021]/20 rounded-2xl p-2 shadow-2xl flex flex-col gap-1">
                                    <button onClick={() => toggleDfaFinal(dfaMenu.id)} className="flex items-center gap-3 w-full p-3 hover:bg-[#C5A021]/10 rounded-xl transition-all font-mono uppercase text-[9px] font-black"><Zap size={14} /> Toggle Final</button>
                                    <button onClick={() => toggleDfaInitial(dfaMenu.id)} className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-xl transition-all font-mono uppercase text-[9px] font-black"><ArrowRight size={14} /> Set Initial</button>
                                    <div className="h-px bg-white/5 my-1" />
                                    <button onClick={() => deleteDfaItem(dfaMenu.id)} className="flex items-center gap-3 w-full p-3 hover:bg-red-500/10 rounded-xl transition-all font-mono uppercase text-[9px] font-black text-red-500"><Trash2 size={14} /> Delete State</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="absolute bottom-6 left-6 text-[9px] text-white/30 uppercase font-black tracking-widest italic flex items-center gap-3 z-10"><Terminal size={12} /> Double-click canvas to spawn states</div>
                    </div>

                    {/* RIGHT: Derived RE Expression */}
                    <div className="w-1/2 h-full bg-[#000816] relative border-l border-white/10 flex flex-col items-center justify-center gap-10 p-16">
                        <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A021]">Derived Expression</span>
                        </div>
                        <div className="text-center space-y-6 w-full">
                            <div className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">Arden's Theorem Result</div>
                            <div className="text-7xl font-black italic tracking-tighter leading-none text-white min-h-[90px] flex items-center justify-center">{resultRegex || '---'}</div>
                        </div>
                        <button onClick={solveArden} className="px-16 py-5 bg-[#C5A021] text-black font-black uppercase text-[10px] tracking-[0.5em] rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,229,255,0.25)] flex items-center gap-3">Derive RE <Zap size={14} /></button>
                        <div className="w-full border-t border-white/5 pt-6 space-y-3 max-w-xs">
                            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Method</div>
                            <div className="text-[9px] font-mono text-white/20 leading-loose">R = Q + R·P  ⟹  R = Q·P*<br />State elimination reduces the machine to a single RE.</div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="h-10 px-8 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.6em] text-white/10 italic">
          <span>Translation Protocol: Thompson / Arden // Ready</span>
          <span>Translator Lab // Unit_02_Station_02</span>
      </div>
    </div>
  );
};

export default TranslatorLab;

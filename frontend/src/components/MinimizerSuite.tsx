import React, { useState, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import { RotateCcw, Share2, Zap, Trash2, ShieldCheck, Target, ArrowUpRight, RefreshCcw, Settings2, AlertCircle, LayoutGrid, BookOpen, Play, Pause, CheckCircle2, XCircle, ChevronRight, Terminal, Grid3X3, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIService } from '../utils/aiService';

// Plugin registered globally in main.tsx

const MinimizerSuite: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [dfaElements, setDfaElements] = useState<cytoscape.ElementDefinition[]>([
    { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false, width: 50, height: 50 }, position: { x: 100, y: 300 } }
  ]);
  const [minElements, setMinElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [table, setTable] = useState<{ [key: string]: boolean }>({}); // Mapping "p,q" -> isDistinguishable
  const [activeTab, setActiveTab] = useState<'editor' | 'table'>('editor');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number, y: number, id: string, type: 'node' | 'edge' } | null>(null);
  const [oracleInput, setOracleInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBlueprints, setShowBlueprints] = useState(false);

  const dfaCyRef = useRef<cytoscape.Core | null>(null);
  const minCyRef = useRef<cytoscape.Core | null>(null);
  const ehRef = useRef<any>(null);

  const stylesheet: any[] = [
    {
      selector: 'node',
      style: {
        'background-color': '#001540',
        'border-width': 2,
        'border-color': '#C5A021',
        'label': 'data(label)',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': 40,
        'width': 50,
        'height': 50,
        'font-family': 'Outfit, sans-serif',
        'font-weight': 800,
        'font-size': 11,
        'overlay-opacity': 0,
      }
    },
    {
      selector: 'node[?isFinal]',
      style: { 'border-width': 4, 'border-style': 'double', 'border-color': '#C5A021' }
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
        'color': '#C5A021',
        'font-size': 12,
        'font-weight': 900,
        'text-background-opacity': 1,
        'text-background-color': '#000816',
        'text-background-padding': 2,
        'text-margin-y': -8,
        'text-rotation': 'autorotate'
      }
    },
    {
      selector: '.eh-handle',
      style: { 'background-color': '#C5A021', 'width': 18, 'height': 18, 'shape': 'ellipse', 'border-width': 2, 'border-color': '#fff', 'z-index': 1000 }
    }
  ];

  const addState = (pos?: { x: number, y: number }) => {
    setDfaElements(prev => {
      const nodes = prev.filter(e => !e.data.source);
      const maxIdNum = nodes.reduce((max, node) => {
        const num = parseInt(node.data.id?.replace('q', '') || '0');
        return isNaN(num) ? max : Math.max(max, num);
      }, -1);
      const nextIdNum = maxIdNum + 1;
      const nextId = `q${nextIdNum}`;
      return [...prev, { data: { id: nextId, label: nextId.toUpperCase(), isInitial: false, isFinal: false }, position: pos || { x: 100, y: 300 } }];
    });
  };

  const addTransition = (source: string, target: string, symbol: string) => {
    if (!symbol) return;
    setDfaElements(prev => {
        const existing = prev.find(e => e.data.source === source && e.data.target === target);
        if (existing) {
            const labels = new Set([...existing.data.label.split(',').map((s: string) => s.trim()), symbol.trim()]);
            const newLabel = Array.from(labels).sort().join(', ');
            return prev.map(e => e.data.id === existing.data.id ? { ...e, data: { ...e.data, label: newLabel } } : e);
        }
        return [...prev, { data: { id: `e-${source}-${target}-${Date.now()}`, source, target, label: symbol.trim() } }];
    });
  };

  const minimizeDFA = () => {
    const nodes = dfaElements.filter(e => !e.data.source).map(n => n.data);
    const edges = dfaElements.filter(e => e.data.source).map(e => e.data);
    
    // 1. Remove unreachable states
    const reachable = new Set<string>();
    const stack = [nodes.find(n => n.isInitial)?.id].filter(Boolean) as string[];
    while(stack.length > 0) {
        const id = stack.pop()!;
        if (!reachable.has(id)) {
            reachable.add(id);
            edges.filter(e => e.source === id).forEach(e => stack.push(e.target));
        }
    }
    const reachableNodes = nodes.filter(n => reachable.has(n.id));
    const reachableEdges = edges.filter(e => reachable.has(e.source) && reachable.has(e.target));

    // 2. Table-Filling Algorithm
    const alphabet = new Set<string>();
    reachableEdges.forEach(e => e.label.split(',').forEach((s: string) => alphabet.add(s.trim())));
    
    const distTable: { [key: string]: boolean } = {};
    const getPairKey = (p: string, q: string) => [p, q].sort().join(',');

    // Initial marking: (p is final, q is not) or vice-versa
    for (let i = 0; i < reachableNodes.length; i++) {
        for (let j = i + 1; j < reachableNodes.length; j++) {
            const p = reachableNodes[i];
            const q = reachableNodes[j];
            if (p.isFinal !== q.isFinal) distTable[getPairKey(p.id, q.id)] = true;
        }
    }

    // Iterative marking
    let changed = true;
    while(changed) {
        changed = false;
        for (let i = 0; i < reachableNodes.length; i++) {
            for (let j = i + 1; j < reachableNodes.length; j++) {
                const p = reachableNodes[i].id;
                const q = reachableNodes[j].id;
                const key = getPairKey(p, q);
                if (distTable[key]) continue;

                for (const char of alphabet) {
                    const pNext = reachableEdges.find(e => e.source === p && e.label.split(',').map((s: string) => s.trim()).includes(char))?.target;
                    const qNext = reachableEdges.find(e => e.source === q && e.label.split(',').map((s: string) => s.trim()).includes(char))?.target;
                    
                    if (pNext && qNext && pNext !== qNext) {
                        if (distTable[getPairKey(pNext, qNext)]) {
                            distTable[key] = true;
                            changed = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    // 3. Merge Equivalent States
    const groups: string[][] = [];
    const used = new Set<string>();
    reachableNodes.forEach(n => {
        if (used.has(n.id)) return;
        const group = [n.id];
        used.add(n.id);
        reachableNodes.forEach(other => {
            if (!used.has(other.id) && !distTable[getPairKey(n.id, other.id)]) {
                group.push(other.id);
                used.add(other.id);
            }
        });
        groups.push(group);
    });

    const groupMap: { [key: string]: string } = {};
    groups.forEach((g, i) => g.forEach(id => groupMap[id] = `M${i}`));

    const minNodes = groups.map((g, i) => {
        const rep = reachableNodes.find(n => n.id === g[0])!;
        return { data: { 
            id: `M${i}`, 
            label: `M${i}`, 
            isInitial: g.some(id => reachableNodes.find(n => n.id === id)?.isInitial),
            isFinal: rep.isFinal 
        }, position: { x: 100 + (i % 3) * 150, y: 300 + Math.floor(i / 3) * 150 } };
    });

    const minEdges: any[] = [];
    groups.forEach((g, i) => {
        const sourceId = `M${i}`;
        alphabet.forEach(char => {
            const rep = g[0];
            const target = reachableEdges.find(e => e.source === rep && e.label.includes(char))?.target;
            if (target) {
                const targetGroupId = groupMap[target];
                const existing = minEdges.find(e => e.data.source === sourceId && e.data.target === targetGroupId);
                if (existing) {
                    existing.data.label = Array.from(new Set([...existing.data.label.split(',').map((s: any) => s.trim()), char])).sort().join(', ');
                } else {
                    minEdges.push({ data: { id: `me-${sourceId}-${targetGroupId}-${char}`, source: sourceId, target: targetGroupId, label: char } });
                }
            }
        });
    });

    setTable(distTable);
    setMinElements([...minNodes, ...minEdges]);
    setTimeout(() => minCyRef.current?.layout({ name: 'cose', animate: true }).run(), 100);
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
        if (dfaCyRef.current) {
          dfaCyRef.current.layout({ name: 'cose', animate: true }).run();
        }
      }, 200);

    } catch (error: any) {
      console.error("Oracle Error:", error);
      setErrorMessage(error.message || "Oracle failed to synthesize the machine.");
    } finally {
      setIsGenerating(false);
    }
  };

  const onCyReady = (cy: cytoscape.Core) => {
      dfaCyRef.current = cy;
      cy.minZoom(0.1); cy.maxZoom(4);
      if (ehRef.current) ehRef.current.destroy();
      ehRef.current = cy.edgehandles({ canConnect: () => true, hoverDelay: 50 });
      
      cy.off('ehcomplete');
      cy.on('ehcomplete', (v, s, t, edge) => { 
        edge.remove(); 
        const sym = prompt("Assign Transition Symbol:"); 
        if(sym) addTransition(s.id(), t.id(), sym); 
      });

      cy.off('dblclick');
      cy.on('dblclick', (evt) => { if (evt.target === cy) addState(evt.position); });

      cy.off('tap');
      cy.on('tap', 'node', (evt) => { setSelectedId(evt.target.id()); setMenu(null); });
      cy.on('tap', (evt) => { if (evt.target === cy) { setSelectedId(null); setMenu(null); } });

      cy.off('cxttap');
      cy.on('cxttap', 'node', (evt) => { 
        setMenu({ x: evt.renderedPosition.x, y: evt.renderedPosition.y, id: evt.target.id(), type: 'node' }); 
      });
  };

  const loadExample = (type: 'bloated-even' | 'redundant-1') => {
    let newElements: cytoscape.ElementDefinition[] = [];
    if (type === 'bloated-even') {
        newElements = [
            { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: true }, position: { x: 100, y: 300 } },
            { data: { id: 'q1', label: 'Q1', isInitial: false, isFinal: false }, position: { x: 250, y: 200 } },
            { data: { id: 'q2', label: 'Q2', isInitial: false, isFinal: true }, position: { x: 400, y: 300 } },
            { data: { id: 'q3', label: 'Q3', isInitial: false, isFinal: false }, position: { x: 250, y: 400 } },
            { data: { id: 'e1', source: 'q0', target: 'q1', label: '0' } },
            { data: { id: 'e2', source: 'q1', target: 'q2', label: '0' } },
            { data: { id: 'e3', source: 'q2', target: 'q3', label: '0' } },
            { data: { id: 'e4', source: 'q3', target: 'q0', label: '0' } },
            { data: { id: 'e5', source: 'q0', target: 'q0', label: '1' } },
            { data: { id: 'e6', source: 'q1', target: 'q1', label: '1' } },
            { data: { id: 'e7', source: 'q2', target: 'q2', label: '1' } },
            { data: { id: 'e8', source: 'q3', target: 'q3', label: '1' } },
        ];
    } else if (type === 'redundant-1') {
        newElements = [
            { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false }, position: { x: 100, y: 300 } },
            { data: { id: 'q1', label: 'Q1', isInitial: false, isFinal: true }, position: { x: 300, y: 200 } },
            { data: { id: 'q2', label: 'Q2', isInitial: false, isFinal: true }, position: { x: 300, y: 400 } },
            { data: { id: 'e1', source: 'q0', target: 'q1', label: '1' } },
            { data: { id: 'e2', source: 'q0', target: 'q0', label: '0' } },
            { data: { id: 'e3', source: 'q1', target: 'q2', label: '0, 1' } },
            { data: { id: 'e4', source: 'q2', target: 'q1', label: '0, 1' } },
        ];
    }
    setDfaElements(newElements);
    setShowBlueprints(false);
    setTimeout(() => dfaCyRef.current?.fit(), 100);
  };

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col text-white overflow-hidden border-t border-white/5">
      <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/30 hover:text-[#C5A021] transition-all"><RotateCcw size={18} className="-scale-x-100" /></button>
          <div className="text-xl font-black tracking-tighter uppercase italic">Minimizer <span className="text-[#C5A021]">Suite</span></div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Myhill-Nerode / unit_01</div>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setShowBlueprints(!showBlueprints)} className={`px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showBlueprints ? 'bg-[#C5A021] text-black border-[#C5A021]' : 'bg-white/5 text-[#C5A021] border-[#C5A021]/30 hover:bg-[#C5A021]/10'}`}><BookOpen size={14} /> Blueprints</button>
            <button onClick={minimizeDFA} className="px-8 py-3 bg-[#C5A021] text-black rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(197,160,33,0.3)] flex items-center gap-2 font-mono"><Zap size={14} /> Optimize DFA</button>
        </div>
      </div>
      
      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl font-black uppercase text-[10px] tracking-widest cursor-pointer" onClick={() => setErrorMessage(null)}>
            <AlertCircle size={16} /> {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlueprints && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 right-8 z-[100] w-72 bg-black/80 backdrop-blur-3xl border border-[#C5A021]/30 rounded-2xl p-4 shadow-2xl">
                <h3 className="text-[10px] font-black text-[#C5A021] uppercase tracking-[0.4em] mb-4">Select Distorted DFA</h3>
                <div className="space-y-2">
                    <button onClick={() => loadExample('bloated-even')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all"><div className="text-[10px] font-black uppercase tracking-widest">Bloated 'Even 0s' (4 States)</div></button>
                    <button onClick={() => loadExample('redundant-1')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all"><div className="text-[10px] font-black uppercase tracking-widest">Redundant 'Contains 1'</div></button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full px-12 py-6 bg-black/20 border-b border-white/5">
        <div className="max-w-4xl mx-auto relative flex bg-white/5 p-2 rounded-3xl border border-white/10 focus-within:border-[#C5A021]/50 transition-all">
            <div className="flex items-center gap-3 px-4 text-[#C5A021]/40"><Terminal size={20} /> <span className="text-[10px] uppercase font-black tracking-widest">Logic Oracle :</span></div>
            <input 
                value={oracleInput} 
                onChange={(e) => setOracleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOracleInquiry()}
                placeholder={isGenerating ? "CONSULTING ORACLE..." : "Type natural language rules for minimal DFA (e.g. 'Contains 01')..."} 
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

      <div className="flex-grow flex gap-px bg-white/5 relative">
        <div className="w-1/2 h-full bg-[#000816] relative overflow-hidden">
            <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
                <div className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A021]">Source DFA</div>
                <button onClick={() => dfaCyRef.current?.layout({ name: 'cose', animate: true }).run()} className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#C5A021]/10 transition-all">Restore Balance</button>
            </div>
            <CytoscapeComponent elements={dfaElements} stylesheet={stylesheet} style={{ width: '100%', height: '100%' }} cy={onCyReady} />
            <AnimatePresence>
                {selectedId && !dfaElements.find(e => e.data.id === selectedId)?.data.source && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-8 left-8 right-8 z-40 bg-black/60 backdrop-blur-3xl border border-[#C5A021]/20 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <div className="p-4 bg-[#C5A021]/10 border border-[#C5A021]/20 rounded-2xl">
                                <span className="text-[8px] font-black text-[#C5A021] uppercase tracking-widest block mb-1">Inspecting</span>
                                <input value={dfaElements.find(e => e.data.id === selectedId)?.data.label || ''} onChange={(e) => setDfaElements(prev => prev.map(el => el.data.id === selectedId ? { ...el, data: { ...el.data, label: e.target.value } } : el))} className="bg-transparent text-lg font-black focus:outline-none w-32 border-b border-[#C5A021]/30" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => ehRef.current.start(dfaCyRef.current?.getElementById(selectedId))} className="px-6 py-4 bg-[#C5A021] text-black rounded-2xl font-black uppercase text-[9px] tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"><ArrowUpRight size={14} /> Add Edge</button>
                                <button onClick={() => { const s = prompt("Symbol:"); if(s) addTransition(selectedId, selectedId, s); }} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 font-mono"><RefreshCcw size={14} /> Add Loop</button>
                            </div>
                        </div>
                        <button onClick={() => { setDfaElements(prev => prev.filter(e => e.data.id !== selectedId && e.data.source !== selectedId && e.data.target !== selectedId)); setSelectedId(null); }} className="p-4 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={20}/></button>
                    </motion.div>
                )}
            </AnimatePresence>
            {menu && (
                <div style={{ top: menu.y, left: menu.x }} className="absolute z-[100] w-56 bg-black/80 backdrop-blur-3xl border border-[#C5A021]/20 rounded-2xl p-2 shadow-2xl flex flex-col gap-1">
                  <button onClick={() => { setDfaElements(prev => prev.map(el => el.data.id === menu.id ? { ...el, data: { ...el.data, isFinal: !el.data.isFinal } } : el)); setMenu(null); }} className="flex items-center gap-3 w-full p-3 hover:bg-[#C5A021]/10 rounded-xl transition-all font-mono uppercase text-[9px] font-black"><CheckCircle2 size={14} /> Toggle Final</button>
                  <button onClick={() => { setDfaElements(prev => prev.map(el => el.data.source ? el : { ...el, data: { ...el.data, isInitial: el.data.id === menu.id } })); setMenu(null); }} className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-xl transition-all font-mono uppercase text-[9px] font-black"><Target size={14} /> Set Initial</button>
                  <div className="h-px bg-white/5 my-1" />
                  <button onClick={() => { setDfaElements(prev => prev.filter(e => e.data.id !== menu.id && e.data.source !== menu.id && e.data.target !== menu.id)); setMenu(null); }} className="flex items-center gap-3 w-full p-3 hover:bg-red-500/10 rounded-xl transition-all font-mono uppercase text-[9px] font-black text-red-500"><Trash2 size={14} /> Delete State</button>
                </div>
            )}
        </div>

        <div className="w-1/2 h-full bg-[#000816] relative border-l border-white/10 overflow-hidden">
            <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-[#00FF88]">Optimized DFA</div>
            <CytoscapeComponent elements={minElements} stylesheet={stylesheet} style={{ width: '100%', height: '100%' }} cy={(cy) => minCyRef.current = cy} />
            
            <div className="absolute bottom-6 right-6 w-80 max-h-72 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 overflow-hidden flex flex-col shadow-2xl">
                <h3 className="text-[10px] font-black text-[#C5A021] uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><Grid3X3 size={14} /> Myhill-Nerode Matrix</h3>
                <div className="flex-grow overflow-auto focus:outline-none custom-scrollbar pb-2">
                  {Object.keys(table).length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {dfaElements.filter(e => !e.data.source).map((row, i) => (
                        <div key={row.data.id} className="flex gap-1">
                            {dfaElements.filter(e => !e.data.source).slice(0, i).map((col) => {
                                const key = [row.data.id, col.data.id].sort().join(',');
                                return (
                                    <div key={key} className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] font-mono ${table[key] ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-500'}`}>
                                        {table[key] ? 'X' : '='}
                                    </div>
                                );
                            })}
                            <div className="w-8 h-8 flex items-center justify-center text-[8px] font-black text-white/20 uppercase">{row.data.id}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center opacity-20">
                      <Grid3X3 size={40} />
                      <p className="text-[9px] uppercase font-black mt-4">Run Optimizer to populate</p>
                    </div>
                  )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MinimizerSuite;

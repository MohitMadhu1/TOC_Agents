import { useState, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import { RotateCcw, Share2, Zap, Trash2, ShieldCheck, Target, ArrowUpRight, RefreshCcw, Settings2, AlertCircle, LayoutGrid, BookOpen, Play, Pause, CheckCircle2, XCircle, ChevronRight, Terminal, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIService } from '../utils/aiService';

// edgehandles/dagre are registered globally in main.tsx

interface ConversionState {
    id: string; // New DFA ID (A, B, C...)
    nfaIds: string[]; // Subset of NFA IDs
    isFinal: boolean;
    isInitial: boolean;
}

const ConversionLab: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [nfaElements, setNfaElements] = useState<cytoscape.ElementDefinition[]>([
    { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false, width: 50, height: 50 }, position: { x: 100, y: 300 } }
  ]);
  const [dfaElements, setDfaElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [conversionMap, setConversionMap] = useState<ConversionState[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'table'>('editor');
  const [menu, setMenu] = useState<{ x: number, y: number, id: string, type: 'node' | 'edge' } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [oracleInput, setOracleInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBlueprints, setShowBlueprints] = useState(false);
  
  const nfaCyRef = useRef<cytoscape.Core | null>(null);
  const dfaCyRef = useRef<cytoscape.Core | null>(null);
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
        'width': 50,
        'height': 50,
        'font-family': 'Outfit, sans-serif',
        'font-weight': 900,
        'font-size': 12,
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
        'font-size': 14,
        'font-weight': 900,
        'text-background-opacity': 1,
        'text-background-color': '#000816',
        'text-background-padding': 4,
        'text-margin-y': -10,
        'text-rotation': 'autorotate'
      }
    },
      {
        selector: '.eh-handle',
        style: {
          'background-color': '#C5A021',
          'width': 18,
          'height': 18,
          'shape': 'ellipse',
          'border-width': 2,
          'border-color': '#fff',
          'z-index': 1000
        }
      }
    ];

  const handleOracleInquiry = async () => {
    if (!oracleInput.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const ai = new AIService();
      const result = await ai.generateMachine(oracleInput, 'nfa');
      
      const newNodes = result.nodes.map(n => ({
        data: { id: n.id, label: n.label, isInitial: n.isInitial, isFinal: n.isFinal, width: 50, height: 50 },
        position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 }
      }));

      const newEdges = result.edges.map((e, idx) => ({
        data: { id: `edge-${idx}-${Date.now()}`, source: e.source, target: e.target, label: e.label }
      }));

      setNfaElements([...newNodes, ...newEdges]);
      setOracleInput('');
      
      setTimeout(() => {
        if (nfaCyRef.current) {
          nfaCyRef.current.layout({ name: 'cose', animate: true }).run();
        }
      }, 200);

    } catch (error: any) {
      console.error("Oracle Error:", error);
      setErrorMessage(error.message || "Oracle failed to synthesize the machine.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addState = (pos?: { x: number, y: number }) => {
    setNfaElements(prev => {
      const nodes = prev.filter(e => !e.data.source);
      const maxIdNum = nodes.reduce((max, node) => {
        const num = parseInt(node.data.id?.replace('q', '') || '0');
        return isNaN(num) ? max : Math.max(max, num);
      }, -1);
      const nextId = `q${maxIdNum + 1}`;
      return [...prev, { data: { id: nextId, label: nextId.toUpperCase(), isInitial: false, isFinal: false }, position: pos || { x: 100, y: 300 } }];
    });
  };

  const addTransition = (source: string, target: string, symbol: string) => {
    if (!symbol) return;
    setNfaElements(prev => {
        const existing = prev.find(e => e.data.source === source && e.data.target === target);
        if (existing) {
            const labels = new Set([...existing.data.label.split(',').map((s: string) => s.trim()), symbol.trim()]);
            const newLabel = Array.from(labels).sort().join(', ');
            return prev.map(e => e.data.id === existing.data.id ? { ...e, data: { ...e.data, label: newLabel } } : e);
        }
        return [...prev, { data: { id: `e-${source}-${target}-${Date.now()}`, source, target, label: symbol.trim() } }];
    });
  };

  const getEpsilonClosure = (states: string[], edges: any[]) => {
    const closure = new Set(states);
    const stack = [...states];
    while (stack.length > 0) {
        const s = stack.pop()!;
        const epsEdges = edges.filter(e => e.data.source === s && (e.data.label === 'e' || e.data.label.includes('ε')));
        epsEdges.forEach(e => {
            if (!closure.has(e.data.target)) { closure.add(e.data.target); stack.push(e.data.target); }
        });
    }
    return Array.from(closure).sort();
  };

  const runSubsetConstruction = () => {
    const edges = nfaElements.filter(e => e.data.source);
    const nodes = nfaElements.filter(e => !e.data.source);
    const initialNfaNode = nodes.find(n => n.data.isInitial);
    if (!initialNfaNode) { alert("Need an initial NFA state!"); return; }

    const alphabet = new Set<string>();
    edges.forEach(e => e.data.label.split(',').forEach((s: string) => {
        const c = s.trim();
        if (c && c !== 'e' && c !== 'ε') alphabet.add(c);
    }));

    const dfaStates: ConversionState[] = [];
    const dfaTransitions: { source: string, target: string, symbol: string }[] = [];
    const queue: string[][] = [];

    const startSubset = getEpsilonClosure([initialNfaNode.data.id!], edges);
    queue.push(startSubset);
    dfaStates.push({ 
        id: 'A', 
        nfaIds: startSubset, 
        isInitial: true, 
        isFinal: startSubset.some(id => nodes.find(n => n.data.id === id)?.data.isFinal)
    });

    let stateCounter = 1;
    let head = 0;
    while(head < queue.length) {
        const currentSubset = queue[head++];
        const currentDfaId = dfaStates[head - 1].id;

        Array.from(alphabet).sort().forEach(char => {
            const nextSubsetRaw = new Set<string>();
            currentSubset.forEach(nfaId => {
                edges.filter(e => e.data.source === nfaId && e.data.label.split(',').map((s: string) => s.trim()).includes(char))
                     .forEach(e => nextSubsetRaw.add(e.data.target));
            });

            if (nextSubsetRaw.size > 0) {
                const nextSubset = getEpsilonClosure(Array.from(nextSubsetRaw), edges);
                let existingState = dfaStates.find(s => s.nfaIds.join(',') === nextSubset.join(','));
                
                if (!existingState) {
                    const newId = String.fromCharCode(65 + stateCounter++);
                    existingState = { 
                        id: newId, 
                        nfaIds: nextSubset, 
                        isInitial: false, 
                        isFinal: nextSubset.some(id => nodes.find(n => n.data.id === id)?.data.isFinal)
                    };
                    dfaStates.push(existingState);
                    queue.push(nextSubset);
                }
                dfaTransitions.push({ source: currentDfaId, target: existingState.id, symbol: char });
            }
        });
    }

    // Map to Cytoscape
    const newDfaElements: cytoscape.ElementDefinition[] = dfaStates.map((s, i) => ({
        data: { id: s.id, label: s.id, isInitial: s.isInitial, isFinal: s.isFinal },
        position: { x: 100 + (i % 3) * 150, y: 300 + Math.floor(i / 3) * 150 }
    }));
    dfaTransitions.forEach(t => {
        newDfaElements.push({ data: { id: `dfa-e-${t.source}-${t.target}-${t.symbol}`, source: t.source, target: t.target, label: t.symbol } });
    });

    setDfaElements(newDfaElements);
    setConversionMap(dfaStates);
    setTimeout(() => dfaCyRef.current?.layout({ name: 'cose', animate: true }).run(), 100);
  };

  const onNfaCyReady = (cy: cytoscape.Core) => {
    nfaCyRef.current = cy;
    cy.minZoom(0.1); cy.maxZoom(4);
    if (ehRef.current) ehRef.current.destroy();
    ehRef.current = (nfaCyRef.current as any).edgehandles({ canConnect: () => true, hoverDelay: 50, snap: true, handleOutside: true });
    
    cy.off('ehcomplete');
    cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
        addedEdge.remove();
        const s = prompt("Assign Transition Symbol (e for ε):");
        if (s) addTransition(sourceNode.id(), targetNode.id(), s);
    });

    cy.off('dblclick');
    cy.on('dblclick', (evt) => { if (evt.target === cy) addState(evt.position); });

    cy.off('cxttap');
    cy.on('cxttap', 'node', (evt) => { 
        setMenu({ x: evt.renderedPosition.x, y: evt.renderedPosition.y, id: evt.target.id(), type: 'node' }); 
    });

    cy.off('tap');
    cy.on('tap', 'node', (evt) => { setSelectedId(evt.target.id()); setMenu(null); });
    cy.on('tap', 'edge', (evt) => { setSelectedId(evt.target.id()); setMenu(null); });
    cy.on('tap', (evt) => { if (evt.target === cy) { setMenu(null); setSelectedId(null); } });
  };

  const loadExample = (type: 'ends-with-01' | 'contains-11') => {
    let newElements: cytoscape.ElementDefinition[] = [];
    if (type === 'ends-with-01') {
        newElements = [
            { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false }, position: { x: 100, y: 300 } },
            { data: { id: 'q1', label: 'Q1', isInitial: false, isFinal: false }, position: { x: 250, y: 300 } },
            { data: { id: 'q2', label: 'Q2', isInitial: false, isFinal: true }, position: { x: 400, y: 300 } },
            { data: { id: 'e1', source: 'q0', target: 'q0', label: '0, 1' } },
            { data: { id: 'e2', source: 'q0', target: 'q1', label: '0' } },
            { data: { id: 'e3', source: 'q1', target: 'q2', label: '1' } },
        ];
    } else if (type === 'contains-11') {
        newElements = [
            { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false }, position: { x: 100, y: 300 } },
            { data: { id: 'q1', label: 'Q1', isInitial: false, isFinal: false }, position: { x: 250, y: 300 } },
            { data: { id: 'q2', label: 'Q2', isInitial: false, isFinal: true }, position: { x: 400, y: 300 } },
            { data: { id: 'e1', source: 'q0', target: 'q0', label: '0, 1' } },
            { data: { id: 'e2', source: 'q0', target: 'q1', label: '1' } },
            { data: { id: 'e3', source: 'q1', target: 'q2', label: '1' } },
            { data: { id: 'e4', source: 'q2', target: 'q2', label: '0, 1' } },
        ];
    }
    setNfaElements(newElements);
    setShowBlueprints(false);
    setTimeout(() => nfaCyRef.current?.fit(), 100);
  };

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col text-white font-sans overflow-hidden border-t border-white/5 relative">
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
      <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl px-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/30 hover:text-[#C5A021] transition-all"><RotateCcw size={18} className="-scale-x-100" /></button>
          <div className="text-xl font-black tracking-tighter uppercase">Conversion <span className="text-[#C5A021]">Lab</span></div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Subset Construction / unit_01</div>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setShowBlueprints(!showBlueprints)} className={`px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showBlueprints ? 'bg-[#C5A021] text-black border-[#C5A021]' : 'bg-white/5 text-[#C5A021] border-[#C5A021]/30 hover:bg-[#C5A021]/10'}`}><BookOpen size={14} /> Blueprints</button>
            <button onClick={runSubsetConstruction} className="px-8 py-3 bg-[#C5A021] text-black rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(197,160,33,0.3)] flex items-center gap-2"><Zap size={14} /> Compute DFA</button>
        </div>
      </div>

      <AnimatePresence>
        {showBlueprints && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 right-8 z-[100] w-72 bg-black/80 backdrop-blur-3xl border border-[#C5A021]/30 rounded-2xl p-4 shadow-2xl">
                <h3 className="text-[10px] font-black text-[#C5A021] uppercase tracking-[0.4em] mb-4">Select Source NFA</h3>
                <div className="space-y-2">
                    <button onClick={() => loadExample('ends-with-01')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all"><div className="text-[10px] font-black uppercase tracking-widest">Ends with '01'</div></button>
                    <button onClick={() => loadExample('contains-11')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all"><div className="text-[10px] font-black uppercase tracking-widest">Contains '11'</div></button>
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
                placeholder={isGenerating ? "CONSULTING ORACLE..." : "Type natural language rules (e.g. 'Accepts strings starting with 0')..."} 
                disabled={isGenerating}
                className="flex-grow bg-transparent p-4 text-sm font-medium focus:outline-none placeholder:text-white/10 text-[#C5A021] disabled:opacity-50"
            />
            <button 
                onClick={handleOracleInquiry}
                disabled={isGenerating}
                className={`px-10 bg-[#C5A021] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl flex items-center gap-2 ${isGenerating ? 'opacity-50' : 'hover:scale-105'}`}
            >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {isGenerating ? 'Synthesizing...' : 'Process'}
            </button>
        </div>
      </div>

      <div className="flex-grow flex gap-px bg-white/5">
        <div className="w-1/2 h-full bg-[#000816] relative overflow-hidden">
            <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
              <div className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A021]">Source NFA</span>
              </div>
              <button onClick={() => nfaCyRef.current?.layout({ name: 'cose', animate: true, padding: 50 }).run()} className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#C5A021]/10 transition-all">Restore Balance</button>
            </div>
            
            <CytoscapeComponent elements={nfaElements} stylesheet={stylesheet} style={{ width: '100%', height: '100%' }} cy={(cy: any) => onNfaCyReady(cy)} />

            <AnimatePresence>
                {selectedId && !nfaElements.find(e => e.data.id === selectedId)?.data.source && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute bottom-8 left-8 right-8 z-40 bg-black/60 backdrop-blur-3xl border border-[#C5A021]/20 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-[#C5A021]/10 border border-[#C5A021]/20 rounded-2xl">
                                <span className="text-[8px] font-black text-[#C5A021] uppercase tracking-widest block mb-1">Inspecting</span>
                                <input 
                                    value={nfaElements.find(e => e.data.id === selectedId)?.data.label || ''} 
                                    onChange={(e) => setNfaElements(prev => prev.map(el => el.data.id === selectedId ? { ...el, data: { ...el.data, label: e.target.value } } : el))}
                                    className="bg-transparent text-lg font-black focus:outline-none w-32 border-b border-[#C5A021]/30"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => ehRef.current.start(nfaCyRef.current?.getElementById(selectedId))} className="px-6 py-4 bg-[#C5A021] text-black rounded-2xl font-black uppercase text-[9px] tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"><ArrowUpRight size={14} /> New Branching</button>
                                <button onClick={() => { const s = prompt("Symbol (e for ε):"); if(s) addTransition(selectedId, selectedId, s); }} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"><RefreshCcw size={14} /> Add Loop</button>
                            </div>
                        </div>
                        <button onClick={() => { setNfaElements(prev => prev.filter(e => e.data.id !== selectedId && e.data.source !== selectedId && e.data.target !== selectedId)); setSelectedId(null); }} className="p-4 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={20}/></button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ top: menu.y, left: menu.x }} className="absolute z-[100] w-56 bg-black/80 backdrop-blur-3xl border border-[#C5A021]/20 rounded-2xl p-2 shadow-2xl flex flex-col gap-1">
                  <button onClick={() => { setNfaElements(prev => prev.map(el => el.data.id === menu.id ? { ...el, data: { ...el.data, isFinal: !el.data.isFinal } } : el)); setMenu(null); }} className="flex items-center gap-3 w-full p-3 hover:bg-[#C5A021]/10 rounded-xl transition-all font-mono uppercase text-[9px] font-black"><CheckCircle2 size={14} /> Toggle Final</button>
                  <button onClick={() => { setNfaElements(prev => prev.map(el => el.data.source ? el : { ...el, data: { ...el.data, isInitial: el.data.id === menu.id } })); setMenu(null); }} className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-xl transition-all font-mono uppercase text-[9px] font-black"><Target size={14} /> Set Initial</button>
                  <div className="h-px bg-white/5 my-1" />
                  <button onClick={() => { setNfaElements(prev => prev.filter(e => e.data.id !== menu.id && e.data.source !== menu.id && e.data.target !== menu.id)); setMenu(null); }} className="flex items-center gap-3 w-full p-3 hover:bg-red-500/10 rounded-xl transition-all font-mono uppercase text-[9px] font-black text-red-500"><Trash2 size={14} /> Delete State</button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute bottom-6 left-6 text-[9px] text-white/30 uppercase font-black tracking-widest italic flex items-center gap-3 z-10"><Terminal size={12} /> Double-click canvas to spawn nodes</div>
        </div>

        <div className="w-1/2 h-full bg-[#000816] relative border-l border-white/10">
          <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-xl flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00FF88]">Resulting DFA</span>
            {conversionMap.length > 0 && <span className="text-[9px] font-black bg-[#00FF88]/10 text-[#00FF88] px-2 py-0.5 rounded border border-[#00FF88]/20">{conversionMap.length} States Generated</span>}
          </div>
          <CytoscapeComponent elements={dfaElements} stylesheet={stylesheet} style={{ width: '100%', height: '100%' }} cy={(cy: any) => dfaCyRef.current = cy} />
          
          <div className="absolute bottom-6 right-6 w-72 max-h-64 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col shadow-2xl">
            <h3 className="text-[10px] font-black text-[#C5A021] uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><LayoutGrid size={14} /> Subset Mapping</h3>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar focus:outline-none">
                {conversionMap.length > 0 ? conversionMap.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-[10px] font-black text-[#00FF88]">{s.id}</span>
                        <ChevronRight size={12} className="text-white/20" />
                        <span className="text-[10px] font-mono text-white/60">&#123;{s.nfaIds.sort().join(', ')}&#125;</span>
                    </div>
                )) : (
                    <div className="h-24 flex flex-col items-center justify-center text-center opacity-20">
                        <Share2 size={24} />
                        <p className="text-[8px] uppercase font-black mt-2">Awaiting Computation</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionLab;

import React, { useState, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import { RotateCcw, SkipForward, Zap, Trash2, ShieldCheck, Target, ArrowUpRight, RefreshCcw, Settings2, AlertCircle, LayoutGrid, BookOpen, Play, Pause, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// edgehandles/dagre are registered globally in main.tsx

const DFAWorkspace: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [elements, setElements] = useState<cytoscape.ElementDefinition[]>([
    { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false, width: 50, height: 50 }, position: { x: 300, y: 300 } }
  ]);
  const [inputString, setInputString] = useState('');
  const [simulationSteps, setSimulationSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [menu, setMenu] = useState<{ x: number, y: number, id: string, type: 'node' | 'edge' } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'tuple'>('inspector');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  const cyRef = useRef<cytoscape.Core | null>(null);
  const ehRef = useRef<any>(null);

  const cytoscapeStylesheet: cytoscape.Stylesheet[] = [
    {
      selector: 'node',
      style: {
        'background-color': '#001540',
        'background-opacity': 1,
        'border-width': 2,
        'border-color': '#C5A021',
        'label': 'data(label)',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'width': 'data(width)',
        'height': 'data(height)',
        'min-zoomed-font-size': 0,
        'font-family': 'Outfit, system-ui, sans-serif',
        'font-weight': 900,
        'font-size': 12,
        'overlay-opacity': 0,
        'z-index': 100,
        'shape': 'ellipse'
      }
    },
    {
      selector: 'node:selected, .eh-source, .eh-target, .eh-preview, node:active',
      style: {
        'width': 50,
        'height': 50,
        'shape': 'ellipse',
        'border-width': 2,
        'border-color': '#fff',
        'background-color': '#002573'
      }
    },
    {
      selector: 'node[?isFinal]',
      style: {
        'border-width': 4,
        'border-style': 'double',
        'border-color': '#C5A021'
      }
    },
    {
      selector: 'node[?active]',
      style: {
        'background-color': '#C5A021',
        'color': '#000',
        'border-color': '#fff',
        'width': 50,
        'height': 50
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#C5A021',
        'target-arrow-color': '#C5A021',
        'target-arrow-shape': 'triangle',
        'curve-style': 'unbundled-bezier',
        'control-point-distances': [45],
        'control-point-weights': [0.5],
        'label': 'data(label)',
        'color': '#C5A021',
        'font-size': 14,
        'font-weight': 900,
        'text-background-opacity': 1,
        'text-background-color': '#000816',
        'text-background-padding': 5,
        'text-margin-y': -15,
        'z-index': 1,
        'text-rotation': 'autorotate'
      }
    },
    {
      selector: 'edge:loop',
      style: {
        'curve-style': 'bezier',
        'control-point-step-size': 80,
        'loop-direction': -45,
        'loop-sweep': 90,
        'text-margin-y': -25
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'width': 4,
        'line-color': '#fff',
        'target-arrow-color': '#fff',
        'z-index': 1000
      }
    },
    {
      selector: '.eh-handle',
      style: {
        'background-color': '#C5A021',
        'width': 20,
        'height': 20,
        'shape': 'ellipse',
        'overlay-opacity': 0,
        'border-width': 2,
        'border-color': '#fff',
        'z-index': 200
      }
    },
    {
      selector: '.eh-preview, .eh-ghost-edge',
      style: {
        'line-color': '#C5A021',
        'line-opacity': 1,
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#C5A021',
        'width': 2,
        'curve-style': 'bezier'
      }
    }
  ];

  const addState = (pos?: { x: number, y: number }) => {
    setElements(prev => {
      const nodes = prev.filter(e => !e.data.source);
      const maxIdNum = nodes.reduce((max, node) => {
        const num = parseInt(node.data.id?.replace('q', '') || '0');
        return isNaN(num) ? max : Math.max(max, num);
      }, -1);
      const nextIdNum = maxIdNum + 1;
      const nextId = `q${nextIdNum}`;
      const nextPos = pos || { x: 300 + (nextIdNum % 5) * 160, y: 300 + Math.floor(nextIdNum / 5) * 160 };
      return [...prev, { data: { id: nextId, label: nextId.toUpperCase(), isInitial: false, isFinal: false, width: 50, height: 50 }, position: nextPos }];
    });
  };

  const deleteItems = (id: string) => {
    setElements(prev => prev.filter(el => el.data.id !== id && el.data.source !== id && el.data.target !== id));
    setSelectedId(null);
    setMenu(null);
  };

  const renameNode = (id: string, newLabel: string) => {
    setElements(prev => prev.map(el => el.data.id === id ? { ...el, data: { ...el.data, label: newLabel } } : el));
  };

  const toggleFinal = (id: string) => {
    setElements(prev => prev.map(el => el.data.id === id ? { ...el, data: { ...el.data, isFinal: !el.data.isFinal } } : el));
    setMenu(null);
  };

  const toggleInitial = (id: string) => {
    setElements(prev => prev.map(el => {
      if (el.data.source) return el;
      return { ...el, data: { ...el.data, isInitial: el.data.id === id } };
    }));
    setMenu(null);
  };

  const addTransition = (source: string, target: string, newChar: string) => {
    if (!newChar) return;
    const cleanChar = newChar.trim();
    if (!cleanChar) return;

    setElements(prev => {
      const sourceEdges = prev.filter(e => e.data.source === source);
      const alreadyHasChar = sourceEdges.some(e => {
        const chars = e.data.label.split(',').map((s: string) => s.trim());
        return chars.includes(cleanChar);
      });

      if (alreadyHasChar) {
        setErrorMessage(`DFA Rule Violation: State already has a transition for "${cleanChar}"`);
        setTimeout(() => setErrorMessage(null), 3000);
        return prev;
      }

      const existingEdgeBetweenNodes = prev.find(e => e.data.source === source && e.data.target === target);
      if (existingEdgeBetweenNodes) {
        const chars = existingEdgeBetweenNodes.data.label.split(',').map((s: string) => s.trim());
        const newLabel = [...chars, cleanChar].sort().join(', ');
        return prev.map(e => e.data.id === existingEdgeBetweenNodes.data.id ? { ...e, data: { ...e.data, label: newLabel } } : e);
      }

      const id = `edge-${source}-${target}-${Date.now()}`;
      return [...prev, { data: { id, source, target, label: cleanChar } }];
    });
  };

  const loadExample = (type: 'starts' | 'ends' | 'parity') => {
    let newElements: cytoscape.ElementDefinition[] = [];
    if (type === 'starts') {
      newElements = [
        { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false, width: 50, height: 50 }, position: { x: 200, y: 300 } },
        { data: { id: 'q1', label: 'Q1', isInitial: false, isFinal: true, width: 50, height: 50 }, position: { x: 400, y: 300 } },
        { data: { id: 'q2', label: 'Q2 (DEAD)', isInitial: false, isFinal: false, width: 50, height: 50 }, position: { x: 400, y: 500 } },
        { data: { id: 'e1', source: 'q0', target: 'q1', label: '0' } },
        { data: { id: 'e2', source: 'q0', target: 'q2', label: '1' } },
        { data: { id: 'e3', source: 'q1', target: 'q1', label: '0, 1' } },
        { data: { id: 'e4', source: 'q2', target: 'q2', label: '0, 1' } },
      ];
    } else if (type === 'ends') {
      newElements = [
        { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false, width: 50, height: 50 }, position: { x: 200, y: 300 } },
        { data: { id: 'q1', label: 'Q1', isInitial: false, isFinal: true, width: 50, height: 50 }, position: { x: 500, y: 300 } },
        { data: { id: 'e1', source: 'q0', target: 'q1', label: '1' } },
        { data: { id: 'e2', source: 'q0', target: 'q0', label: '0' } },
        { data: { id: 'e3', source: 'q1', target: 'q1', label: '1' } },
        { data: { id: 'e4', source: 'q1', target: 'q0', label: '0' } },
      ];
    } else if (type === 'parity') {
      newElements = [
        { data: { id: 'q0', label: 'EVEN', isInitial: true, isFinal: true, width: 50, height: 50 }, position: { x: 200, y: 350 } },
        { data: { id: 'q1', label: 'ODD', isInitial: false, isFinal: false, width: 50, height: 50 }, position: { x: 500, y: 350 } },
        { data: { id: 'e1', source: 'q0', target: 'q1', label: '1' } },
        { data: { id: 'e2', source: 'q1', target: 'q0', label: '1' } },
        { data: { id: 'e3', source: 'q0', target: 'q0', label: '0' } },
        { data: { id: 'e4', source: 'q1', target: 'q1', label: '0' } },
      ];
    }
    setElements(newElements);
    setShowExamples(false);
    setSelectedId(null);
    setTimeout(() => { if (cyRef.current) cyRef.current.fit(); }, 100);
  };

  const addSelfLoop = (id: string) => {
    const symbol = prompt("Assign Transition Symbol:");
    if (!symbol) return;
    addTransition(id, id, symbol);
  };

  const startSimulation = () => {
    const edges = elements.filter(e => e.data.source);
    const nodes = elements.filter(e => !e.data.source);
    let curr = nodes.find(n => n.data.isInitial);
    if (!curr) { alert("Mark an Initial State first."); return; }

    const steps = [];
    const inputChars = inputString.split('');
    for (const char of inputChars) {
      const nextEdge = edges.find(e => {
        if (e.data.source !== curr?.data.id) return false;
        return e.data.label.split(',').map((s: string) => s.trim()).includes(char);
      });
      if (!nextEdge) break;
      const next = nodes.find(n => n.data.id === nextEdge.data.target);
      if (!next) break;
      steps.push({ from: curr.data.id, to: next.data.id, symbol: char });
      curr = next;
    }
    setSimulationSteps(steps);
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex(p => {
          if (p >= simulationSteps.length) { setIsPlaying(false); return p; }
          return p + 1;
        });
      }, 650);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulationSteps.length]);

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.nodes().data('active', false);
      const step = simulationSteps[currentStepIndex];
      if (step) {
        cyRef.current.getElementById(step.from).data('active', true);
      } else if (currentStepIndex === simulationSteps.length && simulationSteps.length > 0) {
        const lastStep = simulationSteps[simulationSteps.length - 1];
        cyRef.current.getElementById(lastStep.to).data('active', true);
      }
    }
  }, [currentStepIndex, simulationSteps]);

  const onCyReady = (cy: cytoscape.Core) => {
    cyRef.current = cy;
    cy.minZoom(0.1); cy.maxZoom(4.0);
    (cy as any).options().wheelSensitivity = 0.12;
    cy.on('style', 'node', (evt) => { if (evt.target.width() !== 50 || evt.target.height() !== 50) evt.target.style({ 'width': 50, 'height': 50 }); });

    if (ehRef.current) ehRef.current.destroy();
    ehRef.current = cy.edgehandles({ canConnect: () => true, hoverDelay: 50, snap: true, handleOutside: true });
    cy.off('ehcomplete');
    cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
      addedEdge.remove();
      const symbol = prompt("Assign Transition Symbol:");
      if (!symbol) return;
      addTransition(sourceNode.id(), targetNode.id(), symbol);
    });

    cy.off('tap');
    cy.on('tap', 'node', (evt) => { setSelectedId(evt.target.id()); setMenu(null); });
    cy.on('tap', 'edge', (evt) => { setSelectedId(evt.target.id()); setMenu(null); });
    cy.on('tap', (evt) => { if (evt.target === cy) { setMenu(null); setSelectedId(null); } });
    cy.off('cxttap');
    cy.on('cxttap', 'node', (evt) => { setSelectedId(evt.target.id()); setMenu({ x: evt.renderedPosition.x, y: evt.renderedPosition.y, id: evt.target.id(), type: 'node' }); });
    cy.off('viewport'); cy.on('viewport', () => setMenu(null));
    cy.off('dblclick');
    cy.on('dblclick', (evt) => { if (evt.target === cy) { addState(evt.position); } });
  };

  const currentNodes = elements.filter(e => !e.data.source);
  const currentEdges = elements.filter(e => e.data.source);
  const alphabetSet = new Set<string>();
  currentEdges.forEach(e => { e.data.label.split(',').map((s: string) => s.trim()).forEach((c: string) => { if (c) alphabetSet.add(c); }); });

  const finished = currentStepIndex === simulationSteps.length && simulationSteps.length > 0;
  const lastStateId = simulationSteps.length > 0 ? (currentStepIndex === simulationSteps.length ? simulationSteps[currentStepIndex - 1].to : simulationSteps[currentStepIndex].from) : null;
  const isAccepted = finished && currentNodes.find(n => n.data.id === lastStateId)?.data.isFinal;

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col overflow-hidden text-white font-sans select-none relative">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl font-black uppercase text-[10px] tracking-widest cursor-pointer" onClick={() => setErrorMessage(null)}>
            <AlertCircle size={16} /> {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-none h-16 w-full border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/30 hover:text-[#C5A021] transition-all mr-2">
            <RotateCcw size={18} className="-scale-x-100" />
          </button>
          <div className="text-xl font-black tracking-tighter uppercase">DFA <span className="text-[#C5A021]">Architect</span></div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Archive Session / unit_01</div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowExamples(!showExamples)} className={`flex items-center gap-3 p-2 px-5 rounded-full text-[10px] uppercase font-black tracking-widest transition-all border ${showExamples ? 'bg-[#C5A021] text-black border-[#C5A021]' : 'bg-white/5 text-[#C5A021] border-[#C5A021]/30 hover:bg-[#C5A021]/10'}`}><BookOpen size={14} /> Blueprints</button>
          <button onClick={() => cyRef.current?.layout({ name: 'cose', animate: true, padding: 80 }).run()} className="p-2 px-6 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-[#C5A021]/10 transition-all shadow-lg font-mono">Restore Balance</button>
        </div>
      </div>

      <AnimatePresence>
        {showExamples && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-20 right-8 z-[100] w-72 bg-black/60 backdrop-blur-3xl border border-[#C5A021]/20 rounded-2xl p-4 shadow-2xl">
            <h3 className="text-[10px] font-black text-[#C5A021] uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><LayoutGrid size={14} /> Blueprint Gallery</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => loadExample('starts')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all group">
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-[#C5A021]">Starts with '0'</div>
                <div className="text-[9px] text-white/40 font-mono">Binary alphabet {'{0, 1}'}</div>
              </button>
              <button onClick={() => loadExample('ends')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all group">
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-[#C5A021]">Ends with '1'</div>
                <div className="text-[9px] text-white/40 font-mono">Accepts strings ending in 1</div>
              </button>
              <button onClick={() => loadExample('parity')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all group">
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-[#C5A021]">Parity Checker</div>
                <div className="text-[9px] text-white/40 font-mono">Even/Odd number of 1s</div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow flex min-h-0 overflow-hidden relative">
        <div className="w-80 h-full border-r border-white/5 bg-black/20 backdrop-blur-3xl z-40 flex flex-col p-6 overflow-hidden">
          <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab('inspector')} className={`flex-grow py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'inspector' ? 'bg-[#C5A021] text-black shadow-lg shadow-[#C5A021]/20' : 'text-white/20 hover:text-white/40'}`}>Workbench</button>
            <button onClick={() => setActiveTab('tuple')} className={`flex-grow py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'tuple' ? 'bg-[#C5A021] text-black shadow-lg shadow-[#C5A021]/20' : 'text-white/20 hover:text-white/40'}`}>5-Tuple</button>
          </div>
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar focus:outline-none">
            <AnimatePresence mode="wait">
              {activeTab === 'inspector' ? (
                <motion.div key="inspector" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  {selectedId ? (
                    <div className="space-y-6 text-white/50">
                      <div className="p-4 bg-[#C5A021]/10 border border-[#C5A021]/20 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 text-[#C5A021]/20"><Settings2 size={40} /></div>
                        <span className="text-[8px] font-black text-[#C5A021] uppercase tracking-[0.3em] font-mono">{elements.find(e => e.data.id === selectedId)?.data.source ? 'Path' : 'State'} Inspector</span>
                        <input value={elements.find(e => e.data.id === selectedId)?.data.label || ''} onChange={(e) => renameNode(selectedId, e.target.value)} className="bg-transparent text-xl font-black mt-1 focus:outline-none w-full border-b border-[#C5A021]/30 pb-1 text-white" />
                      </div>
                      {!elements.find(e => e.data.id === selectedId)?.data.source && (
                        <div className="space-y-3">
                          <button onClick={() => ehRef.current.start(cyRef.current?.getElementById(selectedId))} className="w-full flex items-center justify-center gap-3 p-4 bg-[#C5A021] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-2xl font-mono"><ArrowUpRight size={16} /> Start transition</button>
                          <button onClick={() => addSelfLoop(selectedId)} className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all font-mono"><RefreshCcw size={16} /> Add Self-Loop</button>
                        </div>
                      )}
                      <button onClick={() => deleteItems(selectedId)} className="w-full mt-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:bg-red-500/20 transition-all font-mono">Delete Entry</button>
                    </div>
                  ) : (
                    <div className="flex flex-col pt-4">
                      <div className="mb-10 group">
                        <div className="flex items-center gap-3 text-[#C5A021]/60 mb-4 group-focus-within:text-[#C5A021] transition-all">
                          <Zap size={10} fill="currentColor" />
                          <span className="text-[9px] font-black uppercase tracking-[0.6em]">Oracle Architect</span>
                        </div>
                        <div className="relative">
                          <input placeholder="PROMPT THE MACHINE..." className="w-full bg-transparent border-b border-white/10 p-2 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-[#C5A021]/50 placeholder:text-white/5 transition-all" />
                          <button className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#C5A021] transition-all"><ArrowUpRight size={16} /></button>
                        </div>
                      </div>
                      
                      <button onClick={() => addState()} className="w-full py-5 border border-[#C5A021]/30 hover:bg-[#C5A021] hover:text-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] transition-all group overflow-hidden relative">
                         <span className="relative z-10">+ Construct State</span>
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="tuple" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-12 text-white/50 font-mono text-[10px] pb-10 pt-4">
                    <div className="space-y-6">
                      <div>
                        <div className="text-[9px] font-black tracking-[0.5em] text-[#C5A021] uppercase mb-3 opacity-80">States (Q)</div>
                        <div className="pl-2 border-l border-white/5 leading-relaxed tracking-widest">
                           {currentNodes.map(n => n.data.label).join(' // ')}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-[9px] font-black tracking-[0.5em] text-[#C5A021] uppercase mb-3 opacity-80">Alphabet (&Sigma;)</div>
                        <div className="pl-2 border-l border-white/5 tracking-widest">
                           {Array.from(alphabetSet).sort().join(' / ') || 'EMPTY_SET'}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-black tracking-[0.5em] text-[#C5A021] uppercase mb-3 opacity-80">Function (&delta;)</div>
                        <div className="max-h-48 overflow-y-auto pr-2 text-[9px] opacity-40 font-mono scrollbar-hide space-y-1 border-l border-white/5 pl-2">
                          {currentEdges.map(e => (
                            <div key={e.data.id}>({e.data.source}, {e.data.label}) &rarr; {e.data.target}</div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex flex-col gap-6">
                        <div>
                          <span className="text-[#C5A021]/40 font-bold tracking-[0.3em] uppercase block mb-1">Entry (q₀)</span> 
                          <span className="text-white text-[12px] font-black italic tracking-tighter uppercase">{currentNodes.find(n => n.data.isInitial)?.data.label || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[#C5A021]/40 font-bold tracking-[0.3em] uppercase block mb-1">Acceptance (F)</span> 
                          <span className="text-white tracking-widest">{currentNodes.filter(n => n.data.isFinal).map(n => n.data.label).join(', ') || '&empty;'}</span>
                        </div>
                      </div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-grow bg-[#000816] relative overflow-hidden cursor-crosshair">
          <CytoscapeComponent elements={elements} stylesheet={cytoscapeStylesheet} style={{ width: '100%', height: '100%' }} cy={onCyReady} layout={{ name: 'preset' }} />
          <AnimatePresence>
            {menu && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ top: menu.y, left: menu.x }} className="absolute z-[100] w-60 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1">
                <button onClick={() => toggleFinal(menu.id)} className="flex items-center gap-3 w-full p-3 hover:bg-[#C5A021]/10 rounded-xl transition-all font-mono uppercase text-[9px] font-black"><Zap size={14} /> Toggle Acceptance</button>
                <button onClick={() => toggleInitial(menu.id)} className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-xl transition-all font-mono uppercase text-[9px] font-black"><Target size={14} /> Set Initial</button>
                <div className="h-px bg-white/5 my-1" />
                <button onClick={() => deleteItems(menu.id)} className="flex items-center gap-3 w-full p-3 hover:bg-red-500/10 rounded-xl transition-all font-mono uppercase text-[9px] font-black text-red-500"><Trash2 size={14} /> Delete Entry</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex-none h-32 w-full border-t border-white/5 bg-black/60 backdrop-blur-3xl flex items-center px-12 gap-12 z-50">
        <div className="flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 flex items-center gap-2 font-mono"><ShieldCheck size={12} /> Analysis Hub</span>
            <AnimatePresence>
              {finished && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-2xl ${isAccepted ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                  {isAccepted ? <><CheckCircle2 size={12} /> Accepted</> : <><XCircle size={12} /> Rejected</>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#C5A021] transition-all">
            <input value={inputString} onChange={(e) => { setInputString(e.target.value); setSimulationSteps([]); setCurrentStepIndex(0); }} placeholder="0110..." className="flex-grow bg-transparent p-5 text-sm font-mono tracking-[0.6em] text-white focus:outline-none" />
            <button onClick={startSimulation} className="bg-[#C5A021] text-black px-10 font-black uppercase tracking-widest text-[10px] shadow-lg font-mono">Verify</button>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center gap-4">
          <button onClick={() => { setIsPlaying(false); setCurrentStepIndex(p => Math.max(0, p - 1)); }} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:border-[#C5A021]/40 transition-all font-mono text-white/40 hover:text-white"><RotateCcw size={20} /></button>
          <div className="flex items-center justify-center w-full max-w-[600px]">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2 px-1">
              {inputString.split('').map((char, i) => (
                <div key={i} className={`min-w-[48px] h-14 rounded-xl flex items-center justify-center text-lg font-mono font-black border transition-all duration-300 ${i === currentStepIndex - 1 ? 'bg-[#C5A021] border-[#C5A021] scale-110 text-black shadow-2xl' : (i < currentStepIndex - 1 ? 'bg-white/10 text-white/40' : 'bg-white/5 text-white/10')}`}>{char}</div>
              ))}
            </div>
          </div>
          <button onClick={() => setIsPlaying(!isPlaying)} className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all font-mono shadow-lg ${isPlaying ? 'bg-[#C5A021] text-black border-[#C5A021]' : 'bg-white/5 text-white border-white/10'}`}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DFAWorkspace;

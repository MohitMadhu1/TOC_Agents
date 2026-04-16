import React, { useState, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import { RotateCcw, SkipForward, Zap, Trash2, ShieldCheck, Target, ArrowUpRight, RefreshCcw, Settings2, AlertCircle, LayoutGrid, BookOpen, Play, Pause, CheckCircle2, XCircle, GitBranch, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIService } from '../utils/aiService';

// Plugin registered globally in main.tsx

const NFAWorkspace: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [elements, setElements] = useState<cytoscape.ElementDefinition[]>([
    { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false, width: 50, height: 50 }, position: { x: 300, y: 300 } }
  ]);
  const [inputString, setInputString] = useState('');
  const [simulationSteps, setSimulationSteps] = useState<{ id: string, parents: string[] }[][]>([]); 
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [menu, setMenu] = useState<{ x: number, y: number, id: string, type: 'node' | 'edge' } | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'quantum' | 'tuple'>('inspector');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [oracleInput, setOracleInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const cyRef = useRef<cytoscape.Core | null>(null);
  const ehRef = useRef<any>(null);

  const cytoscapeStylesheet: any[] = [
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
      },
    },
    {
      selector: '.epsilon-dash',
        style: {
          'line-color': '#00F0FF',
          'target-arrow-color': '#00F0FF',
          'width': 4,
          'line-style': 'dashed'
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
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 }
      }));

      const newEdges = result.edges.map((e, idx) => ({
        data: { id: `edge-${idx}-${Date.now()}`, source: e.source, target: e.target, label: e.label }
      }));

      setElements([...newNodes, ...newEdges]);
      setOracleInput('');
      
      setTimeout(() => {
        if (cyRef.current) {
          cyRef.current.layout({ name: 'cose', animate: true }).run();
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
        // NFA ALLOWS MULTIPLE TRANSITIONS - DFA VIOLATION GUARD REMOVED
        const existingEdgeBetweenNodes = prev.find(e => e.data.source === source && e.data.target === target);
        if (existingEdgeBetweenNodes) {
            const chars = existingEdgeBetweenNodes.data.label.split(',').map((s: string) => s.trim());
            if (chars.includes(cleanChar)) return prev; // Already exists
            const newLabel = [...chars, cleanChar].sort().join(', ');
            return prev.map(e => e.data.id === existingEdgeBetweenNodes.data.id ? { ...e, data: { ...e.data, label: newLabel } } : e);
        }

        const id = `edge-${source}-${target}-${Date.now()}`;
        return [...prev, { data: { id, source, target, label: cleanChar } }];
    });
  };

  const loadExample = (type: 'ends-with-01' | 'contains-11') => {
    let newElements: cytoscape.ElementDefinition[] = [];
    if (type === 'ends-with-01') {
        newElements = [
            { data: { id: 'q0', label: 'Start', isInitial: true, isFinal: false, width: 50, height: 50 }, position: { x: 200, y: 300 } },
            { data: { id: 'q1', label: 'Saw 0', isInitial: false, isFinal: false, width: 50, height: 50 }, position: { x: 400, y: 300 } },
            { data: { id: 'q2', label: 'Saw 01', isInitial: false, isFinal: true, width: 50, height: 50 }, position: { x: 600, y: 300 } },
            { data: { id: 'e1', source: 'q0', target: 'q0', label: '0, 1' } },
            { data: { id: 'e2', source: 'q0', target: 'q1', label: '0' } },
            { data: { id: 'e3', source: 'q1', target: 'q2', label: '1' } },
        ];
    } else if (type === 'contains-11') {
        newElements = [
            { data: { id: 'q0', label: 'Q0', isInitial: true, isFinal: false, width: 50, height: 50 }, position: { x: 200, y: 300 } },
            { data: { id: 'q1', label: 'Q1', isInitial: false, isFinal: false, width: 50, height: 50 }, position: { x: 400, y: 300 } },
            { data: { id: 'q2', label: 'Q2', isInitial: false, isFinal: true, width: 50, height: 50 }, position: { x: 600, y: 300 } },
            { data: { id: 'e1', source: 'q0', target: 'q0', label: '0, 1' } },
            { data: { id: 'e2', source: 'q0', target: 'q1', label: '1' } },
            { data: { id: 'e3', source: 'q1', target: 'q2', label: '1' } },
            { data: { id: 'e4', source: 'q2', target: 'q2', label: '0, 1' } },
        ];
    }
    setElements(newElements);
    setShowExamples(false);
    setSelectedId(null);
    setTimeout(() => { if (cyRef.current) cyRef.current.fit(); }, 100);
  };

  const getEpsilonClosure = (states: string[], edges: any[]) => {
    const closure = new Set(states);
    const stack = [...states];
    while (stack.length > 0) {
        const s = stack.pop()!;
        const epsilonEdges = edges.filter(e => e.data.source === s && (e.data.label === 'e' || e.data.label.includes('ε')));
        epsilonEdges.forEach(e => {
            if (!closure.has(e.data.target)) {
                closure.add(e.data.target);
                stack.push(e.data.target);
            }
        });
    }
    return Array.from(closure);
  };

  const startSimulation = () => {
    const edges = elements.filter(e => e.data.source);
    const nodes = elements.filter(e => !e.data.source);
    let initialNode = nodes.find(n => n.data.isInitial);
    if (!initialNode) { alert("Mark an Initial State first."); return; }
    
    // NFA: SET OF ACTIVE STATES WITH PARENT TRACKING
    const steps: { id: string, parents: string[] }[][] = [];
    let currentSet = getEpsilonClosure([initialNode.data.id!], edges).map(id => ({ id, parents: [] }));
    steps.push(currentSet);

    const inputChars = inputString.split('');
    inputChars.forEach((char, charIdx) => {
        const nextSetMap = new Map<string, string[]>(); // TargetID -> Array of sources
        currentSet.forEach(sObj => {
            const matchingEdges = edges.filter(e => {
                if (e.data.source !== sObj.id) return false;
                return e.data.label.split(',').map((s: string) => s.trim()).includes(char);
            });
            matchingEdges.forEach(e => {
                const parents = nextSetMap.get(e.data.target) || [];
                if (!parents.includes(sObj.id)) parents.push(sObj.id);
                nextSetMap.set(e.data.target, parents);
            });
        });

        const nextFlatIds = Array.from(nextSetMap.keys());
        const closedIds = getEpsilonClosure(nextFlatIds, edges);
        
        // Build the step with full parent context
        const step = closedIds.map(id => {
            // A node in closedSet was reached either directly or via epsilon from direct nodes
            // For simplicity, we track the primary trigger parents from the previous level
            let parents: string[] = nextSetMap.get(id) || [];
            if (parents.length === 0) {
                // Was likely reached via Epsilon. Find which direct nodes reach this via e-closure.
                nextFlatIds.forEach(fid => {
                    if (getEpsilonClosure([fid], edges).includes(id)) {
                        const directParents = nextSetMap.get(fid) || [];
                        directParents.forEach(dp => { if (!parents.includes(dp)) parents.push(dp); });
                    }
                });
            }
            return { id, parents };
        });

        steps.push(step);
        currentSet = step;
    });

    setSimulationSteps(steps);
    setCurrentStepIndex(0);
    setIsPlaying(true);

    // Epsilon animation trigger (Simulate)
    edges.forEach(e => {
        if (e.data.label === 'e' || e.data.label.includes('ε')) {
            cyRef.current?.getElementById(e.data.id).flashClass('epsilon-dash', 1000);
        }
    });
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
        interval = setInterval(() => {
            setCurrentStepIndex(p => {
                if (p >= simulationSteps.length - 1) { setIsPlaying(false); return p; }
                return p + 1;
            });
        }, 650);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulationSteps.length]);

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.nodes().data('active', false);
      const currentActiveStates = simulationSteps[currentStepIndex];
      if (currentActiveStates) {
        currentActiveStates.forEach(obj => {
            cyRef.current?.getElementById(obj.id).data('active', true);
        });
      }
    }
  }, [currentStepIndex, simulationSteps]);

  const onCyReady = (cy: cytoscape.Core) => {
    cyRef.current = cy;
    cy.minZoom(0.1); cy.maxZoom(4.0);
    (cy as any).options().wheelSensitivity = 0.12;
    cy.on('style', 'node', (evt) => { if (evt.target.width() !== 50 || evt.target.height() !== 50) evt.target.style({ 'width': 50, 'height': 50 }); });

    if (ehRef.current) ehRef.current.destroy();
    ehRef.current = (cy as any).edgehandles({ canConnect: () => true, hoverDelay: 50, snap: true, handleOutside: true });
    
    cy.off('ehcomplete');
    cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
      addedEdge.remove();
      const symbol = prompt("Assign Transition (use 'e' for ε):");
      if (!symbol) return;
      addTransition(sourceNode.id(), targetNode.id(), symbol);
    });

    cy.off('tap');
    cy.on('tap', 'node', (evt) => { setSelectedId(evt.target.id()); setMenu(null); });
    cy.on('tap', 'edge', (evt) => { setSelectedId(evt.target.id()); setMenu(null); });
    cy.on('tap', (evt) => { if (evt.target === cy) { setMenu(null); setSelectedId(null); } });
    
    cy.off('cxttap');
    cy.on('cxttap', 'node', (evt) => { setSelectedId(evt.target.id()); setMenu({ x: evt.renderedPosition.x, y: evt.renderedPosition.y, id: evt.target.id(), type: 'node' }); });
    
    cy.off('viewport');
    cy.on('viewport', () => setMenu(null));
    
    cy.off('dblclick');
    cy.on('dblclick', (evt) => { if (evt.target === cy) { addState(evt.position); } });
  };

  const currentNodes = elements.filter(e => !e.data.source);
  const currentEdges = elements.filter(e => e.data.source);
  const alphabetSet = new Set<string>();
  currentEdges.forEach(e => { e.data.label.split(',').map((s: string) => s.trim()).forEach((c: string) => { if (c && c !== 'e') alphabetSet.add(c); }); });

  const finished = currentStepIndex === simulationSteps.length - 1 && simulationSteps.length > 0;
  const lastStates = simulationSteps.length > 0 ? simulationSteps[simulationSteps.length - 1] : [];
  const isAccepted = finished && lastStates.some(obj => currentNodes.find(n => n.data.id === obj.id)?.data.isFinal);

  // BACKTRACKING: FIND SUCCESS PATHS
  const getSuccessPaths = () => {
    if (simulationSteps.length === 0) return new Set<string>();
    const successNodes = new Set<string>();
    const lastLevel = simulationSteps[simulationSteps.length - 1];
    let currentLevelTargets = lastLevel.filter(p => currentNodes.find(n => n.data.id === p.id)?.data.isFinal).map(p => p.id);

    for (let i = simulationSteps.length - 1; i >= 0; i--) {
        const levelNodes = simulationSteps[i];
        const nextTargetParents = new Set<string>();
        levelNodes.forEach(node => {
            if (currentLevelTargets.includes(node.id)) {
                successNodes.add(`${i}-${node.id}`);
                node.parents.forEach(p => nextTargetParents.add(p));
            }
        });
        currentLevelTargets = Array.from(nextTargetParents);
    }
    return successNodes;
  };
  const successPathNodes = getSuccessPaths();

  return (
    <div className="w-full h-screen bg-[#000816] flex flex-col overflow-hidden text-white font-sans relative">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex-none h-16 w-full border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/30 hover:text-[#C5A021] transition-all mr-2">
            <RotateCcw size={18} className="-scale-x-100" />
          </button>
          <div className="text-xl font-black tracking-tighter uppercase">NFA <span className="text-[#C5A021]">Architect</span></div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Non-Deterministic Engine / unit_01</div>
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
              <button onClick={() => loadExample('ends-with-01')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all group">
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-[#C5A021]">Ends with '01'</div>
                <div className="text-[9px] text-white/40 font-mono">Demonstrates backtracking</div>
              </button>
              <button onClick={() => loadExample('contains-11')} className="w-full text-left p-3 bg-white/5 hover:bg-[#C5A021]/10 border border-white/5 rounded-xl transition-all group">
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-[#C5A021]">Contains '11'</div>
                <div className="text-[9px] text-white/40 font-mono">Parallel path simulation</div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow flex min-h-0 overflow-hidden relative">
        <div className="w-80 h-full border-r border-white/5 bg-black/20 backdrop-blur-3xl z-40 flex flex-col p-6 overflow-hidden">
          <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab('inspector')} className={`flex-grow py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'inspector' ? 'bg-[#C5A021] text-black shadow-lg shadow-[#C5A021]/20' : 'text-white/20 hover:text-white/40'}`}>Workbench</button>
            <button onClick={() => setActiveTab('quantum')} className={`flex-grow py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'quantum' ? 'bg-[#C5A021] text-black shadow-lg shadow-[#C5A021]/20' : 'text-white/20 hover:text-white/40'}`}>Quantum</button>
            <button onClick={() => setActiveTab('tuple')} className={`flex-grow py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'tuple' ? 'bg-[#C5A021] text-black shadow-lg shadow-[#C5A021]/20' : 'text-white/20 hover:text-white/40'}`}>NFA Model</button>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar focus:outline-none">
            <AnimatePresence mode="wait">
              {activeTab === 'inspector' ? (
                <motion.div key="inspector" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                  {selectedId ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-[#C5A021]/10 border border-[#C5A021]/20 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 text-[#C5A021]/20"><Settings2 size={40} /></div>
                        <span className="text-[8px] font-black text-[#C5A021] uppercase tracking-[0.3em] font-mono">{elements.find(e => e.data.id === selectedId)?.data.source ? 'Path' : 'State'} Inspector</span>
                        <input value={elements.find(e => e.data.id === selectedId)?.data.label || ''} onChange={(e) => renameNode(selectedId, e.target.value)} className="bg-transparent text-xl font-black mt-1 focus:outline-none w-full border-b border-[#C5A021]/30 pb-1 text-white" />
                      </div>
                      {!elements.find(e => e.data.id === selectedId)?.data.source && (
                        <div className="space-y-3">
                          <button onClick={() => ehRef.current.start(cyRef.current?.getElementById(selectedId))} className="w-full flex items-center justify-center gap-3 p-4 bg-[#C5A021] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-2xl font-mono"><ArrowUpRight size={16} /> New branching</button>
                          <button onClick={() => { const s = prompt("Symbol (use 'e' for ε):"); if(s) addTransition(selectedId, selectedId, s); }} className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all font-mono"><RefreshCcw size={16} /> Add Self-Loop</button>
                        </div>
                      )}
                      <button onClick={() => deleteItems(selectedId)} className="w-full mt-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:bg-red-500/20 transition-all font-mono">Delete Entry</button>
                    </div>
                  ) : (
                    <div className="flex flex-col pt-4">
                      <div className="mb-10 group">
                        <div className="flex items-center gap-3 text-[#C5A021]/60 mb-4 group-focus-within:text-[#C5A021] transition-all">
                          <Zap size={10} fill="currentColor" />
                          <span className="text-[9px] font-black uppercase tracking-[0.6em]">Oracle Nexus</span>
                        </div>
                        <div className="relative">
                          <input 
                            value={oracleInput}
                            onChange={(e) => setOracleInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleOracleInquiry()}
                            placeholder={isGenerating ? "CONSULTING ORACLE..." : "NEURAL PROMPT..."} 
                            disabled={isGenerating}
                            className="w-full bg-transparent border-b border-white/10 p-2 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-[#C5A021]/50 placeholder:text-white/5 transition-all disabled:opacity-50" 
                          />
                          <button 
                            onClick={handleOracleInquiry}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all ${isGenerating ? 'text-[#C5A021] animate-spin' : 'text-white/20 hover:text-[#C5A021]'}`}
                          >
                            {isGenerating ? <Loader2 size={16} /> : <ArrowUpRight size={16} />}
                          </button>
                        </div>
                      </div>
                      
                      <button onClick={() => addState()} className="w-full py-5 border border-[#C5A021]/30 hover:bg-[#C5A021] hover:text-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] transition-all group overflow-hidden relative">
                         <span className="relative z-10">+ Construct NFA Node</span>
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'quantum' ? (
                <motion.div key="quantum" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-[10px] font-black tracking-[0.4em] text-[#C5A021] uppercase">Decision Tree</h3>
                    <div className="flex gap-2 text-[7px] font-black uppercase">
                        <span className="text-green-400">Accept</span>
                        <span className="text-white/20">|</span>
                        <span className="text-white/40">Active</span>
                    </div>
                  </div>
                  
                  {simulationSteps.length > 0 ? (
                    <div className="space-y-2 pr-2">
                      {simulationSteps.map((set, i) => {
                        const isCurrentActiveLevel = i === currentStepIndex;
                        return (
                          <div key={i} className="flex flex-col items-center relative">
                            {/* Connection Stem */}
                            {i > 0 && <div className={`w-0.5 h-4 mb-2 transition-colors duration-500 ${isCurrentActiveLevel ? 'bg-[#C5A021]' : 'bg-white/10'}`} />}
                            
                            <div className={`flex flex-col gap-2 p-4 w-full rounded-2xl relative overflow-hidden transition-all duration-500 border ${
                              isCurrentActiveLevel 
                              ? 'bg-[#C5A021]/20 border-[#C5A021] shadow-[0_0_40px_rgba(197,160,33,0.15)] ring-1 ring-[#C5A021]/30' 
                              : 'bg-white/[0.03] border-white/10 opacity-80 hover:opacity-100'
                            }`}>
                              <div className={`absolute -top-2 -right-2 p-4 text-[24px] font-black italic select-none transition-colors ${isCurrentActiveLevel ? 'text-[#C5A021]/30' : 'text-white/5'}`}>L{i}</div>
                              
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[8px] font-black uppercase tracking-[0.3em] transition-colors ${isCurrentActiveLevel ? 'text-[#C5A021] drop-shadow-[0_0_8px_rgba(197,160,33,0.5)]' : 'text-white/40'}`}>
                                  {isCurrentActiveLevel ? 'Current Wavefront' : `Expansion Level ${i}`}
                                </span>
                                {isCurrentActiveLevel && <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-[#C5A021]" />}
                              </div>

                              <div className="flex gap-2 flex-wrap relative z-10">
                                {set.map(obj => {
                                    const node = currentNodes.find(n => n.data.id === obj.id);
                                    const isPartOfSuccessPath = successPathNodes.has(`${i}-${obj.id}`);
                                    
                                    return (
                                      <div key={obj.id} className={`px-4 py-2 rounded-xl text-[10px] font-mono border transition-all duration-500 ${
                                        isCurrentActiveLevel 
                                        ? 'bg-[#C5A021] text-black border-white/40 font-black shadow-[0_4px_15px_rgba(0,0,0,0.3)] scale-105' 
                                        : (isPartOfSuccessPath ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/50 shadow-[0_0_20px_rgba(0,255,136,0.2)] font-bold' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30')
                                      }`}>
                                        {node?.data.label}
                                      </div>
                                    );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center opacity-20 px-8">
                       <GitBranch size={40} className="mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Simulation Data</p>
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
                        <div className="text-[9px] font-black tracking-[0.5em] text-[#C5A021] uppercase mb-3 opacity-80">Transitions (&delta;)</div>
                        <div className="max-h-48 overflow-y-auto pr-2 text-[9px] opacity-40 font-mono scrollbar-hide space-y-1 border-l border-white/5 pl-2">
                          {currentEdges.map(e => (
                             <div key={e.data.id}>({e.data.source}, {e.data.label}) &rarr; &#123; {e.data.target} &#125;</div>
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
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 mt-auto">
            <div className="grid grid-cols-2 gap-4 text-[9px] font-bold text-white/40 uppercase tracking-tighter font-mono">
              <div className="text-center">Double-Click<br /><span className="text-white/60">New State</span></div>
              <div className="text-center">Right-Click<br /><span className="text-white/40">Item Menu</span></div>
            </div>
          </div>
        </div>

        <div className="flex-grow bg-[#000816] relative overflow-hidden cursor-crosshair">
          <CytoscapeComponent elements={elements} stylesheet={cytoscapeStylesheet} style={{ width: '100%', height: '100%' }} cy={(cy: any) => onCyReady(cy)} layout={{ name: 'preset' }} />
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
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 flex items-center gap-3 font-mono"><GitBranch size={12} className="text-[#C5A021]" /> Simulation Hub</span>
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
          <div className="flex items-center justify-center w-full max-w-[600px] relative">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2 px-1">
                <div className={`min-w-[48px] h-14 rounded-xl flex items-center justify-center text-[10px] font-mono font-black border transition-all duration-300 ${currentStepIndex === 0 ? 'bg-white/20 border-white text-white' : 'bg-white/5 text-white/10 border-white/5'}`}>&epsilon;</div>
                {inputString.split('').map((char, i) => (
                    <div key={i} className={`min-w-[48px] h-14 rounded-xl flex items-center justify-center text-lg font-mono font-black border transition-all duration-300 ${i === currentStepIndex - 1 ? 'bg-[#C5A021] border-[#C5A021] scale-110 text-black shadow-2xl' : (i < currentStepIndex - 1 ? 'bg-white/10 text-white/40' : 'bg-white/5 text-white/10')}`}>{char}</div>
                ))}
            </div>
          </div>
          <button onClick={() => setIsPlaying(!isPlaying)} className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all font-mono shadow-lg ${isPlaying ? 'bg-[#C5A021] text-black border-[#C5A021]' : 'bg-white/5 text-white border-white/10'}`}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={() => { setIsPlaying(false); setCurrentStepIndex(p => Math.min(p + 1, simulationSteps.length - 1)); }} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:border-[#C5A021]/40 transition-all font-mono text-white/40 hover:text-white"><SkipForward size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default NFAWorkspace;

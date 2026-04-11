import type { Node, Edge } from '@xyflow/react';

export interface SimulationStep {
  currentStateId: string | string[]; // Single for DFA, Array for NFA
  symbol: string;
  nextStateId: string | string[];
}

/**
 * Enhanced Automata Engine 
 * Supports both DFA and NFA (Parallel Simulation)
 */

// Helper to get epsilon closure for NFA
export const getEpsilonClosure = (stateIds: string[], edges: Edge[]): string[] => {
  const closure = new Set(stateIds);
  const stack = [...stateIds];

  while (stack.length > 0) {
    const current = stack.pop()!;
    edges.forEach(edge => {
      if (edge.source === current && (edge.label === 'ε' || edge.label === 'epsilon' || edge.label === '')) {
        if (!closure.has(edge.target)) {
          closure.add(edge.target);
          stack.push(edge.target);
        }
      }
    });
  }
  return Array.from(closure);
};

export const simulateAutomata = (
  nodes: Node[],
  edges: Edge[],
  input: string,
  isNFA: boolean = false
): SimulationStep[] => {
  const steps: SimulationStep[] = [];
  
  // Initial states
  let currentStates = nodes.filter(n => n.data.isInitial).map(n => n.id);
  
  // For NFA, always start with epsilon closure
  if (isNFA) {
    currentStates = getEpsilonClosure(currentStates, edges);
  }

  for (const symbol of input) {
    const nextStates = new Set<string>();
    
    currentStates.forEach(stateId => {
      edges.forEach(edge => {
        if (edge.source === stateId && edge.label === symbol) {
          nextStates.add(edge.target);
        }
      });
    });

    let nextStateArray = Array.from(nextStates);
    
    if (isNFA) {
      nextStateArray = getEpsilonClosure(nextStateArray, edges);
    }

    steps.push({
      currentStateId: isNFA ? currentStates : currentStates[0],
      symbol,
      nextStateId: isNFA ? nextStateArray : nextStateArray[0]
    });

    currentStates = nextStateArray;
    if (currentStates.length === 0 && !isNFA) break; // DFA trap
  }

  return steps;
};

// Layout Engine (Dagre)
import dagre from 'dagre';

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 150 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 75,
      },
    };
  });

  return { nodes: newNodes, edges };
};

import { simulateDFA, AutomataState, AutomataTransition } from './automataLogic';

// 1. Definition: DFA for even number of 0s over {0,1}
const states: AutomataState[] = [
  { id: 'even', isInitial: true, isFinal: true },
  { id: 'odd', isInitial: false, isFinal: false }
];

const transitions: AutomataTransition[] = [
  { from: 'even', to: 'odd', symbol: '0' },
  { from: 'odd', to: 'even', symbol: '0' },
  { from: 'even', to: 'even', symbol: '1' },
  { from: 'odd', to: 'odd', symbol: '1' }
];

const testInput = (input: string) => {
  const steps = simulateDFA(states, transitions, input);
  const finalStateId = steps[steps.length - 1].currentStateId;
  const isAccepted = states.find(s => s.id === finalStateId)?.isFinal;
  console.log(`Input: "${input}" | Final State: ${finalStateId} | Accepted: ${isAccepted}`);
  return isAccepted;
};

console.log("--- DFA VALIDATION START ---");
testInput("00");    // Expected: true
testInput("000");   // Expected: false
testInput("111");   // Expected: true
testInput("10101"); // Expected: false
testInput("");      // Expected: true (Empty string on initial+final state)
console.log("--- DFA VALIDATION COMPLETE ---");

# TOC Project Master Plan: "The Intelligent Automata Studio"

## Phase 1: Finite Automata (Unit 1 & 2)
- **DFA/NFA Engine:** 
  - Graph-based Editor with drag-and-drop states and transitions.
  - Parallel NFA simulation and $\epsilon$-closure highlighting.
  - NFA to DFA Subset Construction Wizard.
- **Minimization Tool:** 
  - Table-filling algorithm (Myhill-Nerode) visualizer to merge redundant states.
- **Regex & Language Layer:**
  - Regex Playground with live string highlighting.
  - Bi-directional conversion: Regular Expression $\leftrightarrow$ Finite Automata.
  - **The Pumping Lemma Duel:** Interactive turn-based game against an AI adversary.

## Phase 2: Grammars & PDAs (Unit 3 & 4)
- **CFG Studio:**
  - Production rule editor with automatic Parse Tree generation.
  - Grammar Simplification: Step-by-step removal of Null, Unit, and Useless productions.
  - Converter: CFG $\to$ Chomsky Normal Form (CNF).
  - Ambiguity Detector: Visual side-by-side parse tree comparison.
- **Pushdown Automata (PDA):**
  - Graph UI with transition rules including stack operations.
  - **Live Stack Animation:** Vertical stack that pushes/pops symbols in real-time.
  - CFG to PDA Generator.

## Phase 3: Complexity & Turing Machines (Unit 5 & 6)
- **Turing Machine Desktop:**
  - Horizontal infinite-scrolling tape with a moving mechanical head.
  - Pre-built library: Binary Addition, Palindrome Matching, and Multiplier machines.
  - Instantaneous Description (ID) history logs.
- **Theory Knowledge Graph:**
  - Interactive diagram of Complexity Classes (P, NP, NP-Complete, NP-Hard).
  - **The Halting Paradox:** A visual animation explaining why the Halting Problem is undecidable.

## Phase 4: The AI Agent Layer (Global Features)
- **LangChain Integration:**
  - **NL-to-Theory:** "Create a DFA that accepts strings ending in '01'."
  - **The Correctness Coach:** AI agents that analyze your machines and suggest fixes or find counter-examples.
  - **Theory Explainer:** A sidebar agent that explains specific mathematical concepts as you build them.

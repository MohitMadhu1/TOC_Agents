# 🌌 Intelligent Automata Studio
### *The Ultimate Laboratory for Theory of Computation*

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://toc-agents.vercel.app)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**Live Demo:** [https://toc-agents.vercel.app](https://toc-agents.vercel.app)

---

## 🔬 Project Overview
**Intelligent Automata Studio** is a high-fidelity, AI-integrated workbench designed to transform the abstract concepts of formal languages and automata theory into a tangible, interactive laboratory. From synthesizing machines with natural language to visualizing the mechanical head of a Turing Machine, this studio is built for both rigorous study and creative exploration.

---

## 🏛️ The Research Wings

### 🔘 Station 1: Finite Automata & The Oracle
*   **DFA/NFA Engine:** A graph-based neural editor for building and simulating machines with real-time epsilon-closure highlighting.
*   **The Oracle Nexus:** Synthesize complex DFA/NFA formal 5-tuples directly from natural language prompts (e.g., *"A machine that accepts binary strings with at least three 1s"*).
*   **Conversion Lab:** Step-by-step subset construction wizard to map NFA state sets to deterministic equivalents.
*   **Minimizer Suite:** Full implementation of the Myhill-Nerode Table-Filling algorithm to produce the most efficient version of any DFA.

### 🧪 Station 2: Regular Expressions & Translators
*   **Regex Playground:** An AI-enhanced console that matches, explains, and optimizes regex patterns.
*   **Algebraic Translator:** 
    *   **Thompson’s Wing:** Automated RE → NFA conversion.
    *   **Arden’s Wing:** Algebraic state elimination to extract RE from any FA.

### 🏗️ Station 3: Turing Machines & Complexity
*   **Turing Studio:** A high-precision simulation of Turing’s 1936 vision, featuring a horizontal infinite-scrolling tape and mechanical head animations.
*   **Complexity Lab:** 
    *   **Euler Hierarchy:** Visual mapping of P, NP, NP-Complete, and NP-Hard classes.
    *   **The Halting Paradox:** Interactive proof demonstrating the fundamental limits of computation.

---

## 🧠 Global AI Intelligence
*   **AI Professor:** A context-aware assistant that understands your current workspace (nodes, transitions, tape symbols) and provides real-time mathematical guidance.
*   **Correctness Coach:** Automatically audits your machine logic to identify unreachable states, missing transitions, or non-deterministic glitches.

---

## 🛠️ Technical Architecture
*   **Frontend:** React 18 + Vite (for lightning-fast HMR)
*   **Styling:** Vanilla CSS with a custom **Gold & Obsidian** design system.
*   **Animation:** Framer Motion (for physics-based UI transitions).
*   **Graph Engine:** Cytoscape.js (integrated with Dagre & Cose layouts).
*   **AI Core:** Google Gemini Flash 1.5 (Serverless proxy via Vercel Edge).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Local Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/MohitMadhu1/TOC_Agents.git
   cd TOC_Agents/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env.local` file and add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```

4. **Launch the Lab:**
   ```bash
   npm run dev
   ```

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with 🧪 and 🌌 by Mohit J Madhu**

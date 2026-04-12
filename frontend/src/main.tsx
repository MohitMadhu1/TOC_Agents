import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import dagre from 'cytoscape-dagre';

// Global Plugin Registration
try {
    cytoscape.use(edgehandles);
    cytoscape.use(dagre);
} catch (e) {
    console.warn("Cytoscape plugin registration handled.");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

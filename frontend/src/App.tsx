import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FluidBackground from './components/FluidBackground';
import DFAWorkspace from './components/DFAWorkspace';
import NFAWorkspace from './components/NFAWorkspace';
import ConversionLab from './components/ConversionLab';
import MinimizerSuite from './components/MinimizerSuite';
import UnitHub from './components/UnitHub';
import Phase1Dashboard from './components/Phase1Dashboard';

function App() {
  const [view, setView] = useState<'landing' | 'hub' | 'phase1_lab' | 'studio' | 'nfa_studio' | 'conversion' | 'minimizer'>('landing');

  return (
    <div className="relative min-h-screen w-full bg-transparent text-white overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-transparent"
          >
            <FluidBackground />
            <main className="z-10 flex flex-col items-center text-center w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-none mb-4">
                  AUTOMATA
                </h1>
                
                <svg width="600" height="160" viewBox="0 0 600 160" className="md:w-[800px] md:h-[200px]">
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#806226" />
                      <stop offset="50%" stopColor="#C5A021" />
                      <stop offset="100%" stopColor="#806226" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <text 
                    x="50%" 
                    y="70%" 
                    textAnchor="middle" 
                    fill="url(#goldGradient)" 
                    filter="url(#glow)"
                    className="text-[120px] font-black tracking-tighter uppercase"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    STUDIO
                  </text>
                </svg>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2.5, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8"
              >
                <button 
                  onClick={() => setView('hub')}
                  className="gold-button px-16 py-6 font-black uppercase text-xs tracking-[0.5em] rounded-full transition-all duration-700 hover:scale-110 active:scale-95 shadow-2xl"
                >
                  Enter Repository
                </button>
              </motion.div>
            </main>

            <nav className="absolute top-0 w-full p-10 px-24 flex justify-between items-center z-20">
              <div className="text-xl font-bold tracking-tighter uppercase text-white hover:text-[#C5A021] transition-colors">
                STUDIO<span className="text-[#C5A021]">.</span>
              </div>
              <div className="flex gap-16 text-[10px] font-black underline-offset-8 uppercase tracking-[0.6em] text-white/30">
                <a href="#" className="hover:text-[#C5A021] transition-all">UNIT</a>
                <a href="#" className="hover:text-[#D4AF37] transition-all">DOCS</a>
                <a href="#" className="hover:text-[#D4AF37] transition-all">GITHUB</a>
              </div>
            </nav>

            <footer className="absolute bottom-12 text-[9px] uppercase tracking-[0.6em] text-white/20 z-20 w-full text-center font-bold">
              Automata Engine v1.0
            </footer>
          </motion.div>
        )}

        {view === 'hub' && (
          <motion.div
            key="hub"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6 }}
            className="w-full min-h-screen"
          >
            <UnitHub onSelectUnit={() => setView('phase1_lab')} />
          </motion.div>
        )}

        {view === 'phase1_lab' && (
          <motion.div
            key="phase1_lab"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="w-full min-h-screen"
          >
            <Phase1Dashboard 
              onBack={() => setView('hub')} 
              onLaunchDFA={() => setView('studio')}
              onLaunchNFA={() => setView('nfa_studio')}
              onLaunchConversion={() => setView('conversion')}
              onLaunchMinimizer={() => setView('minimizer')}
            />
          </motion.div>
        )}

        {view === 'studio' && (
          <motion.div
            key="studio"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-screen"
          >
            <DFAWorkspace onBack={() => setView('phase1_lab')} />
          </motion.div>
        )}

        {view === 'nfa_studio' && (
          <motion.div
            key="nfa_studio"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-screen"
          >
            <NFAWorkspace onBack={() => setView('phase1_lab')} />
          </motion.div>
        )}

        {view === 'conversion' && (
          <motion.div
            key="conversion"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-screen"
          >
            <ConversionLab onBack={() => setView('phase1_lab')} />
          </motion.div>
        )}

        {view === 'minimizer' && (
          <motion.div
            key="minimizer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-screen"
          >
            <MinimizerSuite onBack={() => setView('phase1_lab')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

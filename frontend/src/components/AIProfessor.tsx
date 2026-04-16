import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Compass, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AIService } from '../utils/aiService';

interface AIProfessorProps {
  context: string;
}

const AIProfessor: React.FC<AIProfessorProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;
    
    const userMsg = query;
    setQuery('');
    const newHistory = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const ai = new AIService();
      const geminiHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await ai.chat(userMsg, geminiHistory, { activeContext: context });
      setMessages([...newHistory, { role: 'model', text: response }]);
    } catch (error: any) {
      setMessages([...newHistory, { role: 'model', text: "Forgive me, my neural pathways are momentarily obstructed. " + error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ── MINIMALIST TRIGGER ── */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-12 right-12 z-[200] flex items-center gap-4 group"
        >
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-[#C5A021] transition-colors">Invoke</div>
            <div className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-0.5">Lab Assistant</div>
          </div>
          <div className="w-16 h-16 bg-[#000816] border border-[#C5A021]/30 rounded-full flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[#C5A021]/5 animate-pulse" />
             <Sparkles size={24} className="text-[#C5A021] relative z-10" />
          </div>
        </motion.button>
      )}

      {/* ── THE KNOWLEDGE MONOLITH ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Global Dimmer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#000816]/60 backdrop-blur-sm z-[201]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-[480px] z-[202] bg-[#000816] shadow-[-20px_0_100px_rgba(0,0,0,0.5)] border-l border-[#C5A021]/20 flex flex-col select-text"
            >
              {/* Subtle Gold Grain Overlay - Moved to background z-index */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

              {/* Content wrapper to stay above grain */}
              <div className="relative z-10 flex flex-col h-full">

              {/* Header */}
              <div className="p-12 pb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#C5A021] flex items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-2 h-2 bg-[#C5A021] rounded-full shadow-[0_0_15px_#C5A021]" 
                    />
                  </div>
                  <div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#C5A021]">AI Lab Assistant</h2>
                    <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1 italic">Automata Studio Companion</div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-12 space-y-12 py-8 custom-scrollbar">
                {/* Introduction Section - Hide after first message */}
                {messages.length === 0 && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Compass size={14} className="text-[#C5A021]/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Current Anchor</span>
                    </div>
                    <h3 className="text-3xl font-black italic tracking-tighter text-white/90 leading-tight">
                      Understanding the <span className="text-[#C5A021]">{context}</span>
                    </h3>
                  </section>
                )}

                {/* Chat History */}
                <div className="space-y-8 pb-10">
                   {messages.map((msg, idx) => (
                     <motion.div 
                       key={idx} 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                     >
                       <div className={`max-w-[400px] p-6 rounded-[2rem] text-sm leading-relaxed ${
                         msg.role === 'user' 
                         ? 'bg-[#C5A021]/10 text-[#C5A021] border border-[#C5A021]/20 rounded-tr-none' 
                         : 'bg-white/[0.03] text-white/70 border border-white/5 rounded-tl-none font-medium'
                       }`}>
                         <div className="markdown-content">
                           <ReactMarkdown>
                             {msg.text}
                           </ReactMarkdown>
                         </div>
                       </div>
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-20 mt-2">
                         {msg.role === 'user' ? 'Direct Inquiry' : 'Neural Response'}
                       </span>
                     </motion.div>
                   ))}
                   {isLoading && (
                     <div className="flex items-center gap-3 text-[#C5A021] animate-pulse">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Synthesizing brilliance...</span>
                     </div>
                   )}
                </div>

                {/* Professor's Note (Hide after first message) */}
                {messages.length === 0 && (
                  <div className="p-10 bg-[#C5A021]/5 border border-[#C5A021]/10 rounded-[3rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A021]/30" />
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#C5A021] mb-2 opacity-60 italic">Professor's Note</div>
                    <p className="text-sm text-[#C5A021] font-medium leading-relaxed italic">
                      "Computation is not merely the execution of steps, but the exploration of what is provably possible."
                    </p>
                  </div>
                )}
              </div>

              {/* Dialogue Input */}
              <div className="p-12 bg-black/20 shrink-0 select-text">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[#C5A021]/10 to-transparent blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <input 
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Send a message..."
                    disabled={isLoading}
                    className="w-full bg-transparent border-b border-white/10 py-6 text-xl font-medium text-white placeholder:text-white/10 focus:outline-none focus:border-[#C5A021] transition-all disabled:opacity-50 relative z-50 cursor-text pointer-events-auto"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isLoading}
                    className="absolute right-0 bottom-6 p-2 text-[#C5A021] hover:scale-125 transition-transform disabled:opacity-50 z-[60] pointer-events-auto"
                  >
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                  </button>
                </div>
                <div className="mt-6 flex justify-between text-[8px] font-black uppercase tracking-widest text-white/10">
                   <span>Awaiting Prompt</span>
                   <span>TOC_AGENT // UNIT_INF</span>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .markdown-content h1, .markdown-content h2, .markdown-content h3 {
          color: #C5A021;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-style: italic;
        }
        .markdown-content h3 { font-size: 11px; }
        .markdown-content p { margin-bottom: 1rem; }
        .markdown-content ul, .markdown-content ol {
          margin-bottom: 1rem;
          padding-left: 1.25rem;
          border-left: 1px solid rgba(197, 160, 33, 0.2);
        }
        .markdown-content li {
          margin-bottom: 0.5rem;
          position: relative;
        }
        .markdown-content strong {
          color: #C5A021;
          font-weight: 900;
        }
        .markdown-content code {
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          color: #C5A021;
        }
      `}</style>
    </>
  );
};

export default AIProfessor;

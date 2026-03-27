import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types';
import { chatWithPaper } from '../lib/gemini';

interface ChatPanelProps {
  paperContent?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ paperContent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Yo! I've read the paper. Ask me anything about it. I'm your research buddy. 🚀" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      const response = await chatWithPaper(history, userMsg, paperContent);
      setMessages(prev => [...prev, { role: 'model', content: response || "Sorry, I blanked out. Can you repeat?" }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden border-2 border-white/10">
      <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-neon-pink" />
          <span className="font-display font-bold uppercase tracking-widest text-sm">Paper Chat</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse delay-75" />
          <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse delay-150" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-neon-blue text-black' : 'bg-neon-pink text-white'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl font-medium text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-neon-blue text-black rounded-tr-none' 
                    : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-neon-pink" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-50">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/10">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about the methodology..."
            className="w-full bg-black/40 border-2 border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-neon-green transition-all font-medium placeholder:text-white/20"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-2 top-2 bottom-2 px-4 bg-neon-green text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

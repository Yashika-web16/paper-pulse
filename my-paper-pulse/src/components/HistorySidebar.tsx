import React from 'react';
import { PaperAnalysis } from '../types';
import { Clock, Trash2, ChevronRight, X, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: PaperAnalysis[];
  onSelect: (analysis: PaperAnalysis) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  onClear,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-dark-bg border-l border-white/10 z-[70] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <History className="text-neon-green" />
                <h2 className="text-xl font-display font-black uppercase tracking-tighter">Research History</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <Clock size={48} />
                  <p className="font-display font-bold uppercase tracking-widest text-sm">No research history yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative glass p-4 rounded-2xl border border-white/5 hover:border-neon-green/30 transition-all cursor-pointer"
                    onClick={() => onSelect(item)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-neon-green transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-white/30">
                          <Clock size={10} />
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="p-2 text-white/20 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-neon-blue">
                      <span>View Insights</span>
                      <ChevronRight size={12} />
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-white/5">
                <button
                  onClick={onClear}
                  className="w-full py-3 rounded-xl border-2 border-neon-pink/20 text-neon-pink font-display font-bold uppercase tracking-widest text-xs hover:bg-neon-pink hover:text-white transition-all"
                >
                  Clear All History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

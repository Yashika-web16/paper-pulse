import React from 'react';
import { X, Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Theme {
  id: string;
  name: string;
  colors: {
    'neon-green': string;
    'neon-pink': string;
    'neon-blue': string;
    'dark-bg': string;
    'card-bg': string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      'neon-green': '#00FF00',
      'neon-pink': '#FF00FF',
      'neon-blue': '#00F0FF',
      'dark-bg': '#050505',
      'card-bg': '#111111',
    },
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    colors: {
      'neon-green': '#FF71CE',
      'neon-pink': '#B967FF',
      'neon-blue': '#01CDFE',
      'dark-bg': '#1B1464',
      'card-bg': '#2E266F',
    },
  },
  {
    id: 'matrix',
    name: 'Matrix',
    colors: {
      'neon-green': '#00FF41',
      'neon-pink': '#008F11',
      'neon-blue': '#003B00',
      'dark-bg': '#0D0208',
      'card-bg': '#1A1A1A',
    },
  },
  {
    id: 'solar',
    name: 'Solar',
    colors: {
      'neon-green': '#F27D26',
      'neon-pink': '#FF4444',
      'neon-blue': '#FFB800',
      'dark-bg': '#1A0F0E',
      'card-bg': '#2A1A18',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      'neon-green': '#6366F1',
      'neon-pink': '#8B5CF6',
      'neon-blue': '#3B82F6',
      'dark-bg': '#020617',
      'card-bg': '#0F172A',
    },
  },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onThemeSelect: (theme: Theme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onThemeSelect,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg brutal-card p-8 z-[110] bg-dark-bg"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Palette className="text-neon-green" size={28} />
                <h2 className="text-3xl font-display font-black uppercase tracking-tighter">Aesthetic Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-sm font-bold uppercase tracking-widest text-white/40">Select Theme</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => onThemeSelect(theme)}
                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 group ${
                      currentThemeId === theme.id
                        ? 'border-neon-green bg-neon-green/5'
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-display font-bold uppercase tracking-tighter ${
                        currentThemeId === theme.id ? 'text-neon-green' : 'text-white'
                      }`}>
                        {theme.name}
                      </span>
                      {currentThemeId === theme.id && (
                        <Check size={16} className="text-neon-green" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: theme.colors['neon-green'] }} />
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: theme.colors['neon-pink'] }} />
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: theme.colors['neon-blue'] }} />
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: theme.colors['dark-bg'] }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                Changes are applied instantly and saved locally
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

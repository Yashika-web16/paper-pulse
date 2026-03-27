import React from 'react';
import { ProcessStep } from '../types';
import { ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export const ProcessFlow: React.FC<{ steps: ProcessStep[] }> = ({ steps }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-display font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
        <Zap className="text-neon-green" />
        Methodology <span className="text-neon-pink">Pipeline</span>
      </h3>
      
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-neon-green via-neon-blue to-neon-pink opacity-20" />
        
        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-16"
            >
              {/* Node */}
              <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-card-bg border-4 border-neon-green flex items-center justify-center font-display font-black text-xl z-10 shadow-[0_0_15px_rgba(0,255,0,0.3)]">
                {index + 1}
              </div>
              
              <div className="glass p-6 rounded-2xl hover:neon-border transition-all group">
                <h4 className="text-lg font-bold text-neon-green mb-2 uppercase tracking-wide group-hover:translate-x-2 transition-transform">
                  {step.step}
                </h4>
                <p className="text-white/70 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

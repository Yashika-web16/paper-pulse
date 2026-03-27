import React from 'react';
import { PaperAnalysis } from '../types';
import { FileText, Users, Quote, CheckCircle2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const SummaryView: React.FC<{ analysis: PaperAnalysis }> = ({ analysis }) => {
  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="brutal-card p-8 bg-gradient-to-br from-card-bg to-black">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-neon-blue font-bold text-xs uppercase tracking-[0.2em]">
              <FileText size={14} />
              Research Paper
            </div>
            <h1 className="text-4xl font-display font-black leading-tight tracking-tighter max-w-3xl">
              {analysis.title}
            </h1>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="p-3 glass rounded-2xl border-neon-green/20">
              <Users className="text-neon-green mb-1" size={20} />
              <div className="text-[10px] font-bold uppercase text-white/40">Authors</div>
              <div className="text-xs font-bold">{analysis.authors.join(', ')}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-neon-pink font-display font-bold uppercase tracking-widest text-sm">
              <Quote size={16} />
              Abstract
            </h3>
            <p className="text-white/60 text-sm leading-relaxed italic">
              "{analysis.abstract}"
            </p>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <h3 className="flex items-center gap-2 text-neon-green font-display font-bold uppercase tracking-widest text-sm">
              <Info size={16} />
              Key Insights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.keyInsights.map((insight, i) => (
                <div key={i} className="flex gap-3 p-4 glass rounded-xl border-white/5 hover:border-neon-green/30 transition-colors group">
                  <CheckCircle2 className="text-neon-green shrink-0 group-hover:scale-110 transition-transform" size={18} />
                  <span className="text-xs font-medium text-white/80">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl border-white/10">
          <h3 className="text-xl font-display font-black uppercase tracking-tighter mb-6 text-neon-blue">Executive Summary</h3>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{analysis.summary}</ReactMarkdown>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-8 rounded-3xl border-white/10">
            <h3 className="text-xl font-display font-black uppercase tracking-tighter mb-4 text-neon-pink">Results & Findings</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              {analysis.results}
            </p>
          </div>
          <div className="glass p-8 rounded-3xl border-white/10 bg-neon-green/5">
            <h3 className="text-xl font-display font-black uppercase tracking-tighter mb-4 text-neon-green">Conclusion</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              {analysis.conclusion}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

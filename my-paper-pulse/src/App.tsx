import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { SummaryView } from './components/SummaryView';
import { ChartsView } from './components/ChartsView';
import { ProcessFlow } from './components/ProcessFlow';
import { DiagramView } from './components/DiagramView';
import { ChatPanel } from './components/ChatPanel';
import { HistorySidebar } from './components/HistorySidebar';
import { SettingsModal, THEMES, Theme } from './components/SettingsModal';
import { ComparisonView } from './components/ComparisonView';
import { PaperAnalysis, ComparisonResult } from './types';
import { analyzePaper, comparePapers } from './lib/gemini'; // Core analysis function
import pdfUtils from './lib/pdf';
const { extractTextFromPDF, fileToBase64 } = pdfUtils;
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, MessageSquare, FileText, BarChart3, Network, RefreshCw, Sparkles, Download, Table, History, Settings } from 'lucide-react';

type Tab = 'dashboard' | 'chat';

export default function App() {
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [paperContent, setPaperContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    return localStorage.getItem('paper_pulse_theme') || 'cyberpunk';
  });
  const [history, setHistory] = useState<PaperAnalysis[]>(() => {
    const saved = localStorage.getItem('paper_pulse_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const theme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [currentThemeId]);

  const handleThemeSelect = (theme: Theme) => {
    setCurrentThemeId(theme.id);
    localStorage.setItem('paper_pulse_theme', theme.id);
  };

  const saveToHistory = (newAnalysis: PaperAnalysis) => {
    const updatedHistory = [newAnalysis, ...history.filter(h => h.id !== newAnalysis.id)].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('paper_pulse_history', JSON.stringify(updatedHistory));
  };

  const deleteFromHistory = (id: string) => {
    const updatedHistory = history.filter(h => h.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('paper_pulse_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('paper_pulse_history');
  };

  const selectFromHistory = (item: PaperAnalysis) => {
    setAnalysis(item);
    setComparison(null);
    setPaperContent(''); // We don't store raw text in history to save space
    setActiveTab('dashboard');
    setIsHistoryOpen(false);
  };

  const togglePaperSelection = (id: string) => {
    setSelectedPaperIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (selectedPaperIds.length < 2) return;
    
    setIsLoading(true);
    setIsHistoryOpen(false);
    
    try {
      // We need the content for comparison. Since we don't store it in history,
      // for this demo we'll use the summary and key insights as a proxy if raw content isn't available,
      // or we could prompt the user that comparison works best with recently uploaded papers.
      // Better: we'll use the analysis data itself for comparison.
      const papersToCompare = history
        .filter(h => selectedPaperIds.includes(h.id))
        .map(h => ({
          id: h.id,
          title: h.title,
          content: `Summary: ${h.summary}\n\nKey Insights: ${h.keyInsights.join(', ')}\n\nMethodology: ${h.methodology}\n\nResults: ${h.results}`
        }));

      const result = await comparePapers(papersToCompare);
      setComparison(result);
      setAnalysis(null);
      setActiveTab('dashboard');
    } catch (error: any) {
      console.error('Comparison failed:', error);
      alert(`Comparison Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      let content: string | { data: string; mimeType: string };
      let rawText = '';
      
      if (file.type === 'application/pdf') {
        rawText = await extractTextFromPDF(file);
        content = rawText;
      } else {
        const base64 = await fileToBase64(file);
        content = { data: base64, mimeType: file.type };
        rawText = "[Image Content]"; // For images, we don't have raw text easily without double processing
      }

      setPaperContent(rawText);
      const result = await analyzePaper(content);
      
      const analysisWithMeta: PaperAnalysis = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      
      setAnalysis(analysisWithMeta);
      saveToHistory(analysisWithMeta);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errorMessage = error?.message || 'Failed to analyze paper. Please try again.';
      
      if (errorMessage.includes('Quota')) {
        alert(`QUOTA EXCEEDED: ${errorMessage}\n\nPRESENTATION TIP: Pre-analyze your papers and use the "History" sidebar to show them instantly without calling the API!`);
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setComparison(null);
    setSelectedPaperIds([]);
    setActiveTab('dashboard');
  };

  const exportJSON = () => {
    if (!analysis) return;
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const fileName = `${analysis.title.replace(/\s+/g, '_').toLowerCase()}_analysis.json`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
  };

  const exportCSV = () => {
    if (!analysis || !analysis.chartData) return;
    const headers = ['Name', 'Value', 'Category'];
    const rows = analysis.chartData.map(item => [
      `"${item.name}"`,
      item.value,
      `"${item.category || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${(analysis.title || 'analysis').replace(/\s+/g, '_').toLowerCase()}_data.csv`);
    link.click();
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white selection:bg-neon-green selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 bg-neon-green rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,0,0.3)]">
              <Sparkles className="text-black" size={24} />
            </div>
            <span className="text-2xl font-display font-black tracking-tighter uppercase">
              Paper<span className="text-neon-green">Pulse</span>
            </span>
          </div>

          {analysis && (
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'dashboard' ? 'bg-neon-green text-black' : 'text-white/50 hover:text-white'
                }`}
              >
                <LayoutDashboard size={18} />
                Insights
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'chat' ? 'bg-neon-pink text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <MessageSquare size={18} />
                Chat
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-neon-blue"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            {analysis && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={exportJSON}
                  title="Export JSON"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-neon-blue flex items-center gap-2"
                >
                  <Download size={18} />
                  <span className="text-[10px] font-bold uppercase hidden md:inline">JSON</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10" />
                <button 
                  onClick={exportCSV}
                  title="Export CSV"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-neon-green flex items-center gap-2"
                >
                  <Table size={18} />
                  <span className="text-[10px] font-bold uppercase hidden md:inline">CSV</span>
                </button>
              </div>
            )}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-neon-green relative"
              title="View History"
            >
              <History size={20} />
              {history.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-neon-green rounded-full shadow-[0_0_5px_rgba(0,255,0,0.5)]" />
              )}
            </button>
            {analysis && (
              <button 
                onClick={reset}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-neon-pink"
                title="Reset"
              >
                <RefreshCw size={20} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentThemeId={currentThemeId}
        onThemeSelect={handleThemeSelect}
      />

      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={selectFromHistory}
        onDelete={deleteFromHistory}
        onClear={clearHistory}
        selectedIds={selectedPaperIds}
        onToggleSelect={togglePaperSelection}
        onCompare={handleCompare}
      />

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!analysis && !comparison ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-12"
            >
              <div className="text-center space-y-4 max-w-3xl">
                <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter leading-[0.85]">
                  READ LESS <br />
                  <span className="text-neon-blue">KNOW MORE</span>
                </h2>
                <p className="text-xl text-white/40 font-medium">
                  The ultimate research paper companion for the modern scholar.
                </p>
              </div>
              <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {comparison ? (
                <ComparisonView 
                  result={comparison!} 
                  papers={history.filter(h => comparison!.paperIds.includes(h.id))} 
                />
              ) : (activeTab === 'dashboard' && analysis) ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-12">
                    <SummaryView analysis={analysis!} />
                    
                    <div className="space-y-8">
                      <h3 className="text-3xl font-display font-black uppercase tracking-tighter flex items-center gap-3">
                        <BarChart3 className="text-neon-blue" />
                        Data <span className="text-neon-blue">Analytics</span>
                      </h3>
                      <ChartsView data={analysis!.chartData} />
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-3xl font-display font-black uppercase tracking-tighter flex items-center gap-3">
                        <Network className="text-neon-pink" />
                        Concept <span className="text-neon-pink">Map</span>
                      </h3>
                      <DiagramView data={analysis!.diagramData} />
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div className="sticky top-32">
                      <ProcessFlow steps={analysis!.processSteps} />
                    </div>
                  </div>
                </div>
              ) : analysis ? (
                <div className="h-[70vh]">
                  <ChatPanel paperContent={paperContent} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                  <p className="text-white/40 font-bold uppercase tracking-widest">No analysis data available. Please upload a paper.</p>
                  <button onClick={reset} className="mt-4 px-8 py-3 bg-neon-green text-black font-bold rounded-xl">Try Again</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-green via-neon-blue to-neon-pink opacity-50" />
    </div>
  );
}

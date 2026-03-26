export interface PaperAnalysis {
  id: string;
  timestamp: number;
  title: string;
  authors: string[];
  abstract: string;
  summary: string;
  keyInsights: string[];
  methodology: string;
  results: string;
  conclusion: string;
  chartData: {
    name: string;
    value: number;
    category?: string;
  }[];
  processSteps: {
    step: string;
    description: string;
  }[];
  diagramData: {
    nodes: { id: string; label: string; type: string }[];
    edges: { source: string; target: string; label?: string }[];
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

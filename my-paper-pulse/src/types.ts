export interface DiagramNode {
  id: string;
  label: string;
  type: string;
}

export interface DiagramEdge {
  source: string;
  target: string;
  label?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ChartDataItem {
  name: string;
  value: number;
  category?: string;
}

export interface ProcessStep {
  step: string;
  description: string;
}

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
  chartData: ChartDataItem[];
  processSteps: ProcessStep[];
  diagramData: DiagramData;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

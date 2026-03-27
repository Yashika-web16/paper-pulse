import React, { useState, useRef, useEffect } from 'react';
import { DiagramData } from '../types';
import { motion } from 'motion/react';

export const DiagramView: React.FC<{ data: DiagramData }> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (containerRef.current) {
      const { offsetWidth } = containerRef.current;
      setDimensions({ width: offsetWidth, height: 400 });
    }
  }, []);

  // Simple layout: nodes in a grid
  const nodes = data.nodes.map((node, i) => {
    const cols = 3;
    const colWidth = dimensions.width / cols;
    const rowHeight = 150;
    return {
      ...node,
      x: (i % cols) * colWidth + colWidth / 2,
      y: Math.floor(i / cols) * rowHeight + 100,
    };
  });

  return (
    <div ref={containerRef} className="brutal-card p-8 overflow-hidden bg-black/40 relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <div className="px-3 py-1 bg-neon-green/20 text-neon-green text-[10px] font-bold uppercase rounded-full border border-neon-green/30">Concept Map</div>
      </div>
      
      <svg width="100%" height="100%" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="min-h-[400px]">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>
        
        {/* Edges */}
        {data.edges.map((edge, i) => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;
          
          return (
            <g key={`edge-${i}`}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#333"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              {edge.label && (
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 10}
                  fill="#666"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-mono"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g 
            key={node.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <rect
              x={node.x - 60}
              y={node.y - 25}
              width="120"
              height="50"
              rx="12"
              className={`fill-card-bg stroke-2 ${
                node.type === 'core' ? 'stroke-neon-green' : 
                node.type === 'method' ? 'stroke-neon-blue' : 'stroke-neon-pink'
              }`}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
              className="font-display uppercase tracking-tighter"
            >
              {node.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
};

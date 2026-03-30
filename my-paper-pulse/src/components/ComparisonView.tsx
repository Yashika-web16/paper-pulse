import React from 'react';
import { ComparisonResult, PaperAnalysis } from '../types';
import { motion } from 'motion/react';
import { Check, X, AlertTriangle, Table, BookOpen, Layers } from 'lucide-react';

interface ComparisonViewProps {
  result: ComparisonResult;
  papers: PaperAnalysis[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ result, papers }) => {
  const getPaperTitle = (id: string) => {
    return papers.find(p => p.id === id)?.title || 'Unknown Paper';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600" />
          Multi-Paper Comparison
        </h2>
        <p className="text-gray-500 mt-1">
          Synthesized analysis of {papers.length} research papers
        </p>
      </div>

      {/* Synthesis Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100"
      >
        <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5" />
          Collective Synthesis
        </h3>
        <p className="text-indigo-800 leading-relaxed">
          {result.synthesis}
        </p>
      </motion.section>

      {/* Comparison Table */}
      <section className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  {papers.map((paper) => (
                    <th key={paper.id} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider max-w-[200px] truncate">
                      {paper.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.comparisonTable.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50/30">
                      {row.feature}
                    </td>
                    {papers.map((paper) => (
                      <td key={paper.id} className="px-6 py-4 text-sm text-gray-600">
                        {row.values[paper.id] || row.values[paper.title] || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Similarities & Differences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2 mb-4">
            <Check className="w-5 h-5" />
            Common Ground
          </h3>
          <ul className="space-y-3">
            {result.similarities.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2 mb-4">
            <X className="w-5 h-5" />
            Key Differences
          </h3>
          <ul className="space-y-3">
            {result.differences.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Contradictions */}
      {result.contradictions.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 rounded-2xl p-6 border border-amber-100"
        >
          <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            Conflicting Findings
          </h3>
          <ul className="space-y-3">
            {result.contradictions.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.section>
      )}
    </div>
  );
};

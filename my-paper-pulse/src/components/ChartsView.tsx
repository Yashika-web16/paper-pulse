import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { ChartDataItem } from '../types';

const COLORS = ['#00FF00', '#00F0FF', '#FF00FF', '#F27D26', '#FF4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black border-2 border-white p-4 shadow-[4px_4px_0px_0px_rgba(0,255,0,0.5)]">
        <p className="text-neon-green font-display font-black uppercase tracking-tighter text-sm mb-1">{data.name}</p>
        <div className="h-[1px] bg-white/20 mb-2" />
        <div className="space-y-1">
          <p className="text-xs font-mono flex justify-between gap-4">
            <span className="text-white/40 uppercase">Value:</span>
            <span className="text-white font-bold">{data.value}</span>
          </p>
          {data.category && (
            <p className="text-xs font-mono flex justify-between gap-4">
              <span className="text-white/40 uppercase">Category:</span>
              <span className="text-neon-blue font-bold">{data.category}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const ChartsView: React.FC<{ data: ChartDataItem[] }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="brutal-card p-6 h-[400px]">
        <h3 className="text-xl font-display font-bold mb-6 uppercase tracking-tighter">Metric Distribution</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="value" fill="#00FF00" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="brutal-card p-6 h-[400px]">
        <h3 className="text-xl font-display font-bold mb-6 uppercase tracking-tighter">Category Breakdown</h3>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

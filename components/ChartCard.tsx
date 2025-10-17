import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ChartDataItem, Statistics } from '../types';

interface ChartCardProps {
  title: string;
  data: ChartDataItem[];
  stats: Statistics & { count?: number };
  barColor: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, data, stats, barColor }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col shadow-lg backdrop-blur-sm">
      <h3 className="text-lg font-bold text-sky-300 mb-2">{title}</h3>
      <div className="flex-grow min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} fontSize={10} tickLine={false} axisLine={{ stroke: '#475569' }} />
            <YAxis tick={{ fill: '#94a3b8' }} fontSize={10} tickLine={false} axisLine={{ stroke: '#475569' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                borderColor: '#38bdf8',
                color: '#e2e8f0'
              }}
              labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
            />
            <Bar dataKey="value" fill={barColor} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-around text-center mt-2 pt-2 border-t border-slate-700 text-slate-300 text-sm">
        {stats.count !== undefined && (
           <div>
            <span className="font-semibold text-slate-400 block">Muestras</span>
            <span className="text-sky-400">{stats.count.toLocaleString()}</span>
          </div>
        )}
        <div>
          <span className="font-semibold text-slate-400 block">Media</span>
          <span className="text-sky-400">{stats.mean.toFixed(2)}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-400 block">Desv. Est.</span>
          <span className="text-sky-400">{stats.stdDev.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ChartCard;
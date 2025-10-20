import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataItem } from '../types';

interface ChartCardProps {
  title: string;
  data: ChartDataItem[];
  barColor?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, data, barColor = "#f97316" }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-slate-100">{title}</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: -10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip
                cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
            />
            <Bar dataKey="value" fill={barColor} name="Frecuencia" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

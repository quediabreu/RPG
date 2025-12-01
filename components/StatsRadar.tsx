import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { AttributeType } from '../types';

interface StatsRadarProps {
  attributes: Record<AttributeType, number>;
}

const StatsRadar: React.FC<StatsRadarProps> = ({ attributes }) => {
  const data = Object.keys(attributes).map((key) => ({
    subject: key,
    A: attributes[key as AttributeType],
    fullMark: 20, // visual cap scaling
  }));

  return (
    <div className="w-full h-64 bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 text-center">Matriz de Habilidades</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 2']} tick={false} axisLine={false} />
          <Radar
            name="Skills"
            dataKey="A"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsRadar;
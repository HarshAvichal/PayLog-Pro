'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RecentPeriodsChartProps {
  data: Array<{ period: string; expected: number; actual: number }>;
}

export default function RecentPeriodsChart({ data }: RecentPeriodsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="period" 
          angle={-45} 
          textAnchor="end" 
          height={70}
          tick={{ fontSize: 10, fill: '#6b7280' }}
        />
        <YAxis 
          tick={{ fontSize: 10, fill: '#6b7280' }}
          tickFormatter={(value) => `$${value}`}
          width={50}
        />
        <Tooltip 
          formatter={(value: number) => `$${value.toFixed(2)}`}
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            padding: '8px 12px'
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="rect"
        />
        <Bar 
          dataKey="expected" 
          fill="#8b5cf6" 
          name="Expected" 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="actual" 
          fill="#f59e0b" 
          name="Actual" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}


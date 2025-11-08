'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyChartProps {
  data: Array<{ month: string; earnings: number; expected: number }>;
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12, fill: '#6b7280' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickFormatter={(value) => `$${value}`}
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
          wrapperStyle={{ paddingTop: '10px' }}
          iconType="line"
        />
        <Line 
          type="monotone" 
          dataKey="earnings" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="Actual"
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="expected" 
          stroke="#10b981" 
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Expected"
          dot={{ fill: '#10b981', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}


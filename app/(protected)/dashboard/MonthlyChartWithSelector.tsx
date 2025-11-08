'use client';

import { useState, useMemo } from 'react';
import MonthlyChart from './MonthlyChart';

interface MonthlyChartWithSelectorProps {
  data: Array<{ month: string; earnings: number; expected: number }>;
}

export default function MonthlyChartWithSelector({ data }: MonthlyChartWithSelectorProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Get unique months for dropdown
  const availableMonths = useMemo(() => {
    const months = data.map(d => d.month).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    return months;
  }, [data]);

  // Filter data based on selection
  const filteredData = useMemo(() => {
    if (selectedMonth === 'all') {
      return data;
    }
    return data.filter(d => d.month === selectedMonth);
  }, [data, selectedMonth]);

  // Calculate totals for selected month or all months
  const selectedMonthData = useMemo(() => {
    if (selectedMonth === 'all') {
      const totalEarnings = data.reduce((sum, d) => sum + d.earnings, 0);
      const totalExpected = data.reduce((sum, d) => sum + d.expected, 0);
      return { earnings: totalEarnings, expected: totalExpected };
    }
    const monthData = data.find(d => d.month === selectedMonth);
    return monthData ? { earnings: monthData.earnings, expected: monthData.expected } : { earnings: 0, expected: 0 };
  }, [data, selectedMonth]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Monthly Earnings
          {selectedMonth !== 'all' && (
            <span className="ml-2 text-base font-normal text-gray-600">
              ~ ${selectedMonthData.earnings.toFixed(2)}
            </span>
          )}
        </h2>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Months</option>
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>
      
      {/* Stat cards when a month is selected */}
      {selectedMonth !== 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-600 mb-0.5">Actual</p>
            <p className="text-base font-bold text-gray-900">${selectedMonthData.earnings.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-600 mb-0.5">Expected</p>
            <p className="text-base font-bold text-gray-900">${selectedMonthData.expected.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-600 mb-0.5">Difference</p>
            <p className={`text-base font-bold ${selectedMonthData.earnings >= selectedMonthData.expected ? 'text-green-600' : 'text-red-600'}`}>
              ${(selectedMonthData.earnings - selectedMonthData.expected).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-600 mb-0.5">%</p>
            <p className={`text-base font-bold ${selectedMonthData.earnings >= selectedMonthData.expected ? 'text-green-600' : 'text-red-600'}`}>
              {selectedMonthData.expected > 0 
                ? ((selectedMonthData.earnings / selectedMonthData.expected) * 100).toFixed(1)
                : '0.0'
              }%
            </p>
          </div>
        </div>
      )}
      
      <div className="flex-1 min-h-0">
        <MonthlyChart data={filteredData} />
      </div>
    </div>
  );
}


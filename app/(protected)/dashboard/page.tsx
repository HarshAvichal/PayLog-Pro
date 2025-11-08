import { getAllPayPeriods } from '@/app/actions/pay-periods';
import { getSettings } from '@/app/actions/settings';
import Link from 'next/link';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import MonthlyChartWithSelector from './MonthlyChartWithSelector';
import RecentPeriodsChart from './RecentPeriodsChart';
import DashboardHistoryManager from './DashboardHistoryManager';

export default async function DashboardPage() {
  const [payPeriodsResult, settingsResult] = await Promise.all([
    getAllPayPeriods(),
    getSettings(),
  ]);

  const payPeriods = payPeriodsResult.success ? payPeriodsResult.data : [];
  const hourlyRate = settingsResult.success ? settingsResult.data?.hourly_rate || 15 : 15;

  const totalEarnings = payPeriods.reduce((sum, pp) => sum + (pp.actual_pay || pp.expected_pay || 0), 0);
  const totalExpected = payPeriods.reduce((sum, pp) => sum + (pp.expected_pay || 0), 0);
  const totalDifference = payPeriods.reduce((sum, pp) => sum + (pp.difference || 0), 0);
  const totalHours = payPeriods.reduce((sum, pp) => sum + (pp.total_hours || 0), 0);
  const totalDeductions = payPeriods.reduce((sum, pp) => sum + ((pp as any).deductions_total || 0), 0);
  const netEarnings = totalEarnings - totalDeductions;

  const monthlyData: Record<string, { month: string; earnings: number; expected: number }> = {};
  payPeriods.forEach((pp) => {
    const month = format(parseISO(pp.start_date), 'MMM yyyy');
    if (!monthlyData[month]) {
      monthlyData[month] = { month, earnings: 0, expected: 0 };
    }
    monthlyData[month].earnings += pp.actual_pay || pp.expected_pay || 0;
    monthlyData[month].expected += pp.expected_pay || 0;
  });

  const monthlyChartData = Object.values(monthlyData).sort((a, b) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  const recentPeriods = payPeriods.slice(0, 12).map((pp) => ({
    period: `${format(parseISO(pp.start_date), 'MMM d')} - ${format(parseISO(pp.end_date), 'MMM d')}`,
    expected: pp.expected_pay || 0,
    actual: pp.actual_pay || pp.expected_pay || 0,
  }));

  return (
    <>
      <DashboardHistoryManager />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative h-12 w-12 md:h-16 md:w-16 flex-shrink-0 bg-white rounded-lg shadow-sm p-1.5">
              <Image
                src="/sleep.png"
                alt="Sleep Inn Logo"
                fill
                className="object-contain rounded"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">PayLog Dashboard</h1>
          </div>
          <p className="text-gray-600">Track your pay periods and earnings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Earnings</h3>
            <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Deductions</h3>
            <p className="text-2xl font-bold text-red-600">-${totalDeductions.toFixed(2)}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Net Earnings</h3>
            <p className="text-2xl font-bold text-gray-900">${netEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Expected</h3>
            <p className="text-2xl font-bold text-gray-900">${totalExpected.toFixed(2)}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Hours</h3>
            <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6 flex flex-col">
            <MonthlyChartWithSelector data={monthlyChartData} />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Pay Periods</h2>
            <div className="flex-1">
              <RecentPeriodsChart data={recentPeriods} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg text-center transition"
          >
            Upload PDF
          </Link>
          <Link
            href="/manual"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg text-center transition"
          >
            Manual Pay Period
          </Link>
          <Link
            href="/pay-periods"
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg text-center transition"
          >
            View All Pay Periods
          </Link>
          <Link
            href="/settings"
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg text-center transition"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}


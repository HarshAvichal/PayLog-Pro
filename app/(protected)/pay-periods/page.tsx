import { getAllPayPeriods } from '@/app/actions/pay-periods';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi';
import PayPeriodsTable from './PayPeriodsTable';

export default async function PayPeriodsPage() {
  const payPeriodsResult = await getAllPayPeriods();
  const payPeriods = payPeriodsResult.success ? payPeriodsResult.data : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2 sm:mb-4 px-3 py-1.5 sm:py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm sm:text-base font-medium group"
          >
            <HiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pay Periods</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">View and manage all your pay periods</p>
        </div>

        <PayPeriodsTable payPeriods={payPeriods} />
      </div>
    </div>
  );
}


import { getAllPayPeriods } from '@/app/actions/pay-periods';
import Link from 'next/link';
import PayPeriodsTable from './PayPeriodsTable';

export default async function PayPeriodsPage() {
  const payPeriodsResult = await getAllPayPeriods();
  const payPeriods = payPeriodsResult.success ? payPeriodsResult.data : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pay Periods</h1>
          <p className="text-gray-600 mt-2">View and manage all your pay periods</p>
        </div>

        <PayPeriodsTable payPeriods={payPeriods} />
      </div>
    </div>
  );
}


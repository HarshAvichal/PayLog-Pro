import { getPayPeriod, getShiftsForPayPeriod, deletePayPeriod } from '@/app/actions/pay-periods';
import { getDeductionsForPayPeriod } from '@/app/actions/deductions';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DeleteButton from './DeleteButton';
import EditForm from './EditForm';

export default async function PayPeriodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [payPeriodResult, shiftsResult, deductionsResult] = await Promise.all([
    getPayPeriod(id),
    getShiftsForPayPeriod(id),
    getDeductionsForPayPeriod(id),
  ]);

  if (!payPeriodResult.success || !payPeriodResult.data) {
    redirect('/dashboard');
  }

  const payPeriod = payPeriodResult.data;
  const shifts = shiftsResult.success ? shiftsResult.data : [];
  const deductions = deductionsResult.success ? deductionsResult.data : [];
  
  // Calculate total deductions
  const totalDeductions = deductions.reduce((sum, d) => sum + Math.abs(d.amount), 0);
  const netPay = payPeriod.actual_pay ? payPeriod.actual_pay - totalDeductions : null;

  // Calculate CSV data
  const csvData = [
    ['Date', 'Time In', 'Time Out', 'Department', 'Total Hours', 'Regular Hours', 'OT1 Hours'].join(','),
    ...shifts.map((shift) =>
      [
        shift.date,
        shift.time_in,
        shift.time_out,
        shift.department || '',
        shift.hours,
        shift.reg_hours || shift.hours,
        shift.ot1_hours || 0,
      ].join(',')
    ),
  ].join('\n');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/pay-periods"
            className="text-blue-600 hover:text-blue-800 mb-2 sm:mb-4 inline-block text-sm sm:text-base"
          >
            ← Back to Pay Periods
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pay Period Details</h1>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                {format(parseISO(payPeriod.start_date), 'MMM d')} -{' '}
                {format(parseISO(payPeriod.end_date), 'MMM d, yyyy')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Created {format(parseISO(payPeriod.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
              <EditForm
                payPeriod={payPeriod}
                shifts={shifts}
              />
              <DeleteButton payPeriodId={id} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Total Hours</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {payPeriod.total_hours?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Expected Pay</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                ${payPeriod.expected_pay?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Actual Pay</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {payPeriod.actual_pay ? `$${payPeriod.actual_pay.toFixed(2)}` : '-'}
              </p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Net Pay</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {netPay !== null ? `$${netPay.toFixed(2)}` : '-'}
              </p>
            </div>
          </div>

          {payPeriod.notes && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{payPeriod.notes}</p>
            </div>
          )}

            <div className="mb-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Shifts ({shifts.length})
                </h3>
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`}
                  download={`pay-period-${payPeriod.start_date}-${payPeriod.end_date}.csv`}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Export CSV
                </a>
              </div>
              
              <div className="hidden md:block overflow-x-auto border-t border-gray-300">
                <table className="w-full">
                  <thead className="bg-[#2C475E]">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Date</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Time In</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Time Out</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Dept</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Total</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Reg</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">OT1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.length === 0 ? (
                      <tr className="bg-white">
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No shifts found
                        </td>
                      </tr>
                    ) : (
                      shifts.map((shift, index) => {
                        const isEven = index % 2 === 0;
                        const rowBgColor = isEven ? 'bg-white' : 'bg-[#F0F4F7]';
                        return (
                          <tr key={shift.id} className={`${rowBgColor} hover:bg-opacity-80 transition-colors`}>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">
                              {format(parseISO(shift.date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.time_in}</td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.time_out}</td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.department || '-'}</td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.hours.toFixed(2)}</td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">
                              {shift.reg_hours?.toFixed(2) || shift.hours.toFixed(2)}
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">
                              {shift.ot1_hours?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <div className="h-1 bg-[#2C475E]"></div>
              </div>

              <div className="md:hidden border-t border-gray-300">
                {shifts.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No shifts found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {shifts.map((shift, index) => {
                      const isEven = index % 2 === 0;
                      const cardBgColor = isEven ? 'bg-white' : 'bg-[#F0F4F7]';
                      return (
                        <div key={shift.id} className={`${cardBgColor} p-4`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium text-gray-900 mb-1">
                                {format(parseISO(shift.date), 'MMM d, yyyy')}
                              </p>
                              <p className="text-xs text-gray-500">{shift.department || 'No department'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">{shift.hours.toFixed(2)}h</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Time In</p>
                              <p className="font-medium text-gray-900">{shift.time_in}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Time Out</p>
                              <p className="font-medium text-gray-900">{shift.time_out}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Regular</p>
                              <p className="font-medium text-gray-900">{shift.reg_hours?.toFixed(2) || shift.hours.toFixed(2)}h</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">OT1</p>
                              <p className="font-medium text-gray-900">{shift.ot1_hours?.toFixed(2) || '0.00'}h</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="h-1 bg-[#2C475E]"></div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}


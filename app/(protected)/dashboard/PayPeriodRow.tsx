'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';

interface PayPeriodRowProps {
  payPeriod: {
    id: string;
    start_date: string;
    end_date: string;
    total_hours: number | null;
    expected_pay: number | null;
    actual_pay: number | null;
    difference: number | null;
  };
}

export default function PayPeriodRow({ payPeriod }: PayPeriodRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <Link
          href={`/pay-period/${payPeriod.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium block"
        >
          {format(parseISO(payPeriod.start_date), 'MMM d')} - {format(parseISO(payPeriod.end_date), 'MMM d, yyyy')}
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {payPeriod.total_hours?.toFixed(1) || '0.0'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        ${payPeriod.expected_pay?.toFixed(2) || '0.00'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {payPeriod.actual_pay ? `$${payPeriod.actual_pay.toFixed(2)}` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {payPeriod.difference !== null ? (
          <span className={payPeriod.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${payPeriod.difference.toFixed(2)}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <Link
          href={`/pay-period/${payPeriod.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View
        </Link>
      </td>
    </tr>
  );
}


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePayPeriod } from '@/app/actions/pay-periods';

export default function DeleteButton({
  payPeriodId,
}: {
  payPeriodId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }

    setLoading(true);
    try {
      const result = await deletePayPeriod(payPeriodId);
      
      if (result.success) {
        router.replace('/pay-periods');
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete pay period');
        setLoading(false);
        setConfirm(false);
      }
    } catch (error) {
      alert('An error occurred while deleting the pay period');
      setLoading(false);
      setConfirm(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition ${
        confirm
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      } disabled:opacity-50`}
    >
      {loading ? 'Deleting...' : confirm ? <span className="hidden sm:inline">Confirm </span> : ''}Delete
    </button>
  );
}


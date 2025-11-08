'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { createDeduction, updateDeduction, deleteDeduction } from '@/app/actions/deductions';
import { useRouter } from 'next/navigation';

interface Deduction {
  id: string;
  date: string;
  amount: number;
  reason: string;
  created_at: string;
}

export default function DeductionsSection({
  payPeriodId,
  deductions: initialDeductions,
}: {
  payPeriodId: string;
  deductions: Deduction[];
}) {
  const router = useRouter();
  const [deductions, setDeductions] = useState(initialDeductions);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    reason: '',
  });

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({ date: '', amount: '', reason: '' });
    setError(null);
  };

  const handleEdit = (deduction: Deduction) => {
    setEditingId(deduction.id);
    setFormData({
      date: deduction.date,
      amount: Math.abs(deduction.amount).toString(),
      reason: deduction.reason,
    });
    setError(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ date: '', amount: '', reason: '' });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Amount must be a positive number');
        setLoading(false);
        return;
      }

      const result = editingId
        ? await updateDeduction(editingId, {
            date: formData.date,
            amount: -amount, // Store as negative
            reason: formData.reason,
          })
        : await createDeduction(payPeriodId, {
            date: formData.date,
            amount: -amount, // Store as negative
            reason: formData.reason,
          });

      if (result.success) {
        router.refresh();
        handleCancel();
      } else {
        setError(result.error || 'Failed to save deduction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deduction?')) return;

    setLoading(true);
    const result = await deleteDeduction(id);
    
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Failed to delete deduction');
    }
    setLoading(false);
  };

  const totalDeductions = deductions.reduce((sum, d) => sum + Math.abs(d.amount), 0);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Deductions ({deductions.length})
        </h3>
        {!isAdding && !editingId && (
          <button
            onClick={handleAdd}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg"
          >
            + Add Deduction
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="300"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Zelle transfer"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {deductions.length === 0 && !isAdding ? (
        <p className="text-sm text-gray-500 text-center py-4">No deductions yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Reason</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deductions.map((deduction) => (
                <tr key={deduction.id}>
                  <td className="px-4 py-2 text-gray-900">
                    {format(parseISO(deduction.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-2 text-red-600 font-medium">
                    -${Math.abs(deduction.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{deduction.reason}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(deduction)}
                        disabled={loading || isAdding}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(deduction.id)}
                        disabled={loading || isAdding}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {deductions.length > 0 && (
                <tr className="bg-gray-50 font-medium">
                  <td className="px-4 py-2 text-gray-900">Total</td>
                  <td className="px-4 py-2 text-red-600">-${totalDeductions.toFixed(2)}</td>
                  <td colSpan={2} className="px-4 py-2"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPayPeriod } from '@/app/actions/pay-periods';
import { createDeduction } from '@/app/actions/deductions';
import { getSettings } from '@/app/actions/settings';
import Link from 'next/link';
import type { Shift } from '@/lib/utils/pdf-parser';

export default function ManualPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(15);
  const [actualPay, setActualPay] = useState('');
  const [notes, setNotes] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([
    { date: '', timeIn: '', timeOut: '', hours: 0 },
  ]);
  const [deductions, setDeductions] = useState<Array<{ date: string; amount: string; reason: string }>>([]);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    getSettings().then((result) => {
      if (result.success && result.data) {
        setHourlyRate(result.data.hourly_rate || 15);
      }
    });
  }, []);

  const addShift = () => {
    setShifts([...shifts, { date: '', timeIn: '', timeOut: '', hours: 0 }]);
  };

  const removeShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const updateShift = (index: number, field: keyof Shift, value: string | number) => {
    const updated = [...shifts];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'timeIn' || field === 'timeOut') {
      const shift = updated[index];
      if (shift.timeIn && shift.timeOut) {
        const hours = calculateHours(shift.timeIn, shift.timeOut);
        updated[index].hours = hours;
      }
    }
    
    setShifts(updated);
  };

  const calculateHours = (timeIn: string, timeOut: string): number => {
    try {
      const inTime = parseTime(timeIn);
      const outTime = parseTime(timeOut);
      let diff = (outTime - inTime) / (1000 * 60 * 60);
      if (diff < 0) diff += 24;
      return Math.round(diff * 100) / 100;
    } catch {
      return 0;
    }
  };

  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
    if (!match) throw new Error('Invalid time format');
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  };

  const handleSave = async () => {
    const validShifts = shifts.filter((s) => s.date && s.timeIn && s.timeOut);
    const actualPayValue = actualPay ? parseFloat(actualPay) : null;
    
    const invalidDeductions = deductions.filter((d) => {
      const hasSomeFields = d.date || d.amount || d.reason;
      const hasAllFields = d.date && d.amount && d.reason;
      return hasSomeFields && !hasAllFields;
    });

    if (invalidDeductions.length > 0) {
      setError('Please fill in all fields (date, amount, and reason) for all deductions, or remove incomplete deductions');
      return;
    }

    const validDeductions = deductions.filter((d) => {
      const hasDate = d.date && d.date.trim() !== '';
      const hasAmount = d.amount && d.amount.trim() !== '';
      const hasReason = d.reason && d.reason.trim() !== '';
      return hasDate && hasAmount && hasReason;
    });

    if (validShifts.length > 0) {
      if (!startDate) {
        setError('Please fill in start date (required when adding shifts)');
        return;
      }
    } else {
      if (validDeductions.length === 0 && !actualPayValue) {
        setError('Please add at least one shift, enter actual pay, or add deductions');
        return;
      }
      
      if (actualPayValue && !startDate && validDeductions.length === 0) {
        setError('Please fill in start date (required when entering actual pay without deductions)');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let finalStartDate = startDate;
      let finalEndDate = endDate || startDate;

      if (!finalStartDate && validDeductions.length > 0) {
        const deductionDates = validDeductions
          .map(d => d.date?.trim())
          .filter((date): date is string => Boolean(date) && date !== '')
          .sort();
        if (deductionDates.length > 0) {
          finalStartDate = deductionDates[0];
          finalEndDate = endDate || deductionDates[deductionDates.length - 1] || finalStartDate;
        }
      }

      if (!finalStartDate) {
        if (validDeductions.length > 0) {
          setError('Unable to determine pay period dates from deductions. Please fill in the Pay Period Start Date field.');
        } else if (validShifts.length === 0 && !actualPayValue) {
          setError('Please add at least one shift, enter actual pay, or add deductions');
        } else {
          setError('Please fill in start date');
        }
        setLoading(false);
        return;
      }

      const totalHours = validShifts.length > 0 
        ? validShifts.reduce((sum, shift) => sum + shift.hours, 0)
        : 0;
      const expectedPay = totalHours > 0 ? totalHours * hourlyRate : 0;
      
      let actualPayValueForSave = actualPayValue ? actualPayValue : undefined;
      let finalExpectedPay = expectedPay;

      if (validShifts.length === 0 && !actualPayValue && validDeductions.length > 0) {
        const deductionTotal = validDeductions.reduce((sum, d) => {
          const amount = parseFloat(d.amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        if (deductionTotal > 0) {
          actualPayValueForSave = deductionTotal;
          finalExpectedPay = deductionTotal;
        }
      } else if (validShifts.length === 0 && actualPayValueForSave) {
        finalExpectedPay = actualPayValueForSave;
      }

      const result = await createPayPeriod({
        startDate: finalStartDate,
        endDate: finalEndDate,
        totalHours,
        expectedPay: finalExpectedPay,
        actualPay: actualPayValueForSave,
        notes: notes || undefined,
        shifts: validShifts,
      });

      if (result.success && result.data) {
        if (deductions.length > 0) {
          const deductionsToSave = deductions.filter((d) => {
            const hasDate = d.date && d.date.trim() !== '';
            const hasAmount = d.amount && d.amount.trim() !== '';
            const hasReason = d.reason && d.reason.trim() !== '';
            return hasDate && hasAmount && hasReason;
          });
          for (const deduction of deductionsToSave) {
            const amount = parseFloat(deduction.amount);
            if (!isNaN(amount) && amount > 0) {
              await createDeduction(result.data.id, {
                date: deduction.date,
                amount: -amount,
                reason: deduction.reason,
              });
            }
          }
        }
        router.push('/dashboard');
      } else {
        if ((result as any).duplicate) {
          setToast({ message: 'This pay period already exists in the database.', type: 'error' });
          setTimeout(() => setToast(null), 5000);
        } else {
          setError(result.error || 'Failed to save pay period');
        }
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const validShifts = shifts.filter((s) => s.date && s.timeIn && s.timeOut);
  const totalHours = validShifts.reduce((sum, shift) => sum + shift.hours, 0);
  const expectedPay = totalHours > 0 ? totalHours * hourlyRate : (actualPay ? parseFloat(actualPay) || 0 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Manual Pay Period</h1>
        </div>

        {toast && (
          <div className={`fixed top-3 sm:top-4 right-3 sm:right-4 left-3 sm:left-auto z-50 animate-in slide-in-from-top-5 ${
            toast.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          } rounded-lg shadow-lg p-3 sm:p-4 max-w-md sm:max-w-md`}>
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium text-sm sm:text-base">{toast.message}</p>
              <button
                onClick={() => setToast(null)}
                className="text-gray-400 hover:text-gray-600 text-lg sm:text-xl"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay Period Start Date {validShifts.length > 0 ? '*' : '(for shifts)'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date 
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Shifts</h2>
              <button
                onClick={addShift}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg"
              >
                + Add Shift
              </button>
            </div>
            <div className="space-y-4">
              {shifts.map((shift, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={shift.date}
                        onChange={(e) => updateShift(index, 'date', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time In</label>
                      <input
                        type="text"
                        value={shift.timeIn}
                        onChange={(e) => updateShift(index, 'timeIn', e.target.value)}
                        placeholder="07:00 AM"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time Out</label>
                      <input
                        type="text"
                        value={shift.timeOut}
                        onChange={(e) => updateShift(index, 'timeOut', e.target.value)}
                        placeholder="03:00 PM"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                      <input
                        type="number"
                        step="0.01"
                        value={shift.hours}
                        onChange={(e) => updateShift(index, 'hours', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeShift(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {totalHours > 0 ? `Expected Pay ($${hourlyRate}/hr)` : 'Expected Pay'}
              </p>
              <p className="text-2xl font-bold text-gray-900">${expectedPay.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Pay {validShifts.length === 0 ? '*' : '(optional)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={actualPay}
              onChange={(e) => setActualPay(e.target.value)}
              placeholder="Enter actual pay received"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>

          {/* Deductions Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Deductions (Optional)</h2>
              <button
                onClick={() => setDeductions([...deductions, { date: '', amount: '', reason: '' }])}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg"
              >
                + Add Deduction
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Add any deductions like Zelle transfers, expenses, etc.
            </p>

            {deductions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">No deductions added</p>
            ) : (
              <div className="space-y-3">
                {deductions.map((deduction, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                        <input
                          type="date"
                          value={deduction.date}
                          onChange={(e) => {
                            const updated = [...deductions];
                            updated[index].date = e.target.value;
                            setDeductions(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={deduction.amount}
                          onChange={(e) => {
                            const updated = [...deductions];
                            updated[index].amount = e.target.value;
                            setDeductions(updated);
                          }}
                          placeholder="300"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
                        <input
                          type="text"
                          value={deduction.reason}
                          onChange={(e) => {
                            const updated = [...deductions];
                            updated[index].reason = e.target.value;
                            setDeductions(updated);
                          }}
                          placeholder="Zelle transfer"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => setDeductions(deductions.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Pay Period'}
          </button>
        </div>
      </div>
    </div>
  );
}


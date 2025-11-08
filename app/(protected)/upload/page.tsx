'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type Shift } from '@/lib/utils/pdf-parser';
import { createPayPeriod } from '@/app/actions/pay-periods';
import { getSettings } from '@/app/actions/settings';
import { parsePDF } from '@/app/actions/pdf';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    startDate: string;
    endDate: string;
    shifts: Shift[];
  } | null>(null);
  const [actualPay, setActualPay] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number>(15);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    getSettings().then((result) => {
      if (result.success && result.data) {
        setHourlyRate(result.data.hourly_rate || 15);
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setParsedData(null);
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedData(null);
    setActualPay('');
    setNotes('');
    setError(null);
    const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await parsePDF(formData);
      
      if (result.success && result.data) {
        setParsedData(result.data);
      } else {
        setError(result.error || 'Failed to parse PDF');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;

    setLoading(true);
    setError(null);

    try {
      const totalHours = parsedData.shifts.reduce((sum, shift) => sum + shift.hours, 0);
      const expectedPay = totalHours * hourlyRate;
      const actualPayValue = actualPay ? parseFloat(actualPay) : undefined;

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out. Please check your database connection.')), 30000)
      );

      const result = await Promise.race([
        createPayPeriod({
          startDate: parsedData.startDate,
          endDate: parsedData.endDate,
          totalHours,
          expectedPay,
          actualPay: actualPayValue,
          notes: notes || undefined,
          shifts: parsedData.shifts,
        }),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof createPayPeriod>>;

      if (result.success) {
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
      setLoading(false);
    }
  };

  const totalHours = parsedData?.shifts.reduce((sum, shift) => sum + shift.hours, 0) || 0;
  const expectedPay = totalHours * hourlyRate;

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
          <h1 className="text-3xl font-bold text-gray-900">Upload Pay Period PDF</h1>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 ${
            toast.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          } rounded-lg shadow-lg p-4 max-w-md`}>
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium">{toast.message}</p>
              <button
                onClick={() => setToast(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6 mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select PDF File
              </label>
              {file && (
                <button
                  onClick={handleClear}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                  type="button"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              id="pdf-file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && !parsedData && (
            <button
              onClick={handleParse}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Parsing...' : 'Parse PDF'}
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {parsedData && (
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={parsedData.startDate}
                    onChange={(e) => setParsedData({ ...parsedData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={parsedData.endDate}
                    onChange={(e) => setParsedData({ ...parsedData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Shifts ({parsedData.shifts.length})</h3>
                <div className="overflow-x-auto border-t border-gray-300">
                  <table className="w-full">
                    <thead className="bg-[#2C475E]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Time In</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Time Out</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Dept</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Reg</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">OT1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.shifts.map((shift, idx) => {
                        const isEven = idx % 2 === 0;
                        const rowBgColor = isEven ? 'bg-white' : 'bg-[#F0F4F7]';
                        return (
                          <tr key={idx} className={`${rowBgColor} hover:bg-opacity-80 transition-colors`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.timeIn}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.timeOut}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.department || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100 font-medium">{shift.hours.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.regHours?.toFixed(2) || shift.hours.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">{shift.ot1Hours?.toFixed(2) || '0.00'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* Bottom border matching header color */}
                  <div className="h-1 bg-[#2C475E]"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Expected Pay (${hourlyRate}/hr)</p>
                  <p className="text-2xl font-bold text-gray-900">${expectedPay.toFixed(2)}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Pay (optional)
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

              <div className="mb-4">
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

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Pay Period'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


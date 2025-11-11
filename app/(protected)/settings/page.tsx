'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, updateHourlyRate } from '@/app/actions/settings';
import { exportBackup, importBackup } from '@/app/actions/backup';
import { logout } from '@/lib/utils/auth';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi';

export default function SettingsPage() {
  const router = useRouter();
  const [hourlyRate, setHourlyRate] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    // Use replace to prevent back button from going to protected pages
    router.replace('/login');
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await getSettings();
    if (result.success && result.data) {
      setHourlyRate(result.data.hourly_rate || 15);
    }
  };

  const handleSaveRate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateHourlyRate(hourlyRate);
    if (result.success) {
      setSuccess('Hourly rate updated successfully');
    } else {
      setError(result.error || 'Failed to update hourly rate');
    }
    setLoading(false);
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const backup = await exportBackup();
      if (backup) {
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paylog-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccess('Backup exported successfully');
      } else {
        setError('Failed to export backup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    }
    setLoading(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.payPeriods || !backup.shifts || !backup.settings) {
        throw new Error('Invalid backup file format');
      }

      const result = await importBackup(backup);
      if (result.success) {
        setSuccess('Backup imported successfully');
        await loadSettings();
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        setError(result.error || 'Failed to import backup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid backup file');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2 sm:mb-4 px-3 py-1.5 sm:py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm sm:text-base font-medium group"
          >
            <HiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Hourly Rate */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hourly Rate</h2>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveRate}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup & Restore</h2>
            <p className="text-sm text-gray-600 mb-4">
              Export your data as JSON or import from a previous backup.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleExport}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {loading ? 'Exporting...' : 'Export JSON'}
              </button>
              <label className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center cursor-pointer disabled:opacity-50">
                {loading ? 'Importing...' : 'Import JSON'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* Logout */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


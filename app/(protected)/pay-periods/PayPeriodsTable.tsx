'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO, subMonths, startOfYear, isWithinInterval } from 'date-fns';
import { deletePayPeriod } from '@/app/actions/pay-periods';
import { HiTrash, HiEye } from 'react-icons/hi';

type DateFilterType = 'all' | 'last-3-months' | 'this-year' | 'custom';

interface PayPeriod {
  id: string;
  start_date: string;
  end_date: string;
  total_hours: number | null;
  expected_pay: number | null;
  actual_pay: number | null;
  difference: number | null;
  notes: string | null;
  deductions_count?: number;
  deductions_total?: number;
  deduction_reasons?: string[];
}

export default function PayPeriodsTable({
  payPeriods: initialPayPeriods,
}: {
  payPeriods: PayPeriod[];
}) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [showWithDeductions, setShowWithDeductions] = useState(false);
  const [showNoDeductions, setShowNoDeductions] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [payPeriodToDelete, setPayPeriodToDelete] = useState<{ id: string; period: string } | null>(null);

  const filteredPayPeriods = useMemo(() => {
    let filtered = [...initialPayPeriods];

    if (showLatest) {
      if (filtered.length > 0) {
        const latestPeriod = filtered.reduce((latest, current) => {
          const latestDate = parseISO(latest.end_date);
          const currentDate = parseISO(current.end_date);
          return currentDate > latestDate ? current : latest;
        }, filtered[0]);
        filtered = [latestPeriod];
      }
    }

    if (!showLatest) {
      if (showWithDeductions && !showNoDeductions) {
        filtered = filtered.filter((pp) => (pp.deductions_count || 0) > 0);
      } else if (showNoDeductions && !showWithDeductions) {
        filtered = filtered.filter((pp) => (pp.deductions_count || 0) === 0);
      } else if (showWithDeductions && showNoDeductions) {
      }
    }

    if (!showLatest) {
      if (dateFilter === 'last-3-months') {
      const threeMonthsAgo = subMonths(new Date(), 3);
      filtered = filtered.filter((pp) => {
        const startDate = parseISO(pp.start_date);
        return startDate >= threeMonthsAgo;
      });
    } else if (dateFilter === 'this-year') {
      const yearStart = startOfYear(new Date());
      filtered = filtered.filter((pp) => {
        const startDate = parseISO(pp.start_date);
        return startDate >= yearStart;
      });
    } else if (dateFilter === 'custom') {
      if (customStartDate && customEndDate) {
        try {
          const start = parseISO(customStartDate);
          const end = parseISO(customEndDate);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            filtered = filtered.filter((pp) => {
              try {
                const periodStart = parseISO(pp.start_date);
                if (isNaN(periodStart.getTime())) return false;
                return isWithinInterval(periodStart, { start, end });
              } catch {
                return false;
              }
            });
          }
        } catch (error) {
        }
      }
      }
    }

    if (!showLatest) {
      if (minAmount) {
        const min = parseFloat(minAmount);
        if (!isNaN(min)) {
          filtered = filtered.filter((pp) => {
            const amount = pp.actual_pay || pp.expected_pay || 0;
            return amount >= min;
          });
        }
      }
      if (maxAmount) {
        const max = parseFloat(maxAmount);
        if (!isNaN(max)) {
          filtered = filtered.filter((pp) => {
            const amount = pp.actual_pay || pp.expected_pay || 0;
            return amount <= max;
          });
        }
      }
    }

    if (!showLatest && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((pp) => {
        const notes = (pp.notes || '').toLowerCase();
        const deductionReasons = ((pp as any).deduction_reasons || []).join(' ').toLowerCase();
        const periodDate = format(parseISO(pp.start_date), 'MMM d, yyyy').toLowerCase();
        return notes.includes(query) || deductionReasons.includes(query) || periodDate.includes(query);
      });
    }

    return filtered;
  }, [initialPayPeriods, showWithDeductions, showNoDeductions, showLatest, dateFilter, customStartDate, customEndDate, minAmount, maxAmount, searchQuery]);

  const clearAllFilters = () => {
    setShowWithDeductions(false);
    setShowNoDeductions(false);
    setShowLatest(false);
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
  };

  const handleDeleteClick = (id: string, period: string) => {
    setPayPeriodToDelete({ id, period });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!payPeriodToDelete) return;

    setDeletingId(payPeriodToDelete.id);
    setShowDeleteModal(false);
    
    try {
      const result = await deletePayPeriod(payPeriodToDelete.id);
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete pay period');
      }
    } catch (error) {
      alert('An error occurred while deleting the pay period');
    } finally {
      setDeletingId(null);
      setPayPeriodToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPayPeriodToDelete(null);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20">
      <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
        <div className="mb-3 sm:mb-4">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">All Pay Periods</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-1 sm:gap-2"
            >
              {showFilters ? (
                <>
                  <span className="hidden sm:inline">Hide Filters</span>
                  <span className="sm:hidden">Hide</span>
                  <span>▲</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Show Filters</span>
                  <span className="sm:hidden">Filters</span>
                  <span>▼</span>
                </>
              )}
            </button>
          </div>
          
          <div className="mb-3 sm:mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by notes, deduction reasons, or dates..."
              disabled={showLatest}
              className={`w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                showLatest ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
              }`}
            />
          </div>

          {showFilters && (
            <>
              <div className={`grid gap-3 sm:gap-4 mb-3 sm:mb-4 ${
                dateFilter === 'custom' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as DateFilterType);
                  if (e.target.value !== 'custom') {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }
                }}
                disabled={showLatest}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 ${
                  showLatest ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                }`}
              >
                <option value="all">All Time</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    disabled={showLatest}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 ${
                      showLatest ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    disabled={showLatest}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 ${
                      showLatest ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                    }`}
                  />
                </div>
              </>
            )}

            {/* Amount Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                step="0.01"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                disabled={showLatest}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 ${
                  showLatest ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                step="0.01"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="No limit"
                disabled={showLatest}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 ${
                  showLatest ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                }`}
              />
            </div>
              </div>

          {/* Deductions Filter Buttons - Toggleable */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs sm:text-sm font-medium text-gray-700 mr-1 sm:mr-2">Filters:</span>
            <button
              onClick={() => {
                setShowLatest(false);
                setShowWithDeductions(!showWithDeductions);
              }}
              disabled={showLatest}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition ${
                showWithDeductions
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${showLatest ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {showWithDeductions ? '✓ ' : ''}<span className="hidden sm:inline">With </span>Deductions
            </button>
            <button
              onClick={() => {
                setShowLatest(false);
                setShowNoDeductions(!showNoDeductions);
              }}
              disabled={showLatest}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition ${
                showNoDeductions
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${showLatest ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {showNoDeductions ? '✓ ' : ''}<span className="hidden sm:inline">No </span>Deductions
            </button>
            <button
              onClick={() => {
                setShowWithDeductions(false);
                setShowNoDeductions(false);
                setShowLatest(!showLatest);
              }}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition ${
                showLatest
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showLatest ? '✓ ' : ''}Latest
            </button>
            {(showWithDeductions || showNoDeductions || showLatest || dateFilter !== 'all' || minAmount || maxAmount || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Clear All
              </button>
            )}
          </div>
            </>
          )}
        </div>
        
        <div className="text-xs sm:text-sm text-gray-600">
          Showing {filteredPayPeriods.length} of {initialPayPeriods.length} pay periods
        </div>
      </div>
      
      <div className="hidden md:block overflow-x-auto border-t border-gray-300">
        <table className="w-full">
          <thead className="bg-[#2C475E]">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Period</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Hours</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Expected</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Actual</th>
              <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayPeriods.length === 0 ? (
              <tr className="bg-white">
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {initialPayPeriods.length === 0
                    ? 'No pay periods yet. Upload a PDF or create one manually.'
                    : 'No pay periods match your filters. Try adjusting your search criteria.'}
                </td>
              </tr>
            ) : (
              filteredPayPeriods.map((pp, index) => {
                const hasDeductions = (pp.deductions_total || 0) > 0;
                const isEven = index % 2 === 0;
                const rowBgColor = hasDeductions 
                  ? 'bg-red-50 border-l-4 border-l-red-500' 
                  : isEven 
                    ? 'bg-white' 
                    : 'bg-[#F0F4F7]';
                
                return (
                <tr 
                  key={pp.id} 
                  className={`${rowBgColor} hover:bg-opacity-80 transition-colors`}
                >
                  <td className="px-4 md:px-6 py-4 text-sm text-[#333333] border-b border-gray-100">
                    <div className="flex flex-col">
                      <Link
                        href={`/pay-period/${pp.id}`}
                        className={`font-medium ${
                          hasDeductions 
                            ? 'text-red-700 hover:text-red-900' 
                            : 'text-[#2C475E] hover:text-[#1a2f3f]'
                        }`}
                      >
                        {(() => {
                          const start = parseISO(pp.start_date);
                          const end = parseISO(pp.end_date);
                          
                          if (start.getTime() === end.getTime()) {
                            return format(start, 'MMM d, yyyy');
                          }
                          
                          const startYear = start.getFullYear();
                          const endYear = end.getFullYear();
                          
                          if (startYear !== endYear) {
                            return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
                          }
                          return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
                        })()}
                      </Link>
                      {hasDeductions && pp.deduction_reasons && pp.deduction_reasons.length > 0 && (
                        <span className="text-xs text-red-600 mt-1">
                          {pp.deduction_reasons.join(', ')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">
                    {pp.total_hours?.toFixed(1) || '0.0'}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-[#333333] border-b border-gray-100">
                    ${pp.expected_pay?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm border-b border-gray-100">
                    {pp.actual_pay ? (
                      <span className="text-green-600 font-medium">
                        ${pp.actual_pay.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/pay-period/${pp.id}`}
                        className="text-[#2C475E] hover:text-[#1a2f3f] transition-colors"
                        title="View pay period"
                      >
                        <HiEye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => {
                          const start = parseISO(pp.start_date);
                          const end = parseISO(pp.end_date);
                          let periodString;
                          if (start.getTime() === end.getTime()) {
                            periodString = format(start, 'MMM d, yyyy');
                          } else {
                            const startYear = start.getFullYear();
                            const endYear = end.getFullYear();
                            periodString = startYear !== endYear
                              ? `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
                              : `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
                          }
                          handleDeleteClick(pp.id, periodString);
                        }}
                        disabled={deletingId === pp.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Delete pay period"
                      >
                        {deletingId === pp.id ? (
                          <span className="text-xs">Deleting...</span>
                        ) : (
                          <HiTrash className="w-4 h-4" />
                        )}
                      </button>
                    </div>
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
        {filteredPayPeriods.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {initialPayPeriods.length === 0
              ? 'No pay periods yet. Upload a PDF or create one manually.'
              : 'No pay periods match your filters. Try adjusting your search criteria.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPayPeriods.map((pp, index) => {
              const hasDeductions = (pp.deductions_total || 0) > 0;
              const isEven = index % 2 === 0;
              const cardBgColor = hasDeductions 
                ? 'bg-red-50 border-l-4 border-l-red-500' 
                : isEven 
                  ? 'bg-white' 
                  : 'bg-[#F0F4F7]';
              
              return (
                <div 
                  key={pp.id} 
                  className={`${cardBgColor} p-4`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <Link
                        href={`/pay-period/${pp.id}`}
                        className={`font-medium ${
                          hasDeductions 
                            ? 'text-red-700' 
                            : 'text-[#2C475E]'
                        }`}
                      >
                        {(() => {
                          const start = parseISO(pp.start_date);
                          const end = parseISO(pp.end_date);
                          
                          if (start.getTime() === end.getTime()) {
                            return format(start, 'MMM d, yyyy');
                          }
                          
                          const startYear = start.getFullYear();
                          const endYear = end.getFullYear();
                          
                          if (startYear !== endYear) {
                            return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
                          }
                          return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
                        })()}
                      </Link>
                      {hasDeductions && pp.deduction_reasons && pp.deduction_reasons.length > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          {pp.deduction_reasons.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <Link
                        href={`/pay-period/${pp.id}`}
                        className="text-[#2C475E] hover:text-[#1a2f3f] transition-colors"
                        title="View pay period"
                      >
                        <HiEye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => {
                          const start = parseISO(pp.start_date);
                          const end = parseISO(pp.end_date);
                          let periodString;
                          if (start.getTime() === end.getTime()) {
                            periodString = format(start, 'MMM d, yyyy');
                          } else {
                            const startYear = start.getFullYear();
                            const endYear = end.getFullYear();
                            periodString = startYear !== endYear
                              ? `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
                              : `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
                          }
                          handleDeleteClick(pp.id, periodString);
                        }}
                        disabled={deletingId === pp.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Delete pay period"
                      >
                        {deletingId === pp.id ? (
                          <span className="text-xs">Deleting...</span>
                        ) : (
                          <HiTrash className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Hours</p>
                      <p className="font-medium text-gray-900">{pp.total_hours?.toFixed(1) || '0.0'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Expected</p>
                      <p className="font-medium text-gray-900">${pp.expected_pay?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Actual</p>
                      {pp.actual_pay ? (
                        <p className="font-medium text-green-600">${pp.actual_pay.toFixed(2)}</p>
                      ) : (
                        <p className="font-medium text-gray-400">-</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="h-1 bg-[#2C475E]"></div>
      </div>

      {showDeleteModal && payPeriodToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <HiTrash className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Pay Period</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the pay period{' '}
              <span className="font-semibold text-gray-900">{payPeriodToDelete.period}</span>?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId === payPeriodToDelete.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === payPeriodToDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



'use client';

import { useState, useMemo } from 'react';
import {
  calculateHouseholdIncome,
  type CalculationConfig,
} from '@/lib/income-calculator';
import {
  calculateExpenseSummary,
  calculateDisposableIncome,
} from '@/lib/expense-calculator';
import { useFinance } from '@/lib/finance-context';

type ViewMode = 'fortnightly' | 'monthly' | 'annual';

export default function CashFlowPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('fortnightly');

  // Get all data from context
  const {
    financialYear,
    includeMedicare,
    andyIncome,
    nadieleIncome,
    andyVoluntarySuper,
    nadieleVoluntarySuper,
    expenses,
  } = useFinance();

  const config: CalculationConfig = {
    includeMedicareLevy: includeMedicare,
    financialYear,
    voluntarySuperRate: {
      andy: andyVoluntarySuper / 100,
      nadiele: nadieleVoluntarySuper / 100,
    },
    spendableExclusions: {
      andy: andyIncome.allowances + andyIncome.preTotalAdjustments,
      nadiele: nadieleIncome.allowances + nadieleIncome.preTotalAdjustments,
    },
  };

  // Calculate income
  const incomeData = useMemo(
    () => calculateHouseholdIncome(andyIncome, nadieleIncome, config),
    [andyIncome, nadieleIncome, config]
  );

  const expenseSummary = useMemo(() => calculateExpenseSummary(expenses), [expenses]);

  const disposableIncome = useMemo(
    () =>
      calculateDisposableIncome(
        incomeData.andy.spendableIncome,
        incomeData.nadiele.spendableIncome,
        expenseSummary
      ),
    [incomeData, expenseSummary]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get data based on view mode
  const getData = () => {
    switch (viewMode) {
      case 'fortnightly':
        return {
          andy: {
            spendable: disposableIncome.andy.spendableIncome,
            expenses: disposableIncome.andy.expenses,
            disposable: disposableIncome.andy.disposable,
          },
          nadiele: {
            spendable: disposableIncome.nadiele.spendableIncome,
            expenses: disposableIncome.nadiele.expenses,
            disposable: disposableIncome.nadiele.disposable,
          },
          combined: {
            spendable: disposableIncome.combined.spendableIncome,
            expenses: disposableIncome.combined.expenses,
            disposable: disposableIncome.combined.disposable,
          },
        };
      case 'monthly':
        return {
          andy: {
            spendable: disposableIncome.andy.monthly.spendableIncome,
            expenses: disposableIncome.andy.monthly.expenses,
            disposable: disposableIncome.andy.monthly.disposable,
          },
          nadiele: {
            spendable: disposableIncome.nadiele.monthly.spendableIncome,
            expenses: disposableIncome.nadiele.monthly.expenses,
            disposable: disposableIncome.nadiele.monthly.disposable,
          },
          combined: {
            spendable: disposableIncome.combined.monthly.spendableIncome,
            expenses: disposableIncome.combined.monthly.expenses,
            disposable: disposableIncome.combined.monthly.disposable,
          },
        };
      case 'annual':
        return {
          andy: {
            spendable: disposableIncome.andy.annual.spendableIncome,
            expenses: disposableIncome.andy.annual.expenses,
            disposable: disposableIncome.andy.annual.disposable,
          },
          nadiele: {
            spendable: disposableIncome.nadiele.annual.spendableIncome,
            expenses: disposableIncome.nadiele.annual.expenses,
            disposable: disposableIncome.nadiele.annual.disposable,
          },
          combined: {
            spendable: disposableIncome.combined.annual.spendableIncome,
            expenses: disposableIncome.combined.annual.expenses,
            disposable: disposableIncome.combined.annual.disposable,
          },
        };
    }
  };

  const data = getData();

  return (
    <div className="container mx-auto px-2 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cash Flow & Disposable Income</h1>
        <p className="text-gray-600">
          Spendable income minus expenses = Disposable income
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <div className="flex flex-wrap gap-2 md:gap-4">
          <button
            onClick={() => setViewMode('fortnightly')}
            className={`px-4 md:px-6 py-2 rounded font-medium text-sm md:text-base ${
              viewMode === 'fortnightly'
                ? 'bg-tan text-white'
                : 'bg-gray-light text-gray-700 hover:bg-charcoal hover:text-white'
            }`}
          >
            Fortnightly
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 md:px-6 py-2 rounded font-medium text-sm md:text-base ${
              viewMode === 'monthly'
                ? 'bg-tan text-white'
                : 'bg-gray-light text-gray-700 hover:bg-charcoal hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode('annual')}
            className={`px-4 md:px-6 py-2 rounded font-medium text-sm md:text-base ${
              viewMode === 'annual'
                ? 'bg-tan text-white'
                : 'bg-gray-light text-gray-700 hover:bg-charcoal hover:text-white'
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      {/* Cash Flow Breakdown */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">
          Cash Flow Breakdown ({viewMode.charAt(0).toUpperCase() + viewMode.slice(1)})
        </h2>
        <div className="md:hidden space-y-3">
          {[
            { label: 'Spendable Income', andy: data.andy.spendable, nadiele: data.nadiele.spendable, combined: data.combined.spendable, colorClass: 'text-green-700', prefix: '' },
            { label: 'Less: Expenses', andy: data.andy.expenses, nadiele: data.nadiele.expenses, combined: data.combined.expenses, colorClass: 'text-red-600', prefix: '-' },
            { label: 'Disposable Income', andy: data.andy.disposable, nadiele: data.nadiele.disposable, combined: data.combined.disposable, colorClass: data.combined.disposable >= 0 ? 'text-green-700' : 'text-red-700', bold: true, prefix: '' },
          ].map((row) => (
            <div key={row.label} className="border rounded-lg p-3">
              <p className={`text-sm font-medium mb-2 ${row.bold ? 'text-base font-bold' : 'text-gray-600'}`}>{row.label}</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-xs text-gray-500 block">Andy</span><span className={`font-semibold ${row.colorClass}`}>{row.prefix}{formatCurrency(row.andy)}</span></div>
                <div><span className="text-xs text-gray-500 block">Nadiele</span><span className={`font-semibold ${row.colorClass}`}>{row.prefix}{formatCurrency(row.nadiele)}</span></div>
                <div><span className="text-xs text-gray-500 block">Combined</span><span className={`font-bold ${row.colorClass}`}>{row.prefix}{formatCurrency(row.combined)}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-charcoal text-white">
                <th className="border p-3 text-left"></th>
                <th className="border p-3 text-right">Andy</th>
                <th className="border p-3 text-right">Nadiele</th>
                <th className="border p-3 text-right bg-tan text-charcoal">Combined</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-green-50">
                <td className="border p-3 font-bold">Spendable Income</td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.andy.spendable)}
                </td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.nadiele.spendable)}
                </td>
                <td className="border p-3 text-right font-bold bg-green-100">
                  {formatCurrency(data.combined.spendable)}
                </td>
              </tr>
              <tr className="bg-red-50">
                <td className="border p-3 font-medium">Less: Expenses</td>
                <td className="border p-3 text-right font-medium text-red-600">
                  -{formatCurrency(data.andy.expenses)}
                </td>
                <td className="border p-3 text-right font-medium text-red-600">
                  -{formatCurrency(data.nadiele.expenses)}
                </td>
                <td className="border p-3 text-right font-medium text-red-600 bg-red-100">
                  -{formatCurrency(data.combined.expenses)}
                </td>
              </tr>
              <tr
                className={
                  data.combined.disposable >= 0 ? 'bg-yellow-50' : 'bg-orange-100'
                }
              >
                <td className="border p-3 font-bold text-lg">Disposable Income</td>
                <td
                  className={`border p-3 text-right font-bold text-lg ${
                    data.andy.disposable >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(data.andy.disposable)}
                </td>
                <td
                  className={`border p-3 text-right font-bold text-lg ${
                    data.nadiele.disposable >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(data.nadiele.disposable)}
                </td>
                <td
                  className={`border p-3 text-right font-bold text-lg ${
                    data.combined.disposable >= 0
                      ? 'text-green-700 bg-yellow-100'
                      : 'text-red-700 bg-orange-200'
                  }`}
                >
                  {formatCurrency(data.combined.disposable)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* All Views Summary */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Complete Cash Flow Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fortnightly */}
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-3 text-charcoal">Fortnightly</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Andy Disposable:</span>
                <span
                  className={`font-medium ${
                    disposableIncome.andy.disposable >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(disposableIncome.andy.disposable)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nadiele Disposable:</span>
                <span
                  className={`font-medium ${
                    disposableIncome.nadiele.disposable >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(disposableIncome.nadiele.disposable)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Combined:</span>
                <span
                  className={
                    disposableIncome.combined.disposable >= 0
                      ? 'text-green-700'
                      : 'text-red-700'
                  }
                >
                  {formatCurrency(disposableIncome.combined.disposable)}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly */}
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-3 text-green-600">Monthly</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Andy Disposable:</span>
                <span
                  className={`font-medium ${
                    disposableIncome.andy.monthly.disposable >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(disposableIncome.andy.monthly.disposable)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nadiele Disposable:</span>
                <span
                  className={`font-medium ${
                    disposableIncome.nadiele.monthly.disposable >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(disposableIncome.nadiele.monthly.disposable)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Combined:</span>
                <span
                  className={
                    disposableIncome.combined.monthly.disposable >= 0
                      ? 'text-green-700'
                      : 'text-red-700'
                  }
                >
                  {formatCurrency(disposableIncome.combined.monthly.disposable)}
                </span>
              </div>
            </div>
          </div>

          {/* Annual */}
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-3 text-purple-600">Annual</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Andy Disposable:</span>
                <span
                  className={`font-medium ${
                    disposableIncome.andy.annual.disposable >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(disposableIncome.andy.annual.disposable)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nadiele Disposable:</span>
                <span
                  className={`font-medium ${
                    disposableIncome.nadiele.annual.disposable >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(disposableIncome.nadiele.annual.disposable)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Combined:</span>
                <span
                  className={
                    disposableIncome.combined.annual.disposable >= 0
                      ? 'text-green-700'
                      : 'text-red-700'
                  }
                >
                  {formatCurrency(disposableIncome.combined.annual.disposable)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {disposableIncome.combined.annual.disposable < 0 && (
          <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded">
            <p className="text-red-800 font-medium">
              ⚠️ Warning: Negative disposable income detected. Expenses exceed
              spendable income.
            </p>
          </div>
        )}

        {disposableIncome.combined.annual.disposable >= 0 && (
          <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded">
            <p className="text-green-800 font-medium">
              ✓ Positive cash flow. Annual surplus: {formatCurrency(disposableIncome.combined.annual.disposable)}
            </p>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-cream border border-tan rounded">
        <p className="text-sm text-gray-700">
          <strong>💡 Tip:</strong> Your data is automatically saved and synced across all pages!
        </p>
        <ul className="list-disc ml-6 mt-2 text-sm text-gray-700">
          <li>Update income on the <a href="/" className="text-charcoal underline font-medium">Income & Tax</a> page</li>
          <li>Manage expenses on the <a href="/expenses" className="text-charcoal underline font-medium">Expenses</a> page</li>
          <li>Changes appear instantly here and persist even after browser refresh</li>
        </ul>
      </div>
    </div>
  );
}

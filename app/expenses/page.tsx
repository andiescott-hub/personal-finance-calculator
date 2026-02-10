'use client';

import { useState } from 'react';
import {
  calculateExpenseSummary,
  type ExpenseItem,
  type ExpenseFrequency,
} from '@/lib/expense-calculator';
import { useFinance } from '@/lib/finance-context';
import { CurrencyInput, PercentInput } from '@/components/formatted-input';

export default function ExpensesPage() {
  const {
    expenses,
    setExpenses,
    andyPortfolioContribution,
    setAndyPortfolioContribution,
    nadielePortfolioContribution,
    setNadielePortfolioContribution,
  } = useFinance();

  const [newExpense, setNewExpense] = useState<Partial<ExpenseItem>>({
    name: '',
    category: '',
    amount: 0,
    frequency: 'monthly',
    andyProportion: 50,
    nadieleProportion: 50,
  });

  const [sortBy, setSortBy] = useState<'name' | 'category' | 'amount' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const summary = calculateExpenseSummary(expenses);

  // Sort expenses
  const sortedExpenses = [...summary.expenses].sort((a, b) => {
    if (!sortBy) return 0;

    let aVal, bVal;
    if (sortBy === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    } else if (sortBy === 'category') {
      aVal = a.category.toLowerCase();
      bVal = b.category.toLowerCase();
    } else if (sortBy === 'amount') {
      aVal = a.totalAmount;
      bVal = b.totalAmount;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column: 'name' | 'category' | 'amount') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const addExpense = () => {
    if (!newExpense.name || !newExpense.category || !newExpense.amount) {
      alert('Please fill in all fields');
      return;
    }

    const expense: ExpenseItem = {
      id: Date.now().toString(),
      name: newExpense.name,
      category: newExpense.category,
      amount: newExpense.amount,
      frequency: newExpense.frequency as ExpenseFrequency,
      andyProportion: newExpense.andyProportion || 50,
      nadieleProportion: newExpense.nadieleProportion || 50,
    };

    setExpenses([...expenses, expense]);
    setNewExpense({
      name: '',
      category: '',
      amount: 0,
      frequency: 'monthly',
      andyProportion: 50,
      nadieleProportion: 50,
    });
  };

  const deleteExpense = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setExpenses(expenses.filter((e) => e.id !== id));
    }
  };

  const updateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  return (
    <div className="container mx-auto px-2 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Expense Management</h1>
        <p className="text-gray-600">
          Manage household expenses with proportional distribution
        </p>
      </div>

      {/* Summary Totals - at top */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Expense Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fortnightly */}
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-3 text-charcoal">Fortnightly</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Andy:</span>
                <span className="font-medium">
                  {formatCurrency(summary.totals.fortnightly.andy)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nadiele:</span>
                <span className="font-medium">
                  {formatCurrency(summary.totals.fortnightly.nadiele)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Combined:</span>
                <span>{formatCurrency(summary.totals.fortnightly.combined)}</span>
              </div>
            </div>
          </div>

          {/* Monthly */}
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-3 text-green-600">Monthly</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Andy:</span>
                <span className="font-medium">
                  {formatCurrency(summary.totals.monthly.andy)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nadiele:</span>
                <span className="font-medium">
                  {formatCurrency(summary.totals.monthly.nadiele)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Combined:</span>
                <span>{formatCurrency(summary.totals.monthly.combined)}</span>
              </div>
            </div>
          </div>

          {/* Annual */}
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-3 text-purple-600">Annual</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Andy:</span>
                <span className="font-medium">
                  {formatCurrency(summary.totals.annual.andy)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nadiele:</span>
                <span className="font-medium">
                  {formatCurrency(summary.totals.annual.nadiele)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Combined:</span>
                <span>{formatCurrency(summary.totals.annual.combined)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Expenses</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-charcoal text-white">
                <th className="border p-3 text-left cursor-pointer hover:bg-gray-700" onClick={() => handleSort('name')}>
                  Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="border p-3 text-left cursor-pointer hover:bg-gray-700" onClick={() => handleSort('category')}>
                  Category {sortBy === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="border p-3 text-right cursor-pointer hover:bg-gray-700" onClick={() => handleSort('amount')}>
                  Amount {sortBy === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="border p-3 text-center">Frequency</th>
                <th className="border p-3 text-right">Andy %</th>
                <th className="border p-3 text-right">Nadiele %</th>
                <th className="border p-3 text-right">Andy Share</th>
                <th className="border p-3 text-right">Nadiele Share</th>
                <th className="border p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="border p-3">
                    <input
                      type="text"
                      value={exp.name}
                      onChange={(e) =>
                        updateExpense(exp.id, { name: e.target.value })
                      }
                      className="border-0 focus:border-blue-500 rounded p-1 min-w-[80px]"
                    />
                  </td>
                  <td className="border p-3">
                    <input
                      type="text"
                      value={exp.category}
                      onChange={(e) =>
                        updateExpense(exp.id, { category: e.target.value })
                      }
                      className="border-0 focus:border-blue-500 rounded p-1 w-24"
                    />
                  </td>
                  <td className="border p-3 text-right">
                    {(exp.id === 'mortgage-auto' || exp.id === 'mortgage-extra-auto' || exp.id.startsWith('education-auto-') || exp.name.toLowerCase().includes('mortgage')) ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium text-gray-700">
                          {formatCurrency(exp.totalAmount)}
                        </span>
                        <span className="text-xs text-gray-500 italic">
                          ({exp.id === 'mortgage-extra-auto' ? 'extra' : 'auto'})
                        </span>
                      </div>
                    ) : (
                      <CurrencyInput
                        value={exp.totalAmount}
                        onChange={(val) => updateExpense(exp.id, { amount: val })}
                        className="text-right border-0 focus:border-blue-500 rounded p-1 w-28"
                      />
                    )}
                  </td>
                  <td className="border p-3 text-center">
                    <select
                      value={exp.frequency}
                      onChange={(e) =>
                        updateExpense(exp.id, {
                          frequency: e.target.value as ExpenseFrequency,
                        })
                      }
                      className="border rounded p-1"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </td>
                  <td className="border p-3 text-right">
                    <PercentInput
                      value={exp.andyPercentage}
                      onChange={(val) => {
                        // Update Andy proportion and auto-adjust Nadiele
                        updateExpense(exp.id, {
                          andyProportion: val,
                          nadieleProportion: 100 - val,
                        });
                      }}
                      className="text-right border-0 focus:border-blue-500 rounded p-1 w-16"
                      min={0}
                      max={100}
                      step={1}
                    />
                  </td>
                  <td className="border p-3 text-right">
                    <PercentInput
                      value={exp.nadielePercentage}
                      onChange={(val) => {
                        // Update Nadiele proportion and auto-adjust Andy
                        updateExpense(exp.id, {
                          nadieleProportion: val,
                          andyProportion: 100 - val,
                        });
                      }}
                      className="text-right border-0 focus:border-blue-500 rounded p-1 w-16"
                      min={0}
                      max={100}
                      step={1}
                    />
                  </td>
                  <td className="border p-3 text-right font-medium">
                    {formatCurrency(exp.andyShare)}
                  </td>
                  <td className="border p-3 text-right font-medium">
                    {formatCurrency(exp.nadieleShare)}
                  </td>
                  <td className="border p-3 text-center">
                    {(exp.id === 'mortgage-auto' || exp.id === 'mortgage-extra-auto' || exp.id.startsWith('education-auto-')) ? (
                      <span className="text-gray-400 text-sm italic">auto</span>
                    ) : (
                      <button
                        onClick={() => deleteExpense(exp.id, exp.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Expense */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
              className="border rounded p-2"
              placeholder="e.g., Rent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <input
              type="text"
              value={newExpense.category}
              onChange={(e) =>
                setNewExpense({ ...newExpense, category: e.target.value })
              }
              className="border rounded p-2"
              placeholder="e.g., Housing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <CurrencyInput
              value={newExpense.amount || 0}
              onChange={(val) => setNewExpense({ ...newExpense, amount: val })}
              className="border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Frequency</label>
            <select
              value={newExpense.frequency}
              onChange={(e) =>
                setNewExpense({
                  ...newExpense,
                  frequency: e.target.value as ExpenseFrequency,
                })
              }
              className="border rounded p-2"
            >
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Andy</label>
            <PercentInput
              value={newExpense.andyProportion || 50}
              onChange={(val) => setNewExpense({ ...newExpense, andyProportion: val })}
              className="border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nadiele</label>
            <PercentInput
              value={newExpense.nadieleProportion || 50}
              onChange={(val) => setNewExpense({ ...newExpense, nadieleProportion: val })}
              className="border rounded p-2"
            />
          </div>
        </div>
        <button
          onClick={addExpense}
          className="mt-4 bg-tan text-white px-6 py-2 rounded hover:bg-charcoal text-white"
        >
          Add Expense
        </button>
      </div>

      {/* Investment Contributions - at bottom */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-green-900">Portfolio Investment Contributions</h2>
        </div>
        <p className="text-sm text-green-700 mb-4">
          Annual contributions that build your investment portfolio during working years. These reduce your disposable income but grow your wealth.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 rounded-lg p-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Andy's Annual Contribution
            </label>
            <CurrencyInput
              value={andyPortfolioContribution}
              onChange={(val) => setAndyPortfolioContribution(val)}
              className="w-full border-2 border-green-300 rounded p-3 text-lg font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
            <p className="text-xs text-gray-500 mt-2">
              Per year (stops at retirement)
            </p>
          </div>
          <div className="bg-white/80 rounded-lg p-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Nadiele's Annual Contribution
            </label>
            <CurrencyInput
              value={nadielePortfolioContribution}
              onChange={(val) => setNadielePortfolioContribution(val)}
              className="w-full border-2 border-green-300 rounded p-3 text-lg font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
            <p className="text-xs text-gray-500 mt-2">
              Per year (stops at retirement)
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/60 rounded border border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Combined Annual Investment:</span>
            <span className="text-xl font-bold text-green-700">
              {formatCurrency(andyPortfolioContribution + nadielePortfolioContribution)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

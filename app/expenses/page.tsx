'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  calculateExpenseSummary,
  type ExpenseItem,
  type ExpenseFrequency,
} from '@/lib/expense-calculator';
import { calculateHouseholdIncome, type CalculationConfig } from '@/lib/income-calculator';
import { calculateMortgagePayment } from '@/lib/mortgage-calculator';
import { useFinance } from '@/lib/finance-context';
import { CurrencyInput, PercentInput } from '@/components/formatted-input';

export default function ExpensesPage() {
  const {
    expenses,
    setExpenses,
    assets,
    setAssets,
    andyPortfolioContribution,
    setAndyPortfolioContribution,
    nadielePortfolioContribution,
    setNadielePortfolioContribution,
    andyIncome,
    nadieleIncome,
    financialYear,
    includeMedicare,
    andyVoluntarySuper,
    nadieleVoluntarySuper,
    andyNovatedLease,
    nadieleNovatedLease,
  } = useFinance();

  // Calculate spendable income to derive expense ratio
  const incomeConfig: CalculationConfig = useMemo(() => ({
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
    novatedLease: {
      andy: { preTaxAnnual: andyNovatedLease.preTaxAnnual, postTaxAnnual: andyNovatedLease.postTaxAnnual },
      nadiele: { preTaxAnnual: nadieleNovatedLease.preTaxAnnual, postTaxAnnual: nadieleNovatedLease.postTaxAnnual },
    },
  }), [includeMedicare, financialYear, andyVoluntarySuper, nadieleVoluntarySuper, andyIncome, nadieleIncome, andyNovatedLease, nadieleNovatedLease]);

  const incomeData = useMemo(
    () => calculateHouseholdIncome(andyIncome, nadieleIncome, incomeConfig),
    [andyIncome, nadieleIncome, incomeConfig]
  );

  const andySpendable = incomeData.andy.spendableIncome;
  const nadieleSpendable = incomeData.nadiele.spendableIncome;
  const totalSpendable = andySpendable + nadieleSpendable;
  const andyPercent = totalSpendable > 0 ? Math.round(andySpendable / totalSpendable * 100) : 50;
  const nadielePercent = 100 - andyPercent;

  // Auto-update all expense proportions when income ratio changes
  useEffect(() => {
    const needsUpdate = expenses.some(
      exp => exp.andyProportion !== andyPercent || exp.nadieleProportion !== nadielePercent
    );
    if (needsUpdate) {
      setExpenses(expenses.map(exp => ({
        ...exp,
        andyProportion: andyPercent,
        nadieleProportion: nadielePercent,
      })));
    }
  }, [andyPercent, nadielePercent]);

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

  // Calculate mortgage payment
  const monthlyMortgagePayment = assets.mortgage ? calculateMortgagePayment(
    assets.mortgage.loanAmount,
    assets.mortgage.interestRate,
    assets.mortgage.loanTermYears,
    assets.mortgage.paymentsPerYear
  ) : 0;

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
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Expense Summary</h2>
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

      {/* Income-Based Ratio Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold text-blue-900 mb-1">
          Expense split based on spendable income: Andy {andyPercent}% / Nadiele {nadielePercent}%
        </p>
        <p className="text-xs text-blue-700">
          Andy spendable: {formatCurrency(andySpendable)}/yr | Nadiele spendable: {formatCurrency(nadieleSpendable)}/yr
        </p>
      </div>

      {/* Expenses List */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Current Expenses</h2>
        <div className="md:hidden space-y-3">
          {sortedExpenses.map((exp) => (
            <div key={exp.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{exp.name}</p>
                  <p className="text-xs text-gray-500">{exp.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(exp.totalAmount)}</p>
                  <p className="text-xs text-gray-500">{exp.frequency}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 border-t pt-2 mt-2">
                <span>Andy {exp.andyPercentage}%: {formatCurrency(exp.andyShare)}</span>
                <span>Nadiele {exp.nadielePercentage}%: {formatCurrency(exp.nadieleShare)}</span>
              </div>
              <div className="mt-2 text-right">
                {(exp.id === 'mortgage-auto' || exp.id === 'mortgage-extra-auto' || exp.id.startsWith('education-auto-')) ? (
                  <span className="text-gray-400 text-xs italic">auto</span>
                ) : (
                  <button onClick={() => deleteExpense(exp.id, exp.name)} className="text-red-600 text-sm">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
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
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Add New Expense</h2>
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
        </div>
        <button
          onClick={addExpense}
          className="mt-4 bg-tan text-white px-6 py-2 rounded hover:bg-charcoal text-white"
        >
          Add Expense
        </button>
      </div>

      {/* Mortgage */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Mortgage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Loan Amount</label>
            <CurrencyInput
              value={assets.mortgage?.loanAmount || 0}
              onChange={(val) =>
                setAssets({
                  ...assets,
                  mortgage: { ...(assets.mortgage || {}), loanAmount: val },
                })
              }
              className="border rounded p-2 w-full md:w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Current Balance</label>
            <CurrencyInput
              value={assets.mortgage?.currentBalance ?? assets.mortgage?.loanAmount ?? 0}
              onChange={(val) =>
                setAssets({
                  ...assets,
                  mortgage: { ...(assets.mortgage || {}), currentBalance: val },
                })
              }
              className="border rounded p-2 w-full md:w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Interest Rate</label>
            <PercentInput
              value={assets.mortgage?.interestRate || 0}
              onChange={(val) =>
                setAssets({
                  ...assets,
                  mortgage: { ...(assets.mortgage || {}), interestRate: val },
                })
              }
              className="border rounded p-2 w-full md:w-32"
              step={0.01}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Loan Term (years)</label>
            <input
              type="number"
              value={assets.mortgage?.loanTermYears || 0}
              onChange={(e) =>
                setAssets({
                  ...assets,
                  mortgage: { ...(assets.mortgage || {}), loanTermYears: Number(e.target.value) },
                })
              }
              className="border rounded p-2 w-full md:w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Frequency</label>
            <select
              value={assets.mortgage?.paymentsPerYear || 12}
              onChange={(e) =>
                setAssets({
                  ...assets,
                  mortgage: { ...(assets.mortgage || {}), paymentsPerYear: Number(e.target.value) },
                })
              }
              className="border rounded p-2 w-full md:w-32"
            >
              <option value={12}>Monthly</option>
              <option value={26}>Fortnightly</option>
              <option value={52}>Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Start Year</label>
            <input
              type="number"
              value={assets.mortgage?.startYear || new Date().getFullYear()}
              onChange={(e) =>
                setAssets({
                  ...assets,
                  mortgage: { ...(assets.mortgage || {}), startYear: Number(e.target.value) },
                })
              }
              className="border rounded p-2 w-full md:w-32"
            />
          </div>
        </div>

        {/* Extra Payment Row */}
        <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-green-800">
                Extra Monthly Payment (Optional)
              </label>
              <CurrencyInput
                value={assets.mortgage?.extraMonthlyPayment || 0}
                onChange={(val) =>
                  setAssets({
                    ...assets,
                    mortgage: { ...(assets.mortgage || {}), extraMonthlyPayment: val },
                  })
                }
                className="w-full border-2 border-green-400 rounded p-2"
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <p className="text-sm text-gray-700">
                Extra payments reduce your mortgage faster and save on interest.
                This will appear as a separate expense and reduce the balance in the forecast.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-red-50 rounded mt-4">
          <div>
            <p className="text-sm text-gray-600">Monthly Payment</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(
                (assets.mortgage?.paymentsPerYear || 12) === 12
                  ? monthlyMortgagePayment
                  : monthlyMortgagePayment * (assets.mortgage?.paymentsPerYear || 12) / 12
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Annual Payment</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(monthlyMortgagePayment * (assets.mortgage?.paymentsPerYear || 12))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payoff Year</p>
            <p className="text-xl font-bold text-red-600">
              {(assets.mortgage?.startYear || new Date().getFullYear()) + (assets.mortgage?.loanTermYears || 30)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Mortgage is included in forecast and deducted from net worth. Balance declines to $0 over loan term.
        </p>
      </div>

      {/* Investment Contributions - at bottom */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg md:text-xl font-semibold text-green-900">Portfolio Investment Contributions</h2>
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

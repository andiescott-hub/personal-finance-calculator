'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { calculateForecast } from '@/lib/forecast-calculator';
import { PercentInput } from '@/components/formatted-input';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

type ViewMode = 'table' | 'chart';

export default function ForecastPage() {
  const {
    financialYear,
    includeMedicare,
    andyIncome,
    nadieleIncome,
    andyVoluntarySuper,
    nadieleVoluntarySuper,
    andyPortfolioContribution,
    nadielePortfolioContribution,
    expenses,
    andyCurrentAge,
    setAndyCurrentAge,
    nadieleCurrentAge,
    setNadieleCurrentAge,
    andyRetirementAge,
    setAndyRetirementAge,
    nadieleRetirementAge,
    setNadieleRetirementAge,
    annualIncomeIncrease,
    setAnnualIncomeIncrease,
    annualInflationRate,
    setAnnualInflationRate,
    assets,
    children,
    educationFees,
  } = useFinance();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showYears, setShowYears] = useState<'all' | 'working' | 'retirement'>('all');

  // Calculate forecast
  const forecast = useMemo(
    () =>
      calculateForecast({
        andyCurrentAge,
        nadieleCurrentAge,
        andyIncome,
        nadieleIncome,
        expenses,
        assets,
        andyRetirementAge,
        nadieleRetirementAge,
        annualIncomeIncrease,
        annualInflationRate,
        andyVoluntarySuper,
        nadieleVoluntarySuper,
        andyPortfolioContribution,
        nadielePortfolioContribution,
        financialYear,
        includeMedicareLevy: includeMedicare,
        children,
        educationFees,
      }),
    [
      andyCurrentAge,
      nadieleCurrentAge,
      andyIncome,
      nadieleIncome,
      expenses,
      assets,
      andyRetirementAge,
      nadieleRetirementAge,
      annualIncomeIncrease,
      annualInflationRate,
      andyVoluntarySuper,
      nadieleVoluntarySuper,
      andyPortfolioContribution,
      nadielePortfolioContribution,
      financialYear,
      includeMedicare,
      children,
      educationFees,
    ]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Filter projections based on view
  const filteredProjections = useMemo(() => {
    if (showYears === 'all') return forecast.projections;
    if (showYears === 'working') {
      return forecast.projections.filter(
        (p) => p.andyAge < andyRetirementAge || p.nadieleAge < nadieleRetirementAge
      );
    }
    // retirement
    return forecast.projections.filter(
      (p) => p.andyAge >= andyRetirementAge && p.nadieleAge >= nadieleRetirementAge
    );
  }, [forecast.projections, showYears, andyRetirementAge, nadieleRetirementAge]);

  // Calculate milestone years for the chart
  const milestones = useMemo(() => {
    const p = forecast.projections;
    // Find year mortgage payments cease
    const mortgageEndYear = p.find((proj, i) =>
      i > 0 && p[i - 1].mortgageExpenses > 0 && proj.mortgageExpenses === 0
    )?.calendarYear;
    // Find year education expenses cease
    const educationEndYear = p.find((proj, i) =>
      i > 0 && p[i - 1].educationExpenses > 0 && proj.educationExpenses === 0
    )?.calendarYear;
    // Find year children expenses cease
    const childrenEndYear = p.find((proj, i) =>
      i > 0 && p[i - 1].childrenExpenses > 0 && proj.childrenExpenses === 0
    )?.calendarYear;
    // Find year retirement starts (both retired, super/portfolio drawdown begins)
    const retirementYear = p.find(
      (proj) => proj.superDrawdown > 0 || proj.portfolioDrawdown > 0
    )?.calendarYear;

    return { mortgageEndYear, educationEndYear, childrenEndYear, retirementYear };
  }, [forecast.projections]);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lifetime Financial Forecast</h1>
        <p className="text-gray-600">
          Project income, expenses, and savings from now until age 80
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Forecast Settings</h2>

        {/* Current Ages and Retirement Ages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Andy Current Age</label>
            <input
              type="number"
              value={andyCurrentAge}
              onChange={(e) => setAndyCurrentAge(Number(e.target.value))}
              className="border rounded p-2 w-20"
              min="18"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nadiele Current Age</label>
            <input
              type="number"
              value={nadieleCurrentAge}
              onChange={(e) => setNadieleCurrentAge(Number(e.target.value))}
              className="border rounded p-2 w-20"
              min="18"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Andy Retirement Age</label>
            <input
              type="number"
              value={andyRetirementAge}
              onChange={(e) => setAndyRetirementAge(Number(e.target.value))}
              className="border rounded p-2 w-20"
              min="50"
              max="80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nadiele Retirement Age</label>
            <input
              type="number"
              value={nadieleRetirementAge}
              onChange={(e) => setNadieleRetirementAge(Number(e.target.value))}
              className="border rounded p-2 w-20"
              min="50"
              max="80"
            />
          </div>
        </div>

        {/* Growth Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Annual Income Increase</label>
            <PercentInput
              value={annualIncomeIncrease}
              onChange={setAnnualIncomeIncrease}
              className="border rounded p-2 w-20"
              step={0.1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Annual Inflation Rate</label>
            <PercentInput
              value={annualInflationRate}
              onChange={setAnnualInflationRate}
              className="border rounded p-2 w-20"
              step={0.1}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Years</h3>
          <p className="text-3xl font-bold text-charcoal">{forecast.summary.totalYears}</p>
        </div>
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Income Earned</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(forecast.summary.totalIncomeEarned)}
          </p>
        </div>
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Tax Paid</h3>
          <p className="text-3xl font-bold text-red-600">
            {formatCurrency(forecast.summary.totalTaxPaid)}
          </p>
        </div>
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Super Contributed</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(forecast.summary.totalSuperContributed)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-orange-600">
            {formatCurrency(forecast.summary.totalExpenses)}
          </p>
        </div>
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Projected Net Worth at 80</h3>
          <p className="text-3xl font-bold text-tan">
            {formatCurrency(
              forecast.projections[forecast.projections.length - 1]?.totalNetWorth || 0
            )}
          </p>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-2">View Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded font-medium ${
                  viewMode === 'table'
                    ? 'bg-tan text-white'
                    : 'bg-gray-light text-gray-700 hover:bg-charcoal hover:text-white'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-4 py-2 rounded font-medium ${
                  viewMode === 'chart'
                    ? 'bg-tan text-white'
                    : 'bg-gray-light text-gray-700 hover:bg-charcoal hover:text-white'
                }`}
              >
                Chart
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Show Years</label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowYears('all')}
                className={`px-4 py-2 rounded font-medium ${
                  showYears === 'all'
                    ? 'bg-tan text-white'
                    : 'bg-gray-light text-gray-700 hover:bg-charcoal hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setShowYears('working')}
                className={`px-4 py-2 rounded font-medium ${
                  showYears === 'working'
                    ? 'bg-tan text-white'
                    : 'bg-gray-light text-gray-700 hover:bg-charcoal hover:text-white'
                }`}
              >
                Working Years
              </button>
              <button
                onClick={() => setShowYears('retirement')}
                className={`px-4 py-2 rounded font-medium ${
                  showYears === 'retirement'
                    ? 'bg-tan text-white'
                    : 'bg-gray-light text-gray-700 hover:bg-charcoal hover:text-white'
                }`}
              >
                Retirement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Retirement Milestones Summary */}
      {(() => {
        // Find retirement year (when both are retired)
        const retirementProjection = forecast.projections.find(
          (p) => p.andyAge >= andyRetirementAge && p.nadieleAge >= nadieleRetirementAge
        );

        // Find age 80 projection
        const age80Projection = forecast.projections.find((p) => p.andyAge === 80);

        if (!retirementProjection || !age80Projection) return null;

        return (
          <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Retirement Milestones</h2>
            <p className="text-sm text-gray-600 mb-4">
              Compare your super and portfolio balances at key milestones to determine the best retirement spending ratio.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* At Retirement */}
              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                <h3 className="text-lg font-bold text-green-800 mb-3">
                  At Retirement (Age {retirementProjection.andyAge}/{retirementProjection.nadieleAge})
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="font-medium">Super Balance:</span>
                    <span className="text-purple-600 font-bold">
                      {formatCurrency(retirementProjection.totalSuperBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="font-medium">Portfolio:</span>
                    <span className="text-blue-600 font-bold">
                      {formatCurrency(retirementProjection.portfolioValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-100 rounded border-t-2 border-green-500">
                    <span className="font-bold">Total Assets:</span>
                    <span className="text-green-800 font-bold text-lg">
                      {formatCurrency(
                        retirementProjection.totalSuperBalance + retirementProjection.portfolioValue
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    <div>Super: {((retirementProjection.totalSuperBalance / (retirementProjection.totalSuperBalance + retirementProjection.portfolioValue)) * 100).toFixed(1)}%</div>
                    <div>Portfolio: {((retirementProjection.portfolioValue / (retirementProjection.totalSuperBalance + retirementProjection.portfolioValue)) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* At Age 80 */}
              <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                <h3 className="text-lg font-bold text-blue-800 mb-3">
                  At Age 80
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="font-medium">Super Balance:</span>
                    <span className="text-purple-600 font-bold">
                      {formatCurrency(age80Projection.totalSuperBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="font-medium">Portfolio:</span>
                    <span className="text-blue-600 font-bold">
                      {formatCurrency(age80Projection.portfolioValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-100 rounded border-t-2 border-blue-500">
                    <span className="font-bold">Total Assets:</span>
                    <span className="text-blue-800 font-bold text-lg">
                      {formatCurrency(
                        age80Projection.totalSuperBalance + age80Projection.portfolioValue
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    <div>Super: {((age80Projection.totalSuperBalance / (age80Projection.totalSuperBalance + age80Projection.portfolioValue)) * 100).toFixed(1)}%</div>
                    <div>Portfolio: {((age80Projection.portfolioValue / (age80Projection.totalSuperBalance + age80Projection.portfolioValue)) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-sm text-gray-700">
                <strong>💡 Tip:</strong> The Retirement Spending Ratio (set in Assets page) determines how much you draw from super vs portfolio during retirement.
                If super is a larger portion at retirement, consider a higher ratio. If portfolio is larger, consider a lower ratio to preserve super for later.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Projections Table */}
      {viewMode === 'table' && (
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Year-by-Year Projections</h2>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full border-collapse text-sm relative">
              <thead className="sticky top-0 z-20">
                <tr className="bg-charcoal text-white">
                  <th className="sticky left-0 z-30 bg-charcoal border p-2 text-left">Year</th>
                  <th className="border p-2 text-center">Ages</th>
                  <th className="border p-2 text-right">Income</th>
                  <th className="border p-2 text-right">Tax</th>
                  <th className="border p-2 text-right">Expenses</th>
                  <th className="border p-2 text-right">Education</th>
                  <th className="sticky right-0 z-30 border p-2 text-right bg-tan text-charcoal">Net Worth</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjections.map((projection) => {
                  const isRetirementYear =
                    projection.andyAge === andyRetirementAge ||
                    projection.nadieleAge === nadieleRetirementAge;

                  return (
                    <tr
                      key={projection.year}
                      className={`hover:bg-gray-50 ${
                        isRetirementYear ? 'bg-purple-50 font-medium' : ''
                      }`}
                    >
                      <td className={`sticky left-0 z-10 border p-2 font-semibold ${
                        isRetirementYear ? 'bg-purple-50' : 'bg-white'
                      }`}>
                        {projection.calendarYear}
                      </td>
                      <td className="border p-2 text-center text-xs">
                        {projection.andyAge}/{projection.nadieleAge}
                      </td>
                      <td className="border p-2 text-right">
                        {formatCurrency(projection.combinedGrossIncome)}
                      </td>
                      <td className="border p-2 text-right text-red-600">
                        {formatCurrency(projection.combinedTax)}
                      </td>
                      <td className="border p-2 text-right text-orange-600">
                        {formatCurrency(projection.combinedExpenses)}
                      </td>
                      <td className="border p-2 text-right text-blue-600">
                        {projection.educationExpenses > 0
                          ? formatCurrency(projection.educationExpenses)
                          : '—'}
                      </td>
                      <td className={`sticky right-0 z-10 border p-2 text-right font-bold text-charcoal ${
                        isRetirementYear ? 'bg-purple-100' : 'bg-cream'
                      }`}>
                        {formatCurrency(projection.totalNetWorth)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredProjections.length === 0 && (
            <p className="text-center text-gray-500 mt-4">
              No projections to display for this filter.
            </p>
          )}
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Financial Forecast Over Time</h2>

          {/* Net Worth Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Net Worth Projection</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredProjections}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="calendarYear"
                  label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                  stroke="#6b7280"
                />
                <YAxis
                  label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value !== undefined
                      ? new Intl.NumberFormat('en-AU', {
                          style: 'currency',
                          currency: 'AUD',
                          minimumFractionDigits: 0,
                        }).format(value)
                      : 'N/A'
                  }
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalNetWorth"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name="Net Worth"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="totalSuperBalance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Superannuation"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="portfolioValue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Portfolio"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Income vs Expenses Chart */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-700">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredProjections}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="calendarYear"
                  label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                  stroke="#6b7280"
                />
                <YAxis
                  label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number | undefined) =>
                    value !== undefined
                      ? new Intl.NumberFormat('en-AU', {
                          style: 'currency',
                          currency: 'AUD',
                          minimumFractionDigits: 0,
                        }).format(value)
                      : 'N/A'
                  }
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="combinedGrossIncome"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Gross Income"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="combinedAfterTax"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="After-Tax Income"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="combinedExpenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Expenses"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Financial Milestones Chart */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mt-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Financial Milestones</h2>
        <p className="text-sm text-gray-500 mb-4">
          Expense breakdown and income sources over time, showing when key financial events occur
        </p>

        {/* Milestone Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          {milestones.retirementYear && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
              Retirement: {milestones.retirementYear}
            </span>
          )}
          {milestones.mortgageEndYear && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
              Mortgage Paid: {milestones.mortgageEndYear}
            </span>
          )}
          {milestones.educationEndYear && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
              Education Ends: {milestones.educationEndYear}
            </span>
          )}
          {milestones.childrenEndYear && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded font-medium">
              Children Expense Ends: {milestones.childrenEndYear}
            </span>
          )}
        </div>

        {/* Expense Breakdown Chart */}
        <p className="text-sm font-medium text-gray-600 mb-2">Expense Components</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={forecast.projections}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="calendarYear" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#6b7280"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Legend />
            <Area type="monotone" dataKey="regularExpenses" stackId="1" fill="#94a3b8" stroke="#64748b" name="Living Expenses" />
            <Area type="monotone" dataKey="mortgageExpenses" stackId="1" fill="#f87171" stroke="#ef4444" name="Mortgage" />
            <Area type="monotone" dataKey="educationExpenses" stackId="1" fill="#60a5fa" stroke="#3b82f6" name="Education" />
            <Area type="monotone" dataKey="childrenExpenses" stackId="1" fill="#fb923c" stroke="#f97316" name="Children" />
            {milestones.retirementYear && (
              <ReferenceLine x={milestones.retirementYear} stroke="#7c3aed" strokeDasharray="4 4" strokeWidth={2} label={{ value: 'Retire', position: 'top', fill: '#7c3aed', fontSize: 11 }} />
            )}
            {milestones.mortgageEndYear && (
              <ReferenceLine x={milestones.mortgageEndYear} stroke="#16a34a" strokeDasharray="4 4" strokeWidth={2} label={{ value: 'Mortgage Paid', position: 'top', fill: '#16a34a', fontSize: 11 }} />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Income Sources Chart */}
        <p className="text-sm font-medium text-gray-600 mb-2 mt-6">Income Sources</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={forecast.projections}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="calendarYear" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#6b7280"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Legend />
            <Area type="monotone" dataKey="workIncome" stackId="1" fill="#34d399" stroke="#10b981" name="Work Income" />
            <Area type="monotone" dataKey="superDrawdown" stackId="1" fill="#818cf8" stroke="#6366f1" name="Super Drawdown" />
            <Area type="monotone" dataKey="portfolioDrawdown" stackId="1" fill="#fbbf24" stroke="#f59e0b" name="Portfolio Drawdown" />
            {milestones.retirementYear && (
              <ReferenceLine x={milestones.retirementYear} stroke="#7c3aed" strokeDasharray="4 4" strokeWidth={2} label={{ value: 'Retire', position: 'top', fill: '#7c3aed', fontSize: 11 }} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-cream border border-tan rounded">
        <p className="text-sm text-gray-700">
          <strong>💡 About This Forecast:</strong>
        </p>
        <ul className="list-disc ml-6 mt-2 text-sm text-gray-700">
          <li>
            <strong>Income:</strong> Grows at {annualIncomeIncrease}% annually until retirement,
            then becomes $0
          </li>
          <li>
            <strong>Expenses:</strong> Increase at {annualInflationRate}% annually due to inflation
          </li>
          <li>
            <strong>Tax & Super:</strong> Calculated based on ATO rates for FY {financialYear}
          </li>
          <li>
            <strong>Super Balance:</strong> Grows at {assets.superGrowthRate}% annually plus
            contributions from employer and voluntary super
          </li>
          <li>
            <strong>Portfolio:</strong> Grows at {assets.portfolioGrowthRate}% annually plus any
            positive net savings are invested
          </li>
          <li>
            <strong>Cars:</strong> Depreciate annually (average rate across all vehicles)
          </li>
          <li>
            <strong>Other Assets:</strong> Grow/depreciate at individual rates (e.g., property, collectibles)
          </li>
          <li>
            <strong>Net Worth:</strong> Super Balance + Portfolio + Cars + Other Assets - Mortgage
          </li>
          <li>
            <strong>Purple rows:</strong> Indicate retirement year for Andy or Nadiele
          </li>
        </ul>
      </div>
    </div>
  );
}

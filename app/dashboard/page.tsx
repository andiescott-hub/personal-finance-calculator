'use client';

import { useFinance } from '@/lib/finance-context';
import { calculateForecast } from '@/lib/forecast-calculator';
import { calculateRemainingBalance } from '@/lib/mortgage-calculator';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const {
    andyIncome,
    nadieleIncome,
    andyVoluntarySuper,
    nadieleVoluntarySuper,
    andyPortfolioContribution,
    nadielePortfolioContribution,
    expenses,
    assets,
    andyCurrentAge,
    nadieleCurrentAge,
    andyRetirementAge,
    nadieleRetirementAge,
    annualIncomeIncrease,
    annualInflationRate,
    financialYear,
    includeMedicare,
    children,
    educationFees,
  } = useFinance();

  // Calculate current net worth
  const currentYear = new Date().getFullYear();
  const yearsElapsed = currentYear - assets.mortgage.startYear;
  const mortgageBalance = yearsElapsed >= assets.mortgage.loanTermYears
    ? 0
    : calculateRemainingBalance(
        assets.mortgage.loanAmount,
        assets.mortgage.interestRate,
        assets.mortgage.loanTermYears,
        assets.mortgage.paymentsPerYear,
        yearsElapsed,
        assets.mortgage.extraMonthlyPayment
      );

  const totalSuper = (Number(assets.andySuperBalance) || 0) + (Number(assets.nadieleSuperBalance) || 0);
  const totalCarValue = (assets.cars || []).reduce((sum, car) => sum + (Number(car.currentValue) || 0), 0);
  const totalOtherAssets = (assets.otherAssets || []).reduce((sum, asset) => sum + (Number(asset.currentValue) || 0), 0);
  const portfolioValue = Number(assets.portfolioValue) || 0;
  const totalAssets = totalSuper + portfolioValue + totalCarValue + totalOtherAssets;
  const currentNetWorth = totalAssets - mortgageBalance;

  // Get forecast data for retirement age and age 80
  const forecast = calculateForecast({
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
  });

  const retirementProjection = forecast.projections.find(
    (p) => p.andyAge >= andyRetirementAge && p.nadieleAge >= nadieleRetirementAge
  );

  const age80Projection = forecast.projections.find((p) => p.andyAge === 80);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Asset breakdown for pie chart
  const assetBreakdown = [
    { name: 'Superannuation', value: totalSuper, color: 'bg-blue-500' },
    { name: 'Investment Portfolio', value: portfolioValue, color: 'bg-green-500' },
    { name: 'Vehicles', value: totalCarValue, color: 'bg-yellow-500' },
    { name: 'Other Assets', value: totalOtherAssets, color: 'bg-purple-500' },
  ].filter((item) => item.value > 0);

  const assetTotal = assetBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="container mx-auto px-2 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Financial Dashboard</h1>
        <p className="text-gray-600">Your complete financial snapshot</p>
      </div>

      {/* Current Net Worth - Large Hero Card */}
      <div className="bg-white border-4 border-tan rounded-lg shadow-xl p-4 md:p-8 mb-6">
        <div className="text-center">
          <h2 className="text-sm font-medium mb-3 text-gray-600 uppercase tracking-wider">Current Net Worth</h2>
          <div className="text-3xl md:text-6xl font-bold mb-6 text-charcoal">{formatCurrency(currentNetWorth)}</div>
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto mt-6 pt-6 border-t-2 border-gray-200">
            <div>
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">Total Assets</p>
              <p className="text-xl md:text-3xl font-bold text-green-600">{formatCurrency(totalAssets)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">Total Debt</p>
              <p className="text-xl md:text-3xl font-bold text-red-600">{formatCurrency(mortgageBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assets vs Debt Visualization */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Assets vs Debt</h2>
        <div className="relative h-12 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-semibold"
            style={{ width: `${(totalAssets / (totalAssets + mortgageBalance)) * 100}%` }}
          >
            {totalAssets > 0 && <span className="text-sm">Assets {Math.round((totalAssets / (totalAssets + mortgageBalance)) * 100)}%</span>}
          </div>
          <div
            className="absolute h-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center text-white font-semibold right-0"
            style={{ width: `${(mortgageBalance / (totalAssets + mortgageBalance)) * 100}%` }}
          >
            {mortgageBalance > 0 && <span className="text-sm">Debt {Math.round((mortgageBalance / (totalAssets + mortgageBalance)) * 100)}%</span>}
          </div>
        </div>
        <div className="flex justify-between mt-4 text-sm">
          <div className="text-green-600 font-medium">
            Assets: {formatCurrency(totalAssets)}
          </div>
          <div className="text-red-600 font-medium">
            Debt: {formatCurrency(mortgageBalance)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Asset Breakdown Table */}
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Asset Breakdown</h2>
          <div className="space-y-3">
            {assetBreakdown.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-semibold">{formatCurrency(item.value)}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color}`}
                    style={{ width: `${(item.value / assetTotal) * 100}%` }}
                  />
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">
                  {((item.value / assetTotal) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between font-bold">
              <span>Total Assets</span>
              <span>{formatCurrency(assetTotal)}</span>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Asset Allocation</h2>
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64 md:w-96 md:h-96">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {/* White background circle for center text */}
                <circle
                  cx="50"
                  cy="50"
                  r="15"
                  fill="#ffffff"
                  stroke="#d1d5db"
                  strokeWidth="0.3"
                />
                {assetBreakdown.map((item, index) => {
                  const percentage = (item.value / assetTotal) * 100;
                  const previousPercentages = assetBreakdown
                    .slice(0, index)
                    .reduce((sum, prev) => sum + (prev.value / assetTotal) * 100, 0);

                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const strokeDashoffset = -previousPercentages;

                  const colors: { [key: string]: string } = {
                    'bg-blue-500': '#3b82f6',
                    'bg-green-500': '#22c55e',
                    'bg-yellow-500': '#eab308',
                    'bg-purple-500': '#a855f7',
                  };

                  return (
                    <circle
                      key={item.name}
                      cx="50"
                      cy="50"
                      r="15.915494309"
                      fill="transparent"
                      stroke={colors[item.color]}
                      strokeWidth="31.830988618"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="text-xl md:text-4xl font-extrabold text-black">{formatCurrency(assetTotal)}</div>
                  <div className="text-base text-black mt-1 font-bold">Total Assets</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {assetBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded ${item.color}`} />
                <span className="text-lg font-bold text-black">{item.name}</span>
                <span className="text-lg text-black ml-auto font-bold">
                  {((item.value / assetTotal) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Net Worth Growth Chart */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Net Worth Projection (Next 20 Years)</h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={forecast.projections.slice(0, 20)}>
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSuper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              stroke="#6b7280"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Net Worth ($)', angle: -90, position: 'insideLeft' }}
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
            <Area
              type="monotone"
              dataKey="totalNetWorth"
              stroke="#8b5cf6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorNetWorth)"
              name="Net Worth"
            />
            <Area
              type="monotone"
              dataKey="totalSuperBalance"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSuper)"
              name="Superannuation"
            />
            <Area
              type="monotone"
              dataKey="portfolioValue"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPortfolio)"
              name="Portfolio"
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Projected growth based on {assets.superGrowthRate}% super growth and{' '}
          {assets.portfolioGrowthRate}% portfolio growth
        </p>
      </div>

      {/* Future Net Worth Projections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Retirement Age */}
        {retirementProjection && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">🎯</span>
              <h2 className="text-xl font-semibold text-blue-900">At Retirement</h2>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Year {retirementProjection.year} (Andy: {retirementProjection.andyAge}, Nadiele:{' '}
              {retirementProjection.nadieleAge})
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-blue-700 mb-1">Net Worth</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(retirementProjection.totalNetWorth)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/60 rounded p-3">
                  <p className="text-xs text-gray-600 mb-1">Superannuation</p>
                  <p className="text-lg font-semibold text-blue-800">
                    {formatCurrency(retirementProjection.totalSuperBalance)}
                  </p>
                </div>
                <div className="bg-white/60 rounded p-3">
                  <p className="text-xs text-gray-600 mb-1">Portfolio</p>
                  <p className="text-lg font-semibold text-green-700">
                    {formatCurrency(retirementProjection.portfolioValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Age 80 */}
        {age80Projection && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">🌟</span>
              <h2 className="text-xl font-semibold text-purple-900">At Age 80</h2>
            </div>
            <p className="text-sm text-purple-700 mb-4">
              Year {age80Projection.year} (Andy: {age80Projection.andyAge}, Nadiele:{' '}
              {age80Projection.nadieleAge})
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-purple-700 mb-1">Net Worth</p>
                <p className="text-3xl font-bold text-purple-900">
                  {formatCurrency(age80Projection.totalNetWorth)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/60 rounded p-3">
                  <p className="text-xs text-gray-600 mb-1">Superannuation</p>
                  <p className="text-lg font-semibold text-blue-800">
                    {formatCurrency(age80Projection.totalSuperBalance)}
                  </p>
                </div>
                <div className="bg-white/60 rounded p-3">
                  <p className="text-xs text-gray-600 mb-1">Portfolio</p>
                  <p className="text-lg font-semibold text-green-700">
                    {formatCurrency(age80Projection.portfolioValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { calculateMortgagePayment } from '@/lib/mortgage-calculator';
import type { Car, Asset, PortfolioItem } from '@/lib/finance-context';
import { CurrencyInput, PercentInput } from '@/components/formatted-input';

export default function AssetsPage() {
  const { assets, setAssets } = useFinance();

  const [newCar, setNewCar] = useState<Partial<Car>>({
    name: '',
    currentValue: 0,
    annualDepreciation: 15,
  });

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '',
    category: '',
    currentValue: 0,
    annualGrowthRate: 5,
  });

  const [newPortfolioItem, setNewPortfolioItem] = useState<Partial<PortfolioItem>>({
    name: '',
    currentValue: 0,
    isManual: false,
    ticker: '',
    quantity: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);
  const [refreshErrors, setRefreshErrors] = useState<Record<string, string>>({});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Car functions
  const addCar = () => {
    if (!newCar.name || !newCar.currentValue) {
      alert('Please fill in car name and value');
      return;
    }

    const car: Car = {
      id: Date.now().toString(),
      name: newCar.name,
      currentValue: newCar.currentValue,
      annualDepreciation: newCar.annualDepreciation || 15,
    };

    setAssets({
      ...assets,
      cars: [...assets.cars, car],
    });

    setNewCar({
      name: '',
      currentValue: 0,
      annualDepreciation: 15,
    });
  };

  const deleteCar = (id: string) => {
    setAssets({
      ...assets,
      cars: assets.cars.filter((c) => c.id !== id),
    });
  };

  const updateCar = (id: string, updates: Partial<Car>) => {
    setAssets({
      ...assets,
      cars: assets.cars.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  // Other asset functions
  const addAsset = () => {
    if (!newAsset.name || !newAsset.category || !newAsset.currentValue) {
      alert('Please fill in all asset fields');
      return;
    }

    const asset: Asset = {
      id: Date.now().toString(),
      name: newAsset.name,
      category: newAsset.category,
      currentValue: newAsset.currentValue,
      annualGrowthRate: newAsset.annualGrowthRate || 0,
    };

    setAssets({
      ...assets,
      otherAssets: [...assets.otherAssets, asset],
    });

    setNewAsset({
      name: '',
      category: '',
      currentValue: 0,
      annualGrowthRate: 5,
    });
  };

  const deleteAsset = (id: string) => {
    setAssets({
      ...assets,
      otherAssets: assets.otherAssets.filter((a) => a.id !== id),
    });
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets({
      ...assets,
      otherAssets: assets.otherAssets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Portfolio item functions
  const fetchStockPrice = async (ticker: string): Promise<{ priceAUD: number; error?: string }> => {
    try {
      const res = await fetch(`/api/stock-price?ticker=${encodeURIComponent(ticker)}`);
      if (!res.ok) {
        const data = await res.json();
        return { priceAUD: 0, error: data.error || 'Failed to fetch price' };
      }
      const data = await res.json();
      return { priceAUD: data.priceAUD };
    } catch {
      return { priceAUD: 0, error: 'Network error fetching price' };
    }
  };

  const refreshAllPrices = async () => {
    setIsRefreshing(true);
    setRefreshErrors({});
    const items = assets.portfolioItems || [];
    const liveItems = items.filter(item => !item.isManual && item.ticker);
    if (liveItems.length === 0) { setIsRefreshing(false); return; }

    const errors: Record<string, string> = {};
    const updatedItems = [...items];

    for (const liveItem of liveItems) {
      const result = await fetchStockPrice(liveItem.ticker!);
      if (result.error) {
        errors[liveItem.id] = result.error;
      } else {
        const idx = updatedItems.findIndex(i => i.id === liveItem.id);
        if (idx >= 0) {
          const qty = updatedItems[idx].quantity || 0;
          updatedItems[idx] = {
            ...updatedItems[idx],
            pricePerUnit: result.priceAUD,
            currentValue: Math.round(qty * result.priceAUD * 100) / 100,
            lastPriceUpdate: new Date().toISOString(),
          };
        }
      }
    }

    setAssets({ ...assets, portfolioItems: updatedItems });
    setRefreshErrors(errors);
    setLastRefreshTime(new Date().toLocaleTimeString());
    setIsRefreshing(false);
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.isManual) {
      if (!newPortfolioItem.name || !newPortfolioItem.currentValue) {
        alert('Please fill in name and value');
        return;
      }
      const item: PortfolioItem = {
        id: Date.now().toString(),
        name: newPortfolioItem.name,
        currentValue: newPortfolioItem.currentValue,
        isManual: true,
      };
      setAssets({ ...assets, portfolioItems: [...(assets.portfolioItems || []), item] });
    } else {
      if (!newPortfolioItem.ticker || !newPortfolioItem.quantity) {
        alert('Please fill in ticker and quantity');
        return;
      }
      const item: PortfolioItem = {
        id: Date.now().toString(),
        name: newPortfolioItem.ticker.toUpperCase(),
        ticker: newPortfolioItem.ticker.toUpperCase(),
        quantity: newPortfolioItem.quantity,
        pricePerUnit: 0,
        currentValue: 0,
        isManual: false,
      };
      setAssets({ ...assets, portfolioItems: [...(assets.portfolioItems || []), item] });
    }
    setNewPortfolioItem({ name: '', currentValue: 0, isManual: newPortfolioItem.isManual, ticker: '', quantity: 0 });
  };

  const deletePortfolioItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setAssets({
        ...assets,
        portfolioItems: (assets.portfolioItems || []).filter((i) => i.id !== id),
      });
    }
  };

  const updatePortfolioItem = (id: string, updates: Partial<PortfolioItem>) => {
    setAssets({
      ...assets,
      portfolioItems: (assets.portfolioItems || []).map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...updates };
        if (!updated.isManual && updated.quantity != null && updated.pricePerUnit != null) {
          updated.currentValue = Math.round(updated.quantity * updated.pricePerUnit * 100) / 100;
        }
        return updated;
      }),
    });
  };

  // Calculate totals
  const totalCarValue = (assets.cars || []).reduce((sum, car) => sum + car.currentValue, 0);
  const totalOtherAssets = (assets.otherAssets || []).reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalSuperBalance = (assets.andySuperBalance || 0) + (assets.nadieleSuperBalance || 0);
  const totalAssets = totalSuperBalance + (assets.portfolioValue || 0) + totalCarValue + totalOtherAssets;
  const totalNetWorth = totalAssets - (assets.mortgage?.loanAmount || 0);

  // Calculate mortgage payment
  const monthlyMortgagePayment = assets.mortgage ? calculateMortgagePayment(
    assets.mortgage.loanAmount,
    assets.mortgage.interestRate,
    assets.mortgage.loanTermYears,
    assets.mortgage.paymentsPerYear
  ) : 0;

  return (
    <div className="container mx-auto px-2 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assets & Net Worth</h1>
        <p className="text-gray-600">Track superannuation, investments, property, and vehicles</p>
      </div>

      {/* Net Worth Summary */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Total Net Worth</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Superannuation</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalSuperBalance)}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Portfolio</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(assets.portfolioValue)}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Vehicles</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCarValue)}</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Other Assets</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalOtherAssets)}</p>
          </div>
          <div className="text-center p-4 bg-tan rounded">
            <p className="text-sm text-charcoal mb-1">Net Worth</p>
            <p className="text-2xl font-bold text-charcoal">{formatCurrency(totalNetWorth)}</p>
          </div>
        </div>
      </div>

      {/* Retirement Spending Settings */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Retirement Spending Strategy</h2>
        <p className="text-sm text-gray-600 mb-4">
          In retirement when expenses exceed income, funds will be drawn from super and portfolio based on this ratio:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">
              Draw from Superannuation
            </label>
            <PercentInput
              value={assets.retirementSpendingRatio || 70}
              onChange={(val) => setAssets({ ...assets, retirementSpendingRatio: val })}
              className="border rounded p-2 w-full md:w-32"
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Draw from Portfolio
            </label>
            <PercentInput
              value={100 - (assets.retirementSpendingRatio || 70)}
              onChange={() => {}}
              className="w-full border rounded p-2 bg-gray-100"
              min={0}
              max={100}
            />
          </div>
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">
              Example: With {assets.retirementSpendingRatio || 70}% super / {100 - (assets.retirementSpendingRatio || 70)}% portfolio,
              a $50,000 shortfall draws ${formatCurrency(500 * (assets.retirementSpendingRatio || 70))} from super and $
              {formatCurrency(500 * (100 - (assets.retirementSpendingRatio || 70)))} from portfolio.
            </p>
          </div>
        </div>
      </div>

      {/* Superannuation */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Superannuation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Andy Super Balance</label>
            <CurrencyInput
              value={assets.andySuperBalance}
              onChange={(val) => setAssets({ ...assets, andySuperBalance: val })}
              className="border rounded p-2 w-full md:w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nadiele Super Balance</label>
            <CurrencyInput
              value={assets.nadieleSuperBalance}
              onChange={(val) => setAssets({ ...assets, nadieleSuperBalance: val })}
              className="border rounded p-2 w-full md:w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expected Annual Growth</label>
            <PercentInput
              value={assets.superGrowthRate}
              onChange={(val) => setAssets({ ...assets, superGrowthRate: val })}
              className="border rounded p-2 w-full md:w-32"
              step={0.1}
            />
          </div>
        </div>
        <div className="mt-4 p-4 bg-purple-50 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">Combined Super Balance:</span>
            <span className="text-xl font-bold text-purple-600">
              {formatCurrency(totalSuperBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Investment Portfolio</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Expected Annual Return (applied to total portfolio)</label>
          <PercentInput
            value={assets.portfolioGrowthRate}
            onChange={(val) => setAssets({ ...assets, portfolioGrowthRate: val })}
            className="border rounded p-2 w-full md:w-32"
            step={0.1}
          />
        </div>

        {/* Add Portfolio Item */}
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-3">Add Investment</h3>
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newPortfolioItem.isManual || false}
                onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, isManual: e.target.checked })}
                className="rounded"
              />
              Manual entry (no live price lookup)
            </label>
          </div>
          {newPortfolioItem.isManual ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newPortfolioItem.name}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, name: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="e.g., Expected Inheritance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Value (AUD)</label>
                <CurrencyInput
                  value={newPortfolioItem.currentValue || 0}
                  onChange={(val) => setNewPortfolioItem({ ...newPortfolioItem, currentValue: val })}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="flex items-end">
                <button onClick={addPortfolioItem} className="w-full bg-tan text-white px-6 py-2 rounded hover:bg-charcoal">
                  Add Investment
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ticker</label>
                <input
                  type="text"
                  value={newPortfolioItem.ticker || ''}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, ticker: e.target.value.toUpperCase() })}
                  className="w-full border rounded p-2 uppercase"
                  placeholder="e.g., BHP.AX, VAS.AX, AAPL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  value={newPortfolioItem.quantity || ''}
                  onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, quantity: Number(e.target.value) })}
                  className="w-full border rounded p-2"
                  placeholder="Number of shares"
                  min={0}
                  step={1}
                />
              </div>
              <div className="flex items-end">
                <button onClick={addPortfolioItem} className="w-full bg-tan text-white px-6 py-2 rounded hover:bg-charcoal">
                  Add Investment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Prices Button */}
        {(assets.portfolioItems || []).some(item => !item.isManual && item.ticker) && (
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <button
              onClick={refreshAllPrices}
              disabled={isRefreshing}
              className={`px-4 py-2 rounded text-white ${
                isRefreshing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
            </button>
            {lastRefreshTime && (
              <span className="text-sm text-gray-500">Last refreshed: {lastRefreshTime}</span>
            )}
            {Object.keys(refreshErrors).length > 0 && (
              <span className="text-sm text-red-500">
                {Object.keys(refreshErrors).length} ticker(s) failed
              </span>
            )}
          </div>
        )}

        {/* Portfolio Items List */}
        {(assets.portfolioItems || []).length > 0 && (
          <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {(assets.portfolioItems || []).map((item) => (
              <div key={item.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <input
                        type="checkbox"
                        checked={item.isManual}
                        onChange={(e) => updatePortfolioItem(item.id, { isManual: e.target.checked })}
                        className="rounded"
                      />
                      Manual
                    </label>
                    <p className="font-medium">{item.isManual ? item.name : (item.ticker || item.name)}</p>
                    {!item.isManual && item.quantity != null && (
                      <p className="text-xs text-gray-500">
                        {item.quantity} units @ {item.pricePerUnit ? formatPrice(item.pricePerUnit) : '--'}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold">{formatCurrency(item.currentValue)}</p>
                </div>
                {refreshErrors[item.id] && (
                  <p className="text-xs text-red-500 mb-1">{refreshErrors[item.id]}</p>
                )}
                <div className="text-right">
                  <button
                    onClick={() => deletePortfolioItem(item.id, item.name)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-charcoal text-white">
                  <th className="border p-3 text-center w-16">Manual</th>
                  <th className="border p-3 text-left">Name / Ticker</th>
                  <th className="border p-3 text-right">QTY</th>
                  <th className="border p-3 text-right">Price P/Unit</th>
                  <th className="border p-3 text-right">Value (AUD)</th>
                  <th className="border p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(assets.portfolioItems || []).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border p-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.isManual}
                        onChange={(e) => updatePortfolioItem(item.id, {
                          isManual: e.target.checked,
                          ...(e.target.checked ? {} : { ticker: item.ticker || item.name, quantity: item.quantity || 0 }),
                        })}
                        className="rounded"
                      />
                    </td>
                    <td className="border p-3">
                      {item.isManual ? (
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updatePortfolioItem(item.id, { name: e.target.value })}
                          className="border-0 focus:border-blue-500 rounded p-1 min-w-[120px]"
                          placeholder="Description"
                        />
                      ) : (
                        <div>
                          <input
                            type="text"
                            value={item.ticker || ''}
                            onChange={(e) => updatePortfolioItem(item.id, {
                              ticker: e.target.value.toUpperCase(),
                              name: e.target.value.toUpperCase(),
                            })}
                            className="border-0 focus:border-blue-500 rounded p-1 min-w-[120px] uppercase"
                            placeholder="e.g., BHP.AX"
                          />
                          {refreshErrors[item.id] && (
                            <p className="text-xs text-red-500 mt-1">{refreshErrors[item.id]}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="border p-3 text-right">
                      {item.isManual ? (
                        <span className="text-gray-400">--</span>
                      ) : (
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => updatePortfolioItem(item.id, { quantity: Number(e.target.value) })}
                          className="text-right border-0 focus:border-blue-500 rounded p-1 w-20"
                          min={0}
                          step={1}
                        />
                      )}
                    </td>
                    <td className="border p-3 text-right">
                      {item.isManual ? (
                        <span className="text-gray-400">--</span>
                      ) : (
                        <span className="text-gray-700">
                          {item.pricePerUnit ? formatPrice(item.pricePerUnit) : '--'}
                        </span>
                      )}
                    </td>
                    <td className="border p-3 text-right">
                      {item.isManual ? (
                        <CurrencyInput
                          value={item.currentValue}
                          onChange={(val) => updatePortfolioItem(item.id, { currentValue: val })}
                          className="text-right border-0 focus:border-blue-500 rounded p-1 w-28"
                        />
                      ) : (
                        <span className="font-medium">
                          {item.currentValue ? formatCurrency(item.currentValue) : '--'}
                        </span>
                      )}
                    </td>
                    <td className="border p-3 text-center">
                      <button
                        onClick={() => deletePortfolioItem(item.id, item.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {(assets.portfolioItems || []).length === 0 && (
          <p className="text-center text-gray-500 mt-4">No portfolio items added yet.</p>
        )}

        <div className="mt-4 p-4 bg-green-50 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Portfolio Value:</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(assets.portfolioValue)}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Growth continues in retirement at {assets.portfolioGrowthRate}% annually. Total is auto-calculated from items above.
        </p>
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
                💰 Extra Monthly Payment (Optional)
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

      {/* Other Assets */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Other Assets</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add investment properties, collectibles, jewelry, or other assets
        </p>

        {/* Add Asset Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-3">Add New Asset</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                className="border rounded p-2 w-full md:w-32"
                placeholder="e.g., Investment Property"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <input
                type="text"
                value={newAsset.category}
                onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                className="border rounded p-2 w-full md:w-32"
                placeholder="e.g., Property"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current Value</label>
              <CurrencyInput
                value={newAsset.currentValue || 0}
                onChange={(val) => setNewAsset({ ...newAsset, currentValue: val })}
                className="border rounded p-2 w-full md:w-32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Annual Growth Rate</label>
              <PercentInput
                value={newAsset.annualGrowthRate || 0}
                onChange={(val) => setNewAsset({ ...newAsset, annualGrowthRate: val })}
                className="border rounded p-2 w-full md:w-32"
                step={0.1}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addAsset}
                className="w-full bg-tan text-white px-6 py-2 rounded hover:bg-charcoal"
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>

        {/* Assets List */}
        {(assets.otherAssets || []).length > 0 && (
          <>
          <div className="md:hidden space-y-3">
            {(assets.otherAssets || []).map((asset) => (
              <div key={asset.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-xs text-gray-500">{asset.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(asset.currentValue)}</p>
                    <p className="text-xs text-gray-500">{asset.annualGrowthRate}% growth</p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-charcoal text-white">
                  <th className="border p-3 text-left">Name</th>
                  <th className="border p-3 text-left">Category</th>
                  <th className="border p-3 text-right">Current Value</th>
                  <th className="border p-3 text-right">Annual Growth Rate</th>
                  <th className="border p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(assets.otherAssets || []).map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="border p-3">
                      <input
                        type="text"
                        value={asset.name}
                        onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
                        className="border-0 focus:border-blue-500 rounded p-1 min-w-[120px]"
                      />
                    </td>
                    <td className="border p-3">
                      <input
                        type="text"
                        value={asset.category}
                        onChange={(e) => updateAsset(asset.id, { category: e.target.value })}
                        className="border-0 focus:border-blue-500 rounded p-1 min-w-[120px]"
                      />
                    </td>
                    <td className="border p-3 text-right">
                      <CurrencyInput
                        value={asset.currentValue}
                        onChange={(val) => updateAsset(asset.id, { currentValue: val })}
                        className="text-right border-0 focus:border-blue-500 rounded p-1 w-28"
                      />
                    </td>
                    <td className="border p-3 text-right">
                      <PercentInput
                        value={asset.annualGrowthRate}
                        onChange={(val) => updateAsset(asset.id, { annualGrowthRate: val })}
                        className="text-right border-0 focus:border-blue-500 rounded p-1 w-28"
                        step={0.1}
                      />
                    </td>
                    <td className="border p-3 text-center">
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {(assets.otherAssets || []).length === 0 && (
          <p className="text-center text-gray-500 mt-4">No other assets added yet.</p>
        )}

        <div className="mt-4 p-4 bg-yellow-50 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Other Assets:</span>
            <span className="text-xl font-bold text-yellow-600">
              {formatCurrency(totalOtherAssets)}
            </span>
          </div>
        </div>
      </div>

      {/* Cars */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Vehicles</h2>

        {/* Add Car Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-3">Add New Vehicle</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={newCar.name}
                onChange={(e) => setNewCar({ ...newCar, name: e.target.value })}
                className="border rounded p-2 w-full md:w-32"
                placeholder="e.g., Toyota Camry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current Value</label>
              <CurrencyInput
                value={newCar.currentValue || 0}
                onChange={(val) => setNewCar({ ...newCar, currentValue: val })}
                className="border rounded p-2 w-full md:w-32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Annual Depreciation</label>
              <PercentInput
                value={newCar.annualDepreciation || 15}
                onChange={(val) => setNewCar({ ...newCar, annualDepreciation: val })}
                className="border rounded p-2 w-full md:w-32"
                step={0.1}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addCar}
                className="w-full bg-tan text-white px-6 py-2 rounded hover:bg-charcoal"
              >
                Add Vehicle
              </button>
            </div>
          </div>
        </div>

        {/* Cars List */}
        {(assets.cars || []).length > 0 && (
          <>
          <div className="md:hidden space-y-3">
            {(assets.cars || []).map((car) => (
              <div key={car.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">{car.name}</p>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(car.currentValue)}</p>
                    <p className="text-xs text-gray-500">{car.annualDepreciation}% depreciation</p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => deleteCar(car.id)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-charcoal text-white">
                  <th className="border p-3 text-left">Name</th>
                  <th className="border p-3 text-right">Current Value</th>
                  <th className="border p-3 text-right">Annual Depreciation</th>
                  <th className="border p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(assets.cars || []).map((car) => (
                  <tr key={car.id} className="hover:bg-gray-50">
                    <td className="border p-3">
                      <input
                        type="text"
                        value={car.name}
                        onChange={(e) => updateCar(car.id, { name: e.target.value })}
                        className="border-0 focus:border-blue-500 rounded p-1 min-w-[120px]"
                      />
                    </td>
                    <td className="border p-3 text-right">
                      <CurrencyInput
                        value={car.currentValue}
                        onChange={(val) => updateCar(car.id, { currentValue: val })}
                        className="text-right border-0 focus:border-blue-500 rounded p-1 w-28"
                      />
                    </td>
                    <td className="border p-3 text-right">
                      <PercentInput
                        value={car.annualDepreciation}
                        onChange={(val) => updateCar(car.id, { annualDepreciation: val })}
                        className="text-right border-0 focus:border-blue-500 rounded p-1 w-28"
                        step={0.1}
                      />
                    </td>
                    <td className="border p-3 text-center">
                      <button
                        onClick={() => deleteCar(car.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {(assets.cars || []).length === 0 && (
          <p className="text-center text-gray-500 mt-4">No vehicles added yet.</p>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Vehicle Value:</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(totalCarValue)}</span>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-cream border border-tan rounded">
        <p className="text-sm text-gray-700">
          <strong>💡 About Assets:</strong>
        </p>
        <ul className="list-disc ml-6 mt-2 text-sm text-gray-700">
          <li>
            <strong>Superannuation:</strong> Continues growing at {assets.superGrowthRate || 7}% annually even in retirement. Used to fund retirement expenses based on spending ratio.
          </li>
          <li>
            <strong>Portfolio:</strong> Continues growing at {assets.portfolioGrowthRate || 7}% annually in retirement. Used to fund retirement expenses based on spending ratio.
          </li>
          <li>
            <strong>Retirement Strategy:</strong> When expenses exceed income, {assets.retirementSpendingRatio || 70}% is drawn from super and {100 - (assets.retirementSpendingRatio || 70)}% from portfolio.
          </li>
          <li>
            <strong>Mortgage:</strong> Principal and interest are automatically included in the forecast. Balance declines to $0 by {(assets.mortgage?.startYear || new Date().getFullYear()) + (assets.mortgage?.loanTermYears || 30)}.
          </li>
          <li>
            <strong>Other Assets:</strong> Can appreciate (positive growth rate) or depreciate (negative growth rate). Examples: property (+5%), collectibles (+3%), equipment (-10%).
          </li>
          <li>
            All assets and liabilities are automatically included in your Forecast page projections.
          </li>
        </ul>
      </div>
    </div>
  );
}

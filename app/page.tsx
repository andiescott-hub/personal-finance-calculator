'use client';

import { useMemo } from 'react';
import {
  calculateHouseholdIncome,
  type CalculationConfig,
} from '@/lib/income-calculator';
import { getAvailableFinancialYears } from '@/lib/super-calculator';
import { useFinance } from '@/lib/finance-context';
import { CurrencyInput, PercentInput } from '@/components/formatted-input';

export default function HomePage() {
  // Get all state from context
  const {
    financialYear,
    setFinancialYear,
    includeMedicare,
    setIncludeMedicare,
    andyIncome,
    setAndyIncome,
    nadieleIncome,
    setNadieleIncome,
    andyVoluntarySuper,
    setAndyVoluntarySuper,
    nadieleVoluntarySuper,
    setNadieleVoluntarySuper,
  } = useFinance();

  // Calculate everything
  const config: CalculationConfig = {
    includeMedicareLevy: includeMedicare,
    financialYear,
    voluntarySuperRate: {
      andy: andyVoluntarySuper / 100, // Convert percentage to decimal
      nadiele: nadieleVoluntarySuper / 100,
    },
    spendableExclusions: {
      andy: andyIncome.allowances + andyIncome.preTotalAdjustments,
      nadiele: nadieleIncome.allowances + nadieleIncome.preTotalAdjustments,
    },
  };

  const data = useMemo(
    () => calculateHouseholdIncome(andyIncome, nadieleIncome, config),
    [andyIncome, nadieleIncome, config]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return value.toFixed(2) + '%';
  };

  return (
    <div className="container mx-auto px-2 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Income & Tax Calculator</h1>
        <p className="text-gray-600">
          ATO-accurate calculations for FY {financialYear}
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Financial Year</label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="border rounded p-2 w-auto"
            >
              {getAvailableFinancialYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              <input
                type="checkbox"
                checked={includeMedicare}
                onChange={(e) => setIncludeMedicare(e.target.checked)}
                className="mr-2"
              />
              Include Medicare Levy (2%)
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Andy Voluntary Super</label>
            <PercentInput
              value={andyVoluntarySuper}
              onChange={setAndyVoluntarySuper}
              className="border rounded p-2 w-24"
              step={0.1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nadiele Voluntary Super</label>
            <PercentInput
              value={nadieleVoluntarySuper}
              onChange={setNadieleVoluntarySuper}
              className="border rounded p-2 w-24"
              step={0.1}
            />
          </div>
        </div>
      </div>

      {/* Income Inputs */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Income Inputs</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-charcoal text-white">
                <th className="border p-3 text-left">Component</th>
                <th className="border p-3 text-right">Andy</th>
                <th className="border p-3 text-right">Nadiele</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-3 font-medium">Base Salary</td>
                <td className="border p-3">
                  <CurrencyInput
                    value={andyIncome.baseSalary}
                    onChange={(val) => setAndyIncome({ ...andyIncome, baseSalary: val })}
                    className="text-right border rounded p-1 min-w-[100px]"
                  />
                </td>
                <td className="border p-3">
                  <CurrencyInput
                    value={nadieleIncome.baseSalary}
                    onChange={(val) => setNadieleIncome({ ...nadieleIncome, baseSalary: val })}
                    className="text-right border rounded p-1 min-w-[100px]"
                  />
                </td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">Variable Income (Bonus)</td>
                <td className="border p-3">
                  <CurrencyInput
                    value={andyIncome.variableIncome}
                    onChange={(val) => setAndyIncome({ ...andyIncome, variableIncome: val })}
                    className="text-right border rounded p-1 min-w-[100px]"
                  />
                </td>
                <td className="border p-3">
                  <CurrencyInput
                    value={nadieleIncome.variableIncome}
                    onChange={(val) => setNadieleIncome({ ...nadieleIncome, variableIncome: val })}
                    className="text-right border rounded p-1 min-w-[100px]"
                  />
                </td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">Allowances</td>
                <td className="border p-3">
                  <CurrencyInput
                    value={andyIncome.allowances}
                    onChange={(val) => setAndyIncome({ ...andyIncome, allowances: val })}
                    className="text-right border rounded p-1 min-w-[100px]"
                  />
                </td>
                <td className="border p-3">
                  <CurrencyInput
                    value={nadieleIncome.allowances}
                    onChange={(val) => setNadieleIncome({ ...nadieleIncome, allowances: val })}
                    className="text-right border rounded p-1 min-w-[100px]"
                  />
                </td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">Pre-Total Adjustments</td>
                <td className="border p-3">
                  <CurrencyInput
                    value={andyIncome.preTotalAdjustments}
                    onChange={(val) => setAndyIncome({ ...andyIncome, preTotalAdjustments: val })}
                    className="text-right border rounded p-1 min-w-[100px]"
                  />
                </td>
                <td className="border p-3">
                  <CurrencyInput
                    value={nadieleIncome.preTotalAdjustments}
                    onChange={(val) => setNadieleIncome({ ...nadieleIncome, preTotalAdjustments: val })}
                    className="text-right border rounded p-1 min-w-[100px]"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Gross Income */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Gross Income</h2>
        <div className="overflow-x-auto">
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
                <td className="border p-3 font-bold">Gross Income</td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.andy.grossIncome)}
                </td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.nadiele.grossIncome)}
                </td>
                <td className="border p-3 text-right font-bold bg-green-100">
                  {formatCurrency(data.combined.grossIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Tax Breakdown</h2>
        <div className="overflow-x-auto">
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
              <tr>
                <td className="border p-3">Income Tax</td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.andy.tax.taxPayable)}
                </td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.nadiele.tax.taxPayable)}
                </td>
                <td className="border p-3 text-right bg-cream">
                  {formatCurrency(
                    data.andy.tax.taxPayable + data.nadiele.tax.taxPayable
                  )}
                </td>
              </tr>
              <tr>
                <td className="border p-3">Medicare Levy</td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.andy.tax.medicareLevy)}
                </td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.nadiele.tax.medicareLevy)}
                </td>
                <td className="border p-3 text-right bg-cream">
                  {formatCurrency(
                    data.andy.tax.medicareLevy + data.nadiele.tax.medicareLevy
                  )}
                </td>
              </tr>
              <tr className="bg-red-50">
                <td className="border p-3 font-bold">Total Tax</td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.andy.tax.totalTax)}
                </td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.nadiele.tax.totalTax)}
                </td>
                <td className="border p-3 text-right font-bold bg-red-100">
                  {formatCurrency(data.combined.totalTax)}
                </td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">Effective Tax Rate</td>
                <td className="border p-3 text-right">
                  {formatPercent(data.andy.tax.effectiveTaxRate)}
                </td>
                <td className="border p-3 text-right">
                  {formatPercent(data.nadiele.tax.effectiveTaxRate)}
                </td>
                <td className="border p-3 text-right bg-cream">
                  {formatPercent(
                    (data.combined.totalTax / data.combined.grossIncome) * 100
                  )}
                </td>
              </tr>
              <tr className="bg-green-50">
                <td className="border p-3 font-bold">After-Tax Income</td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.andy.afterTaxIncome)}
                </td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.nadiele.afterTaxIncome)}
                </td>
                <td className="border p-3 text-right font-bold bg-green-100">
                  {formatCurrency(data.combined.afterTaxIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Superannuation */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Superannuation (FY {financialYear})</h2>
        <div className="overflow-x-auto">
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
              <tr>
                <td className="border p-3">SG Rate</td>
                <td className="border p-3 text-right">
                  {formatPercent(data.andy.super.sgRate)}
                </td>
                <td className="border p-3 text-right">
                  {formatPercent(data.nadiele.super.sgRate)}
                </td>
                <td className="border p-3 text-right bg-cream">—</td>
              </tr>
              <tr>
                <td className="border p-3">SG Base (Salary + Bonus + Allowances)</td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.andy.super.sgBase)}
                </td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.nadiele.super.sgBase)}
                </td>
                <td className="border p-3 text-right bg-cream">
                  {formatCurrency(
                    data.andy.super.sgBase + data.nadiele.super.sgBase
                  )}
                </td>
              </tr>
              <tr>
                <td className="border p-3">Employer SG</td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.andy.super.employerSG)}
                </td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.nadiele.super.employerSG)}
                </td>
                <td className="border p-3 text-right bg-cream">
                  {formatCurrency(
                    data.andy.super.employerSG + data.nadiele.super.employerSG
                  )}
                </td>
              </tr>
              <tr>
                <td className="border p-3">Voluntary Super</td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.andy.super.voluntarySuper)}
                </td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.nadiele.super.voluntarySuper)}
                </td>
                <td className="border p-3 text-right bg-cream">
                  {formatCurrency(
                    data.andy.super.voluntarySuper + data.nadiele.super.voluntarySuper
                  )}
                </td>
              </tr>
              <tr className="bg-purple-50">
                <td className="border p-3 font-bold">Total Super</td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.andy.super.totalSuper)}
                </td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.nadiele.super.totalSuper)}
                </td>
                <td className="border p-3 text-right font-bold bg-purple-100">
                  {formatCurrency(data.combined.totalSuper)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Spendable Income */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Spendable Income</h2>
        <div className="overflow-x-auto">
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
              <tr>
                <td className="border p-3">After-Tax Income</td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.andy.afterTaxIncome)}
                </td>
                <td className="border p-3 text-right">
                  {formatCurrency(data.nadiele.afterTaxIncome)}
                </td>
                <td className="border p-3 text-right bg-cream">
                  {formatCurrency(data.combined.afterTaxIncome)}
                </td>
              </tr>
              <tr>
                <td className="border p-3">Less: Allowances (Auto-excluded)</td>
                <td className="border p-3 text-right text-red-600">
                  {formatCurrency(-andyIncome.allowances)}
                </td>
                <td className="border p-3 text-right text-red-600">
                  {nadieleIncome.allowances > 0 ? formatCurrency(-nadieleIncome.allowances) : '—'}
                </td>
                <td className="border p-3 text-right bg-cream text-red-600">
                  {formatCurrency(-(andyIncome.allowances + nadieleIncome.allowances))}
                </td>
              </tr>
              <tr>
                <td className="border p-3">Less: Pre-Total Adjustments (Auto-excluded)</td>
                <td className="border p-3 text-right text-red-600">
                  {andyIncome.preTotalAdjustments > 0 ? formatCurrency(-andyIncome.preTotalAdjustments) : '—'}
                </td>
                <td className="border p-3 text-right text-red-600">
                  {nadieleIncome.preTotalAdjustments > 0 ? formatCurrency(-nadieleIncome.preTotalAdjustments) : '—'}
                </td>
                <td className="border p-3 text-right bg-cream text-red-600">
                  {(andyIncome.preTotalAdjustments + nadieleIncome.preTotalAdjustments) > 0
                    ? formatCurrency(-(andyIncome.preTotalAdjustments + nadieleIncome.preTotalAdjustments))
                    : '—'}
                </td>
              </tr>
              <tr className="bg-yellow-50">
                <td className="border p-3 font-bold">Spendable Income</td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.andy.spendableIncome)}
                </td>
                <td className="border p-3 text-right font-bold">
                  {formatCurrency(data.nadiele.spendableIncome)}
                </td>
                <td className="border p-3 text-right font-bold bg-yellow-100">
                  {formatCurrency(data.combined.spendableIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Next: Add expenses on the Expenses page to calculate disposable income.
        </p>
      </div>
    </div>
  );
}

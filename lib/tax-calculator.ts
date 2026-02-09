/**
 * Australian Tax Calculator
 * ATO Resident Tax Rates 2025-26
 * https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
 */

export interface TaxBracket {
  min: number;
  max: number | null; // null = no upper limit
  baseAmount: number;
  rate: number; // as decimal (e.g., 0.19 for 19%)
}

// ATO Tax Rates 2025-26
export const TAX_BRACKETS_2025_26: TaxBracket[] = [
  { min: 0, max: 18200, baseAmount: 0, rate: 0 },
  { min: 18201, max: 45000, baseAmount: 0, rate: 0.19 },
  { min: 45001, max: 135000, baseAmount: 5092, rate: 0.325 },
  { min: 135001, max: 190000, baseAmount: 34317, rate: 0.37 },
  { min: 190001, max: null, baseAmount: 54682, rate: 0.45 },
];

// Medicare Levy rate (2% of taxable income)
export const MEDICARE_LEVY_RATE = 0.02;

export interface TaxCalculationResult {
  grossIncome: number;
  taxPayable: number;
  medicareLevy: number;
  totalTax: number;
  afterTaxIncome: number;
  effectiveTaxRate: number; // as percentage
}

/**
 * Calculate income tax based on ATO 2025-26 tax brackets
 */
export function calculateIncomeTax(
  grossIncome: number,
  includeMedicareLevy: boolean = true
): TaxCalculationResult {
  if (grossIncome <= 0) {
    return {
      grossIncome: 0,
      taxPayable: 0,
      medicareLevy: 0,
      totalTax: 0,
      afterTaxIncome: 0,
      effectiveTaxRate: 0,
    };
  }

  // Find applicable bracket
  let taxPayable = 0;

  for (const bracket of TAX_BRACKETS_2025_26) {
    if (grossIncome >= bracket.min && (bracket.max === null || grossIncome <= bracket.max)) {
      // Calculate tax for this bracket
      const taxableAmount = grossIncome - bracket.min + 1;
      taxPayable = bracket.baseAmount + (taxableAmount * bracket.rate);
      break;
    }
  }

  // Calculate Medicare Levy (2% of taxable income)
  const medicareLevy = includeMedicareLevy ? grossIncome * MEDICARE_LEVY_RATE : 0;

  const totalTax = taxPayable + medicareLevy;
  const afterTaxIncome = grossIncome - totalTax;
  const effectiveTaxRate = (totalTax / grossIncome) * 100;

  return {
    grossIncome,
    taxPayable,
    medicareLevy,
    totalTax,
    afterTaxIncome,
    effectiveTaxRate,
  };
}

/**
 * Get tax bracket info for a given income
 */
export function getTaxBracketInfo(grossIncome: number): {
  bracket: TaxBracket;
  marginalRate: number;
} {
  const bracket = TAX_BRACKETS_2025_26.find(
    (b) => grossIncome >= b.min && (b.max === null || grossIncome <= b.max)
  ) || TAX_BRACKETS_2025_26[0];

  return {
    bracket,
    marginalRate: bracket.rate * 100, // as percentage
  };
}

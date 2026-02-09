/**
 * Australian Superannuation Calculator
 * ATO Table 21: Super Guarantee Percentage
 * https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee
 */

// Super Guarantee rates by financial year
export const SUPER_GUARANTEE_RATES: Record<string, number> = {
  '2024-25': 0.115,  // 11.5%
  '2025-26': 0.12,   // 12%
  '2026-27': 0.125,  // 12.5%
  '2027-28': 0.13,   // 13%
  '2028-29': 0.135,  // 13.5%
  '2029-30': 0.14,   // 14%
};

export interface SuperCalculationInput {
  baseSalary: number;
  bonus: number;
  allowances: number;
  voluntarySuperRate: number; // as decimal (e.g., 0.05 for 5%)
  financialYear: string;
}

export interface SuperCalculationResult {
  sgBase: number; // Base amount SG is calculated on
  employerSG: number;
  voluntarySuper: number;
  totalSuper: number;
  sgRate: number; // as percentage
}

/**
 * Calculate superannuation contributions
 * SG is calculated on: Base salary + Bonus + Allowances
 * Voluntary super is a percentage of total income
 */
export function calculateSuper(input: SuperCalculationInput): SuperCalculationResult {
  const {
    baseSalary,
    bonus,
    allowances,
    voluntarySuperRate,
    financialYear,
  } = input;

  // Get SG rate for financial year
  const sgRateDecimal = SUPER_GUARANTEE_RATES[financialYear] || 0.12; // Default to 12% if year not found

  // SG base: Base salary + Bonus + Allowances
  const sgBase = baseSalary + bonus + allowances;

  // Calculate employer SG
  const employerSG = sgBase * sgRateDecimal;

  // Calculate voluntary super (as % of total income)
  const totalIncome = baseSalary + bonus + allowances;
  const voluntarySuper = totalIncome * voluntarySuperRate;

  // Total super
  const totalSuper = employerSG + voluntarySuper;

  return {
    sgBase,
    employerSG,
    voluntarySuper,
    totalSuper,
    sgRate: sgRateDecimal * 100, // as percentage
  };
}

/**
 * Get available financial years
 */
export function getAvailableFinancialYears(): string[] {
  return Object.keys(SUPER_GUARANTEE_RATES).sort();
}

/**
 * Get SG rate for a specific financial year
 */
export function getSGRate(financialYear: string): number {
  return SUPER_GUARANTEE_RATES[financialYear] || 0.12;
}

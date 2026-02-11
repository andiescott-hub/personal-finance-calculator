/**
 * Income Calculator
 * Models income for Andy and Nadiele with full transparency
 */

import { calculateIncomeTax, type TaxCalculationResult } from './tax-calculator';
import { calculateSuper, type SuperCalculationResult } from './super-calculator';

export interface IncomeInput {
  baseSalary: number;
  variableIncome: number; // commission/bonus
  allowances: number;
  preTotalAdjustments: number; // can be positive or negative
}

export interface PersonIncomeData {
  // Input components
  baseSalary: number;
  variableIncome: number;
  allowances: number;
  preTotalAdjustments: number;

  // Calculated
  grossIncome: number;

  // Tax
  tax: TaxCalculationResult;

  // Super
  super: SuperCalculationResult;

  // Net income
  afterTaxIncome: number;
  spendableIncome: number; // After-tax minus any exclusions
}

export interface HouseholdIncomeData {
  andy: PersonIncomeData;
  nadiele: PersonIncomeData;
  combined: {
    grossIncome: number;
    totalTax: number;
    afterTaxIncome: number;
    totalSuper: number;
    spendableIncome: number;
  };
}

export interface CalculationConfig {
  includeMedicareLevy: boolean;
  financialYear: string;
  voluntarySuperRate: {
    andy: number;
    nadiele: number;
  };
  spendableExclusions: {
    andy: number; // e.g., car allowance
    nadiele: number;
  };
  novatedLease?: {
    andy: { preTaxAnnual: number; postTaxAnnual: number };
    nadiele: { preTaxAnnual: number; postTaxAnnual: number };
  };
}

/**
 * Calculate complete income breakdown for one person
 */
export function calculatePersonIncome(
  input: IncomeInput,
  voluntarySuperRate: number,
  financialYear: string,
  includeMedicareLevy: boolean,
  spendableExclusion: number = 0,
  novatedLeasePreTax: number = 0,
  novatedLeasePostTax: number = 0,
): PersonIncomeData {
  // Calculate super first (needed to know voluntary super amount for salary sacrifice)
  const superCalc = calculateSuper({
    baseSalary: input.baseSalary,
    bonus: input.variableIncome,
    allowances: input.allowances,
    voluntarySuperRate,
    financialYear,
  });

  // Gross income before pre-tax deductions (for display/reference)
  const grossBeforeDeductions =
    input.baseSalary +
    input.variableIncome +
    input.allowances +
    input.preTotalAdjustments;

  // Taxable income: gross minus salary sacrifice super and novated lease pre-tax
  const grossIncome = grossBeforeDeductions - superCalc.voluntarySuper - novatedLeasePreTax;

  // Calculate tax on reduced taxable income
  const tax = calculateIncomeTax(grossIncome, includeMedicareLevy);

  // After-tax income
  const afterTaxIncome = tax.afterTaxIncome;

  // Spendable income (after-tax minus exclusions minus post-tax lease)
  // Voluntary super is already excluded (came off pre-tax)
  const spendableIncome = afterTaxIncome - spendableExclusion - novatedLeasePostTax;

  return {
    baseSalary: input.baseSalary,
    variableIncome: input.variableIncome,
    allowances: input.allowances,
    preTotalAdjustments: input.preTotalAdjustments,
    grossIncome,
    tax,
    super: superCalc,
    afterTaxIncome,
    spendableIncome,
  };
}

/**
 * Calculate household income (Andy + Nadiele + Combined)
 */
export function calculateHouseholdIncome(
  andyInput: IncomeInput,
  nadieleInput: IncomeInput,
  config: CalculationConfig
): HouseholdIncomeData {
  // Calculate Andy's income
  const andy = calculatePersonIncome(
    andyInput,
    config.voluntarySuperRate.andy,
    config.financialYear,
    config.includeMedicareLevy,
    config.spendableExclusions.andy,
    config.novatedLease?.andy.preTaxAnnual || 0,
    config.novatedLease?.andy.postTaxAnnual || 0,
  );

  // Calculate Nadiele's income
  const nadiele = calculatePersonIncome(
    nadieleInput,
    config.voluntarySuperRate.nadiele,
    config.financialYear,
    config.includeMedicareLevy,
    config.spendableExclusions.nadiele,
    config.novatedLease?.nadiele.preTaxAnnual || 0,
    config.novatedLease?.nadiele.postTaxAnnual || 0,
  );

  // Calculate combined totals
  const combined = {
    grossIncome: andy.grossIncome + nadiele.grossIncome,
    totalTax: andy.tax.totalTax + nadiele.tax.totalTax,
    afterTaxIncome: andy.afterTaxIncome + nadiele.afterTaxIncome,
    totalSuper: andy.super.totalSuper + nadiele.super.totalSuper,
    spendableIncome: andy.spendableIncome + nadiele.spendableIncome,
  };

  return {
    andy,
    nadiele,
    combined,
  };
}

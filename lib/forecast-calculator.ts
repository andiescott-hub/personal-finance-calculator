import { calculateIncomeTax } from './tax-calculator';
import { getSGRate } from './super-calculator';
import { calculateExpenseSummary } from './expense-calculator';
import { calculateMortgagePayment } from './mortgage-calculator';
import type { IncomeInput } from './income-calculator';
import type { ExpenseItem } from './expense-calculator';
import type { Assets, Child, EducationFees, NovatedLease } from './finance-context';

export interface ForecastConfig {
  // Current state
  andyCurrentAge: number;
  nadieleCurrentAge: number;
  andyIncome: IncomeInput;
  nadieleIncome: IncomeInput;
  expenses: ExpenseItem[];
  assets: Assets;

  // Retirement
  andyRetirementAge: number;
  nadieleRetirementAge: number;

  // Rates
  annualIncomeIncrease: number; // percentage
  annualInflationRate: number; // percentage
  andyVoluntarySuper: number; // percentage
  nadieleVoluntarySuper: number; // percentage

  // Portfolio Contributions
  andyPortfolioContribution: number; // annual dollar amount
  nadielePortfolioContribution: number; // annual dollar amount

  // Tax settings
  financialYear: string;
  includeMedicareLevy: boolean;

  // Novated Leases
  andyNovatedLease: NovatedLease;
  nadieleNovatedLease: NovatedLease;

  // Children & Education
  children: Child[];
  educationFees: EducationFees;
}

export interface YearProjection {
  year: number; // Sequential year (1, 2, 3...)
  calendarYear: number; // Actual calendar year (2026, 2027, 2028...)
  andyAge: number;
  nadieleAge: number;

  // Income
  andyGrossIncome: number;
  nadieleGrossIncome: number;
  combinedGrossIncome: number;

  // Tax
  andyTax: number;
  nadieleTax: number;
  combinedTax: number;

  // Super
  andySuper: number;
  nadieleSuper: number;
  combinedSuper: number;

  // After-tax income
  andyAfterTax: number;
  nadieleAfterTax: number;
  combinedAfterTax: number;

  // Expenses (with inflation)
  andyExpenses: number;
  nadieleExpenses: number;
  combinedExpenses: number;
  educationExpenses: number; // Education fees for all children

  // Expense breakdown for milestone chart
  regularExpenses: number; // Non-mortgage, non-education, non-children
  mortgageExpenses: number; // Mortgage payments (regular + extra)
  childrenExpenses: number; // "Children" expense item

  // Income sources for milestone chart
  workIncome: number; // Combined after-tax work income
  superDrawdown: number; // Amount drawn from super in retirement
  portfolioDrawdown: number; // Amount drawn from portfolio in retirement

  // Splurge (disposable income after expenses)
  andySplurge: number;
  nadieleSplurge: number;
  combinedSplurge: number;

  // Cumulative
  cumulativeSavings: number;

  // Assets
  andySuperBalance: number;
  nadieleSuperBalance: number;
  totalSuperBalance: number;
  portfolioValue: number;
  totalCarValue: number;
  otherAssetsValue: number;
  mortgageBalance: number;

  // Net Worth
  totalNetWorth: number; // Assets - Mortgage
}

export interface ForecastResult {
  projections: YearProjection[];
  summary: {
    totalYears: number;
    totalIncomeEarned: number;
    totalTaxPaid: number;
    totalSuperContributed: number;
    totalExpenses: number;
    finalCumulativeSavings: number;
    averageAnnualSavings: number;
  };
}

/**
 * Calculate education fee for a given year level
 * Year levels: -2 = ELP3, -1 = ELP4, 0 = Prep, 1 = Year 1, ..., 12 = Year 12
 */
function getEducationFeeForYearLevel(yearLevel: number, fees: EducationFees): number {
  if (yearLevel < -2 || yearLevel > 12) {
    return 0; // No fees before ELP3 or after Year 12
  }

  if (yearLevel === -2) return fees.elp3;
  if (yearLevel === -1) return fees.elp4;
  if (yearLevel >= 0 && yearLevel <= 4) return fees.prepToYear4;
  if (yearLevel >= 5 && yearLevel <= 6) return fees.year5And6;
  if (yearLevel >= 7 && yearLevel <= 9) return fees.year7To9;
  if (yearLevel >= 10 && yearLevel <= 12) return fees.year10To12;

  return 0;
}

/**
 * Calculate total education expenses for all children in a given forecast year
 */
function calculateEducationExpenses(
  forecastYear: number,
  children: Child[],
  educationFees: EducationFees,
  inflationRate: number
): number {
  let totalEducationExpenses = 0;

  for (const child of children) {
    // Calculate how many years have passed since the child's current year
    const yearsPassed = forecastYear - child.currentYear;
    const childYearLevel = child.currentYearLevel + yearsPassed;

    // Get base fee for this year level
    const baseFee = getEducationFeeForYearLevel(childYearLevel, educationFees);

    if (baseFee > 0) {
      // Apply inflation from base year to forecast year
      const yearsFromBaseYear = forecastYear - educationFees.baseYear;
      const inflationFactor = Math.pow(1 + inflationRate / 100, yearsFromBaseYear);
      const inflatedFee = baseFee * inflationFactor;
      totalEducationExpenses += inflatedFee;
    }
  }

  return totalEducationExpenses;
}

export function calculateForecast(config: ForecastConfig): ForecastResult {
  const projections: YearProjection[] = [];
  let cumulativeSavings = 0;

  // Separate mortgage, education, and children expenses from regular expenses
  const mortgageExpenses = config.expenses.filter(
    (e) => e.id === 'mortgage-auto' || e.id === 'mortgage-extra-auto'
  );
  const childrenExpenses = config.expenses.filter(
    (e) => e.name.toLowerCase() === 'children' && !e.id.startsWith('education-auto-')
  );
  const regularExpenses = config.expenses.filter(
    (e) => e.id !== 'mortgage-auto' && e.id !== 'mortgage-extra-auto'
      && !e.id.startsWith('education-auto-')
      && e.name.toLowerCase() !== 'children'
  );

  // Calculate annual totals separately
  const regularSummary = calculateExpenseSummary(regularExpenses);
  const mortgageSummary = calculateExpenseSummary(mortgageExpenses);
  const childrenSummary = calculateExpenseSummary(childrenExpenses);
  const currentAndyRegularExpenses = regularSummary.totals.annual.andy;
  const currentNadieleRegularExpenses = regularSummary.totals.annual.nadiele;
  const currentAndyMortgageExpenses = mortgageSummary.totals.annual.andy;
  const currentNadieleMortgageExpenses = mortgageSummary.totals.annual.nadiele;
  const currentAndyChildrenExpenses = childrenSummary.totals.annual.andy;
  const currentNadieleChildrenExpenses = childrenSummary.totals.annual.nadiele;

  // Calculate current annual income
  const currentAndyAnnualIncome =
    config.andyIncome.baseSalary +
    config.andyIncome.variableIncome +
    config.andyIncome.allowances +
    config.andyIncome.preTotalAdjustments;

  const currentNadieleAnnualIncome =
    config.nadieleIncome.baseSalary +
    config.nadieleIncome.variableIncome +
    config.nadieleIncome.allowances +
    config.nadieleIncome.preTotalAdjustments;

  // Initialize asset balances
  let andySuperBalance = config.assets.andySuperBalance;
  let nadieleSuperBalance = config.assets.nadieleSuperBalance;
  let portfolioValue = config.assets.portfolioValue;
  let totalCarValue = config.assets.cars.reduce((sum, car) => sum + car.currentValue, 0);

  // Initialize other assets as an array with individual growth tracking
  let otherAssets = config.assets.otherAssets.map(asset => ({
    ...asset,
    value: asset.currentValue,
  }));

  // Track last working year's splurge to maintain lifestyle in retirement
  let lastWorkingSplurge = 0;
  let retirementStartYearCount = 0;

  // Mortgage: track running balance from currentBalance, project forward
  const mortgageCurrentBalance = config.assets.mortgage.currentBalance ?? config.assets.mortgage.loanAmount;
  const mortgagePayment = calculateMortgagePayment(
    config.assets.mortgage.loanAmount,
    config.assets.mortgage.interestRate,
    config.assets.mortgage.loanTermYears,
    config.assets.mortgage.paymentsPerYear
  );
  const mortgageRatePerPeriod = config.assets.mortgage.interestRate / 100 / config.assets.mortgage.paymentsPerYear;
  const mortgageExtraPerPeriod = config.assets.mortgage.paymentsPerYear === 12
    ? config.assets.mortgage.extraMonthlyPayment
    : config.assets.mortgage.extraMonthlyPayment * 12 / config.assets.mortgage.paymentsPerYear;
  let runningMortgageBalance = mortgageCurrentBalance;

  // Current calendar year for mortgage calculations
  const actualCurrentYear = new Date().getFullYear();

  // Project from current age to 80
  const maxAge = 80;
  let yearCount = 0;

  // Get the current year from financial year (e.g., "2025-26" -> 2025)
  const currentYear = parseInt(config.financialYear.split('-')[0]);

  for (let andyAge = config.andyCurrentAge; andyAge <= maxAge; andyAge++) {
    const nadieleAge = config.nadieleCurrentAge + yearCount;
    const forecastYear = currentYear + yearCount;

    // Calculate income with annual increases until retirement
    const andyIsRetired = andyAge >= config.andyRetirementAge;
    const nadieleIsRetired = nadieleAge >= config.nadieleRetirementAge;

    const incomeGrowthFactor = Math.pow(1 + config.annualIncomeIncrease / 100, yearCount);

    const andyGrossBeforeLease = andyIsRetired ? 0 : currentAndyAnnualIncome * incomeGrowthFactor;
    const nadieleGrossBeforeLease = nadieleIsRetired ? 0 : currentNadieleAnnualIncome * incomeGrowthFactor;

    // Novated lease: deduct pre-tax from gross (only during lease term)
    const andyLeaseActive = !andyIsRetired &&
      config.andyNovatedLease.preTaxAnnual > 0 &&
      config.andyNovatedLease.leaseTermYears > 0 &&
      forecastYear >= config.andyNovatedLease.startYear &&
      forecastYear < config.andyNovatedLease.startYear + config.andyNovatedLease.leaseTermYears;
    const nadieleLeaseActive = !nadieleIsRetired &&
      config.nadieleNovatedLease.preTaxAnnual > 0 &&
      config.nadieleNovatedLease.leaseTermYears > 0 &&
      forecastYear >= config.nadieleNovatedLease.startYear &&
      forecastYear < config.nadieleNovatedLease.startYear + config.nadieleNovatedLease.leaseTermYears;

    const andyLeasePreTax = andyLeaseActive ? config.andyNovatedLease.preTaxAnnual : 0;
    const nadieleLeasePreTax = nadieleLeaseActive ? config.nadieleNovatedLease.preTaxAnnual : 0;
    const andyLeasePostTax = andyLeaseActive ? config.andyNovatedLease.postTaxAnnual : 0;
    const nadieleLeasePostTax = nadieleLeaseActive ? config.nadieleNovatedLease.postTaxAnnual : 0;

    const andyGrossIncome = andyGrossBeforeLease - andyLeasePreTax;
    const nadieleGrossIncome = nadieleGrossBeforeLease - nadieleLeasePreTax;
    const combinedGrossIncome = andyGrossIncome + nadieleGrossIncome;

    // Calculate tax (on lease-reduced gross)
    const andyTaxResult = calculateIncomeTax(
      andyGrossIncome,
      config.includeMedicareLevy
    );
    const nadieleTaxResult = calculateIncomeTax(
      nadieleGrossIncome,
      config.includeMedicareLevy
    );

    const andyTax = andyTaxResult.totalTax;
    const nadieleTax = nadieleTaxResult.totalTax;
    const combinedTax = andyTax + nadieleTax;

    // Calculate super (on original gross — standard for novated leases)
    const sgRate = getSGRate(config.financialYear);

    const andyEmployerSG = andyIsRetired ? 0 : andyGrossBeforeLease * sgRate;
    const nadieleEmployerSG = nadieleIsRetired ? 0 : nadieleGrossBeforeLease * sgRate;

    // Voluntary super
    const andyVoluntarySuper = andyIsRetired ? 0 : andyGrossIncome * (config.andyVoluntarySuper / 100);
    const nadieleVoluntarySuper = nadieleIsRetired ? 0 : nadieleGrossIncome * (config.nadieleVoluntarySuper / 100);

    // Total super contributions
    const andySuper = andyEmployerSG + andyVoluntarySuper;
    const nadieleSuper = nadieleEmployerSG + nadieleVoluntarySuper;
    const combinedSuper = andySuper + nadieleSuper;

    // After-tax income
    const andyAfterTax = andyGrossIncome - andyTax;
    const nadieleAfterTax = nadieleGrossIncome - nadieleTax;
    const combinedAfterTax = andyAfterTax + nadieleAfterTax;

    // Expenses with inflation
    const expenseInflationFactor = Math.pow(1 + config.annualInflationRate / 100, yearCount);

    // Regular expenses always apply (with inflation)
    const yearRegularExpenses = (currentAndyRegularExpenses + currentNadieleRegularExpenses) * expenseInflationFactor;
    let andyExpenses = currentAndyRegularExpenses * expenseInflationFactor;
    let nadieleExpenses = currentNadieleRegularExpenses * expenseInflationFactor;

    // Mortgage expenses only apply while mortgage is still active (no inflation - fixed payments)
    const mortgageStillActive = runningMortgageBalance > 0;
    const yearMortgageExpenses = mortgageStillActive
      ? currentAndyMortgageExpenses + currentNadieleMortgageExpenses
      : 0;
    if (mortgageStillActive) {
      andyExpenses += currentAndyMortgageExpenses;
      nadieleExpenses += currentNadieleMortgageExpenses;
    }

    // Calculate education expenses for this year
    const educationExpenses = calculateEducationExpenses(
      forecastYear,
      config.children,
      config.educationFees,
      config.annualInflationRate
    );

    // "Children" expense only applies while at least one child is still in school
    const anyChildInSchool = config.children.some((child) => {
      const yearsPassed = forecastYear - child.currentYear;
      const childYearLevel = child.currentYearLevel + yearsPassed;
      return childYearLevel >= -2 && childYearLevel <= 12;
    });
    const yearChildrenExpenses = anyChildInSchool
      ? (currentAndyChildrenExpenses + currentNadieleChildrenExpenses) * expenseInflationFactor
      : 0;
    if (anyChildInSchool) {
      andyExpenses += currentAndyChildrenExpenses * expenseInflationFactor;
      nadieleExpenses += currentNadieleChildrenExpenses * expenseInflationFactor;
    }

    // Split education expenses 50/50 between Andy and Nadiele
    const andyEducationExpenses = educationExpenses / 2;
    const nadieleEducationExpenses = educationExpenses / 2;

    const combinedExpenses = andyExpenses + nadieleExpenses + educationExpenses;

    // Portfolio contributions (only during working years, grow with income)
    const bothRetired = andyIsRetired && nadieleIsRetired;
    const andyPortfolioContrib = andyIsRetired ? 0 : (config.andyPortfolioContribution || 0) * incomeGrowthFactor;
    const nadielePortfolioContrib = nadieleIsRetired ? 0 : (config.nadielePortfolioContribution || 0) * incomeGrowthFactor;
    const combinedPortfolioContrib = andyPortfolioContrib + nadielePortfolioContrib;

    // Non-spendable income (allowances + preTotalAdjustments are not available for spending)
    const andyNonSpendable = andyIsRetired ? 0 :
      (config.andyIncome.allowances + config.andyIncome.preTotalAdjustments) * incomeGrowthFactor;
    const nadieleNonSpendable = nadieleIsRetired ? 0 :
      (config.nadieleIncome.allowances + config.nadieleIncome.preTotalAdjustments) * incomeGrowthFactor;

    // Splurge = disposable income after ALL outgoings (expenses + education + portfolio contributions + non-spendable + post-tax lease)
    // Splurge is money that gets SPENT (vaporized) - not saved or invested
    let andySplurge = andyAfterTax - andyVoluntarySuper - andyNonSpendable - andyExpenses - andyEducationExpenses - andyPortfolioContrib - andyLeasePostTax;
    let nadieleSplurge = nadieleAfterTax - nadieleVoluntarySuper - nadieleNonSpendable - nadieleExpenses - nadieleEducationExpenses - nadielePortfolioContrib - nadieleLeasePostTax;
    let combinedSplurge = andySplurge + nadieleSplurge;

    // Track last working year's splurge (already includes inflation/income growth)
    if (!bothRetired && combinedSplurge > 0) {
      lastWorkingSplurge = combinedSplurge;
      retirementStartYearCount = yearCount + 1;
    }

    // In retirement: need to fund expenses + discretionary splurge from super/portfolio
    // Use last working year's splurge as baseline, then only inflate for years since retirement
    if (bothRetired && lastWorkingSplurge > 0) {
      const yearsSinceRetirement = yearCount - retirementStartYearCount;
      const retirementInflation = Math.pow(1 + config.annualInflationRate / 100, yearsSinceRetirement);
      const retirementSplurge = lastWorkingSplurge * retirementInflation;

      // This additional spending increases the shortfall
      combinedSplurge = combinedSplurge - retirementSplurge;
      andySplurge = andySplurge - (retirementSplurge / 2);
      nadieleSplurge = nadieleSplurge - (retirementSplurge / 2);
    }

    // Update cumulative
    cumulativeSavings += combinedSplurge;

    // Grow assets
    // Super: Apply growth rate first, then add contributions
    andySuperBalance = andySuperBalance * (1 + config.assets.superGrowthRate / 100) + andySuper;
    nadieleSuperBalance = nadieleSuperBalance * (1 + config.assets.superGrowthRate / 100) + nadieleSuper;
    let totalSuperBalance = andySuperBalance + nadieleSuperBalance;

    // Portfolio: Apply growth rate, then add working-year contributions
    portfolioValue = portfolioValue * (1 + config.assets.portfolioGrowthRate / 100);
    portfolioValue += combinedPortfolioContrib; // Only non-zero during working years

    // Handle retirement spending: draw from super/portfolio to cover shortfall
    let superDrawdown = 0;
    let portfolioDrawdown = 0;
    if (bothRetired && combinedSplurge < 0) {
      // Shortfall = expenses + splurge lifestyle that need funding
      const shortfall = Math.abs(combinedSplurge);

      // Try to draw from portfolio first (up to its share)
      let desiredFromPortfolio = shortfall * (1 - config.assets.retirementSpendingRatio / 100);
      let actualFromPortfolio = Math.min(desiredFromPortfolio, portfolioValue);
      portfolioValue = Math.max(0, portfolioValue - actualFromPortfolio);
      portfolioDrawdown = actualFromPortfolio;

      // Remainder (including any portfolio couldn't cover) comes from super
      let fromSuper = shortfall - actualFromPortfolio;
      superDrawdown = fromSuper;

      // Draw from super (split proportionally between Andy and Nadiele)
      const superSplit = andySuperBalance / (andySuperBalance + nadieleSuperBalance) || 0.5;
      andySuperBalance = Math.max(0, andySuperBalance - fromSuper * superSplit);
      nadieleSuperBalance = Math.max(0, nadieleSuperBalance - fromSuper * (1 - superSplit));
      totalSuperBalance = andySuperBalance + nadieleSuperBalance;

      // Adjust cumulative savings to reflect drawing down assets
      cumulativeSavings -= shortfall;
    }

    // Cars: Apply depreciation
    const avgDepreciation = config.assets.cars.length > 0
      ? config.assets.cars.reduce((sum, car) => sum + car.annualDepreciation, 0) / config.assets.cars.length
      : 15;
    totalCarValue = totalCarValue * (1 - avgDepreciation / 100);

    // Other Assets: Apply individual growth rates
    otherAssets = otherAssets.map(asset => ({
      ...asset,
      value: asset.value * (1 + asset.annualGrowthRate / 100),
    }));
    const otherAssetsValue = otherAssets.reduce((sum, asset) => sum + asset.value, 0);

    // Mortgage: Project balance forward one year from running balance
    if (yearCount > 0 && runningMortgageBalance > 0) {
      for (let p = 0; p < config.assets.mortgage.paymentsPerYear; p++) {
        if (runningMortgageBalance <= 0) break;
        const interest = runningMortgageBalance * mortgageRatePerPeriod;
        const principal = mortgagePayment - interest + mortgageExtraPerPeriod;
        runningMortgageBalance = Math.max(0, runningMortgageBalance - principal);
      }
    }
    const mortgageBalance = runningMortgageBalance;

    // Total net worth (assets minus liabilities)
    const totalAssets = totalSuperBalance + portfolioValue + totalCarValue + otherAssetsValue;
    const totalNetWorth = totalAssets - mortgageBalance;

    projections.push({
      year: yearCount + 1,
      calendarYear: forecastYear,
      andyAge,
      nadieleAge,
      andyGrossIncome,
      nadieleGrossIncome,
      combinedGrossIncome,
      andyTax,
      nadieleTax,
      combinedTax,
      andySuper,
      nadieleSuper,
      combinedSuper,
      andyAfterTax,
      nadieleAfterTax,
      combinedAfterTax,
      andyExpenses,
      nadieleExpenses,
      combinedExpenses,
      educationExpenses,
      regularExpenses: yearRegularExpenses,
      mortgageExpenses: yearMortgageExpenses,
      childrenExpenses: yearChildrenExpenses,
      workIncome: combinedAfterTax,
      superDrawdown,
      portfolioDrawdown,
      andySplurge,
      nadieleSplurge,
      combinedSplurge,
      cumulativeSavings,
      andySuperBalance,
      nadieleSuperBalance,
      totalSuperBalance,
      portfolioValue,
      totalCarValue,
      otherAssetsValue,
      mortgageBalance,
      totalNetWorth,
    });

    yearCount++;

    // Stop if Nadiele also reaches 80
    if (nadieleAge >= maxAge) break;
  }

  // Calculate summary
  const totalIncomeEarned = projections.reduce((sum, p) => sum + p.combinedGrossIncome, 0);
  const totalTaxPaid = projections.reduce((sum, p) => sum + p.combinedTax, 0);
  const totalSuperContributed = projections.reduce((sum, p) => sum + p.combinedSuper, 0);
  const totalExpenses = projections.reduce((sum, p) => sum + p.combinedExpenses, 0);
  const finalCumulativeSavings = cumulativeSavings;
  const averageAnnualSavings = finalCumulativeSavings / projections.length;

  return {
    projections,
    summary: {
      totalYears: projections.length,
      totalIncomeEarned,
      totalTaxPaid,
      totalSuperContributed,
      totalExpenses,
      finalCumulativeSavings,
      averageAnnualSavings,
    },
  };
}

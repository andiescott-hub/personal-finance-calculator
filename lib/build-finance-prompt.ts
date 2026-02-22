import type { ForecastConfig, ForecastResult } from './forecast-calculator';
import type { HouseholdIncomeData } from './income-calculator';

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-AU');
}

function pct(n: number): string {
  return n.toFixed(1) + '%';
}

export function buildFinanceSystemPrompt(
  config: ForecastConfig,
  forecast: ForecastResult,
  income: HouseholdIncomeData,
): string {
  const currentYear = parseInt(config.financialYear.split('-')[0]);

  // --- Household overview ---
  const household = [
    `Andy: age ${config.andyCurrentAge}, retires at ${config.andyRetirementAge} (year ${currentYear + (config.andyRetirementAge - config.andyCurrentAge)})`,
    `Nadiele: age ${config.nadieleCurrentAge}, retires at ${config.nadieleRetirementAge} (year ${currentYear + (config.nadieleRetirementAge - config.nadieleCurrentAge)})`,
  ];
  if (config.children.length > 0) {
    for (const child of config.children) {
      const level = child.currentYearLevel <= -2 ? 'ELP3'
        : child.currentYearLevel === -1 ? 'ELP4'
        : child.currentYearLevel === 0 ? 'Prep'
        : `Year ${child.currentYearLevel}`;
      household.push(`Child: ${child.name}, currently in ${level} (${child.currentYear})`);
    }
  }

  // --- Current income ---
  const incomeSection = [
    'ANDY:',
    `  Gross (before deductions): ${fmt(income.andy.baseSalary + income.andy.variableIncome + income.andy.allowances + income.andy.preTotalAdjustments)}`,
    `    Base salary: ${fmt(income.andy.baseSalary)}, Variable: ${fmt(income.andy.variableIncome)}, Allowances: ${fmt(income.andy.allowances)}`,
    `  Taxable income: ${fmt(income.andy.grossIncome)}`,
    `  Tax: ${fmt(income.andy.tax.totalTax)} (effective rate ${pct(income.andy.tax.effectiveTaxRate)})`,
    `  After-tax: ${fmt(income.andy.afterTaxIncome)}`,
    `  Super contributions: ${fmt(income.andy.super.totalSuper)} (employer ${fmt(income.andy.super.employerSG)} + voluntary ${fmt(income.andy.super.voluntarySuper)})`,
    '',
    'NADIELE:',
    `  Gross (before deductions): ${fmt(income.nadiele.baseSalary + income.nadiele.variableIncome + income.nadiele.allowances + income.nadiele.preTotalAdjustments)}`,
    `    Base salary: ${fmt(income.nadiele.baseSalary)}, Variable: ${fmt(income.nadiele.variableIncome)}, Allowances: ${fmt(income.nadiele.allowances)}`,
    `  Taxable income: ${fmt(income.nadiele.grossIncome)}`,
    `  Tax: ${fmt(income.nadiele.tax.totalTax)} (effective rate ${pct(income.nadiele.tax.effectiveTaxRate)})`,
    `  After-tax: ${fmt(income.nadiele.afterTaxIncome)}`,
    `  Super contributions: ${fmt(income.nadiele.super.totalSuper)} (employer ${fmt(income.nadiele.super.employerSG)} + voluntary ${fmt(income.nadiele.super.voluntarySuper)})`,
    '',
    `COMBINED: Gross ${fmt(income.combined.grossIncome)}, Tax ${fmt(income.combined.totalTax)}, After-tax ${fmt(income.combined.afterTaxIncome)}, Super ${fmt(income.combined.totalSuper)}`,
  ];

  // --- Novated leases ---
  const leaseLines: string[] = [];
  if (config.andyNovatedLease.preTaxAnnual > 0 || config.andyNovatedLease.postTaxAnnual > 0) {
    leaseLines.push(`Andy: pre-tax ${fmt(config.andyNovatedLease.preTaxAnnual)}/yr, post-tax ${fmt(config.andyNovatedLease.postTaxAnnual)}/yr, ${config.andyNovatedLease.leaseTermYears}yr term from ${config.andyNovatedLease.startYear}`);
  }
  if (config.nadieleNovatedLease.preTaxAnnual > 0 || config.nadieleNovatedLease.postTaxAnnual > 0) {
    leaseLines.push(`Nadiele: pre-tax ${fmt(config.nadieleNovatedLease.preTaxAnnual)}/yr, post-tax ${fmt(config.nadieleNovatedLease.postTaxAnnual)}/yr, ${config.nadieleNovatedLease.leaseTermYears}yr term from ${config.nadieleNovatedLease.startYear}`);
  }

  // --- Expenses ---
  const expenseLines = config.expenses.map(e => {
    const annual = e.frequency === 'weekly' ? e.amount * 52
      : e.frequency === 'fortnightly' ? e.amount * 26
      : e.frequency === 'monthly' ? e.amount * 12
      : e.amount;
    return `  ${e.name} (${e.category}): ${fmt(e.amount)}/${e.frequency} = ${fmt(annual)}/yr [Andy ${e.andyProportion}% / Nadiele ${e.nadieleProportion}%]`;
  });

  // --- Education fees ---
  const eduLines = [
    `Base year: ${config.educationFees.baseYear}`,
    `ELP3: ${fmt(config.educationFees.elp3)}, ELP4: ${fmt(config.educationFees.elp4)}`,
    `Prep-Year 4: ${fmt(config.educationFees.prepToYear4)}, Year 5-6: ${fmt(config.educationFees.year5And6)}`,
    `Year 7-9: ${fmt(config.educationFees.year7To9)}, Year 10-12: ${fmt(config.educationFees.year10To12)}`,
    `(fees inflate at ${pct(config.annualInflationRate)} p.a.)`,
  ];

  // --- Assets ---
  const assetLines = [
    `Super: Andy ${fmt(config.assets.andySuperBalance)}, Nadiele ${fmt(config.assets.nadieleSuperBalance)}, growth ${pct(config.assets.superGrowthRate)} p.a.`,
    `Portfolio: ${fmt(config.assets.portfolioValue)}, growth ${pct(config.assets.portfolioGrowthRate)} p.a.`,
  ];
  if (config.assets.portfolioItems.length > 0) {
    assetLines.push(`  Holdings: ${config.assets.portfolioItems.map(i => `${i.name} ${fmt(i.currentValue)}`).join(', ')}`);
  }
  for (const car of config.assets.cars) {
    assetLines.push(`Car: ${car.name} ${fmt(car.currentValue)}, depreciates ${pct(car.annualDepreciation)} p.a.`);
  }
  for (const a of config.assets.otherAssets) {
    assetLines.push(`Other: ${a.name} (${a.category}) ${fmt(a.currentValue)}, growth ${pct(a.annualGrowthRate)} p.a.`);
  }
  const m = config.assets.mortgage;
  assetLines.push(`Mortgage: ${fmt(m.currentBalance)} remaining of ${fmt(m.loanAmount)} loan, ${pct(m.interestRate)} rate, ${m.loanTermYears}yr term, ${m.paymentsPerYear === 12 ? 'monthly' : 'fortnightly'} payments${m.extraMonthlyPayment > 0 ? `, extra ${fmt(m.extraMonthlyPayment)}/month` : ''}`);
  assetLines.push(`Retirement drawdown split: ${m ? config.assets.retirementSpendingRatio : 70}% from super, ${100 - (config.assets.retirementSpendingRatio || 70)}% from portfolio`);

  // --- Growth assumptions ---
  const assumptions = [
    `Income growth: ${pct(config.annualIncomeIncrease)} p.a.`,
    `Inflation: ${pct(config.annualInflationRate)} p.a.`,
    `Super growth: ${pct(config.assets.superGrowthRate)} p.a.`,
    `Portfolio growth: ${pct(config.assets.portfolioGrowthRate)} p.a.`,
    `Voluntary super: Andy ${pct(config.andyVoluntarySuper)}, Nadiele ${pct(config.nadieleVoluntarySuper)}`,
    `Portfolio contributions: Andy ${fmt(config.andyPortfolioContribution)}/yr, Nadiele ${fmt(config.nadielePortfolioContribution)}/yr`,
    config.splurgeAutoInvestThreshold > 0
      ? `Splurge Auto-Invest Threshold: ${pct(config.splurgeAutoInvestThreshold)} of after-tax income — discretionary spending above this % is automatically invested into portfolio`
      : `Splurge Auto-Invest Threshold: off (0%)`,
  ];

  // --- Forecast summary milestones ---
  const p = forecast.projections;
  const retirementYear = p.find(y => y.andyAge >= config.andyRetirementAge && y.nadieleAge >= config.nadieleRetirementAge);
  const age80Year = p[p.length - 1];
  const mortgagePaidOff = p.find(y => y.mortgageBalance <= 0);

  const milestones: string[] = [];
  if (retirementYear) {
    milestones.push(`At retirement (${retirementYear.calendarYear}, Andy ${retirementYear.andyAge}/Nadiele ${retirementYear.nadieleAge}): Net worth ${fmt(retirementYear.totalNetWorth)}, Super ${fmt(retirementYear.totalSuperBalance)}, Portfolio ${fmt(retirementYear.portfolioValue)}, Mortgage ${fmt(retirementYear.mortgageBalance)}`);
  }
  if (age80Year) {
    milestones.push(`At age 80 (${age80Year.calendarYear}): Net worth ${fmt(age80Year.totalNetWorth)}, Super ${fmt(age80Year.totalSuperBalance)}, Portfolio ${fmt(age80Year.portfolioValue)}`);
  }
  if (mortgagePaidOff) {
    milestones.push(`Mortgage paid off: ${mortgagePaidOff.calendarYear} (Andy age ${mortgagePaidOff.andyAge})`);
  }
  milestones.push(`Lifetime totals: Income earned ${fmt(forecast.summary.totalIncomeEarned)}, Tax paid ${fmt(forecast.summary.totalTaxPaid)}, Super contributed ${fmt(forecast.summary.totalSuperContributed)}, Expenses ${fmt(forecast.summary.totalExpenses)}`);

  // --- Year-by-year projection table ---
  const tableHeader = 'Year | Andy Age | Nad Age | Gross Income | Tax | After-Tax | Expenses | Education | Splurge | Auto-Invested | Super Bal | Portfolio | Mortgage | Net Worth';
  const tableDivider = '-'.repeat(tableHeader.length);
  const tableRows = p.map(y =>
    `${y.calendarYear} | ${y.andyAge} | ${y.nadieleAge} | ${fmt(y.combinedGrossIncome)} | ${fmt(y.combinedTax)} | ${fmt(y.combinedAfterTax)} | ${fmt(y.combinedExpenses)} | ${fmt(y.educationExpenses)} | ${fmt(y.combinedSplurge)} | ${fmt(y.splurgeAutoInvested)} | ${fmt(y.totalSuperBalance)} | ${fmt(y.portfolioValue)} | ${fmt(y.mortgageBalance)} | ${fmt(y.totalNetWorth)}`
  );

  return `You are a helpful financial assistant for an Australian household. You have access to their complete financial data and year-by-year projections below. Answer questions accurately using the data provided. Use Australian dollar formatting ($X,XXX). Be concise but thorough. When referencing specific years or ages, cite the exact numbers from the data. If a question requires extrapolation beyond the data, say so.

=== HOUSEHOLD ===
${household.join('\n')}

=== CURRENT INCOME (FY ${config.financialYear}) ===
${incomeSection.join('\n')}

${leaseLines.length > 0 ? `=== NOVATED LEASES ===\n${leaseLines.join('\n')}\n` : ''}=== EXPENSES ===
${expenseLines.join('\n')}

=== EDUCATION FEES (annual, base year ${config.educationFees.baseYear}) ===
${eduLines.join('\n')}

=== ASSETS ===
${assetLines.join('\n')}

=== GROWTH ASSUMPTIONS ===
${assumptions.join('\n')}

=== KEY MILESTONES ===
${milestones.join('\n')}

=== YEAR-BY-YEAR PROJECTIONS ===
${tableHeader}
${tableDivider}
${tableRows.join('\n')}`;
}

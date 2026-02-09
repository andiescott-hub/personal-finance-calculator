/**
 * Expense Distribution Calculator
 * Handles proportional expense splitting between Andy and Nadiele
 */

export type ExpenseFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'annual';

export interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: ExpenseFrequency;
  andyProportion: number; // e.g., 55
  nadieleProportion: number; // e.g., 45
}

export interface ExpenseBreakdown {
  id: string;
  name: string;
  category: string;
  frequency: ExpenseFrequency;
  totalAmount: number;
  andyShare: number;
  nadieleShare: number;
  andyPercentage: number;
  nadielePercentage: number;
  // Normalized to fortnightly
  fortnightlyTotal: number;
  fortnightlyAndy: number;
  fortnightlyNadiele: number;
}

export interface ExpenseSummary {
  expenses: ExpenseBreakdown[];
  totals: {
    fortnightly: {
      andy: number;
      nadiele: number;
      combined: number;
    };
    monthly: {
      andy: number;
      nadiele: number;
      combined: number;
    };
    annual: {
      andy: number;
      nadiele: number;
      combined: number;
    };
  };
}

/**
 * Convert any frequency to fortnightly amount
 */
function toFortnightly(amount: number, frequency: ExpenseFrequency): number {
  switch (frequency) {
    case 'weekly':
      return amount * 2;
    case 'fortnightly':
      return amount;
    case 'monthly':
      return (amount * 12) / 26; // 26 fortnights in a year
    case 'annual':
      return amount / 26;
    default:
      return amount;
  }
}

/**
 * Convert fortnightly to other frequencies
 */
function fromFortnightly(fortnightlyAmount: number, targetFrequency: 'monthly' | 'annual'): number {
  switch (targetFrequency) {
    case 'monthly':
      return (fortnightlyAmount * 26) / 12;
    case 'annual':
      return fortnightlyAmount * 26;
    default:
      return fortnightlyAmount;
  }
}

/**
 * Calculate expense breakdown with proportional splits
 */
export function calculateExpenseBreakdown(expense: ExpenseItem): ExpenseBreakdown {
  // Calculate percentages from proportions
  const totalProportion = expense.andyProportion + expense.nadieleProportion;
  const andyPercentage = totalProportion > 0 ? (expense.andyProportion / totalProportion) * 100 : 50;
  const nadielePercentage = totalProportion > 0 ? (expense.nadieleProportion / totalProportion) * 100 : 50;

  // Calculate shares
  const andyShare = expense.amount * (andyPercentage / 100);
  const nadieleShare = expense.amount * (nadielePercentage / 100);

  // Normalize to fortnightly
  const fortnightlyTotal = toFortnightly(expense.amount, expense.frequency);
  const fortnightlyAndy = toFortnightly(andyShare, expense.frequency);
  const fortnightlyNadiele = toFortnightly(nadieleShare, expense.frequency);

  return {
    id: expense.id,
    name: expense.name,
    category: expense.category,
    frequency: expense.frequency,
    totalAmount: expense.amount,
    andyShare,
    nadieleShare,
    andyPercentage,
    nadielePercentage,
    fortnightlyTotal,
    fortnightlyAndy,
    fortnightlyNadiele,
  };
}

/**
 * Calculate summary of all expenses
 */
export function calculateExpenseSummary(expenses: ExpenseItem[]): ExpenseSummary {
  const breakdowns = expenses.map(calculateExpenseBreakdown);

  // Sum up fortnightly totals
  const fortnightlyAndy = breakdowns.reduce((sum, exp) => sum + exp.fortnightlyAndy, 0);
  const fortnightlyNadiele = breakdowns.reduce((sum, exp) => sum + exp.fortnightlyNadiele, 0);
  const fortnightlyCombined = fortnightlyAndy + fortnightlyNadiele;

  // Convert to other frequencies
  const monthlyAndy = fromFortnightly(fortnightlyAndy, 'monthly');
  const monthlyNadiele = fromFortnightly(fortnightlyNadiele, 'monthly');
  const monthlyCombined = monthlyAndy + monthlyNadiele;

  const annualAndy = fromFortnightly(fortnightlyAndy, 'annual');
  const annualNadiele = fromFortnightly(fortnightlyNadiele, 'annual');
  const annualCombined = annualAndy + annualNadiele;

  return {
    expenses: breakdowns,
    totals: {
      fortnightly: {
        andy: fortnightlyAndy,
        nadiele: fortnightlyNadiele,
        combined: fortnightlyCombined,
      },
      monthly: {
        andy: monthlyAndy,
        nadiele: monthlyNadiele,
        combined: monthlyCombined,
      },
      annual: {
        andy: annualAndy,
        nadiele: annualNadiele,
        combined: annualCombined,
      },
    },
  };
}

/**
 * Calculate disposable income after expenses
 */
export interface DisposableIncome {
  andy: {
    spendableIncome: number; // fortnightly
    expenses: number; // fortnightly
    disposable: number; // fortnightly
    monthly: {
      spendableIncome: number;
      expenses: number;
      disposable: number;
    };
    annual: {
      spendableIncome: number;
      expenses: number;
      disposable: number;
    };
  };
  nadiele: {
    spendableIncome: number;
    expenses: number;
    disposable: number;
    monthly: {
      spendableIncome: number;
      expenses: number;
      disposable: number;
    };
    annual: {
      spendableIncome: number;
      expenses: number;
      disposable: number;
    };
  };
  combined: {
    spendableIncome: number;
    expenses: number;
    disposable: number;
    monthly: {
      spendableIncome: number;
      expenses: number;
      disposable: number;
    };
    annual: {
      spendableIncome: number;
      expenses: number;
      disposable: number;
    };
  };
}

export function calculateDisposableIncome(
  andySpendableIncomeAnnual: number,
  nadieleSpendableIncomeAnnual: number,
  expenseSummary: ExpenseSummary
): DisposableIncome {
  // Convert annual spendable income to fortnightly
  const andySpendableFortnightly = andySpendableIncomeAnnual / 26;
  const nadieleSpendableFortnightly = nadieleSpendableIncomeAnnual / 26;

  // Get fortnightly expenses
  const andyExpensesFortnightly = expenseSummary.totals.fortnightly.andy;
  const nadieleExpensesFortnightly = expenseSummary.totals.fortnightly.nadiele;

  // Calculate disposable
  const andyDisposableFortnightly = andySpendableFortnightly - andyExpensesFortnightly;
  const nadieleDisposableFortnightly = nadieleSpendableFortnightly - nadieleExpensesFortnightly;

  // Convert to monthly and annual
  const andySpendableMonthly = (andySpendableIncomeAnnual / 12);
  const nadieleSpendableMonthly = (nadieleSpendableIncomeAnnual / 12);

  const andyExpensesMonthly = expenseSummary.totals.monthly.andy;
  const nadieleExpensesMonthly = expenseSummary.totals.monthly.nadiele;

  const andyDisposableMonthly = andySpendableMonthly - andyExpensesMonthly;
  const nadieleDisposableMonthly = nadieleSpendableMonthly - nadieleExpensesMonthly;

  const andyExpensesAnnual = expenseSummary.totals.annual.andy;
  const nadieleExpensesAnnual = expenseSummary.totals.annual.nadiele;

  const andyDisposableAnnual = andySpendableIncomeAnnual - andyExpensesAnnual;
  const nadieleDisposableAnnual = nadieleSpendableIncomeAnnual - nadieleExpensesAnnual;

  return {
    andy: {
      spendableIncome: andySpendableFortnightly,
      expenses: andyExpensesFortnightly,
      disposable: andyDisposableFortnightly,
      monthly: {
        spendableIncome: andySpendableMonthly,
        expenses: andyExpensesMonthly,
        disposable: andyDisposableMonthly,
      },
      annual: {
        spendableIncome: andySpendableIncomeAnnual,
        expenses: andyExpensesAnnual,
        disposable: andyDisposableAnnual,
      },
    },
    nadiele: {
      spendableIncome: nadieleSpendableFortnightly,
      expenses: nadieleExpensesFortnightly,
      disposable: nadieleDisposableFortnightly,
      monthly: {
        spendableIncome: nadieleSpendableMonthly,
        expenses: nadieleExpensesMonthly,
        disposable: nadieleDisposableMonthly,
      },
      annual: {
        spendableIncome: nadieleSpendableIncomeAnnual,
        expenses: nadieleExpensesAnnual,
        disposable: nadieleDisposableAnnual,
      },
    },
    combined: {
      spendableIncome: andySpendableFortnightly + nadieleSpendableFortnightly,
      expenses: andyExpensesFortnightly + nadieleExpensesFortnightly,
      disposable: andyDisposableFortnightly + nadieleDisposableFortnightly,
      monthly: {
        spendableIncome: andySpendableMonthly + nadieleSpendableMonthly,
        expenses: andyExpensesMonthly + nadieleExpensesMonthly,
        disposable: andyDisposableMonthly + nadieleDisposableMonthly,
      },
      annual: {
        spendableIncome: andySpendableIncomeAnnual + nadieleSpendableIncomeAnnual,
        expenses: andyExpensesAnnual + nadieleExpensesAnnual,
        disposable: andyDisposableAnnual + nadieleDisposableAnnual,
      },
    },
  };
}

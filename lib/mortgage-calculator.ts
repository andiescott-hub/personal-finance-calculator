/**
 * Mortgage Calculator
 * Implements PMT formula for loan payments
 */

export interface MortgagePayment {
  paymentAmount: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
}

export interface MortgageSchedule {
  yearlyPayments: {
    year: number;
    totalPayment: number;
    totalPrincipal: number;
    totalInterest: number;
    endingBalance: number;
  }[];
  fortnightlyPayment: number;
  monthlyPayment: number;
  annualPayment: number;
  totalInterestPaid: number;
}

/**
 * Calculate mortgage payment using PMT formula
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 * where:
 * P = Principal loan amount
 * r = Interest rate per period
 * n = Total number of payments
 */
export function calculateMortgagePayment(
  principal: number,
  annualInterestRate: number, // as percentage
  loanTermYears: number,
  paymentsPerYear: number = 12
): number {
  const r = annualInterestRate / 100 / paymentsPerYear;
  const n = loanTermYears * paymentsPerYear;

  if (r === 0) {
    return principal / n;
  }

  const payment = (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  return payment;
}

/**
 * Calculate full mortgage schedule
 */
export function calculateMortgageSchedule(
  loanAmount: number,
  interestRate: number,
  loanTermYears: number,
  paymentsPerYear: number = 12,
  currentYear: number = 0 // years elapsed since loan start
): MortgageSchedule {
  const payment = calculateMortgagePayment(loanAmount, interestRate, loanTermYears, paymentsPerYear);
  const ratePerPeriod = interestRate / 100 / paymentsPerYear;
  const totalPayments = loanTermYears * paymentsPerYear;
  const paymentsElapsed = currentYear * paymentsPerYear;

  let balance = loanAmount;
  const yearlyPayments: MortgageSchedule['yearlyPayments'] = [];

  // Calculate remaining payments
  for (let year = currentYear; year < loanTermYears; year++) {
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let period = 0; period < paymentsPerYear; period++) {
      if (balance <= 0) break;

      const interestPayment = balance * ratePerPeriod;
      const principalPayment = payment - interestPayment;

      balance = Math.max(0, balance - principalPayment);
      yearPrincipal += principalPayment;
      yearInterest += interestPayment;
    }

    yearlyPayments.push({
      year: year + 1,
      totalPayment: yearPrincipal + yearInterest,
      totalPrincipal: yearPrincipal,
      totalInterest: yearInterest,
      endingBalance: balance,
    });

    if (balance <= 0) break;
  }

  const totalInterestPaid = yearlyPayments.reduce((sum, y) => sum + y.totalInterest, 0);

  return {
    yearlyPayments,
    fortnightlyPayment: paymentsPerYear === 26 ? payment : payment * 12 / 26,
    monthlyPayment: paymentsPerYear === 12 ? payment : payment * 26 / 12,
    annualPayment: payment * paymentsPerYear,
    totalInterestPaid,
  };
}

/**
 * Calculate remaining mortgage balance at a specific year
 */
export function calculateRemainingBalance(
  loanAmount: number,
  interestRate: number,
  loanTermYears: number,
  paymentsPerYear: number,
  yearsElapsed: number,
  extraMonthlyPayment: number = 0
): number {
  const payment = calculateMortgagePayment(loanAmount, interestRate, loanTermYears, paymentsPerYear);
  const ratePerPeriod = interestRate / 100 / paymentsPerYear;
  const paymentsElapsed = yearsElapsed * paymentsPerYear;

  // Convert extra monthly payment to per-period payment
  const extraPaymentPerPeriod = paymentsPerYear === 12
    ? extraMonthlyPayment
    : extraMonthlyPayment * 12 / paymentsPerYear;

  let balance = loanAmount;

  for (let i = 0; i < paymentsElapsed; i++) {
    const interestPayment = balance * ratePerPeriod;
    const principalPayment = payment - interestPayment;

    // Apply regular payment + extra payment to principal
    const totalPrincipalPayment = principalPayment + extraPaymentPerPeriod;
    balance = Math.max(0, balance - totalPrincipalPayment);

    if (balance <= 0) break;
  }

  return balance;
}

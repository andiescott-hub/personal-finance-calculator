'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import type { IncomeInput } from './income-calculator';
import type { ExpenseItem } from './expense-calculator';
import { calculateMortgagePayment } from './mortgage-calculator';

export interface Car {
  id: string;
  name: string;
  currentValue: number;
  annualDepreciation: number; // percentage
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  annualGrowthRate: number; // percentage (can be negative for depreciation)
}

export interface PortfolioItem {
  id: string;
  name: string;
  ticker?: string;
  quantity?: number;
  pricePerUnit?: number;
  currentValue: number;
  isManual: boolean;
  lastPriceUpdate?: string;
}

export interface Mortgage {
  loanAmount: number;
  currentBalance: number; // actual balance owed today
  interestRate: number; // percentage
  loanTermYears: number;
  paymentsPerYear: number; // 12 = monthly, 26 = fortnightly
  startYear: number; // year the mortgage started (for tracking in forecast)
  extraMonthlyPayment: number; // additional payment to reduce principal faster
}

export interface NovatedLease {
  preTaxAnnual: number;  // annual pre-tax deduction (reduces taxable income)
  postTaxAnnual: number; // annual post-tax deduction (reduces take-home pay)
  leaseTermYears: number;
  startYear: number;
}

export interface Child {
  id: string;
  name: string;
  currentYearLevel: number; // -2 = ELP3, -1 = ELP4, 0 = Prep, 1 = Year 1, ..., 12 = Year 12
  currentYear: number; // The year they are currently in this year level (e.g., 2026)
}

export interface EducationFees {
  elp3: number;
  elp4: number;
  prepToYear4: number;
  year5And6: number;
  year7To9: number;
  year10To12: number;
  baseYear: number; // The year these fees are based on (2026)
}

export interface Assets {
  andySuperBalance: number;
  nadieleSuperBalance: number;
  superGrowthRate: number; // percentage
  portfolioValue: number;
  portfolioGrowthRate: number; // percentage
  portfolioItems: PortfolioItem[];
  cars: Car[];
  otherAssets: Asset[];
  mortgage: Mortgage;
  retirementSpendingRatio: number; // percentage from super (remainder from portfolio)
}

interface FinanceContextType {
  // Configuration
  financialYear: string;
  setFinancialYear: (year: string) => void;
  includeMedicare: boolean;
  setIncludeMedicare: (include: boolean) => void;

  // Income
  andyIncome: IncomeInput;
  setAndyIncome: (income: IncomeInput) => void;
  nadieleIncome: IncomeInput;
  setNadieleIncome: (income: IncomeInput) => void;

  // Voluntary Super
  andyVoluntarySuper: number;
  setAndyVoluntarySuper: (rate: number) => void;
  nadieleVoluntarySuper: number;
  setNadieleVoluntarySuper: (rate: number) => void;

  // Portfolio Contributions
  andyPortfolioContribution: number;
  setAndyPortfolioContribution: (amount: number) => void;
  nadielePortfolioContribution: number;
  setNadielePortfolioContribution: (amount: number) => void;

  // Expenses
  expenses: ExpenseItem[];
  setExpenses: (expenses: ExpenseItem[]) => void;

  // Forecast Settings
  andyCurrentAge: number;
  setAndyCurrentAge: (age: number) => void;
  nadieleCurrentAge: number;
  setNadieleCurrentAge: (age: number) => void;
  andyRetirementAge: number;
  setAndyRetirementAge: (age: number) => void;
  nadieleRetirementAge: number;
  setNadieleRetirementAge: (age: number) => void;
  annualIncomeIncrease: number;
  setAnnualIncomeIncrease: (rate: number) => void;
  annualInflationRate: number;
  setAnnualInflationRate: (rate: number) => void;
  splurgeAutoInvestThreshold: number;
  setSplurgeAutoInvestThreshold: (threshold: number) => void;

  // Assets
  assets: Assets;
  setAssets: (assets: Assets) => void;

  // Novated Leases
  andyNovatedLease: NovatedLease;
  setAndyNovatedLease: (lease: NovatedLease) => void;
  nadieleNovatedLease: NovatedLease;
  setNadieleNovatedLease: (lease: NovatedLease) => void;

  // Children & Education
  children: Child[];
  setChildren: (children: Child[]) => void;
  educationFees: EducationFees;
  setEducationFees: (fees: EducationFees) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const defaultAndyIncome: IncomeInput = {
  baseSalary: 90000,
  variableIncome: 10000,
  allowances: 5000,
  preTotalAdjustments: 0,
};

const defaultNadieleIncome: IncomeInput = {
  baseSalary: 75000,
  variableIncome: 5000,
  allowances: 0,
  preTotalAdjustments: 0,
};

const defaultExpenses: ExpenseItem[] = [
  {
    id: '2',
    name: 'Groceries',
    category: 'Food',
    amount: 300,
    frequency: 'weekly',
    andyProportion: 50,
    nadieleProportion: 50,
  },
  {
    id: '3',
    name: 'Utilities',
    category: 'Bills',
    amount: 400,
    frequency: 'monthly',
    andyProportion: 55,
    nadieleProportion: 45,
  },
];

const defaultAssets: Assets = {
  andySuperBalance: 150000,
  nadieleSuperBalance: 120000,
  superGrowthRate: 7,
  portfolioValue: 50000,
  portfolioGrowthRate: 7,
  portfolioItems: [
    { id: '1', name: 'General Portfolio', currentValue: 50000, isManual: true },
  ],
  cars: [
    {
      id: '1',
      name: 'Car 1',
      currentValue: 25000,
      annualDepreciation: 15,
    },
  ],
  otherAssets: [],
  mortgage: {
    loanAmount: 500000,
    currentBalance: 450000,
    interestRate: 6.5,
    loanTermYears: 30,
    paymentsPerYear: 12,
    startYear: 2020,
    extraMonthlyPayment: 0,
  },
  retirementSpendingRatio: 70, // 70% from super, 30% from portfolio
};

const defaultNovatedLease: NovatedLease = {
  preTaxAnnual: 0,
  postTaxAnnual: 0,
  leaseTermYears: 0,
  startYear: new Date().getFullYear(),
};

const defaultChildren: Child[] = [
  {
    id: '1',
    name: 'Tristan',
    currentYearLevel: 1, // Year 1
    currentYear: 2026,
  },
];

const defaultEducationFees: EducationFees = {
  elp3: 6990,
  elp4: 10500,
  prepToYear4: 11500,
  year5And6: 15990,
  year7To9: 21990,
  year10To12: 27990,
  baseYear: 2026,
};

export function FinanceProvider({ children: reactChildren }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Configuration
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [includeMedicare, setIncludeMedicare] = useState(true);

  // Income
  const [andyIncome, setAndyIncome] = useState<IncomeInput>(defaultAndyIncome);
  const [nadieleIncome, setNadieleIncome] = useState<IncomeInput>(defaultNadieleIncome);

  // Voluntary Super
  const [andyVoluntarySuper, setAndyVoluntarySuper] = useState(2);
  const [nadieleVoluntarySuper, setNadieleVoluntarySuper] = useState(2);

  // Portfolio Contributions
  const [andyPortfolioContribution, setAndyPortfolioContribution] = useState(0);
  const [nadielePortfolioContribution, setNadielePortfolioContribution] = useState(0);

  // Expenses
  const [expenses, setExpenses] = useState<ExpenseItem[]>(defaultExpenses);

  // Forecast Settings
  const [andyCurrentAge, setAndyCurrentAge] = useState(35);
  const [nadieleCurrentAge, setNadieleCurrentAge] = useState(33);
  const [andyRetirementAge, setAndyRetirementAge] = useState(67);
  const [nadieleRetirementAge, setNadieleRetirementAge] = useState(67);
  const [annualIncomeIncrease, setAnnualIncomeIncrease] = useState(3);
  const [annualInflationRate, setAnnualInflationRate] = useState(2.5);
  const [splurgeAutoInvestThreshold, setSplurgeAutoInvestThreshold] = useState(0);

  // Assets
  const [assets, setAssets] = useState<Assets>(defaultAssets);

  // Novated Leases
  const [andyNovatedLease, setAndyNovatedLease] = useState<NovatedLease>(defaultNovatedLease);
  const [nadieleNovatedLease, setNadieleNovatedLease] = useState<NovatedLease>(defaultNovatedLease);

  // Children & Education
  const [children, setChildren] = useState<Child[]>(defaultChildren);
  const [educationFees, setEducationFees] = useState<EducationFees>(defaultEducationFees);

  // Helper to apply saved data to state
  const applyData = useCallback((data: Record<string, unknown>) => {
    if (data.financialYear) setFinancialYear(data.financialYear as string);
    if (data.includeMedicare !== undefined) setIncludeMedicare(data.includeMedicare as boolean);
    if (data.andyIncome) setAndyIncome(data.andyIncome as IncomeInput);
    if (data.nadieleIncome) setNadieleIncome(data.nadieleIncome as IncomeInput);
    if (data.andyVoluntarySuper !== undefined) setAndyVoluntarySuper(data.andyVoluntarySuper as number);
    if (data.nadieleVoluntarySuper !== undefined) setNadieleVoluntarySuper(data.nadieleVoluntarySuper as number);
    if (data.andyPortfolioContribution !== undefined) setAndyPortfolioContribution(data.andyPortfolioContribution as number);
    if (data.nadielePortfolioContribution !== undefined) setNadielePortfolioContribution(data.nadielePortfolioContribution as number);
    if (data.expenses) setExpenses(data.expenses as ExpenseItem[]);
    if (data.andyCurrentAge !== undefined) setAndyCurrentAge(data.andyCurrentAge as number);
    if (data.nadieleCurrentAge !== undefined) setNadieleCurrentAge(data.nadieleCurrentAge as number);
    if (data.andyRetirementAge !== undefined) setAndyRetirementAge(data.andyRetirementAge as number);
    if (data.nadieleRetirementAge !== undefined) setNadieleRetirementAge(data.nadieleRetirementAge as number);
    if (data.annualIncomeIncrease !== undefined) setAnnualIncomeIncrease(data.annualIncomeIncrease as number);
    if (data.annualInflationRate !== undefined) setAnnualInflationRate(data.annualInflationRate as number);
    if (data.splurgeAutoInvestThreshold !== undefined) setSplurgeAutoInvestThreshold(data.splurgeAutoInvestThreshold as number);
    if (data.assets) {
      const a = data.assets as Record<string, unknown>;
      setAssets({
        ...defaultAssets,
        ...(a as unknown as Assets),
        otherAssets: (a.otherAssets as Asset[]) || [],
        portfolioItems: ((a.portfolioItems as PortfolioItem[]) || [{ id: '1', name: 'General Portfolio', currentValue: (a.portfolioValue as number) || 50000, isManual: true }]).map(item => ({ ...item, isManual: item.isManual ?? true })),
        mortgage: {
          ...((a.mortgage as Mortgage) || defaultAssets.mortgage),
          currentBalance: (a.mortgage as Mortgage)?.currentBalance ?? (a.mortgage as Mortgage)?.loanAmount ?? defaultAssets.mortgage.currentBalance,
        },
        retirementSpendingRatio: (a.retirementSpendingRatio as number) ?? defaultAssets.retirementSpendingRatio,
      });
    }
    if (data.andyNovatedLease) setAndyNovatedLease({ ...defaultNovatedLease, ...(data.andyNovatedLease as NovatedLease) });
    if (data.nadieleNovatedLease) setNadieleNovatedLease({ ...defaultNovatedLease, ...(data.nadieleNovatedLease as NovatedLease) });
    if (data.children) setChildren(data.children as Child[]);
    if (data.educationFees) setEducationFees(data.educationFees as EducationFees);
  }, []);

  // Cloud sync: debounced save ref
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from cloud first, then localStorage on mount
  useEffect(() => {
    async function loadData() {
      let data: Record<string, unknown> | null = null;

      // Try cloud first
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const cloudData = await res.json();
          if (cloudData && typeof cloudData === 'object' && cloudData.financialYear) {
            data = typeof cloudData === 'string' ? JSON.parse(cloudData) : cloudData;
            // Also update localStorage with cloud data
            if (data) localStorage.setItem('financeAppData', JSON.stringify(data));
          }
        }
      } catch {
        // Cloud not available, fall back to localStorage
      }

      // Fall back to localStorage
      if (!data) {
        const savedData = localStorage.getItem('financeAppData');
        if (savedData) {
          try {
            data = JSON.parse(savedData);
          } catch {
            // corrupt localStorage
          }
        }
      }

      if (data) {
        applyData(data);
      }

      setMounted(true);
    }

    loadData();
  }, [applyData]);

  // Save to localStorage and cloud whenever data changes
  useEffect(() => {
    if (!mounted) return; // Don't save on initial mount

    const dataToSave = {
      financialYear,
      includeMedicare,
      andyIncome,
      nadieleIncome,
      andyVoluntarySuper,
      nadieleVoluntarySuper,
      andyPortfolioContribution,
      nadielePortfolioContribution,
      expenses,
      andyCurrentAge,
      nadieleCurrentAge,
      andyRetirementAge,
      nadieleRetirementAge,
      annualIncomeIncrease,
      annualInflationRate,
      splurgeAutoInvestThreshold,
      assets,
      andyNovatedLease,
      nadieleNovatedLease,
      children,
      educationFees,
      lastModified: Date.now(),
    };

    // Save to localStorage immediately
    localStorage.setItem('financeAppData', JSON.stringify(dataToSave));

    // Save to cloud with 2s debounce
    if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = setTimeout(() => {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      }).catch(() => {
        // Cloud save failed silently - localStorage is still the source of truth
      });
    }, 2000);
  }, [
    mounted,
    financialYear,
    includeMedicare,
    andyIncome,
    nadieleIncome,
    andyVoluntarySuper,
    nadieleVoluntarySuper,
    andyPortfolioContribution,
    nadielePortfolioContribution,
    expenses,
    andyCurrentAge,
    nadieleCurrentAge,
    andyRetirementAge,
    nadieleRetirementAge,
    annualIncomeIncrease,
    annualInflationRate,
    splurgeAutoInvestThreshold,
    assets,
    andyNovatedLease,
    nadieleNovatedLease,
    children,
    educationFees,
  ]);

  // Auto-sync portfolio value from portfolio items
  useEffect(() => {
    if (!mounted) return;
    const items = assets.portfolioItems || [];
    const total = items.reduce((sum, item) => sum + (Number(item.currentValue) || 0), 0);
    if (total !== assets.portfolioValue) {
      setAssets({ ...assets, portfolioValue: total });
    }
  }, [mounted, assets.portfolioItems]);

  // Auto-sync mortgage payments to expenses
  useEffect(() => {
    if (!mounted || !assets.mortgage.loanAmount) return;

    const monthlyPayment = calculateMortgagePayment(
      assets.mortgage.loanAmount,
      assets.mortgage.interestRate,
      assets.mortgage.loanTermYears,
      assets.mortgage.paymentsPerYear
    );

    let updated = [...expenses];

    // 1. Handle regular mortgage payment
    const mortgageExpenseIndex = updated.findIndex(
      (exp) => exp.id === 'mortgage-auto' || (exp.category === 'Housing' && exp.name === 'Mortgage Payment')
    );

    if (mortgageExpenseIndex >= 0) {
      updated[mortgageExpenseIndex] = {
        ...updated[mortgageExpenseIndex],
        amount: monthlyPayment,
        frequency: 'monthly',
      };
    } else {
      updated.push({
        id: 'mortgage-auto',
        name: 'Mortgage Payment',
        category: 'Housing',
        amount: monthlyPayment,
        frequency: 'monthly',
        andyProportion: 50,
        nadieleProportion: 50,
      });
    }

    // 2. Handle extra mortgage payment
    const extraPaymentIndex = updated.findIndex(
      (exp) => exp.id === 'mortgage-extra-auto'
    );

    if (assets.mortgage.extraMonthlyPayment > 0) {
      if (extraPaymentIndex >= 0) {
        updated[extraPaymentIndex] = {
          ...updated[extraPaymentIndex],
          amount: assets.mortgage.extraMonthlyPayment,
          frequency: 'monthly',
        };
      } else {
        updated.push({
          id: 'mortgage-extra-auto',
          name: 'Extra Mortgage Payment',
          category: 'Housing',
          amount: assets.mortgage.extraMonthlyPayment,
          frequency: 'monthly',
          andyProportion: 50,
          nadieleProportion: 50,
        });
      }
    } else if (extraPaymentIndex >= 0) {
      // Remove extra payment expense if amount is 0
      updated.splice(extraPaymentIndex, 1);
    }

    // 3. Clean up any old/duplicate mortgage expenses
    updated = updated.filter(
      (exp) =>
        !(
          exp.id !== 'mortgage-auto' &&
          exp.id !== 'mortgage-extra-auto' &&
          exp.category === 'Housing' &&
          exp.name.toLowerCase().includes('mortgage')
        )
    );

    setExpenses(updated);
  }, [assets.mortgage, mounted]); // Only depend on mortgage changes

  // Auto-sync education expenses
  useEffect(() => {
    if (!mounted) return;

    const currentYear = parseInt(financialYear.split('-')[0]);
    let updated = [...expenses];

    // Calculate education expenses for each child
    for (const child of children) {
      const yearsPassed = currentYear - child.currentYear;
      const childYearLevel = child.currentYearLevel + yearsPassed;

      // Get base fee for this year level
      let baseFee = 0;
      let yearLevelName = '';

      if (childYearLevel === -2) {
        baseFee = educationFees.elp3;
        yearLevelName = 'ELP3';
      } else if (childYearLevel === -1) {
        baseFee = educationFees.elp4;
        yearLevelName = 'ELP4';
      } else if (childYearLevel >= 0 && childYearLevel <= 4) {
        baseFee = educationFees.prepToYear4;
        yearLevelName = childYearLevel === 0 ? 'Prep' : `Year ${childYearLevel}`;
      } else if (childYearLevel >= 5 && childYearLevel <= 6) {
        baseFee = educationFees.year5And6;
        yearLevelName = `Year ${childYearLevel}`;
      } else if (childYearLevel >= 7 && childYearLevel <= 9) {
        baseFee = educationFees.year7To9;
        yearLevelName = `Year ${childYearLevel}`;
      } else if (childYearLevel >= 10 && childYearLevel <= 12) {
        baseFee = educationFees.year10To12;
        yearLevelName = `Year ${childYearLevel}`;
      }

      const educationExpenseId = `education-auto-${child.id}`;
      const educationExpenseIndex = updated.findIndex((exp) => exp.id === educationExpenseId);

      if (baseFee > 0) {
        // Apply inflation from base year to current year
        const yearsFromBaseYear = currentYear - educationFees.baseYear;
        const inflationFactor = Math.pow(1 + annualInflationRate / 100, yearsFromBaseYear);
        const inflatedFee = baseFee * inflationFactor;

        // Annual fee needs to be converted to monthly for consistency
        const monthlyFee = inflatedFee / 12;

        if (educationExpenseIndex >= 0) {
          updated[educationExpenseIndex] = {
            ...updated[educationExpenseIndex],
            name: `${child.name} - ${yearLevelName} Education`,
            amount: monthlyFee,
            frequency: 'monthly',
          };
        } else {
          updated.push({
            id: educationExpenseId,
            name: `${child.name} - ${yearLevelName} Education`,
            category: 'Education',
            amount: monthlyFee,
            frequency: 'monthly',
            andyProportion: 50,
            nadieleProportion: 50,
          });
        }
      } else if (educationExpenseIndex >= 0) {
        // Remove education expense if child is no longer in school
        updated.splice(educationExpenseIndex, 1);
      }
    }

    // Clean up any old education expenses for removed children
    const validEducationIds = children.map((child) => `education-auto-${child.id}`);
    updated = updated.filter(
      (exp) =>
        !exp.id.startsWith('education-auto-') || validEducationIds.includes(exp.id)
    );

    setExpenses(updated);
  }, [children, educationFees, financialYear, annualInflationRate, mounted]); // Don't include expenses to avoid loop!

  const value: FinanceContextType = {
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
    andyPortfolioContribution,
    setAndyPortfolioContribution,
    nadielePortfolioContribution,
    setNadielePortfolioContribution,
    expenses,
    setExpenses,
    andyCurrentAge,
    setAndyCurrentAge,
    nadieleCurrentAge,
    setNadieleCurrentAge,
    andyRetirementAge,
    setAndyRetirementAge,
    nadieleRetirementAge,
    setNadieleRetirementAge,
    annualIncomeIncrease,
    setAnnualIncomeIncrease,
    annualInflationRate,
    setAnnualInflationRate,
    splurgeAutoInvestThreshold,
    setSplurgeAutoInvestThreshold,
    assets,
    setAssets,
    andyNovatedLease,
    setAndyNovatedLease,
    nadieleNovatedLease,
    setNadieleNovatedLease,
    children,
    setChildren,
    educationFees,
    setEducationFees,
  };

  return (
    <FinanceContext.Provider value={value}>
      {reactChildren}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

# Australian Personal Finance App

A rules-driven household finance calculator with ATO-accurate tax and superannuation calculations for Australian households.

## Features

### ✅ Income & Tax Calculator
- **Income Components**: Base salary, variable income (bonus), allowances, pre-total adjustments
- **ATO 2025-26 Tax Rates**: Automatic marginal tax bracket calculations
- **Medicare Levy**: 2% levy (toggleable)
- **Effective Tax Rate**: Real-time calculation
- **Superannuation**:
  - Financial year selector (2024-25 through 2029-30)
  - Automatic SG rate updates (11.5% to 14%)
  - Employer SG vs Voluntary super breakdown
  - SG calculated on: Base + Bonus + Allowances
- **Spendable Income**: After-tax income minus exclusions (e.g., car allowance)
- **Andy | Nadiele | Combined** columns for full household view

### ✅ Expense Management
- Add/edit/delete expenses
- **Frequency Support**: Weekly, fortnightly, monthly, annual
- **Proportional Distribution**: Manual proportion split per person (e.g., Andy 55, Nadiele 45)
- Automatic percentage calculation from proportions
- Normalized to fortnightly internally
- Per-person expense allocation
- Category organization

### ✅ Cash Flow & Disposable Income
- **View Modes**: Toggle between Fortnightly, Monthly, Annual
- **Cash Flow Breakdown**: Spendable income - Expenses = Disposable income
- Negative disposable income supported with clear warnings
- Complete summary across all time periods
- Visual indicators for positive/negative cash flow

## Technology Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Pure calculation engine** (no database required)
- **Reactive calculations** - all values recalculate instantly on input change

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd "/Users/andrewscott/Documents/Personal Finance App"

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Income & Tax Page
1. Select financial year (updates SG rate automatically)
2. Toggle Medicare Levy if needed
3. Enter income for Andy and Nadiele:
   - Base salary
   - Variable income (bonus/commission)
   - Allowances
   - Any pre-total adjustments
4. View automatic calculations:
   - Gross income
   - Tax breakdown (income tax + Medicare)
   - Effective tax rate
   - After-tax income
   - Superannuation (employer SG + voluntary)
   - Spendable income

### 2. Expenses Page
1. Add expenses with:
   - Name and category
   - Amount and frequency
   - Andy's proportion vs Nadiele's proportion
2. View automatic distribution:
   - Percentage split
   - Per-person share
   - Fortnightly/Monthly/Annual totals
3. Edit or delete expenses as needed

### 3. Cash Flow Page
1. Toggle between Fortnightly, Monthly, or Annual view
2. View disposable income calculation:
   - Spendable income (from Income page)
   - Minus expenses (from Expenses page)
   - Equals disposable income
3. See complete summary across all time periods
4. Warnings for negative cash flow

## Calculation Logic

### Income Tax (ATO 2025-26)
```
Taxable income | Tax on this income
$0 – $18,200 | Nil
$18,201 – $45,000 | 19c for each $1 over $18,200
$45,001 – $135,000 | $5,092 plus 32.5c for each $1 over $45,000
$135,001 – $190,000 | $34,317 plus 37c for each $1 over $135,000
$190,001 and above | $54,682 plus 45c for each $1 over $190,000
```

Plus Medicare Levy: 2% of taxable income

### Superannuation Guarantee (ATO Table 21)
```
Financial Year | SG Rate
2024-25 | 11.5%
2025-26 | 12.0%
2026-27 | 12.5%
2027-28 | 13.0%
2028-29 | 13.5%
2029-30 | 14.0%
```

SG calculated on: Base salary + Bonus + Allowances

### Expense Distribution
- Input proportions (e.g., Andy 55, Nadiele 45)
- Automatic percentage calculation
- All frequencies normalized to fortnightly (26 fortnights per year)
- Per-person allocation based on percentages

### Cash Flow
```
Spendable Income (annual)
  = After-tax income
  - Spendable exclusions (e.g., car allowance)

Disposable Income (fortnightly/monthly/annual)
  = Spendable income
  - Allocated expenses
```

## Project Structure

```
/lib
  ├── tax-calculator.ts        # ATO tax calculation engine
  ├── super-calculator.ts      # Superannuation SG rates and calculations
  ├── income-calculator.ts     # Income modeling and net income
  └── expense-calculator.ts    # Expense distribution and cash flow

/app
  ├── page.tsx                 # Income & Tax page
  ├── expenses/page.tsx        # Expense management
  └── cash-flow/page.tsx       # Disposable income calculator
```

## Accuracy & Compliance

- ✅ **Tax rates**: ATO Resident Tax Rates 2025-26 (exact)
- ✅ **Medicare Levy**: 2% (accurate)
- ✅ **Super Guarantee**: ATO Table 21 rates by financial year (accurate)
- ✅ **No tax offsets**: LITO, LAMITO, etc. intentionally excluded per requirements
- ✅ **Deterministic calculations**: All values traceable to source inputs

## Future Enhancements

Potential features:
- Context/state management for shared data across pages
- Data persistence (localStorage or database)
- Export to PDF/Excel
- Historical tracking
- Budget vs actual comparison
- Graphical visualizations
- Multiple household profiles

## License

Private use only.

## Support

For questions or issues, refer to the calculation logic in `/lib` files or ATO documentation.

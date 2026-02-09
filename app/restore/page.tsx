'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RestorePage() {
  const router = useRouter();
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const backupData = {"financialYear":"2025-26","includeMedicare":true,"andyIncome":{"baseSalary":90000,"variableIncome":10000,"allowances":5000,"preTotalAdjustments":0},"nadieleIncome":{"baseSalary":75000,"variableIncome":5000,"allowances":0,"preTotalAdjustments":0},"andyVoluntarySuper":2,"nadieleVoluntarySuper":2,"expenses":[{"id":"2","name":"Groceries","category":"Food","amount":300,"frequency":"weekly","andyProportion":50,"nadieleProportion":50},{"id":"3","name":"Utilities","category":"Bills","amount":400,"frequency":"monthly","andyProportion":55,"nadieleProportion":45},{"id":"mortgage-auto","name":"Mortgage Payment","category":"Housing","amount":3160.3401174648266,"frequency":"monthly","andyProportion":50,"nadieleProportion":50}],"andyCurrentAge":35,"nadieleCurrentAge":33,"andyRetirementAge":67,"nadieleRetirementAge":67,"annualIncomeIncrease":3,"annualInflationRate":2.5,"assets":{"andySuperBalance":150000,"nadieleSuperBalance":120000,"superGrowthRate":7,"portfolioValue":50000,"portfolioGrowthRate":7,"cars":[{"id":"1","name":"Car 1","currentValue":25000,"annualDepreciation":15}],"otherAssets":[],"mortgage":{"loanAmount":500000,"interestRate":6.5,"loanTermYears":30,"paymentsPerYear":12,"startYear":2020,"extraMonthlyPayment":0},"retirementSpendingRatio":70},"children":[{"id":"1","name":"Tristan","currentYearLevel":1,"currentYear":2026}],"educationFees":{"elp3":6990,"elp4":10500,"prepToYear4":11500,"year5And6":15990,"year7To9":21990,"year10To12":27990,"baseYear":2026}};

    localStorage.setItem('financeAppData', JSON.stringify(backupData));
    setRestored(true);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
        {restored ? (
          <>
            <h1 className="text-2xl font-bold text-green-600 mb-4">✓ Data Restored!</h1>
            <p className="mb-4">Your finance data has been successfully restored.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-tan text-white px-6 py-3 rounded hover:bg-charcoal"
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Restoring Data...</h1>
            <p>Please wait...</p>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useFinance } from '@/lib/finance-context';

export default function SettingsPage() {
  const financeData = useFinance();

  const handleRestoreDefaults = () => {
    try {
      const backupData = {
        "financialYear": "2025-26",
        "includeMedicare": true,
        "andyIncome": {"baseSalary": 90000, "variableIncome": 10000, "allowances": 5000, "preTotalAdjustments": 0},
        "nadieleIncome": {"baseSalary": 75000, "variableIncome": 5000, "allowances": 0, "preTotalAdjustments": 0},
        "andyVoluntarySuper": 2,
        "nadieleVoluntarySuper": 2,
        "andyPortfolioContribution": 0,
        "nadielePortfolioContribution": 0,
        "expenses": [
          {"id": "2", "name": "Groceries", "category": "Food", "amount": 300, "frequency": "weekly", "andyProportion": 50, "nadieleProportion": 50},
          {"id": "3", "name": "Utilities", "category": "Bills", "amount": 400, "frequency": "monthly", "andyProportion": 55, "nadieleProportion": 45},
          {"id": "mortgage-auto", "name": "Mortgage Payment", "category": "Housing", "amount": 3160.34, "frequency": "monthly", "andyProportion": 50, "nadieleProportion": 50}
        ],
        "andyCurrentAge": 35,
        "nadieleCurrentAge": 33,
        "andyRetirementAge": 67,
        "nadieleRetirementAge": 67,
        "annualIncomeIncrease": 3,
        "annualInflationRate": 2.5,
        "assets": {
          "andySuperBalance": 150000,
          "nadieleSuperBalance": 120000,
          "superGrowthRate": 7,
          "portfolioValue": 50000,
          "portfolioGrowthRate": 7,
          "portfolioItems": [{"id": "1", "name": "General Portfolio", "currentValue": 50000}],
          "cars": [{"id": "1", "name": "Car 1", "currentValue": 25000, "annualDepreciation": 15}],
          "otherAssets": [],
          "mortgage": {"loanAmount": 500000, "interestRate": 6.5, "loanTermYears": 30, "paymentsPerYear": 12, "startYear": 2020, "extraMonthlyPayment": 0},
          "retirementSpendingRatio": 70
        },
        "children": [{"id": "1", "name": "Tristan", "currentYearLevel": 1, "currentYear": 2026}],
        "educationFees": {"elp3": 6990, "elp4": 10500, "prepToYear4": 11500, "year5And6": 15990, "year7To9": 21990, "year10To12": 27990, "baseYear": 2026}
      };

      console.log('Restoring data...', backupData);
      localStorage.setItem('financeAppData', JSON.stringify(backupData));
      console.log('Data written to localStorage');

      alert('✓ Data restored successfully! Page will reload now.');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error) {
      console.error('Restore error:', error);
      alert('Error restoring data: ' + error);
    }
  };

  const handleExport = () => {
    const dataToExport = {
      financialYear: financeData.financialYear,
      includeMedicare: financeData.includeMedicare,
      andyIncome: financeData.andyIncome,
      nadieleIncome: financeData.nadieleIncome,
      andyVoluntarySuper: financeData.andyVoluntarySuper,
      nadieleVoluntarySuper: financeData.nadieleVoluntarySuper,
      andyPortfolioContribution: financeData.andyPortfolioContribution,
      nadielePortfolioContribution: financeData.nadielePortfolioContribution,
      expenses: financeData.expenses,
      andyCurrentAge: financeData.andyCurrentAge,
      nadieleCurrentAge: financeData.nadieleCurrentAge,
      andyRetirementAge: financeData.andyRetirementAge,
      nadieleRetirementAge: financeData.nadieleRetirementAge,
      annualIncomeIncrease: financeData.annualIncomeIncrease,
      annualInflationRate: financeData.annualInflationRate,
      assets: financeData.assets,
      andyNovatedLease: financeData.andyNovatedLease,
      nadieleNovatedLease: financeData.nadieleNovatedLease,
      children: financeData.children,
      educationFees: financeData.educationFees,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Write directly to localStorage (more reliable than setState)
        localStorage.setItem('financeAppData', JSON.stringify(data));

        alert('Data imported successfully! Reloading page...');

        // Reload to apply changes
        window.location.reload();
      } catch (error) {
        alert('Error importing data. Please check the file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto px-2 md:px-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings & Backup</h1>
        <p className="text-gray-600">Export and import your financial data</p>
      </div>

      {/* Backup Section */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Data Backup</h2>

        {/* Export */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold mb-2 text-green-900">Export Your Data</h3>
          <p className="text-sm text-gray-700 mb-3">
            Download all your financial data as a JSON file. Keep this safe as a backup!
          </p>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium"
          >
            📥 Export Data
          </button>
        </div>

        {/* Import */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold mb-2 text-blue-900">Import Data</h3>
          <p className="text-sm text-gray-700 mb-3">
            Restore your data from a previously exported JSON file.
          </p>
          <label className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium cursor-pointer inline-block">
            📤 Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Restore Defaults */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Restore Data</h2>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded">
          <h3 className="font-semibold mb-2 text-orange-900">Emergency Restore</h3>
          <p className="text-sm text-gray-700 mb-3">
            If your data was lost, click this button to restore the default data including Tristan's education information.
          </p>
          <button
            onClick={handleRestoreDefaults}
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 font-medium"
          >
            🔄 Restore Default Data
          </button>
        </div>
      </div>

      {/* Auto-Save Info */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Auto-Save</h2>
        <div className="space-y-2 text-sm">
          <p>✓ Your data is automatically saved to localStorage</p>
          <p>✓ Data persists between sessions</p>
          <p className="text-yellow-600 font-medium">
            ⚠️ Important: Export your data regularly as a backup!
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded">
        <h3 className="font-semibold mb-2">💡 Recommended:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Export your data after making changes</li>
          <li>• Keep backup files in a safe location (iCloud, Dropbox, etc.)</li>
          <li>• Name your backups with dates for easy identification</li>
        </ul>
      </div>
    </div>
  );
}

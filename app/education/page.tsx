'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { CurrencyInput } from '@/components/formatted-input';
import type { Child } from '@/lib/finance-context';

export default function EducationPage() {
  const { children, setChildren, educationFees, setEducationFees } = useFinance();
  const [editingChild, setEditingChild] = useState<string | null>(null);

  // Function to get year level name
  const getYearLevelName = (level: number): string => {
    if (level === -2) return 'ELP3';
    if (level === -1) return 'ELP4';
    if (level === 0) return 'Prep';
    return `Year ${level}`;
  };

  // Function to calculate when fees will cease (Year 12 completion year)
  const getCompletionYear = (child: Child): number => {
    const yearsPassed = 12 - child.currentYearLevel; // Years until Year 12
    return child.currentYear + yearsPassed;
  };

  // Add new child
  const handleAddChild = () => {
    const newChild: Child = {
      id: Date.now().toString(),
      name: 'New Child',
      currentYearLevel: 0, // Prep
      currentYear: new Date().getFullYear(),
    };
    setChildren([...children, newChild]);
    setEditingChild(newChild.id);
  };

  // Update child
  const handleUpdateChild = (id: string, updates: Partial<Child>) => {
    setChildren(children.map((child) => (child.id === id ? { ...child, ...updates } : child)));
  };

  // Remove child
  const handleRemoveChild = (id: string) => {
    setChildren(children.filter((child) => child.id !== id));
    if (editingChild === id) setEditingChild(null);
  };

  return (
    <div className="container mx-auto px-2 md:px-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Education & School Fees</h1>
        <p className="text-gray-600">
          Manage children's education expenses and track fees with inflation
        </p>
      </div>

      {/* Children Section */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-semibold">Children</h2>
          <button
            onClick={handleAddChild}
            className="bg-tan text-white px-4 py-2 rounded hover:bg-charcoal text-sm"
          >
            + Add Child
          </button>
        </div>

        {children.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No children added yet</p>
        ) : (
          <div className="space-y-4">
            {children.map((child) => (
              <div
                key={child.id}
                className="border border-gray-200 rounded p-4 hover:bg-gray-50"
              >
                {editingChild === child.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) =>
                            handleUpdateChild(child.id, { name: e.target.value })
                          }
                          className="w-full border border-gray-custom rounded px-3 py-2"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Current Year Level
                        </label>
                        <select
                          value={child.currentYearLevel}
                          onChange={(e) =>
                            handleUpdateChild(child.id, {
                              currentYearLevel: Number(e.target.value),
                            })
                          }
                          className="w-full border border-gray-custom rounded px-3 py-2"
                        >
                          <option value={-2}>ELP3</option>
                          <option value={-1}>ELP4</option>
                          <option value={0}>Prep</option>
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Year {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Year</label>
                      <input
                        type="number"
                        value={child.currentYear}
                        onChange={(e) =>
                          handleUpdateChild(child.id, {
                            currentYear: Number(e.target.value),
                          })
                        }
                        className="w-32 border border-gray-custom rounded px-3 py-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingChild(null)}
                        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleRemoveChild(child.id)}
                        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{child.name}</h3>
                      <p className="text-sm text-gray-600">
                        {getYearLevelName(child.currentYearLevel)} in {child.currentYear}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Fees cease after Year 12 (~{getCompletionYear(child)})
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingChild(child.id)}
                      className="bg-gray-200 text-gray-700 px-4 py-1 rounded hover:bg-gray-300 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fee Structure Section */}
      <div className="bg-white border border-gray-custom rounded-lg shadow p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Fee Structure</h2>
        <p className="text-sm text-gray-600 mb-4">
          Base year: {educationFees.baseYear} (fees will be inflated in forecast)
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ELP3 Annual Fee</label>
              <CurrencyInput
                value={educationFees.elp3}
                onChange={(value) => setEducationFees({ ...educationFees, elp3: value })}
                className="border border-gray-custom rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ELP4 Annual Fee</label>
              <CurrencyInput
                value={educationFees.elp4}
                onChange={(value) => setEducationFees({ ...educationFees, elp4: value })}
                className="border border-gray-custom rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Prep to Year 4 Annual Fee
              </label>
              <CurrencyInput
                value={educationFees.prepToYear4}
                onChange={(value) =>
                  setEducationFees({ ...educationFees, prepToYear4: value })
                }
                className="border border-gray-custom rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Years 5 & 6 Annual Fee
              </label>
              <CurrencyInput
                value={educationFees.year5And6}
                onChange={(value) =>
                  setEducationFees({ ...educationFees, year5And6: value })
                }
                className="border border-gray-custom rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Years 7 to 9 Annual Fee
              </label>
              <CurrencyInput
                value={educationFees.year7To9}
                onChange={(value) =>
                  setEducationFees({ ...educationFees, year7To9: value })
                }
                className="border border-gray-custom rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Years 10 to 12 Annual Fee
              </label>
              <CurrencyInput
                value={educationFees.year10To12}
                onChange={(value) =>
                  setEducationFees({ ...educationFees, year10To12: value })
                }
                className="border border-gray-custom rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Base Year</label>
            <input
              type="number"
              value={educationFees.baseYear}
              onChange={(e) =>
                setEducationFees({ ...educationFees, baseYear: Number(e.target.value) })
              }
              className="w-32 border border-gray-custom rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2 text-blue-900">How Education Expenses Work</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Education fees are automatically included in your forecast</li>
          <li>• Fees are inflated each year based on your inflation rate setting</li>
          <li>• Fees cease when each child completes Year 12</li>
          <li>• Education expenses are split 50/50 between Andy and Nadiele</li>
          <li>
            • View the impact on your forecast in the Forecast and Dashboard pages
          </li>
        </ul>
      </div>
    </div>
  );
}

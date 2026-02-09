import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export function CurrencyInput({
  value,
  onChange,
  className = '',
  min,
  max,
  step,
  placeholder,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      // Format with commas and no decimals when not focused
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value || 0);
      setDisplayValue(formatted);
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Show raw number for editing
    setDisplayValue(value?.toString() || '');
    // Auto-select all text
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Parse and update the value
    const parsed = parseFloat(displayValue.replace(/,/g, '')) || 0;
    onChange(parsed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only numbers, commas, and decimals
    if (/^[\d,]*\.?\d*$/.test(input) || input === '') {
      setDisplayValue(input);
      // Parse and send value (remove commas)
      const parsed = parseFloat(input.replace(/,/g, '')) || 0;
      onChange(parsed);
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
        $
      </span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`pl-6 ${className}`}
        placeholder={placeholder}
      />
    </div>
  );
}

interface PercentInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export function PercentInput({
  value,
  onChange,
  className = '',
  min,
  max,
  step = 0.1,
  placeholder,
}: PercentInputProps) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onFocus={handleFocus}
        className={`pr-6 ${className}`}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
        %
      </span>
    </div>
  );
}

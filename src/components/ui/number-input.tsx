import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { InputWarning } from './input-warning';
import { formatNumberInput, parseFormattedNumber, hasCommaDecimalSeparator } from '@/lib/utils/format';

type NumberInputProps = {
  value: number | string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * A component for numeric input with formatting and validation
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  
  // Update the input value when the external value changes
  useEffect(() => {
    setInputValue(formatNumberInput(value));
  }, [value]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Check if the input contains a comma as decimal separator
    const hasComma = hasCommaDecimalSeparator(newValue);
    setShowWarning(hasComma);
    
    // Save the input as-is to maintain cursor position
    setInputValue(newValue);
    
    // Only trigger the parent onChange handler when we have a value
    // This ensures that even invalid inputs update the UI but don't trigger calculations
    onChange(newValue);
  };

  return (
    <div>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
      <InputWarning 
        visible={showWarning} 
        message="Använd punkt (.) istället för komma (,) för decimaltal för korrekt beräkning"
      />
    </div>
  );
}; 
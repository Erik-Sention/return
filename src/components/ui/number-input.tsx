import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { InputWarning } from './input-warning';
import { formatNumberInput } from '@/lib/utils/format';

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
    const result = formatNumberInput(value);
    setInputValue(result.formattedValue);
    setShowWarning(!!result.warning);
  }, [value]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Format and check for warnings
    const result = formatNumberInput(newValue);
    setInputValue(newValue); // Keep original input to maintain cursor position
    setShowWarning(!!result.warning);
    
    // Only trigger the parent onChange handler when we have a value
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
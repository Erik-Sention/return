import { useState, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatNumberInput } from '@/lib/utils/format';
import { Info } from 'lucide-react';

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  allowDecimals?: boolean;
}

const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  function FormattedNumberInput({ value, onChange, allowDecimals = true, ...props }, ref) {
    const [displayValue, setDisplayValue] = useState('');
    const [warning, setWarning] = useState<string | null>(null);

    // När externt värde ändras, uppdatera displayValue
    useEffect(() => {
      if (value !== undefined) {
        const { formattedValue } = formatNumberInput(value, allowDecimals);
        setDisplayValue(formattedValue);
      } else {
        setDisplayValue('');
      }
    }, [value, allowDecimals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Tillåt tom inmatning
      if (inputValue === '') {
        setDisplayValue('');
        setWarning(null);
        onChange(undefined);
        return;
      }
      
      // Formatera och uppdatera värdet
      const { formattedValue, rawValue, warning } = formatNumberInput(inputValue, allowDecimals);
      setDisplayValue(formattedValue);
      setWarning(warning);
      onChange(rawValue);
    };

    return (
      <div>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          {...props}
        />
        {warning && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500 mt-1">
            <Info className="w-3 h-3" />
            <span>{warning}</span>
          </div>
        )}
      </div>
    );
  }
);

export { FormattedNumberInput }; 
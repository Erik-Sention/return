import React from 'react';
import { AlertCircle } from 'lucide-react';

type InputWarningProps = {
  /**
   * The warning message to display
   */
  message: string;
  
  /**
   * Whether to show the warning
   */
  visible: boolean;
};

/**
 * A warning component for input validation errors
 */
export const InputWarning: React.FC<InputWarningProps> = ({ message, visible }) => {
  if (!visible) return null;
  
  return (
    <div className="flex items-center gap-1.5 mt-1 text-amber-600 text-xs animate-in fade-in-50 duration-300">
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  );
}; 
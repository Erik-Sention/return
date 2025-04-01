import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'purple';
}

export function ChartCard({ 
  title, 
  subtitle, 
  className = "", 
  children, 
  icon,
  variant = 'blue' 
}: ChartCardProps) {
  const variantStyles = {
    blue: 'border-blue-200 dark:border-blue-900/30',
    green: 'border-green-200 dark:border-green-900/30',
    orange: 'border-orange-200 dark:border-orange-900/30',
    purple: 'border-purple-200 dark:border-purple-900/30',
  };

  const variantTitleStyles = {
    blue: 'text-blue-700 dark:text-blue-400',
    green: 'text-green-700 dark:text-green-400',
    orange: 'text-orange-700 dark:text-orange-400',
    purple: 'text-purple-700 dark:text-purple-400',
  };

  return (
    <div className={`bg-white dark:bg-gray-950 rounded-lg shadow-sm border ${variantStyles[variant]} overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-gray-500 dark:text-gray-400">{icon}</div>}
            <div>
              <h3 className={`font-medium ${variantTitleStyles[variant]}`}>{title}</h3>
              {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
} 
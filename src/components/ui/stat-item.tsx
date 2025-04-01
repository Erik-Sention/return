import React from 'react';
import { cn } from '@/lib/utils';

interface StatItemProps {
  label: string;
  value: string | number;
  valuePrefix?: string;
  valueSuffix?: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'blue' | 'green' | 'orange' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatItem({
  label,
  value,
  valuePrefix,
  valueSuffix,
  description,
  trend,
  trendValue,
  variant = 'blue',
  size = 'md',
  className,
}: StatItemProps) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  };

  const variantColors = {
    blue: 'text-blue-700 dark:text-blue-400',
    green: 'text-green-700 dark:text-green-400',
    orange: 'text-orange-700 dark:text-orange-400',
    purple: 'text-purple-700 dark:text-purple-400',
  };

  const sizeStyles = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex items-baseline gap-1">
        {valuePrefix && <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{valuePrefix}</span>}
        <p className={cn(
          "font-bold tracking-tight", 
          sizeStyles[size],
          variantColors[variant]
        )}>
          {value}
        </p>
        {valueSuffix && <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{valueSuffix}</span>}
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      
      {trend && trendValue && (
        <div className={cn(
          "flex items-center text-xs font-medium",
          trendColors[trend]
        )}>
          {trend === 'up' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
              <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
            </svg>
          ) : trend === 'down' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
              <path fillRule="evenodd" d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-1.025.275l-4.287-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
              <path d="M8 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
              <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zM3.5 4.25a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v11.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75V4.25z" clipRule="evenodd" />
            </svg>
          )}
          {trendValue}
        </div>
      )}
    </div>
  );
} 
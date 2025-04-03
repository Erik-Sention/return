"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  children: ReactNode;
  isLoading: boolean;
  loadingText?: string;
}

export const PageLoader = ({ children, isLoading, loadingText = "Laddar sida..." }: PageLoaderProps) => {
  const [mounted, setMounted] = useState(false);
  
  // Säkerställ att komponenten är monterad (client-sidan) för att undvika hydreringsproblem
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null; // Visa inget på server-sidan
  }
  
  return (
    <div className="relative min-h-screen">
      {isLoading && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="bg-card rounded-lg p-6 shadow-lg max-w-md w-full flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium text-center">{loadingText}</p>
          </div>
        </div>
      )}
      
      <div className={isLoading ? 'invisible' : 'visible'}>
        {children}
      </div>
    </div>
  );
}; 
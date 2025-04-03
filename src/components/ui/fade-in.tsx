"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  show: boolean;
  duration?: number; // Varaktighet för infadningseffekten i millisekunder
  delay?: number;    // Fördröjning innan infadningen i millisekunder
  className?: string;
}

export const FadeIn = ({ 
  children, 
  show, 
  duration = 300, 
  delay = 0,
  className 
}: FadeInProps) => {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  
  // Använd en variabel för att spåra om DOM är redo för animering
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Hantera infadningslogik
  useEffect(() => {
    if (show && mounted) {
      const timer = setTimeout(() => {
        setRendered(true);
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      setRendered(false);
    }
  }, [show, mounted, delay]);
  
  // Stilar för fade-in-effekten
  const fadeStyle = {
    opacity: rendered ? 1 : 0,
    transition: `opacity ${duration}ms ease-in-out`,
  };
  
  if (!mounted) {
    // Returnera en platshållare med samma struktur men dold
    // för att undvika layout shifts vid hydreringsprocessen
    return <div className={cn("opacity-0", className)}>{children}</div>;
  }
  
  return (
    <div style={fadeStyle} className={className}>
      {children}
    </div>
  );
}; 
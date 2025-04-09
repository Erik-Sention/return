"use client";

import { useContext, useState, useEffect, useRef } from 'react';
import { FadeIn } from '@/components/ui/fade-in';
import { ReportContext } from './ReportContext';
import { ROIReportData } from '@/lib/reports/reportUtils';

interface TabContentProps {
  children: (reportData: ROIReportData) => React.ReactNode;
}

export function TabContent({ children }: TabContentProps) {
  const { reportData, isLoading, error } = useContext(ReportContext);
  const [isVisible, setIsVisible] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  
  // Mät innehållets höjd för att undvika layout-skift
  useEffect(() => {
    if (contentRef.current && reportData) {
      const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
          setHeight(entries[0].contentRect.height);
        }
      });
      
      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [reportData]);
  
  // Trigga fade-in när komponenten monteras
  useEffect(() => {
    // Kort fördröjning för att säkerställa att DOM är uppdaterad
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (error) {
    return (
      <FadeIn show={true} duration={300} delay={0}>
        <div className="text-center p-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </FadeIn>
    );
  }

  if (isLoading || !reportData) {
    return (
      <FadeIn show={true} duration={300} delay={0}>
        <div className="animate-pulse text-center p-6">
          <p>Laddar data...</p>
        </div>
      </FadeIn>
    );
  }

  return (
    <div style={{ height: height ? `${height}px` : 'auto', transition: 'height 0.3s ease-in-out' }}>
      <div ref={contentRef}>
        <FadeIn show={isVisible} duration={300} delay={0}>
          {children(reportData)}
        </FadeIn>
      </div>
    </div>
  );
} 
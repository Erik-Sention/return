"use client";

import { createContext } from 'react';
import { ROIReportData } from '@/lib/reports/reportUtils';

// Skapa context för att hålla rapportdata
export interface ReportContextType {
  reportData: ROIReportData | null;
  isLoading: boolean;
  error: string | null;
}

export const ReportContext = createContext<ReportContextType>({
  reportData: null,
  isLoading: true,
  error: null
}); 
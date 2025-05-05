// Interface för kostnads- och fördelsobjekt
interface CostItem {
  description: string;
  amount: number;
}

interface BenefitItem {
  description: string;
  amount: number;
}

// Interface för FormG insatser och kostnader
export interface FormGCost {
  id: string;
  name: string;
  externalCost: number | null;
  internalCost: number | null;
}

export interface FormGIntervention {
  id: string;
  name: string;
  description: string;
  costs: FormGCost[];
  totalExternalCost: number;
  totalInternalCost: number;
  totalCost: number;
}

export interface FormGData {
  timePeriod: string;
  interventions: FormGIntervention[];
  totalInterventionCost: number;
  totalExternalCost: number;
  totalInternalCost: number;
}

// Interface för samlad data från alla formulär
export interface ROIReportData {
  // Organisation och kontaktinformation
  sharedFields: {
    organizationName?: string;
    contactPerson?: string;
    startDate?: string;
    endDate?: string;
  };
  
  // Period för rapporten
  timePeriod?: string;
  
  // Nuläge - statistik från Form A
  stressPercentage?: number;                // Andel av personalen med hög stressnivå (%)
  productionLossValue?: number;             // Värde av produktionsbortfall (kr/år)
  sickLeaveValue?: number;                  // Kostnad för sjukfrånvaro (kr/år)
  
  // ROI-beräkningsresultat - alternativ 1 (default)
  totalCost: number;
  totalBenefit: number;
  roi: number;
  paybackPeriod?: number;
  totalMentalHealthCost?: number;          // Total kostnad för psykisk ohälsa (alternativ 1)
  reducedStressPercentage?: number;        // Minskad andel med hög stressnivå (alternativ 1)
  
  // ROI-beräkningsresultat - alternativ 2
  totalCostAlt2?: number;                  // Maximal kostnad för break-even
  totalBenefitAlt2?: number;               // Samma som för alt 1
  roiAlt2?: number;                        // Fast ROI = 0%
  totalMentalHealthCostAlt2?: number;      // Total kostnad för psykisk ohälsa (alternativ 2)
  reducedStressPercentageAlt2?: number;    // Antagen minskning av stressnivå (alternativ 2)
  
  // ROI-beräkningsresultat - alternativ 3
  totalCostAlt3?: number;                  // Total kostnad för interventionen (alternativ 3)
  totalBenefitAlt3?: number;               // Beräknat värde för break-even (alternativ 3)
  roiAlt3?: number;                        // Fast ROI = 0% (alternativ 3)
  totalMentalHealthCostAlt3?: number;      // Total kostnad för psykisk ohälsa (alternativ 3)
  minEffectForBreakEvenAlt3?: number;      // Minskad procentandel med hög stress för break-even
  
  // Interventionsbeskrivning
  interventionDescription?: string;        // Från FormA (recommendation) eller FormB (beskrivning)
  interventionsArray?: string[];           // Från FormA.interventions eller FormB.interventions
  interventionCosts?: CostItem[];
  
  // FormG data - detaljerad interventionsdata
  formGData?: FormGData;
  
  // Nuläge, mål och resultat
  currentSituation?: string;               // Från FormA.currentSituation
  goals?: string;                          // Från FormA.goals (ursprungliga fältet)
  goalsDescription?: string;               // Från FormB.goals (används för att visa mål i UI)
  causeAnalysis?: string;                  // Från FormA.causeAnalysis
  recommendation?: string;                 // Från FormA.recommendation eller FormB.recommendation
  
  // Genomförandeplanering
  implementationPlan?: string;              // Kommaseparerad sträng från FormB.implementationPlan
  implementationPlanArray?: string[];       // Array av implementeringssteg från FormB.implementationPlan
  
  // Målgrupp och syfte
  targetGroup?: string;                     // Från FormB.targetGroup
  interventionPurpose?: string;             // Från FormB.purpose
  
  // Fördelar med interventionen
  benefitAreas?: BenefitItem[];
}

// Exportera loadROIReportData från loadROIReportData.ts
export { loadROIReportData } from './loadROIReportData';
export { loadROIReportDataForProject } from './loadROIReportData';

/**
 * Formatera valuta till läsbar format
 * @param value - Värde att formatera
 * @param abbreviated - Om stora tal ska förkortas (t.ex. "1,5 mkr" istället för "1 500 000 kr")
 * @returns Formaterad valutasträng
 */
export function formatCurrency(value: number | undefined, abbreviated: boolean = false): string {
  if (value === undefined || value === null) {
    return '-';
  }
  
  const absValue = Math.abs(value);
  
  if (abbreviated && absValue >= 1000000) {
    return `${(value / 1000000).toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mkr`;
  }
  
  return `${value.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kr`;
}

/**
 * Formatera procent till en läsbar format
 * @param value - Procentvärde
 * @returns Formaterad procentsträng
 */
export function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) {
    return '-';
  }
  
  return `${value.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/**
 * Formatera månader till en läsbar format
 * @param months - Antal månader
 * @returns Formaterad sträng med månader
 */
export function formatMonths(months: number | undefined): string {
  if (months === undefined || months === null) {
    return '-';
  }
  
  // Avrunda till en decimal
  const roundedMonths = Math.round(months * 10) / 10;
  
  // Formatera med en decimal
  return `${roundedMonths.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mån`;
} 
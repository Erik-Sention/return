import { database } from '@/lib/firebase/config';
import { ref, get, child } from 'firebase/database';
import { loadSharedFields, SharedFields } from '@/lib/firebase/sharedFields';

// Interface för kostnads- och fördelsobjekt
interface CostItem {
  description: string;
  amount: number;
}

interface BenefitItem {
  description: string;
  amount: number;
}

// Interface för samlad data från alla formulär
export interface ROIReportData {
  // Organisation och kontaktinformation
  sharedFields: SharedFields;
  
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
  interventionDescription?: string;
  interventionCosts?: CostItem[];
  
  // Nuläge, mål och resultat
  currentSituation?: string;
  goalsDescription?: string;
  
  // Nya fält från formulär A och B
  causeAnalysis?: string;          // Från Form A: Steg 3 - Orsaksanalys
  recommendation?: string;         // Från Form A: Steg 7 - Rekommendation för beslut
  interventionPurpose?: string;    // Från Form B: Syfte med insatserna
  targetGroup?: string;            // Från Form B: Målgrupp
  implementationPlan?: string;     // Från Form B: Genomförandeplan
  
  // Kostnader och fördelar
  benefitAreas?: BenefitItem[];
}

// Interface för formulärdata
interface FormAData {
  organizationName?: string;
  contactPerson?: string;
  organizationId?: string;
  timePeriod?: string;
  currentSituation?: string;
  stressPercentage?: number;        // Andel av personalen med hög stressnivå
  productionLossValue?: number;     // Värde av produktionsbortfall
  sickLeaveValue?: number;          // Kostnad för sjukfrånvaro
  goals?: string;
  causeAnalysis?: string;          // Nytt fält
  recommendation?: string;         // Nytt fält
  interventions?: string[];
}

interface FormBData {
  interventionName?: string;
  interventionDescription?: string;
  purpose?: string;               // Ändrat från interventionPurpose
  targetGroup?: string;
  implementationPlan?: string[];  // Ändrat till array för att matcha FormB.tsx
  costs?: Array<{description: string; amount: number}>;
}

interface FormEData {
  benefits?: Array<{description: string; amount: number}>;
}

interface FormJData {
  organizationName?: string;
  contactPerson?: string;
  timePeriod?: string;
  interventionDescription?: string;
  // Alternativ 1 - ROI baserat på minskad stressnivå
  totalCostMentalHealthAlt1?: number;
  reducedStressPercentageAlt1?: number;
  economicBenefitAlt1?: number;
  totalInterventionCostAlt1?: number;
  economicSurplusAlt1?: number;
  roiPercentageAlt1?: number;
  // Alternativ 2 - Maxkostnad för break-even
  totalCostMentalHealthAlt2?: number;
  reducedStressPercentageAlt2?: number;
  maxInterventionCostAlt2?: number;
  // Alternativ 3 - Min effekt för break-even
  totalInterventionCostAlt3?: number;
  totalCostMentalHealthAlt3?: number;
  minEffectForBreakEvenAlt3?: number;
}

/**
 * Hämta all data för ROI-rapporten från de olika formulären
 */
export async function loadROIReportData(userId: string): Promise<ROIReportData | null> {
  try {
    // Make sure we have a valid database reference
    if (!database) {
      console.error('Firebase database is not initialized');
      return null;
    }
    
    // 1. Hämta de gemensamma fälten först
    const sharedFields = await loadSharedFields(userId);
    
    if (!sharedFields) {
      console.log('Inga gemensamma fält hittades');
      return null;
    }
    
    // 2. Skapa en grundläggande rapportdatastruktur med gemensamma fält
    const reportData: ROIReportData = {
      sharedFields,
      totalCost: 0,
      totalBenefit: 0,
      roi: 0,
      paybackPeriod: 0,
      interventionCosts: [],
      benefitAreas: []
    };
    
    // 3. Hämta data från de olika formulären
    const dbRef = ref(database);
    
    // Hämta data från Form A (grundläggande info, nuläge, mål)
    const formAPath = `users/${userId}/forms/A`;
    const formASnapshot = await get(child(dbRef, formAPath));
    
    if (formASnapshot.exists()) {
      const formAData: FormAData = formASnapshot.val();
      reportData.currentSituation = formAData.currentSituation || '';
      reportData.goalsDescription = formAData.goals || '';
      reportData.causeAnalysis = formAData.causeAnalysis || '';     // Nytt fält
      reportData.recommendation = formAData.recommendation || '';   // Nytt fält
      
      // Om vi har en array med interventioner, skapa en sammanhängande text
      if (formAData.interventions && Array.isArray(formAData.interventions) && formAData.interventions.length > 0) {
        const filteredInterventions = formAData.interventions.filter(i => !!i);
        if (filteredInterventions.length > 0) {
          reportData.interventionDescription = filteredInterventions.join(', ');
        }
      }
    }
    
    // Hämta data från Form B (kostnad för interventioner och interventionsbeskrivning)
    const formBPath = `users/${userId}/forms/B`;
    const formBSnapshot = await get(child(dbRef, formBPath));
    
    if (formBSnapshot.exists()) {
      const formBData: FormBData = formBSnapshot.val();
      
      // Om vi inte redan har en interventionsbeskrivning från Form A, eller den är tom
      if ((!reportData.interventionDescription || reportData.interventionDescription.trim() === '') && 
          formBData.interventionDescription) {
        reportData.interventionDescription = formBData.interventionDescription;
      }
      
      // Lägg till de nya fälten
      reportData.interventionPurpose = formBData.purpose || '';
      reportData.targetGroup = formBData.targetGroup || '';
      reportData.implementationPlan = formBData.implementationPlan ? formBData.implementationPlan.join(', ') : '';
      
      // Lägg till kostnadsdata
      if (formBData.costs && Array.isArray(formBData.costs)) {
        const validCosts = formBData.costs
          .filter((cost): cost is {description: string; amount: number} => 
            !!cost && typeof cost.description === 'string' && typeof cost.amount === 'number'
          )
          .map(cost => ({
            description: cost.description,
            amount: cost.amount
          }));
        
        reportData.interventionCosts = validCosts;
      }
    }
    
    // Hämta data från Form C (tidshorisonter)
    const formCPath = `users/${userId}/forms/C`;
    const formCSnapshot = await get(child(dbRef, formCPath));
    
    if (formCSnapshot.exists()) {
      const formCData = formCSnapshot.val();
      reportData.timePeriod = formCData.timePeriod || '';
    }
    
    // Hämta data från Form E (fördelar)
    const formEPath = `users/${userId}/forms/E`;
    const formESnapshot = await get(child(dbRef, formEPath));
    
    if (formESnapshot.exists()) {
      const formEData: FormEData = formESnapshot.val();
      
      // Lägg till fördelar
      if (formEData.benefits && Array.isArray(formEData.benefits)) {
        const validBenefits = formEData.benefits
          .filter((benefit): benefit is {description: string; amount: number} => 
            !!benefit && typeof benefit.description === 'string' && typeof benefit.amount === 'number'
          )
          .map(benefit => ({
            description: benefit.description,
            amount: benefit.amount
          }));
        
        reportData.benefitAreas = validBenefits;
      }
    }
    
    // Hämta data från Form J (ROI-beräkningssammanfattning)
    const formJPath = `users/${userId}/forms/J`;
    const formJSnapshot = await get(child(dbRef, formJPath));
    
    if (formJSnapshot.exists()) {
      const formJData: FormJData = formJSnapshot.val();
      
      // Använd data från alternativ 1 i Form J för ROI-beräkning
      if (formJData.totalInterventionCostAlt1 !== undefined && formJData.totalInterventionCostAlt1 > 0) {
        reportData.totalCost = formJData.totalInterventionCostAlt1;
      }
      
      if (formJData.economicBenefitAlt1 !== undefined && formJData.economicBenefitAlt1 > 0) {
        reportData.totalBenefit = formJData.economicBenefitAlt1;
      }
      
      if (formJData.roiPercentageAlt1 !== undefined) {
        reportData.roi = formJData.roiPercentageAlt1;
      }
      
      // Beräkna payback-period baserat på Form J data
      if (reportData.totalCost && reportData.totalCost > 0 && reportData.totalBenefit && reportData.totalBenefit > 0) {
        // Antal månader för att få tillbaka investeringen
        // Återbetalningstid i månader = Totalkostnad / (Totalfördel / Antal månader)
        const periodMonths = 12; // Standard: 1 år = 12 månader
        reportData.paybackPeriod = (reportData.totalCost / (reportData.totalBenefit / periodMonths));
      }
      
      // Om det finns en interventionsbeskrivning i Form J och vi inte redan har en
      if ((!reportData.interventionDescription || reportData.interventionDescription.trim() === '') && 
          formJData.interventionDescription) {
        reportData.interventionDescription = formJData.interventionDescription;
      }
      
      // Om det finns en tidsperiod i Form J och vi inte redan har en
      if ((!reportData.timePeriod || reportData.timePeriod.trim() === '') && 
          formJData.timePeriod) {
        reportData.timePeriod = formJData.timePeriod;
      }
    } else {
      // Om vi inte har Form J data, beräkna ROI baserat på totalkostnad och totalnytta
      // om vi har dessa värden från Form B och Form E
      let totalCost = 0;
      let totalBenefit = 0;
      
      // Beräkna total kostnad om vi har interventionCosts
      if (reportData.interventionCosts && reportData.interventionCosts.length > 0) {
        totalCost = reportData.interventionCosts.reduce((total, cost) => total + cost.amount, 0);
        reportData.totalCost = totalCost;
      }
      
      // Beräkna total fördel om vi har benefitAreas
      if (reportData.benefitAreas && reportData.benefitAreas.length > 0) {
        totalBenefit = reportData.benefitAreas.reduce((total, benefit) => total + benefit.amount, 0);
        reportData.totalBenefit = totalBenefit;
      }
      
      // Beräkna ROI om vi har både kostnader och fördelar
      if (totalCost > 0 && totalBenefit > 0) {
        // ROI = (Totalfördel - Totalkostnad) / Totalkostnad * 100%
        reportData.roi = ((totalBenefit - totalCost) / totalCost) * 100;
        
        // Återbetalningstid i månader = Totalkostnad / (Totalfördel / Antal månader)
        const periodMonths = 12; // Standard: 1 år = 12 månader
        reportData.paybackPeriod = (totalCost / (totalBenefit / periodMonths));
      }
    }
    
    return reportData;
  } catch (error) {
    console.error('Error loading ROI report data:', error);
    return null;
  }
}

/**
 * Formatera valutor med svenska format
 */
export function formatCurrency(value: number | undefined): string {
  if (value === undefined) return "0 kr";
  
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formatera procent med svenska format
 */
export function formatPercent(value: number | undefined): string {
  if (value === undefined) return "0%";
  
  return new Intl.NumberFormat('sv-SE', {
    style: 'percent',
    maximumFractionDigits: 1
  }).format(value / 100);
}

/**
 * Formatera tid i månader till en läsbar format
 */
export function formatMonths(months: number | undefined): string {
  if (months === undefined) return "0 månader";
  
  const roundedMonths = Math.round(months * 10) / 10;
  
  if (roundedMonths < 1) {
    return `${Math.round(roundedMonths * 30)} dagar`;
  } else if (roundedMonths < 12) {
    return `${roundedMonths} månader`;
  } else {
    const years = Math.floor(roundedMonths / 12);
    const remainingMonths = Math.round(roundedMonths % 12);
    
    if (remainingMonths === 0) {
      return `${years} år`;
    } else {
      return `${years} år och ${remainingMonths} månader`;
    }
  }
} 
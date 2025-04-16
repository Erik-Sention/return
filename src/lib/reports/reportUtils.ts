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
  interventionsArray?: string[];           // Behåll original array med interventioner
  interventionCosts?: CostItem[];
  
  // FormG data - detaljerad interventionsdata
  formGData?: FormGData;
  
  // Nuläge, mål och resultat
  currentSituation?: string;
  goalsDescription?: string;
  causeAnalysis?: string;          // Från Form A: Steg 3 - Orsaksanalys
  recommendation?: string;         // Från Form A: Steg 7 - Rekommendation för beslut
  
  // Genomförandeplanering
  implementationPlan?: string;              // Kommaseparerad sträng
  implementationPlanArray?: string[];       // Array av implementeringssteg
  
  // Målgrupp och syfte
  targetGroup?: string;
  interventionPurpose?: string;
  
  // Fördelar med interventionen
  benefitAreas?: BenefitItem[];
}

// Interface för formulärdata
interface FormAData {
  organizationName?: string;
  contactPerson?: string;
  organizationId?: string;
  timePeriod?: string;
  currentSituation?: string;
  stressLevel?: number;           // Ändrat från stressPercentage för att matcha FormA.tsx
  productionLoss?: number;        // Ändrat från productionLossValue för att matcha FormA.tsx
  sickLeaveCost?: number;         // Ändrat från sickLeaveValue för att matcha FormA.tsx
  goals?: string;
  causeAnalysis?: string;         
  recommendation?: string;        
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
      
      // Hämta statistik om nuläget
      reportData.stressPercentage = formAData.stressLevel || 0;
      reportData.productionLossValue = formAData.productionLoss || 0;
      reportData.sickLeaveValue = formAData.sickLeaveCost || 0;
      
      // Om vi har en array med interventioner, skapa en sammanhängande text
      if (formAData.interventions && Array.isArray(formAData.interventions) && formAData.interventions.length > 0) {
        const filteredInterventions = formAData.interventions.filter(i => !!i);
        if (filteredInterventions.length > 0) {
          reportData.interventionDescription = filteredInterventions.join(', ');
          reportData.interventionsArray = [...filteredInterventions]; // Spara den ursprungliga arrayen
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
      
      // Spara både kommaseparerad sträng och array för genomförandeplan
      if (formBData.implementationPlan && Array.isArray(formBData.implementationPlan)) {
        const filteredPlan = formBData.implementationPlan.filter(step => !!step);
        if (filteredPlan.length > 0) {
          reportData.implementationPlan = filteredPlan.join(', ');
          reportData.implementationPlanArray = [...filteredPlan]; // Spara originalarrayen
        }
      } else {
        reportData.implementationPlan = '';
      }
      
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
    
    // Hämta data från Form G (insatskostnader)
    const formGPath = `users/${userId}/forms/G`;
    const formGSnapshot = await get(child(dbRef, formGPath));
    
    if (formGSnapshot.exists()) {
      const formGData: FormGData = formGSnapshot.val();
      
      // Lägg till FormG-data direkt till rapportdatan
      reportData.formGData = formGData;
      
      // Om vi inte har kostnadsdata i interventionCosts, beräkna från FormG för bakåtkompatibilitet
      if (!reportData.interventionCosts || reportData.interventionCosts.length === 0) {
        // Skapa förenklad kostnadsdata från FormG
        if (formGData.interventions && formGData.interventions.length > 0) {
          const simplifiedCosts: CostItem[] = formGData.interventions.map(intervention => ({
            description: intervention.name,
            amount: intervention.totalCost
          }));
          
          reportData.interventionCosts = simplifiedCosts;
        }
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
      
      // Spara data om psykisk ohälsa och minskad stress från alternativ 1
      if (formJData.totalCostMentalHealthAlt1 !== undefined) {
        reportData.totalMentalHealthCost = formJData.totalCostMentalHealthAlt1;
      }
      
      if (formJData.reducedStressPercentageAlt1 !== undefined) {
        reportData.reducedStressPercentage = formJData.reducedStressPercentageAlt1;
      }
      
      // Lägg till data från alternativ 2 (maximal kostnad för break-even)
      if (formJData.maxInterventionCostAlt2 !== undefined) {
        reportData.totalCostAlt2 = formJData.maxInterventionCostAlt2;
      }
      
      if (formJData.totalCostMentalHealthAlt2 !== undefined) {
        reportData.totalMentalHealthCostAlt2 = formJData.totalCostMentalHealthAlt2;
      }
      
      if (formJData.reducedStressPercentageAlt2 !== undefined) {
        reportData.reducedStressPercentageAlt2 = formJData.reducedStressPercentageAlt2;
      }
      
      // Beräkna totalBenefitAlt2 (ska vara samma som från alt 1)
      if (formJData.totalCostMentalHealthAlt2 !== undefined && formJData.reducedStressPercentageAlt2 !== undefined) {
        reportData.totalBenefitAlt2 = formJData.totalCostMentalHealthAlt2 * (formJData.reducedStressPercentageAlt2 / 100);
      }
      
      // Sätt fast ROI för alternativ 2 (alltid 0% för break-even)
      reportData.roiAlt2 = 0;
      
      // Lägg till data från alternativ 3 (minsta effekt för break-even)
      if (formJData.totalInterventionCostAlt3 !== undefined) {
        reportData.totalCostAlt3 = formJData.totalInterventionCostAlt3;
      }
      
      if (formJData.totalCostMentalHealthAlt3 !== undefined) {
        reportData.totalMentalHealthCostAlt3 = formJData.totalCostMentalHealthAlt3;
      }
      
      if (formJData.minEffectForBreakEvenAlt3 !== undefined) {
        reportData.minEffectForBreakEvenAlt3 = formJData.minEffectForBreakEvenAlt3;
      }
      
      // Beräkna totalBenefitAlt3 (samma värde som totalCostAlt3 för break-even)
      if (reportData.totalCostAlt3) {
        reportData.totalBenefitAlt3 = reportData.totalCostAlt3;
      }
      
      // Sätt fast ROI för alternativ 3 (alltid 0% för break-even)
      reportData.roiAlt3 = 0;
      
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
 * Formatera en siffra som SEK
 */
export function formatCurrency(value: number | undefined, abbreviated: boolean = false): string {
  if (value === undefined) return '0 kr';
  
  if (abbreviated) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} Mkr`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)} tkr`;
    }
  }
  
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
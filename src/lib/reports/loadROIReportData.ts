import { database } from '@/lib/firebase/config';
import { ref, get, child } from 'firebase/database';
import { ROIReportData } from './reportUtils';
import { loadSharedFields } from '@/lib/firebase/sharedFields';

export async function loadROIReportData(userId: string): Promise<ROIReportData | null> {
  try {
    // Make sure we have a valid database reference
    if (!database) {
      console.error('Firebase database is not initialized');
      return null;
    }
    
    // Hämta grundläggande delad information
    const sharedFields = await loadSharedFields(userId);
    
    if (!sharedFields) {
      console.log('Inga gemensamma fält hittades');
      return null;
    }
    
    // Skapa en grundläggande rapportdatastruktur med gemensamma fält
    const reportData: ROIReportData = {
      sharedFields,
      totalCost: 0,
      totalBenefit: 0,
      roi: 0,
      paybackPeriod: 0,
    };
    
    // Hämta data från de olika formulären
    const dbRef = ref(database);
    
    // Hämta data från Form A (grundläggande info, nuläge, mål, orsaksanalys)
    const formAPath = `users/${userId}/forms/A`;
    const formASnapshot = await get(child(dbRef, formAPath));
    
    if (formASnapshot.exists()) {
      const formAData = formASnapshot.val();
      reportData.currentSituation = formAData.currentSituation || '';
      reportData.goalsDescription = formAData.goals || '';
      reportData.causeAnalysis = formAData.causeAnalysis || '';
      reportData.recommendation = formAData.recommendation || '';
      
      // Hämta statistik om nuläget
      reportData.stressPercentage = formAData.stressLevel || 0;
      reportData.productionLossValue = formAData.productionLoss || 0;
      reportData.sickLeaveValue = formAData.sickLeaveCost || 0;
      
      // Om vi har en array med interventioner, skapa en sammanhängande text
      if (formAData.interventions && Array.isArray(formAData.interventions) && formAData.interventions.length > 0) {
        const filteredInterventions = formAData.interventions.filter((i: string) => !!i);
        if (filteredInterventions.length > 0) {
          reportData.interventionDescription = filteredInterventions.join(', ');
        }
      }
    }
    
    // Hämta data från Form B (info om insatser)
    const formBPath = `users/${userId}/forms/B`;
    const formBSnapshot = await get(child(dbRef, formBPath));
    
    if (formBSnapshot.exists()) {
      const formBData = formBSnapshot.val();
      
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
          .filter((cost: { description?: string; amount?: number }) => 
            !!cost && typeof cost.description === 'string' && typeof cost.amount === 'number'
          )
          .map((cost: { description: string; amount: number }) => ({
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
    
    // Hämta data från Form J (ROI-beräkningar för alla tre alternativen)
    const formJPath = `users/${userId}/forms/J`;
    const formJSnapshot = await get(child(dbRef, formJPath));
    
    if (formJSnapshot.exists()) {
      const formJData = formJSnapshot.val();
      
      // Alternativ 1: Beräkning av ROI baserad på förväntad minskning av stressnivå
      if (formJData.totalInterventionCostAlt1 !== undefined) {
        reportData.totalCost = formJData.totalInterventionCostAlt1;
      }
      
      if (formJData.economicBenefitAlt1 !== undefined) {
        reportData.totalBenefit = formJData.economicBenefitAlt1;
      }
      
      if (formJData.roiPercentageAlt1 !== undefined) {
        reportData.roi = formJData.roiPercentageAlt1;
      }
      
      if (formJData.totalCostMentalHealthAlt1 !== undefined) {
        reportData.totalMentalHealthCost = formJData.totalCostMentalHealthAlt1;
      }
      
      if (formJData.reducedStressPercentageAlt1 !== undefined) {
        reportData.reducedStressPercentage = formJData.reducedStressPercentageAlt1;
      }
      
      // Alternativ 2: Maxkostnad för break-even
      if (formJData.totalCostMentalHealthAlt2 !== undefined) {
        reportData.totalMentalHealthCostAlt2 = formJData.totalCostMentalHealthAlt2;
      }
      
      if (formJData.reducedStressPercentageAlt2 !== undefined) {
        reportData.reducedStressPercentageAlt2 = formJData.reducedStressPercentageAlt2;
      }
      
      if (formJData.maxInterventionCostAlt2 !== undefined) {
        reportData.totalCostAlt2 = formJData.maxInterventionCostAlt2;
        reportData.totalBenefitAlt2 = formJData.economicBenefitAlt1; // Samma som alt 1
        reportData.roiAlt2 = 0; // Fast ROI = 0%
      }
      
      // Alternativ 3: Min effekt för break-even
      if (formJData.totalInterventionCostAlt3 !== undefined) {
        reportData.totalCostAlt3 = formJData.totalInterventionCostAlt3;
      }
      
      if (formJData.totalCostMentalHealthAlt3 !== undefined) {
        reportData.totalMentalHealthCostAlt3 = formJData.totalCostMentalHealthAlt3;
      }
      
      if (formJData.minEffectForBreakEvenAlt3 !== undefined) {
        reportData.minEffectForBreakEvenAlt3 = formJData.minEffectForBreakEvenAlt3;
        reportData.totalBenefitAlt3 = formJData.totalInterventionCostAlt3; // Break-even
        reportData.roiAlt3 = 0; // Fast ROI = 0%
      }
      
      // Beräkna payback-period baserat på Form J data
      if (reportData.totalCost > 0 && reportData.totalBenefit > 0) {
        // Antal månader för att få tillbaka investeringen
        // Återbetalningstid i månader = Totalkostnad / (Totalfördel / Antal månader)
        const periodMonths = 12; // Standard: 1 år = 12 månader
        reportData.paybackPeriod = (reportData.totalCost / (reportData.totalBenefit / periodMonths));
      }
    }
    
    return reportData;
  } catch (error) {
    console.error('Error loading ROI report data:', error);
    return null;
  }
} 
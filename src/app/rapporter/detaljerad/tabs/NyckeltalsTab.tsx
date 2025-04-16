import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock 
} from 'lucide-react';
import { formatCurrency, formatPercent, formatMonths, ROIReportData } from '@/lib/reports/reportUtils';
import { formatNumber } from '@/lib/utils/format';
import { database } from '@/lib/firebase/config';
import { ref, get, child } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';

interface NyckeltalsTabProps {
  reportData: ROIReportData;
}

// Utökad data som vi behöver för NyckeltalsTab
interface ExtendedNyckeltalsData {
  directCosts: number;
  indirectCosts: number;
  absenteeismReduction: number;
  currentAbsenteeism: number;
  affectedEmployees: number;
  averageSalary: number;
  productivityIncrease: number;
  absenteeismSavings: number;
  productivityBenefits: number;
  otherBenefits: number;
}

export const NyckeltalsTab: React.FC<NyckeltalsTabProps> = ({ reportData }) => {
  const { currentUser } = useAuth();
  const [extendedData, setExtendedData] = useState<ExtendedNyckeltalsData>({
    directCosts: 0,
    indirectCosts: 0,
    absenteeismReduction: 0,
    currentAbsenteeism: 0,
    affectedEmployees: 0,
    averageSalary: 0,
    productivityIncrease: 0,
    absenteeismSavings: 0,
    productivityBenefits: 0,
    otherBenefits: 0
  });
  
  // Hämta detaljerad data för nyckeltalsrapporten
  useEffect(() => {
    const fetchDetailedFormData = async () => {
      if (!currentUser || !reportData) return;
      
      try {
        const dbRef = ref(database);
        const formData = {
          numberOfEmployees: 0,
          averageMonthlySalary: 0,
          shortSickLeavePercentage: 0,
          longSickLeavePercentage: 0,
          shortSickLeaveCosts: 0,
          longSickLeaveCosts: 0
        };
        
        // Hämta medarbetarantal och sjukfrånvaro från Form D
        const formDSnapshot = await get(child(dbRef, `users/${currentUser.uid}/forms/D`));
        if (formDSnapshot.exists()) {
          const formDData = formDSnapshot.val();
          formData.numberOfEmployees = formDData.numberOfEmployees || 0;
          formData.averageMonthlySalary = formDData.averageMonthlySalary || 0;
          formData.shortSickLeavePercentage = formDData.shortSickLeavePercentage || 0;
          formData.longSickLeavePercentage = formDData.longSickLeavePercentage || 0;
          formData.shortSickLeaveCosts = formDData.totalShortSickLeaveCosts || 0;
          formData.longSickLeaveCosts = formDData.totalLongSickLeaveCosts || 0;
        }
        
        // Beräkna och fördela kostnader
        let directCosts = 0;
        let indirectCosts = 0;
        
        if (reportData.formGData) {
          // Om vi har FormG-data, använd extern/intern fördelning
          directCosts = reportData.formGData.totalExternalCost || 0;
          indirectCosts = reportData.formGData.totalInternalCost || 0;
        } else if (reportData.interventionCosts && reportData.interventionCosts.length > 0) {
          // Försök identifiera direkt/indirekt baserat på beskrivning
          const directItems = reportData.interventionCosts.filter(item => 
            item.description.toLowerCase().includes('direkt') || 
            item.description.toLowerCase().includes('extern'));
            
          const indirectItems = reportData.interventionCosts.filter(item => 
            item.description.toLowerCase().includes('indirekt') || 
            item.description.toLowerCase().includes('intern'));
          
          if (directItems.length > 0) {
            directCosts = directItems.reduce((sum, item) => sum + item.amount, 0);
          }
          
          if (indirectItems.length > 0) {
            indirectCosts = indirectItems.reduce((sum, item) => sum + item.amount, 0);
          }
          
          // Om ingen specifik kategorisering hittades, använd 70/30 fördelning
          if (directCosts === 0 && indirectCosts === 0) {
            directCosts = reportData.totalCost * 0.7;
            indirectCosts = reportData.totalCost * 0.3;
          }
        } else {
          // Fallback: använd 70/30 fördelning
          directCosts = reportData.totalCost * 0.7;
          indirectCosts = reportData.totalCost * 0.3;
        }
        
        // Beräkna sjukfrånvarodata
        // Konvertera från procent till decimaler (eftersom JSX formatPercent konverterar tillbaka)
        const currentAbsenteeism = (formData.shortSickLeavePercentage + formData.longSickLeavePercentage);
        
        // För reduktionen, använd reducedStressPercentage om den finns 
        // (det relaterar till sjukfrånvaroreduktion i ROI-beräkningsmodellen)
        // eller anta 20% av nuvarande nivå som reduktion
        const absenteeismReduction = reportData.reducedStressPercentage 
          ? reportData.reducedStressPercentage / 3 // konvertera från stressminskning till sjukfrånvarominskning
          : currentAbsenteeism * 0.2; // anta 20% minskning av nuvarande nivå
        
        // Kontrollera att vi har antal anställda, annars använd ett standardvärde (1500 enligt uppgift)
        const affectedEmployees = formData.numberOfEmployees || 1500;
        
        // Kontrollera att vi har månadslön, annars använd ett standardvärde
        const averageSalary = formData.averageMonthlySalary || 30000;
        
        // Fördela fördelar på tre kategorier
        let absenteeismSavings = 0;
        let productivityBenefits = 0;
        let otherBenefits = 0;
        
        if (reportData.benefitAreas && reportData.benefitAreas.length > 0) {
          // Om vi har specifika fördelar, försök kategorisera dem
          const sickLeaveItems = reportData.benefitAreas.filter(item => 
            item.description.toLowerCase().includes('sjukfrånvaro') || 
            item.description.toLowerCase().includes('frånvaro'));
            
          const productivityItems = reportData.benefitAreas.filter(item => 
            item.description.toLowerCase().includes('produktivitet'));
          
          if (sickLeaveItems.length > 0) {
            absenteeismSavings = sickLeaveItems.reduce((sum, item) => sum + item.amount, 0);
          }
          
          if (productivityItems.length > 0) {
            productivityBenefits = productivityItems.reduce((sum, item) => sum + item.amount, 0);
          }
          
          // Övriga fördelar är det som återstår
          otherBenefits = reportData.totalBenefit - (absenteeismSavings + productivityBenefits);
          if (otherBenefits < 0) otherBenefits = 0;
        } else {
          // Fallback: fördela baserat på typisk fördelning
          absenteeismSavings = reportData.totalBenefit * 0.4;
          productivityBenefits = reportData.totalBenefit * 0.4;
          otherBenefits = reportData.totalBenefit * 0.2;
        }
        
        // Beräkna produktivitetsökning baserat på produktivitetsfördelar
        // Målet är att få ett procenttal (kommer formateras med formatPercent)
        const productivityIncrease = affectedEmployees > 0 && averageSalary > 0
          ? productivityBenefits / (affectedEmployees * averageSalary * 12) * 100 // konvertera till procent
          : 3; // Anta 3% om inga data
        
        // Uppdatera state med alla beräknade värden
        setExtendedData({
          directCosts,
          indirectCosts,
          absenteeismReduction,
          currentAbsenteeism,
          affectedEmployees,
          averageSalary,
          productivityIncrease,
          absenteeismSavings,
          productivityBenefits,
          otherBenefits
        });
        
      } catch (error) {
        console.error("Fel vid hämtning av detaljerad formulärdata:", error);
      }
    };
    
    fetchDetailedFormData();
  }, [currentUser, reportData]);
  
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Nyckeltal</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                ROI (Avkastning på investering)
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatPercent(reportData.roi || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Avkastning på investering
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between">
                <span>Definition:</span>
                <span>Avkastning / Kostnad</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Beräkning:</span>
                <span>{formatCurrency(reportData.totalBenefit || 0)} / {formatCurrency(reportData.totalCost || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Återbetalningstid
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatMonths(reportData.paybackPeriod || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Månader till positiv avkastning
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between">
                <span>Definition:</span>
                <span>Månader till positivt resultat</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Beräkning:</span>
                <span>Kostnad / (Årlig avkastning / 12)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                Totala kostnader
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatCurrency(reportData.totalCost || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Uppskattad kostnad för insats
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between mb-1">
                <span>Externa kostnader:</span>
                <span>{formatCurrency(extendedData.directCosts || 0)}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Interna kostnader:</span>
                <span>{formatCurrency(extendedData.indirectCosts || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-green-500" />
                Stressnivå
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatPercent(reportData.reducedStressPercentage || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Förväntad minskning av hög stress
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between">
                <span>Nuvarande andel med hög stress:</span>
                <span>{formatPercent(reportData.stressPercentage || 0)}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Målnivå:</span>
                <span>{formatPercent(
                  (reportData.stressPercentage || 0) - 
                  ((reportData.stressPercentage || 0) * (reportData.reducedStressPercentage || 0) / 100)
                )}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-amber-500" />
                Max kostnad för break-even
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatCurrency(reportData.totalCostAlt2 || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Maximal kostnad för lönsamhet
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between">
                <span>Baserat på stressminskning:</span>
                <span>{formatPercent(reportData.reducedStressPercentageAlt2 || 0)}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Total kostnad för psykisk ohälsa:</span>
                <span>{formatCurrency(reportData.totalMentalHealthCostAlt2 || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
                Min. effekt för break-even
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatPercent(reportData.minEffectForBreakEvenAlt3 || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Minsta stressminskning för lönsamhet
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between">
                <span>Total kostnad för insatsen:</span>
                <span>{formatCurrency(reportData.totalCostAlt3 || 0)}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Total kostnad för psykisk ohälsa:</span>
                <span>{formatCurrency(reportData.totalMentalHealthCostAlt3 || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                Totalt antal medarbetare
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatNumber(extendedData.affectedEmployees || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between">
                <span>Kostnad per medarbetare:</span>
                <span>
                  {formatCurrency(extendedData.affectedEmployees && extendedData.affectedEmployees > 0
                    ? (reportData.totalCost || 0) / extendedData.affectedEmployees 
                    : 0
                  )}
                </span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Avkastning per medarbetare:</span>
                <span>
                  {formatCurrency(extendedData.affectedEmployees && extendedData.affectedEmployees > 0
                    ? (reportData.totalBenefit || 0) / extendedData.affectedEmployees 
                    : 0
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-red-500" />
                Kostnader psykisk ohälsa
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatCurrency(reportData.totalMentalHealthCost || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Total kostnad per år
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between mb-1">
                <span>Kort sjukfrånvaro:</span>
                <span>
                  {formatCurrency(reportData.sickLeaveValue ? reportData.sickLeaveValue * 0.6 : 0)}
                </span>
              </div>
              <div className="text-sm flex justify-between mb-1">
                <span>Lång sjukfrånvaro:</span>
                <span>
                  {formatCurrency(reportData.sickLeaveValue ? reportData.sickLeaveValue * 0.4 : 0)}
                </span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Produktionsbortfall:</span>
                <span>
                  {formatCurrency(reportData.productionLossValue || 0)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                Total besparing över 3 år
              </h3>
            </div>
            <span className="text-4xl font-bold">
              {formatCurrency(((reportData.totalBenefit || 0) * 3) - (reportData.totalCost || 0))}
            </span>
            <div className="text-sm text-muted-foreground mt-1">
              Långsiktigt värde av insatsen
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between mb-1">
                <span>Total intäkt (3 år):</span>
                <span>
                  {formatCurrency((reportData.totalBenefit || 0) * 3)}
                </span>
              </div>
              <div className="text-sm flex justify-between mb-1">
                <span>Total kostnad:</span>
                <span>
                  {formatCurrency(reportData.totalCost || 0)}
                </span>
              </div>
              <div className="text-sm flex justify-between">
                <span>ROI över 3 år:</span>
                <span>
                  {formatPercent(
                    reportData.totalCost && reportData.totalCost > 0
                      ? (((reportData.totalBenefit || 0) * 3) - (reportData.totalCost || 0)) / (reportData.totalCost || 1) * 100
                      : 0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NyckeltalsTab; 
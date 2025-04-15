import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Briefcase, 
  Clock 
} from 'lucide-react';
import { formatCurrency, formatPercent, ROIReportData } from '@/lib/reports/reportUtils';
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
            <span className="text-4xl font-bold">{reportData.paybackPeriod || '-'}</span>
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
                Sjukfrånvarominskning
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatPercent(extendedData.absenteeismReduction || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Förväntad minskning av sjukfrånvaro
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between">
                <span>Nuvarande nivå:</span>
                <span>{formatPercent(extendedData.currentAbsenteeism || 0)}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Målnivå:</span>
                <span>{formatPercent((extendedData.currentAbsenteeism || 0) - (extendedData.absenteeismReduction || 0))}</span>
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
                <Briefcase className="h-5 w-5 mr-2 text-amber-500" />
                Produktivitetsökning
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatPercent(extendedData.productivityIncrease || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Beräknad ökning av produktivitet
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between">
                <span>Ekonomiskt värde:</span>
                <span>
                  {formatCurrency(
                    (extendedData.productivityIncrease || 0) * 
                    (extendedData.averageSalary || 0) * 
                    (extendedData.affectedEmployees || 0) / 100 // Dela med 100 eftersom productivityIncrease är i procent
                  )}
                </span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Beräkningsmodell:</span>
                <span>Lönebesparing + Produktionsvärde</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-5">
            <h3 className="text-lg font-medium mb-4">Prognostiserad kostnad vs. avkastning över tid</h3>
            
            <div className="relative w-full h-64 bg-white border rounded-lg p-5">
              <div className="absolute inset-x-0 bottom-0 top-10 flex items-end">
                {/* Months */}
                {Array.from({ length: 36 }, (_, i) => (
                  <div 
                    key={i} 
                    className="h-full flex-1 flex flex-col justify-end items-center"
                  >
                    {/* Cost Bar */}
                    <div 
                      className="w-2 bg-red-500" 
                      style={{ 
                        height: `${i === 0 
                          ? Math.min(80, (reportData.totalCost || 0) / 1000) 
                          : 0}%` 
                      }}
                    ></div>
                    
                    {/* Benefit Bar */}
                    <div 
                      className="w-2 bg-green-500 mt-0.5" 
                      style={{ 
                        height: `${Math.min(80, ((reportData.totalBenefit || 0) / 36) * (i + 1) / 1000)}%` 
                      }}
                    ></div>
                    
                    {/* Month Label - only show every 6 months */}
                    {(i + 1) % 6 === 0 && (
                      <span className="text-xs text-muted-foreground absolute -bottom-6">
                        {i + 1}
                      </span>
                    )}
                  </div>
                ))}
                
                {/* Break-even line */}
                {reportData.paybackPeriod && (
                  <div 
                    className="absolute border-t border-dashed border-amber-500" 
                    style={{ 
                      bottom: `${Math.min(80, (reportData.totalCost || 0) / 1000)}%`,
                      left: 0,
                      right: 0
                    }}
                  >
                    <span className="absolute text-xs bg-card text-amber-600 -top-3 rounded px-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      Break-even: {reportData.paybackPeriod} månader
                    </span>
                  </div>
                )}
              </div>
              
              {/* X-axis */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border"></div>
              
              {/* Legend */}
              <div className="absolute top-0 right-5 flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 mr-1"></div>
                  <span className="text-xs text-muted-foreground">Kostnad</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 mr-1"></div>
                  <span className="text-xs text-muted-foreground">Avkastning</span>
                </div>
              </div>
              
              {/* X-axis label */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
                Månader
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">3 månader</div>
                <div className={`font-medium ${((reportData.totalBenefit || 0) / 4) > (reportData.totalCost || 0) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(((reportData.totalBenefit || 0) / 4) - (reportData.totalCost || 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">12 månader</div>
                <div className={`font-medium ${(reportData.totalBenefit || 0) > (reportData.totalCost || 0) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency((reportData.totalBenefit || 0) - (reportData.totalCost || 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">36 månader</div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(((reportData.totalBenefit || 0) * 3) - (reportData.totalCost || 0))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white border rounded-lg p-5">
              <h3 className="text-lg font-medium mb-4">Kostnadsfördelning</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Externa kostnader</span>
                    <span className="text-sm font-medium">{formatCurrency(extendedData.directCosts || 0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full" 
                      style={{ width: `${reportData.totalCost ? (extendedData.directCosts || 0) / reportData.totalCost * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Interna kostnader</span>
                    <span className="text-sm font-medium">{formatCurrency(extendedData.indirectCosts || 0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-purple-500 h-2.5 rounded-full" 
                      style={{ width: `${reportData.totalCost ? (extendedData.indirectCosts || 0) / reportData.totalCost * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Totala kostnader</span>
                    <span className="text-sm font-medium">{formatCurrency(reportData.totalCost || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-5">
              <h3 className="text-lg font-medium mb-4">Avkastningsfördelning</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Minskad sjukfrånvaro</span>
                    <span className="text-sm font-medium">{formatCurrency(extendedData.absenteeismSavings || 0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full" 
                      style={{ width: `${reportData.totalBenefit ? (extendedData.absenteeismSavings || 0) / reportData.totalBenefit * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Ökad produktivitet</span>
                    <span className="text-sm font-medium">{formatCurrency(extendedData.productivityBenefits || 0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-amber-500 h-2.5 rounded-full" 
                      style={{ width: `${reportData.totalBenefit ? (extendedData.productivityBenefits || 0) / reportData.totalBenefit * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Övriga fördelar</span>
                    <span className="text-sm font-medium">{formatCurrency(extendedData.otherBenefits || 0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-cyan-500 h-2.5 rounded-full" 
                      style={{ width: `${reportData.totalBenefit ? (extendedData.otherBenefits || 0) / reportData.totalBenefit * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Total avkastning (per år)</span>
                    <span className="text-sm font-medium">{formatCurrency(reportData.totalBenefit || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NyckeltalsTab; 
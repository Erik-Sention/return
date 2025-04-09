import React from 'react';
import { 
  BookOpen, 
  CheckCircle 
} from 'lucide-react';
import { ROIReportData } from '@/lib/reports/reportUtils';

interface OrsakTabProps {
  reportData: ROIReportData;
}

export const OrsakTab: React.FC<OrsakTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Orsaksanalys</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium mb-3">
            Er angivna orsaksanalys
          </p>
          <p className="mb-6">
            {reportData.causeAnalysis || 'Ingen orsaksanalys har angivits i formuläret.'}
          </p>
          
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Forskningsbaserad orsaksanalys</h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Riskfaktorer för psykisk ohälsa enligt forskning</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Hög arbetsbelastning</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Källa: SBU:s systematiska översikt (2019)</div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Låg grad av kontroll över arbetssituationen</span>
                    <span className="text-sm font-medium">70%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Källa: Karasek & Theorell (2017)</div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Bristande socialt stöd</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Källa: Karasek & Theorell (2017)</div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Otydliga förväntningar och roller</span>
                    <span className="text-sm font-medium">60%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Källa: Arbetsmiljöverket (2020)</div>
                </div>
              </div>
            </div>
                  
            <div className="text-xs text-muted-foreground mt-2">
              * Procenttalen representerar hur ofta respektive faktor identifieras som central orsak till stressrelaterad ohälsa enligt forskning.
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-muted/30 rounded-lg p-5">
              <h4 className="font-medium mb-4 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-primary" />
                Krav-kontroll-stödmodellen
              </h4>
              <div className="relative border rounded-lg p-5 bg-card overflow-hidden">
                <div className="grid grid-cols-2 grid-rows-2 gap-2 relative z-10">
                  <div className="border border-amber-200 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3">
                    <h5 className="text-xs font-medium mb-1 text-amber-800 dark:text-amber-200">Aktiva jobb</h5>
                    <p className="text-xs">Höga krav, hög kontroll, låg risk</p>
                  </div>
                  <div className="border border-red-200 bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                    <h5 className="text-xs font-medium mb-1 text-red-800 dark:text-red-200">Spända jobb</h5>
                    <p className="text-xs">Höga krav, låg kontroll, hög risk</p>
                  </div>
                  <div className="border border-green-200 bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                    <h5 className="text-xs font-medium mb-1 text-green-800 dark:text-green-200">Avspända jobb</h5>
                    <p className="text-xs">Låga krav, hög kontroll, låg risk</p>
                  </div>
                  <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                    <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-200">Passiva jobb</h5>
                    <p className="text-xs">Låga krav, låg kontroll, medelhög risk</p>
                  </div>
                </div>
                
                {/* X and Y axis labels */}
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 -rotate-90">
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Kontroll</span>
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                  <span className="text-xs font-medium text-muted-foreground">Krav</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Källa: Karasek & Theorell krav-kontroll-stödmodell (2017)
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-5">
              <h4 className="font-medium mb-4 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-primary" />
                Konsekvenskedja för stressrelaterad ohälsa
              </h4>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute h-full w-0.5 bg-gray-300 dark:bg-gray-700 left-3 top-0"></div>
                
                <div className="space-y-1">
                  <div className="flex items-start mb-3">
                    <div className="min-w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-4 z-10 text-xs">1</div>
                    <div>
                      <h5 className="text-xs font-medium">Organisatoriska brister</h5>
                      <p className="text-xs text-muted-foreground">Otydliga roller, hög arbetsbelastning</p>
                    </div>
                  </div>
                  <div className="flex items-start mb-3">
                    <div className="min-w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-4 z-10 text-xs">2</div>
                    <div>
                      <h5 className="text-xs font-medium">Upplevd stress</h5>
                      <p className="text-xs text-muted-foreground">Känsla av otillräcklighet</p>
                    </div>
                  </div>
                  <div className="flex items-start mb-3">
                    <div className="min-w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-4 z-10 text-xs">3</div>
                    <div>
                      <h5 className="text-xs font-medium">Individuella symptom</h5>
                      <p className="text-xs text-muted-foreground">Sömnsvårigheter, koncentrationssvårigheter</p>
                    </div>
                  </div>
                  <div className="flex items-start mb-3">
                    <div className="min-w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mr-4 z-10 text-xs">4</div>
                    <div>
                      <h5 className="text-xs font-medium">Mätbara konsekvenser</h5>
                      <p className="text-xs text-muted-foreground">Minskad produktivitet, ökad sjukfrånvaro</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="min-w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center mr-4 z-10 text-xs">5</div>
                    <div>
                      <h5 className="text-xs font-medium">Ekonomiska förluster</h5>
                      <p className="text-xs text-muted-foreground">Direkta och indirekta kostnader</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Källa: SBU (2019) &quot;Arbetsrelaterad stress&quot;
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center text-green-800 dark:text-green-300">
              <CheckCircle className="h-4 w-4 mr-2" />
              Förebyggande faktorer enligt forskning
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-green-700 dark:text-green-200">
                  <li>Tydligt ledarskap med fokus på kommunikation</li>
                  <li>Balans mellan krav och resurser i arbetet</li>
                  <li>Möjlighet till inflytande och delaktighet</li>
                </ul>
              </div>
              <div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-green-700 dark:text-green-200">
                  <li>Regelbunden återhämtning och tydliga gränser</li>
                  <li>Tydliga roller och förväntningar</li>
                </ul>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Källa: Prevent (2022), &quot;Hälsofrämjande arbetsmiljö&quot;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrsakTab; 
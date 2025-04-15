import React from 'react';
import { 
  Rocket, 
  Compass,
  LightbulbIcon,
  ListChecks,
  BookOpen
} from 'lucide-react';
import { ROIReportData } from '@/lib/reports/reportUtils';

interface GenomforandePlanTabProps {
  reportData: ROIReportData;
}

export const GenomforandePlanTab: React.FC<GenomforandePlanTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Genomförandeplan</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium mb-3">
            Er genomförandeplan
          </p>
          <p className="mb-6">
            {reportData.implementationPlan || 'Ingen genomförandeplan har angivits i formuläret.'}
          </p>
          
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Implementering med kvalitet
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              {/* Fas 1 */}
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-900/20 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16">
                  <div className="absolute transform rotate-45 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-bold py-1 right-[-20px] top-[16px] w-[70px] text-center text-xs">
                    Fas 1
                  </div>
                </div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                  <Compass className="h-4 w-4 mr-2" />
                  Initial bedömning
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 italic mb-2">(Tänk efter före)</p>
                <ul className="text-xs space-y-2 text-blue-900 dark:text-blue-200 pl-4 list-disc">
                  <li>Identifiera behov och syfte</li>
                  <li>Bedöm om det nya arbetssättet passar organisationen</li>
                  <li>Bedöm organisatorisk beredskap</li>
                  <li>Anpassa metoden vid behov</li>
                  <li>Säkerställ stöd från alla nivåer</li>
                  <li>Utvärdera infrastruktur och motivation</li>
                  <li>Identifiera nyckelpersoner</li>
                  <li>Planera utbildning</li>
                </ul>
              </div>
              
              {/* Fas 2 */}
              <div className="rounded-lg border bg-green-50 dark:bg-green-900/20 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16">
                  <div className="absolute transform rotate-45 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-bold py-1 right-[-20px] top-[16px] w-[70px] text-center text-xs">
                    Fas 2
                  </div>
                </div>
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2 flex items-center">
                  <ListChecks className="h-4 w-4 mr-2" />
                  Struktur för implementering
                </h4>
                <ul className="text-xs space-y-2 text-green-900 dark:text-green-200 pl-4 list-disc">
                  <li>Utse ansvariga personer</li>
                  <li>Tydliggör roller och ansvar</li>
                  <li>Ta fram en konkret implementeringsplan</li>
                  <li>Skapa tydlig tidplan</li>
                </ul>
              </div>
              
              {/* Fas 3 */}
              <div className="rounded-lg border bg-purple-50 dark:bg-purple-900/20 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16">
                  <div className="absolute transform rotate-45 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 font-bold py-1 right-[-20px] top-[16px] w-[70px] text-center text-xs">
                    Fas 3
                  </div>
                </div>
                <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2 flex items-center">
                  <Rocket className="h-4 w-4 mr-2" />
                  Genomförande
                </h4>
                <ul className="text-xs space-y-2 text-purple-900 dark:text-purple-200 pl-4 list-disc">
                  <li>Erbjud stöd till de som genomför</li>
                  <li>Handledning och tekniskt stöd</li>
                  <li>Följ upp och utvärdera</li>
                  <li>Identifiera styrkor och svagheter</li>
                  <li>Ge återkoppling till alla involverade</li>
                </ul>
              </div>
              
              {/* Fas 4 */}
              <div className="rounded-lg border bg-amber-50 dark:bg-amber-900/20 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16">
                  <div className="absolute transform rotate-45 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 font-bold py-1 right-[-20px] top-[16px] w-[70px] text-center text-xs">
                    Fas 4
                  </div>
                </div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center">
                  <LightbulbIcon className="h-4 w-4 mr-2" />
                  Lära och förbättra
                </h4>
                <ul className="text-xs space-y-2 text-amber-900 dark:text-amber-200 pl-4 list-disc">
                  <li>Reflektera över och dokumentera erfarenheter</li>
                  <li>Förbättra framtida implementering</li>
                  <li>Integrera lärdomar i organisationen</li>
                </ul>
              </div>
            </div>
            
            {/* Diagram som visar processen */}
            <div className="relative h-24 my-6">
              <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 top-1/2 transform -translate-y-1/2"></div>
              
              {/* Fas 1 */}
              <div className="absolute left-[12.5%] transform -translate-x-1/2 top-1/2 -translate-y-1/2">
                <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center z-10 relative">
                  <Compass className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                </div>
                <div className="absolute top-12 w-24 text-center text-xs font-medium -left-6">
                  Initial bedömning
                </div>
              </div>
              
              {/* Fas 2 */}
              <div className="absolute left-[37.5%] transform -translate-x-1/2 top-1/2 -translate-y-1/2">
                <div className="w-10 h-10 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center z-10 relative">
                  <ListChecks className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <div className="absolute top-12 w-24 text-center text-xs font-medium -left-6">
                  Struktur
                </div>
              </div>
              
              {/* Fas 3 */}
              <div className="absolute left-[62.5%] transform -translate-x-1/2 top-1/2 -translate-y-1/2">
                <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center z-10 relative">
                  <Rocket className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                </div>
                <div className="absolute top-12 w-24 text-center text-xs font-medium -left-6">
                  Genomförande
                </div>
              </div>
              
              {/* Fas 4 */}
              <div className="absolute left-[87.5%] transform -translate-x-1/2 top-1/2 -translate-y-1/2">
                <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center z-10 relative">
                  <LightbulbIcon className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="absolute top-12 w-24 text-center text-xs font-medium -left-6">
                  Lära och förbättra
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-4 text-center">
              Källa: Folkhälsomyndigheten (2015)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenomforandePlanTab; 
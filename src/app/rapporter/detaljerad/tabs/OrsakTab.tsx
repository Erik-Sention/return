import React from 'react';
import { 
  BookOpen, 
  CheckCircle,
  AlertTriangle,
  Users,
  Target,
  Briefcase,
  MessageSquare,
  Settings,
  LineChart,
  Compass
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Riskfaktorer för psykisk ohälsa enligt forskning</h4>
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <h5 className="font-medium text-amber-800 dark:text-amber-300 flex items-start">
                        <Briefcase className="h-4 w-4 mr-2 text-amber-700 dark:text-amber-300" /> Hög arbetsbelastning
                      </h5>
                      <p className="text-sm mt-2">För mycket att göra, för lite tid, personal eller rätt kompetens vilket skapar obalans mellan krav och resurser.</p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h5 className="font-medium text-blue-800 dark:text-blue-300 flex items-start">
                        <Target className="h-4 w-4 mr-2 text-blue-700 dark:text-blue-300" /> Låg grad av kontroll över arbetssituationen
                      </h5>
                      <p className="text-sm mt-2">Begränsat inflytande över arbetssätt, tempo eller prioriteringar, vilket minskar möjligheten att hantera arbetskrav.</p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h5 className="font-medium text-green-800 dark:text-green-300 flex items-start">
                        <Users className="h-4 w-4 mr-2 text-green-700 dark:text-green-300" /> Bristande socialt stöd
                      </h5>
                      <p className="text-sm mt-2">Otillräcklig hjälp, feedback eller emotionellt stöd från kollegor och ledning när arbetet är krävande.</p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <h5 className="font-medium text-purple-800 dark:text-purple-300 flex items-start">
                        <AlertTriangle className="h-4 w-4 mr-2 text-purple-700 dark:text-purple-300" /> Otydliga förväntningar och roller
                      </h5>
                      <p className="text-sm mt-2">Oklart vad som ska göras, hur det ska göras eller vem som ansvarar för olika arbetsuppgifter.</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Källa: Arbetsmiljöverket (2025)
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Så kan arbetsgivare minska stressen i praktiken</h4>
                  <div className="space-y-4">
                    <div className="bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
                      <h5 className="font-medium text-cyan-800 dark:text-cyan-300 flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 text-cyan-700 dark:text-cyan-300" /> Sätt tydliga gränser och rimliga mål
                      </h5>
                      <p className="text-sm mt-2">Klargör ansvar, befogenheter och prioriteringar. Ge medarbetare inflytande över sitt arbete.</p>
                    </div>
                    
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                      <h5 className="font-medium text-indigo-800 dark:text-indigo-300 flex items-start">
                        <MessageSquare className="h-4 w-4 mr-2 text-indigo-700 dark:text-indigo-300" /> Skapa delaktighet och levande dialog
                      </h5>
                      <p className="text-sm mt-2">Bygg förtroende genom regelbunden återkoppling, involvering och gemensamma beslut.</p>
                    </div>
                    
                    <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
                      <h5 className="font-medium text-rose-800 dark:text-rose-300 flex items-start">
                        <Settings className="h-4 w-4 mr-2 text-rose-700 dark:text-rose-300" /> Integrera systematiskt arbetsmiljöarbete (SAM)
                      </h5>
                      <p className="text-sm mt-2">Kartlägg risker, genomför åtgärder och följ upp arbetsmiljön löpande – som en naturlig del av vardagen.</p>
                    </div>
                    
                    <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
                      <h5 className="font-medium text-teal-800 dark:text-teal-300 flex items-start">
                        <LineChart className="h-4 w-4 mr-2 text-teal-700 dark:text-teal-300" /> Följ upp hälsoläget i organisationen
                      </h5>
                      <p className="text-sm mt-2">Håll koll på sjukfrånvaro och stressrelaterade symtom. Använd data för att upptäcka mönster i tid.</p>
                    </div>
                    
                    <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
                      <h5 className="font-medium text-violet-800 dark:text-violet-300 flex items-start">
                        <Compass className="h-4 w-4 mr-2 text-violet-700 dark:text-violet-300" /> Stötta cheferna aktivt
                      </h5>
                      <p className="text-sm mt-2">Chefer är också utsatta – ge dem rätt verktyg och stöd för både arbetsmiljöarbete och rehabilitering.</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Källa: MedHelp (2024)
                  </div>
                </div>
              </div>
            </div>
            
            
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-muted/30 rounded-lg p-6">
              <h4 className="text-xl font-medium mb-5 flex items-center justify-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                Krav-kontroll-stödmodellen
              </h4>
              <div className="relative border rounded-lg p-6 bg-card overflow-hidden max-w-3xl mx-auto mb-3">
                {/* Remove top fixed labels */}

                <div className="flex">
                  {/* Main grid container */}
                  <div className="flex-grow pr-12">
                    <div className="grid grid-cols-2 grid-rows-2 gap-4 relative z-10 mb-6">
                      <div className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4 shadow-sm">
                        <h5 className="text-base font-medium mb-2 text-amber-800 dark:text-amber-200">Aktiva jobb</h5>
                        <p className="text-sm">Höga krav, hög kontroll, låg risk</p>
                        <p className="text-xs text-muted-foreground mt-2">T.ex. kirurg, advokat, chef</p>
                      </div>
                      <div className="border-2 border-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg p-4 shadow-sm">
                        <h5 className="text-base font-medium mb-2 text-red-800 dark:text-red-200">Spända jobb</h5>
                        <p className="text-sm">Höga krav, låg kontroll, hög risk</p>
                        <p className="text-xs text-muted-foreground mt-2">T.ex. serviceyrken, sjukvård, produktion</p>
                      </div>
                      <div className="border-2 border-green-300 bg-green-50 dark:bg-green-900/30 rounded-lg p-4 shadow-sm">
                        <h5 className="text-base font-medium mb-2 text-green-800 dark:text-green-200">Avspända jobb</h5>
                        <p className="text-sm">Låga krav, hög kontroll, låg risk</p>
                        <p className="text-xs text-muted-foreground mt-2">T.ex. specialist, forskare, hantverkare</p>
                      </div>
                      <div className="border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 shadow-sm">
                        <h5 className="text-base font-medium mb-2 text-blue-800 dark:text-blue-200">Passiva jobb</h5>
                        <p className="text-sm">Låga krav, låg kontroll, medelhög risk</p>
                        <p className="text-xs text-muted-foreground mt-2">T.ex. rutinartade administrativa uppgifter</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side Kontroll label */}
                  <div className="flex items-center">
                    <div className="transform -rotate-90 origin-center">
                      <span className="text-sm font-bold bg-white dark:bg-gray-800 px-2 py-1 rounded shadow whitespace-nowrap">Kontroll →</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Krav label */}
                <div className="flex justify-center items-center mb-2">
                  <span className="text-sm font-bold bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">Krav →</span>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Modellen visar hur kombinationen av arbetskrav och egenkontroll påverkar stress och hälsa. Höga krav kan hanteras bättre när medarbetaren har hög kontroll över sin arbetssituation. Socialt stöd är en tredje dimension som kan fungera som buffert mot stress även när krav-kontroll-balansen är ogynnsam.
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground text-center">
                Källa: Karasek, R. A., & Theorell, T. (1990). Healthy Work: Stress, Productivity, and the Reconstruction of Working Life.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrsakTab; 
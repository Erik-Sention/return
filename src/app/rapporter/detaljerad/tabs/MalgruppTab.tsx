import React from 'react';
import { 
  Users, 
  Crown, 
  HeartPulse, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  Bookmark
} from 'lucide-react';
import { ROIReportData } from '@/lib/reports/reportUtils';

interface MalgruppTabProps {
  reportData: ROIReportData;
}

export const MalgruppTab: React.FC<MalgruppTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Målgrupp</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium mb-3">
            Er beskrivning av målgruppen
          </p>
          <p className="mb-6">
            {reportData.targetGroup || 'Ingen målgrupp har angivits i formuläret.'}
          </p>
          
          <h3 className="text-xl font-medium mb-4">Målgruppsanalys</h3>
          
          <div className="grid gap-6 grid-cols-1 mb-8">
            <div className="bg-card border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Preventionsnivåer för insatser
                </h4>
              </div>
              
              <div className="relative pt-1">
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/20">
                    <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Universell prevention</h5>
                    <div className="flex items-start">
                      <div className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full p-1 mr-2 mt-0.5">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs">Insatser som riktas till hela arbetsplatsens personal, oavsett om individer visar tecken på ohälsa eller inte. Syftar till att främja psykisk hälsa och förebygga problem generellt.</span>
                    </div>
                    <div className="mt-4 text-xs text-blue-700 dark:text-blue-300">
                      <span className="font-medium">🔹 Exempel:</span> Organisationsövergripande utbildningar i stresshantering eller förbättrade arbetsvillkor.
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-900/20">
                    <h5 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">Selektiv prevention</h5>
                    <div className="flex items-start">
                      <div className="bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-full p-1 mr-2 mt-0.5">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs">Insatser som riktas till särskilda riskgrupper – till exempel avdelningar eller yrkesroller med hög arbetsbelastning, låg kontroll eller andra psykosociala riskfaktorer.</span>
                    </div>
                    <div className="mt-4 text-xs text-amber-700 dark:text-amber-300">
                      <span className="font-medium">🔹 Exempel:</span> Riktade insatser för personal i vård, kundtjänst eller skiftarbete.
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/20">
                    <h5 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Indikerad prevention</h5>
                    <div className="flex items-start">
                      <div className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full p-1 mr-2 mt-0.5">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs">Insatser riktade till individer som redan uppvisar tidiga tecken på psykisk ohälsa eller har förhöjda nivåer av stressymtom. Syftar till att bromsa utvecklingen och förhindra sjukskrivning.</span>
                    </div>
                    <div className="mt-4 text-xs text-green-700 dark:text-green-300">
                      <span className="font-medium">🔹 Exempel:</span> Tidiga samtal, stödprogram eller individuell coachning.
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-4">
                  Källa: Folkhälsomyndigheten (2021)
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 mb-8">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Anpassade insatser för olika målgrupper</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 mx-auto mb-4">
                    <Crown className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-medium mb-3 text-center">Chefer och ledare</h4>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2 text-center">📌 Rekommenderade insatser:</p>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Ledarskapsverktyg för att identifiera och hantera stress i teamet.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Förmåga att föra svåra samtal med anställda med psykisk ohälsa.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Stöd för att hantera egen stress.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 mx-auto mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-medium mb-3 text-center">Medarbetare</h4>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2 text-center">📌 Rekommenderade insatser:</p>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Verktyg för stresshantering (t.ex. KBT, mindfulness, prioritering).</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Återhämtningsstrategier.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Hjälp att skapa balans mellan krav och resurser.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 mx-auto mb-4">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-medium mb-3 text-center">Högriskgrupper</h4>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2 text-center">📌 Rekommenderade insatser:</p>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Individuell coaching/stödsamtal.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Anpassade arbetsuppgifter och arbetsvillkor.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Regelbunden uppföljning i samverkan med företagshälsovård.</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4 text-center">
                Källa: MYNAK (2019)
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Forskningsbaserade framgångsfaktorer för målgruppsanpassning
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="pl-5 list-disc space-y-1 text-sm text-amber-700 dark:text-amber-200">
                <li>Tydlig kommunikation om vilka som omfattas och varför</li>
                <li>Skräddarsy innehåll baserat på målgruppens specifika behov</li>
                <li>Involvera målgruppen i utformningen av insatserna</li>
              </ul>
              <ul className="pl-5 list-disc space-y-1 text-sm text-amber-700 dark:text-amber-200">
                <li>Utgå från kartlagda stressfaktorer för respektive grupp</li>
                <li>Säkerställ att ingen grupp känner sig utpekad</li>
              </ul>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Källa: Havermans et al. (2018);
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MalgruppTab; 
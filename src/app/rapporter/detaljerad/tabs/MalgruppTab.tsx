import React from 'react';
import { 
  Users, 
  Target, 
  Crown, 
  HeartPulse, 
  CheckCircle, 
  AlertTriangle 
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
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="bg-card border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Effektiv målgruppssegmentering
                </h4>
              </div>
              
              <div className="relative pt-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/20">
                    <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Bred implementering</h5>
                    <div className="flex items-start">
                      <div className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full p-1 mr-2 mt-0.5">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs">Samtliga anställda på organisationen</span>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <span className="font-medium">När det passar:</span> Vid kulturförändringar och generella stressförebyggande insatser
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-900/20">
                    <h5 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">Enhetsfokuserad</h5>
                    <div className="flex items-start">
                      <div className="bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-full p-1 mr-2 mt-0.5">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs">Specifika avdelningar eller enheter</span>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <span className="font-medium">När det passar:</span> Vid lokala stressutmaningar eller avdelningsspecifika problem
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/20">
                    <h5 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Yrkesbaserad</h5>
                    <div className="flex items-start">
                      <div className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full p-1 mr-2 mt-0.5">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs">Specifika yrkesroller eller funktioner</span>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <span className="font-medium">När det passar:</span> Vid rollspecifika stressfaktorer (ex. kundtjänst, chefer)
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4 bg-purple-50 dark:bg-purple-900/20">
                    <h5 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">Riskbaserad</h5>
                    <div className="flex items-start">
                      <div className="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full p-1 mr-2 mt-0.5">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs">Personer med identifierade riskfaktorer</span>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <span className="font-medium">När det passar:</span> För riktade förebyggande insatser och tidig intervention
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-4">
                  Källa: Biron & Karanika-Murray (2020), &quot;Preventing stress at work: Process and intervention design&quot;
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Effektivitet baserat på målgrupp
                </h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 mr-2 rounded-sm"></div>
                      <span className="text-sm">Riktade insatser (högriskanställda)</span>
                    </div>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 mr-2 rounded-sm"></div>
                      <span className="text-sm">Chefer och ledare</span>
                    </div>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-amber-500 mr-2 rounded-sm"></div>
                      <span className="text-sm">Specifika avdelningar</span>
                    </div>
                    <span className="text-sm font-medium">70%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 mr-2 rounded-sm"></div>
                      <span className="text-sm">Hela organisationen</span>
                    </div>
                    <span className="text-sm font-medium">55%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '55%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                Procenttalen representerar effektivitet baserat på metaanalyser av arbetsmiljöinsatser.
                <div className="mt-1">Källa: Richardson & Rothstein (2018); SBU (2021)</div>
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 mb-8">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Differentiera insatserna baserat på behov</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 mx-auto mb-4">
                    <Crown className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-medium mb-2 text-center">Chefer och ledare</h4>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Ledarskapsverktyg för att hantera stress i team</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Kommunikationsträning för svåra samtal</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Hantera egen stress under hög press</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 mx-auto mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-medium mb-2 text-center">Medarbetare</h4>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Individuella verktyg för stresshantering</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Balans mellan arbete och återhämtning</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Effektiv prioritering av arbetsuppgifter</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 mx-auto mb-4">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-medium mb-2 text-center">Högriskgrupper</h4>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Individuell coaching och stödsamtal</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Anpassade arbetsuppgifter och workload</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>Kontinuerlig uppföljning med företagshälsovård</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4 text-center">
                Källa: Eurofound & EU-OSHA (2021), &quot;Förebyggande och hantering av arbetsrelaterad stress&quot;
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
                <li>Var tydlig med förväntningar och åtaganden</li>
                <li>Säkerställ att ingen grupp känner sig utpekad</li>
              </ul>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Källa: Havermans et al. (2018), &quot;Process evaluation of workplace interventions&quot;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MalgruppTab; 
import React from 'react';
import { 
  Target, 
  Calendar, 
  BookOpen,
  Star,
  CheckCircle
} from 'lucide-react';
import { ROIReportData } from '@/lib/reports/reportUtils';

interface SyfteTabProps {
  reportData: ROIReportData;
}

export const SyfteTab: React.FC<SyfteTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Syfte med insatserna</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium mb-3">
            Er beskrivning av syftet
          </p>
          <p className="mb-6">
            {reportData.interventionPurpose || 'Inget syfte har angivits i formuläret.'}
          </p>
          
          <h3 className="text-xl font-medium mb-4">Syftets koppling till mätbara resultat</h3>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="bg-card border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Förväntade effekter
                </h4>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Minskad stress</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Primär effekt</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ökad produktivitet</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Sekundär effekt</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Minskad sjukfrånvaro</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Sekundär effekt</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bättre arbetsmiljö</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Sekundär effekt</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Minskad personalomsättning</span>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Tertiär effekt</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                Staplarnas bredd visar hur ofta respektive effekt framträder i vetenskapliga utvärderingar.
                <div className="mt-1">Källa: Arbetsmiljöverket (2022), "Effekter av arbetsmiljöinsatser"</div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Tidsperspektiv för effekter
                </h4>
              </div>
              
              <div className="relative pt-10 pb-4">
                {/* Timeline */}
                <div className="absolute left-0 right-0 h-1 bg-muted top-5"></div>
                
                {/* Timeline markers */}
                <div className="absolute left-[10%] top-0 flex flex-col items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mb-1"></span>
                  <span className="text-xs text-muted-foreground">3 mån</span>
                </div>
                <div className="absolute left-[40%] top-0 flex flex-col items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mb-1"></span>
                  <span className="text-xs text-muted-foreground">6 mån</span>
                </div>
                <div className="absolute left-[70%] top-0 flex flex-col items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mb-1"></span>
                  <span className="text-xs text-muted-foreground">12 mån</span>
                </div>
                <div className="absolute right-0 top-0 flex flex-col items-center">
                  <span className="w-3 h-3 bg-gray-500 rounded-full mb-1"></span>
                  <span className="text-xs text-muted-foreground">24 mån</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-100 dark:border-green-800">
                    <h5 className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Kortsiktiga effekter</h5>
                    <ul className="text-xs text-green-700 dark:text-green-200 space-y-1 list-disc pl-4">
                      <li>Ökad medvetenhet om stress</li>
                      <li>Bättre kommunikation</li>
                      <li>Minskad upplevd stress</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                    <h5 className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Mellanlångsiktiga effekter</h5>
                    <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1 list-disc pl-4">
                      <li>Minskad sjukfrånvaro</li>
                      <li>Ökad produktivitet</li>
                      <li>Förbättrad arbetsmiljö</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md border border-purple-100 dark:border-purple-800">
                    <h5 className="text-xs font-medium text-purple-800 dark:text-purple-300 mb-1">Långsiktiga effekter</h5>
                    <ul className="text-xs text-purple-700 dark:text-purple-200 space-y-1 list-disc pl-4">
                      <li>Minskad personalomsättning</li>
                      <li>Hållbar arbetsmiljö</li>
                      <li>Stärkt organisationskultur</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                    <h5 className="text-xs font-medium mb-1">Strategiska effekter</h5>
                    <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc pl-4">
                      <li>Stärkt arbetsgivarvarumärke</li>
                      <li>Förbättrad rekryteringsförmåga</li>
                      <li>Ökad konkurrenskraft</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                Källa: Richardson & Rothstein (2018), "Meta-analys av stressinterventioner"
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Systemteoretiskt ramverk för stressinterventioner</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Primära interventioner</h4>
                  <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    Proaktiv
                  </span>
                </div>
                
                <p className="text-xs text-blue-700 dark:text-blue-200 mb-3">
                  Riktar sig mot organisatoriska faktorer för att förebygga att stress uppstår.
                </p>
                
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Arbetsmiljöanalyser och anpassningar</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Förtydligande av roller och ansvar</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Förbättrade processer och arbetsflöden</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Ledarskapsutbildning</span>
                  </li>
                </ul>
                
                <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-700 dark:text-blue-300">Effektivitet:</span>
                    <div className="flex">
                      <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                      <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                      <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                      <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                      <Star className="h-3 w-3 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-300">Sekundära interventioner</h4>
                  <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs font-medium">
                    Reaktiv
                  </span>
                </div>
                
                <p className="text-xs text-green-700 dark:text-green-200 mb-3">
                  Hjälper individer att hantera stress som redan uppstått.
                </p>
                
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Stresshanteringskurser</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Mindfulness och avslappningstekniker</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Coachning och mentorskap</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Tidhantering och prioritering</span>
                  </li>
                </ul>
                
                <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-700 dark:text-green-300">Effektivitet:</span>
                    <div className="flex">
                      <Star className="h-3 w-3 text-green-500 fill-green-500" />
                      <Star className="h-3 w-3 text-green-500 fill-green-500" />
                      <Star className="h-3 w-3 text-green-500 fill-green-500" />
                      <Star className="h-3 w-3 text-green-500" />
                      <Star className="h-3 w-3 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">Tertiära interventioner</h4>
                  <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs font-medium">
                    Rehabilitering
                  </span>
                </div>
                
                <p className="text-xs text-purple-700 dark:text-purple-200 mb-3">
                  Stöd för återhämtning och återgång till arbete.
                </p>
                
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Stöd från företagshälsovård</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Rehabiliteringsprogram</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Anpassad återgång till arbete</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Professionell behandling</span>
                  </li>
                </ul>
                
                <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-purple-700 dark:text-purple-300">Effektivitet:</span>
                    <div className="flex">
                      <Star className="h-3 w-3 text-purple-500 fill-purple-500" />
                      <Star className="h-3 w-3 text-purple-500 fill-purple-500" />
                      <Star className="h-3 w-3 text-purple-500" />
                      <Star className="h-3 w-3 text-purple-500" />
                      <Star className="h-3 w-3 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-4 text-center">
              <p>Forskningsresultat visar att kombinerade insatser med fokus på både organisationen (primär) och individen (sekundär) ger bäst effekt.</p>
              <div className="mt-1">Källa: LaMontagne et al. (2007); SBU (2021)</div>
            </div>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center text-indigo-800 dark:text-indigo-300">
              <Target className="h-5 w-5 mr-2" />
              Framgångsfaktorer för tydliga syften
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-indigo-700 dark:text-indigo-200">
                  <li>Koppla syftet direkt till organisationens övergripande mål</li>
                  <li>Definiera både hårda (ekonomiska) och mjuka (välmående) syften</li>
                  <li>Involvera alla berörda i definitionen av syftet</li>
                </ul>
              </div>
              <div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-indigo-700 dark:text-indigo-200">
                  <li>Sätt tydligt mätbara mål för uppföljning</li>
                  <li>Kommunicera syftet tydligt och kontinuerligt</li>
                  <li>Förankra i forskning och beprövad erfarenhet</li>
                </ul>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Källa: Nielsen & Noblet (2018), "Organizational interventions for health and well-being"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyfteTab; 
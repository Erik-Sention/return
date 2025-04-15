import React from 'react';
import { 
  Target, 
  Calendar, 
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
      <div className="bg-white border rounded-lg p-6">
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
            <div className="bg-white border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Förväntade effekter
                </h4>
              </div>
              
              <div className="space-y-5">
                <div>
                  <h5 className="font-medium mb-3 flex items-start">
                    <span className="inline-block mr-2">🏢</span> Insatser på organisationsnivå
                  </h5>
                  <ul className="space-y-3 text-sm">
                    <li className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-100 dark:border-amber-800">
                      <p>Organisationsförändringar med fokus på psykosociala krav, beslutsutrymme, socialt stöd och belöningsbalans → minskad utbrändhet och sömnproblem.</p>
                    </li>
                    <li className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-100 dark:border-amber-800">
                      <p>Förkortad arbetstid med bibehållen lön → minskad stress och förbättrad sömn.</p>
                    </li>
                    <li className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-100 dark:border-amber-800">
                      <p>Delaktighetsinsatser med förändringsverktyg som kaizen → ökad arbetstillfredsställelse och psykisk hälsa.</p>
                    </li>
                    <li className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-100 dark:border-amber-800">
                      <p>Kombinerade åtgärder: ledarskapsutbildning + medarbetarfokusgrupper → förbättrad psykosocial arbetsmiljö.</p>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium mb-3 flex items-start">
                    <span className="inline-block mr-2">🧘</span> Insatser på individnivå
                  </h5>
                  <ul className="space-y-3 text-sm">
                    <li className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                      <p>Stresshanteringsprogram med gruppträffar, individuell rådgivning och ledarskapskomponent → minskad utbrändhet.</p>
                    </li>
                    <li className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                      <p>Promenadgrupper i naturmiljö → förbättrad självskattad psykisk hälsa.</p>
                    </li>
                    <li className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                      <p>Karriärutvecklingsprogram med workshoppar, rollspel och samtal → förebyggde depression.</p>
                    </li>
                    <li className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                      <p>Mindfulness, yoga, meditation → kortsiktigt positiv effekt på psykiskt välbefinnande.</p>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                <div>Källa: Institutet för stressmedicin ISM (2022)</div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Tidsperspektiv för effekter
                </h4>
              </div>
              
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-100 dark:border-green-800">
                  <h5 className="font-medium text-green-800 dark:text-green-300 flex items-center mb-3">
                    <CheckCircle className="h-4 w-4 mr-2" /> Kortsiktiga effekter (inom 3–6 mån):
                  </h5>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="bg-white dark:bg-green-800 rounded-md p-1 mr-2 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Ökad medvetenhet om stress</p>
                        <p className="text-xs text-green-700 dark:text-green-200">Imamura et al., (2018)</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-white dark:bg-green-800 rounded-md p-1 mr-2 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Minskad upplevd stress</p>
                        <p className="text-xs text-green-700 dark:text-green-200">Imamura et al., (2018)</p>
                      </div>
                    </li>
                    <li className="flex items-start opacity-75">
                      <div className="bg-white dark:bg-green-800 rounded-md p-1 mr-2 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Bättre kommunikation</p>
                        <p className="text-xs text-green-700 dark:text-green-200">Kachi et al., (2020)</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-800">
                  <h5 className="font-medium text-blue-800 dark:text-blue-300 flex items-center mb-3">
                    <CheckCircle className="h-4 w-4 mr-2" /> Mellanlångsiktiga effekter (6–12 mån):
                  </h5>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="bg-white dark:bg-blue-800 rounded-md p-1 mr-2 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Minskad sjukfrånvaro</p>
                        <p className="text-xs text-blue-700 dark:text-blue-200">Kachi et al., (2020)</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-white dark:bg-blue-800 rounded-md p-1 mr-2 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Ökad produktivitet</p>
                        <p className="text-xs text-blue-700 dark:text-blue-200">Global Happiness and Well-Being Policy Report (2019)</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-white dark:bg-blue-800 rounded-md p-1 mr-2 shadow-sm">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Förbättrad arbetsmiljö</p>
                        <p className="text-xs text-blue-700 dark:text-blue-200">Imamura et al., (2018)</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-md border border-purple-100 dark:border-purple-800">
                  <h5 className="font-medium text-purple-800 dark:text-purple-300 flex items-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21.5 2v6h-6"></path><path d="M2.5 22v-6h6"></path><path d="M22 11.5A10 10 0 0 0 3 9"></path><path d="M2 13a10 10 0 0 0 19 2.5"></path></svg>
                    Långsiktiga och strategiska effekter (12–24+ mån):
                  </h5>
                  <p className="text-sm text-purple-700 dark:text-purple-200 mb-3">
                    Dessa effekter nämns mer som hypoteser eller följdantaganden i forskningen, men stöds ofta indirekt via:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="bg-white dark:bg-purple-800 rounded-md p-1 mr-2 shadow-sm opacity-70">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Minskad personalomsättning</p>
                        <p className="text-xs text-purple-700 dark:text-purple-200">Kachi et al., (2020)</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-white dark:bg-purple-800 rounded-md p-1 mr-2 shadow-sm opacity-70">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Bättre organisationsklimat</p>
                        <p className="text-xs text-purple-700 dark:text-purple-200">Kachi et al., (2020)</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-white dark:bg-purple-800 rounded-md p-1 mr-2 shadow-sm opacity-70">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Starkare ledarskapskultur</p>
                        <p className="text-xs text-purple-700 dark:text-purple-200">Kachi et al., (2020)</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="text-xs text-muted-foreground mt-4">
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-6 mb-6">
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
              <div className="mt-1">Källa: LaMontagne et al. (2007); SBU - Insatser i vården vid långtidssjukskrivning (2022)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyfteTab; 
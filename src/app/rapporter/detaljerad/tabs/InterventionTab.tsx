import React from 'react';
import { 
  Target, 
  Clock, 
  Building2, 
  Users, 
  User, 
  CheckCircle 
} from 'lucide-react';
import { ROIReportData } from '@/lib/reports/reportUtils';

interface InterventionTabProps {
  reportData: ROIReportData;
}

export const InterventionTab: React.FC<InterventionTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Intervention</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium mb-3">
            Era planerade insatser
          </p>
          
          {reportData.interventionsArray && reportData.interventionsArray.length > 0 ? (
            <div className="space-y-4">
              {reportData.interventionsArray.map((intervention, index) => {
                // Försök hitta syftet genom att dela upp vid "Syfte:" om det finns
                const parts = intervention.split('Syfte:');
                const description = parts[0].trim();
                const purpose = parts.length > 1 ? parts[1].trim() : null;
                
                return (
                  <div key={index} className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="min-w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-base font-medium">{description}</h3>
                        {purpose && (
                          <div className="mt-2">
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Target className="h-4 w-4 mr-1 text-primary" />
                              <span className="font-medium">Syfte:</span>
                            </div>
                            <p className="text-sm ml-5">{purpose}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mb-6">
              {reportData.interventionDescription || 'Inga specifika interventioner har angivits i formuläret.'}
            </p>
          )}
          
          <h3 className="text-xl font-medium mt-8 mb-4">Insatsernas effektivitet</h3>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-8">
            <div className="bg-card border rounded-lg p-5">
              <h4 className="font-medium mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Effektivitet för olika interventionstyper
              </h4>
              
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Kombinerade åtgärder (org + individ)</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs inline-block py-1 px-2 uppercase rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          Mest effektivt
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Ledarskapsinsatser</span>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Organisatoriska förändringar</span>
                    <span className="text-sm font-medium">70%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Individfokuserade insatser</span>
                    <span className="text-sm font-medium">50%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                Baserad på metaanalys av 100+ studier. Procentsatsen visar relativ effektstorlek.
                <div className="mt-1">Källa: Richardson & Rothstein (2018); LaMontagne et al. (2007)</div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <h4 className="font-medium mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Implementeringstid och effektuppskattning
              </h4>
              
              <div className="relative">
                {/* Implementeringsdiagram */}
                <div className="w-full h-40 relative">
                  {/* Graf linjer */}
                  <div className="absolute left-0 bottom-0 w-full h-0.5 bg-gray-300 dark:bg-gray-700"></div>
                  <div className="absolute left-0 bottom-0 h-full w-0.5 bg-gray-300 dark:bg-gray-700"></div>
                  
                  {/* Y-axel labels */}
                  <div className="absolute -left-1 bottom-0 transform -translate-x-full flex flex-col justify-between h-full py-1 text-xs text-muted-foreground">
                    <span>Hög</span>
                    <span>Medel</span>
                    <span>Låg</span>
                  </div>
                  
                  {/* X-axel labels */}
                  <div className="absolute left-0 -bottom-6 w-full flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>3 mån</span>
                    <span>6 mån</span>
                    <span>12 mån</span>
                  </div>
                  
                  {/* Organisatoriska åtgärder (linje) */}
                  <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    <path 
                      d="M0,32 C40,45 80,60 100,20" 
                      fill="none" 
                      stroke="#8b5cf6" 
                      strokeWidth="2"
                      strokeDasharray="4 2" 
                    />
                    <circle cx="100" cy="20" r="4" fill="#8b5cf6" />
                  </svg>
                  
                  {/* Individfokuserade åtgärder (linje) */}
                  <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    <path 
                      d="M0,120 C30,80 70,40 100,60" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="2" 
                    />
                    <circle cx="100" cy="60" r="4" fill="#ef4444" />
                  </svg>
                </div>
                
                <div className="mt-8 flex space-x-4 justify-center">
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-purple-500 mr-2"></span>
                    <span className="text-xs">Organisatoriska åtgärder</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                    <span className="text-xs">Individfokuserade åtgärder</span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                Källa: SBU (2020), &quot;Tidsförlopp för olika interventionstyper&quot;
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                </div>
                <h4 className="font-medium">Organisatoriska insatser</h4>
              </div>
              
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-200">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Resursprioriteringar & rollförtydliganden</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Förbättrade arbetsprocesser</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Tydligare kommunikationsvägar</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <h4 className="font-medium">Ledarskapsinsatser</h4>
              </div>
              
              <ul className="space-y-2 text-sm text-green-700 dark:text-green-200">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Ledarskapsutbildningar</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Verktyg för stresshantering i grupp</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Coaching för chefer</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-5">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                </div>
                <h4 className="font-medium">Individfokuserade insatser</h4>
              </div>
              
              <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-200">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Stresshanteringskurser & mindfulness</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Personlig coaching</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Balans arbete-fritid</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterventionTab; 
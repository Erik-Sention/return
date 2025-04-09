import React from 'react';
import { 
  Percent, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { formatCurrency, formatPercent, formatMonths, ROIReportData } from '@/lib/reports/reportUtils';

interface RekommendationTabProps {
  reportData: ROIReportData;
}

export const RekommendationTab: React.FC<RekommendationTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Rekommendation</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium mb-3">
            Er rekommendation för beslut
          </p>
          <p className="mb-6">
            {reportData.recommendation || 'Ingen rekommendation har angivits i formuläret.'}
          </p>
          
          <h3 className="text-xl font-medium mb-4">ROI-analys för beslut</h3>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-card border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <Percent className="h-5 w-5 mr-2 text-green-500" />
                  Avkastning på investering
                </h4>
              </div>
              
              <div className="relative pt-1">
                <span className="text-4xl font-bold">
                  {formatPercent(reportData.roi || 0)}
                </span>
                <div className="text-sm text-muted-foreground mt-1">
                  Förväntad avkastning på investering
                </div>
                
                <div className="mt-6 relative h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`absolute inset-y-0 ${(reportData.roi || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${Math.min(100, Math.abs((reportData.roi || 0)) / 5)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>100%</span>
                  <span>200%</span>
                  <span>300%</span>
                  <span>400%</span>
                  <span>500%</span>
                </div>
                
                <div className="mt-4 text-xs text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span>Normal nivå för arbetsmiljöinsatser:</span>
                    <span className="font-medium">50-150%</span>
                  </div>
                  <div className="text-right text-xs mt-1">Källa: SBU (2020)</div>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                  Investering vs. Avkastning
                </h4>
              </div>
              
              <div className="flex items-end justify-center gap-4 h-44 mt-4">
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-2">Investering</div>
                  <div className="w-16 bg-blue-500 rounded-t-md" style={{ height: `${Math.min(100, (reportData.totalCost || 0) / 10000)}px` }}></div>
                  <div className="mt-2 text-sm font-medium">{formatCurrency(reportData.totalCost || 0, true)}</div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-2">Avkastning</div>
                  <div className="w-16 bg-green-500 rounded-t-md" style={{ height: `${Math.min(100, (reportData.totalBenefit || 0) / 10000)}px` }}></div>
                  <div className="mt-2 text-sm font-medium">{formatCurrency(reportData.totalBenefit || 0, true)}</div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-2">Nettoresultat</div>
                  <div className="w-16 bg-purple-500 rounded-t-md" style={{ height: `${Math.min(100, ((reportData.totalBenefit || 0) - (reportData.totalCost || 0)) / 10000)}px` }}></div>
                  <div className="mt-2 text-sm font-medium">{formatCurrency((reportData.totalBenefit || 0) - (reportData.totalCost || 0), true)}</div>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground text-center">
                Analys baserad på forskningsdata från Previa (2020) och SBU (2020)
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-5">
              <div className="pb-4 mb-4 border-b border-border">
                <h4 className="font-medium flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-amber-500" />
                  Kostnads-nyttoanalys över tid
                </h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="text-left pb-2">Tidsperiod</th>
                      <th className="text-right pb-2">Investering</th>
                      <th className="text-right pb-2">Avkastning</th>
                      <th className="text-right pb-2">Nettoresultat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2">År 1</td>
                      <td className="py-2 text-right text-red-500">-{formatCurrency(reportData.totalCost || 0, true)}</td>
                      <td className="py-2 text-right text-green-500">+{formatCurrency(reportData.totalBenefit || 0, true)}</td>
                      <td className="py-2 text-right">
                        {formatCurrency((reportData.totalBenefit || 0) - (reportData.totalCost || 0), true)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">År 2</td>
                      <td className="py-2 text-right text-red-500">-{formatCurrency(0)}</td>
                      <td className="py-2 text-right text-green-500">+{formatCurrency(reportData.totalBenefit || 0, true)}</td>
                      <td className="py-2 text-right">
                        {formatCurrency((reportData.totalBenefit || 0) * 2 - (reportData.totalCost || 0), true)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">År 3</td>
                      <td className="py-2 text-right text-red-500">-{formatCurrency(0)}</td>
                      <td className="py-2 text-right text-green-500">+{formatCurrency(reportData.totalBenefit || 0, true)}</td>
                      <td className="py-2 text-right">
                        {formatCurrency((reportData.totalBenefit || 0) * 3 - (reportData.totalCost || 0), true)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="font-medium">
                      <td className="pt-3">Totalt 3 år</td>
                      <td className="pt-3 text-right text-red-500">-{formatCurrency(reportData.totalCost || 0, true)}</td>
                      <td className="pt-3 text-right text-green-500">+{formatCurrency((reportData.totalBenefit || 0) * 3, true)}</td>
                      <td className="pt-3 text-right">
                        {formatCurrency((reportData.totalBenefit || 0) * 3 - (reportData.totalCost || 0), true)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground text-center">
                Källa: Projektionsmodell baserad på Richardson & Rothstein (2018)
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5">
              <h4 className="font-medium mb-4 flex items-center text-green-800 dark:text-green-300">
                <CheckCircle className="h-5 w-5 mr-2" />
                Fördelar
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-sm text-green-700 dark:text-green-200">
                <li>Stark ekonomisk avkastning (ROI: {formatPercent(reportData.roi || 0)})</li>
                <li>Relativt kort återbetalningstid ({reportData.paybackPeriod ? formatMonths(reportData.paybackPeriod) : 'N/A'})</li>
                <li>Minskad risk för långtidssjukskrivningar</li>
                <li>Förbättrad produktivitet och arbetskvalitet</li>
                <li>Stärkt arbetsgivarvarumärke</li>
              </ul>
              <div className="text-xs text-muted-foreground mt-3">
                Källa: OECD (2021), "Mental Health and Work: Sweden"
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-5">
              <h4 className="font-medium mb-4 flex items-center text-yellow-800 dark:text-yellow-300">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Risker att hantera
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-sm text-yellow-700 dark:text-yellow-200">
                <li>Kräver avsättning av tid från chefer och medarbetare</li>
                <li>Risk för bristande engagemang vid hög arbetsbelastning</li>
                <li>Effekterna kan ta tid att materialiseras fullt ut</li>
                <li>Kräver uthållighet i implementeringen</li>
              </ul>
              <div className="text-xs text-muted-foreground mt-3">
                Källa: Nielsen & Randall (2018), "Implementeringskvalitet"
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Jämförelse med nationell statistik</h3>
            
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-3">Avkastning på investering (ROI) för arbetsmiljöinsatser</h4>
              
              <div className="relative pb-5">
                <div className="flex">
                  <div className="w-full h-10 flex items-center justify-center relative">
                    <div className="absolute inset-y-0 w-full bg-muted rounded-full"></div>
                    
                    {/* ROI markers */}
                    <div className="absolute inset-y-0 left-[10%] w-0.5 bg-gray-400"></div>
                    <div className="absolute inset-y-0 left-[30%] w-0.5 bg-gray-400"></div>
                    <div className="absolute inset-y-0 left-[50%] w-0.5 bg-gray-400"></div>
                    <div className="absolute inset-y-0 left-[70%] w-0.5 bg-gray-400"></div>
                    <div className="absolute inset-y-0 left-[90%] w-0.5 bg-gray-400"></div>
                    
                    {/* Current position indicator */}
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20"
                      style={{ left: `${Math.min(95, Math.max(5, ((reportData.roi || 0) / 5)))}%` }}
                    >
                      <div className="w-5 h-5 rounded-full bg-primary border-2 border-white dark:border-gray-800">
                        <span className="sr-only">Er ROI</span>
                      </div>
                    </div>
                    
                    {/* ROI range indicators */}
                    <div className="absolute inset-y-0 left-[30%] right-[70%] bg-red-200 dark:bg-red-900/30 rounded-full"></div>
                    <div className="absolute inset-y-0 left-[50%] right-[30%] bg-amber-200 dark:bg-amber-900/30 rounded-full"></div>
                    <div className="absolute inset-y-0 left-[70%] right-[10%] bg-green-200 dark:bg-green-900/30 rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Låg ROI</span>
                  <span>Medium ROI</span>
                  <span>Hög ROI</span>
                </div>
                
                <div className="flex justify-between text-xs mt-1">
                  <span>0%</span>
                  <span>100%</span>
                  <span>200%</span>
                  <span>300%</span>
                  <span>400%</span>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground">
                Enligt en systematisk översikt av SBU (2020) ger dokumenterade arbetsmiljöinsatser en genomsnittlig ROI på 1,3-4,5 gånger investeringen.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RekommendationTab; 
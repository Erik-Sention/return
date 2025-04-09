import React from 'react';
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

interface NyckeltalsTabProps {
  reportData: ROIReportData;
}

// Utökade egenskaper för rapporten som används i denna komponent
interface ExtendedROIReportData extends ROIReportData {
  directCosts?: number;
  indirectCosts?: number;
  absenteeismReduction?: number;
  currentAbsenteeism?: number;
  affectedEmployees?: number;
  averageSalary?: number;
  productivityIncrease?: number;
  absenteeismSavings?: number;
  productivityBenefits?: number;
  otherBenefits?: number;
}

export const NyckeltalsTab: React.FC<NyckeltalsTabProps> = ({ reportData }) => {
  // Typkonvertera till det utökade gränssnittet
  const extendedData = reportData as ExtendedROIReportData;
  
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Nyckeltal</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-card border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                ROI (Avkastning på investering)
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatPercent(extendedData.roi || 0)}</span>
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
                <span>{formatCurrency(extendedData.totalBenefit || 0)} / {formatCurrency(extendedData.totalCost || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Återbetalningstid
              </h3>
            </div>
            <span className="text-4xl font-bold">{extendedData.paybackPeriod || '-'}</span>
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
          
          <div className="bg-card border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                Totala kostnader
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatCurrency(extendedData.totalCost || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Uppskattad kostnad för insats
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between mb-1">
                <span>Direkta kostnader:</span>
                <span>{formatCurrency(extendedData.directCosts || 0)}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Indirekta kostnader:</span>
                <span>{formatCurrency(extendedData.indirectCosts || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-5">
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
          
          <div className="bg-card border rounded-lg p-5">
            <div className="pb-4 mb-4 border-b border-border">
              <h3 className="font-medium flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                Berörda medarbetare
              </h3>
            </div>
            <span className="text-4xl font-bold">{formatNumber(extendedData.affectedEmployees || 0)}</span>
            <div className="text-sm text-muted-foreground mt-1">
              Antal medarbetare som berörs
            </div>
            
            <div className="mt-4">
              <div className="text-sm flex justify-between">
                <span>Kostnad per medarbetare:</span>
                <span>
                  {formatCurrency(extendedData.affectedEmployees 
                    ? (extendedData.totalCost || 0) / extendedData.affectedEmployees 
                    : 0
                  )}
                </span>
              </div>
              <div className="text-sm flex justify-between">
                <span>Avkastning per medarbetare:</span>
                <span>
                  {formatCurrency(extendedData.affectedEmployees 
                    ? (extendedData.totalBenefit || 0) / extendedData.affectedEmployees 
                    : 0
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-5">
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
                    (extendedData.affectedEmployees || 0)
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
          <div className="bg-card border rounded-lg p-5">
            <h3 className="text-lg font-medium mb-4">Prognostiserad kostnad vs. avkastning över tid</h3>
            
            <div className="relative w-full h-64 bg-card border rounded-lg p-5">
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
                          ? Math.min(80, (extendedData.totalCost || 0) / 1000) 
                          : 0}%` 
                      }}
                    ></div>
                    
                    {/* Benefit Bar */}
                    <div 
                      className="w-2 bg-green-500 mt-0.5" 
                      style={{ 
                        height: `${Math.min(80, ((extendedData.totalBenefit || 0) / 36) * (i + 1) / 1000)}%` 
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
                {extendedData.paybackPeriod && (
                  <div 
                    className="absolute border-t border-dashed border-amber-500" 
                    style={{ 
                      bottom: `${Math.min(80, (extendedData.totalCost || 0) / 1000)}%`,
                      left: 0,
                      right: 0
                    }}
                  >
                    <span className="absolute text-xs bg-card text-amber-600 -top-3 rounded px-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      Break-even: {extendedData.paybackPeriod} månader
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
                <div className={`font-medium ${((extendedData.totalBenefit || 0) / 4) > (extendedData.totalCost || 0) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(((extendedData.totalBenefit || 0) / 4) - (extendedData.totalCost || 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">12 månader</div>
                <div className={`font-medium ${(extendedData.totalBenefit || 0) > (extendedData.totalCost || 0) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency((extendedData.totalBenefit || 0) - (extendedData.totalCost || 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">36 månader</div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(((extendedData.totalBenefit || 0) * 3) - (extendedData.totalCost || 0))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-card border rounded-lg p-5">
              <h3 className="text-lg font-medium mb-4">Kostnadsfördelning</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Direkta kostnader</span>
                    <span className="text-sm font-medium">{formatCurrency(extendedData.directCosts || 0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full" 
                      style={{ width: `${extendedData.totalCost ? (extendedData.directCosts || 0) / extendedData.totalCost * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Indirekta kostnader</span>
                    <span className="text-sm font-medium">{formatCurrency(extendedData.indirectCosts || 0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-purple-500 h-2.5 rounded-full" 
                      style={{ width: `${extendedData.totalCost ? (extendedData.indirectCosts || 0) / extendedData.totalCost * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Totala kostnader</span>
                    <span className="text-sm font-medium">{formatCurrency(extendedData.totalCost || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-5">
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
                      style={{ width: `${extendedData.totalBenefit ? (extendedData.absenteeismSavings || 0) / extendedData.totalBenefit * 100 : 0}%` }}
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
                      style={{ width: `${extendedData.totalBenefit ? (extendedData.productivityBenefits || 0) / extendedData.totalBenefit * 100 : 0}%` }}
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
                      style={{ width: `${extendedData.totalBenefit ? (extendedData.otherBenefits || 0) / extendedData.totalBenefit * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Total avkastning (per år)</span>
                    <span className="text-sm font-medium">{formatCurrency(extendedData.totalBenefit || 0)}</span>
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
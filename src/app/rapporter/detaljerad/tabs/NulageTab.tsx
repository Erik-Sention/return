import React from 'react';
import { ChartCard } from '@/components/ui/chart-card';
import { StatItem } from '@/components/ui/stat-item';
import { 
  Users, 
  Activity, 
  Calendar, 
  BookOpen
} from 'lucide-react';
import { formatCurrency, formatPercent, ROIReportData } from '@/lib/reports/reportUtils';

interface NulageTabProps {
  reportData: ROIReportData;
}

export const NulageTab: React.FC<NulageTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Nuläge</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium mb-3">
            Nulägesanalys
          </p>
          <p className="mb-6">
            {reportData.currentSituation || 'Ingen nulägesanalys har angivits i formuläret.'}
          </p>
          
          <h3 className="text-xl font-medium mb-4">Stressrelaterad psykisk ohälsa i organisationen</h3>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <ChartCard 
              title="Personal med hög stressnivå"
              icon={<Users className="h-5 w-5" />}
              variant="purple"
            >
              <StatItem 
                label="Andel av personal"
                value={`${formatPercent(reportData.stressPercentage || 0)}`}
                description="Rapporterar hög stressnivå"
                variant="purple"
              />
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Nationellt genomsnitt: 31,7%</span>
                  <span className="text-xs">Källa: Stress i arbetslivet Falck Sverige (2025)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${(reportData.stressPercentage || 0)}%` }}
                  ></div>
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full mt-1" 
                    style={{ width: `31.7%` }}
                  ></div>
                </div>
              </div>
            </ChartCard>
            
            <ChartCard 
              title="Produktionsbortfall"
              icon={<Activity className="h-5 w-5" />}
              variant="blue"
            >
              <StatItem 
                label="Kostnad per år"
                value={formatCurrency(reportData.productionLossValue || 0)}
                description="Till följd av stress inom riskzonen hög stressnivå"
                variant="blue"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                <p> Stress inom arbetslivet beräknas leda till minst 9 % produktionsbortfall (MYNAK, 2019). Den största delen beror på presenteeism – när medarbetare är på jobbet men presterar sämre p.g.a. ohälsa. Enligt Journal of Occupational and Environmental Medicine (2013) står presenteeism för 77 % av den totala produktivitetsförlusten, jämfört med 23 % från frånvaro.</p>
              </div>
            </ChartCard>
            
            <ChartCard 
              title="Sjukfrånvaro"
              icon={<Calendar className="h-5 w-5" />}
              variant="purple"
            >
              <StatItem 
                label="Kostnad per år"
                value={formatCurrency(reportData.sickLeaveValue || 0)}
                description="Pga. psykisk ohälsa"
                variant="purple"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Psykisk ohälsa står för 42% av samtliga sjukskrivningar (Källa: Psykisk ohälsa i dagens arbetsliv, Försäkringskassans lägesrapport (2023:1))</p>
              </div>
            </ChartCard>
          </div>
          
          <h3 className="text-xl font-medium mb-4">Total kostnad för psykisk ohälsa</h3>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="bg-white border rounded-lg p-6">
              <h4 className="font-medium mb-4">Kostnad för psykisk ohälsa</h4>
              <div className="relative pt-1">
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(reportData.totalMentalHealthCost || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total kostnad per år
                </div>
                
                {/* Donut chart representation */}
                <div className="mt-6 relative h-48 w-full">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      {/* Background circle */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" strokeWidth="15" />
                      
                      {/* Productionloss segment */}
                      {(reportData.productionLossValue || 0) > 0 && (
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="15" 
                          strokeDasharray={`${(reportData.productionLossValue || 0) / (reportData.totalMentalHealthCost || 1) * 251.2} 251.2`} 
                          strokeDashoffset="0" 
                          transform="rotate(-90 50 50)" 
                        />
                      )}
                      
                      {/* Sick leave segment */}
                      {(reportData.sickLeaveValue || 0) > 0 && (
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="none" 
                          stroke="#a855f7" 
                          strokeWidth="15" 
                          strokeDasharray={`${(reportData.sickLeaveValue || 0) / (reportData.totalMentalHealthCost || 1) * 251.2} 251.2`} 
                          strokeDashoffset={`${-1 * (reportData.productionLossValue || 0) / (reportData.totalMentalHealthCost || 1) * 251.2}`} 
                          transform="rotate(-90 50 50)" 
                        />
                      )}
                    </svg>
                    
                    {/* Center text */}
                    <div className="absolute text-center">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(reportData.totalMentalHealthCost || 0, true)}
                  </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Produktionsbortfall: {formatPercent((reportData.productionLossValue || 0) / (reportData.totalMentalHealthCost || 1) * 100)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Sjukfrånvaro: {formatPercent((reportData.sickLeaveValue || 0) / (reportData.totalMentalHealthCost || 1) * 100)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <h4 className="font-medium mb-4 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-primary" />
                Kostnad per anställd med sjukfrånvaro pga. psykisk ohälsa
              </h4>
              
              <div className="mb-4">
                <div className="relative pt-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Er organisation (sjukfrånvaro)</span>
                    <span className="font-medium">
                      {formatCurrency((reportData.sickLeaveValue || 0) / (((reportData.stressPercentage || 0) / 100) * 100))}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min(100, ((reportData.sickLeaveValue || 0) / (((reportData.stressPercentage || 0) / 100) * 100)) / 100000 * 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs mb-1 mt-3">
                    <span>Nationellt genomsnitt</span>
                    <span className="font-medium">{formatCurrency(65000)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${65000 / 100000 * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Källa: Försäkringskassan (2023)
                </div>
              </div>
            </div>
            
              <div className="mt-6">
                <h5 className="text-sm font-medium mb-2">Nationell kostnad per år</h5>
                <div className="text-3xl font-bold mb-1">16,6 Mdr SEK</div>
                <div className="text-xs text-muted-foreground">
                  Sjukpenning för stressrelaterad psykisk ohälsa och depressioner kostar svenska samhället cirka 16,6 miljarder kronor årligen.
                  <div className="mt-1">Källa: Psykisk ohälsa i dagens arbetsliv, Försäkringskassans lägesrapport (2023:1)</div>
                </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NulageTab; 
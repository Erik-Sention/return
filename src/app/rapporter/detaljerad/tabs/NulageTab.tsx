import React from 'react';
import { ChartCard } from '@/components/ui/chart-card';
import { StatItem } from '@/components/ui/stat-item';
import { 
  Users, 
  Activity, 
  Calendar, 
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatPercent, ROIReportData } from '@/lib/reports/reportUtils';

interface NulageTabProps {
  reportData: ROIReportData;
}

export const NulageTab: React.FC<NulageTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
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
                  <span>Nationellt genomsnitt: 16%</span>
                  <span className="text-xs">Källa: Folkhälsomyndigheten (2021)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${(reportData.stressPercentage || 0)}%` }}
                  ></div>
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full mt-1" 
                    style={{ width: `16%` }}
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
                description="Pga. stressrelaterad ohälsa"
                variant="blue"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Enligt Myndigheten för arbetsmiljökunskap (2020) innebär stressrelaterad psykisk ohälsa ett produktionsbortfall på minst 9%.</p>
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
                <p>Psykisk ohälsa står för cirka 45% av samtliga sjukskrivningar (Försäkringskassan, 2020)</p>
              </div>
            </ChartCard>
          </div>
          
          <h3 className="text-xl font-medium mb-4">Total kostnad för psykisk ohälsa</h3>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="bg-card border rounded-lg p-6">
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
            
            <div className="bg-card border rounded-lg p-6">
              <h4 className="font-medium mb-4 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-primary" />
                Forskningsbaserade jämförelser
              </h4>
              
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-2">Kostnad per anställd med psykisk ohälsa</h5>
                <div className="relative pt-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Er organisation</span>
                    <span className="font-medium">
                      {formatCurrency((reportData.totalMentalHealthCost || 0) / (((reportData.stressPercentage || 0) / 100) * 100))}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min(100, ((reportData.totalMentalHealthCost || 0) / (((reportData.stressPercentage || 0) / 100) * 100)) / 100000 * 100)}%` }}
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
                    Källa: OECD (2021), &quot;Mental Health and Work: Sweden&quot;
                </div>
              </div>
            </div>
            
              <div className="mt-6">
                <h5 className="text-sm font-medium mb-2">Nationell kostnad per år</h5>
                <div className="text-3xl font-bold mb-1">70 Mdr SEK</div>
                <div className="text-xs text-muted-foreground">
                  Stressrelaterad psykisk ohälsa kostar svenska samhället cirka 70 miljarder kronor årligen. 
                  <div className="mt-1">Källa: OECD (2021), &quot;Mental Health and Work: Sweden&quot;</div>
                </div>
                </div>
              </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h4 className="font-medium mb-4">Konsekvenser av stressrelaterad psykisk ohälsa</h4>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-muted/40 p-4 rounded-lg">
                <h5 className="text-sm font-medium mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-red-500" /> Sjukfrånvaro
                </h5>
                <p className="text-xs mb-2">
                  Psykisk ohälsa står för 45% av sjukskrivningar i Sverige.
                </p>
                <div className="text-xs text-muted-foreground">
                  Källa: Försäkringskassan (2020)
            </div>
          </div>
          
              <div className="bg-muted/40 p-4 rounded-lg">
                <h5 className="text-sm font-medium mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-amber-500" /> Presenteeism
                </h5>
                <p className="text-xs mb-2">
                  Närvaro trots sjukdom kostar 2-3 gånger mer än sjukfrånvaro.
                </p>
                <div className="text-xs text-muted-foreground">
                  Källa: SBU (2021)
                </div>
              </div>
              
              <div className="bg-muted/40 p-4 rounded-lg">
                <h5 className="text-sm font-medium mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500" /> Personalomsättning
                </h5>
                <p className="text-xs mb-2">
                  Upp till 50% högre vid hög andel stressad personal.
                </p>
                <div className="text-xs text-muted-foreground">
                  Källa: Prevent (2022)
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Forskningsbaserad riskprognos
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-200 mb-2">
                  Om inga åtgärder vidtas visar forskning att stressrelaterad ohälsa tenderar att öka med 5-10% årligen.
                </p>
                <div className="text-xs text-muted-foreground">
                  Källa: Arbetsmiljöverket (2020), &quot;Förebyggande insatser&quot;
                </div>
              </div>
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-200 mb-2">
                  Rehabiliteringskostnad för utmattningssyndrom: 600 000 - 1 000 000 kr per fall.
                </p>
                <div className="text-xs text-muted-foreground">
                  Källa: Institutet för stressmedicin (2020)
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
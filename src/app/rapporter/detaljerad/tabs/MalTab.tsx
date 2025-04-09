import React from 'react';
import { 
  TrendingDown, 
  CreditCard, 
  Clock, 
  Target, 
  Users, 
  BookOpen 
} from 'lucide-react';
import { formatCurrency, formatPercent, formatMonths, ROIReportData } from '@/lib/reports/reportUtils';

interface MalTabProps {
  reportData: ROIReportData;
}

export const MalTab: React.FC<MalTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Målsättning</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium mb-3">
            Era angivna mål
          </p>
          <p className="mb-6">
            {reportData.goalsDescription || 'Inga specifika mål har angivits i formuläret.'}
          </p>
          
          <h3 className="text-xl font-medium mb-4">Nyckeltal och förväntade resultat</h3>
          
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="bg-card border rounded-lg p-5">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium flex items-center">
                  <TrendingDown className="h-4 w-4 mr-2 text-green-500" />
                  Stressnivå
                </h4>
                <div className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-medium">
                  Mål
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold mb-1">
                  {formatPercent(reportData.reducedStressPercentage || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Förväntad minskning av andel med hög stress
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs">Nuvarande nivå</span>
                    <span className="text-xs font-medium">{formatPercent(reportData.stressPercentage || 0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${reportData.stressPercentage || 0}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs">Målnivå</span>
                    <span className="text-xs font-medium">{formatPercent((reportData.stressPercentage || 0) - (reportData.reducedStressPercentage || 0))}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(reportData.stressPercentage || 0) - (reportData.reducedStressPercentage || 0)}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                Empiriskt stöd: Väldesignade interventioner minskar stress med 10-20%
                <div className="mt-1">Källa: Richardson & Rothstein (2018)</div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-5">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                  Ekonomi
                </h4>
                <div className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                  ROI
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold mb-1">
                  {formatPercent(reportData.roi || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Förväntad avkastning på investering
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <div className="text-sm font-medium mb-1">
                    {formatCurrency(reportData.totalCost || 0, true)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Investering
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <div className="text-sm font-medium mb-1">
                    {formatCurrency(reportData.totalBenefit || 0, true)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Besparing
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                Empiriskt stöd: ROI på 1,5-5x investering för systematiska insatser
                <div className="mt-1">Källa: SBU (2020)</div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-5">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-purple-500" />
                  Återbetalningstid
                </h4>
                <div className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium">
                  Tid
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold mb-1">
                  {formatMonths(reportData.paybackPeriod || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Tid tills insatsen blir lönsam
                </div>
              </div>
              
              {/* Visualize payback period */}
              <div className="mt-4 relative h-6 bg-muted rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div 
                    className="h-full bg-purple-500" 
                    style={{ width: `${Math.min(100, ((reportData.paybackPeriod || 0) / 36) * 100)}%` }}
                  ></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {formatMonths(reportData.paybackPeriod || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>18 mån</span>
                <span>36 mån</span>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                Empiriskt stöd: Normalt 12-24 månaders återbetalningstid
                <div className="mt-1">Källa: Arbetsmiljöverket (2019)</div>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Förväntade sekundära effekter</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-primary" />
                  Organisationsnivå
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Minskad sjukfrånvaro</span>
                      <span className="text-xs font-medium">15%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Minskad personalomsättning</span>
                      <span className="text-xs font-medium">10%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Ökad produktivitet</span>
                      <span className="text-xs font-medium">7%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '7%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-3">
                  Källa: Previa (2020), "Effekter av arbetsmiljöinsatser"
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Individuell nivå
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Ökad arbetsglädje</span>
                      <span className="text-xs font-medium">20%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Förbättrad stresskompetens</span>
                      <span className="text-xs font-medium">25%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Ökat engagemang</span>
                      <span className="text-xs font-medium">15%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-3">
                  Källa: Richardson & Rothstein (2018), "Effekter av stressinterventioner"
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center text-blue-800 dark:text-blue-300">
              <BookOpen className="h-4 w-4 mr-2" />
              Forskningsbaserade mål enligt SMART-principen
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/40">
                <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-300">S - Specifika</h5>
                <p className="text-xs">Tydligt definierade måltal per område</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/40">
                <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-300">M - Mätbara</h5>
                <p className="text-xs">Kvantifierbara indikatorer som kan följas upp</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/40">
                <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-300">A - Accepterade</h5>
                <p className="text-xs">Förankrade i hela organisationen</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/40">
                <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-300">R - Realistiska</h5>
                <p className="text-xs">Rimliga baserat på forskningsresultat</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/40">
                <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-300">T - Tidsbestämda</h5>
                <p className="text-xs">Tydlig tidsram för när målen ska uppnås</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Systematisk uppföljning av SMART-mål ökar sannolikheten för framgång med 40-60%.
              <div className="mt-1">Källa: Doran (1981); Institutet för stressmedicin (2021)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MalTab; 
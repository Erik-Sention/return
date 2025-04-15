import React from 'react';
import { 
  Percent, 
  Clock, 
  BarChart3,
  Banknote,
  ArrowDownCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatPercent, formatMonths, ROIReportData } from '@/lib/reports/reportUtils';

interface RekommendationTabProps {
  reportData: ROIReportData;
}

export const RekommendationTab: React.FC<RekommendationTabProps> = ({ reportData }) => {
  // Beräkna break-even i månader
  const breakEvenMonths = reportData.paybackPeriod || 0;
  
  // Använd minEffectForBreakEvenAlt3 från reportData som kommer från FormJ
  // Värdet finns i reportData.minEffectForBreakEvenAlt3 enligt src/lib/reports/reportUtils.ts
  const minEffectPercent = reportData.minEffectForBreakEvenAlt3 || 0;
  
  // Generate summary based on KPI data
  const generateSummary = () => {
    const roi = reportData.roi || 0;
    const paybackPeriod = reportData.paybackPeriod || 0;
    const totalBenefit = reportData.totalBenefit || 0;
    const totalCost = reportData.totalCost || 0;
    
    let roiQuality = '';
    if (roi < 50) roiQuality = 'låg';
    else if (roi < 150) roiQuality = 'medelhög';
    else roiQuality = 'mycket hög';
    
    let paybackQuality = '';
    if (paybackPeriod > 24) paybackQuality = 'lång';
    else if (paybackPeriod > 12) paybackQuality = 'medellång';
    else paybackQuality = 'kort';
    
    const netResult = totalBenefit - totalCost;
    
    return `Investeringen visar en ${roiQuality} avkastning på ${formatPercent(roi)} med en ${paybackQuality} återbetalningstid på ${formatMonths(paybackPeriod)}. Projektet förväntas generera ett nettoresultat på ${formatCurrency(netResult, true)} över tre år. ${roi > 100 ? 'Rekommendationen är att gå vidare med investeringen baserat på de positiva ekonomiska prognoserna.' : 'Investeringen bör övervägas noga med hänsyn till den ekonomiska analysen.'}`;
  };
  
  // Hårda värden för diagrammet baserat på exempel från användaren
  // Dessa ska ersättas med faktiska data från reportData i produktionen
  const exampleData = {
    investment: 1864319,
    yearlyBenefit: 4442486,
    year1Net: 2578167,
    year2Net: 7020653,
    year3Net: 11463139,
    minYAxis: -11463140,
    maxYAxis: 11463140
  };
  
  // Beräkna årliga resultat baserat på reportData eller exempeldata
  const investment = reportData.totalCost || exampleData.investment;
  const yearlyBenefit = reportData.totalBenefit || exampleData.yearlyBenefit;
  
  const yearlyData = [
    { 
      year: 0, 
      investment: investment, 
      benefit: 0, 
      cumulative: -investment 
    },
    { 
      year: 1, 
      investment: 0, 
      benefit: yearlyBenefit, 
      cumulative: yearlyBenefit - investment 
    },
    { 
      year: 2, 
      investment: 0, 
      benefit: yearlyBenefit, 
      cumulative: yearlyBenefit * 2 - investment 
    },
    { 
      year: 3, 
      investment: 0, 
      benefit: yearlyBenefit, 
      cumulative: yearlyBenefit * 3 - investment 
    }
  ];
  
  // Beräkna maxvärden för y-axeln baserat på faktiska värden
  const maxValue = Math.max(yearlyBenefit * 3);
  const minValue = -Math.max(investment);
  
  // Dynamisk skalning för att visa relevanta värden
  const yRange = (maxValue - minValue) * 1.1; // Lägg till 10% extra utrymme
  const yScale = (value: number) => 100 - ((value - minValue) / yRange * 100);
  
  return (
    <div className="space-y-6">
      {/* Huvudsektion */}
      <div className="bg-white dark:bg-gray-950 border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Rekommendation</h2>
      
        {/* Sammanfattning av ROI-rapport */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white dark:bg-gray-950 border rounded-lg p-5 flex flex-col">
            <div className="flex items-center mb-5">
              <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-md">
                <Percent className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="ml-3 text-base font-semibold">ROI</h3>
            </div>
            <div className="text-3xl font-bold mb-1">
              {formatPercent(reportData.roi || 0)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avkastning på investering</p>
          </div>
          
          <div className="bg-white dark:bg-gray-950 border rounded-lg p-5 flex flex-col">
            <div className="flex items-center mb-5">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-md">
                <Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="ml-3 text-base font-semibold">Max kostnad</h3>
            </div>
            <div className="text-3xl font-bold mb-1">
              {formatCurrency(reportData.totalCost || 0, true)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total kostnad för interventionen</p>
          </div>
          
          <div className="bg-white dark:bg-gray-950 border rounded-lg p-5 flex flex-col">
            <div className="flex items-center mb-5">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-md">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="ml-3 text-base font-semibold">Total nytta</h3>
            </div>
            <div className="text-3xl font-bold mb-1">
              {formatCurrency((reportData.totalBenefit || 0) * 3, true)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Totalt värde av interventionen</p>
          </div>
        </div>
        
        {/* Extra rad med KPIer - Återbetalningstid och Minsta effekt */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="bg-white dark:bg-gray-950 border rounded-lg p-5 flex flex-col">
            <div className="flex items-center mb-5">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-md">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="ml-3 text-base font-semibold">Återbetalningstid</h3>
            </div>
            <div className="text-3xl font-bold mb-1">
              {formatMonths(breakEvenMonths)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tid till insatsen blir lönsam</p>
          </div>
          
          <div className="bg-white dark:bg-gray-950 border rounded-lg p-5 flex flex-col">
            <div className="flex items-center mb-5">
              <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-md">
                <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="ml-3 text-base font-semibold">Minsta effekt för break-even</h3>
            </div>
            <div className="text-3xl font-bold mb-1">
              {formatPercent(minEffectPercent)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Minskad andel av personal med hög stressnivå
            </p>
          </div>
        </div>
        
        {/* Rekommendationstext */}
        <div className="border rounded-lg p-5 mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-md mr-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base font-semibold">Rekommendation för beslut</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {reportData.recommendation || `Det föreslagna paketet med insatser krävs att andelen med hög stressnivå minskar med minst ${formatPercent(minEffectPercent)} vilket motsvarar en sänkning från 22% till ca ${(22 - minEffectPercent).toFixed(1)}% för att insatsen ska gå ihop sig. Allt över det är en besparing. Givet att organisationens anställda avsätter den tid som krävs bedöms minsta effekt rimlig att uppnå. Insatspaketet rekommenderas.`}
          </p>
        </div>
        
        {/* Diagram över avkastning över tid */}
        <div className="border rounded-lg p-5 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-md mr-3">
              <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold">Kostnads-nyttoanalys över tid</h3>
          </div>
          
          {/* Linjediagram över kostnader och avkastning */}
          <div className="h-80 relative mb-6">
            {/* Y-axel */}
            <div className="absolute left-0 top-0 h-full w-20 flex flex-col justify-between items-end pr-2">
              <span className="text-xs text-gray-500">{formatCurrency(maxValue, true)}</span>
              <span className="text-xs text-gray-500">{formatCurrency(maxValue/2, true)}</span>
              <span className="text-xs text-gray-500">0 kr</span>
              <span className="text-xs text-gray-500">{formatCurrency(minValue/2, true)}</span>
              <span className="text-xs text-gray-500">{formatCurrency(minValue, true)}</span>
            </div>
            
            {/* Graf-området */}
            <div className="absolute left-20 right-0 top-0 h-full">
              {/* Horisontella linjer */}
              <div className="absolute w-full h-0 border-t border-gray-200" style={{ top: `${yScale(maxValue)}%` }}></div>
              <div className="absolute w-full h-0 border-t border-gray-200" style={{ top: `${yScale(maxValue/2)}%` }}></div>
              <div className="absolute w-full h-0 border-t border-gray-300 border-dashed" style={{ top: `${yScale(0)}%` }}></div>
              <div className="absolute w-full h-0 border-t border-gray-200" style={{ top: `${yScale(minValue/2)}%` }}></div>
              <div className="absolute w-full h-0 border-t border-gray-200" style={{ top: `${yScale(minValue)}%` }}></div>
              
              {/* X-axel */}
              <div className="absolute w-full h-0.5 bg-gray-400" style={{ top: `${yScale(0)}%` }}></div>
              
              {/* Tidspunkter på x-axeln */}
              {yearlyData.map((point, index) => (
                <React.Fragment key={index}>
                  <div 
                    className="absolute h-2 w-0.5 bg-gray-400" 
                    style={{ 
                      left: `${(index / 3) * 100}%`,
                      top: `${yScale(0)}%`
                    }}
                  ></div>
                  <div 
                    className="absolute text-xs text-gray-500" 
                    style={{ 
                      left: `${(index / 3) * 100}%`, 
                      top: `${yScale(0) + 10}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {index === 0 ? 'Start' : `År ${index}`}
                  </div>
                </React.Fragment>
              ))}
              
              {/* Linjer för investering och avkastning */}
              <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                {/* Kumulativ linje */}
                <path 
                  d={yearlyData.map((point, index) => 
                    `${index === 0 ? 'M' : 'L'} ${(point.year / 3) * 100}% ${yScale(point.cumulative)}%`
                  ).join(' ')}
                  fill="none"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Investering linje */}
                <path 
                  d={`
                    M 0,${yScale(-yearlyData[0].investment)}
                    L ${(1/3) * 100}%,${yScale(0)}
                    L ${(2/3) * 100}%,${yScale(0)}
                    L 100%,${yScale(0)}
                  `}
                  fill="none"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  strokeLinejoin="round"
                />
                
                {/* Årlig avkastning linje */}
                <path 
                  d={`
                    M 0,${yScale(0)}
                    L ${(1/3) * 100}%,${yScale(yearlyData[1].benefit)}
                    L ${(2/3) * 100}%,${yScale(yearlyData[1].benefit)}
                    L 100%,${yScale(yearlyData[1].benefit)}
                  `}
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  strokeLinejoin="round"
                />
                
                {/* Punkter på kumulativ linje */}
                {yearlyData.map((point, index) => (
                  <circle 
                    key={`cumulative-${index}`}
                    cx={`${(point.year / 3) * 100}%`}
                    cy={`${yScale(point.cumulative)}%`}
                    r="5" 
                    fill="rgb(34, 197, 94)" 
                    stroke="white"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
              
              {/* Etiketter med värden */}
              {yearlyData.map((point, index) => (
                <div 
                  key={`label-${index}`}
                  className="absolute text-xs font-medium bg-white/90 dark:bg-gray-800/90 px-1 py-0.5 rounded shadow-sm border border-gray-200"
                  style={{ 
                    left: `${(point.year / 3) * 100}%`, 
                    top: `${yScale(point.cumulative) - 3}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  {index === 0 ? formatCurrency(-point.investment, true) : formatCurrency(point.cumulative, true)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Förklaring till linjerna */}
          <div className="flex flex-wrap gap-6 items-center justify-center mb-6 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-red-500 flex-shrink-0" style={{ backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 2px, rgb(239, 68, 68) 2px, rgb(239, 68, 68) 7px)' }}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Investering</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-blue-500 flex-shrink-0" style={{ backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 2px, rgb(59, 130, 246) 2px, rgb(59, 130, 246) 7px)' }}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Årlig avkastning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-green-500 flex-shrink-0 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Kumulativt resultat</span>
            </div>
          </div>
          
          {/* Data-tabell */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b">
                  <th className="text-left pb-3 font-medium">Tidsperiod</th>
                  <th className="text-right pb-3 font-medium">Investering</th>
                  <th className="text-right pb-3 font-medium">Avkastning</th>
                  <th className="text-right pb-3 font-medium">Nettoresultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                <tr>
                  <td className="py-3">År 1</td>
                  <td className="py-3 text-right text-red-500">-{formatCurrency(investment, true)}</td>
                  <td className="py-3 text-right text-green-500">+{formatCurrency(yearlyBenefit, true)}</td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(yearlyData[1].cumulative, true)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3">År 2</td>
                  <td className="py-3 text-right text-red-500">-{formatCurrency(0)}</td>
                  <td className="py-3 text-right text-green-500">+{formatCurrency(yearlyBenefit, true)}</td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(yearlyData[2].cumulative, true)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3">År 3</td>
                  <td className="py-3 text-right text-red-500">-{formatCurrency(0)}</td>
                  <td className="py-3 text-right text-green-500">+{formatCurrency(yearlyBenefit, true)}</td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(yearlyData[3].cumulative, true)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-medium border-t">
                  <td className="pt-3">Totalt 3 år</td>
                  <td className="pt-3 text-right text-red-500">-{formatCurrency(investment, true)}</td>
                  <td className="pt-3 text-right text-green-500">+{formatCurrency(yearlyBenefit * 3, true)}</td>
                  <td className="pt-3 text-right font-bold">
                    {formatCurrency(yearlyData[3].cumulative, true)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        {/* Auto-generated summary based on KPI data */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
          <h3 className="text-lg font-medium mb-3 flex items-center text-blue-800 dark:text-blue-300">
            <BarChart3 className="h-5 w-5 mr-2" />
            Slutsats
          </h3>
          <p className="text-blue-700 dark:text-blue-200 mb-5">
            {generateSummary()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RekommendationTab; 
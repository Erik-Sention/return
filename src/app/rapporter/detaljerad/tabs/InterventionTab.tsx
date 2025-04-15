import React from 'react';
import { 
  Target,
  Coins,
  ArrowRight
} from 'lucide-react';
import { ROIReportData} from '@/lib/reports/reportUtils';
import { getInterventionColor } from '@/lib/utils/interventionColors';
import { formatCurrency } from '@/lib/utils/format';

interface InterventionTabProps {
  reportData: ROIReportData;
}

export const InterventionTab: React.FC<InterventionTabProps> = ({ reportData }) => {
  // Hämta interventionskostnader från reportData.interventionCosts
  const hasInterventionCosts = reportData.interventionCosts && reportData.interventionCosts.length > 0;
  
  // Hämta interventioner från FormG om de finns i reportData.formGData
  const hasFormGInterventions = reportData.formGData?.interventions && reportData.formGData.interventions.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
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
                
                // Hämta färger för insatsen baserat på beskrivningen
                const { bg, border } = getInterventionColor(description);
                
                return (
                  <div 
                    key={index} 
                    className="rounded-lg p-4"
                    style={{ backgroundColor: `${bg}30`, borderLeft: `4px solid ${border}` }}
                  >
                    <div className="flex items-start">
                      <div 
                        className="min-w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm"
                        style={{ backgroundColor: border, color: 'white' }}
                      >
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
        </div>
      </div>
      
      {/* Visa kostnadsinformation om den finns tillgänglig */}
      {(hasInterventionCosts || hasFormGInterventions) && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Insatskostnader</h2>
          </div>
          
          {hasFormGInterventions && reportData.formGData && (
            <div className="space-y-6">
              {reportData.formGData.interventions.map((intervention, index) => {
                const { bg, border } = getInterventionColor(intervention.name);
                
                return (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: `${bg}20`, borderLeft: `4px solid ${border}` }}
                  >
                    <div className="flex items-center mb-3">
                      <div 
                        className="min-w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm"
                        style={{ backgroundColor: border, color: 'white' }}
                      >
                        {index + 1}
                      </div>
                      <h3 className="text-base font-semibold">{intervention.name}</h3>
                    </div>
                    
                    {intervention.description && (
                      <p className="text-sm mb-4 ml-10">{intervention.description}</p>
                    )}
                    
                    {intervention.costs && intervention.costs.length > 0 && (
                      <div className="ml-10 space-y-2">
                        <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium mb-1">
                          <div>Delinsats</div>
                          <div>Externa kostnader</div>
                          <div>Interna kostnader</div>
                          <div>Totalt</div>
                        </div>
                        
                        {intervention.costs.map((cost, costIndex) => (
                          <div key={costIndex} className="grid grid-cols-4 py-1 border-b border-muted/30 text-sm">
                            <div>{cost.name}</div>
                            <div>{formatCurrency(cost.externalCost || 0)}</div>
                            <div>{formatCurrency(cost.internalCost || 0)}</div>
                            <div className="font-medium">
                              {formatCurrency((cost.externalCost || 0) + (cost.internalCost || 0))}
                            </div>
                          </div>
                        ))}
                        
                        <div className="grid grid-cols-4 pt-2 text-sm font-medium" style={{ color: border }}>
                          <div>Totalt för insatsen</div>
                          <div>{formatCurrency(intervention.totalExternalCost)}</div>
                          <div>{formatCurrency(intervention.totalInternalCost)}</div>
                          <div className="font-bold">{formatCurrency(intervention.totalCost)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="grid grid-cols-4 font-semibold">
                  <div>Total insatskostnad</div>
                  <div>{formatCurrency(reportData.formGData.totalExternalCost || 0)}</div>
                  <div>{formatCurrency(reportData.formGData.totalInternalCost || 0)}</div>
                  <div className="text-primary font-bold">{formatCurrency(reportData.formGData.totalInterventionCost || 0)}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Visa interventionCosts från ROIReportData om formGData inte finns */}
          {!hasFormGInterventions && hasInterventionCosts && reportData.interventionCosts && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {reportData.interventionCosts.map((cost, index) => {
                  const { bg, border } = getInterventionColor(cost.description);
                  
                  return (
                    <div 
                      key={index} 
                      className="p-4 rounded-lg flex justify-between items-center"
                      style={{ backgroundColor: `${bg}20`, borderLeft: `4px solid ${border}` }}
                    >
                      <span className="font-medium">{cost.description}</span>
                      <span className="font-bold">{formatCurrency(cost.amount)}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20 flex justify-between items-center">
                <span className="font-semibold">Total insatskostnad</span>
                <span className="font-bold text-primary">
                  {formatCurrency(reportData.interventionCosts.reduce((total, cost) => total + cost.amount, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Visa minsta effekt för break-even */}
      {reportData.minEffectForBreakEvenAlt3 !== undefined && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <ArrowRight className="h-5 w-5" />
            <h3 className="font-medium">Minimieffekt för att nå break-even</h3>
          </div>
          <p className="text-sm mt-2 ml-7">
            {`${formatCurrency(reportData.totalCostAlt3 || 0)} investering kräver minst ${reportData.minEffectForBreakEvenAlt3.toFixed(1)}% minskning av stressnivåer för att nå break-even.`}
            <span className="block mt-1 text-slate-600 dark:text-slate-400">
              Detta är den minimala effekt som krävs för att investeringen ska täcka sina kostnader. All effekt utöver detta procenttal skulle ge en positiv avkastning.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default InterventionTab; 
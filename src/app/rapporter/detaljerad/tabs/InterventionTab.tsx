import React from 'react';
import { 
  Target
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
        </div>
      </div>
    </div>
  );
};

export default InterventionTab; 
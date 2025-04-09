import React from 'react';
import { 
  Zap, 
  LineChart, 
  Rocket, 
  Presentation, 
  ClipboardList
} from 'lucide-react';
import { ROIReportData } from '@/lib/reports/reportUtils';

interface GenomforandePlanTabProps {
  reportData: ROIReportData;
}

export const GenomforandePlanTab: React.FC<GenomforandePlanTabProps> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Genomförandeplan</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium mb-3">
            Er genomförandeplan
          </p>
          <p className="mb-6">
            {reportData.implementationPlan || 'Ingen genomförandeplan har angivits i formuläret.'}
          </p>
          
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-primary" />
              Interventionstrappa: Implementeringsguide
            </h3>
            
            <div className="relative">
              {/* Trappa bakgrund */}
              <div className="relative h-56 overflow-hidden">
                <div className="absolute h-10 w-full bottom-0 bg-blue-100 dark:bg-blue-900/40"></div>
                <div className="absolute h-10 w-4/5 bottom-10 bg-green-100 dark:bg-green-900/40"></div>
                <div className="absolute h-10 w-3/5 bottom-20 bg-yellow-100 dark:bg-yellow-900/40"></div>
                <div className="absolute h-10 w-2/5 bottom-30 bg-orange-100 dark:bg-orange-900/40"></div>
                <div className="absolute h-10 w-1/5 bottom-40 bg-red-100 dark:bg-red-900/40"></div>
                
                {/* Trappa text */}
                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-1 w-full px-4 text-center">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Steg 5: Kontinuerlig uppföljning och anpassning</span>
                </div>
                <div className="absolute left-2/5 transform -translate-x-1/2 bottom-11 w-full px-4 text-center">
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Steg 4: Implementering av kombinerade insatser</span>
                </div>
                <div className="absolute left-3/10 transform -translate-x-1/2 bottom-21 w-full px-4 text-center">
                  <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Steg 3: Förankring och utbildning</span>
                </div>
                <div className="absolute left-1/5 transform -translate-x-1/2 bottom-31 w-full px-4 text-center">
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Steg 2: Planering och målsättning</span>
                </div>
                <div className="absolute left-1/10 transform -translate-x-1/2 bottom-41 w-full px-4 text-center">
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Steg 1: Kartläggning</span>
                </div>
                
                {/* Trappa ikoner */}
                <div className="absolute right-4 bottom-1">
                  <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                    <LineChart className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                  </div>
                </div>
                <div className="absolute right-4 bottom-11">
                  <div className="w-8 h-8 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                    <Rocket className="h-4 w-4 text-green-700 dark:text-green-300" />
                  </div>
                </div>
                <div className="absolute right-4 bottom-21">
                  <div className="w-8 h-8 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center">
                    <Presentation className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
                  </div>
                </div>
                <div className="absolute right-4 bottom-31">
                  <div className="w-8 h-8 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center">
                    <ClipboardList className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
                <div className="absolute right-4 bottom-41">
                  <div className="w-8 h-8 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-red-700 dark:text-red-300" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-4 text-center">
              Källa: Nielsen et al. (2021), "Interventioner för psykosocial arbetsmiljö"
            </div>
          </div>
          
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Framgångsfaktorer för implementering</h3>
            <p className="text-sm mb-3">
              Forskning från Institutet för stressmedicin visar att följande faktorer är avgörande för framgångsrik implementering:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Förankring:</strong> Tydlig kommunikation av syfte och förväntat resultat till alla berörda</li>
              <li><strong>Pilottest:</strong> Testa insatser i mindre skala innan fullskalig implementering</li>
              <li><strong>Anpassningsbarhet:</strong> Möjlighet att justera efter feedback under implementeringen</li>
              <li><strong>Uppföljning:</strong> Regelbunden utvärdering mot uppsatta mål och korrigering vid behov</li>
              <li><strong>Långsiktighet:</strong> Integration i befintliga system och processer för hållbara resultat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenomforandePlanTab; 
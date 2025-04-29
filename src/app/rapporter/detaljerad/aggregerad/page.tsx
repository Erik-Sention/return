"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { NulageTab } from '../tabs/NulageTab';
import { OrsakTab } from '../tabs/OrsakTab';
import { SyfteTab } from '../tabs/SyfteTab';
import { MalTab } from '../tabs/MalTab';
import { MalgruppTab } from '../tabs/MalgruppTab';
import { InterventionTab } from '../tabs/InterventionTab';
import { GenomforandePlanTab } from '../tabs/GenomforandePlanTab';
import { RekommendationTab } from '../tabs/RekommendationTab';
import { NyckeltalsTab } from '../tabs/NyckeltalsTab';
import { TabContent } from '../components/TabContent';
import Image from 'next/image';

// CSS för att hantera sidbrytningar vid utskrift
const printStyles = `
  @media print {
    /* Globala utskriftsinställningar */
    @page {
      margin: 1cm;
      size: A4;
    }
    
    body {
      font-size: 12pt;
    }
    
    /* Förstasidan */
    #frontpage {
      page-break-after: always;
      break-after: page;
    }
    
    /* Innehållsförteckning */
    #top {
      page-break-after: always;
      break-after: page;
    }
    
    /* Huvudsektioner - börja på ny sida */
    #nulage, #orsaksanalys, #syfte, #malsattning, #malgrupp, #intervention, #genomforandeplan, #rekommendation, #nyckeltal {
      page-break-before: always;
      break-before: page;
    }
    
    /* Se till att vissa element inte delas vid sidbrytning */
    h2, h3, h4 {
      page-break-after: avoid;
      break-after: avoid;
    }
    
    /* Undvik sidbrytning inuti dessa element */
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    /* Dölj navigeringsknappar och andra UI-element vid utskrift */
    .no-print {
      display: none !important;
    }
    
    /* För att förhindra att tabeller bryts */
    table {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    /* För att förhindra att diagram bryts */
    .chart-container, [class*="ChartCard"] {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`;

export default function AggregatedReportPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Komponent för navigering tillbaka till toppen
  const BackToTopButton = () => (
    <div className="flex justify-end mt-4 pb-2 pr-4 no-print">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={scrollToTop} 
        className="text-xs gap-1 text-muted-foreground hover:text-primary"
      >
        <ArrowUp className="h-3 w-3" />
        Tillbaka till toppen
      </Button>
    </div>
  );

  return (
    <TabContent>
      {(reportData) => (
        <div className="space-y-8 pb-12 max-w-[1000px] mx-auto">
          {/* Lägg till style-tagg för utskriftsstil */}
          <style dangerouslySetInnerHTML={{ __html: printStyles }} />
          
          {/* Förstasida */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-lg p-8 min-h-[800px] flex flex-col" id="frontpage">
            <div className="flex justify-center mb-6 mt-8">
              <div className="text-center">
                <div className="text-sm font-medium tracking-widest text-muted-foreground uppercase mb-1">Forskningsbaserad ROI-analys</div>
              </div>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="relative h-32 w-64">
                <Image 
                  src="https://i.postimg.cc/FRwbMSBN/SENTION-logo-Black-Transparent-BG.png" 
                  alt="SENTION Logo"
                  width={256}
                  height={128}
                  className="h-full w-full object-contain dark:hidden"
                />
                <Image 
                  src="https://i.postimg.cc/pT99VK0C/SENTION-logo-White-text-Transparent.png" 
                  alt="SENTION Logo" 
                  width={256}
                  height={128}
                  className="h-full w-full object-contain hidden dark:block"
                />
              </div>
            </div>
            
            <div className="text-center mb-16 mt-6">
              <h1 className="text-4xl font-bold mb-2">Avkastning på hälsofrämjande investeringar</h1>
              <div className="h-1 w-32 bg-primary mx-auto my-6"></div>
              <p className="text-xl">Psykosocial arbetsmiljö och stress</p>
            </div>
            
            <div className="flex-grow"></div>
            
            <div className="border rounded-lg p-6 mb-6 bg-muted/20">
              <h2 className="text-lg font-semibold mb-4">Organisationsuppgifter</h2>
              
              <div className="grid gap-4">
                <div className="flex">
                  <div className="w-1/3 font-medium">Organisation:</div>
                  <div>{reportData?.sharedFields?.organizationName || 'Ej angiven'}</div>
                </div>
                
                <div className="flex">
                  <div className="w-1/3 font-medium">Kontaktperson:</div>
                  <div>{reportData?.sharedFields?.contactPerson || 'Ej angiven'}</div>
                </div>
                
                <div className="flex">
                  <div className="w-1/3 font-medium">Tidsperiod:</div>
                  <div>{reportData?.sharedFields?.startDate && reportData?.sharedFields?.endDate
                    ? `${reportData.sharedFields.startDate} - ${reportData.sharedFields.endDate}`
                    : (reportData?.timePeriod || 'Ej angiven')
                  }</div>
                </div>
                
                <div className="flex">
                  <div className="w-1/3 font-medium">Datum:</div>
                  <div>{(() => {
                    const today = new Date();
                    const day = today.getDate();
                    const month = today.getMonth();
                    const year = today.getFullYear();
                    
                    // Swedish month names
                    const monthNames = [
                      'januari', 'februari', 'mars', 'april', 'maj', 'juni', 
                      'juli', 'augusti', 'september', 'oktober', 'november', 'december'
                    ];
                    
                    return `${day} ${monthNames[month]} ${year}`;
                  })()}</div>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>© SENTION {new Date().getFullYear()}</p>
              <p className="mt-1">All data behandlas konfidentiellt</p>
            </div>
          </div>

          {/* Innehållsförteckning */}
          <div className="bg-white border rounded-lg p-6" id="top">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Komplett ROI-rapport</h1>
            </div>
            <p className="text-muted-foreground mb-6">
              Denna rapport sammanställer alla delar från den detaljerade rapporteringen 
              och ger en heltäckande bild av den forskningsbaserade ROI-analysen.
            </p>
            
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Innehållsförteckning</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <p>1. Nuläge</p>
                  <p>2. Orsaksanalys</p>
                  <p>3. Syfte med insatserna</p>
                </div>
                <div className="space-y-2">
                  <p>4. Målsättning</p>
                  <p>5. Målgrupp</p>
                  <p>6. Intervention</p>
                </div>
                <div className="space-y-2">
                  <p>7. Genomförandeplan</p>
                  <p>8. Rekommendation</p>
                  <p>9. Nyckeltal</p>
                </div>
              </div>
              
              {/* Osynliga navigeringsknappar som inte syns i PDF men fungerar för att navigera på webben */}
              <div className="sr-only">
                <span id="nulage-link" onClick={() => scrollToSection('nulage')}></span>
                <span id="orsaksanalys-link" onClick={() => scrollToSection('orsaksanalys')}></span>
                <span id="syfte-link" onClick={() => scrollToSection('syfte')}></span>
                <span id="malsattning-link" onClick={() => scrollToSection('malsattning')}></span>
                <span id="malgrupp-link" onClick={() => scrollToSection('malgrupp')}></span>
                <span id="intervention-link" onClick={() => scrollToSection('intervention')}></span>
                <span id="genomforandeplan-link" onClick={() => scrollToSection('genomforandeplan')}></span>
                <span id="rekommendation-link" onClick={() => scrollToSection('rekommendation')}></span>
                <span id="nyckeltal-link" onClick={() => scrollToSection('nyckeltal')}></span>
              </div>
            </div>
          </div>

          {/* Nuläge-sektion */}
          <div className="scroll-mt-20" id="nulage">
            <div className="bg-white border rounded-lg avoid-break">
              <NulageTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Orsaksanalys-sektion */}
          <div className="scroll-mt-20" id="orsaksanalys">
            <div className="bg-white border rounded-lg avoid-break">
              <OrsakTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Syfte-sektion */}
          <div className="scroll-mt-20" id="syfte">
            <div className="bg-white border rounded-lg avoid-break">
              <SyfteTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Målsättning-sektion */}
          <div className="scroll-mt-20" id="malsattning">
            <div className="bg-white border rounded-lg avoid-break">
              <MalTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Målgrupp-sektion */}
          <div className="scroll-mt-20" id="malgrupp">
            <div className="bg-white border rounded-lg avoid-break">
              <MalgruppTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Intervention-sektion */}
          <div className="scroll-mt-20" id="intervention">
            <div className="bg-white border rounded-lg avoid-break">
              <InterventionTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Genomförandeplan-sektion */}
          <div className="scroll-mt-20" id="genomforandeplan">
            <div className="bg-white border rounded-lg avoid-break">
              <GenomforandePlanTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Rekommendation-sektion */}
          <div className="scroll-mt-20" id="rekommendation">
            <div className="bg-white border rounded-lg avoid-break">
              <RekommendationTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Nyckeltal-sektion */}
          <div className="scroll-mt-20" id="nyckeltal">
            <div className="bg-white border rounded-lg avoid-break">
              <NyckeltalsTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>
        </div>
      )}
    </TabContent>
  );
} 
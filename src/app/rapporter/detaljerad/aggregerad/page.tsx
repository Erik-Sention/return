"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, ArrowUp } from 'lucide-react';
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
import { exportROIToPdf } from '@/lib/reports/pdfExport';
import { useAuth } from '@/contexts/AuthContext';
import { ROIReportData } from '@/lib/reports/reportUtils';
import Image from 'next/image';

export default function AggregatedReportPage() {
  const { currentUser } = useAuth();

  // Specialversion av PDF-exportfunktionen för aggregerad rapport
  const handleExportAggregatedPdf = async (reportData: ROIReportData) => {
    try {
      if (!reportData) {
        alert('Ingen rapport-data tillgänglig. Försök igen senare.');
        return;
      }
      
      // Skapa en kopia av report data med speciellt anpassad data för den aggregerade versionen
      const aggregatedReportData = {
        ...reportData,
        // Lägger till speciella flaggor för att hantera aggregerad rapport i PDF-exporten
        isAggregatedReport: true,
        // Överskrider delar av sharedFields om det behövs
        sharedFields: {
          ...reportData.sharedFields,
          organizationName: 'Demo Alltjänst',
          contactPerson: 'Erik Helsing'
        },
        // Sätt explicit tidsperiod
        timePeriod: '2025-01-01 - 2026-01-01'
      };
      
      // Använd den vanliga exportfunktionen med vår anpassade data
      await exportROIToPdf(aggregatedReportData, currentUser?.uid);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Ett fel uppstod vid export till PDF. Försök igen senare.');
    }
  };

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
    <div className="flex justify-end mt-4 pb-2 pr-4">
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
                  <div>Demo Alltjänst</div>
                </div>
                
                <div className="flex">
                  <div className="w-1/3 font-medium">Kontaktperson:</div>
                  <div>Erik Helsing</div>
                </div>
                
                <div className="flex">
                  <div className="w-1/3 font-medium">Tidsperiod:</div>
                  <div>2025-01-01 - 2026-01-01</div>
                </div>
                
                <div className="flex">
                  <div className="w-1/3 font-medium">Datum:</div>
                  <div>10 april 2025</div>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>© SENTION {new Date().getFullYear()}</p>
              <p className="mt-1">All data behandlas konfidentiellt</p>
            </div>
          </div>

          {/* Innehållsförteckning */}
          <div className="bg-card border rounded-lg p-6" id="top">
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
            <div className="bg-muted py-3 px-6 rounded-t-lg border border-border">
              <h2 className="text-xl font-semibold">1. Nuläge</h2>
            </div>
            <div className="border-x border-b border-border rounded-b-lg">
              <NulageTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Orsaksanalys-sektion */}
          <div className="scroll-mt-20" id="orsaksanalys">
            <div className="bg-muted py-3 px-6 rounded-t-lg border border-border">
              <h2 className="text-xl font-semibold">2. Orsaksanalys</h2>
            </div>
            <div className="border-x border-b border-border rounded-b-lg">
              <OrsakTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Syfte-sektion */}
          <div className="scroll-mt-20" id="syfte">
            <div className="bg-muted py-3 px-6 rounded-t-lg border border-border">
              <h2 className="text-xl font-semibold">3. Syfte med insatserna</h2>
            </div>
            <div className="border-x border-b border-border rounded-b-lg">
              <SyfteTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Målsättning-sektion */}
          <div className="scroll-mt-20" id="malsattning">
            <div className="bg-muted py-3 px-6 rounded-t-lg border border-border">
              <h2 className="text-xl font-semibold">4. Målsättning</h2>
            </div>
            <div className="border-x border-b border-border rounded-b-lg">
              <MalTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Målgrupp-sektion */}
          <div className="scroll-mt-20" id="malgrupp">
            <div className="bg-muted py-3 px-6 rounded-t-lg border border-border">
              <h2 className="text-xl font-semibold">5. Målgrupp</h2>
            </div>
            <div className="border-x border-b border-border rounded-b-lg">
              <MalgruppTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Intervention-sektion */}
          <div className="scroll-mt-20" id="intervention">
            <div className="bg-muted py-3 px-6 rounded-t-lg border border-border">
              <h2 className="text-xl font-semibold">6. Intervention</h2>
            </div>
            <div className="border-x border-b border-border rounded-b-lg">
              <InterventionTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Genomförandeplan-sektion */}
          <div className="scroll-mt-20" id="genomforandeplan">
            <div className="bg-muted py-3 px-6 rounded-t-lg border border-border">
              <h2 className="text-xl font-semibold">7. Genomförandeplan</h2>
            </div>
            <div className="border-x border-b border-border rounded-b-lg">
              <GenomforandePlanTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Rekommendation-sektion */}
          <div className="scroll-mt-20" id="rekommendation">
            <div className="bg-muted py-3 px-6 rounded-t-lg border border-border">
              <h2 className="text-xl font-semibold">8. Rekommendation</h2>
            </div>
            <div className="border-x border-b border-border rounded-b-lg">
              <RekommendationTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>

          {/* Nyckeltal-sektion */}
          <div className="scroll-mt-20" id="nyckeltal">
            <div className="bg-muted py-3 px-6 rounded-t-lg border border-border">
              <h2 className="text-xl font-semibold">9. Nyckeltal</h2>
            </div>
            <div className="border-x border-b border-border rounded-b-lg">
              <NyckeltalsTab reportData={reportData} />
              <BackToTopButton />
            </div>
          </div>
        </div>
      )}
    </TabContent>
  );
} 
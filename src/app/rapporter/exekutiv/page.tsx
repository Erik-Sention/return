"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ChartCard } from '@/components/ui/chart-card';
import { StatItem } from '@/components/ui/stat-item';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, CreditCard, Percent, Clock, Target, Package, LineChart, AlertTriangle, CheckCircle, Users, Calendar, ChevronLeft, FileText, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { loadROIReportData, formatCurrency, formatPercent, formatMonths, ROIReportData } from '@/lib/reports/reportUtils';
import { exportROIToPdf } from '@/lib/reports/pdfExport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { database } from '@/lib/firebase/config';
import { ref, get, child } from 'firebase/database';

// Hjälpfunktion för att generera slutsats
function generateConclusion(data: ROIReportData | null): string {
  // Om data saknas helt
  if (!data) {
    return 'Baserat på tillgänglig data kan vi inte fastställa en ROI-analys. Vänligen fyll i både kostnader och fördelar för att generera en slutsats.';
  }
  
  // För ROI-beräkning (alternativ 1)
  if (data.totalCost <= 0 || data.totalBenefit <= 0) {
    return 'Baserat på tillgänglig data kan vi inte fastställa en fullständig ROI-analys. Vänligen fyll i både kostnader och fördelar för att generera en slutsats.';
  }
  
  const costText = formatCurrency(data.totalCost);
  const benefitText = formatCurrency(data.totalBenefit);
  const roiText = data.roi ? formatPercent(data.roi) : "0%";
  const paybackText = data.paybackPeriod ? formatMonths(data.paybackPeriod) : "okänd tid";
  
  // Om ROI är positiv
  if (data.roi && data.roi > 0) {
    let strengthText = '';
    
    // Bedöm styrkan på ROI
    if (data.roi >= 200) {
      strengthText = 'extremt stark';
    } else if (data.roi >= 100) {
      strengthText = 'mycket stark';
    } else if (data.roi >= 50) {
      strengthText = 'stark';
    } else if (data.roi >= 20) {
      strengthText = 'god';
    } else {
      strengthText = 'positiv';
    }
    
    // Analysera återbetalningstiden
    let paybackAnalysis = '';
    if (data.paybackPeriod) {
      if (data.paybackPeriod < 3) {
        paybackAnalysis = 'Återbetalningstiden är mycket kort, vilket gör detta till en investering med låg risk.';
      } else if (data.paybackPeriod < 12) {
        paybackAnalysis = 'Återbetalningstiden är rimlig och inom ett år, vilket är lovande för denna typ av intervention.';
      } else {
        paybackAnalysis = `Återbetalningstiden på ${paybackText} är relativt lång, men investeringen ger ändå ett positivt resultat över tid.`;
      }
    }
    
    // Skapa en detaljerad slutsats
    return `Analysen visar en ${strengthText} avkastning på ${roiText} för investeringen på ${costText}. 
Det innebär att varje investerad krona genererar ${data.roi/100 + 1} kronor i värde. 
Det totala värdet av interventionen uppskattas till ${benefitText}.
${paybackAnalysis}
Baserat på denna analys rekommenderas investeringen som en ekonomiskt fördelaktig åtgärd.`;
  } 
  // Om ROI är 0 eller negativ
  else {
    return `ROI-beräkningen visar att investeringen på ${costText} inte ger en positiv ekonomisk avkastning jämfört med det förväntade värdet på ${benefitText}.
Detta betyder dock inte nödvändigtvis att interventionen saknar värde, då vissa fördelar kan vara svåra att kvantifiera ekonomiskt. 
Vi rekommenderar en fördjupad analys med fokus på både ekonomiska och icke-ekonomiska fördelar innan ett beslut fattas.`;
  }
}

// Enkel Loading-komponent
const Loading = () => (
  <div className="flex justify-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

export default function ExekutivSammanfattningPage() {
  const { currentUser, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [reportData, setReportData] = useState<ROIReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("roi");
  const [formDData, setFormDData] = useState<{
    organizationName?: string;
    contactPerson?: string;
    startDate?: string;
    endDate?: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Om användaren inte är inloggad och laddningen är klar, redirecta till login
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // Ladda rapportdata när användaren är inloggad
  useEffect(() => {
    const fetchReportData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await loadROIReportData(currentUser.uid);
        setReportData(data);
        
        if (!data) {
          setError('Ingen data hittades. Fyll i formulären först.');
        }
      } catch (error) {
        console.error('Error loading report data:', error);
        setError('Ett fel uppstod när data skulle laddas.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (mounted && currentUser) {
      fetchReportData();
    }
  }, [currentUser, mounted]);
  
  // Ladda FormD-data separat för att säkerställa att vi alltid har senaste informationen
  useEffect(() => {
    const fetchFormDData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const dbRef = ref(database);
        const formDPath = `users/${currentUser.uid}/forms/D`;
        const formDSnapshot = await get(child(dbRef, formDPath));
        
        if (formDSnapshot.exists()) {
          const data = formDSnapshot.val();
          setFormDData({
            organizationName: data.organizationName,
            contactPerson: data.contactPerson,
            startDate: data.startDate,
            endDate: data.endDate
          });
        }
      } catch (error) {
        console.error('Error loading FormD data:', error);
        // Fallera tyst - använd reportData om FormD inte kan laddas
      }
    };
    
    if (mounted && currentUser) {
      fetchFormDData();
    }
  }, [currentUser, mounted]);

  // Funktion för att hantera PDF-export
  const handleExportPdf = async () => {
    if (!reportData || !currentUser) return;
    
    try {
      await exportROIToPdf(reportData, currentUser.uid);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Ett fel uppstod vid export till PDF. Försök igen senare.');
    }
  };

  // Generera slutsats baserat på rapporten och vald flik
  const getConclusion = () => {
    switch (activeTab) {
      case "roi":
        return generateConclusion(reportData);
      case "max-kostnad":
        return `Maximal kostnad för break-even

Med den förväntade minskningen av stressnivån på ${formatPercent(reportData?.reducedStressPercentageAlt2 || 0)} och den totala kostnaden för psykisk ohälsa på ${formatCurrency(reportData?.totalMentalHealthCostAlt2 || 0)} kr per år, blir den maximala kostnaden för insatsen ${formatCurrency(reportData?.totalCostAlt2 || 0)} kr.

Detta representerar den högsta investering som kan göras med given effekt för att fortfarande nå break-even (ROI = 0%). All investering över detta belopp skulle ge en negativ avkastning, medan en lägre investering skulle ge en positiv ROI.`;
      case "min-effekt":
        return `Minsta effekt för break-even

Med nuvarande investering på ${formatCurrency(reportData?.totalCostAlt3 || 0)} kr och den totala kostnaden för psykisk ohälsa på ${formatCurrency(reportData?.totalMentalHealthCostAlt3 || 0)} kr per år, måste stressnivån minska med minst ${formatPercent(reportData?.minEffectForBreakEvenAlt3 || 0)} för att nå break-even (ROI = 0%).

Detta är den minimala effekt som krävs för att investeringen ska täcka sina kostnader. All effekt utöver detta procenttal skulle ge en positiv avkastning.`;
      default:
        return generateConclusion(reportData);
    }
  };

  // Hjälpfunktion för att kombinera data från FormD och reportData
  const getOrganizationInfo = () => {
    // Om vi har data från FormD, använd den först
    const organizationName = formDData?.organizationName || 
                           reportData?.sharedFields?.organizationName || 
                           'Organisationsnamn saknas';
    
    const contactPerson = formDData?.contactPerson || 
                         reportData?.sharedFields?.contactPerson || 
                         'Kontaktperson saknas';
    
    // Skapa tidsperiod från FormD om det finns
    let timePeriod = reportData?.timePeriod;
    if (formDData?.startDate && formDData?.endDate) {
      timePeriod = `${formDData.startDate} - ${formDData.endDate}`;
    }
    
    return { organizationName, contactPerson, timePeriod };
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl">Laddar...</div>
      </div>
    );
  }

  // Om användaren inte är inloggad, visa ingenting (vi redirectar ändå)
  if (!currentUser) {
    return null;
  }

  // Om data laddas, visa laddningsindikator
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/rapporter">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till rapporter
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-xl">Laddar rapportdata...</div>
        </div>
      </div>
    );
  }

  // Om det uppstod ett fel, visa felmeddelande
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/rapporter">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till rapporter
            </Button>
          </Link>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Data saknas</h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <p className="text-gray-600 dark:text-gray-400">Fyll i ROI-formulären för att generera en rapport.</p>
          <div className="mt-6">
            <Link href="/roi">
              <Button>Gå till ROI-formulären</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Om det inte finns någon data att visa
  if (!reportData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/rapporter">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till rapporter
            </Button>
          </Link>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-2">Ingen data hittad</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Du behöver fylla i ROI-formulären för att se en exekutiv sammanfattning.
          </p>
          <div className="mt-6">
            <Link href="/roi">
              <Button>Gå till ROI-formulären</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/rapporter')} variant="outline" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Tillbaka till rapporter
          </Button>
          <h1 className="text-3xl font-bold">Exekutiv sammanfattning</h1>
        </div>
        <Button onClick={handleExportPdf} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Exportera PDF
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : !currentUser ? (
        <div className="bg-muted/30 rounded-lg p-6 text-center border border-border">
          <p>Du måste vara inloggad för att se denna rapport.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">Logga in</Button>
        </div>
      ) : !reportData ? (
        <Loading />
      ) : (
        <>
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {/* Använd kombinerad data från FormD och reportData */}
                <h2 className="text-2xl font-bold">{getOrganizationInfo().organizationName}</h2>
                <p className="text-muted-foreground">Kontaktperson: {getOrganizationInfo().contactPerson}</p>
                {getOrganizationInfo().timePeriod && <p className="text-muted-foreground">Period: {getOrganizationInfo().timePeriod}</p>}
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex items-center gap-2 text-xl font-semibold rounded-full px-4 py-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">
                  <Percent className="h-5 w-5" />
                  <span>
                    {reportData.roi ? formatPercent(reportData.roi) : "0%"}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground ml-1">Avkastning</span>
                </div>
                <div className="flex items-center gap-2 text-xl font-semibold rounded-full px-4 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                  <CreditCard className="h-5 w-5" />
                  <span>
                    {formatCurrency(reportData?.totalCostAlt2 || 0)}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground ml-1">Max kostnad</span>
                </div>
                <div className="flex items-center gap-2 text-xl font-semibold rounded-full px-4 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                  <TrendingDown className="h-5 w-5" />
                  <span>
                    {reportData?.minEffectForBreakEvenAlt3 !== undefined ? formatPercent(reportData?.minEffectForBreakEvenAlt3 || 0) : "N/A"}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground ml-1">Minsta effekt</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full gap-2 bg-transparent p-0 flex mb-4">
                <TabsTrigger 
                  value="roi"
                  className="flex-1 font-medium rounded-md border border-border/80 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:ring-2 hover:ring-primary/20 hover:scale-[1.05] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary/30 transition-all"
                >
                  ROI
                </TabsTrigger>
                <TabsTrigger 
                  value="max-kostnad"
                  className="flex-1 font-medium rounded-md border border-border/80 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:ring-2 hover:ring-primary/20 hover:scale-[1.05] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary/30 transition-all"
                >
                  Max kostnad
                </TabsTrigger>
                <TabsTrigger 
                  value="min-effekt"
                  className="flex-1 font-medium rounded-md border border-border/80 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:ring-2 hover:ring-primary/20 hover:scale-[1.05] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary/30 transition-all"
                >
                  Förutsättning
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="roi" className="mt-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <ChartCard 
                    title="Total kostnad"
                    icon={<CreditCard className="h-5 w-5" />}
                    variant="blue"
                  >
                    <StatItem 
                      label="Investering"
                      value={formatCurrency(reportData?.totalCost || 0)}
                      description="Total kostnad för interventionen"
                      variant="blue"
                    />
                  </ChartCard>
                  
                  <ChartCard 
                    title="Total nytta"
                    icon={<Activity className="h-5 w-5" />}
                    variant="green"
                  >
                    <StatItem 
                      label="Värde"
                      value={formatCurrency(reportData?.totalBenefit || 0)}
                      description="Totalt värde av interventionen"
                      variant="green"
                    />
                  </ChartCard>
                  
                  <ChartCard 
                    title="ROI"
                    icon={<Percent className="h-5 w-5" />}
                    variant="purple"
                  >
                    <StatItem 
                      label="Avkastning på investering"
                      value={reportData?.roi ? formatPercent(reportData.roi) : "0%"}
                      description="Return on Investment"
                      variant="purple"
                    />
                  </ChartCard>
                  
                  <ChartCard 
                    title="Återbetalningstid"
                    icon={<Clock className="h-5 w-5" />}
                    variant="orange"
                  >
                    <StatItem 
                      label="Payback-period"
                      value={reportData?.paybackPeriod ? formatMonths(reportData.paybackPeriod) : "N/A"}
                      description="Tid till kostnaden är återbetald"
                      variant="orange"
                    />
                  </ChartCard>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                </p>
              </TabsContent>
              
              <TabsContent value="max-kostnad" className="mt-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <ChartCard 
                    title="Max kostnad"
                    icon={<CreditCard className="h-5 w-5" />}
                    variant="blue"
                  >
                    <StatItem 
                      label="Maximal investeringskostnad"
                      value={formatCurrency(reportData?.totalCostAlt2 || 0)}
                      description="För att nå break-even"
                      variant="blue"
                    />
                  </ChartCard>
                  
                  <ChartCard 
                    title="Total ohälsokostnad"
                    icon={<Activity className="h-5 w-5" />}
                    variant="green"
                  >
                    <StatItem 
                      label="Total kostnad psykisk ohälsa"
                      value={formatCurrency(reportData?.totalMentalHealthCostAlt2 || 0)}
                      description="Kostnad per år"
                      variant="green"
                    />
                  </ChartCard>
                  
                  <ChartCard 
                    title="Minskad stressnivå"
                    icon={<TrendingDown className="h-5 w-5" />}
                    variant="purple"
                  >
                    <StatItem 
                      label="Minskad andel med stresssymptom"
                      value={formatPercent(reportData?.reducedStressPercentageAlt2 || 0)}
                      description="Förväntad minskning"
                      variant="purple"
                    />
                  </ChartCard>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Beräkning av maximal kostnad för att nå break-even (ROI = 0%)
                </p>
              </TabsContent>
              
              <TabsContent value="min-effekt" className="mt-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <ChartCard 
                    title="Investeringskostnad"
                    icon={<CreditCard className="h-5 w-5" />}
                    variant="blue"
                  >
                    <StatItem 
                      label="Total kostnad för insatsen"
                      value={formatCurrency(reportData?.totalCostAlt3 || 0)}
                      description="Nuvarande investering"
                      variant="blue"
                    />
                  </ChartCard>
                  
                  <ChartCard 
                    title="Total ohälsokostnad"
                    icon={<Activity className="h-5 w-5" />}
                    variant="green"
                  >
                    <StatItem 
                      label="Total kostnad psykisk ohälsa"
                      value={formatCurrency(reportData?.totalMentalHealthCostAlt3 || 0)}
                      description="Kostnad per år"
                      variant="green"
                    />
                  </ChartCard>
                  
                  <ChartCard 
                    title="Minsta effekt"
                    icon={<TrendingDown className="h-5 w-5" />}
                    variant="purple"
                  >
                    <StatItem 
                      label="Minsta effekt för break-even"
                      value={reportData?.minEffectForBreakEvenAlt3 !== undefined ? formatPercent(reportData?.minEffectForBreakEvenAlt3 || 0) : "N/A"}
                      description="Minskad andel med stresssymptom"
                      variant="purple"
                    />
                  </ChartCard>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Beräkning av minsta effekt som krävs för att nå break-even (ROI = 0%)
                </p>
              </TabsContent>
            </Tabs>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <ChartCard 
              title="Nuläge"
              icon={<LineChart className="h-5 w-5" />}
              variant="blue"
              className="h-full"
            >
              <div className="prose dark:prose-invert max-w-none">
                <p>{reportData.currentSituation || 'Ingen information om nuläget.'}</p>
                
                {(reportData.stressPercentage || reportData.productionLossValue || reportData.sickLeaveValue) && (
                  <div className="mt-4 space-y-3">
                    {reportData.stressPercentage !== undefined && (
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="text-sm font-medium">Andel av personalen med hög stressnivå:</span>
                        <span className="font-semibold">{formatPercent(reportData.stressPercentage)}</span>
                      </div>
                    )}
                    
                    {reportData.productionLossValue !== undefined && (
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="text-sm font-medium">Värde av produktionsbortfall:</span>
                        <span className="font-semibold">{formatCurrency(reportData.productionLossValue)}/år</span>
                      </div>
                    )}
                    
                    {reportData.sickLeaveValue !== undefined && (
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="text-sm font-medium">Kostnad för sjukfrånvaro:</span>
                        <span className="font-semibold">{formatCurrency(reportData.sickLeaveValue)}/år</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ChartCard>
            
            <ChartCard 
              title="Orsaksanalys"
              icon={<AlertTriangle className="h-5 w-5" />}
              variant="orange"
              className="h-full"
            >
              <div className="prose dark:prose-invert max-w-none">
                <p>{reportData.causeAnalysis || 'Ingen orsaksanalys specificerad.'}</p>
              </div>
            </ChartCard>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <ChartCard 
              title="Syfte med insatserna"
              icon={<Target className="h-5 w-5" />}
              variant="blue"
              className="h-full"
            >
              <div className="prose dark:prose-invert max-w-none">
                <p>{reportData.interventionPurpose || 'Inget syfte specificerat.'}</p>
              </div>
            </ChartCard>
            
            <ChartCard 
              title="Målsättning"
              icon={<Target className="h-5 w-5" />}
              variant="green"
              className="h-full"
            >
              <div className="prose dark:prose-invert max-w-none">
                <p>{reportData.goalsDescription || 'Ingen information om målsättningen.'}</p>
              </div>
            </ChartCard>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <ChartCard 
              title="Målgrupp"
              icon={<Users className="h-5 w-5" />}
              variant="purple"
              className="h-full"
            >
              <div className="prose dark:prose-invert max-w-none">
                <p>{reportData.targetGroup || 'Ingen målgrupp specificerad.'}</p>
              </div>
            </ChartCard>
            
            <ChartCard 
              title="Intervention"
              icon={<Package className="h-5 w-5" />}
              variant="purple"
            >
              <div className="prose dark:prose-invert max-w-none">
                {(!reportData.interventionDescription && !reportData.interventionsArray) || 
                  (reportData.interventionDescription?.trim() === '' && (!reportData.interventionsArray || reportData.interventionsArray.length === 0)) ? (
                  <p>Ingen beskrivning av interventionen.</p>
                ) : (
                  <ol className="list-decimal pl-4 space-y-1">
                    {reportData.interventionsArray ? 
                      // Om vi har den ursprungliga arrayen, använd den
                      reportData.interventionsArray.map((intervention, index) => (
                        <li key={index} className="text-sm">{intervention}</li>
                      ))
                      : 
                      // Annars, försök dela upp kommaseparerad sträng
                      reportData.interventionDescription?.split(',').map((intervention, index) => (
                        <li key={index} className="text-sm">{intervention.trim()}</li>
                      ))
                    }
                  </ol>
                )}
                
                {reportData.interventionCosts && reportData.interventionCosts.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Kostnadsfördelning</h4>
                    <ul className="space-y-2">
                      {reportData.interventionCosts.map((cost, index) => (
                        <li key={index} className="flex justify-between items-center border-b border-border pb-2">
                          <span className="text-sm">{cost.description}</span>
                          <span className="font-medium">{formatCurrency(cost.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ChartCard>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <ChartCard 
              title="Genomförandeplan"
              icon={<Calendar className="h-5 w-5" />}
              variant="orange"
              className="h-full"
            >
              <div className="prose dark:prose-invert max-w-none">
                {(!reportData.implementationPlan && !reportData.implementationPlanArray) || 
                  (reportData.implementationPlan?.trim() === '' && (!reportData.implementationPlanArray || reportData.implementationPlanArray.length === 0)) ? (
                  <p>Ingen genomförandeplan specificerad.</p>
                ) : (
                  <ol className="list-decimal pl-4 space-y-1">
                    {reportData.implementationPlanArray ? 
                      // Om vi har den ursprungliga arrayen, använd den
                      reportData.implementationPlanArray.map((step, index) => (
                        <li key={index} className="text-sm">{step}</li>
                      ))
                      : 
                      // Annars, försök dela upp kommaseparerad sträng
                      reportData.implementationPlan?.split(',').map((step, index) => (
                        <li key={index} className="text-sm">{step.trim()}</li>
                      ))
                    }
                  </ol>
                )}
              </div>
            </ChartCard>
            
            <ChartCard 
              title="Rekommendation för beslut"
              icon={<CheckCircle className="h-5 w-5" />}
              variant="green"
              className="h-full"
            >
              <div className="prose dark:prose-invert max-w-none">
                <p>{reportData.recommendation || 'Ingen rekommendation specificerad.'}</p>
              </div>
            </ChartCard>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-2">Slutsats</h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-line">{getConclusion()}</p>
            </div>
            
            <div className="flex justify-end mt-6">
              <div className="text-sm text-muted-foreground text-right">
                <p>Rapport genererad: {new Date().toLocaleDateString('sv-SE')}</p>
                <p>ROI-kalkylator v1.0</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 
"use client";
/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ChartCard } from '@/components/ui/chart-card';
import { StatItem } from '@/components/ui/stat-item';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Activity, 
  CreditCard, 
  Percent, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Calendar,
  FileText, 
  TrendingDown,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { loadROIReportData, formatCurrency, formatPercent, formatMonths, ROIReportData } from '@/lib/reports/reportUtils';
import { exportROIToPdf } from '@/lib/reports/pdfExport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DetaljeradRapportPage() {
  const { currentUser, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [reportData, setReportData] = useState<ROIReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [, setActiveTab] = useState<string>("nulage");

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

  // Funktion för att hantera PDF-export
  const handleExportPdf = () => {
    if (!reportData) return;
    
    try {
      exportROIToPdf(reportData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Ett fel uppstod vid export till PDF. Försök igen senare.');
    }
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
            Du behöver fylla i ROI-formulären för att se en detaljerad rapport.
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
        <div>
          <Link href="/rapporter">
            <Button variant="ghost" className="gap-2 mb-2">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till rapporter
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Detaljerad forskningsbaserad rapport</h1>
          <p className="text-muted-foreground mt-1">
            Djupgående analys av ROI för {reportData.sharedFields?.organizationName || 'din organisation'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportPdf} className="gap-2">
            <FileText className="h-4 w-4" />
            Exportera PDF
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="nulage" 
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-8">
          <TabsTrigger value="nulage">Nuläge</TabsTrigger>
          <TabsTrigger value="orsak">Orsaksanalys</TabsTrigger>
          <TabsTrigger value="syfte">Syfte med insatserna</TabsTrigger>
          <TabsTrigger value="mal">Målsättning</TabsTrigger>
          <TabsTrigger value="malgrupp">Målgrupp</TabsTrigger>
          <TabsTrigger value="interventioner">Intervention</TabsTrigger>
          <TabsTrigger value="plan">Genomförandeplan</TabsTrigger>
          <TabsTrigger value="rekommendation">Rekommendation</TabsTrigger>
        </TabsList>

        {/* Innehåll för Nuläge */}
        <TabsContent value="nulage" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Nuläge</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Sammanfattning
              </p>
              <p className="mb-6">
                {reportData.currentSituation || 'Organisationen upplever utmaningar med stressrelaterad psykisk ohälsa, vilket påverkar både produktivitet och sjukfrånvaro.'}
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
                </ChartCard>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Forskningsbaserad analys av nuläget</h3>
              
              <p className="mb-4">
                Enligt Folkhälsomyndigheten (2021) upplever cirka 16% av den svenska befolkningen besvär av ängslan, oro eller ångest. 
                I er organisation rapporterar {formatPercent(reportData.stressPercentage || 0)} av personalen hög stressnivå, vilket 
                är {(reportData.stressPercentage || 0) > 16 ? 'högre' : 'lägre'} än genomsnittet i befolkningen.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Forskningsreferens: Produktivitetsförlust vid stressrelaterad ohälsa
                </h4>
                <p className="text-sm">
                  Enligt Myndigheten för arbetsmiljökunskap innebär stressrelaterad psykisk ohälsa i snitt ett produktionsbortfall på minst 9%. 
                  Denna uppskattning är konservativ, vilket innebär att den faktiska kostnaden sannolikt är högre. 
                  Longitudinella studier pekar på att produktivitetsförlusten kan vara så hög som 15% i kunskapsintensiva branscher (Hassard et al., 2018).
                </p>
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
                    <div className="mt-4 text-sm">
                      <div className="flex justify-between mb-1">
                        <span>Produktionsbortfall</span>
                        <span className="font-medium">{formatPercent((reportData.productionLossValue || 0) / (reportData.totalMentalHealthCost || 1) * 100)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${(reportData.productionLossValue || 0) / (reportData.totalMentalHealthCost || 1) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mb-1 mt-2">
                        <span>Sjukfrånvaro</span>
                        <span className="font-medium">{formatPercent((reportData.sickLeaveValue || 0) / (reportData.totalMentalHealthCost || 1) * 100)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-purple-500 h-1.5 rounded-full" 
                          style={{ width: `${(reportData.sickLeaveValue || 0) / (reportData.totalMentalHealthCost || 1) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4">Jämförelse med nationell statistik</h4>
                  <p className="mb-4 text-sm">
                    Stressrelaterad psykisk ohälsa kostar det svenska samhället cirka 70 miljarder kronor årligen enligt OECD (2021). 
                    För arbetsgivare utgör kostnaden i genomsnitt 30 000 - 100 000 kr per anställd med psykisk ohälsa.
                  </p>
                  <div className="text-sm mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span>Nationellt genomsnitt per anställd med ohälsa</span>
                      <span className="font-medium">{formatCurrency(65000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Er organisation per anställd med ohälsa</span>
                      <span className="font-medium">
                        {formatCurrency((reportData.totalMentalHealthCost || 0) / (((reportData.stressPercentage || 0) / 100) * 100))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Forskningsbaserade insikter</h3>
              
              <ul className="list-disc pl-5 space-y-2 mb-6">
                <li>
                  <strong>Sjukfrånvaro:</strong> Enligt Försäkringskassan (2020) står psykisk ohälsa för cirka 45% av samtliga sjukskrivningar i Sverige, 
                  vilket gör det till den vanligaste orsaken till långvarig sjukfrånvaro.
                </li>
                <li>
                  <strong>Presenteeism:</strong> Studier från SBU (2021) visar att närvaro på arbetet trots sjukdom (presenteeism) 
                  kan kosta upp till 2-3 gånger mer än sjukfrånvaro, genom försämrad produktivitet och kvalitet.
                </li>
                <li>
                  <strong>Personalomsättning:</strong> Företag med hög andel stressad personal har en personalomsättning som är upp till 50% högre 
                  än företag med god arbetsmiljö, enligt Prevent (2022).
                </li>
              </ul>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center text-yellow-800 dark:text-yellow-300">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Riskfaktorer att övervaka
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  Om inga åtgärder vidtas visar forskning att stressrelaterad ohälsa tenderar att öka med 5-10% årligen,
                  med eskalerande kostnader som följd. Särskilt långtidssjukskrivningar på grund av utmattningssyndrom
                  har en genomsnittlig rehabiliteringstid på 12-18 månader och en kostnad på 600 000 - 1 000 000 kr per fall.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Innehåll för Orsaksanalys */}
        <TabsContent value="orsak" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Orsaksanalys</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Sammanfattning
              </p>
              <p className="mb-6">
                Utifrån våra data och forskningslitteratur har vi identifierat följande huvudsakliga orsaker till den stressrelaterade ohälsan i organisationen:
              </p>
              
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-red-500" />
                    Organisatoriska faktorer
                  </h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Hög arbetsbelastning utan tillräckliga resurser</li>
                    <li>Otydlig ansvarsfördelning och bristande rollklarhet</li>
                    <li>Svårigheter att prioritera mellan arbetsuppgifter</li>
                    <li>Bristande kommunikation kring förändringar</li>
                    <li>Låg grad av kontroll och inflytande över arbetet</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                    Ledarskaps- och sociala faktorer
                  </h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Stressade chefer med begränsad förmåga att stötta medarbetare</li>
                    <li>Bristande kunskap om psykisk ohälsa hos både chefer och medarbetare</li>
                    <li>Avsaknad av återhämtning och gränssättning</li>
                    <li>Otillräckligt socialt stöd i arbetsgruppen</li>
                    <li>Konflikthantering som skjuts upp eller hanteras bristfälligt</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Riskfaktorer enligt forskning</h3>
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Forskningsreferens: Krav-kontroll-stödmodellen
                </h4>
                <p className="text-sm">
                  Enligt den välkända krav-kontroll-stödmodellen (Karasek & Theorell) uppstår negativ stress främst när höga krav kombineras med låg kontroll 
                  över arbetssituationen och bristande socialt stöd. Denna kombination har i långtidsstudier visat sig öka risken för psykisk ohälsa med upp till 
                  80% (SBU:s systematiska översikt, 2019).
                </p>
              </div>
              
              <div className="bg-card border rounded-lg p-6 mb-6">
                <h4 className="font-medium mb-4">Riskfaktorer för psykisk ohälsa på arbetsplatsen</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Hög arbetsbelastning</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Låg grad av kontroll över arbetssituationen</span>
                      <span className="text-sm font-medium">70%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Bristande socialt stöd</span>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Otydliga förväntningar och roller</span>
                      <span className="text-sm font-medium">60%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Bristande ledarskap</span>
                      <span className="text-sm font-medium">55%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '55%' }}></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * Procenttalen representerar hur ofta respektive faktor identifieras som central orsak till stressrelaterad ohälsa enligt forskning från arbetsmiljömyndigheter.
                </p>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Konsekvenskedja för stressrelaterad ohälsa</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <div className="min-w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Organisatoriska brister</h4>
                    <p className="text-sm">Otydlig ansvarsfördelning, bristande kommunikation och hög arbetsbelastning utan tillräckliga resurser.</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-6 border-l-2 border-dashed border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="flex items-start">
                  <div className="min-w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Upplevd stress</h4>
                    <p className="text-sm">Medarbetare upplever ökad stress, känsla av otillräcklighet och försämrad arbetsglädje.</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-6 border-l-2 border-dashed border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="flex items-start">
                  <div className="min-w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Individuella symptom</h4>
                    <p className="text-sm">Sömnsvårigheter, koncentrationssvårigheter, minnesproblem, ökad irritabilitet och trötthet.</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-6 border-l-2 border-dashed border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="flex items-start">
                  <div className="min-w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mr-4 mt-1">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Mätbara konsekvenser</h4>
                    <p className="text-sm">Minskad produktivitet, ökad sjukfrånvaro, ökad personalomsättning och försämrad arbetskvalitet.</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-6 border-l-2 border-dashed border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="flex items-start">
                  <div className="min-w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center mr-4 mt-1">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium">Ekonomiska och organisatoriska förluster</h4>
                    <p className="text-sm">Direkta och indirekta kostnader som påverkar organisationens resultat och konkurrenskraft negativt.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center text-green-800 dark:text-green-300">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Förebyggande faktorer enligt forskning
                </h4>
                <p className="text-sm text-green-700 dark:text-green-200 mb-2">
                  Följande faktorer har i forskningsstudier visat sig förebygga stressrelaterad ohälsa:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-green-700 dark:text-green-200">
                  <li>Tydligt ledarskap med fokus på kommunikation och stöd</li>
                  <li>Balans mellan krav och resurser i arbetet</li>
                  <li>Möjlighet till inflytande och delaktighet</li>
                  <li>Regelbunden återhämtning och tydliga gränser mellan arbete och fritid</li>
                  <li>Tydliga roller och förväntningar</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Innehåll för Syfte med insatserna */}
        <TabsContent value="syfte" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Syfte med insatserna</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Sammanfattning
              </p>
              <p className="mb-6">
                {reportData.interventionPurpose || 'Det övergripande syftet med insatserna är att minska stressrelaterad psykisk ohälsa och dess negativa konsekvenser, både för individerna och för organisationen som helhet.'}
              </p>
              
              <h3 className="text-xl font-medium mb-4">Huvudsakliga syften</h3>
              
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                    Organisatoriska syften
                  </h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Minska ekonomiska kostnader relaterade till psykisk ohälsa</li>
                    <li>Förbättra produktivitet och arbetskvalitet</li>
                    <li>Minska sjukfrånvaro och personalomsättning</li>
                    <li>Säkerställa lagefterlevnad (AFS 2015:4)</li>
                    <li>Stärka organisationens rykte som arbetsgivare</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Medarbetarrelaterade syften
                  </h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Förbättra medarbetarnas psykiska välbefinnande</li>
                    <li>Öka kunskapen om stresshantering</li>
                    <li>Stärka motståndskraft mot stress</li>
                    <li>Förbättra balans mellan arbete och privatliv</li>
                    <li>Öka arbetsglädje och engagemang</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Forskningsbaserad grund för insatserna</h3>
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Forskningsreferens: Kostnadseffektivitet av insatser
                </h4>
                <p className="text-sm">
                  Studier från SBU (2020) visar att systematiska insatser mot stressrelaterad ohälsa kan ge en avkastning (ROI) på 1,5 till 5 gånger 
                  den investerade summan. Förutsättningen är att insatserna riktas mot både organisatoriska faktorer och individuell stresshantering. 
                  Insatser som bara fokuserar på individens copingstrategier utan att adressera organisatoriska brister visar betydligt sämre effekt 
                  på längre sikt (Björklund et al., 2019).
                </p>
              </div>
              
              <p className="mb-4">
                Insatserna syftar till att skapa en arbetsplats där organisatoriska förutsättningar, ledarskap och individuell kapacitet 
                samverkar för att förebygga stressrelaterad ohälsa. Detta ligger i linje med Arbetsmiljöverkets föreskrifter om organisatorisk 
                och social arbetsmiljö (AFS 2015:4) som betonar arbetsgivarens ansvar att förebygga och hantera ohälsosam arbetsbelastning.
              </p>
              
              <div className="bg-card border rounded-lg p-6 mb-6">
                <h4 className="font-medium mb-4">Samhällsekonomiska konsekvenser av insatserna</h4>
                <p className="text-sm mb-4">
                  Utöver de direkta fördelarna för organisationen visar forskning från OECD (2021) att insatser mot psykisk ohälsa i arbetslivet 
                  även ger positiva samhällsekonomiska effekter genom:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Minskade kostnader för sjukvård och rehabilitering</li>
                  <li>Minskade kostnader för sjukförsäkringssystemet</li>
                  <li>Ökning av BNP genom högre arbetskraftsdeltagande</li>
                  <li>Minskad risk för långvarig sjukskrivning och förtidspension</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Innehåll för Målsättning */}
        <TabsContent value="mal" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Målsättning</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Sammanfattning
              </p>
              <p className="mb-6">
                För att säkerställa effekten av insatserna har vi definierat följande konkreta och mätbara mål:
              </p>
              
              <h3 className="text-xl font-medium mb-4">Primära mål</h3>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <ChartCard 
                  title="Minskad stressnivå"
                  icon={<TrendingDown className="h-5 w-5" />}
                  variant="green"
                >
                  <StatItem 
                    label="Minskning med"
                    value={`${formatPercent(reportData.reducedStressPercentage || 0)}`}
                    description="Från nuvarande nivå"
                    variant="green"
                  />
                </ChartCard>
                
                <ChartCard 
                  title="Ekonomisk avkastning"
                  icon={<Percent className="h-5 w-5" />}
                  variant="blue"
                >
                  <StatItem 
                    label="ROI"
                    value={`${formatPercent(reportData.roi || 0)}`}
                    description="Avkastning på investering"
                    variant="blue"
                  />
                </ChartCard>
                
                <ChartCard 
                  title="Återbetalningstid"
                  icon={<Clock className="h-5 w-5" />}
                  variant="purple"
                >
                  <StatItem 
                    label="Tid till break-even"
                    value={reportData.paybackPeriod ? formatMonths(reportData.paybackPeriod) : 'N/A'}
                    description="Från start av insatser"
                    variant="purple"
                  />
                </ChartCard>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Sekundära mål</h3>
              
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                    Organisationsnivå
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Minskad sjukfrånvaro</span>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Minskad personalomsättning</span>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Ökad produktivitet</span>
                        <span className="text-sm font-medium">7%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '7%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Individuell nivå
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Ökad arbetsglädje</span>
                        <span className="text-sm font-medium">20%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Förbättrad stresskompetens</span>
                        <span className="text-sm font-medium">25%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Ökat engagemang</span>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Forskningsstöd för målnivåerna</h3>
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Empiriskt stöd för målsättningar
                </h4>
                <p className="text-sm">
                  En metaanalys av 56 interventionsstudier (Richardson & Rothstein, 2018) visar att väldesignade arbetsmiljöinterventioner 
                  i genomsnitt minskar upplevd stress med 10-20% och sjukfrånvaro med 12-18%. Studier från företagshälsovården i Sverige 
                  (Previa, 2020) visar att en minskning av stressnivåer med 10 procentenheter typiskt ger produktivitetsökningar på 5-8%.
                </p>
              </div>
              
              <p className="mb-4">
                De målsättningar vi har formulerat är realistiska och uppnåbara baserat på tidigare forskningsstudier och erfarenheter från 
                liknande organisationer som genomfört systematiska insatser mot stressrelaterad ohälsa. Samtidigt är de tillräckligt 
                ambitiösa för att motivera investeringen i de föreslagna åtgärderna.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center text-blue-800 dark:text-blue-300">
                  <Target className="h-4 w-4 mr-2" />
                  Långsiktiga mål
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  På längre sikt (2-3 år) syftar insatserna till att etablera en hållbar arbetsmiljö där strukturer, 
                  processer och kultur förebygger stressrelaterad ohälsa. Detta inkluderar utveckling av organisationens 
                  kapacitet för tidig identifiering av risker och proaktiva åtgärder, vilket enligt forskning från 
                  Institutet för stressmedicin kan minska kostnaderna för psykisk ohälsa med upp till 40% över en treårsperiod.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Innehåll för Målgrupp */}
        <TabsContent value="malgrupp" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Målgrupp</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Sammanfattning
              </p>
              <p className="mb-6">
                {reportData.targetGroup || 'Insatserna riktar sig till flera nivåer i organisationen, med fokus på både organisatoriska faktorer och individuellt stöd.'}
              </p>
              
              <h3 className="text-xl font-medium mb-4">Primära målgrupper</h3>
              
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                    Ledningsgrupp
                  </h4>
                  <p className="text-sm mb-4">
                    Ledningen ansvarar för strategiska beslut och resursallokering som påverkar arbetsmiljön. De behöver stöd i att:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Prioritera arbetsmiljöarbete</li>
                    <li>Förstå sambandet mellan arbetsmiljö och verksamhetsresultat</li>
                    <li>Implementera systematiskt arbetsmiljöarbete</li>
                    <li>Följa upp och utvärdera insatser</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-500" />
                    Chefer och arbetsledare
                  </h4>
                  <p className="text-sm mb-4">
                    Chefer spelar en nyckelroll i det dagliga arbetsmiljöarbetet och behöver stöd i att:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Identifiera och hantera tidiga signaler på stress</li>
                    <li>Balansera krav och resurser för medarbetare</li>
                    <li>Genomföra konstruktiva medarbetarsamtal</li>
                    <li>Förebygga och hantera konflikter</li>
                    <li>Leda i förändring med fokus på delaktighet</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-500" />
                    Medarbetare
                  </h4>
                  <p className="text-sm mb-4">
                    Alla medarbetare behöver stöd i att:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Utveckla sin kunskap om stress och återhämtning</li>
                    <li>Hantera gränssättning mellan arbete och fritid</li>
                    <li>Bidra till en stödjande arbetsplatskultur</li>
                    <li>Kommunicera behov och utmaningar konstruktivt</li>
                    <li>Använda copingstrategier för stresshantering</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Sekundära målgrupper</h3>
              
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-orange-500" />
                    HR och stödfunktioner
                  </h4>
                  <p className="text-sm mb-4">
                    HR och andra stödfunktioner behöver utveckla sin kapacitet att:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Stödja chefer i arbetsmiljöarbetet</li>
                    <li>Utveckla policies och rutiner för psykosocial arbetsmiljö</li>
                    <li>Genomföra kartläggningar och analyser</li>
                    <li>Koordinera insatser och följa upp resultat</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-red-500" />
                    Riskgrupper
                  </h4>
                  <p className="text-sm mb-4">
                    Särskilda insatser för grupper med förhöjd risk för stressrelaterad ohälsa:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Medarbetare med höga krav och låg kontroll</li>
                    <li>Nyanställda eller personer i nya roller</li>
                    <li>Medarbetare i särskilt utsatta funktioner</li>
                    <li>Personer som visar tidiga tecken på överbelastning</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Forskningsbaserad stratifiering av insatser</h3>
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Forskningsreferens: Multikomponentinterventioner
                </h4>
                <p className="text-sm">
                  En systematisk översikt från Cochrane Collaboration (2022) visar att insatser som riktar sig till flera nivåer i 
                  organisationen (multilevel interventions) har upp till 3 gånger större effekt än insatser som enbart fokuserar på 
                  en nivå. Kombinationen av organisatoriska förändringar, ledarskapsinsatser och individuellt stöd ger de mest 
                  långsiktiga och kostnadseffektiva resultaten (LaMontagne et al., 2020).
                </p>
              </div>
              
              <p className="mb-6">
                Genom att rikta insatserna till alla nivåer i organisationen skapas förutsättningar för långsiktiga och hållbara 
                förändringar. Detta angreppssätt är i linje med aktuell forskning som visar att psykisk ohälsa på arbetsplatsen 
                bäst förebyggas genom ett holistiskt och systemiskt perspektiv, där både organisatoriska strukturer och individuella 
                faktorer adresseras samtidigt.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Innehåll för Intervention */}
        <TabsContent value="interventioner" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Intervention</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Beskrivning av insatsen
              </p>
              <p className="mb-6">
                {reportData.interventionDescription || 'De föreslagna interventionerna består av ett koordinerat paket av åtgärder som adresserar identifierade orsaker till stressrelaterad ohälsa i organisationen.'}
              </p>
              
              <h3 className="text-xl font-medium mb-4">Interventionens komponenter</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex">
                  <div className="min-w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-4">
                    1
                  </div>
                  <div className="bg-card border rounded-lg p-4 flex-1">
                    <h4 className="font-medium mb-2">Kartläggning och analys</h4>
                    <p className="text-sm mb-3">
                      Genomförande av fördjupad kartläggning av psykosocial arbetsmiljö genom enkäter, intervjuer och fokusgrupper 
                      för att identifiera specifika problemområden och riskfaktorer.
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tidsåtgång: 4-6 veckor</span>
                      <span>Evidensstyrka: Hög</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="min-w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-4">
                    2
                  </div>
                  <div className="bg-card border rounded-lg p-4 flex-1">
                    <h4 className="font-medium mb-2">Ledningsgruppsutveckling</h4>
                    <p className="text-sm mb-3">
                      Workshop-serie för ledningsgruppen med fokus på arbetsmiljöekonomi, strategiskt arbetsmiljöarbete, 
                      förändringsledning och implementeringsstöd för hälsofrämjande ledarskap.
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tidsåtgång: 3-4 månader</span>
                      <span>Evidensstyrka: Medel-hög</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="min-w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-4">
                    3
                  </div>
                  <div className="bg-card border rounded-lg p-4 flex-1">
                    <h4 className="font-medium mb-2">Chefsstöd och utbildning</h4>
                    <p className="text-sm mb-3">
                      Utbildningsprogram för chefer i att identifiera och hantera stress hos medarbetare, kombinerat med 
                      individuell coachning och kollegiala stödgrupper för chefer.
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tidsåtgång: 6-8 månader</span>
                      <span>Evidensstyrka: Hög</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="min-w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-4">
                    4
                  </div>
                  <div className="bg-card border rounded-lg p-4 flex-1">
                    <h4 className="font-medium mb-2">Medarbetarinsatser</h4>
                    <p className="text-sm mb-3">
                      Stresshanteringsprogram, workshops för arbetsgrupper kring samarbete och konflikthantering, 
                      samt digitalt stöd för individuell stresshantering och återhämtning.
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tidsåtgång: 6-12 månader</span>
                      <span>Evidensstyrka: Medel-hög</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="min-w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mr-4">
                    5
                  </div>
                  <div className="bg-card border rounded-lg p-4 flex-1">
                    <h4 className="font-medium mb-2">Organisatoriska förändringar</h4>
                    <p className="text-sm mb-3">
                      Utveckling av processer, rutiner och policies för att skapa strukturer som förebygger ohälsosam stress, 
                      inklusive rutiner för arbetsbelastning, prioritering och återkoppling.
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tidsåtgång: 8-12 månader</span>
                      <span>Evidensstyrka: Hög</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Kostnader för interventionen</h3>
              
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full bg-card border rounded-lg">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Insats</th>
                      <th className="px-4 py-2 text-right font-medium">Kostnad (SEK)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportData.interventionCosts && reportData.interventionCosts.length > 0 ? (
                      reportData.interventionCosts.map((cost, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">{cost.description}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(cost.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr>
                          <td className="px-4 py-2">Kartläggning och analys</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(150000)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Ledningsgruppsutveckling</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(200000)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Chefsstöd och utbildning</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(350000)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Medarbetarinsatser</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(450000)}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Organisatoriska förändringar</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(200000)}</td>
                        </tr>
                      </>
                    )}
                    <tr className="bg-primary/5 font-medium">
                      <td className="px-4 py-2">Total kostnad</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(reportData.totalCost || 1350000)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Forskningsstöd för interventionskomponenterna</h3>
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Forskningsreferens: Effektiva komponenter
                </h4>
                <p className="text-sm">
                  En systematisk översikt från Karolinska Institutet (Theorell et al., 2021) identifierade de mest effektiva 
                  komponenterna i arbetsmiljöinterventioner. Högst effektstorlek hade insatser som kombinerade organisatoriska 
                  förändringar med ledarutveckling (Hedges' g = 0.68), följt av interventioner som stärkte medarbetarnas 
                  delaktighet i förändringsprocesser (Hedges' g = 0.54).
                </p>
              </div>
              
              <p className="mb-4">
                De föreslagna interventionerna bygger på etablerade och evidensbaserade metoder för att förebygga och hantera 
                stressrelaterad ohälsa. Genom att kombinera insatser på flera nivåer skapas synergier som ökar sannolikheten 
                för långsiktiga och hållbara effekter.
              </p>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center text-green-800 dark:text-green-300">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Förväntade effekter
                </h4>
                <p className="text-sm text-green-700 dark:text-green-200 mb-2">
                  Baserat på forskningsevidens förväntas interventionen ge följande effekter:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-green-700 dark:text-green-200">
                  <li>Minskning av andelen personal med hög stressnivå med {formatPercent(reportData.reducedStressPercentage || 0)}</li>
                  <li>Minskning av sjukfrånvaro relaterad till psykisk ohälsa med 15-20%</li>
                  <li>Ökad produktivitet motsvarande {formatCurrency(reportData.totalBenefit || 0)} per år</li>
                  <li>ROI (avkastning på investering) på {formatPercent(reportData.roi || 0)}</li>
                  <li>Återbetalningstid på {reportData.paybackPeriod ? formatMonths(reportData.paybackPeriod) : 'N/A'}</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Innehåll för Genomförandeplan */}
        <TabsContent value="plan" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Genomförandeplan</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Plan för genomförande
              </p>
              <p className="mb-6">
                {reportData.implementationPlan || 'Genomförandet av interventionen följer en strukturerad och evidensbaserad process för att säkerställa implementeringskvalitet och långsiktig hållbarhet.'}
              </p>
              
              <h3 className="text-xl font-medium mb-4">Implementeringsprocess</h3>
              
              <div className="relative mb-10">
                {/* Tidslinjen */}
                <div className="absolute h-full w-0.5 bg-gray-300 dark:bg-gray-700 left-6 top-0"></div>
                
                {/* Fas 1 */}
                <div className="relative pl-16 pb-8">
                  <div className="absolute left-0 rounded-full h-12 w-12 bg-blue-500 text-white flex items-center justify-center font-bold z-10">
                    1
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-medium">Förberedelse (Månad 1-2)</h4>
                    <p className="text-sm mt-2 mb-3">Etablering av styrgrupp, detaljerad projektplan, kommunikationsstrategi och förankring hos nyckelpersoner.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs py-1 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Styrgrupp</span>
                      <span className="text-xs py-1 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Projektplan</span>
                      <span className="text-xs py-1 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Kommunikation</span>
                    </div>
                  </div>
                </div>
                
                {/* Fas 2 */}
                <div className="relative pl-16 pb-8">
                  <div className="absolute left-0 rounded-full h-12 w-12 bg-indigo-500 text-white flex items-center justify-center font-bold z-10">
                    2
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-medium">Kartläggning (Månad 2-3)</h4>
                    <p className="text-sm mt-2 mb-3">Fördjupad kartläggning av orsaker och riskfaktorer genom enkäter, intervjuer och fokusgrupper. Analys och prioritering av insatser.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs py-1 px-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">Datainsamling</span>
                      <span className="text-xs py-1 px-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">Analys</span>
                      <span className="text-xs py-1 px-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">Prioritering</span>
                    </div>
                  </div>
                </div>
                
                {/* Fas 3 */}
                <div className="relative pl-16 pb-8">
                  <div className="absolute left-0 rounded-full h-12 w-12 bg-purple-500 text-white flex items-center justify-center font-bold z-10">
                    3
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-medium">Ledarskapsinsatser (Månad 3-6)</h4>
                    <p className="text-sm mt-2 mb-3">Utbildning och workshop-serie för ledningsgrupp och chefer, med fokus på hälsofrämjande ledarskap och arbetsmiljöansvar.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs py-1 px-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">Utbildning</span>
                      <span className="text-xs py-1 px-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">Workshops</span>
                      <span className="text-xs py-1 px-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">Coachning</span>
                    </div>
                  </div>
                </div>
                
                {/* Fas 4 */}
                <div className="relative pl-16 pb-8">
                  <div className="absolute left-0 rounded-full h-12 w-12 bg-green-500 text-white flex items-center justify-center font-bold z-10">
                    4
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Organisatoriska åtgärder (Månad 5-9)</h4>
                    <p className="text-sm mt-2 mb-3">Implementering av förbättringar i arbetsprocesser, rutiner för arbetsbelastning, kommunikationsvägar och mötestrukturer.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs py-1 px-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Processförbättring</span>
                      <span className="text-xs py-1 px-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Rutiner</span>
                      <span className="text-xs py-1 px-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Strukturer</span>
                    </div>
                  </div>
                </div>
                
                {/* Fas 5 */}
                <div className="relative pl-16 pb-8">
                  <div className="absolute left-0 rounded-full h-12 w-12 bg-amber-500 text-white flex items-center justify-center font-bold z-10">
                    5
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Medarbetarinsatser (Månad 6-12)</h4>
                    <p className="text-sm mt-2 mb-3">Gruppaktiviteter, stresshanteringsworkshops, teamutveckling och individuellt stöd via digitala verktyg.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs py-1 px-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Workshops</span>
                      <span className="text-xs py-1 px-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Teambuilding</span>
                      <span className="text-xs py-1 px-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Digitalt stöd</span>
                    </div>
                  </div>
                </div>
                
                {/* Fas 6 */}
                <div className="relative pl-16">
                  <div className="absolute left-0 rounded-full h-12 w-12 bg-red-500 text-white flex items-center justify-center font-bold z-10">
                    6
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Uppföljning och utvärdering (Månad 10-12+)</h4>
                    <p className="text-sm mt-2 mb-3">Löpande uppföljning, effektmätning, justering av insatser och etablering av långsiktiga strukturer för fortsatt arbetsmiljöarbete.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs py-1 px-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">Effektmätning</span>
                      <span className="text-xs py-1 px-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">Justering</span>
                      <span className="text-xs py-1 px-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">Långsiktighet</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Implementeringsstrategi</h3>
              
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                    Framgångsfaktorer
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Tydligt ledarskapsengagemang och förebilder</li>
                    <li>Systematisk kommunikation om mål och förväntningar</li>
                    <li>Bred delaktighet av medarbetare i utveckling</li>
                    <li>Etablering av stödjande strukturer och processer</li>
                    <li>Regelbunden uppföljning och återkoppling</li>
                    <li>Anpassning av insatser baserat på feedback</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                    Hantering av implementeringshinder
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Motstånd mot förändring: Adresseras genom dialog och delaktighet</li>
                    <li>Tidsbrist: Realistiska planer och integrering i befintliga processer</li>
                    <li>Bristande kompetens: Utbildning och coachning</li>
                    <li>Konkurrerande prioriteringar: Tydlig förankring hos ledning</li>
                    <li>Långsam kulturförändring: Uthållighet och delmål</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Forskningsevidens för implementeringsprocess</h3>
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Forskningsreferens: Implementeringskvalitet
                </h4>
                <p className="text-sm">
                  Studier från implementeringsforskning (Nielsen & Randall, 2018) visar att implementeringskvaliteten är avgörande för 
                  interventioners effektivitet. En metaanalys av arbetsmiljöinterventioner (Havermans et al., 2021) visade att hög 
                  implementeringskvalitet fördubblade effektstorleken jämfört med interventioner med låg implementeringskvalitet, 
                  oavsett interventionens innehåll.
                </p>
              </div>
              
              <p className="mb-6">
                Den föreslagna implementeringsplanen bygger på evidensbaserade principer för förändringsledning och 
                implementeringsvetenskap. Den fasindelade processen säkerställer att varje steg bygger på tidigare framsteg 
                och att nya rutiner och arbetssätt hinner etableras innan nästa fas påbörjas.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center text-blue-800 dark:text-blue-300">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Långsiktig hållbarhet
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  För att säkerställa långsiktig hållbarhet integreras arbetsmiljöarbetet i befintliga styrsystem och processer. 
                  Detta inkluderar regelbunden uppföljning i ledningsgrupp, integration i verksamhetsplaner och budget, samt 
                  tydlig ansvarsfördelning för fortsatt arbetsmiljöarbete. Enligt forskning från Prevent (2022) är denna typ av 
                  systemintegrering den starkaste prediktorn för långsiktiga effekter av arbetsmiljöinterventioner.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Innehåll för Rekommendation för beslut */}
        <TabsContent value="rekommendation" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Rekommendation för beslut</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Sammanfattning
              </p>
              <p className="mb-6">
                Baserat på genomförd analys rekommenderas att organisationen genomför den föreslagna interventionen för att minska stressrelaterad psykisk ohälsa.
              </p>
              
              <h3 className="text-xl font-medium mb-4">Ekonomisk analys</h3>
              
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                <ChartCard 
                  title="Total kostnad"
                  icon={<CreditCard className="h-5 w-5" />}
                  variant="blue"
                >
                  <StatItem 
                    label="Investeringskostnad"
                    value={formatCurrency(reportData.totalCost || 0)}
                    description="För hela insatsen"
                    variant="blue"
                  />
                </ChartCard>
                
                <ChartCard 
                  title="Årlig besparing"
                  icon={<Activity className="h-5 w-5" />}
                  variant="green"
                >
                  <StatItem 
                    label="Total besparing"
                    value={formatCurrency(reportData.totalBenefit || 0)}
                    description="Per år"
                    variant="green"
                  />
                </ChartCard>
                
                <ChartCard 
                  title="Avkastning"
                  icon={<Percent className="h-5 w-5" />}
                  variant="purple"
                >
                  <StatItem 
                    label="ROI"
                    value={formatPercent(reportData.roi || 0)}
                    description="Return on Investment"
                    variant="purple"
                  />
                </ChartCard>
              </div>
              
              <div className="bg-card border rounded-lg p-6 mb-8">
                <h4 className="font-medium mb-4">Kostnads-nyttoanalys över tid</h4>
                <p className="text-sm mb-4">
                  Med en total investering på {formatCurrency(reportData.totalCost || 0)} och en årlig besparing på 
                  {formatCurrency(reportData.totalBenefit || 0)} uppnås följande ekonomiska resultat över tid:
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tidsperiod</th>
                        <th className="px-4 py-2 text-right font-medium">Investering</th>
                        <th className="px-4 py-2 text-right font-medium">Avkastning</th>
                        <th className="px-4 py-2 text-right font-medium">Nettoresultat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="px-4 py-2">År 1</td>
                        <td className="px-4 py-2 text-right text-red-500">-{formatCurrency(reportData.totalCost || 0)}</td>
                        <td className="px-4 py-2 text-right text-green-500">+{formatCurrency(reportData.totalBenefit || 0)}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency((reportData.totalBenefit || 0) - (reportData.totalCost || 0))}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">År 2</td>
                        <td className="px-4 py-2 text-right text-red-500">-{formatCurrency(0)}</td>
                        <td className="px-4 py-2 text-right text-green-500">+{formatCurrency(reportData.totalBenefit || 0)}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency((reportData.totalBenefit || 0) * 2 - (reportData.totalCost || 0))}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">År 3</td>
                        <td className="px-4 py-2 text-right text-red-500">-{formatCurrency(0)}</td>
                        <td className="px-4 py-2 text-right text-green-500">+{formatCurrency(reportData.totalBenefit || 0)}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency((reportData.totalBenefit || 0) * 3 - (reportData.totalCost || 0))}
                        </td>
                      </tr>
                      <tr className="bg-primary/5 font-medium">
                        <td className="px-4 py-2">Totalt 3 år</td>
                        <td className="px-4 py-2 text-right text-red-500">-{formatCurrency(reportData.totalCost || 0)}</td>
                        <td className="px-4 py-2 text-right text-green-500">+{formatCurrency((reportData.totalBenefit || 0) * 3)}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency((reportData.totalBenefit || 0) * 3 - (reportData.totalCost || 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">För- och nackdelar med insatsen</h3>
              
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center text-green-800 dark:text-green-300">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Fördelar
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-green-700 dark:text-green-200">
                    <li>Stark ekonomisk avkastning (ROI: {formatPercent(reportData.roi || 0)})</li>
                    <li>Relativt kort återbetalningstid ({reportData.paybackPeriod ? formatMonths(reportData.paybackPeriod) : 'N/A'})</li>
                    <li>Minskad risk för långtidssjukskrivningar och rehabiliteringskostnader</li>
                    <li>Förbättrad produktivitet och arbetskvalitet</li>
                    <li>Stärkt arbetsgivarvarumärke och attraktionskraft</li>
                    <li>Långsiktigt hållbar arbetsmiljö och organisation</li>
                    <li>Minskad risk för arbetsmiljörelaterade sanktioner</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center text-yellow-800 dark:text-yellow-300">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Risker att hantera
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-yellow-700 dark:text-yellow-200">
                    <li>Kräver avsättning av tid från chefer och medarbetare</li>
                    <li>Risk för bristande engagemang vid hög arbetsbelastning</li>
                    <li>Effekterna kan ta tid att materialiseras fullt ut</li>
                    <li>Kräver uthållighet i implementeringen</li>
                    <li>Behov av fortsatt uppföljning och underhåll av etablerade processer</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-4">Forskningsbaserad slutsats</h3>
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Forskningsreferens: Proaktiva insatser
                </h4>
                <p className="text-sm">
                  En jämförande studie från Arbetsmiljöverket (2023) visar att organisationer som proaktivt 
                  investerar i systematiskt arbetsmiljöarbete har 40% lägre kostnader för sjukfrånvaro och 35% lägre 
                  personalomsättning jämfört med reaktiva organisationer. Proaktiva organisationer har också i genomsnitt 
                  22% högre produktivitet och 18% högre lönsamhet över en femårsperiod.
                </p>
              </div>
              
              <p className="mb-6">
                Baserat på den detaljerade analysen av kostnader, förväntade effekter och forskningsevidens, 
                rekommenderas att organisationen genomför den föreslagna interventionen i sin helhet. Den förväntas 
                ge positiva effekter både ekonomiskt och för medarbetarnas välbefinnande, med en återbetalningstid 
                som är rimlig och en avkastning som motiverar investeringen.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center text-blue-800 dark:text-blue-300">
                  <Target className="h-4 w-4 mr-2" />
                  Rekommendation
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  <strong>Rekommenderat beslut:</strong> Genomför det föreslagna interventionspaketet i sin helhet för att minska 
                  stressrelaterad psykisk ohälsa och uppnå positiva ekonomiska effekter.
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-2">
                  <strong>Förutsättningar för framgång:</strong> Tydligt ledarskapsengagemang, tillräcklig resursallokering för genomförande, 
                  bred delaktighet från medarbetare, och systematisk uppföljning av effekter. Med dessa förutsättningar på plats 
                  är sannolikheten hög för att uppnå eller överträffa de prognostiserade resultaten.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
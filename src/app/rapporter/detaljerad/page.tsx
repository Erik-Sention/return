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
  BookOpen,
  Star,
  Crown,
  HeartPulse,
  ClipboardList,
  Rocket,
  LineChart,
  UserCog,
  Users2,
  Stethoscope,
  Sparkles,
  MessageSquare,
  UserPlus,
  TrendingUp,
  LightbulbIcon,
  Building2,
  Zap,
  Presentation,
  Search,
  User
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
          <TabsTrigger value="intervention">Intervention</TabsTrigger>
          <TabsTrigger value="plan">Genomförandeplan</TabsTrigger>
          <TabsTrigger value="rekommendation">Rekommendation</TabsTrigger>
        </TabsList>

        {/* Innehåll för Nuläge */}
        <TabsContent value="nulage" className="space-y-6">
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
                        Källa: OECD (2021), "Mental Health and Work: Sweden"
                    </div>
                  </div>
                </div>
                
                  <div className="mt-6">
                    <h5 className="text-sm font-medium mb-2">Nationell kostnad per år</h5>
                    <div className="text-3xl font-bold mb-1">70 Mdr SEK</div>
                    <div className="text-xs text-muted-foreground">
                      Stressrelaterad psykisk ohälsa kostar svenska samhället cirka 70 miljarder kronor årligen. 
                      <div className="mt-1">Källa: OECD (2021), "Mental Health and Work: Sweden"</div>
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
                      Källa: Arbetsmiljöverket (2020), "Förebyggande insatser"
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
        </TabsContent>

        {/* Innehåll för Orsaksanalys */}
        <TabsContent value="orsak" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Orsaksanalys</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Er angivna orsaksanalys
              </p>
              <p className="mb-6">
                {reportData.causeAnalysis || 'Ingen orsaksanalys har angivits i formuläret.'}
              </p>
              
              <div className="bg-card border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">Forskningsbaserad orsaksanalys</h3>
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Riskfaktorer för psykisk ohälsa enligt forskning</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Hög arbetsbelastning</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                      <div className="text-xs text-muted-foreground mt-1">Källa: SBU:s systematiska översikt (2019)</div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Låg grad av kontroll över arbetssituationen</span>
                      <span className="text-sm font-medium">70%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                      <div className="text-xs text-muted-foreground mt-1">Källa: Karasek & Theorell (2017)</div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Bristande socialt stöd</span>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                      <div className="text-xs text-muted-foreground mt-1">Källa: Karasek & Theorell (2017)</div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Otydliga förväntningar och roller</span>
                      <span className="text-sm font-medium">60%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Källa: Arbetsmiljöverket (2020)</div>
                    </div>
                    </div>
                  </div>
                  
                <div className="text-xs text-muted-foreground mt-2">
                  * Procenttalen representerar hur ofta respektive faktor identifieras som central orsak till stressrelaterad ohälsa enligt forskning.
                    </div>
                    </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-muted/30 rounded-lg p-5">
                  <h4 className="font-medium mb-4 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    Krav-kontroll-stödmodellen
                  </h4>
                  <div className="relative border rounded-lg p-5 bg-card overflow-hidden">
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 relative z-10">
                      <div className="border border-amber-200 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3">
                        <h5 className="text-xs font-medium mb-1 text-amber-800 dark:text-amber-200">Aktiva jobb</h5>
                        <p className="text-xs">Höga krav, hög kontroll, låg risk</p>
                  </div>
                      <div className="border border-red-200 bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                        <h5 className="text-xs font-medium mb-1 text-red-800 dark:text-red-200">Spända jobb</h5>
                        <p className="text-xs">Höga krav, låg kontroll, hög risk</p>
                </div>
                      <div className="border border-green-200 bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                        <h5 className="text-xs font-medium mb-1 text-green-800 dark:text-green-200">Avspända jobb</h5>
                        <p className="text-xs">Låga krav, hög kontroll, låg risk</p>
                      </div>
                      <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                        <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-200">Passiva jobb</h5>
                        <p className="text-xs">Låga krav, låg kontroll, medelhög risk</p>
                      </div>
              </div>
              
                    {/* X and Y axis labels */}
                    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 -rotate-90">
                      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Kontroll</span>
                  </div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs font-medium text-muted-foreground">Krav</span>
                  </div>
                </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Källa: Karasek & Theorell krav-kontroll-stödmodell (2017)
                </div>
                  </div>
                
                <div className="bg-muted/30 rounded-lg p-5">
                  <h4 className="font-medium mb-4 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    Konsekvenskedja för stressrelaterad ohälsa
                  </h4>
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute h-full w-0.5 bg-gray-300 dark:bg-gray-700 left-3 top-0"></div>
                    
                    <div className="space-y-1">
                      <div className="flex items-start mb-3">
                        <div className="min-w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-4 z-10 text-xs">1</div>
                  <div>
                          <h5 className="text-xs font-medium">Organisatoriska brister</h5>
                          <p className="text-xs text-muted-foreground">Otydliga roller, hög arbetsbelastning</p>
                  </div>
                </div>
                      <div className="flex items-start mb-3">
                        <div className="min-w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-4 z-10 text-xs">2</div>
                        <div>
                          <h5 className="text-xs font-medium">Upplevd stress</h5>
                          <p className="text-xs text-muted-foreground">Känsla av otillräcklighet</p>
                </div>
                  </div>
                      <div className="flex items-start mb-3">
                        <div className="min-w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-4 z-10 text-xs">3</div>
                  <div>
                          <h5 className="text-xs font-medium">Individuella symptom</h5>
                          <p className="text-xs text-muted-foreground">Sömnsvårigheter, koncentrationssvårigheter</p>
                  </div>
                </div>
                      <div className="flex items-start mb-3">
                        <div className="min-w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mr-4 z-10 text-xs">4</div>
                        <div>
                          <h5 className="text-xs font-medium">Mätbara konsekvenser</h5>
                          <p className="text-xs text-muted-foreground">Minskad produktivitet, ökad sjukfrånvaro</p>
                </div>
                  </div>
                      <div className="flex items-start">
                        <div className="min-w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center mr-4 z-10 text-xs">5</div>
                  <div>
                          <h5 className="text-xs font-medium">Ekonomiska förluster</h5>
                          <p className="text-xs text-muted-foreground">Direkta och indirekta kostnader</p>
                  </div>
                </div>
                </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Källa: SBU (2019) "Arbetsrelaterad stress"
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center text-green-800 dark:text-green-300">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Förebyggande faktorer enligt forskning
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-green-700 dark:text-green-200">
                      <li>Tydligt ledarskap med fokus på kommunikation</li>
                  <li>Balans mellan krav och resurser i arbetet</li>
                  <li>Möjlighet till inflytande och delaktighet</li>
                    </ul>
                  </div>
                  <div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-green-700 dark:text-green-200">
                      <li>Regelbunden återhämtning och tydliga gränser</li>
                  <li>Tydliga roller och förväntningar</li>
                </ul>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-3">
                  Källa: Prevent (2022), "Hälsofrämjande arbetsmiljö"
                </div>
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
                Er beskrivning av syftet
              </p>
              <p className="mb-6">
                {reportData.interventionPurpose || 'Inget syfte har angivits i formuläret.'}
              </p>
              
              <h3 className="text-xl font-medium mb-4">Syftets koppling till mätbara resultat</h3>
              
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-card border rounded-lg p-5">
                  <div className="pb-4 mb-4 border-b border-border">
                    <h4 className="font-medium flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                      Förväntade effekter
                  </h4>
                </div>
                
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Minskad stress</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Primär effekt</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Ökad produktivitet</span>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Sekundär effekt</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Minskad sjukfrånvaro</span>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Sekundär effekt</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bättre arbetsmiljö</span>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Sekundär effekt</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Minskad personalomsättning</span>
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Tertiär effekt</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-4">
                    Staplarnas bredd visar hur ofta respektive effekt framträder i vetenskapliga utvärderingar.
                    <div className="mt-1">Källa: Arbetsmiljöverket (2022), "Effekter av arbetsmiljöinsatser"</div>
                  </div>
                </div>
                
                <div className="bg-card border rounded-lg p-5">
                  <div className="pb-4 mb-4 border-b border-border">
                    <h4 className="font-medium flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      Tidsperspektiv för effekter
                  </h4>
                  </div>
                  
                  <div className="relative pt-10 pb-4">
                    {/* Timeline */}
                    <div className="absolute left-0 right-0 h-1 bg-muted top-5"></div>
                    
                    {/* Timeline markers */}
                    <div className="absolute left-[10%] top-0 flex flex-col items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mb-1"></span>
                      <span className="text-xs text-muted-foreground">3 mån</span>
                    </div>
                    <div className="absolute left-[40%] top-0 flex flex-col items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mb-1"></span>
                      <span className="text-xs text-muted-foreground">6 mån</span>
                    </div>
                    <div className="absolute left-[70%] top-0 flex flex-col items-center">
                      <span className="w-3 h-3 bg-purple-500 rounded-full mb-1"></span>
                      <span className="text-xs text-muted-foreground">12 mån</span>
                    </div>
                    <div className="absolute right-0 top-0 flex flex-col items-center">
                      <span className="w-3 h-3 bg-gray-500 rounded-full mb-1"></span>
                      <span className="text-xs text-muted-foreground">24 mån</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-100 dark:border-green-800">
                        <h5 className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Kortsiktiga effekter</h5>
                        <ul className="text-xs text-green-700 dark:text-green-200 space-y-1 list-disc pl-4">
                          <li>Ökad medvetenhet om stress</li>
                          <li>Bättre kommunikation</li>
                          <li>Minskad upplevd stress</li>
                  </ul>
                </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                        <h5 className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Mellanlångsiktiga effekter</h5>
                        <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1 list-disc pl-4">
                          <li>Minskad sjukfrånvaro</li>
                          <li>Ökad produktivitet</li>
                          <li>Förbättrad arbetsmiljö</li>
                        </ul>
              </div>
              
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md border border-purple-100 dark:border-purple-800">
                        <h5 className="text-xs font-medium text-purple-800 dark:text-purple-300 mb-1">Långsiktiga effekter</h5>
                        <ul className="text-xs text-purple-700 dark:text-purple-200 space-y-1 list-disc pl-4">
                          <li>Minskad personalomsättning</li>
                          <li>Hållbar arbetsmiljö</li>
                          <li>Stärkt organisationskultur</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                        <h5 className="text-xs font-medium mb-1">Strategiska effekter</h5>
                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc pl-4">
                          <li>Stärkt arbetsgivarvarumärke</li>
                          <li>Förbättrad rekryteringsförmåga</li>
                          <li>Ökad konkurrenskraft</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-4">
                    Källa: Richardson & Rothstein (2018), "Meta-analys av stressinterventioner"
                  </div>
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">Systemteoretiskt ramverk för stressinterventioner</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Primära interventioner</h4>
                      <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        Proaktiv
                      </span>
                    </div>
                    
                    <p className="text-xs text-blue-700 dark:text-blue-200 mb-3">
                      Riktar sig mot organisatoriska faktorer för att förebygga att stress uppstår.
                    </p>
                    
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Arbetsmiljöanalyser och anpassningar</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Förtydligande av roller och ansvar</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Förbättrade processer och arbetsflöden</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Ledarskapsutbildning</span>
                      </li>
                    </ul>
                    
                    <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700 dark:text-blue-300">Effektivitet:</span>
                        <div className="flex">
                          <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                          <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                          <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                          <Star className="h-3 w-3 text-blue-500 fill-blue-500" />
                          <Star className="h-3 w-3 text-blue-500" />
                        </div>
                      </div>
                    </div>
              </div>
              
                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-300">Sekundära interventioner</h4>
                      <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs font-medium">
                        Reaktiv
                      </span>
                    </div>
                    
                    <p className="text-xs text-green-700 dark:text-green-200 mb-3">
                      Hjälper individer att hantera stress som redan uppstått.
                    </p>
                    
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Stresshanteringskurser</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Mindfulness och avslappningstekniker</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Coachning och mentorskap</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Tidhantering och prioritering</span>
                      </li>
                    </ul>
                    
                    <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-green-700 dark:text-green-300">Effektivitet:</span>
                        <div className="flex">
                          <Star className="h-3 w-3 text-green-500 fill-green-500" />
                          <Star className="h-3 w-3 text-green-500 fill-green-500" />
                          <Star className="h-3 w-3 text-green-500 fill-green-500" />
                          <Star className="h-3 w-3 text-green-500" />
                          <Star className="h-3 w-3 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">Tertiära interventioner</h4>
                      <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs font-medium">
                        Rehabilitering
                      </span>
                    </div>
                    
                    <p className="text-xs text-purple-700 dark:text-purple-200 mb-3">
                      Stöd för återhämtning och återgång till arbete.
                    </p>
                    
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Stöd från företagshälsovård</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Rehabiliteringsprogram</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Anpassad återgång till arbete</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs">Professionell behandling</span>
                      </li>
                </ul>
                    
                    <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-800">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-purple-700 dark:text-purple-300">Effektivitet:</span>
                        <div className="flex">
                          <Star className="h-3 w-3 text-purple-500 fill-purple-500" />
                          <Star className="h-3 w-3 text-purple-500 fill-purple-500" />
                          <Star className="h-3 w-3 text-purple-500" />
                          <Star className="h-3 w-3 text-purple-500" />
                          <Star className="h-3 w-3 text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-4 text-center">
                  <p>Forskningsresultat visar att kombinerade insatser med fokus på både organisationen (primär) och individen (sekundär) ger bäst effekt.</p>
                  <div className="mt-1">Källa: LaMontagne et al. (2007); SBU (2021)</div>
                </div>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center text-indigo-800 dark:text-indigo-300">
                  <Target className="h-5 w-5 mr-2" />
                  Framgångsfaktorer för tydliga syften
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-indigo-700 dark:text-indigo-200">
                      <li>Koppla syftet direkt till organisationens övergripande mål</li>
                      <li>Definiera både hårda (ekonomiska) och mjuka (välmående) syften</li>
                      <li>Involvera alla berörda i definitionen av syftet</li>
                    </ul>
                  </div>
                  <div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-indigo-700 dark:text-indigo-200">
                      <li>Sätt tydligt mätbara mål för uppföljning</li>
                      <li>Kommunicera syftet tydligt och kontinuerligt</li>
                      <li>Förankra i forskning och beprövad erfarenhet</li>
                    </ul>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-3">
                  Källa: Nielsen & Noblet (2018), "Organizational interventions for health and well-being"
                </div>
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
        </TabsContent>

        {/* Innehåll för Målgrupp */}
        <TabsContent value="malgrupp" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Målgrupp</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Er beskrivning av målgruppen
              </p>
              <p className="mb-6">
                {reportData.targetGroup || 'Ingen målgrupp har angivits i formuläret.'}
              </p>
              
              <h3 className="text-xl font-medium mb-4">Målgruppsanalys</h3>
              
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-card border rounded-lg p-5">
                  <div className="pb-4 mb-4 border-b border-border">
                    <h4 className="font-medium flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      Effektiv målgruppssegmentering
                  </h4>
                </div>
                
                  <div className="relative pt-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/20">
                        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Bred implementering</h5>
                        <div className="flex items-start">
                          <div className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full p-1 mr-2 mt-0.5">
                            <Users className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs">Samtliga anställda på organisationen</span>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          <span className="font-medium">När det passar:</span> Vid kulturförändringar och generella stressförebyggande insatser
                        </div>
                </div>
                
                      <div className="rounded-lg border p-4 bg-amber-50 dark:bg-amber-900/20">
                        <h5 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">Enhetsfokuserad</h5>
                        <div className="flex items-start">
                          <div className="bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-full p-1 mr-2 mt-0.5">
                            <Users className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs">Specifika avdelningar eller enheter</span>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          <span className="font-medium">När det passar:</span> Vid lokala stressutmaningar eller avdelningsspecifika problem
                </div>
              </div>
              
                      <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/20">
                        <h5 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Yrkesbaserad</h5>
                        <div className="flex items-start">
                          <div className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full p-1 mr-2 mt-0.5">
                            <Users className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs">Specifika yrkesroller eller funktioner</span>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          <span className="font-medium">När det passar:</span> Vid rollspecifika stressfaktorer (ex. kundtjänst, chefer)
                        </div>
                      </div>
                      
                      <div className="rounded-lg border p-4 bg-purple-50 dark:bg-purple-900/20">
                        <h5 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">Riskbaserad</h5>
                        <div className="flex items-start">
                          <div className="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full p-1 mr-2 mt-0.5">
                            <Users className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs">Personer med identifierade riskfaktorer</span>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          <span className="font-medium">När det passar:</span> För riktade förebyggande insatser och tidig intervention
                        </div>
                      </div>
                </div>
                
                    <div className="text-xs text-muted-foreground mt-4">
                      Källa: Biron & Karanika-Murray (2020), "Preventing stress at work: Process and intervention design"
                    </div>
                </div>
              </div>
              
                <div className="bg-card border rounded-lg p-5">
                  <div className="pb-4 mb-4 border-b border-border">
                    <h4 className="font-medium flex items-center">
                      <Target className="h-5 w-5 mr-2 text-primary" />
                      Effektivitet baserat på målgrupp
                  </h4>
              </div>
              
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 mr-2 rounded-sm"></div>
                          <span className="text-sm">Riktade insatser (högriskanställda)</span>
            </div>
                        <span className="text-sm font-medium">85%</span>
          </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 mr-2 rounded-sm"></div>
                          <span className="text-sm">Chefer och ledare</span>
                        </div>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-amber-500 mr-2 rounded-sm"></div>
                          <span className="text-sm">Specifika avdelningar</span>
                  </div>
                        <span className="text-sm font-medium">70%</span>
                    </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 mr-2 rounded-sm"></div>
                          <span className="text-sm">Hela organisationen</span>
                  </div>
                        <span className="text-sm font-medium">55%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '55%' }}></div>
                    </div>
                  </div>
                </div>
                
                  <div className="text-xs text-muted-foreground mt-4">
                    Procenttalen representerar effektivitet baserat på metaanalyser av arbetsmiljöinsatser.
                    <div className="mt-1">Källa: Richardson & Rothstein (2018); SBU (2021)</div>
                  </div>
                    </div>
                  </div>
              
              <div className="grid gap-6 mb-8">
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Differentiera insatserna baserat på behov</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 mx-auto mb-4">
                        <Crown className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-medium mb-2 text-center">Chefer och ledare</h4>
                      <ul className="text-xs space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Ledarskapsverktyg för att hantera stress i team</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Kommunikationsträning för svåra samtal</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Hantera egen stress under hög press</span>
                        </li>
                  </ul>
                </div>
                
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 mx-auto mb-4">
                        <Users className="h-6 w-6" />
                  </div>
                      <h4 className="text-sm font-medium mb-2 text-center">Medarbetare</h4>
                      <ul className="text-xs space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Individuella verktyg för stresshantering</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Balans mellan arbete och återhämtning</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Effektiv prioritering av arbetsuppgifter</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 mx-auto mb-4">
                        <HeartPulse className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-medium mb-2 text-center">Högriskgrupper</h4>
                      <ul className="text-xs space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Individuell coaching och stödsamtal</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Anpassade arbetsuppgifter och workload</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>Kontinuerlig uppföljning med företagshälsovård</span>
                        </li>
                  </ul>
                </div>
              </div>
              
                  <div className="text-xs text-muted-foreground mt-4 text-center">
                    Källa: Eurofound & EU-OSHA (2021), "Förebyggande och hantering av arbetsrelaterad stress"
                  </div>
                    </div>
                  </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Forskningsbaserade framgångsfaktorer för målgruppsanpassning
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="pl-5 list-disc space-y-1 text-sm text-amber-700 dark:text-amber-200">
                    <li>Tydlig kommunikation om vilka som omfattas och varför</li>
                    <li>Skräddarsy innehåll baserat på målgruppens specifika behov</li>
                    <li>Involvera målgruppen i utformningen av insatserna</li>
                  </ul>
                  <ul className="pl-5 list-disc space-y-1 text-sm text-amber-700 dark:text-amber-200">
                    <li>Utgå från kartlagda stressfaktorer för respektive grupp</li>
                    <li>Var tydlig med förväntningar och åtaganden</li>
                    <li>Säkerställ att ingen grupp känner sig utpekad</li>
                  </ul>
              </div>
                <div className="text-xs text-muted-foreground mt-3">
                  Källa: Havermans et al. (2018), "Process evaluation of workplace interventions"
              </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Innehåll för Intervention */}
        <TabsContent value="intervention" className="space-y-6">
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
              
              <h3 className="text-xl font-medium mt-8 mb-4">Insatsernas effektivitet</h3>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-8">
                <div className="bg-card border rounded-lg p-5">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                    Effektivitet för olika interventionstyper
                  </h4>
                  
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Kombinerade åtgärder (org + individ)</span>
                        <span className="text-sm font-medium">85%</span>
                  </div>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs inline-block py-1 px-2 uppercase rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              Mest effektivt
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
                
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Ledarskapsinsatser</span>
                        <span className="text-sm font-medium">75%</span>
                  </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Organisatoriska förändringar</span>
                        <span className="text-sm font-medium">70%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Individfokuserade insatser</span>
                        <span className="text-sm font-medium">50%</span>
                  </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </div>
                
                  <div className="text-xs text-muted-foreground mt-4">
                    Baserad på metaanalys av 100+ studier. Procentsatsen visar relativ effektstorlek.
                    <div className="mt-1">Källa: Richardson & Rothstein (2018); LaMontagne et al. (2007)</div>
                  </div>
                    </div>
                
                <div className="bg-card border rounded-lg p-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    Implementeringstid och effektuppskattning
                  </h4>
                  
                  <div className="relative">
                    {/* Implementeringsdiagram */}
                    <div className="w-full h-40 relative">
                      {/* Graf linjer */}
                      <div className="absolute left-0 bottom-0 w-full h-0.5 bg-gray-300 dark:bg-gray-700"></div>
                      <div className="absolute left-0 bottom-0 h-full w-0.5 bg-gray-300 dark:bg-gray-700"></div>
                      
                      {/* Y-axel labels */}
                      <div className="absolute -left-1 bottom-0 transform -translate-x-full flex flex-col justify-between h-full py-1 text-xs text-muted-foreground">
                        <span>Hög</span>
                        <span>Medel</span>
                        <span>Låg</span>
                  </div>
                      
                      {/* X-axel labels */}
                      <div className="absolute left-0 -bottom-6 w-full flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>3 mån</span>
                        <span>6 mån</span>
                        <span>12 mån</span>
                </div>
                
                      {/* Organisatoriska åtgärder (linje) */}
                      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                        <path 
                          d="M0,32 C40,45 80,60 100,20" 
                          fill="none" 
                          stroke="#8b5cf6" 
                          strokeWidth="2"
                          strokeDasharray="4 2" 
                        />
                        <circle cx="100" cy="20" r="4" fill="#8b5cf6" />
                      </svg>
                      
                      {/* Individfokuserade åtgärder (linje) */}
                      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                        <path 
                          d="M0,120 C30,80 70,40 100,60" 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth="2" 
                        />
                        <circle cx="100" cy="60" r="4" fill="#ef4444" />
                      </svg>
                  </div>
                    
                    <div className="mt-8 flex space-x-4 justify-center">
                      <div className="flex items-center">
                        <span className="h-3 w-3 rounded-full bg-purple-500 mr-2"></span>
                        <span className="text-xs">Organisatoriska åtgärder</span>
                    </div>
                      <div className="flex items-center">
                        <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                        <span className="text-xs">Individfokuserade åtgärder</span>
                  </div>
                </div>
              </div>
              
                  <div className="text-xs text-muted-foreground mt-4 text-center">
                    Källa: SBU (2020), "Tidsförlopp för olika interventionstyper"
                  </div>
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    </div>
                    <h4 className="font-medium">Organisatoriska insatser</h4>
              </div>
              
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-200">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Resursprioriteringar & rollförtydliganden</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Förbättrade arbetsprocesser</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Tydligare kommunikationsvägar</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-700 dark:text-green-300" />
                    </div>
                    <h4 className="font-medium">Ledarskapsinsatser</h4>
              </div>
              
                  <ul className="space-y-2 text-sm text-green-700 dark:text-green-200">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Ledarskapsutbildningar</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Verktyg för stresshantering i grupp</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Coaching för chefer</span>
                    </li>
                </ul>
              </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-5">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-700 dark:text-purple-300" />
            </div>
                    <h4 className="font-medium">Individfokuserade insatser</h4>
          </div>
                  
                  <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-200">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Stresshanteringskurser & mindfulness</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Personlig coaching</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Balans arbete-fritid</span>
                    </li>
                  </ul>
                </div>
              </div>
              
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
                        <Target className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                  </div>
                </div>
                    <div className="absolute right-4 bottom-41">
                      <div className="w-8 h-8 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center">
                        <Search className="h-4 w-4 text-red-700 dark:text-red-300" />
                  </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-4 text-center">
                  Källa: Forskningsbaserad implementationsmodell, SBU (2021)
                  </div>
                    </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center text-indigo-800 dark:text-indigo-300">
                  <LightbulbIcon className="h-5 w-5 mr-2" />
                  Framgångsfaktorer för lyckade interventioner
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-indigo-700 dark:text-indigo-200">
                      <li>Förankra insatserna på alla nivåer i organisationen</li>
                      <li>Säkerställ att implementeringen är realistisk</li>
                      <li>Tydliga roller och ansvar för genomförandet</li>
                </ul>
              </div>
                  <div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-indigo-700 dark:text-indigo-200">
                      <li>Anpassa insatserna efter behov och förutsättningar</li>
                      <li>Skapa struktur för kontinuerlig uppföljning</li>
                      <li>Kombinera organisatoriska och individuella insatser</li>
                    </ul>
                </div>
                  </div>
                <div className="text-xs text-muted-foreground mt-3">
                  Källa: Nielsen & Noblet (2018); Eurofound (2020)
                    </div>
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
              </p>
              
              <h3 className="text-xl font-medium mb-4">Steg i genomförandeplanen</h3>
              
              {reportData.implementationPlanArray && reportData.implementationPlanArray.length > 0 ? (
                <div className="space-y-6">
                  {reportData.implementationPlanArray.map((step, index) => {
                    // Försök extrahera datum och ansvarig om de finns i formatet (månad, ansvarig: namn)
                    const dateMatch = step.match(/\(([^,]+),\s*ansvarig:\s*([^)]+)\)/);
                    const timeFrame = dateMatch ? dateMatch[1].trim() : null;
                    const responsible = dateMatch ? dateMatch[2].trim() : null;
                    
                    // Rensa bort datum och ansvarig från beskrivningen
                    let cleanStep = step;
                    if (dateMatch) {
                      cleanStep = step.replace(/\(([^,]+),\s*ansvarig:\s*([^)]+)\)/, '').trim();
                    }
                    
                    // Välj färg baserat på index
                    const colors = [
                      { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-800 dark:text-blue-300", icon: "text-blue-500" },
                      { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", text: "text-green-800 dark:text-green-300", icon: "text-green-500" },
                      { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", text: "text-purple-800 dark:text-purple-300", icon: "text-purple-500" },
                      { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", text: "text-amber-800 dark:text-amber-300", icon: "text-amber-500" },
                    ];
                    
                    const color = colors[index % colors.length];
                    
                    // Välj icon baserat på index eller innehåll
                    const icons = [
                      <FileText key="icon1" className={`h-5 w-5 ${color.icon}`} />,
                      <Presentation key="icon2" className={`h-5 w-5 ${color.icon}`} />,
                      <Search key="icon3" className={`h-5 w-5 ${color.icon}`} />,
                      <ClipboardList key="icon4" className={`h-5 w-5 ${color.icon}`} />,
                    ];
                    
                    return (
                      <div key={index} className={`p-4 border rounded-lg ${color.bg} ${color.border}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color.bg} border ${color.border}`}>
                              <span className={`font-bold ${color.text}`}>{index + 1}</span>
                </div>
                            <h4 className={`font-medium ${color.text}`}>{cleanStep}</h4>
                          </div>
                          {timeFrame && (
                            <div className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-xs font-medium flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-primary" />
                              {timeFrame}
                            </div>
                          )}
              </div>
              
                        <div className="pl-11">
                          {responsible && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Ansvarig:</span>
                              <span className="font-medium">{responsible}</span>
                            </div>
                          )}
                          
                          <div className="mt-3 flex items-start gap-2">
                            {icons[index % icons.length]}
                            <div>
                              <p className="text-sm mt-0.5">{
                                index === 0 ? "Definiera och utvärdera metoder för implementering och uppföljning." :
                                index === 1 ? "Säkerställ att rätt verktyg och processer finns tillgängliga." :
                                index === 2 ? "Genomför planerade insatser enligt plan och dokumentera resultat." :
                                "Sammanställ resultat och utvärdera effekter för fortsatt förbättringsarbete."
                              }</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground mb-4">Ingen detaljerad genomförandeplan har angivits.</p>
              )}
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6 mt-8">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Forskningsbaserade tips: Framgångsrik implementering
                </h4>
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
        </TabsContent>

        {/* Innehåll för Rekommendation för beslut */}
        <TabsContent value="rekommendation" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Rekommendation</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Er rekommendation för beslut
              </p>
              <p className="mb-6">
                {reportData.recommendation || 'Ingen rekommendation har angivits i formuläret.'}
              </p>
              
              <h3 className="text-xl font-medium mb-4">ROI-analys för beslut</h3>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <div className="bg-card border rounded-lg p-5">
                  <div className="pb-4 mb-4 border-b border-border">
                    <h4 className="font-medium flex items-center">
                      <Percent className="h-5 w-5 mr-2 text-green-500" />
                      Avkastning på investering
                    </h4>
                </div>
                
                  <div className="relative pt-1">
                    <span className="text-4xl font-bold">
                      {formatPercent(reportData.roi || 0)}
                    </span>
                    <div className="text-sm text-muted-foreground mt-1">
                      Förväntad avkastning på investering
                </div>
                
                    <div className="mt-6 relative h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 ${(reportData.roi || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.min(100, Math.abs((reportData.roi || 0)) / 5)}%` }}
                      ></div>
                  </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>100%</span>
                      <span>200%</span>
                      <span>300%</span>
                      <span>400%</span>
                      <span>500%</span>
              </div>
              
                    <div className="mt-4 text-xs text-muted-foreground">
                      <div className="flex justify-between items-center">
                        <span>Normal nivå för arbetsmiljöinsatser:</span>
                        <span className="font-medium">50-150%</span>
                  </div>
                      <div className="text-right text-xs mt-1">Källa: SBU (2020)</div>
                  </div>
                </div>
              </div>
              
                <div className="bg-card border rounded-lg p-5">
                  <div className="pb-4 mb-4 border-b border-border">
                    <h4 className="font-medium flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                      Investering vs. Avkastning
                  </h4>
                </div>
                
                  <div className="flex items-end justify-center gap-4 h-44 mt-4">
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-2">Investering</div>
                      <div className="w-16 bg-blue-500 rounded-t-md" style={{ height: `${Math.min(100, (reportData.totalCost || 0) / 10000)}px` }}></div>
                      <div className="mt-2 text-sm font-medium">{formatCurrency(reportData.totalCost || 0, true)}</div>
              </div>
              
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-2">Avkastning</div>
                      <div className="w-16 bg-green-500 rounded-t-md" style={{ height: `${Math.min(100, (reportData.totalBenefit || 0) / 10000)}px` }}></div>
                      <div className="mt-2 text-sm font-medium">{formatCurrency(reportData.totalBenefit || 0, true)}</div>
              </div>
              
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-2">Nettoresultat</div>
                      <div className="w-16 bg-purple-500 rounded-t-md" style={{ height: `${Math.min(100, ((reportData.totalBenefit || 0) - (reportData.totalCost || 0)) / 10000)}px` }}></div>
                      <div className="mt-2 text-sm font-medium">{formatCurrency((reportData.totalBenefit || 0) - (reportData.totalCost || 0), true)}</div>
              </div>
            </div>
                  
                  <div className="mt-4 text-xs text-muted-foreground text-center">
                    Analys baserad på forskningsdata från Previa (2020) och SBU (2020)
          </div>
                </div>
                
                <div className="bg-card border rounded-lg p-5">
                  <div className="pb-4 mb-4 border-b border-border">
                    <h4 className="font-medium flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-amber-500" />
                      Kostnads-nyttoanalys över tid
                    </h4>
              </div>
              
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground">
                          <th className="text-left pb-2">Tidsperiod</th>
                          <th className="text-right pb-2">Investering</th>
                          <th className="text-right pb-2">Avkastning</th>
                          <th className="text-right pb-2">Nettoresultat</th>
                      </tr>
                    </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="py-2">År 1</td>
                          <td className="py-2 text-right text-red-500">-{formatCurrency(reportData.totalCost || 0, true)}</td>
                          <td className="py-2 text-right text-green-500">+{formatCurrency(reportData.totalBenefit || 0, true)}</td>
                          <td className="py-2 text-right">
                            {formatCurrency((reportData.totalBenefit || 0) - (reportData.totalCost || 0), true)}
                        </td>
                      </tr>
                      <tr>
                          <td className="py-2">År 2</td>
                          <td className="py-2 text-right text-red-500">-{formatCurrency(0)}</td>
                          <td className="py-2 text-right text-green-500">+{formatCurrency(reportData.totalBenefit || 0, true)}</td>
                          <td className="py-2 text-right">
                            {formatCurrency((reportData.totalBenefit || 0) * 2 - (reportData.totalCost || 0), true)}
                        </td>
                      </tr>
                      <tr>
                          <td className="py-2">År 3</td>
                          <td className="py-2 text-right text-red-500">-{formatCurrency(0)}</td>
                          <td className="py-2 text-right text-green-500">+{formatCurrency(reportData.totalBenefit || 0, true)}</td>
                          <td className="py-2 text-right">
                            {formatCurrency((reportData.totalBenefit || 0) * 3 - (reportData.totalCost || 0), true)}
                        </td>
                      </tr>
                      </tbody>
                      <tfoot>
                        <tr className="font-medium">
                          <td className="pt-3">Totalt 3 år</td>
                          <td className="pt-3 text-right text-red-500">-{formatCurrency(reportData.totalCost || 0, true)}</td>
                          <td className="pt-3 text-right text-green-500">+{formatCurrency((reportData.totalBenefit || 0) * 3, true)}</td>
                          <td className="pt-3 text-right">
                            {formatCurrency((reportData.totalBenefit || 0) * 3 - (reportData.totalCost || 0), true)}
                        </td>
                      </tr>
                      </tfoot>
                  </table>
                  </div>
                  
                  <div className="mt-4 text-xs text-muted-foreground text-center">
                    Källa: Projektionsmodell baserad på Richardson & Rothstein (2018)
                  </div>
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5">
                  <h4 className="font-medium mb-4 flex items-center text-green-800 dark:text-green-300">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Fördelar
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-green-700 dark:text-green-200">
                    <li>Stark ekonomisk avkastning (ROI: {formatPercent(reportData.roi || 0)})</li>
                    <li>Relativt kort återbetalningstid ({reportData.paybackPeriod ? formatMonths(reportData.paybackPeriod) : 'N/A'})</li>
                    <li>Minskad risk för långtidssjukskrivningar</li>
                    <li>Förbättrad produktivitet och arbetskvalitet</li>
                    <li>Stärkt arbetsgivarvarumärke</li>
                  </ul>
                  <div className="text-xs text-muted-foreground mt-3">
                    Källa: OECD (2021), "Mental Health and Work: Sweden"
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-5">
                  <h4 className="font-medium mb-4 flex items-center text-yellow-800 dark:text-yellow-300">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Risker att hantera
                  </h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-yellow-700 dark:text-yellow-200">
                    <li>Kräver avsättning av tid från chefer och medarbetare</li>
                    <li>Risk för bristande engagemang vid hög arbetsbelastning</li>
                    <li>Effekterna kan ta tid att materialiseras fullt ut</li>
                    <li>Kräver uthållighet i implementeringen</li>
                  </ul>
                  <div className="text-xs text-muted-foreground mt-3">
                    Källa: Nielsen & Randall (2018), "Implementeringskvalitet"
                  </div>
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">Jämförelse med nationell statistik</h3>
                
                <div className="mb-5">
                  <h4 className="text-sm font-medium mb-3">Avkastning på investering (ROI) för arbetsmiljöinsatser</h4>
                  
                  <div className="relative pb-5">
                    <div className="flex">
                      <div className="w-full h-10 flex items-center justify-center relative">
                        <div className="absolute inset-y-0 w-full bg-muted rounded-full"></div>
                        
                        {/* ROI markers */}
                        <div className="absolute inset-y-0 left-[10%] w-0.5 bg-gray-400"></div>
                        <div className="absolute inset-y-0 left-[30%] w-0.5 bg-gray-400"></div>
                        <div className="absolute inset-y-0 left-[50%] w-0.5 bg-gray-400"></div>
                        <div className="absolute inset-y-0 left-[70%] w-0.5 bg-gray-400"></div>
                        <div className="absolute inset-y-0 left-[90%] w-0.5 bg-gray-400"></div>
                        
                        {/* Current position indicator */}
                        <div 
                          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20"
                          style={{ left: `${Math.min(95, Math.max(5, ((reportData.roi || 0) / 5)))}%` }}
                        >
                          <div className="w-5 h-5 rounded-full bg-primary border-2 border-white dark:border-gray-800">
                            <span className="sr-only">Er ROI</span>
                          </div>
              </div>
              
                        {/* ROI range indicators */}
                        <div className="absolute inset-y-0 left-[30%] right-[70%] bg-red-200 dark:bg-red-900/30 rounded-full"></div>
                        <div className="absolute inset-y-0 left-[50%] right-[30%] bg-amber-200 dark:bg-amber-900/30 rounded-full"></div>
                        <div className="absolute inset-y-0 left-[70%] right-[10%] bg-green-200 dark:bg-green-900/30 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Låg ROI</span>
                      <span>Medium ROI</span>
                      <span>Hög ROI</span>
                    </div>
                    
                    <div className="flex justify-between text-xs mt-1">
                      <span>0%</span>
                      <span>100%</span>
                      <span>200%</span>
                      <span>300%</span>
                      <span>400%</span>
                      <span>500%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center mt-4">
                    <div>
                      <div className="text-xs font-medium">Lägsta observerade</div>
                      <div className="text-lg font-bold">50%</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Genomsnitt</div>
                      <div className="text-lg font-bold">150%</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Högsta observerade</div>
                      <div className="text-lg font-bold">400%</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-3 text-center">
                    Källa: SBU (2020), "Kostnadseffektivitet av insatser mot arbetsrelaterad psykisk ohälsa"
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center text-blue-800 dark:text-blue-300">
                  <Target className="h-5 w-5 mr-2" />
                  Förutsättningar för framgång
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/40 flex flex-col items-center text-center">
                    <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center mb-2">
                      <Users className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                    </div>
                    <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-300">Ledarskapsengagemang</h5>
                    <p className="text-xs">Tydligt engagemang från högsta ledningen</p>
              </div>
              
                  <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/40 flex flex-col items-center text-center">
                    <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center mb-2">
                      <CreditCard className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                    </div>
                    <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-300">Tillräckliga resurser</h5>
                    <p className="text-xs">Tid, finansiering och personal</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/40 flex flex-col items-center text-center">
                    <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center mb-2">
                      <Users className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                    </div>
                    <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-300">Bred delaktighet</h5>
                    <p className="text-xs">Involvera medarbetare i planering</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/40 flex flex-col items-center text-center">
                    <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center mb-2">
                      <Activity className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                    </div>
                    <h5 className="text-xs font-medium mb-1 text-blue-800 dark:text-blue-300">Systematisk uppföljning</h5>
                    <p className="text-xs">Regelbunden utvärdering mot mål</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-3 text-center">
                  Källa: Arbetsmiljöverket (2023), "Proaktivt arbetsmiljöarbete" och Nielsen & Randall (2018)
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Innehåll för Genomförandeplan */}
        <TabsContent value="genomforande" className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Genomförandeplan</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium mb-3">
                Er beskrivning av genomförandeplanen
              </p>
              <p className="mb-6">
                {reportData.implementationPlan || 'Ingen genomförandeplan har angivits i formuläret.'}
              </p>
              
              <h3 className="text-xl font-medium mb-4">Fasindelad implementeringsmodell</h3>
              
              {/* Gantt-diagram för tidplan */}
              <div className="bg-card border rounded-lg p-6 mb-8">
                <h4 className="font-medium mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Exempeltidsplan för genomförande
                </h4>
                
                <div className="relative overflow-x-auto">
                  <div className="w-full min-w-[600px]">
                    {/* Månadsindikatorer */}
                    <div className="flex mb-2">
                      <div className="w-1/3"></div>
                      <div className="w-2/3 flex">
                        <div className="flex-1 text-xs text-center">Månad 1-2</div>
                        <div className="flex-1 text-xs text-center">Månad 3-4</div>
                        <div className="flex-1 text-xs text-center">Månad 5-6</div>
                        <div className="flex-1 text-xs text-center">Månad 7-8</div>
                        <div className="flex-1 text-xs text-center">Månad 9-10</div>
                        <div className="flex-1 text-xs text-center">Månad 11-12</div>
                      </div>
                    </div>
                    
                    {/* Aktiviteter */}
                    <div className="space-y-3">
                      {/* Aktivitet 1 */}
                      <div className="flex items-center">
                        <div className="w-1/3 pr-4">
                          <span className="text-sm font-medium">Kartläggning och analys</span>
                        </div>
                        <div className="w-2/3 flex h-6 items-center">
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-blue-500"></div>
                          </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-blue-300"></div>
                          </div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                  </div>
                </div>
                
                      {/* Aktivitet 2 */}
                      <div className="flex items-center">
                        <div className="w-1/3 pr-4">
                          <span className="text-sm font-medium">Implementering organisatoriska åtgärder</span>
                  </div>
                        <div className="w-2/3 flex h-6 items-center">
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-green-500"></div>
                    </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-green-500"></div>
                          </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-green-300"></div>
                          </div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                  </div>
                </div>
                
                      {/* Aktivitet 3 */}
                      <div className="flex items-center">
                        <div className="w-1/3 pr-4">
                          <span className="text-sm font-medium">Utbildning för chefer och ledare</span>
                  </div>
                        <div className="w-2/3 flex h-6 items-center">
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-yellow-500"></div>
                    </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-yellow-500"></div>
                          </div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                  </div>
                </div>
                
                      {/* Aktivitet 4 */}
                      <div className="flex items-center">
                        <div className="w-1/3 pr-4">
                          <span className="text-sm font-medium">Implementering individinsatser</span>
                  </div>
                        <div className="w-2/3 flex h-6 items-center">
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-purple-500"></div>
                    </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-purple-500"></div>
                          </div>
                          <div className="flex-1 px-1"></div>
                  </div>
                </div>
                
                      {/* Aktivitet 5 */}
                      <div className="flex items-center">
                        <div className="w-1/3 pr-4">
                          <span className="text-sm font-medium">Utvärdering och uppföljning</span>
                  </div>
                        <div className="w-2/3 flex h-6 items-center">
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-red-300"></div>
                          </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-red-500"></div>
                    </div>
                  </div>
                </div>
                
                      {/* Aktivitet 6 */}
                      <div className="flex items-center">
                        <div className="w-1/3 pr-4">
                          <span className="text-sm font-medium">Kontinuerlig avstämning och justering</span>
                  </div>
                        <div className="w-2/3 flex h-6 items-center">
                          <div className="flex-1 px-1"></div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-gray-300"></div>
                    </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-gray-300"></div>
                  </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-gray-300"></div>
                          </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-gray-300"></div>
                          </div>
                          <div className="flex-1 px-1">
                            <div className="h-full rounded bg-gray-300"></div>
                          </div>
                        </div>
                </div>
              </div>
              
                    {/* Förklaring */}
                    <div className="mt-6 flex flex-wrap gap-3 justify-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 mr-2"></div>
                        <span className="text-xs">Förberedelse</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 mr-2"></div>
                        <span className="text-xs">Organisationsåtgärder</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 mr-2"></div>
                        <span className="text-xs">Utbildning</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 mr-2"></div>
                        <span className="text-xs">Individåtgärder</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 mr-2"></div>
                        <span className="text-xs">Utvärdering</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-300 mr-2"></div>
                        <span className="text-xs">Löpande aktivitet</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-4 text-center">
                  Anpassa tidsplanen efter organisationens förutsättningar och resurser.
                  <div className="mt-1">Källa: Baserad på SBU:s rekommendationer för implementering (2020)</div>
                </div>
              </div>
              
              <div className="relative mb-8">
                {/* Tidslinjen */}
                <div className="absolute h-full w-0.5 bg-gray-300 dark:bg-gray-700 left-6 top-0"></div>
                
                {/* Steg i genomförandeplanen */}
                {reportData.implementationPlanArray && reportData.implementationPlanArray.length > 0 ? (
                  reportData.implementationPlanArray.map((step, index) => (
                    <div key={index} className="flex mb-6 relative">
                      <div className="min-w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center relative z-10">
                        {index + 1}
                </div>
                      <div className="ml-6 bg-card border rounded-lg p-4 flex-1">
                        <p>{step}</p>
              </div>
                  </div>
                  ))
                ) : (
                  <div className="py-4 pl-14">
                    <p className="text-muted-foreground">Inga steg finns angivna i genomförandeplanen.</p>
                  </div>
                )}
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md border mb-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Forskningsbaserade tips: Framgångsrik implementering
                </h4>
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
        </TabsContent>
      </Tabs>
    </div>
  );
} 
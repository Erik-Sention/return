"use client";

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { loadROIReportData, ROIReportData } from '@/lib/reports/reportUtils';
import { printToPdf } from '@/lib/reports/pdfExport';
import { ReportContext } from './components/ReportContext';

export default function DetaljeradRapportLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [reportData, setReportData] = useState<ROIReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const activeTab = pathname ? pathname.split('/').pop() || 'nulage' : 'nulage';

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
      printToPdf();
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
    <ReportContext.Provider value={{ reportData, isLoading, error }}>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/rapporter">
              <Button variant="ghost" className="gap-2 mb-2">
                <ArrowLeft className="h-4 w-4" />
                Tillbaka till rapporter
              </Button>
            </Link>
            {!pathname?.includes('aggregerad') && (
              <>
                <h1 className="text-3xl font-bold">Detaljerad forskningsbaserad rapport</h1>
                <p className="text-muted-foreground mt-1">
                  Djupgående analys av ROI för {reportData.sharedFields?.organizationName || 'din organisation'}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExportPdf} className="gap-2">
              <FileText className="h-4 w-4" />
              Exportera PDF
            </Button>
          </div>
        </div>
        
        <div className="mb-8 border-b border-border">
          <nav className="flex overflow-x-auto">
            <Link href="/rapporter/detaljerad/nulage">
              <Button variant={activeTab === 'nulage' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4">
                Nuläge
              </Button>
            </Link>
            <Link href="/rapporter/detaljerad/orsak">
              <Button variant={activeTab === 'orsak' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4">
                Orsaksanalys
              </Button>
            </Link>
            <Link href="/rapporter/detaljerad/syfte">
              <Button variant={activeTab === 'syfte' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4">
                Syfte med insatserna
              </Button>
            </Link>
            <Link href="/rapporter/detaljerad/mal">
              <Button variant={activeTab === 'mal' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4">
                Målsättning
              </Button>
            </Link>
            <Link href="/rapporter/detaljerad/malgrupp">
              <Button variant={activeTab === 'malgrupp' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4">
                Målgrupp
              </Button>
            </Link>
            <Link href="/rapporter/detaljerad/intervention">
              <Button variant={activeTab === 'intervention' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4">
                Intervention
              </Button>
            </Link>
            <Link href="/rapporter/detaljerad/plan">
              <Button variant={activeTab === 'plan' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4">
                Genomförandeplan
              </Button>
            </Link>
            <Link href="/rapporter/detaljerad/rekommendation">
              <Button variant={activeTab === 'rekommendation' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4">
                Rekommendation
              </Button>
            </Link>
            <Link href="/rapporter/detaljerad/nyckeltal">
              <Button variant={activeTab === 'nyckeltal' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4">
                Nyckeltal
              </Button>
            </Link>
            <Link href="/rapporter/detaljerad/aggregerad">
              <Button variant={activeTab === 'aggregerad' ? 'default' : 'ghost'} className="rounded-none border-b-2 border-transparent px-4 ml-4 bg-primary/10">
                Komplett rapport
              </Button>
            </Link>
          </nav>
        </div>

        {children}
      </div>
    </ReportContext.Provider>
  );
} 
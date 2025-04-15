"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ComparativeROICalculator from '@/components/forms/ComparativeROICalculator';

export default function ComparativeROIPage() {
  const { currentUser, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Om användaren inte är inloggad och laddningen är klar, redirecta till login
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl">Laddar jämförande ROI-kalkylator...</div>
      </div>
    );
  }

  // Om användaren inte är inloggad, visa ingenting (vi redirectar ändå)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Jämförande ROI-kalkylator</h1>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-md border border-border">
        <ComparativeROICalculator />
      </div>
      
      <div className="p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Om jämförande ROI-kalkylatorn</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Den jämförande ROI-kalkylatorn hjälper dig utvärdera och jämföra flera olika insatser mot stress och 
          psykisk ohälsa på arbetsplatsen. Detta hjälper dig fatta välgrundade beslut om vilka insatser som 
          kan ge bäst avkastning på din investering.
        </p>
        <p className="text-sm text-muted-foreground">
          Verktyget använder organisationens basdata för att beräkna den totala kostnaden för stress och psykisk 
          ohälsa, och jämför sedan avkastningen för olika insatser baserat på deras kostnad och förväntade effekt.
        </p>
      </div>
    </div>
  );
} 
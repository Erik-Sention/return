"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AuthForm from '@/components/ui/auth/AuthForm';
import { FileText, PieChart, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RapportPage() {
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
        <div className="animate-pulse text-xl">Laddar...</div>
      </div>
    );
  }

  // Om användaren inte är inloggad, visa login-formuläret
  if (!currentUser) {
    return (
      <div className="container py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Rapporter - ROI-kalkylatorn</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Logga in eller registrera dig för att se dina rapporter
          </p>
        </div>
        
        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mina rapporter</h1>
        <p className="text-muted-foreground">Visualisera och analysera dina ROI-beräkningar</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Exekutiv sammanfattning kort */}
        <Link href="/rapporter/exekutiv" className="group">
          <div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-sm font-medium px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full">
                Sammanfattning
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-500 transition-colors">
              Exekutiv sammanfattning
            </h2>
            <p className="text-muted-foreground mb-4">
              Översiktlig presentation av dina ROI-resultat för beslutsfattare
            </p>
            <Button className="w-full">Visa rapport</Button>
          </div>
        </Link>

        {/* Detaljerade resultat kort */}
        <div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-purple-500/20 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <PieChart className="h-6 w-6 text-purple-500" />
            </div>
            <span className="text-sm font-medium px-2 py-1 bg-purple-500/10 text-purple-500 rounded-full">
              Detaljerad
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-2 group-hover:text-purple-500 transition-colors">
            Detaljerade resultat
          </h2>
          <p className="text-muted-foreground mb-4">
            Djupgående analys med detaljerade diagram och tabeller
          </p>
          <Button variant="outline" className="w-full" disabled>Kommer snart</Button>
        </div>

        {/* Trendanalys kort */}
        <div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-green-500/20 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-sm font-medium px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
              Trender
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-2 group-hover:text-green-500 transition-colors">
            Trendanalys
          </h2>
          <p className="text-muted-foreground mb-4">
            Analysera trender över tid baserat på flera ROI-beräkningar
          </p>
          <Button variant="outline" className="w-full" disabled>Kommer snart</Button>
        </div>
      </div>
    </div>
  );
} 
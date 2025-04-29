"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AuthForm from '@/components/ui/auth/AuthForm';
import { Calculator, BarChart3, Folder } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <h1 className="text-3xl font-bold mb-4">Välkommen till ROI-kalkylatorn</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Logga in eller registrera dig för att komma åt ROI-kalkylatorn
          </p>
        </div>
        
        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    );
  }

  // Dashboard för inloggade användare
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Välkommen, {currentUser.displayName || currentUser.email}</h1>
        <p className="text-muted-foreground">Översikt över dina ROI-beräkningar och verktyg</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* ROI-projekt kort */}
        <Link href="/roi-projects" className="group">
          <div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-emerald-500/20 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-lg">
                <Folder className="h-6 w-6 text-emerald-500" />
              </div>
              <span className="text-sm font-medium px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
                Nytt
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-emerald-500 transition-colors">
              ROI-projekt
            </h2>
            <p className="text-muted-foreground">
              Skapa och hantera flera olika ROI-kalkylprojekt
            </p>
          </div>
        </Link>

        {/* Förenklad ROI-kalkylator kort */}
        <Link href="/roi/simple" className="group">
          <div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-amber-500/20 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-500/10 p-3 rounded-lg">
                <Calculator className="h-6 w-6 text-amber-500" />
              </div>
              <span className="text-sm font-medium px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full">
                Snabb
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-amber-500 transition-colors">
              Förenklad ROI
            </h2>
            <p className="text-muted-foreground">
              Snabb översikt av ROI med de viktigaste variablerna
            </p>
          </div>
        </Link>

        {/* Jämförande ROI-kalkylator kort */}
        <Link href="/roi/comparative" className="group">
          <div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-teal-500/20 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-teal-500/10 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-teal-500" />
              </div>
              <span className="text-sm font-medium px-2 py-1 bg-teal-500/10 text-teal-500 rounded-full">
                Ny
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-teal-500 transition-colors">
              Jämförande ROI
            </h2>
            <p className="text-muted-foreground">
              Jämför olika insatser för att hitta den med bäst avkastning
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-8 p-6 bg-card rounded-lg shadow-md border border-border">
        <h2 className="text-xl font-semibold mb-4">Snabbstart</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="font-bold text-primary">1</span>
            </div>
            <div>
              <h3 className="font-medium">Skapa ROI-beräkning</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Börja med att fylla i Formulär A med grundläggande information
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="font-bold text-primary">2</span>
            </div>
            <div>
              <h3 className="font-medium">Fyll i ekonomiska data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Fortsätt med formulären B-D för ekonomiska och organisatoriska faktorer
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="font-bold text-primary">3</span>
            </div>
            <div>
              <h3 className="font-medium">Analysera resultat</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Se resultatet av din beräkning i realtid med insiktsfulla rapporter
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="font-bold text-primary">4</span>
            </div>
            <div>
              <h3 className="font-medium">Spara och dela</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Spara dina beräkningar och dela dem med kollegor eller klienter
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AuthForm from '@/components/ui/auth/AuthForm';
import { Calculator, FileText, Settings, BarChart3, Users } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ROI-kalkylator kort */}
        <Link href="/roi" className="group">
          <div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-all border border-border hover:border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                Verktyg
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              ROI-kalkylator
            </h2>
            <p className="text-muted-foreground mb-4">
              Beräkna avkastning på investering för hälsofrämjande insatser
            </p>
            <Button className="w-full">Öppna kalkylator</Button>
          </div>
        </Link>

        {/* Mina rapporter kort */}
        <div className="bg-card rounded-lg shadow-md p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-sm font-medium px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full">
              Rapporter
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Mina rapporter
          </h2>
          <p className="text-muted-foreground mb-4">
            Hantera och visa dina sparade ROI-beräkningar
          </p>
          <Button variant="outline" className="w-full" disabled>Kommer snart</Button>
        </div>

        {/* Statistik kort */}
        <div className="bg-card rounded-lg shadow-md p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-sm font-medium px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
              Statistik
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Översikt och trender
          </h2>
          <p className="text-muted-foreground mb-4">
            Se statistik och trender baserat på dina ROI-beräkningar
          </p>
          <Button variant="outline" className="w-full" disabled>Kommer snart</Button>
        </div>
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
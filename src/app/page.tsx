"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calculator } from 'lucide-react';
import Image from "next/image";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div className="flex justify-center mb-6">
          <Image 
            src="https://i.postimg.cc/FRwbMSBN/SENTION-logo-Black-Transparent-BG.png" 
            alt="SENTION Logga" 
            width={300}
            height={100}
            priority
          />
        </div>
        <h1 className="text-4xl font-bold sm:text-6xl">
          Välkommen till SENTIONS ROI-Kalkylator
        </h1>
        <p className="text-xl text-muted-foreground">
          Beräkna avkastning på investering för hälsofrämjande insatser
        </p>
        
        <div className="flex justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              <Calculator className="h-5 w-5" />
              Öppna ROI-kalkylatorn
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 bg-card rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Enkel att använda</h2>
            <p className="text-muted-foreground">
              Steg-för-steg guide genom hela ROI-beräkningsprocessen
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Automatiska beräkningar</h2>
            <p className="text-muted-foreground">
              Låt systemet göra beräkningarna åt dig med realtidsuppdateringar
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Spara och dela</h2>
            <p className="text-muted-foreground">
              Exportera dina beräkningar i olika format
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

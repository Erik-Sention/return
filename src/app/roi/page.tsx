"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import FormA from '@/components/forms/FormA';
import FormTimeline from '@/components/forms/FormTimeline';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ROIPage() {
  const [currentForm] = useState('A');
  const [completedForms] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const { currentUser, loading } = useAuth();
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
        <div className="animate-pulse text-xl">Laddar ROI-kalkylator...</div>
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
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till start
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">ROI-kalkylator</h1>
        </div>
      </div>

      <div className="space-y-6">
        <FormTimeline 
          currentForm={currentForm}
          completedForms={completedForms}
        />

        <div className="bg-card rounded-lg shadow p-6">
          <FormA />
        </div>
      </div>
    </div>
  );
} 
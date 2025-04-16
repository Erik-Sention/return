"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FadeIn } from '@/components/ui/fade-in';

export default function DetaljeradRapportIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId');
  
  // Logga projektId för debugging
  console.log('DetaljeradRapportIndexPage - projectId:', projectId);

  useEffect(() => {
    // Kort fördröjning för att visa fade-in-effekt innan redirect
    const timer = setTimeout(() => {
      const redirectPath = projectId 
        ? `/rapporter/detaljerad/nulage?projectId=${projectId}`
        : '/rapporter/detaljerad/nulage';
      
      console.log('Omdirigerar till:', redirectPath);
      
      // Använd replace istället för push för att ersätta historieposten
      router.replace(redirectPath);
    }, 500);

    return () => clearTimeout(timer);
  }, [router, projectId]);

  return (
    <FadeIn show={true} duration={300} delay={0}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Omdirigerar...</div>
      </div>
    </FadeIn>
  );
} 
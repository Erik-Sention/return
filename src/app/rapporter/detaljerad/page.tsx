"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FadeIn } from '@/components/ui/fade-in';

export default function DetaljeradRapportIndexPage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    // Kort fördröjning för att visa fade-in-effekt innan redirect
    const timer = setTimeout(() => {
      router.push('/rapporter/detaljerad/nulage');
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <FadeIn show={redirecting} duration={300} delay={0}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Omdirigerar...</div>
      </div>
    </FadeIn>
  );
} 
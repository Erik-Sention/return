"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b" /> {/* Navbar placeholder */}
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse text-xl flex justify-center items-center min-h-[50vh]">
            Laddar...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 
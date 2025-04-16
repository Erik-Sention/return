"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { NulageTab } from '@/app/rapporter/detaljerad/tabs/NulageTab';
import { TabContent } from '../components/TabContent';

export default function NulagePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId');
  
  // Logga när NulagePage laddas
  useEffect(() => {
    console.log('NulagePage laddad med projectId:', projectId);
    
    // Installera en timer för att övervaka om projektId finns/ändras
    const intervalId = setInterval(() => {
      console.log('NulagePage - projectId check:', searchParams?.get('projectId'));
    }, 500); // Kolla var 500ms
    
    return () => clearInterval(intervalId);
  }, [projectId, searchParams]);
  
  return (
    <TabContent>
      {(reportData) => <NulageTab reportData={reportData} />}
    </TabContent>
  );
} 
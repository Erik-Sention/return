"use client";

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function CatchAllPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId');
  
  // Logga för debugging
  useEffect(() => {
    console.log('CatchAllPage för rapporter triggered');
    console.log('params:', params);
    console.log('projectId:', projectId);
  }, [params, projectId]);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sida hittades inte</h1>
      <p>Den här sidan existerar inte. Prova att gå tillbaka till översiktssidan.</p>
      <pre className="bg-gray-100 p-4 mt-4 rounded">
        Path: {JSON.stringify(params)}
        <br />
        ProjectId: {projectId || 'inget projektId'}
      </pre>
    </div>
  );
} 
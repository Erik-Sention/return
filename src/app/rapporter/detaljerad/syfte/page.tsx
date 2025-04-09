"use client";

import { SyfteTab } from '@/app/rapporter/detaljerad/tabs/SyfteTab';
import { TabContent } from '../components/TabContent';

export default function SyftePage() {
  return (
    <TabContent>
      {(reportData) => <SyfteTab reportData={reportData} />}
    </TabContent>
  );
} 
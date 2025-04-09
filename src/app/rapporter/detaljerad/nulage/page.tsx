"use client";

import { NulageTab } from '@/app/rapporter/detaljerad/tabs/NulageTab';
import { TabContent } from '../components/TabContent';

export default function NulagePage() {
  return (
    <TabContent>
      {(reportData) => <NulageTab reportData={reportData} />}
    </TabContent>
  );
} 
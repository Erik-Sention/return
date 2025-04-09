"use client";

import { InterventionTab } from '@/app/rapporter/detaljerad/tabs/InterventionTab';
import { TabContent } from '../components/TabContent';

export default function InterventionPage() {
  return (
    <TabContent>
      {(reportData) => <InterventionTab reportData={reportData} />}
    </TabContent>
  );
} 
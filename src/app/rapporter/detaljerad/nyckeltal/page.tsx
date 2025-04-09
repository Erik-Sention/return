"use client";

import { NyckeltalsTab } from '@/app/rapporter/detaljerad/tabs/NyckeltalsTab';
import { TabContent } from '../components/TabContent';

export default function NyckeltalsPage() {
  return (
    <TabContent>
      {(reportData) => <NyckeltalsTab reportData={reportData} />}
    </TabContent>
  );
} 
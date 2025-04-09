"use client";

import { OrsakTab } from '@/app/rapporter/detaljerad/tabs/OrsakTab';
import { TabContent } from '../components/TabContent';

export default function OrsakPage() {
  return (
    <TabContent>
      {(reportData) => <OrsakTab reportData={reportData} />}
    </TabContent>
  );
} 
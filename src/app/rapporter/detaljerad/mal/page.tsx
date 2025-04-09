"use client";

import { MalTab } from '@/app/rapporter/detaljerad/tabs/MalTab';
import { TabContent } from '../components/TabContent';

export default function MalPage() {
  return (
    <TabContent>
      {(reportData) => <MalTab reportData={reportData} />}
    </TabContent>
  );
} 
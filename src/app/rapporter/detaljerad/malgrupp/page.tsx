"use client";

import { MalgruppTab } from '@/app/rapporter/detaljerad/tabs/MalgruppTab';
import { TabContent } from '../components/TabContent';

export default function MalgruppPage() {
  return (
    <TabContent>
      {(reportData) => <MalgruppTab reportData={reportData} />}
    </TabContent>
  );
} 
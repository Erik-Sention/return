"use client";

import { RekommendationTab } from '@/app/rapporter/detaljerad/tabs/RekommendationTab';
import { TabContent } from '../components/TabContent';

export default function RekommendationPage() {
  return (
    <TabContent>
      {(reportData) => <RekommendationTab reportData={reportData} />}
    </TabContent>
  );
} 
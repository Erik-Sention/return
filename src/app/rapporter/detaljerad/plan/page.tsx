"use client";

import { GenomforandePlanTab } from '@/app/rapporter/detaljerad/tabs/GenomforandePlanTab';
import { TabContent } from '../components/TabContent';

export default function PlanPage() {
  return (
    <TabContent>
      {(reportData) => <GenomforandePlanTab reportData={reportData} />}
    </TabContent>
  );
} 
import React, { lazy, Suspense } from 'react';
import { PageWithMiniTabs, type MiniTab } from '@/components/PageWithMiniTabs';
import { Activity, BarChart3 } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// Lazy load panels to minimize initial bundle
const KPIsPanel = lazy(() => import('./panels/KPIsPanel'));
const BehaviorPanel = lazy(() => import('./panels/BehaviorPanel'));

/**
 * Dashboard - Proof-of-concept dashboard using PageWithMiniTabs
 * 
 * This is a simple dashboard that demonstrates the MiniTabs UI pattern
 * with lazy-loaded panels. Replace the panel stubs with real implementations.
 */
export default function DashboardWithMiniTabs() {
  const tabs: MiniTab[] = [
    { id: 'kpis', label: 'KPIs', icon: <Activity className="h-4 w-4" /> },
    { id: 'behavior', label: 'Behavior', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <PageWithMiniTabs
      pageTitle="Dashboard"
      pageSubtitle="Real-time analytics and performance metrics"
      tabs={tabs}
      initial="kpis"
    >
      {(active) => (
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
        >
          {active === 'kpis' && <KPIsPanel />}
          {active === 'behavior' && <BehaviorPanel />}
        </Suspense>
      )}
    </PageWithMiniTabs>
  );
}


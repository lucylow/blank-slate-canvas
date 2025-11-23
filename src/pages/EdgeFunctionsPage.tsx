// src/pages/EdgeFunctionsPage.tsx
// Edge Functions Dashboard Page

import { EdgeFunctionsDashboard } from '@/components/EdgeFunctionsDashboard';
import { RouteLayout } from '@/components/layout/RouteLayout';

export default function EdgeFunctionsPage() {
  return (
    <RouteLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Edge Functions</h1>
          <p className="text-muted-foreground">
            Real-time analytics functions for race strategy and driver coaching
          </p>
        </div>
        <EdgeFunctionsDashboard />
      </div>
    </RouteLayout>
  );
}


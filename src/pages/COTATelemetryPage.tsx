import { COTATelemetryDashboard } from '@/components/dashboard/COTATelemetryDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function COTATelemetryPage() {
  return (
    <ErrorBoundary>
      <COTATelemetryDashboard />
    </ErrorBoundary>
  );
}


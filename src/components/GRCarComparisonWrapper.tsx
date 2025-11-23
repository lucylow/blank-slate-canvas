import React from 'react';
import { TelemetryProvider } from '@/hooks/useTelemetry';
import GRCarComparison from '@/components/GRCarComparison';
import type { TrackId } from '@/lib/grCarTypes';

interface GRCarComparisonWrapperProps {
  selectedTrack?: TrackId;
  onTrackChange?: (track: TrackId) => void;
}

const GRCarComparisonWrapper: React.FC<GRCarComparisonWrapperProps> = (props) => {
  return (
    <TelemetryProvider>
      <GRCarComparison {...props} />
    </TelemetryProvider>
  );
};

export default GRCarComparisonWrapper;


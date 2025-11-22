import React from "react";
import DriverFingerprintDashboard from "./DriverFingerprintDashboard";

interface DriverFingerprintProps {
  driverId: string;
  onReplay?: (evidence: any) => void;
}

export default function DriverFingerprint({ driverId, onReplay }: DriverFingerprintProps) {
  return <DriverFingerprintDashboard driverId={driverId} onReplay={onReplay} />;
}


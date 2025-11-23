// src/mocks/notificationMockData.ts
// Mock data generators for notifications

import {
  showRaceAlert,
  showPitAlert,
  showTireAlert,
  showHumanLoop,
  type RaceAlertData,
  type PitAlertData,
  type TireAlertData,
  type HumanLoopData,
} from "@/services/notificationService";

// Re-export notification functions for use in hooks
export { showRaceAlert, showPitAlert, showTireAlert, showHumanLoop };

// Mock vehicle data
const MOCK_VEHICLES = [
  { id: 'GR86-001-10', number: 10, driver: 'Alex Johnson' },
  { id: 'GR86-002-20', number: 20, driver: 'Sam Martinez' },
  { id: 'GR86-003-30', number: 30, driver: 'Jordan Taylor' },
  { id: 'GR86-004-78', number: 78, driver: 'Casey Chen' },
  { id: 'GR86-006-13', number: 13, driver: 'Morgan Lee' },
  { id: 'GR86-008-22', number: 22, driver: 'Riley Brown' },
  { id: 'GR86-010-46', number: 46, driver: 'Quinn Davis' },
];

const MOCK_RACE_NAMES = [
  'GR Cup North America - Sonoma',
  'GR Cup North America - COTA',
  'GR Cup North America - Barber Motorsports',
  'GR Cup North America - Road America',
  'GR Cup North America - VIR',
];

const PIT_REASONS = [
  'Tire wear critical',
  'Scheduled pit stop',
  'Strategy adjustment',
  'Damage inspection',
  'Fuel strategy',
];

// Generate random race alert
export function generateRaceAlert(): RaceAlertData {
  const events = [
    'Lap completed',
    'Position change',
    'Fastest lap',
    'Yellow flag',
    'Green flag',
    'Incident detected',
    'Overtaking opportunity',
    'Defensive position needed',
  ];

  const event = events[Math.floor(Math.random() * events.length)];
  const vehicle = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];
  
  const details: Record<string, string> = {
    Vehicle: `Car #${vehicle.number} - ${vehicle.driver}`,
  };

  if (event.includes('Lap')) {
    const lap = Math.floor(Math.random() * 30) + 1;
    const lapTime = (99 + Math.random() * 2).toFixed(3);
    details['Lap'] = `${lap}`;
    details['Lap Time'] = `${lapTime}s`;
  }

  if (event.includes('Position')) {
    const oldPos = Math.floor(Math.random() * 10) + 1;
    const newPos = oldPos - Math.floor(Math.random() * 2);
    details['Previous'] = `P${oldPos}`;
    details['Current'] = `P${newPos}`;
  }

  if (event.includes('Fastest lap')) {
    const lapTime = (98 + Math.random() * 1.5).toFixed(3);
    details['Time'] = `${lapTime}s`;
  }

  return {
    raceName: MOCK_RACE_NAMES[Math.floor(Math.random() * MOCK_RACE_NAMES.length)],
    event,
    details,
  };
}

// Generate random pit alert
export function generatePitAlert(): PitAlertData {
  const vehicle = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];
  const lap = Math.floor(Math.random() * 25) + 5;
  const reason = PIT_REASONS[Math.floor(Math.random() * PIT_REASONS.length)];
  const estimatedTime = (25 + Math.random() * 10).toFixed(1);

  return {
    vehicle: vehicle.id,
    vehicleNumber: vehicle.number,
    lap,
    reason,
    estimatedTime: `${estimatedTime}s`,
    recommendedAction: reason.includes('Tire') ? 'Change to Medium compound' : undefined,
  };
}

// Generate random tire alert
export function generateTireAlert(): TireAlertData {
  const vehicle = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];
  const currentLap = Math.floor(Math.random() * 30) + 1;
  
  // Generate tire wear values (lower = more worn)
  const baseWear = 30 + Math.random() * 50; // 30-80%
  const frontLeft = Math.max(20, baseWear + (Math.random() - 0.5) * 15);
  const frontRight = Math.max(20, baseWear + (Math.random() - 0.5) * 15);
  const rearLeft = Math.max(20, baseWear + (Math.random() - 0.5) * 15);
  const rearRight = Math.max(20, baseWear + (Math.random() - 0.5) * 15);

  const avgWear = (frontLeft + frontRight + rearLeft + rearRight) / 4;
  const recommendedLap = avgWear < 50 ? currentLap + Math.floor(Math.random() * 5) + 1 : undefined;

  return {
    vehicle: vehicle.id,
    vehicleNumber: vehicle.number,
    frontLeft,
    frontRight,
    rearLeft,
    rearRight,
    recommendedLap,
    currentLap,
  };
}

// Generate human-in-the-loop popup
export function generateHumanLoop(): HumanLoopData {
  const types: Array<'confirmation' | 'decision' | 'approval'> = ['confirmation', 'decision', 'approval'];
  const type = types[Math.floor(Math.random() * types.length)];

  const vehicle = MOCK_VEHICLES[Math.floor(Math.random() * MOCK_VEHICLES.length)];

  if (type === 'confirmation') {
    return {
      title: 'Confirm Pit Stop Strategy',
      message: `AI recommends changing pit strategy for Car #${vehicle.number}. Change from 2-stop to 3-stop strategy?`,
      type: 'confirmation',
      options: [
        { label: 'Approve', value: 'approve', variant: 'default' },
        { label: 'Reject', value: 'reject', variant: 'destructive' },
      ],
    };
  } else if (type === 'decision') {
    return {
      title: 'Tire Compound Decision',
      message: `Car #${vehicle.number} entering pit lane. Which compound should be used?`,
      type: 'decision',
      options: [
        { label: 'Soft', value: 'soft', variant: 'default' },
        { label: 'Medium', value: 'medium', variant: 'default' },
        { label: 'Hard', value: 'hard', variant: 'default' },
      ],
    };
  } else {
    return {
      title: 'Overtaking Strategy Approval',
      message: `AI detected overtaking opportunity for Car #${vehicle.number} on upcoming corner. Approve aggressive move?`,
      type: 'approval',
      options: [
        { label: 'Approve', value: 'approve', variant: 'default' },
        { label: 'Conservative', value: 'conservative', variant: 'default' },
        { label: 'Reject', value: 'reject', variant: 'destructive' },
      ],
    };
  }
}

// Trigger a random notification (for demo/testing)
export function triggerRandomNotification(): void {
  const types = ['race-alert', 'pit-alert', 'tire-alert', 'human-loop'];
  const type = types[Math.floor(Math.random() * types.length)];

  switch (type) {
    case 'race-alert':
      showRaceAlert(generateRaceAlert());
      break;
    case 'pit-alert':
      showPitAlert(generatePitAlert());
      break;
    case 'tire-alert':
      showTireAlert(generateTireAlert());
      break;
    case 'human-loop':
      showHumanLoop(generateHumanLoop());
      break;
  }
}

// Simulate race events (for continuous demo)
export function startMockNotificationSimulation(intervalMs: number = 30000): () => void {
  let intervalId: NodeJS.Timeout;

  const scheduleNext = () => {
    const delay = intervalMs + (Math.random() - 0.5) * intervalMs * 0.5; // ±25% variance
    
    intervalId = setTimeout(() => {
      triggerRandomNotification();
      scheduleNext();
    }, delay);
  };

  scheduleNext();

  return () => {
    if (intervalId) {
      clearTimeout(intervalId);
    }
  };
}


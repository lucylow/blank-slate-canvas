// src/services/notificationService.ts
// Global notification service for race alerts, pit/tire alerts, and human-in-the-loop popups

import { toast } from "sonner";
import { sendRaceAlert, sendPitStopNotification, sendTireWearAlert } from "@/api/slack";

export type NotificationType = 'race-alert' | 'pit-alert' | 'tire-alert' | 'human-loop';

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface RaceAlertData {
  raceName: string;
  event: string;
  details?: Record<string, string>;
  timestamp?: Date;
}

export interface PitAlertData {
  vehicle: string;
  vehicleNumber: number;
  lap: number;
  reason: string;
  estimatedTime?: string;
  recommendedAction?: string;
}

export interface TireAlertData {
  vehicle: string;
  vehicleNumber: number;
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
  recommendedLap?: number;
  currentLap?: number;
}

export interface HumanLoopData {
  title: string;
  message: string;
  type: 'confirmation' | 'decision' | 'approval';
  options?: Array<{ label: string; value: string; variant?: 'default' | 'destructive' }>;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: Date;
  data?: RaceAlertData | PitAlertData | TireAlertData | HumanLoopData;
  dismissed?: boolean;
}

// Notification queue
let notificationQueue: Notification[] = [];
let listeners: Array<(notifications: Notification[]) => void> = [];
let humanLoopQueue: Array<{ notification: Notification; resolve: (value: string | null) => void }> = [];
let isProcessingHumanLoop = false;

// Generate unique ID
function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Notify all listeners
function notifyListeners() {
  listeners.forEach(listener => listener([...notificationQueue]));
}

// Show toast notification
function showToastNotification(notification: Notification) {
  const severityConfig = {
    info: { icon: 'ℹ️', variant: 'default' as const },
    warning: { icon: '⚠️', variant: 'warning' as const },
    critical: { icon: '🚨', variant: 'error' as const },
    success: { icon: '✅', variant: 'success' as const },
  };

  const config = severityConfig[notification.severity] || severityConfig.info;

  toast[config.variant === 'default' ? 'info' : config.variant](notification.title, {
    description: notification.message,
    duration: notification.severity === 'critical' ? 10000 : 5000,
    action: {
      label: 'View',
      onClick: () => {
        // Could open a details modal here
      },
    },
  });
}

// Add notification to queue
export function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'dismissed'>): string {
  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    timestamp: new Date(),
    dismissed: false,
  };

  notificationQueue.unshift(newNotification);
  
  // Keep only last 50 notifications
  if (notificationQueue.length > 50) {
    notificationQueue = notificationQueue.slice(0, 50);
  }

  // Show toast for non-human-loop notifications
  if (notification.type !== 'human-loop') {
    showToastNotification(newNotification);
    
    // Also send to Slack if configured
    if (notification.type === 'race-alert' && notification.data) {
      const data = notification.data as RaceAlertData;
      sendRaceAlert(data.raceName, data.event, data.details).catch(console.error);
    } else if (notification.type === 'pit-alert' && notification.data) {
      const data = notification.data as PitAlertData;
      sendPitStopNotification(data.vehicle, data.lap, data.reason, data.estimatedTime).catch(console.error);
    } else if (notification.type === 'tire-alert' && notification.data) {
      const data = notification.data as TireAlertData;
      sendTireWearAlert(
        data.vehicle,
        data.frontLeft,
        data.frontRight,
        data.rearLeft,
        data.rearRight,
        data.recommendedLap
      ).catch(console.error);
    }
  }

  notifyListeners();
  return newNotification.id;
}

// Show race alert
export function showRaceAlert(data: RaceAlertData, severity: NotificationSeverity = 'info'): string {
  return addNotification({
    type: 'race-alert',
    severity,
    title: `🏁 ${data.raceName}`,
    message: data.event,
    data,
  });
}

// Show pit alert
export function showPitAlert(data: PitAlertData, severity: NotificationSeverity = 'warning'): string {
  return addNotification({
    type: 'pit-alert',
    severity,
    title: `🔧 Pit Stop Alert - Car #${data.vehicleNumber}`,
    message: `${data.vehicle} entering pit lane on Lap ${data.lap}\nReason: ${data.reason}`,
    data,
  });
}

// Show tire alert
export function showTireAlert(data: TireAlertData, severity?: NotificationSeverity): string {
  const avgWear = (data.frontLeft + data.frontRight + data.rearLeft + data.rearRight) / 4;
  const finalSeverity = severity || (avgWear > 80 ? 'critical' : avgWear > 60 ? 'warning' : 'info');
  
  return addNotification({
    type: 'tire-alert',
    severity: finalSeverity,
    title: `${finalSeverity === 'critical' ? '🚨' : '⚠️'} Tire Wear Alert - Car #${data.vehicleNumber}`,
    message: `Vehicle ${data.vehicle} tire wear levels: FL ${data.frontLeft.toFixed(1)}%, FR ${data.frontRight.toFixed(1)}%, RL ${data.rearLeft.toFixed(1)}%, RR ${data.rearRight.toFixed(1)}%${data.recommendedLap ? `\nRecommended pit: Lap ${data.recommendedLap}` : ''}`,
    data,
  });
}

// Show human-in-the-loop popup (returns a promise that resolves with user's choice)
export function showHumanLoop(data: HumanLoopData): Promise<string | null> {
  return new Promise((resolve) => {
    const notification: Notification = {
      id: generateId(),
      type: 'human-loop',
      severity: 'info',
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      data,
      dismissed: false,
    };

    humanLoopQueue.push({ notification, resolve });
    notificationQueue.unshift(notification);
    notifyListeners();
    
    // Process next human loop popup
    processHumanLoopQueue();
  });
}

// Process human loop queue
async function processHumanLoopQueue() {
  if (isProcessingHumanLoop || humanLoopQueue.length === 0) {
    return;
  }

  isProcessingHumanLoop = true;
  const { notification, resolve } = humanLoopQueue.shift()!;
  
  // This will be handled by the NotificationProvider component
  // The resolve function will be called when user makes a choice
  // Store the resolve function on the notification for the provider to use
  (notification.data as HumanLoopData).onConfirm = (value?: string) => {
    resolve(value || 'confirmed');
    dismissNotification(notification.id);
    isProcessingHumanLoop = false;
    processHumanLoopQueue();
  };
  
  (notification.data as HumanLoopData).onCancel = () => {
    resolve(null);
    dismissNotification(notification.id);
    isProcessingHumanLoop = false;
    processHumanLoopQueue();
  };

  notifyListeners();
}

// Dismiss notification
export function dismissNotification(id: string): void {
  const index = notificationQueue.findIndex(n => n.id === id);
  if (index !== -1) {
    notificationQueue[index].dismissed = true;
    notifyListeners();
    
    // Remove dismissed notifications after a delay
    setTimeout(() => {
      notificationQueue = notificationQueue.filter(n => n.id !== id);
      notifyListeners();
    }, 300);
  }
}

// Get all notifications
export function getNotifications(limit?: number): Notification[] {
  const active = notificationQueue.filter(n => !n.dismissed);
  return limit ? active.slice(0, limit) : active;
}

// Clear all notifications
export function clearNotifications(): void {
  notificationQueue = [];
  humanLoopQueue = [];
  isProcessingHumanLoop = false;
  notifyListeners();
}

// Subscribe to notification changes
export function subscribe(callback: (notifications: Notification[]) => void): () => void {
  listeners.push(callback);
  callback([...notificationQueue]);
  
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

// Get pending human loop notification
export function getPendingHumanLoop(): Notification | null {
  const pending = notificationQueue.find(
    n => n.type === 'human-loop' && !n.dismissed
  );
  return pending || null;
}


// src/components/NotificationProvider.tsx
// Global notification provider for displaying alerts and popups throughout the app

import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  subscribe,
  getPendingHumanLoop,
  dismissNotification,
  type Notification,
  type HumanLoopData,
} from '@/services/notificationService';
import { Flag, AlertTriangle, Wrench, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [humanLoopNotification, setHumanLoopNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe((newNotifications) => {
      setNotifications(newNotifications);
      const pending = getPendingHumanLoop();
      setHumanLoopNotification(pending);
    });

    return unsubscribe;
  }, []);

  const handleHumanLoopConfirm = useCallback((value: string) => {
    if (humanLoopNotification?.data) {
      const data = humanLoopNotification.data as HumanLoopData;
      data.onConfirm?.(value);
    }
    setHumanLoopNotification(null);
  }, [humanLoopNotification]);

  const handleHumanLoopCancel = useCallback(() => {
    if (humanLoopNotification?.data) {
      const data = humanLoopNotification.data as HumanLoopData;
      data.onCancel?.();
    }
    setHumanLoopNotification(null);
  }, [humanLoopNotification]);

  return (
    <>
      {children}
      
      {/* Human-in-the-loop popup */}
      <AlertDialog
        open={!!humanLoopNotification && !humanLoopNotification.dismissed}
        onOpenChange={(open) => {
          if (!open) {
            handleHumanLoopCancel();
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
              <AlertDialogTitle className="text-xl">
                {humanLoopNotification?.title || 'Action Required'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base pt-2">
              {humanLoopNotification?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {(humanLoopNotification?.data as HumanLoopData)?.options && (
            <div className="space-y-2 py-4">
              {((humanLoopNotification?.data as HumanLoopData)?.options || []).map((option, index) => (
                <Button
                  key={index}
                  variant={option.variant === 'destructive' ? 'destructive' : 'default'}
                  className="w-full justify-start"
                  onClick={() => handleHumanLoopConfirm(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}
          
          <AlertDialogFooter>
            {!((humanLoopNotification?.data as HumanLoopData)?.options) && (
              <>
                <AlertDialogCancel onClick={handleHumanLoopCancel}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => handleHumanLoopConfirm('confirmed')}>
                  Confirm
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification panels (for race alerts, pit alerts, tire alerts) */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        <AnimatePresence>
          {notifications
            .filter(n => n.type !== 'human-loop' && !n.dismissed)
            .slice(0, 5) // Show max 5 notifications at once
            .map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={() => dismissNotification(notification.id)}
              />
            ))}
        </AnimatePresence>
      </div>
    </>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onDismiss: () => void;
}

function NotificationCard({ notification, onDismiss }: NotificationCardProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'race-alert':
        return <Flag className="w-5 h-5" />;
      case 'pit-alert':
        return <Wrench className="w-5 h-5" />;
      case 'tire-alert':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getSeverityStyles = () => {
    switch (notification.severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'success':
        return 'border-green-500/50 bg-green-500/10';
      default:
        return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getIconColor = () => {
    switch (notification.severity) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${getSeverityStyles()} border-l-4 backdrop-blur-md shadow-lg`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={`${getIconColor()} flex-shrink-0`}>
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold leading-tight">
                  {notification.title}
                </CardTitle>
                <CardDescription className="text-xs mt-1 whitespace-pre-line">
                  {notification.message}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        {notification.data && (
          <CardContent className="pt-0">
            <NotificationDetails notification={notification} />
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

function NotificationDetails({ notification }: { notification: Notification }) {
  if (notification.type === 'race-alert' && notification.data) {
    const data = notification.data as any;
    return (
      <div className="space-y-1 text-xs">
        {data.details && Object.entries(data.details).map(([key, value], i) => (
          <div key={i} className="flex justify-between">
            <span className="text-muted-foreground">{key}:</span>
            <span className="font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (notification.type === 'pit-alert' && notification.data) {
    const data = notification.data as any;
    return (
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Lap:</span>
          <span className="font-medium">{data.lap}</span>
        </div>
        {data.estimatedTime && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Time:</span>
            <span className="font-medium">{data.estimatedTime}</span>
          </div>
        )}
        {data.recommendedAction && (
          <div className="mt-2 p-2 bg-primary/10 rounded text-xs">
            <span className="font-semibold">Recommendation: </span>
            {data.recommendedAction}
          </div>
        )}
      </div>
    );
  }

  if (notification.type === 'tire-alert' && notification.data) {
    const data = notification.data as any;
    return (
      <div className="space-y-1 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">FL:</span>
            <span className={`font-medium ${data.frontLeft < 50 ? 'text-red-500' : data.frontLeft < 70 ? 'text-yellow-500' : ''}`}>
              {data.frontLeft.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">FR:</span>
            <span className={`font-medium ${data.frontRight < 50 ? 'text-red-500' : data.frontRight < 70 ? 'text-yellow-500' : ''}`}>
              {data.frontRight.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RL:</span>
            <span className={`font-medium ${data.rearLeft < 50 ? 'text-red-500' : data.rearLeft < 70 ? 'text-yellow-500' : ''}`}>
              {data.rearLeft.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RR:</span>
            <span className={`font-medium ${data.rearRight < 50 ? 'text-red-500' : data.rearRight < 70 ? 'text-yellow-500' : ''}`}>
              {data.rearRight.toFixed(1)}%
            </span>
          </div>
        </div>
        {data.recommendedLap && (
          <div className="mt-2 p-2 bg-primary/10 rounded text-xs">
            <span className="font-semibold">Recommended Pit: </span>
            Lap {data.recommendedLap}
          </div>
        )}
      </div>
    );
  }

  return null;
}



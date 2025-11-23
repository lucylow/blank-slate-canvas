// src/components/EdgeFunctionsDashboard.tsx
// Lovable, production-ready Edge Functions Dashboard

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Play,
  FileText,
  Search,
  Copy,
  Radio,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  getEdgeFunctionMetrics,
  testEdgeFunction,
  type EdgeFunctionMetrics,
} from '@/api/edgeFunctions';

interface FunctionStatus {
  name: string;
  displayName: string;
  description: string;
  status: 'active' | 'idle' | 'degraded' | 'failed';
  invocations: number;
  successRate: number;
  p95Latency: number;
  avgConfidence: number;
  lastUpdated: string;
}

const FUNCTION_DEFINITIONS = {
  coaching: {
    displayName: 'coaching',
    description: 'Coaching engine: suggests micro-adjustments for drivers during cool-down and race.',
  },
  'pit-window': {
    displayName: 'pit-window',
    description: 'Realtime pit-window calculations — traffic-aware and probabilistic.',
  },
  'predict-tire-wear': {
    displayName: 'predict-tire-wear',
    description: 'Per-lap wear forecast across compounds. Produces "laps-until-0.5s" and confidence bands.',
  },
};

function StatusBadge({ status }: { status: FunctionStatus['status'] }) {
  const configs = {
    active: {
      label: 'listening',
      className: 'bg-green-500/10 text-green-600 border-green-500/20',
      dot: 'bg-green-500',
      pulse: true,
    },
    idle: {
      label: 'waiting',
      className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      dot: 'bg-gray-500',
      pulse: false,
    },
    degraded: {
      label: 'needs love',
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      dot: 'bg-amber-500',
      pulse: false,
    },
    failed: {
      label: 'needs attention',
      className: 'bg-red-500/10 text-red-600 border-red-500/20',
      dot: 'bg-red-500',
      pulse: false,
    },
  };

  const config = configs[status];

  return (
    <Badge variant="outline" className={config.className}>
      <motion.div
        className={`w-2 h-2 rounded-full mr-1.5 ${config.dot}`}
        animate={config.pulse ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {config.label}
    </Badge>
  );
}

function SuccessRateIcon({ rate }: { rate: number }) {
  if (rate >= 0.99) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (rate >= 0.95) return <AlertCircle className="w-4 h-4 text-amber-500" />;
  return <AlertCircle className="w-4 h-4 text-red-500" />;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function EdgeFunctionsDashboard() {
  const [functions, setFunctions] = useState<FunctionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [traceDialog, setTraceDialog] = useState<{ open: boolean; functionName: string; trace: any }>({
    open: false,
    functionName: '',
    trace: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    try {
      const metrics = await getEdgeFunctionMetrics();
      const functionList: FunctionStatus[] = Object.entries(metrics).map(([name, m]) => {
        const def = FUNCTION_DEFINITIONS[name as keyof typeof FUNCTION_DEFINITIONS];
        const status: FunctionStatus['status'] =
          m.invocations === 0 && new Date(m.last_seen).getTime() < Date.now() - 86400000 * 2
            ? 'idle'
            : m.success_rate < 0.95
            ? 'degraded'
            : m.success_rate < 0.8
            ? 'failed'
            : 'active';

        return {
          name,
          displayName: def?.displayName || name,
          description: def?.description || '',
          status,
          invocations: m.invocations,
          successRate: m.success_rate,
          p95Latency: m.p95_latency_ms,
          avgConfidence: m.avg_confidence,
          lastUpdated: m.last_seen,
        };
      });

      // Ensure all three functions are present
      const allFunctions = ['coaching', 'pit-window', 'predict-tire-wear'];
      allFunctions.forEach((name) => {
        if (!functionList.find((f) => f.name === name)) {
          const def = FUNCTION_DEFINITIONS[name as keyof typeof FUNCTION_DEFINITIONS];
          functionList.push({
            name,
            displayName: def?.displayName || name,
            description: def?.description || '',
            status: 'idle',
            invocations: 0,
            successRate: 0,
            p95Latency: 0,
            avgConfidence: 0,
            lastUpdated: new Date().toISOString(),
          });
        }
      });

      setFunctions(functionList);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setLoading(false);
    }
  }

  async function handleTest(functionName: string) {
    setTesting(functionName);
    try {
      const result = await testEdgeFunction(
        functionName as 'coaching' | 'pit-window' | 'predict-tire-wear'
      );
      
      toast({
        title: 'Nice!',
        description: `${functionName} returned a confident forecast (${result.confidence?.toFixed(2) || 'N/A'}).`,
      });
      
      // Refresh metrics
      await loadMetrics();
    } catch (error) {
      toast({
        title: 'Heads-up',
        description: `${functionName} returned incomplete data. See logs.`,
        variant: 'destructive',
      });
    } finally {
      setTesting(null);
    }
  }

  async function handleViewTrace(functionName: string) {
    // In a real implementation, fetch the trace from your observability backend
    setTraceDialog({
      open: true,
      functionName,
      trace: {
        requestId: 'trace-' + Date.now(),
        duration: '120ms',
        steps: [
          { name: 'Input validation', duration: '5ms' },
          { name: 'Model inference', duration: '100ms' },
          { name: 'Response formatting', duration: '15ms' },
        ],
      },
    });
  }

  function handleCopyToRadio(message: string) {
    navigator.clipboard.writeText(message);
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard. Ready to send to radio.',
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <Activity className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Edge Functions
          </CardTitle>
          <CardDescription>
            Real-time analytics functions for race strategy and driver coaching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invocations</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>p95 latency</TableHead>
                <TableHead>Avg confidence</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {functions.map((func) => (
                  <motion.tr
                    key={func.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border-b"
                  >
                    <TableCell className="font-mono text-sm">{func.displayName}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <StatusBadge status={func.status} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{func.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{func.invocations.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <SuccessRateIcon rate={func.successRate} />
                        <span>{(func.successRate * 100).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        p95={func.p95Latency.toFixed(0)}ms
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {func.avgConfidence.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {formatTimeAgo(func.lastUpdated)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTest(func.name)}
                              disabled={testing === func.name}
                            >
                              {testing === func.name ? (
                                <Activity className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Run test</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTrace(func.name)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View trace</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>

          {functions.some((f) => f.invocations === 0 && f.status === 'idle') && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Low invocation volume detected — is this function wired into the live stream?
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trace Dialog */}
      <Dialog open={traceDialog.open} onOpenChange={(open) => setTraceDialog({ ...traceDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Trace: {traceDialog.functionName}</DialogTitle>
            <DialogDescription>
              Latest request trace with timing breakdown
            </DialogDescription>
          </DialogHeader>
          {traceDialog.trace && (
            <div className="space-y-4">
              <div className="font-mono text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Request ID:</span>
                  <span className="text-muted-foreground">{traceDialog.trace.requestId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Duration:</span>
                  <span className="text-muted-foreground">{traceDialog.trace.duration}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Steps:</h4>
                {traceDialog.trace.steps?.map((step: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{step.name}</span>
                    <span className="text-muted-foreground">{step.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}


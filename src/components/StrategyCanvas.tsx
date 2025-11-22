import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: unknown;
}

interface StrategyNode {
  type: string;
  label: string;
  icon?: React.ReactNode;
}

const strategyNodes: StrategyNode[] = [
  { type: 'telemetry_input', label: 'Telemetry Source', icon: <Zap className="w-4 h-4" /> },
  { type: 'tire_analysis', label: 'Tire Analysis', icon: <AlertCircle className="w-4 h-4" /> },
  { type: 'fuel_calculation', label: 'Fuel Calculator', icon: <Zap className="w-4 h-4" /> },
  { type: 'pit_optimizer', label: 'Pit Optimizer', icon: <CheckCircle2 className="w-4 h-4" /> },
  { type: 'competitor_analysis', label: 'Competitor Watch', icon: <Clock className="w-4 h-4" /> }
];

export function StrategyCanvas() {
  const [agentWorkflow, setAgentWorkflow] = useState<WorkflowNode[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  const onDragStart = useCallback((e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    
    if (!nodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodeDef = strategyNodes.find(n => n.type === nodeType);
    if (!nodeDef) return;

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType,
      label: nodeDef.label,
      position: { x: Math.max(0, x - 100), y: Math.max(0, y - 50) },
      status: 'pending'
    };

    setAgentWorkflow(prev => [...prev, newNode]);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setAgentWorkflow(prev =>
      prev.map(node =>
        node.id === nodeId ? { ...node, position } : node
      )
    );
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setAgentWorkflow(prev => prev.filter(node => node.id !== nodeId));
  }, []);

  const executeWorkflow = async () => {
    if (agentWorkflow.length === 0) return;

    setIsRunning(true);

    // Simulate workflow execution
    const executeNode = async (node: WorkflowNode, index: number) => {
      // Update node status to running
      setAgentWorkflow(prev =>
        prev.map(n => n.id === node.id ? { ...n, status: 'running' } : n)
      );

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000 + index * 500));

      // Call backend API
      try {
        const { executeAgentWorkflow } = await import('@/api/pitwall');
        const results = await executeAgentWorkflow({
          workflow: agentWorkflow.map(n => ({
            id: n.id,
            type: n.type,
            position: n.position,
            status: n.status
          })),
          track: 'cota',
          session: 'qualifying'
        });

        // Update node with result
        setAgentWorkflow(prev =>
          prev.map(n =>
            n.id === node.id
              ? { ...n, status: 'completed', result: results.results?.[node.id] || results.results }
              : n
          )
        );
      } catch (error) {
        console.error('Workflow execution error:', error);
        setAgentWorkflow(prev =>
          prev.map(n =>
            n.id === node.id ? { ...n, status: 'error' } : n
          )
        );
      }
    };

    // Execute nodes sequentially
    for (let i = 0; i < agentWorkflow.length; i++) {
      await executeNode(agentWorkflow[i], i);
    }

    setIsRunning(false);
  };

  const clearWorkflow = useCallback(() => {
    setAgentWorkflow([]);
    setIsRunning(false);
  }, []);

  const getStatusIcon = (status: WorkflowNode['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="strategy-canvas h-full flex flex-col gap-4">
      {/* Node Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategy Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {strategyNodes.map(node => (
              <div
                key={node.type}
                className="strategy-node flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-accent cursor-move transition-all"
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
              >
                {node.icon}
                <span className="text-sm font-medium">{node.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Canvas */}
      <Card className="flex-1 flex flex-col min-h-[500px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Workflow Area</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearWorkflow}
                disabled={agentWorkflow.length === 0 || isRunning}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={executeWorkflow}
                disabled={isRunning || agentWorkflow.length === 0}
                size="sm"
              >
                {isRunning ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Running Strategy...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Strategy
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="workflow-area w-full h-full border-2 border-dashed border-border rounded-lg bg-muted/20 relative overflow-auto"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            {agentWorkflow.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div>
                  <GripVertical className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Drag strategy nodes here to build your workflow
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {agentWorkflow.map(node => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      "absolute p-4 rounded-lg border-2 bg-card shadow-lg cursor-move min-w-[180px]",
                      node.status === 'completed' && "border-green-500 bg-green-500/10",
                      node.status === 'running' && "border-blue-500 bg-blue-500/10",
                      node.status === 'error' && "border-red-500 bg-red-500/10",
                      node.status === 'pending' && "border-border hover:border-primary",
                      selectedNode === node.id && "ring-2 ring-primary"
                    )}
                    style={{
                      left: `${node.position.x}px`,
                      top: `${node.position.y}px`
                    }}
                    onClick={() => setSelectedNode(node.id)}
                    onMouseDown={(e) => {
                      if (!canvasRef.current) return;
                      const rect = canvasRef.current.getBoundingClientRect();
                      dragOffsetRef.current = {
                        x: e.clientX - rect.left - node.position.x,
                        y: e.clientY - rect.top - node.position.y
                      };
                    }}
                    onMouseMove={(e) => {
                      if (!dragOffsetRef.current || !canvasRef.current || selectedNode !== node.id) return;
                      const rect = canvasRef.current.getBoundingClientRect();
                      const newPos = {
                        x: Math.max(0, e.clientX - rect.left - dragOffsetRef.current.x),
                        y: Math.max(0, e.clientY - rect.top - dragOffsetRef.current.y)
                      };
                      updateNodePosition(node.id, newPos);
                    }}
                    onMouseUp={() => {
                      dragOffsetRef.current = null;
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(node.status)}
                        <span className="font-semibold text-sm">{node.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNode(node.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {node.status}
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


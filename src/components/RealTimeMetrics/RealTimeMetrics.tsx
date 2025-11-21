import React, { useEffect, useRef } from 'react';
import './RealTimeMetrics.css';

interface Agent {
  id: string;
  status: string;
}

interface Insight {
  created_at: string;
}

interface RealTimeMetricsProps {
  agents: Agent[];
  insights: Insight[];
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({ agents, insights }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metricsRef = useRef({
    insightsPerMinute: 0,
    avgProcessingTime: 0,
    agentUtilization: 0
  });

  useEffect(() => {
    // Calculate metrics
    const lastMinute = Date.now() - 60000;
    const recentInsights = insights.filter(i => 
      new Date(i.created_at).getTime() > lastMinute
    );
    
    metricsRef.current = {
      insightsPerMinute: recentInsights.length,
      avgProcessingTime: calculateAvgProcessingTime(insights),
      agentUtilization: calculateAgentUtilization(agents)
    };

    // Update visualization
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw metrics visualization
        const metrics = metricsRef.current;
        
        // Insights per minute gauge
        drawGauge(ctx, 50, 50, 40, metrics.insightsPerMinute / 10, '#3B82F6', 'Insights/min');
        
        // Processing time gauge
        drawGauge(ctx, 150, 50, 40, Math.min(1, metrics.avgProcessingTime / 1000), '#10B981', 'Processing');
        
        // Utilization gauge
        drawGauge(ctx, 250, 50, 40, metrics.agentUtilization / 100, '#F59E0B', 'Utilization');
      }
    }
  }, [agents, insights]);

  const calculateAvgProcessingTime = (insights: Insight[]): number => {
    if (insights.length < 2) return 0;
    
    const times = insights
      .map(i => new Date(i.created_at).getTime())
      .sort((a, b) => a - b);
    
    const intervals: number[] = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1]);
    }
    
    return intervals.length > 0 
      ? intervals.reduce((a, b) => a + b) / intervals.length 
      : 0;
  };

  const calculateAgentUtilization = (agents: Agent[]): number => {
    if (agents.length === 0) return 0;
    const activeAgents = agents.filter(a => a.status === 'active').length;
    return (activeAgents / agents.length) * 100;
  };


  const drawGauge = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    value: number,
    color: string,
    label: string
  ) => {
    // Background circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Value arc
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * value));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Value text
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(value * 100)}%`, x, y);

    // Label
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px Arial';
    ctx.fillText(label, x, y + radius + 15);
  };

  return (
    <div className="real-time-metrics">
      <h3>System Metrics</h3>
      <div className="metrics-content">
        <canvas 
          ref={canvasRef}
          width={350}
          height={120}
          className="metrics-canvas"
        />
        
        <div className="metrics-text">
          <div className="metric-item">
            <span className="metric-label">Insights/Minute:</span>
            <span className="metric-value">
              {metricsRef.current.insightsPerMinute}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Avg Processing:</span>
            <span className="metric-value">
              {metricsRef.current.avgProcessingTime.toFixed(0)}ms
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Agent Utilization:</span>
            <span className="metric-value">
              {metricsRef.current.agentUtilization.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMetrics;


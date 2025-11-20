import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/hooks/useTelemetry';

const chartConfigs = {
  speed: { color: '#3B82F6', label: 'Speed (km/h)' },
  throttle: { color: '#10B981', label: 'Throttle (%)' },
  brake: { color: '#EF4444', label: 'Brake Pressure' },
  gear: { color: '#8B5CF6', label: 'Gear' },
  rpm: { color: '#F59E0B', label: 'RPM' }
};

export function TelemetryCharts() {
  const { telemetryData, selectedDriver } = useTelemetry();
  const [activeChart, setActiveChart] = useState('speed');

  const chartData = telemetryData.slice(-50);

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Telemetry - Car #{selectedDriver?.carNumber || '23'}
        </h2>
        
        <div className="flex space-x-2">
          {Object.entries(chartConfigs).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveChart(key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeChart === key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {config.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="timestamp" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))'
              }}
            />
            <Line
              type="monotone"
              dataKey={activeChart}
              stroke={chartConfigs[activeChart as keyof typeof chartConfigs].color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-4 h-24">
        {Object.entries(chartConfigs).map(([key, config]) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.02 }}
            className={`rounded-lg p-2 cursor-pointer border ${
              activeChart === key ? 'border-primary bg-primary/10' : 'border-border bg-secondary'
            }`}
            onClick={() => setActiveChart(key)}
          >
            <div className="text-xs text-muted-foreground mb-1">{config.label.split(' ')[0]}</div>
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-10)}>
                  <Line
                    type="monotone"
                    dataKey={key}
                    stroke={config.color}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

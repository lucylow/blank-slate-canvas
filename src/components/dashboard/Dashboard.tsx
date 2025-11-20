import { motion } from 'framer-motion';
import { TrackMap } from '../telemetry/TrackMap';
import { TelemetryCharts } from '../telemetry/TelemetryCharts';
import { StrategyConsole } from '../strategy/StrategyConsole';
import { DriverList } from '../telemetry/DriverList';

export function Dashboard() {
  return (
    <div className="h-full p-4 grid grid-cols-12 grid-rows-6 gap-4">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="col-span-4 row-span-3 bg-card rounded-xl border border-border"
      >
        <TrackMap />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="col-span-4 row-span-3 bg-card rounded-xl border border-border"
      >
        <DriverList />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="col-span-4 row-span-3 bg-card rounded-xl border border-border"
      >
        <StrategyConsole />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="col-span-12 row-span-3 bg-card rounded-xl border border-border"
      >
        <TelemetryCharts />
      </motion.div>
    </div>
  );
}

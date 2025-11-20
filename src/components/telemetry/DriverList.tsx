import { useTelemetry } from '@/hooks/useTelemetry';
import { Flag } from 'lucide-react';

export function DriverList() {
  const { drivers, selectedDriver, setSelectedDriver } = useTelemetry();

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Driver Standings</h2>
        <Flag className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {drivers.map((driver) => (
          <div
            key={driver.carNumber}
            onClick={() => setSelectedDriver(driver)}
            className={`p-3 rounded-lg cursor-pointer transition-all border ${
              selectedDriver?.carNumber === driver.carNumber
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary hover:bg-accent border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">P{driver.position}</div>
                <div className="text-sm">
                  <div className="font-semibold">Car #{driver.carNumber}</div>
                  <div className="text-xs opacity-80">Chassis {driver.chassisNumber}</div>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-mono">{driver.lastLapTime.toFixed(3)}s</div>
                <div className="opacity-70">Last Lap</div>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span>Best: {driver.bestLapTime.toFixed(3)}s</span>
              <span className={driver.gapToLeader > 0 ? 'text-red-400' : 'text-green-400'}>
                {driver.gapToLeader > 0 ? '+' : ''}{driver.gapToLeader.toFixed(3)}s
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

      <div className="flex-1 overflow-auto space-y-2 px-1">
        {drivers.map((driver, index) => (
          <div
            key={driver.carNumber}
            onClick={() => setSelectedDriver(driver)}
            className={`p-3 rounded-xl cursor-pointer transition-all border-2 backdrop-blur-sm ${
              selectedDriver?.carNumber === driver.carNumber
                ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                : 'bg-secondary/50 hover:bg-secondary border-border hover:border-accent'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-black' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' :
                  index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-800 text-white' :
                  'bg-gradient-to-br from-muted to-secondary text-foreground'
                }`}>
                  P{driver.position}
                </div>
                <div className="text-sm">
                  <div className={`font-bold ${selectedDriver?.carNumber === driver.carNumber ? 'text-primary' : 'text-foreground'}`}>
                    Car #{driver.carNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">Chassis {driver.chassisNumber}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-bold text-sm ${selectedDriver?.carNumber === driver.carNumber ? 'text-primary' : 'text-foreground'}`}>
                  {driver.lastLapTime.toFixed(3)}s
                </div>
                <div className="text-xs text-muted-foreground">Last Lap</div>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-border/50">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Best:</span>
                <span className="font-mono font-semibold text-chart-2">{driver.bestLapTime.toFixed(3)}s</span>
              </div>
              <div className={`font-mono font-bold px-2 py-0.5 rounded ${
                driver.gapToLeader === 0 ? 'bg-chart-2/20 text-chart-2' : 'bg-destructive/20 text-destructive'
              }`}>
                {driver.gapToLeader > 0 ? '+' : ''}{driver.gapToLeader.toFixed(3)}s
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

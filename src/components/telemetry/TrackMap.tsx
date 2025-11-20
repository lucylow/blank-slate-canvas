import { MapPin } from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';

export function TrackMap() {
  const { drivers, selectedDriver, setSelectedDriver, trackData } = useTelemetry();

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Track Map</h2>
        <div className="text-sm text-muted-foreground">
          {trackData?.name || 'Circuit of the Americas'}
        </div>
      </div>

      <div className="flex-1 relative bg-gradient-to-br from-secondary via-secondary/80 to-muted rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-56 h-56">
            {/* Track outline with sector colors */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-chart-1 border-b-chart-2 border-l-chart-5 transform -rotate-45 opacity-40" />
            <div className="absolute inset-4 rounded-full border-2 border-border/50" />
            
            {/* Car positions */}
            {drivers.map((driver, index) => {
              const angle = (index * 0.8) + (Date.now() / 10000);
              const x = 50 + Math.cos(angle) * 40;
              const y = 50 + Math.sin(angle) * 40;
              
              return (
                <div
                  key={driver.carNumber}
                  className={`absolute w-5 h-5 rounded-full border-2 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all shadow-lg ${
                    selectedDriver?.carNumber === driver.carNumber
                      ? 'bg-primary border-white scale-150 shadow-primary/50'
                      : 'bg-chart-1 border-foreground/50 hover:scale-125'
                  }`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                  onClick={() => setSelectedDriver(driver)}
                >
                  {selectedDriver?.carNumber === driver.carNumber && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              );
            })}
            
            {/* Sector markers */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-2 h-4 bg-primary rounded shadow-lg" />
            <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 w-4 h-2 bg-chart-1 rounded shadow-lg" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-2 h-4 bg-chart-2 rounded shadow-lg" />
            <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 w-4 h-2 bg-chart-5 rounded shadow-lg" />
            
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Live</div>
                <div className="text-sm font-bold text-foreground">Track</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-secondary/95 backdrop-blur-md rounded-lg p-3 border border-border shadow-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="group hover:bg-muted/50 rounded-md p-1 transition-colors">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Sector 1</div>
                <div className="text-foreground font-mono font-bold">23.456</div>
                <div className="h-1 bg-primary/20 rounded-full mt-1">
                  <div className="h-1 bg-primary rounded-full w-3/4" />
                </div>
              </div>
              <div className="group hover:bg-muted/50 rounded-md p-1 transition-colors">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Sector 2</div>
                <div className="text-foreground font-mono font-bold">45.678</div>
                <div className="h-1 bg-chart-1/20 rounded-full mt-1">
                  <div className="h-1 bg-chart-1 rounded-full w-2/3" />
                </div>
              </div>
              <div className="group hover:bg-muted/50 rounded-md p-1 transition-colors">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Sector 3</div>
                <div className="text-foreground font-mono font-bold">34.567</div>
                <div className="h-1 bg-chart-2/20 rounded-full mt-1">
                  <div className="h-1 bg-chart-2 rounded-full w-4/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

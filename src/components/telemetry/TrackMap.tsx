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

      <div className="flex-1 relative bg-secondary rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-64 h-32 border-2 border-border rounded-lg mb-4 relative">
              {drivers.map((driver, index) => (
                <div
                  key={driver.carNumber}
                  className={`absolute w-4 h-4 rounded-full border-2 cursor-pointer transform -translate-x-2 -translate-y-2 transition-all ${
                    selectedDriver?.carNumber === driver.carNumber
                      ? 'bg-primary border-primary-foreground scale-125'
                      : 'bg-blue-500 border-foreground'
                  }`}
                  style={{
                    left: `${50 + Math.cos(index * 0.8) * 40}%`,
                    top: `${50 + Math.sin(index * 0.8) * 20}%`,
                  }}
                  onClick={() => setSelectedDriver(driver)}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Live Track Positions</p>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-card/90 backdrop-blur rounded-lg p-3 border border-border">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-muted-foreground">S1</div>
                <div className="font-mono">23.456</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">S2</div>
                <div className="font-mono">45.678</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">S3</div>
                <div className="font-mono">34.567</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

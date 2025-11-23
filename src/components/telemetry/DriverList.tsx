import { useTelemetry } from '@/hooks/useTelemetry';
import { Flag, ChevronUp, ChevronDown } from 'lucide-react';
import { CarTypeBadge } from '@/components/CarTypeToggle';
import { useEffect, useRef, useState } from 'react';

export function DriverList() {
  const { drivers, selectedDriver, setSelectedDriver } = useTelemetry();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Calculate max height for 5 cars (each car is approximately 100px with spacing)
  const maxHeight = 5 * 100; // 500px for 5 cars

  // Check scroll position to show/hide scroll indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollTop(scrollTop > 10);
      setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 10);
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    return () => container.removeEventListener('scroll', checkScroll);
  }, [drivers]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="h-full flex flex-col p-4 relative">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Driver Standings
        </h2>
        <Flag className="w-5 h-5 text-primary" />
      </div>

      {/* Scroll to top indicator */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-10 p-1.5 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-all duration-200 hover:scale-110"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Scrollable container with max height for 5 cars */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-2 px-1"
        style={{ 
          maxHeight: `${maxHeight}px`
        }}
      >
        {drivers.map((driver, index) => (
          <div
            key={driver.carNumber}
            onClick={() => setSelectedDriver(driver)}
            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 backdrop-blur-sm ${
              selectedDriver?.carNumber === driver.carNumber
                ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20 scale-[1.02] ring-2 ring-primary/20'
                : 'bg-secondary/50 hover:bg-secondary/70 border-border hover:border-primary/30 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-transform duration-200 ${
              selectedDriver?.carNumber === driver.carNumber ? 'scale-110' : ''
            } ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-black ring-2 ring-yellow-400/50' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black ring-2 ring-gray-300/50' :
                  index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-800 text-white ring-2 ring-orange-500/50' :
                  'bg-gradient-to-br from-muted to-secondary text-foreground'
                }`}>
                  P{driver.position}
                </div>
                <div className="text-sm flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`font-bold truncate ${selectedDriver?.carNumber === driver.carNumber ? 'text-primary' : 'text-foreground'}`}>
                      Car #{driver.carNumber}
                    </div>
                    {(driver as any).carType && (
                      <CarTypeBadge carId={(driver as any).carType} variant="compact" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Chassis {driver.chassisNumber}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
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
              <div className={`font-mono font-bold px-2 py-0.5 rounded transition-colors duration-200 ${
                driver.gapToLeader === 0 ? 'bg-chart-2/20 text-chart-2' : 'bg-destructive/20 text-destructive'
              }`}>
                {driver.gapToLeader > 0 ? '+' : ''}{driver.gapToLeader.toFixed(3)}s
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll to bottom indicator */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 p-1.5 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-all duration-200 hover:scale-110"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Scroll indicator text */}
      {drivers.length > 5 && (
        <div className="text-xs text-center text-muted-foreground mt-2 pt-2 border-t border-border/30 flex-shrink-0">
          Showing 5 of {drivers.length} drivers • Scroll to see more
        </div>
      )}
    </div>
  );
}

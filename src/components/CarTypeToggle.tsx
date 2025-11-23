import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GR_CARS, GRCarId, type GRCarConfig } from '@/constants/cars';
import { Car, Eye, EyeOff } from 'lucide-react';

interface CarTypeToggleProps {
  visibleCars: Record<GRCarId, boolean>;
  onToggle: (carId: GRCarId) => void;
  variant?: 'buttons' | 'checkboxes' | 'compact';
  className?: string;
}

export function CarTypeToggle({ 
  visibleCars, 
  onToggle, 
  variant = 'buttons',
  className = ''
}: CarTypeToggleProps) {
  
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {GR_CARS.map((car) => (
          <button
            key={car.id}
            onClick={() => onToggle(car.id)}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
              visibleCars[car.id]
                ? 'bg-opacity-20 border-2 shadow-lg'
                : 'bg-muted/50 border-2 border-border/50 opacity-50'
            }`}
            style={{
              backgroundColor: visibleCars[car.id] ? `${car.color}20` : undefined,
              borderColor: visibleCars[car.id] ? car.color : undefined,
              color: visibleCars[car.id] ? car.color : undefined,
            }}
            aria-pressed={visibleCars[car.id]}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: car.color }}
            />
            <span>{car.shortName}</span>
            {visibleCars[car.id] ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3 opacity-50" />
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'checkboxes') {
    return (
      <div className={`flex flex-wrap gap-4 ${className}`}>
        {GR_CARS.map((car) => (
          <label
            key={car.id}
            className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity"
          >
            <input
              type="checkbox"
              checked={visibleCars[car.id]}
              onChange={() => onToggle(car.id)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                visibleCars[car.id]
                  ? 'border-current'
                  : 'border-border'
              }`}
              style={{
                backgroundColor: visibleCars[car.id] ? car.color : 'transparent',
              }}
            >
              {visibleCars[car.id] && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: car.color }}
            />
            <span className="text-sm font-medium">{car.name}</span>
          </label>
        ))}
      </div>
    );
  }

  // Default: buttons variant
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {GR_CARS.map((car) => (
        <Button
          key={car.id}
          variant={visibleCars[car.id] ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToggle(car.id)}
          className={`relative transition-all duration-200 hover:scale-105 ${
            visibleCars[car.id]
              ? 'shadow-lg shadow-primary/30'
              : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: visibleCars[car.id] ? car.color : undefined,
            borderColor: visibleCars[car.id] ? car.color : undefined,
            color: visibleCars[car.id] ? 'white' : undefined,
          }}
          aria-pressed={visibleCars[car.id]}
        >
          <div
            className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
            style={{ 
              backgroundColor: visibleCars[car.id] ? 'white' : car.color 
            }}
          />
          <span>{car.name}</span>
        </Button>
      ))}
    </div>
  );
}

// Car Type Legend Component
export function CarTypeLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-4 items-center ${className}`}>
      {GR_CARS.map((car) => (
        <div key={car.id} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-border/50"
            style={{ backgroundColor: car.color }}
          />
          <span className="text-sm font-medium">{car.name}</span>
        </div>
      ))}
    </div>
  );
}

// Car Type Badge Component
export function CarTypeBadge({ 
  carId, 
  variant = 'default' 
}: { 
  carId: GRCarId | string | null | undefined;
  variant?: 'default' | 'compact';
}) {
  if (!carId) return null;

  const car = GR_CARS.find(c => c.id === carId);
  if (!car) return null;

  if (variant === 'compact') {
    return (
      <div
        className="w-3 h-3 rounded-full flex-shrink-0 border border-border/50"
        style={{ backgroundColor: car.color }}
        title={car.name}
      />
    );
  }

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1.5 px-2 py-0.5"
      style={{
        borderColor: car.color,
        color: car.color,
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: car.color }}
      />
      <span className="text-xs font-medium">{car.shortName}</span>
    </Badge>
  );
}



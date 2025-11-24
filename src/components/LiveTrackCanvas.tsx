// src/components/LiveTrackCanvas.tsx
// High-performance Canvas-based track visualization with multi-car support

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadSvgPath } from '@/utils/loadSvgCenterline';
import { svgPathToPoints, getPointAtRatio, getAngleAtRatio, type Point, type PathProperties } from '@/utils/svgPathToCanvas';
import type { CVDetectedFeature } from '@/data/mock_cv_track_analysis';

interface Car {
  car_id: string;
  lapdist?: number; // meters along track
  position?: number; // 0-1 ratio along track
  speed?: number; // km/h
  throttle?: number; // 0-1
  brake?: number; // 0-1
  gear?: number;
  color?: string; // hex color for car indicator
}

interface LiveTrackCanvasProps {
  trackImage?: string; // Optional background image URL
  track?: string; // Track name (e.g., 'cota')
  cars?: Car[];
  features?: CVDetectedFeature[];
  className?: string;
  totalMeters?: number; // Track length in meters
  showGlow?: boolean;
  sectorColors?: string[]; // Colors for different sectors
}

export default function LiveTrackCanvas({
  trackImage,
  track,
  cars = [],
  features = [],
  className = '',
  totalMeters = 5000,
  showGlow = true,
  sectorColors = ['#00ff00', '#ffff00', '#ff0000'], // Green, Yellow, Red
}: LiveTrackCanvasProps) {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  
  const [pathProperties, setPathProperties] = useState<PathProperties | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  // Track path loading
  useEffect(() => {
    const loadTrack = async () => {
      if (!track) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const svgData = await loadSvgPath(`/tracks/${track}.svg`, 'track-path');
        if (svgData && svgData.d) {
          const props = await svgPathToPoints(svgData.d, svgData.viewBox, 1000);
          setPathProperties(props);
        }
      } catch (error) {
        console.error('Failed to load track path:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrack();
  }, [track]);

  // Background image loading
  useEffect(() => {
    if (!trackImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      backgroundImageRef.current = img;
      drawBackground();
    };
    img.onerror = () => {
      console.warn('Failed to load track image:', trackImage);
    };
    img.src = trackImage;
  }, [trackImage]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw static background (track path, features)
  const drawBackground = useCallback(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas || !pathProperties) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // Set up scaling and translation based on viewBox
    const { viewBox } = pathProperties;
    const scaleX = width / viewBox.width;
    const scaleY = height / viewBox.height;
    const scale = Math.min(scaleX, scaleY) * 0.95; // 95% to add padding
    const offsetX = (width - viewBox.width * scale) / 2;
    const offsetY = (height - viewBox.height * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-viewBox.x, -viewBox.y);

    // Draw background image if available
    if (backgroundImageRef.current) {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(
        backgroundImageRef.current,
        viewBox.x,
        viewBox.y,
        viewBox.width,
        viewBox.height
      );
      ctx.globalAlpha = 1.0;
    }

    // Draw track path with glow effect
    const points = pathProperties.points;
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      // Glow effect
      if (showGlow) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 25;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 15;
        ctx.stroke();
      }

      // Main track path
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Draw CV detected features
    features.forEach((feature) => {
      const { coordinates, type, label } = feature;
      const x = coordinates.x * viewBox.width + viewBox.x;
      const y = coordinates.y * viewBox.height + viewBox.y;

      ctx.save();
      ctx.globalAlpha = 0.7;

      // Different markers for different feature types
      switch (type) {
        case 'turn':
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        case 'speed_trap':
          ctx.fillStyle = '#ff00ff';
          ctx.fillRect(x - 6, y - 6, 12, 12);
          break;
        case 'sector_line':
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(x - 20, y);
          ctx.lineTo(x + 20, y);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        case 'pit_lane':
          ctx.fillStyle = '#00ff00';
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        default:
          ctx.fillStyle = '#cccccc';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
      }

      // Label
      if (label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - 12);
      }

      ctx.restore();
    });

    ctx.restore();
  }, [pathProperties, dimensions, features, showGlow]);

  // Draw animated foreground (cars)
  const drawForeground = useCallback(() => {
    const canvas = foregroundCanvasRef.current;
    if (!canvas || !pathProperties || cars.length === 0) {
      // Clear canvas if no cars
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // Set up scaling (same as background)
    const { viewBox } = pathProperties;
    const scaleX = width / viewBox.width;
    const scaleY = height / viewBox.height;
    const scale = Math.min(scaleX, scaleY) * 0.95;
    const offsetX = (width - viewBox.width * scale) / 2;
    const offsetY = (height - viewBox.height * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-viewBox.x, -viewBox.y);

    // Draw each car
    cars.forEach((car, index) => {
      // Calculate position ratio
      let position = car.position;
      if (position === undefined && car.lapdist !== undefined) {
        position = Math.max(0, Math.min(1, car.lapdist / totalMeters));
      }
      if (position === undefined) return;

      const point = getPointAtRatio(pathProperties.points, position);
      const angle = getAngleAtRatio(pathProperties.points, position);

      // Car color (use index-based color if not provided)
      const carColor = car.color || `hsl(${(index * 360) / cars.length}, 70%, 50%)`;

      // Draw car with glow
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(angle);

      // Pulsing glow effect
      const pulse = 1 + Math.sin(Date.now() / 500) * 0.1;
      ctx.shadowColor = carColor;
      ctx.shadowBlur = 20 * pulse;
      
      // Car body (rectangle representing car)
      ctx.fillStyle = carColor;
      ctx.fillRect(-12, -6, 24, 12);
      
      // Car outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -6, 24, 12);
      
      // Car indicator dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Car label (car_id)
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(car.car_id || `#${index}`, point.x, point.y - 20);
      ctx.fillText(car.car_id || `#${index}`, point.x, point.y - 20);
      ctx.restore();
    });

    ctx.restore();
  }, [pathProperties, dimensions, cars, totalMeters]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      drawForeground();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (!isLoading) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawForeground, isLoading]);

  // Redraw background when dependencies change
  useEffect(() => {
    if (!isLoading) {
      drawBackground();
    }
  }, [drawBackground, isLoading]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-gray-900 ${className}`}
    >
      {/* Background canvas (static track) */}
      <canvas
        ref={backgroundCanvasRef}
        className="absolute inset-0"
        style={{ imageRendering: 'crisp-edges' }}
      />
      
      {/* Foreground canvas (animated cars) */}
      <canvas
        ref={foregroundCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ imageRendering: 'crisp-edges' }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-white text-lg">Loading track...</div>
        </div>
      )}
    </div>
  );
}


// src/components/LiveMapSVG.tsx

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { loadSvgPath } from "@/utils/loadSvgCenterline";

type Props = {
  track?: string; // track name (e.g., "cota", "barber", "indianapolis", "road_america", "sebring", "sonoma", "virginia")
  svgId?: string; // DOM id of loaded path
  lapdist?: number; // meters
  totalMeters?: number; // track length
  className?: string;
};

export default function LiveMapSVG({ 
  track, 
  svgId = "track-path", 
  lapdist = 0, 
  totalMeters = 6515, 
  className 
}: Props) {
  const carRef = useRef<SVGCircleElement | null>(null);
  const carInnerRef = useRef<SVGCircleElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathData, setPathData] = useState<string>("M100,300 C300,50 900,50 1100,300 C900,550 300,550 100,300 Z");
  const [viewBox, setViewBox] = useState<string>("0 0 1200 600");
  const [svgUrl, setSvgUrl] = useState<string>("");
  const [imageError, setImageError] = useState<boolean>(false);

  // Set SVG image URL when track changes
  useEffect(() => {
    if (track) {
      setSvgUrl(`/tracks/${track}.svg`);
      setImageError(false);
      // Also load path for car positioning
      loadSvgPath(`/tracks/${track}.svg`, svgId).then((res) => {
        if (res && res.d) {
          setPathData(res.d);
          if (res.viewBox) {
            setViewBox(res.viewBox);
          }
        }
      }).catch((err) => {
        console.warn(`Failed to load track path: ${track}`, err);
      });
    } else {
      setSvgUrl("");
      setImageError(false);
    }
  }, [track, svgId]);

  // Update car position along path
  useEffect(() => {
    const path = pathRef.current;
    if (!path || !carRef.current || !carInnerRef.current) return;
    const len = path.getTotalLength();
    if (len === 0) return; // path not ready yet
    const pct = Math.max(0, Math.min(1, lapdist / Math.max(1, totalMeters)));
    const pos = path.getPointAtLength(pct * len);
    carRef.current.setAttribute("cx", String(pos.x));
    carRef.current.setAttribute("cy", String(pos.y));
    carInnerRef.current.setAttribute("cx", String(pos.x));
    carInnerRef.current.setAttribute("cy", String(pos.y));
    // rotate to tangent (approx)
    const ahead = path.getPointAtLength(Math.min(len, pct*len + 3));
    const angle = Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180 / Math.PI;
    carRef.current.setAttribute("transform", `rotate(${angle} ${pos.x} ${pos.y})`);
    carInnerRef.current.setAttribute("transform", `rotate(${angle} ${pos.x} ${pos.y})`);
  }, [lapdist, totalMeters, pathData]);

  const showImage = svgUrl && !imageError;
  const showPath = !showImage;

  return (
    <div className={className ?? "w-full h-[500px] bg-gradient-to-br from-card/90 via-card/70 to-card/50 rounded-md p-4 relative overflow-hidden border border-border/50 group"}>
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Track map image as background */}
      {svgUrl && !imageError && (
        <motion.img 
          src={svgUrl}
          alt={`${track || 'track'} track map`}
          className="absolute inset-0 w-full h-full object-contain opacity-95"
          style={{ filter: 'brightness(0.95) contrast(1.05)' }}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
          onError={() => {
            // Fallback if image fails to load
            console.warn(`Failed to load track map: ${svgUrl}`);
            setImageError(true);
          }}
          onLoad={() => {
            setImageError(false);
          }}
        />
      )}
      
      {/* SVG overlay for car position indicator and track path */}
      <svg viewBox={viewBox} className="w-full h-full relative z-10" preserveAspectRatio="xMidYMid meet">
        {/* Track path - visible if no image or image failed to load */}
        <path 
          ref={pathRef}
          id={svgId} 
          d={pathData} 
          fill="none" 
          stroke={showPath ? "#334155" : "transparent"} 
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={showPath ? 0.6 : 0}
        />
        {/* Car indicator overlay - only show if we have valid path data */}
        {pathData && (
          <g>
            {/* Glow effect - animated pulsing ring */}
            <circle 
              cx="0" 
              cy="0" 
              r={20} 
              fill="none" 
              stroke="#EB0A1E" 
              strokeWidth={1} 
              opacity={0.3}
            >
              <animate
                attributeName="r"
                values="20;30;20"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.3;0;0.3"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Pulsing outer ring */}
            <circle 
              ref={carRef} 
              cx="0" 
              cy="0" 
              r={12} 
              fill="#EB0A1E" 
              stroke="#fff" 
              strokeWidth={2.5} 
              opacity={0.95}
            >
              <animate
                attributeName="r"
                values="12;16;12"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.95;0.7;0.95"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Inner core */}
            <circle 
              ref={carInnerRef} 
              cx="0" 
              cy="0" 
              r={7} 
              fill="#fff" 
              opacity={0.9}
            />
          </g>
        )}
      </svg>
      
      {/* Loading/placeholder text */}
      {!track && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <p className="text-muted-foreground text-sm">Select a track to view map</p>
        </div>
      )}
    </div>
  );
}


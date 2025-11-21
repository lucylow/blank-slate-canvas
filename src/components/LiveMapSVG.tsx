// src/components/LiveMapSVG.tsx

import React, { useEffect, useRef, useState } from "react";
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

  // Set SVG image URL when track changes
  useEffect(() => {
    if (track) {
      setSvgUrl(`/tracks/${track}.svg`);
      // Also load path for car positioning
      loadSvgPath(`/tracks/${track}.svg`, svgId).then((res) => {
        if (res && res.d) {
          setPathData(res.d);
          if (res.viewBox) {
            setViewBox(res.viewBox);
          }
        }
      });
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
    carRef.current.style.transform = `rotate(${angle}deg)`;
    carInnerRef.current.style.transform = `rotate(${angle}deg)`;
  }, [lapdist, totalMeters, pathData]);

  return (
    <div className={className ?? "w-full h-[500px] bg-gradient-to-br from-card/50 via-card/30 to-card/20 rounded-md p-4 relative overflow-hidden"}>
      {/* Track map image as background */}
      {svgUrl && (
        <img 
          src={svgUrl}
          alt={`${track} track map`}
          className="absolute inset-0 w-full h-full object-contain opacity-95"
          style={{ filter: 'brightness(0.95) contrast(1.05)' }}
        />
      )}
      
      {/* SVG overlay for car position indicator */}
      <svg viewBox={viewBox} className="w-full h-full relative z-10" preserveAspectRatio="xMidYMid meet">
        {/* Hidden track path for car positioning calculations */}
        <path 
          ref={pathRef}
          id={svgId} 
          d={pathData} 
          fill="none" 
          stroke="transparent" 
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Car indicator overlay */}
        <g>
          <circle ref={carRef} r={12} fill="#EB0A1E" stroke="#fff" strokeWidth={2.5} opacity={0.95} />
          <circle ref={carInnerRef} r={7} fill="#fff" opacity={0.9} />
        </g>
      </svg>
    </div>
  );
}


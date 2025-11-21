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
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathData, setPathData] = useState<string>("M100,300 C300,50 900,50 1100,300 C900,550 300,550 100,300 Z");
  const [viewBox, setViewBox] = useState<string>("0 0 1200 600");

  // Load SVG path when track changes
  useEffect(() => {
    if (track) {
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
    if (!path || !carRef.current) return;
    const len = path.getTotalLength();
    if (len === 0) return; // path not ready yet
    const pct = Math.max(0, Math.min(1, lapdist / Math.max(1, totalMeters)));
    const pos = path.getPointAtLength(pct * len);
    carRef.current.setAttribute("cx", String(pos.x));
    carRef.current.setAttribute("cy", String(pos.y));
    // rotate to tangent (approx)
    const ahead = path.getPointAtLength(Math.min(len, pct*len + 3));
    const angle = Math.atan2(ahead.y - pos.y, ahead.x - pos.x) * 180 / Math.PI;
    carRef.current.style.transform = `rotate(${angle}deg)`;
  }, [lapdist, totalMeters, pathData]);

  return (
    <div className={className ?? "w-full h-64 bg-black/20 rounded-md p-2"}>
      <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Track path loaded from SVG file */}
        <path 
          ref={pathRef}
          id={svgId} 
          d={pathData} 
          fill="none" 
          stroke="#334155" 
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* car indicator */}
        <g>
          <circle ref={carRef} r={8} fill="#EB0A1E" stroke="#fff" strokeWidth={1.5} />
        </g>
      </svg>
    </div>
  );
}


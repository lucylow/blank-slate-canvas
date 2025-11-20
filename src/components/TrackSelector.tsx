// src/components/TrackSelector.tsx

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const TRACKS = [
  "barber",
  "cota",
  "indianapolis",
  "road_america",
  "sebring",
  "sonoma",
  "virginia"
];

type Props = {
  value: string;
  onChange: (s: string) => void;
};

export default function TrackSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TRACKS.map((t, index) => {
        const isSelected = value === t;
        return (
          <motion.button
            key={t}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
              isSelected
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/50"
            )}
            onClick={() => onChange(t)}
          >
            {t.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
          </motion.button>
        );
      })}
    </div>
  );
}


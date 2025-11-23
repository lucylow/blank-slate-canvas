import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface MiniTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  ariaLabel?: string;
}

interface MiniTabsProps {
  tabs: MiniTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * MiniTabs - Compact pill-style tab component
 * 
 * Features:
 * - Keyboard accessible (ArrowLeft/Right, Home/End)
 * - Horizontal scrolling on small screens
 * - Dark pill styling with active state
 * - Optional icons and badges
 */
export function MiniTabs({ tabs = [], activeId, onChange, className = "" }: MiniTabsProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll active tab into view when it changes
    const el = rootRef.current?.querySelector('[aria-selected="true"]');
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
    }
  }, [activeId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;

    e.preventDefault();
    const currentIdx = tabs.findIndex((t) => t.id === activeId);
    if (currentIdx === -1) return;

    let nextIdx = currentIdx;
    if (e.key === "ArrowRight") nextIdx = (currentIdx + 1) % tabs.length;
    if (e.key === "ArrowLeft") nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") nextIdx = 0;
    if (e.key === "End") nextIdx = tabs.length - 1;

    const nextId = tabs[nextIdx].id;
    onChange(nextId);

    // Focus the next button after DOM update
    setTimeout(() => {
      const btn = rootRef.current?.querySelector(`[data-tab-id="${nextId}"]`) as HTMLElement;
      btn?.focus();
    }, 0);
  }

  return (
    <div
      ref={rootRef}
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "flex items-center gap-2 overflow-x-auto py-2",
        "scrollbar-hide", // Hide scrollbar but keep scrolling
        className
      )}
      onKeyDown={handleKeyDown}
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={selected}
            aria-label={tab.ariaLabel || tab.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium",
              "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
              "focus:ring-ring",
              selected
                ? "bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-lg ring-1 ring-slate-700/50"
                : "bg-slate-800/40 text-slate-200 hover:bg-slate-800/60 hover:text-white"
            )}
          >
            {tab.icon && (
              <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {typeof tab.badge === "number" && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-700/80 text-slate-100 min-w-[1.5rem]">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}


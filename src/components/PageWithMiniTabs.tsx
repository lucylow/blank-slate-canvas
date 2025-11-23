import React, { useState } from "react";
import { MiniTabs, type MiniTab } from "./MiniTabs";
import { cn } from "@/lib/utils";

interface PageWithMiniTabsProps {
  pageTitle: string;
  pageSubtitle?: string;
  tabs: MiniTab[];
  initial?: string;
  children: React.ReactNode | ((activeTab: string) => React.ReactNode);
  className?: string;
}

/**
 * PageWithMiniTabs - Wrapper component for pages with mini tabs
 * 
 * Usage:
 * <PageWithMiniTabs pageTitle="Coaching" tabs={tabs} initial="highlights">
 *   {active => (
 *     <>
 *       {active === 'kpis' && <KPIsPanel />}
 *       {active === 'behavior' && <BehaviorPanel />}
 *     </>
 *   )}
 * </PageWithMiniTabs>
 */
export function PageWithMiniTabs({
  pageTitle,
  pageSubtitle,
  tabs = [],
  initial,
  children,
  className,
}: PageWithMiniTabsProps) {
  const [active, setActive] = useState<string>(
    initial || (tabs[0]?.id) || ""
  );

  // If children is a function, call it with active tab
  const content = typeof children === "function" ? children(active) : children;

  return (
    <main className={cn("min-h-screen bg-[#0A0A0A] text-white", className)}>
      <section className="max-w-6xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-gray-300 max-w-2xl text-sm lg:text-base">
              {pageSubtitle}
            </p>
          )}
        </div>

        {/* Mini Tabs */}
        {tabs.length > 0 && (
          <MiniTabs tabs={tabs} activeId={active} onChange={setActive} />
        )}

        {/* Content Area */}
        <div className="mt-6" aria-live="polite">
          {content}
        </div>
      </section>
    </main>
  );
}


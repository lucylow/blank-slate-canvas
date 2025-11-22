// src/lib/navOrder.ts
// Scoring & ordering utility for navigation items

import type { NavItem, AgentStatus } from '@/stores/navStore';

export interface ScoredNavItem extends NavItem {
  score: number;
  alertScore?: number;
  healthPenalty?: number;
  freqScore?: number;
  recencyScore?: number;
}

export function computeNavOrder(
  items: NavItem[],
  agents: Record<string, AgentStatus>,
  alertBumps: Record<string, number> = {},
  now: number = Date.now()
): ScoredNavItem[] {
  // Tunable weights (from design doc)
  const w = { 
    pin: 100,      // Pinned items get huge priority
    alert: 40,     // Active alerts boost score
    health: 20,    // Agent health affects ordering
    freq: 8,       // Frequency of visits
    recency: 4,    // Recent visits
    bump: 30       // Timebound alert bump bonus
  };
  
  const BUMP_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  
  return items.map((it): ScoredNavItem => {
    const agent = agents[it.id] || null;
    
    // Pinned items always score high
    const isPinned = it.pinned ? 1 : 0;
    
    // Alert score (0-1)
    const alertScore = agent?.alert?.score ?? 0;
    
    // Health penalty (0-1, higher = worse health)
    const healthPenalty = agent
      ? Math.min(1, (agent.latency_ms ?? 0) / 500) // Normalize to 500ms max
      : 0;
    
    // Frequency score (log scale to prevent runaway)
    const freqScore = Math.log(1 + (it.freq ?? 0));
    
    // Recency score (decay over 24 hours)
    const recencyScore = it.lastVisited
      ? Math.max(0, 1 - ((now - it.lastVisited) / (1000 * 60 * 60 * 24)))
      : 0;
    
    // Timebound alert bump bonus (decays over BUMP_DURATION_MS)
    let bumpBonus = 0;
    const bumpTime = alertBumps[it.id];
    if (bumpTime) {
      const age = now - bumpTime;
      if (age < BUMP_DURATION_MS) {
        bumpBonus = 1 - (age / BUMP_DURATION_MS); // Linear decay from 1 to 0
      }
    }
    
    // Combine scores
    const score =
      w.pin * isPinned +
      w.alert * alertScore +
      w.health * (1 - healthPenalty) +
      w.freq * freqScore +
      w.recency * recencyScore +
      w.bump * bumpBonus;
    
    return {
      ...it,
      score,
      alertScore,
      healthPenalty,
      freqScore,
      recencyScore
    };
  }).sort((a, b) => {
    // Pinned items always stay at top (unless both pinned, then sort by score)
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Manual order takes precedence if both have it and are in same pinned state
    if (a.manualOrder !== null && b.manualOrder !== null && a.pinned === b.pinned) {
      return a.manualOrder - b.manualOrder;
    }
    
    // Otherwise sort by computed score
    return b.score - a.score;
  });
}

// Helper to group items by section for two-tier menu
export function groupBySection(items: ScoredNavItem[]) {
  const staticItems = items.filter(it => it.section === 'static');
  const agentItems = items.filter(it => it.section === 'agent');
  return { staticItems, agentItems };
}


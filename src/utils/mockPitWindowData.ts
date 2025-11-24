/**
 * Mock Pit Window Optimization Data Generator
 * 
 * Generates realistic race replay CSV data for interactive demo
 */

export interface MockRaceData {
  csv: string;
  meta: {
    replay_id: string;
    file_name: string;
    cars: string[];
    laps: number[];
    car_count: number;
    lap_count: number;
    n_rows: number;
  };
}

/**
 * Generate mock race replay CSV data
 * 
 * Creates realistic race data with:
 * - Multiple cars (8-12 cars)
 * - 20-30 laps
 * - Realistic lap times with degradation
 * - Position changes
 * - Tire wear effects
 */
export function generateMockRaceReplay(): MockRaceData {
  const replayId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const fileName = `demo_race_replay_${new Date().toISOString().split('T')[0]}.csv`;
  
  // Generate 10 cars
  const carNumbers = Array.from({ length: 10 }, (_, i) => String(7 + i * 2)); // 7, 9, 11, 13, 15, 17, 19, 21, 23, 25
  const totalLaps = 25;
  
  // Base lap times per car (in seconds) - faster cars have lower base times
  const baseLapTimes: Record<string, number> = {};
  carNumbers.forEach((car, idx) => {
    baseLapTimes[car] = 95.0 + idx * 0.8; // Range from 95.0s to 102.2s
  });
  
  // Generate CSV rows
  const rows: string[] = [];
  
  // CSV header
  rows.push('vehicle_number,lap,total_time,lap_time,position');
  
  // Generate data for each car
  carNumbers.forEach((car, carIdx) => {
    let cumulativeTime = 0;
    const baseTime = baseLapTimes[car];
    
    for (let lap = 1; lap <= totalLaps; lap++) {
      // Simulate tire degradation: lap times increase as tires wear
      const tireWearFactor = 1 + (lap - 1) * 0.008; // ~0.8% degradation per lap
      
      // Add some randomness (±0.3s)
      const randomVariation = (Math.random() - 0.5) * 0.6;
      
      // Simulate pit stop delays (cars pit at different laps)
      let lapTime = baseTime * tireWearFactor + randomVariation;
      
      // Some cars pit around lap 10-15
      if (lap === 10 + carIdx && lap < totalLaps - 5) {
        // Pit stop adds ~25 seconds
        lapTime += 25;
      }
      
      cumulativeTime += lapTime;
      
      // Position calculation (simplified - based on cumulative time)
      // In real data, this would be more complex
      const position = Math.max(1, Math.min(10, Math.floor(cumulativeTime / 100) % 10 + 1));
      
      rows.push(`${car},${lap},${cumulativeTime.toFixed(3)},${lapTime.toFixed(3)},${position}`);
    }
  });
  
  const csv = rows.join('\n');
  
  return {
    csv,
    meta: {
      replay_id: replayId,
      file_name: fileName,
      cars: carNumbers,
      laps: Array.from({ length: totalLaps }, (_, i) => i + 1),
      car_count: carNumbers.length,
      lap_count: totalLaps,
      n_rows: rows.length - 1, // Exclude header
    },
  };
}

/**
 * Generate mock simulation results
 * 
 * Creates realistic simulation results for different pit stop scenarios
 * with detailed "pit now vs stay out" analysis
 */
export function generateMockSimulationResults(
  replayId: string,
  car: string,
  currentLap: number
) {
  const simId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  
  // Generate base times for all cars
  const cars = ['7', '9', '11', '13', '15', '17', '19', '21', '23', '25'];
  const baseTimes: Record<string, number> = {};
  cars.forEach((c, idx) => {
    baseTimes[c] = 2000 + idx * 50 + Math.random() * 30;
  });
  
  // Find baseline position
  const sortedCars = [...cars].sort((a, b) => baseTimes[a] - baseTimes[b]);
  const baselinePos = sortedCars.indexOf(car) + 1;
  
  // Calculate current tire wear (increases with lap number)
  const currentTireWear = Math.min(95, 30 + (currentLap - 1) * 2.5);
  const lapsRemaining = 25 - currentLap;
  
  // Generate scenarios with detailed analysis
  const generateScenario = (pitLap: number | null, delay: number = 0, scenarioKey: string) => {
    const times: Record<string, number> = { ...baseTimes };
    let timeDelta = 0;
    let positionDelta = 0;
    let risk = 0;
    let tireWearAtPit = currentTireWear;
    let trafficRisk = 0;
    let competitorPitWindow = false;
    
    if (pitLap !== null) {
      // Calculate tire wear at pit time
      tireWearAtPit = Math.min(95, currentTireWear + (delay * 2.5));
      
      // Pit stop time cost (~25 seconds base, can vary)
      const pitTimeCost = 25 + (Math.random() - 0.5) * 3; // 23.5-26.5 seconds
      
      // Outlap penalty (slower first lap after pit)
      const outlapPenalty = 2 + (Math.random() - 0.5) * 0.5; // 1.75-2.25 seconds
      
      // Calculate time if pitting
      const lapsAfterPit = 25 - (currentLap + delay);
      const tireDegradationRate = 0.008; // 0.8% per lap
      const freshTireGain = 0.6; // Fresh tires save ~0.6s per lap initially
      
      // Time saved from fresh tires
      let timeGain = 0;
      for (let i = 0; i < lapsAfterPit; i++) {
        const lapGain = freshTireGain * (1 - i * tireDegradationRate);
        timeGain += lapGain;
      }
      
      // Time lost from staying out (degrading tires)
      let timeLost = 0;
      for (let i = 0; i < delay; i++) {
        const lapLoss = (currentTireWear / 100) * 0.8 * (1 + i * 0.1);
        timeLost += lapLoss;
      }
      
      // Net time delta
      timeDelta = pitTimeCost + outlapPenalty - timeGain + timeLost;
      times[car] = baseTimes[car] + timeDelta;
      
      // Risk factors
      // High tire wear = higher risk if staying out
      if (tireWearAtPit > 85) {
        risk += 25; // High risk of tire failure
      } else if (tireWearAtPit > 70) {
        risk += 15; // Moderate risk
      }
      
      // Traffic risk (check if competitors are pitting around same time)
      const competitorPitLaps = [10, 11, 12, 13, 14, 15, 16];
      competitorPitWindow = competitorPitLaps.includes(pitLap);
      if (competitorPitWindow) {
        trafficRisk = 20 + Math.random() * 15; // 20-35% traffic risk
        risk += trafficRisk * 0.3;
      } else {
        trafficRisk = 5 + Math.random() * 10; // 5-15% low traffic
      }
      
      // Position risk (losing positions during pit)
      if (baselinePos <= 3) {
        risk += 10; // Higher risk losing podium position
      }
    } else {
      // Stay out scenario
      // Calculate time lost from degrading tires
      const finalTireWear = Math.min(95, currentTireWear + (lapsRemaining * 2.5));
      let timeLost = 0;
      for (let i = 0; i < lapsRemaining; i++) {
        const currentWear = currentTireWear + (i * 2.5);
        const lapLoss = (currentWear / 100) * 0.8 * (1 + i * 0.1);
        timeLost += lapLoss;
      }
      
      timeDelta = timeLost;
      times[car] = baseTimes[car] + timeDelta;
      
      // Risk of staying out
      if (finalTireWear > 90) {
        risk = 40 + Math.random() * 20; // 40-60% risk of tire failure
      } else if (finalTireWear > 80) {
        risk = 25 + Math.random() * 15; // 25-40% risk
      } else {
        risk = 10 + Math.random() * 10; // 10-20% risk
      }
      
      // Risk of being undercut by competitors
      const undercutRisk = 15 + Math.random() * 10;
      risk += undercutRisk;
    }
    
    // Re-sort with new times
    const ordered = [...cars]
      .map(c => ({ car: c, pred_time: times[c] }))
      .sort((a, b) => a.pred_time - b.pred_time);
    
    const newPos = ordered.findIndex(o => o.car === car) + 1;
    positionDelta = newPos - baselinePos;
    
    // Generate reasoning
    const reasoning: string[] = [];
    if (pitLap !== null) {
      if (tireWearAtPit > 80) {
        reasoning.push(`Critical tire wear (${tireWearAtPit.toFixed(0)}%) - pit recommended`);
      }
      if (timeDelta < -5) {
        reasoning.push(`Time gain: ${Math.abs(timeDelta).toFixed(1)}s from fresh tires`);
      } else if (timeDelta > 5) {
        reasoning.push(`Time loss: ${timeDelta.toFixed(1)}s (pit cost outweighs tire gain)`);
      }
      if (competitorPitWindow) {
        reasoning.push(`Traffic risk: ${trafficRisk.toFixed(0)}% (competitors pitting lap ${pitLap})`);
      } else {
        reasoning.push(`Clear pit window - low traffic risk`);
      }
      if (positionDelta < 0) {
        reasoning.push(`Position gain: +${Math.abs(positionDelta)} positions`);
      } else if (positionDelta > 0) {
        reasoning.push(`Position loss: -${positionDelta} positions`);
      }
    } else {
      reasoning.push(`Current tire wear: ${currentTireWear.toFixed(0)}%`);
      reasoning.push(`Projected final wear: ${Math.min(95, currentTireWear + (lapsRemaining * 2.5)).toFixed(0)}%`);
      if (timeDelta > 10) {
        reasoning.push(`Time loss: ${timeDelta.toFixed(1)}s from tire degradation`);
      }
      reasoning.push(`Undercut risk: ${(risk * 0.3).toFixed(0)}% from competitors`);
    }
    
    return {
      ordered,
      target_car: car,
      baseline_pos: baselinePos,
      sim_pos: newPos,
      time_delta: timeDelta,
      position_delta: positionDelta,
      risk: Math.min(100, Math.max(0, risk)),
      tire_wear_at_pit: pitLap !== null ? tireWearAtPit : null,
      traffic_risk: trafficRisk,
      competitor_pit_window: competitorPitWindow,
      reasoning: reasoning,
      // Additional metrics
      pit_now_delta: scenarioKey === 'now' ? timeDelta : undefined,
      stay_out_delta: scenarioKey === 'baseline' ? timeDelta : undefined,
      pit_now_risk: scenarioKey === 'now' ? risk : undefined,
      stay_out_risk: scenarioKey === 'baseline' ? risk : undefined,
    };
  };
  
  // Generate baseline (stay out) scenario
  const baselineScenario = generateScenario(null, 0, 'baseline');
  
  return {
    sim_id: simId,
    naive: {
      now: generateScenario(currentLap, 0, 'now'),
      '+1': generateScenario(currentLap + 1, 1, '+1'),
      '+2': generateScenario(currentLap + 2, 2, '+2'),
      baseline: baselineScenario,
    },
    model: {
      now: generateScenario(currentLap, 0, 'now'),
      '+1': generateScenario(currentLap + 1, 1, '+1'),
      '+2': generateScenario(currentLap + 2, 2, '+2'),
      baseline: baselineScenario,
    },
    meta: {
      replay_id: replayId,
      current_lap: currentLap,
      current_tire_wear: currentTireWear,
      laps_remaining: lapsRemaining,
    },
  };
}

/**
 * Generate recommended pit window with detailed pit now vs stay out analysis
 */
export function generateMockPitWindow(car: string, currentLap: number) {
  // Calculate current tire wear
  const currentTireWear = Math.min(95, 30 + (currentLap - 1) * 2.5);
  const lapsRemaining = 25 - currentLap;
  
  // Optimal pit window is typically 2-3 laps wide
  const optimalLap = currentLap + Math.floor(Math.random() * 3) + 5; // 5-7 laps ahead
  const windowStart = optimalLap - 1;
  const windowEnd = optimalLap + 1;
  
  // Calculate pit now vs stay out comparison
  const pitNowAnalysis = {
    time_delta: -8.5 + Math.random() * 5, // -8.5 to -3.5 seconds (time gain)
    position_delta: -1 + Math.floor(Math.random() * 2), // -1 to 0 positions (gain or maintain)
    risk: 15 + Math.random() * 10, // 15-25% risk
    tire_wear: currentTireWear,
    traffic_risk: 20 + Math.random() * 15, // 20-35% traffic risk
    fuel_level: 45 + Math.random() * 10, // 45-55% fuel remaining
    competitor_pit_timing: ['Lap 12', 'Lap 13', 'Lap 14'],
    advantages: [
      `Fresh tires save ~0.6s per lap for remaining ${lapsRemaining} laps`,
      `Avoid tire degradation penalty of ${(currentTireWear * 0.01).toFixed(1)}s per lap`,
      `Undercut opportunity - gain positions on competitors`,
    ],
    disadvantages: [
      `Pit stop cost: ~25s + outlap penalty`,
      `Traffic risk: ${(20 + Math.random() * 15).toFixed(0)}% chance of slow pit exit`,
      `Lose track position during pit stop`,
    ],
  };
  
  const stayOutAnalysis = {
    time_delta: 12.5 + Math.random() * 8, // 12.5 to 20.5 seconds (time loss)
    position_delta: 1 + Math.floor(Math.random() * 2), // 1 to 2 positions (loss)
    risk: 35 + Math.random() * 20, // 35-55% risk
    projected_final_tire_wear: Math.min(95, currentTireWear + (lapsRemaining * 2.5)),
    undercut_risk: 25 + Math.random() * 15, // 25-40% undercut risk
    fuel_level: 45 + Math.random() * 10, // 45-55% fuel remaining
    advantages: [
      `Maintain track position (no pit stop delay)`,
      `Avoid traffic in pit lane`,
      `If competitors pit, gain track position`,
    ],
    disadvantages: [
      `Tire degradation: ${(currentTireWear * 0.01).toFixed(1)}s per lap loss accelerating`,
      `High risk of tire failure (${(35 + Math.random() * 20).toFixed(0)}%)`,
      `Undercut risk: competitors may gain positions`,
      `Projected final tire wear: ${Math.min(95, currentTireWear + (lapsRemaining * 2.5)).toFixed(0)}%`,
    ],
  };
  
  // Determine recommendation
  const recommendation = pitNowAnalysis.time_delta < -5 && pitNowAnalysis.risk < 30
    ? 'PIT_NOW'
    : optimalLap <= currentLap + 3
    ? 'PIT_SOON'
    : 'STAY_OUT';
  
  return {
    recommended_lap: optimalLap,
    window_start: windowStart,
    window_end: windowEnd,
    confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
    recommendation: recommendation,
    current_tire_wear: currentTireWear,
    laps_remaining: lapsRemaining,
    pit_now: pitNowAnalysis,
    stay_out: stayOutAnalysis,
    reasoning: [
      `Tire degradation accelerating after lap ${currentLap + 3} (current: ${currentTireWear.toFixed(0)}%)`,
      `Traffic analysis shows ${pitNowAnalysis.traffic_risk.toFixed(0)}% traffic risk at lap ${optimalLap}`,
      `Competitor pit windows: ${pitNowAnalysis.competitor_pit_timing.join(', ')}`,
      `Pit now: ${pitNowAnalysis.time_delta < 0 ? 'Gain' : 'Lose'} ${Math.abs(pitNowAnalysis.time_delta).toFixed(1)}s`,
      `Stay out: ${stayOutAnalysis.time_delta > 0 ? 'Lose' : 'Gain'} ${Math.abs(stayOutAnalysis.time_delta).toFixed(1)}s`,
    ],
    // Additional detailed metrics
    tire_wear_projection: {
      current: currentTireWear,
      after_1_lap: Math.min(95, currentTireWear + 2.5),
      after_2_laps: Math.min(95, currentTireWear + 5),
      after_3_laps: Math.min(95, currentTireWear + 7.5),
      critical_threshold: 85,
    },
    fuel_analysis: {
      current_level: 45 + Math.random() * 10,
      can_complete_race: true,
      fuel_save_mode_available: false,
    },
    competitor_analysis: {
      cars_ahead_pitting: [12, 13, 14],
      cars_behind_pitting: [15, 16],
      undercut_opportunity: true,
      overcut_risk: false,
    },
  };
}


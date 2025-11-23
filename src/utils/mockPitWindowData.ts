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
  
  // Generate scenarios
  const generateScenario = (pitLap: number | null, delay: number = 0) => {
    const times: Record<string, number> = { ...baseTimes };
    
    if (pitLap !== null) {
      // Add pit stop time cost (~25 seconds)
      const pitTimeCost = 25;
      // Add outlap penalty (~2 seconds slower)
      const outlapPenalty = 2;
      
      // Calculate time if pitting
      const lapsRemaining = 25 - (currentLap + delay);
      const timeGain = lapsRemaining * 0.5; // Fresh tires save ~0.5s per lap
      
      times[car] = baseTimes[car] + pitTimeCost + outlapPenalty - timeGain;
    }
    
    // Re-sort with new times
    const ordered = [...cars]
      .map(c => ({ car: c, pred_time: times[c] }))
      .sort((a, b) => a.pred_time - b.pred_time);
    
    const newPos = ordered.findIndex(o => o.car === car) + 1;
    
    return {
      ordered,
      target_car: car,
      baseline_pos: baselinePos,
      sim_pos: newPos,
    };
  };
  
  return {
    sim_id: simId,
    naive: {
      now: generateScenario(currentLap, 0),
      '+1': generateScenario(currentLap + 1, 1),
      '+2': generateScenario(currentLap + 2, 2),
    },
    model: {
      now: generateScenario(currentLap, 0),
      '+1': generateScenario(currentLap + 1, 1),
      '+2': generateScenario(currentLap + 2, 2),
    },
    meta: {
      replay_id: replayId,
    },
  };
}

/**
 * Generate recommended pit window
 */
export function generateMockPitWindow(car: string, currentLap: number) {
  // Optimal pit window is typically 2-3 laps wide
  const optimalLap = currentLap + Math.floor(Math.random() * 3) + 5; // 5-7 laps ahead
  return {
    recommended_lap: optimalLap,
    window_start: optimalLap - 1,
    window_end: optimalLap + 1,
    confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
    reasoning: [
      `Tire degradation accelerating after lap ${currentLap + 3}`,
      `Traffic analysis shows clear window at lap ${optimalLap}`,
      `Competitor pit windows suggest undercut opportunity`,
    ],
  };
}


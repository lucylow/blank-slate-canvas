// Toyota GR Car comparison data
import type { GRCarComparisonData, GRCarSpecs, TrackPerformance } from './grCarTypes';

export const grCars: GRCarSpecs[] = [
  {
    model: "GR Supra",
    engine: "3.0L I6 Turbo",
    drivetrain: "RWD",
    power_hp: 382,
    torque_nm: 500,
    weight_kg: 1500,
    transmission: "6MT/8AT ZF",
    accel_0_100: 4.1,
    advantages: "High power/torque, top speed, track focused",
    notes: {
      best_tracks: ["road-america", "cota", "indianapolis"],
      description: "Most powerful GR model with exceptional straight-line speed and track-focused dynamics"
    }
  },
  {
    model: "GR Yaris",
    engine: "1.6L I3 Turbo",
    drivetrain: "AWD",
    power_hp: 272, // Midpoint between variants (257-300)
    torque_nm: 370, // Midpoint between variants (360-400)
    weight_kg: 1280,
    transmission: "6MT",
    accel_0_100: 5.3,
    advantages: "Light, agile, rally-bred AWD, best in twisty sectors",
    notes: {
      best_tracks: ["vir", "sonoma", "barber"],
      description: "Lightweight rally-bred AWD with exceptional agility in technical sections"
    }
  },
  {
    model: "GR86",
    engine: "2.4L I4 NA",
    drivetrain: "RWD",
    power_hp: 228,
    torque_nm: 250,
    weight_kg: 1270,
    transmission: "6MT/6AT",
    accel_0_100: 6.0,
    advantages: "Lightweight, sharp handling, naturally aspirated smoothness",
    notes: {
      best_tracks: ["sonoma", "barber", "vir"],
      description: "Lightweight, naturally aspirated sports car with exceptional balance and handling"
    }
  },
  {
    model: "GR Corolla",
    engine: "1.6L I3 Turbo",
    drivetrain: "AWD",
    power_hp: 300,
    torque_nm: 400,
    weight_kg: 1470,
    transmission: "6MT/8AT", // 8AT for 2025+
    accel_0_100: 5.0,
    advantages: "AWD, more power, stable in all conditions, circuit ready",
    notes: {
      best_tracks: ["sebring", "indianapolis", "cota"],
      description: "Balanced AWD performance car with strong power and all-weather capability"
    }
  }
];

export const trackPerformanceData: TrackPerformance[] = [
  {
    track: "sonoma",
    trackName: "Sonoma Raceway",
    performance: {
      "GR Supra": "Requires traction management, can oversteer in S2/S3",
      "GR Yaris": "Nimble, gains in technical sectors",
      "GR86": "Shines on balanced grip, ideal for flow sections",
      "GR Corolla": "Very stable, but weight can show in abrupt corners"
    },
    strengths: {
      "GR Supra": ["High speed sections", "Technical corners with grip"],
      "GR Yaris": ["Technical sectors", "Elevation changes", "Corner exit traction"],
      "GR86": ["Balanced handling", "Smooth flow sections", "Consistent grip"],
      "GR Corolla": ["Stable platform", "Technical sections", "All-weather grip"]
    },
    weaknesses: {
      "GR Supra": ["Oversteer risk", "Traction limited sections"],
      "GR Yaris": ["Top speed on straights"],
      "GR86": ["Power on straights"],
      "GR Corolla": ["Weight in tight corners"]
    },
    telemetry_focus: ["sector splits", "lat_g", "throttle", "brake", "speed"]
  },
  {
    track: "road-america",
    trackName: "Road America",
    performance: {
      "GR Supra": "Top speed king, dominates straights",
      "GR Yaris": "Loses on straights, best in braking zones",
      "GR86": "Underpowered, must maximize corner speed",
      "GR Corolla": "AWD traction helps, punchy acceleration"
    },
    strengths: {
      "GR Supra": ["Long straights", "High-speed sections", "Power delivery"],
      "GR Yaris": ["Braking zones", "Technical turns", "Corner entry"],
      "GR86": ["Corner speed", "Late braking", "Momentum conservation"],
      "GR Corolla": ["Acceleration zones", "Traction exits", "Mid-speed corners"]
    },
    weaknesses: {
      "GR Supra": ["Tire wear on straights"],
      "GR Yaris": ["Straight-line speed", "Top speed limited"],
      "GR86": ["Power deficit", "Top speed limited"],
      "GR Corolla": ["Weight penalty", "Higher tire wear"]
    },
    telemetry_focus: ["sector splits", "long_g", "speed", "throttle", "brake"]
  },
  {
    track: "vir",
    trackName: "Virginia International Raceway",
    performance: {
      "GR Supra": "Oversteer risk in fast turns",
      "GR Yaris": "Best traction exits, nimble through chicanes",
      "GR86": "Dances through complex sections",
      "GR Corolla": "AWD rotates well in technical sections"
    },
    strengths: {
      "GR Supra": ["High-speed turns with grip", "Power application"],
      "GR Yaris": ["Corner exits", "Chicane sections", "Trail braking"],
      "GR86": ["Complex sections", "Technical turns", "Balance"],
      "GR Corolla": ["Rotation in corners", "Traction exits", "Stability"]
    },
    weaknesses: {
      "GR Supra": ["Oversteer in fast turns", "Traction management"],
      "GR Yaris": ["Top speed"],
      "GR86": ["Power on straights"],
      "GR Corolla": ["Weight transfer"]
    },
    telemetry_focus: ["sector splits", "lat_g", "steering_angle", "throttle", "brake"]
  },
  {
    track: "cota",
    trackName: "Circuit of the Americas",
    performance: {
      "GR Supra": "High-power sectors excel, tire wear critical",
      "GR Yaris": "Good everywhere, lacks top speed",
      "GR86": "Loses out on long straights, corners well",
      "GR Corolla": "AWD + power = potent combination"
    },
    strengths: {
      "GR Supra": ["High-power sectors", "Long straights", "S1/S3 speed"],
      "GR Yaris": ["Technical S2", "Cornering", "Consistency"],
      "GR86": ["Cornering", "Technical sections", "Balance"],
      "GR Corolla": ["Power + AWD", "All sectors", "Versatility"]
    },
    weaknesses: {
      "GR Supra": ["Tire degradation", "S2 technical sections"],
      "GR Yaris": ["Long straights", "Top speed"],
      "GR86": ["Long straights", "Power deficit"],
      "GR Corolla": ["Tire wear", "Weight"]
    },
    telemetry_focus: ["sector splits", "lat_g", "long_g", "tire_wear", "speed"]
  },
  {
    track: "barber",
    trackName: "Barber Motorsports Park",
    performance: {
      "GR Supra": "RWD twitch requires careful management",
      "GR Yaris": "Corners well, gains in technical sections",
      "GR86": "Handles best, ideal balance",
      "GR Corolla": "High grip, but weight shows"
    },
    strengths: {
      "GR Supra": ["Power sections", "High-speed corners"],
      "GR Yaris": ["Technical sections", "Elevation", "Corner exits"],
      "GR86": ["Balance", "Handling", "Cornering"],
      "GR Corolla": ["Grip", "Stability", "Traction"]
    },
    weaknesses: {
      "GR Supra": ["RWD twitch", "Traction limited"],
      "GR Yaris": ["Straight-line speed"],
      "GR86": ["Power on straights"],
      "GR Corolla": ["Weight penalty", "Elevation changes"]
    },
    telemetry_focus: ["sector splits", "lat_g", "elevation", "throttle", "brake"]
  },
  {
    track: "indianapolis",
    trackName: "Indianapolis Motor Speedway",
    performance: {
      "GR Supra": "Explosive, fastest on straights",
      "GR Yaris": "Underpowered on long straights",
      "GR86": "Limiting power on straights",
      "GR Corolla": "AWD helps with straight-line stability"
    },
    strengths: {
      "GR Supra": ["Straight-line speed", "Power", "Top speed"],
      "GR Yaris": ["Braking zones", "Technical sections"],
      "GR86": ["Cornering", "Balance"],
      "GR Corolla": ["Straight-line stability", "AWD traction", "Power"]
    },
    weaknesses: {
      "GR Supra": ["Tire wear", "Fuel consumption"],
      "GR Yaris": ["Long straights", "Power deficit"],
      "GR86": ["Power on straights", "Top speed"],
      "GR Corolla": ["Weight", "Tire wear"]
    },
    telemetry_focus: ["sector splits", "speed", "long_g", "throttle", "brake"]
  },
  {
    track: "sebring",
    trackName: "Sebring International Raceway",
    performance: {
      "GR Supra": "Tire wear critical, powerful but heavy",
      "GR Yaris": "Agile, gentler on tires",
      "GR86": "Best on worn tires, consistent",
      "GR Corolla": "Strong, but heavier weight shows"
    },
    strengths: {
      "GR Supra": ["Power sections", "High-speed areas"],
      "GR Yaris": ["Agility", "Tire management", "Technical sections"],
      "GR86": ["Tire management", "Consistency", "Balance"],
      "GR Corolla": ["Power + AWD", "Stability", "Versatility"]
    },
    weaknesses: {
      "GR Supra": ["Tire degradation", "Weight", "Bump compliance"],
      "GR Yaris": ["Top speed", "Long straights"],
      "GR86": ["Power", "Straight-line speed"],
      "GR Corolla": ["Weight", "Tire wear", "Bump sensitivity"]
    },
    telemetry_focus: ["sector splits", "tire_wear", "lat_g", "long_g", "bump_compliance"]
  }
];

export const trackCarMatrix = [
  {
    track: "sonoma" as const,
    trackName: "Sonoma Raceway",
    cars: [
      { model: "GR Supra", rating: "Challenging" as const, notes: "Traction limited, requires careful management" },
      { model: "GR Yaris", rating: "Excellent" as const, notes: "Agility advantage in technical sectors" },
      { model: "GR86", rating: "Excellent" as const, notes: "Balance shines through" },
      { model: "GR Corolla", rating: "Good" as const, notes: "Stable and versatile" }
    ]
  },
  {
    track: "road-america" as const,
    trackName: "Road America",
    cars: [
      { model: "GR Supra", rating: "Excellent" as const, notes: "Top speed king on long straights" },
      { model: "GR Yaris", rating: "Challenging" as const, notes: "Loses time on straights" },
      { model: "GR86", rating: "Challenging" as const, notes: "Underpowered, must maximize corner speed" },
      { model: "GR Corolla", rating: "Good" as const, notes: "AWD helps, punchy acceleration" }
    ]
  },
  {
    track: "vir" as const,
    trackName: "Virginia International Raceway",
    cars: [
      { model: "GR Supra", rating: "Good" as const, notes: "Oversteer risk in fast turns" },
      { model: "GR Yaris", rating: "Excellent" as const, notes: "Best traction exits" },
      { model: "GR86", rating: "Excellent" as const, notes: "Dances through complex sections" },
      { model: "GR Corolla", rating: "Good" as const, notes: "AWD rotates well" }
    ]
  },
  {
    track: "cota" as const,
    trackName: "Circuit of the Americas",
    cars: [
      { model: "GR Supra", rating: "Excellent" as const, notes: "High-power sectors excel" },
      { model: "GR Yaris", rating: "Good" as const, notes: "Good everywhere, lacks top speed" },
      { model: "GR86", rating: "Average" as const, notes: "Loses out on long straights" },
      { model: "GR Corolla", rating: "Excellent" as const, notes: "AWD + power = potent" }
    ]
  },
  {
    track: "barber" as const,
    trackName: "Barber Motorsports Park",
    cars: [
      { model: "GR Supra", rating: "Good" as const, notes: "RWD twitch requires management" },
      { model: "GR Yaris", rating: "Excellent" as const, notes: "Corners well in technical sections" },
      { model: "GR86", rating: "Excellent" as const, notes: "Ideal balance and handling" },
      { model: "GR Corolla", rating: "Good" as const, notes: "High grip, weight shows" }
    ]
  },
  {
    track: "indianapolis" as const,
    trackName: "Indianapolis Motor Speedway",
    cars: [
      { model: "GR Supra", rating: "Excellent" as const, notes: "Explosive, fastest on straights" },
      { model: "GR Yaris", rating: "Challenging" as const, notes: "Underpowered on straights" },
      { model: "GR86", rating: "Challenging" as const, notes: "Limiting power on straights" },
      { model: "GR Corolla", rating: "Good" as const, notes: "AWD helps with stability" }
    ]
  },
  {
    track: "sebring" as const,
    trackName: "Sebring International Raceway",
    cars: [
      { model: "GR Supra", rating: "Good" as const, notes: "Tire wear critical" },
      { model: "GR Yaris", rating: "Good" as const, notes: "Agile, gentler on tires" },
      { model: "GR86", rating: "Good" as const, notes: "Best on worn tires" },
      { model: "GR Corolla", rating: "Good" as const, notes: "Strong but heavier" }
    ]
  }
];

export const grCarComparisonData: GRCarComparisonData = {
  cars: grCars,
  trackPerformance: trackPerformanceData,
  trackCarMatrix
};



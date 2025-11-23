// src/mocks/handlers.ts
// MSW handlers for offline/demo mode

import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

// Mock prediction data
const mockPredictions: Record<string, {
  chassis: string;
  track: string;
  predicted_loss_per_lap_s: number;
  laps_until_0_5s_loss: number;
  recommended_pit_lap: number;
  feature_scores: Array<{ name: string; score: number }>;
  explanation: string[];
  meta: {
    model_version: string;
    generated_at: string;
    demo: boolean;
  };
}> = {
  cota: {
    chassis: "GR86-DEMO-01",
    track: "cota",
    predicted_loss_per_lap_s: 0.34,
    laps_until_0_5s_loss: 1.47,
    recommended_pit_lap: 8,
    feature_scores: [
      { name: "tire_stress_S2", score: 0.42 },
      { name: "brake_energy_S1", score: 0.19 },
      { name: "avg_speed_S3", score: -0.05 },
      { name: "lateral_g_S2", score: 0.31 },
      { name: "surface_temp_delta", score: 0.15 },
    ],
    explanation: [
      "Elevated lateral load in S2 (+0.42)",
      "Repeated heavy braking in S1 (+0.19)",
      "Rising surface temperature +2.2°C last 3 laps",
      "High lateral G-forces in sector 2",
    ],
    meta: {
      model_version: "v1.2.3-demo",
      generated_at: new Date().toISOString(),
      demo: true,
    },
  },
  road_america: {
    chassis: "GR86-DEMO-01",
    track: "road_america",
    predicted_loss_per_lap_s: 0.28,
    laps_until_0_5s_loss: 1.79,
    recommended_pit_lap: 12,
    feature_scores: [
      { name: "tire_stress_S2", score: 0.35 },
      { name: "brake_energy_S1", score: 0.22 },
      { name: "avg_speed_S3", score: 0.08 },
    ],
    explanation: [
      "Moderate tire stress in sector 2",
      "Heavy braking zones in sector 1",
    ],
    meta: {
      model_version: "v1.2.3-demo",
      generated_at: new Date().toISOString(),
      demo: true,
    },
  },
  barber: {
    chassis: "GR86-DEMO-01",
    track: "barber",
    predicted_loss_per_lap_s: 0.31,
    laps_until_0_5s_loss: 1.61,
    recommended_pit_lap: 10,
    feature_scores: [
      { name: "tire_stress_S2", score: 0.38 },
      { name: "brake_energy_S1", score: 0.18 },
    ],
    explanation: [
      "High tire stress in sector 2",
      "Moderate brake energy in sector 1",
    ],
    meta: {
      model_version: "v1.2.3-demo",
      generated_at: new Date().toISOString(),
      demo: true,
    },
  },
};

// Generate mock prediction for any track
function getMockPrediction(track: string, chassis: string) {
  const base = mockPredictions[track] || mockPredictions.cota;
  return {
    ...base,
    track,
    chassis,
    predicted_loss_per_lap_s: base.predicted_loss_per_lap_s + (Math.random() * 0.1 - 0.05),
    laps_until_0_5s_loss: base.laps_until_0_5s_loss + (Math.random() * 0.3 - 0.15),
    meta: {
      ...base.meta,
      generated_at: new Date().toISOString(),
    },
  };
}

export const handlers = [
  // Health check
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({
      ok: true,
      model_versions: {
        cota: "v1.2.3-demo",
        road_america: "v1.2.3-demo",
        barber: "v1.2.3-demo",
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Models endpoint
  http.get(`${API_BASE}/models`, () => {
    return HttpResponse.json({
      cota: "v1.2.3-demo",
      road_america: "v1.2.3-demo",
      barber: "v1.2.3-demo",
      sebring: "v1.2.3-demo",
      sonoma: "v1.2.3-demo",
      indianapolis: "v1.2.3-demo",
      virginia: "v1.2.3-demo",
    });
  }),

  // Predict tire endpoint
  http.get(`${API_BASE}/predict_tire/:track/:chassis`, ({ params }) => {
    const { track, chassis } = params;
    
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const prediction = getMockPrediction(track as string, chassis as string);
        resolve(HttpResponse.json(prediction));
      }, 300 + Math.random() * 200);
    });
  }),

  // Simulate endpoint
  http.post(`${API_BASE}/simulate`, async ({ request }) => {
    const body = await request.json() as { track?: string; chassis?: string; strategy?: unknown };
    
    return HttpResponse.json({
      track: body.track,
      chassis: body.chassis,
      strategy: body.strategy,
      results: {
        projected_finish: "P3",
        total_time: "45:23.456",
        pit_stops: 2,
      },
      meta: {
        generated_at: new Date().toISOString(),
        demo: true,
      },
    });
  }),

  // ========================================
  // F1 Benchmarking API Mock Handlers
  // ========================================

  // Get current F1 season
  http.get(`${API_BASE}/f1/seasons/current`, () => {
    return HttpResponse.json({
      success: true,
      source: "Ergast F1 API (Mock)",
      data: [
        {
          season: "2024",
          round: "1",
          url: "http://en.wikipedia.org/wiki/2024_Bahrain_Grand_Prix",
          raceName: "Bahrain Grand Prix",
          Circuit: {
            circuitId: "bahrain",
            url: "http://en.wikipedia.org/wiki/Bahrain_International_Circuit",
            circuitName: "Bahrain International Circuit",
            Location: {
              lat: "26.0325",
              long: "50.5106",
              locality: "Sakhir",
              country: "Bahrain"
            }
          },
          date: "2024-03-02",
          time: "15:00:00Z"
        },
        {
          season: "2024",
          round: "2",
          url: "http://en.wikipedia.org/wiki/2024_Saudi_Arabian_Grand_Prix",
          raceName: "Saudi Arabian Grand Prix",
          Circuit: {
            circuitId: "jeddah",
            url: "http://en.wikipedia.org/wiki/Jeddah_Street_Circuit",
            circuitName: "Jeddah Corniche Circuit",
            Location: {
              lat: "21.6319",
              long: "39.1044",
              locality: "Jeddah",
              country: "Saudi Arabia"
            }
          },
          date: "2024-03-09",
          time: "20:00:00Z"
        },
        {
          season: "2024",
          round: "3",
          url: "http://en.wikipedia.org/wiki/2024_Australian_Grand_Prix",
          raceName: "Australian Grand Prix",
          Circuit: {
            circuitId: "albert_park",
            url: "http://en.wikipedia.org/wiki/Melbourne_Grand_Prix_Circuit",
            circuitName: "Albert Park Grand Prix Circuit",
            Location: {
              lat: "-37.8497",
              long: "144.968",
              locality: "Melbourne",
              country: "Australia"
            }
          },
          date: "2024-03-24",
          time: "05:00:00Z"
        }
      ],
      count: 3
    });
  }),

  // Get F1 season races
  http.get(`${API_BASE}/f1/seasons/:year`, ({ params }) => {
    const year = params.year as string;
    return HttpResponse.json({
      success: true,
      source: "Ergast F1 API (Mock)",
      year: parseInt(year),
      data: [
        {
          season: year,
          round: "1",
          url: `http://en.wikipedia.org/wiki/${year}_Bahrain_Grand_Prix`,
          raceName: "Bahrain Grand Prix",
          Circuit: {
            circuitId: "bahrain",
            circuitName: "Bahrain International Circuit",
            Location: {
              locality: "Sakhir",
              country: "Bahrain"
            }
          },
          date: `${year}-03-02`
        }
      ],
      count: 1
    });
  }),

  // Get F1 race results
  http.get(`${API_BASE}/f1/races/:year/:round`, ({ params }) => {
    const year = params.year as string;
    const round = params.round as string;
    
    return HttpResponse.json({
      success: true,
      source: "Ergast F1 API (Mock)",
      year: parseInt(year),
      round: parseInt(round),
      race: {
        MRData: {
          xmlns: "http://ergast.com/mrd/1.5",
          series: "f1",
          url: "http://ergast.com/api/f1/2024/1.json",
          limit: "30",
          offset: "0",
          total: "20",
          RaceTable: {
            season: year,
            round: round,
            Races: [
              {
                season: year,
                round: round,
                url: `http://en.wikipedia.org/wiki/${year}_Bahrain_Grand_Prix`,
                raceName: "Bahrain Grand Prix",
                Circuit: {
                  circuitId: "bahrain",
                  url: "http://en.wikipedia.org/wiki/Bahrain_International_Circuit",
                  circuitName: "Bahrain International Circuit",
                  Location: {
                    lat: "26.0325",
                    long: "50.5106",
                    locality: "Sakhir",
                    country: "Bahrain"
                  }
                },
                date: `${year}-03-02`,
                time: "15:00:00Z",
                Results: [
                  {
                    number: "1",
                    position: "1",
                    positionText: "1",
                    points: "25",
                    Driver: {
                      driverId: "max_verstappen",
                      permanentNumber: "33",
                      code: "VER",
                      url: "http://en.wikipedia.org/wiki/Max_Verstappen",
                      givenName: "Max",
                      familyName: "Verstappen",
                      dateOfBirth: "1997-09-30",
                      nationality: "Dutch"
                    },
                    Constructor: {
                      constructorId: "red_bull",
                      url: "http://en.wikipedia.org/wiki/Red_Bull_Racing",
                      name: "Red Bull",
                      nationality: "Austrian"
                    },
                    grid: "1",
                    laps: "57",
                    status: "Finished",
                    Time: {
                      millis: "5595367",
                      time: "1:33:15.367"
                    },
                    FastestLap: {
                      rank: "1",
                      lap: "39",
                      Time: {
                        time: "1:32.608"
                      },
                      AverageSpeed: {
                        units: "kph",
                        speed: "206.018"
                      }
                    }
                  },
                  {
                    number: "11",
                    position: "2",
                    positionText: "2",
                    points: "18",
                    Driver: {
                      driverId: "perez",
                      permanentNumber: "11",
                      code: "PER",
                      url: "http://en.wikipedia.org/wiki/Sergio_Pérez",
                      givenName: "Sergio",
                      familyName: "Pérez",
                      dateOfBirth: "1990-01-26",
                      nationality: "Mexican"
                    },
                    Constructor: {
                      constructorId: "red_bull",
                      url: "http://en.wikipedia.org/wiki/Red_Bull_Racing",
                      name: "Red Bull",
                      nationality: "Austrian"
                    },
                    grid: "2",
                    laps: "57",
                    status: "Finished",
                    Time: {
                      millis: "5616952",
                      time: "+21.585"
                    }
                  }
                ]
              }
            ]
          }
        }
      }
    });
  }),

  // Get F1 strategy comparison
  http.get(`${API_BASE}/f1/strategies/comparison`, ({ request }) => {
    const url = new URL(request.url);
    const comparisonType = url.searchParams.get('comparison_type') || 'pit_stops';
    const year = url.searchParams.get('year') || '2024';
    const round = url.searchParams.get('round') || '1';
    
    const mockPitStops = [
      {
        driverId: "max_verstappen",
        lap: "15",
        stop: "1",
        time: "15:23:45",
        duration: "21.234"
      },
      {
        driverId: "max_verstappen",
        lap: "35",
        stop: "2",
        time: "16:05:12",
        duration: "22.156"
      },
      {
        driverId: "perez",
        lap: "16",
        stop: "1",
        time: "15:25:10",
        duration: "23.445"
      }
    ];
    
    const mockLapTimes = Array.from({ length: 10 }, (_, i) => ({
      number: String(i + 1),
      Timings: [
        { driverId: "max_verstappen", position: "1", time: `1:${32 + i * 0.1}.${500 + i * 10}` },
        { driverId: "perez", position: "2", time: `1:${32 + i * 0.1 + 0.3}.${500 + i * 10}` }
      ]
    }));
    
    const response: any = {
      success: true,
      comparison_type: comparisonType,
      source: "Ergast F1 API (Mock)",
      race: {
        season: year,
        round: round,
        raceName: "Bahrain Grand Prix"
      },
      use_case: comparisonType === 'pit_stops' ? 'strategy_benchmarking' : 
                 comparisonType === 'lap_times' ? 'tire_degradation_analysis' :
                 'tire_degradation_pattern_analysis'
    };
    
    if (comparisonType === 'pit_stops' || comparisonType === 'tire_deg') {
      response.pit_stops = mockPitStops;
    }
    
    if (comparisonType === 'lap_times' || comparisonType === 'tire_deg') {
      response.lap_times = mockLapTimes;
    }
    
    return HttpResponse.json(response);
  }),

  // Get F1 driver standings
  http.get(`${API_BASE}/f1/standings/drivers`, ({ request }) => {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    
    return HttpResponse.json({
      success: true,
      source: "Ergast F1 API (Mock)",
      year: year || "current",
      data: [
        {
          position: "1",
          positionText: "1",
          points: "575",
          wins: "19",
          Driver: {
            driverId: "max_verstappen",
            permanentNumber: "33",
            code: "VER",
            url: "http://en.wikipedia.org/wiki/Max_Verstappen",
            givenName: "Max",
            familyName: "Verstappen",
            dateOfBirth: "1997-09-30",
            nationality: "Dutch"
          },
          Constructors: [
            {
              constructorId: "red_bull",
              url: "http://en.wikipedia.org/wiki/Red_Bull_Racing",
              name: "Red Bull Racing",
              nationality: "Austrian"
            }
          ]
        },
        {
          position: "2",
          positionText: "2",
          points: "285",
          wins: "2",
          Driver: {
            driverId: "perez",
            permanentNumber: "11",
            code: "PER",
            url: "http://en.wikipedia.org/wiki/Sergio_Pérez",
            givenName: "Sergio",
            familyName: "Pérez",
            dateOfBirth: "1990-01-26",
            nationality: "Mexican"
          },
          Constructors: [
            {
              constructorId: "red_bull",
              url: "http://en.wikipedia.org/wiki/Red_Bull_Racing",
              name: "Red Bull Racing",
              nationality: "Austrian"
            }
          ]
        }
      ],
      count: 2
    });
  }),

  // Get F1 circuits
  http.get(`${API_BASE}/f1/circuits`, () => {
    return HttpResponse.json({
      success: true,
      source: "Ergast F1 API (Mock)",
      data: [
        {
          circuitId: "bahrain",
          url: "http://en.wikipedia.org/wiki/Bahrain_International_Circuit",
          circuitName: "Bahrain International Circuit",
          Location: {
            lat: "26.0325",
            long: "50.5106",
            locality: "Sakhir",
            country: "Bahrain"
          }
        },
        {
          circuitId: "circuit_of_the_americas",
          url: "http://en.wikipedia.org/wiki/Circuit_of_the_Americas",
          circuitName: "Circuit of the Americas",
          Location: {
            lat: "30.1327",
            long: "-97.6357",
            locality: "Austin",
            country: "USA"
          }
        },
        {
          circuitId: "silverstone",
          url: "http://en.wikipedia.org/wiki/Silverstone_Circuit",
          circuitName: "Silverstone Circuit",
          Location: {
            lat: "52.0786",
            long: "-1.01694",
            locality: "Silverstone",
            country: "UK"
          }
        }
      ],
      count: 3
    });
  }),

  // Get F1 circuit info
  http.get(`${API_BASE}/f1/circuits/:circuitId`, ({ params }) => {
    const circuitId = params.circuitId as string;
    
    const circuits: Record<string, any> = {
      bahrain: {
        circuitId: "bahrain",
        url: "http://en.wikipedia.org/wiki/Bahrain_International_Circuit",
        circuitName: "Bahrain International Circuit",
        Location: {
          lat: "26.0325",
          long: "50.5106",
          locality: "Sakhir",
          country: "Bahrain"
        }
      },
      circuit_of_the_americas: {
        circuitId: "circuit_of_the_americas",
        url: "http://en.wikipedia.org/wiki/Circuit_of_the_Americas",
        circuitName: "Circuit of the Americas",
        Location: {
          lat: "30.1327",
          long: "-97.6357",
          locality: "Austin",
          country: "USA"
        }
      }
    };
    
    const circuit = circuits[circuitId] || circuits.bahrain;
    
    return HttpResponse.json({
      success: true,
      source: "Ergast F1 API (Mock)",
      circuit_id: circuitId,
      data: circuit
    });
  }),

  // OpenF1 endpoints - Get sessions
  http.get(`${API_BASE}/f1/telemetry/sessions`, ({ request }) => {
    const url = new URL(request.url);
    const dateFilter = url.searchParams.get('date_filter');
    const location = url.searchParams.get('location');
    
    return HttpResponse.json({
      success: true,
      source: "OpenF1 API (Mock)",
      data: [
        {
          session_key: 12345,
          meeting_key: 1234,
          location: location || "Bahrain",
          country_name: "Bahrain",
          circuit_key: 1,
          circuit_short_name: "BAH",
          date_start: dateFilter || "2024-03-02T12:00:00",
          date_end: "2024-03-02T14:00:00",
          session_name: "Race",
          session_type: "Race"
        }
      ],
      count: 1
    });
  }),

  // OpenF1 endpoints - Get lap times
  http.get(`${API_BASE}/f1/telemetry/laps/:sessionKey`, ({ params, request }) => {
    const sessionKey = params.sessionKey as string;
    const url = new URL(request.url);
    const driverNumber = url.searchParams.get('driver_number');
    
    return HttpResponse.json({
      success: true,
      source: "OpenF1 API (Mock)",
      session_key: parseInt(sessionKey),
      data: Array.from({ length: 5 }, (_, i) => ({
        meeting_key: 1234,
        session_key: parseInt(sessionKey),
        driver_number: driverNumber ? parseInt(driverNumber) : 33,
        i1_speed: 280 + i * 2,
        i2_speed: 295 + i * 2,
        st_speed: 310 + i * 2,
        date_start: `2024-03-02T12:${String(10 + i).padStart(2, '0')}:00`,
        lap_duration: 92.5 + i * 0.1,
        is_pit_out_lap: i === 0,
        segment_sector_1: 25.5 + i * 0.05,
        segment_sector_2: 32.1 + i * 0.05,
        segment_sector_3: 34.9 + i * 0.05
      })),
      count: 5
    });
  }),

  // OpenF1 endpoints - Get car telemetry
  http.get(`${API_BASE}/f1/telemetry/car_data/:sessionKey`, ({ params, request }) => {
    const sessionKey = params.sessionKey as string;
    const url = new URL(request.url);
    const driverNumber = url.searchParams.get('driver_number');
    
    return HttpResponse.json({
      success: true,
      source: "OpenF1 API (Mock)",
      session_key: parseInt(sessionKey),
      driver_number: driverNumber ? parseInt(driverNumber) : undefined,
      data: Array.from({ length: 10 }, (_, i) => ({
        meeting_key: 1234,
        session_key: parseInt(sessionKey),
        driver_number: driverNumber ? parseInt(driverNumber) : 33,
        date: `2024-03-02T12:${String(10 + i).padStart(2, '0')}:${String(i * 5).padStart(2, '0')}`,
        rpm: 11000 + i * 100,
        speed: 280 + i * 5,
        n_gear: 7,
        throttle: 85 + i * 2,
        drs: i % 2 === 0 ? 1 : 0,
        brake: i % 3 === 0 ? 1 : 0
      })),
      count: 10
    });
  }),

  // OpenF1 endpoints - Get stints
  http.get(`${API_BASE}/f1/telemetry/stints/:sessionKey`, ({ params, request }) => {
    const sessionKey = params.sessionKey as string;
    const url = new URL(request.url);
    const driverNumber = url.searchParams.get('driver_number');
    
    return HttpResponse.json({
      success: true,
      source: "OpenF1 API (Mock)",
      session_key: parseInt(sessionKey),
      data: [
        {
          meeting_key: 1234,
          session_key: parseInt(sessionKey),
          driver_number: driverNumber ? parseInt(driverNumber) : 33,
          stint_number: 1,
          lap_start: 1,
          lap_end: 15,
          compound: "SOFT",
          tyre_age_at_start: 0
        },
        {
          meeting_key: 1234,
          session_key: parseInt(sessionKey),
          driver_number: driverNumber ? parseInt(driverNumber) : 33,
          stint_number: 2,
          lap_start: 16,
          lap_end: 40,
          compound: "MEDIUM",
          tyre_age_at_start: 0
        }
      ],
      count: 2
    });
  }),
];


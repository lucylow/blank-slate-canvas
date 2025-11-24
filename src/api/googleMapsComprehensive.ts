// Comprehensive Google Maps Platform API Integration
// Includes all Google Maps APIs with detailed mock data fallbacks

const GOOGLE_MAPS_API_KEY = 
  import.meta.env.GOOGLE_MAPS_API_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  '';

// Base URLs for various Google Maps APIs
const BASE_URLS = {
  airQuality: 'https://airquality.googleapis.com/v1',
  solar: 'https://solar.googleapis.com/v1',
  weather: 'https://weather.googleapis.com/v1',
  pollen: 'https://pollen.googleapis.com/v1',
  geocoding: 'https://maps.googleapis.com/maps/api/geocode/json',
  places: 'https://places.googleapis.com/v1',
  placesNew: 'https://places.googleapis.com/v1',
  directions: 'https://routes.googleapis.com/directions/v2:computeRoutes',
  distanceMatrix: 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix',
  routes: 'https://routes.googleapis.com/v1',
  roads: 'https://roads.googleapis.com/v1',
  elevation: 'https://maps.googleapis.com/maps/api/elevation/json',
  timezone: 'https://maps.googleapis.com/maps/api/timezone/json',
  addressValidation: 'https://addressvalidation.googleapis.com/v1',
  mapsStatic: 'https://maps.googleapis.com/maps/api/staticmap',
  streetViewStatic: 'https://maps.googleapis.com/maps/api/streetview',
  aerialView: 'https://aerialview.googleapis.com/v1',
  mapTiles: 'https://tile.googleapis.com/v1',
};

// Track coordinates
const TRACK_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  barber: { lat: 33.4822, lng: -86.5103, name: 'Barber Motorsports Park' },
  cota: { lat: 30.1327, lng: -97.6351, name: 'Circuit of the Americas' },
  indianapolis: { lat: 39.7953, lng: -86.2347, name: 'Indianapolis Motor Speedway' },
  road_america: { lat: 43.8031, lng: -87.9908, name: 'Road America' },
  sebring: { lat: 27.4547, lng: -81.3544, name: 'Sebring International Raceway' },
  sonoma: { lat: 38.1616, lng: -122.4547, name: 'Sonoma Raceway' },
  vir: { lat: 36.6369, lng: -79.1739, name: 'Virginia International Raceway' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function isGoogleMapsAvailable(): boolean {
  return !!GOOGLE_MAPS_API_KEY;
}

function getApiKey(): string {
  return GOOGLE_MAPS_API_KEY;
}

async function fetchWithFallback<T>(
  url: string,
  options: RequestInit = {},
  mockData: () => T
): Promise<T> {
  if (!isGoogleMapsAvailable()) {
    console.warn('Google Maps API not configured, using mock data');
    return mockData();
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Google Maps API request failed, using mock data:', error);
    return mockData();
  }
}

// ============================================================================
// AIR QUALITY API
// ============================================================================

export interface AirQualityData {
  dateTime: string;
  regionCode: string;
  indexes: Array<{
    code: string;
    displayName: string;
    aqi: number;
    aqiDisplay: string;
    color: {
      red: number;
      green: number;
      blue: number;
    };
    category: string;
    dominantPollutant: string;
  }>;
  pollutants: Array<{
    code: string;
    displayName: string;
    fullName: string;
    concentration: {
      value: number;
      units: string;
    };
    additionalInfo: {
      sources: string;
      effects: string;
    };
  }>;
}

function generateMockAirQuality(location: { lat: number; lng: number }): AirQualityData {
  const aqi = Math.floor(Math.random() * 150) + 20; // 20-170 AQI
  let category = 'Good';
  let color = { red: 0, green: 228, blue: 0 };
  
  if (aqi > 100) {
    category = 'Unhealthy for Sensitive Groups';
    color = { red: 255, green: 126, blue: 0 };
  } else if (aqi > 50) {
    category = 'Moderate';
    color = { red: 255, green: 255, blue: 0 };
  }

  return {
    dateTime: new Date().toISOString(),
    regionCode: 'US',
    indexes: [
      {
        code: 'uaqi',
        displayName: 'Universal AQI',
        aqi,
        aqiDisplay: aqi.toString(),
        color,
        category,
        dominantPollutant: 'PM2.5',
      },
    ],
    pollutants: [
      {
        code: 'PM2.5',
        displayName: 'PM2.5',
        fullName: 'Particulate Matter 2.5',
        concentration: {
          value: Math.random() * 50 + 10,
          units: 'µg/m³',
        },
        additionalInfo: {
          sources: 'Vehicle emissions, industrial processes',
          effects: 'Respiratory issues, cardiovascular problems',
        },
      },
      {
        code: 'PM10',
        displayName: 'PM10',
        fullName: 'Particulate Matter 10',
        concentration: {
          value: Math.random() * 80 + 20,
          units: 'µg/m³',
        },
        additionalInfo: {
          sources: 'Dust, pollen, mold',
          effects: 'Eye and throat irritation',
        },
      },
      {
        code: 'O3',
        displayName: 'Ozone',
        fullName: 'Ozone',
        concentration: {
          value: Math.random() * 100 + 30,
          units: 'ppb',
        },
        additionalInfo: {
          sources: 'Chemical reactions in atmosphere',
          effects: 'Lung damage, asthma attacks',
        },
      },
    ],
  };
}

export async function getAirQuality(
  location: { lat: number; lng: number }
): Promise<AirQualityData> {
  return fetchWithFallback(
    `${BASE_URLS.airQuality}/currentConditions:lookup?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        location: {
          latitude: location.lat,
          longitude: location.lng,
        },
      }),
    },
    () => generateMockAirQuality(location)
  );
}

// ============================================================================
// SOLAR API
// ============================================================================

export interface SolarData {
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  imageryProcessedDate: {
    year: number;
    month: number;
    day: number;
  };
  quality: string;
  buildingInsights: {
    maxAreaPanelsCount: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears: number;
    maxArrayPanelsCount: number;
    maxAreaArrayPanelsCount: number;
    financialAnalyses: Array<{
      monthlyBill: {
        currencyCode: string;
        units: string;
        nanos: number;
      };
      panelConfigId: string;
      dateRequested: {
        year: number;
        month: number;
        day: number;
      };
      financialDetails: {
        initialAcKwhPerYear: number;
        initialAcKwhPerYearLifetime: number;
        remainingLifetimeUtilityBill: {
          currencyCode: string;
          units: string;
          nanos: number;
        };
        federalIncentive: {
          currencyCode: string;
          units: string;
          nanos: number;
        };
        stateIncentive: {
          currencyCode: string;
          units: string;
          nanos: number;
        };
        utilityIncentive: {
          currencyCode: string;
          units: string;
          nanos: number;
        };
        lifetimeSavings: {
          currencyCode: string;
          units: string;
          nanos: number;
        };
        paybackYears: number;
      };
    }>;
  };
  solarPotential: {
    maxArrayPanelsCount: number;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
  };
}

function generateMockSolarData(location: { lat: number; lng: number }): SolarData {
  const sunshineHours = Math.floor(Math.random() * 1000) + 2000; // 2000-3000 hours
  const panelCount = Math.floor(Math.random() * 50) + 20; // 20-70 panels
  
  return {
    imageryDate: {
      year: 2024,
      month: 6,
      day: 15,
    },
    imageryProcessedDate: {
      year: 2024,
      month: 6,
      day: 20,
    },
    quality: 'HIGH',
    buildingInsights: {
      maxAreaPanelsCount: panelCount,
      maxSunshineHoursPerYear: sunshineHours,
      carbonOffsetFactorKgPerMwh: 0.5,
      panelHeightMeters: 1.7,
      panelWidthMeters: 1.0,
      panelLifetimeYears: 25,
      maxArrayPanelsCount: panelCount,
      maxAreaArrayPanelsCount: panelCount,
      financialAnalyses: [
        {
          monthlyBill: {
            currencyCode: 'USD',
            units: '150',
            nanos: 0,
          },
          panelConfigId: 'standard',
          dateRequested: {
            year: 2024,
            month: 6,
            day: 20,
          },
          financialDetails: {
            initialAcKwhPerYear: sunshineHours * panelCount * 0.3,
            initialAcKwhPerYearLifetime: sunshineHours * panelCount * 0.3 * 25,
            remainingLifetimeUtilityBill: {
              currencyCode: 'USD',
              units: String(Math.floor(150 * 12 * 25 * 0.3)),
              nanos: 0,
            },
            federalIncentive: {
              currencyCode: 'USD',
              units: String(Math.floor(panelCount * 400 * 0.3)),
              nanos: 0,
            },
            stateIncentive: {
              currencyCode: 'USD',
              units: String(Math.floor(panelCount * 200 * 0.2)),
              nanos: 0,
            },
            utilityIncentive: {
              currencyCode: 'USD',
              units: String(Math.floor(panelCount * 100 * 0.1)),
              nanos: 0,
            },
            lifetimeSavings: {
              currencyCode: 'USD',
              units: String(Math.floor(150 * 12 * 25 * 0.7)),
              nanos: 0,
            },
            paybackYears: Math.floor(Math.random() * 5) + 7, // 7-12 years
          },
        },
      ],
    },
    solarPotential: {
      maxArrayPanelsCount: panelCount,
      panelCapacityWatts: 400,
      panelHeightMeters: 1.7,
      panelWidthMeters: 1.0,
      panelLifetimeYears: 25,
      maxSunshineHoursPerYear: sunshineHours,
      carbonOffsetFactorKgPerMwh: 0.5,
    },
  };
}

export async function getSolarData(
  location: { lat: number; lng: number }
): Promise<SolarData> {
  return fetchWithFallback(
    `${BASE_URLS.solar}/buildingInsights:findClosest?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        location: {
          latitude: location.lat,
          longitude: location.lng,
        },
      }),
    },
    () => generateMockSolarData(location)
  );
}

// ============================================================================
// WEATHER API
// ============================================================================

export interface WeatherData {
  location: {
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  currentConditions: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    uvIndex: number;
    visibility: number;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitationChance: number;
  }>;
}

function generateMockWeatherData(location: { lat: number; lng: number }): WeatherData {
  const temp = Math.floor(Math.random() * 30) + 60; // 60-90°F
  
  return {
    location: {
      name: 'Track Location',
      coordinates: { latitude: location.lat, longitude: location.lng },
    },
    currentConditions: {
      temperature: temp,
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Clear'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 mph
      windDirection: Math.floor(Math.random() * 360),
      pressure: Math.floor(Math.random() * 5) + 29.5, // 29.5-34.5 inHg
      uvIndex: Math.floor(Math.random() * 8) + 2, // 2-10
      visibility: Math.floor(Math.random() * 5) + 5, // 5-10 miles
    },
    forecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      high: temp + Math.floor(Math.random() * 10) - 5,
      low: temp - Math.floor(Math.random() * 15) - 10,
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Clear'][Math.floor(Math.random() * 4)],
      precipitationChance: Math.floor(Math.random() * 50),
    })),
  };
}

export async function getWeatherData(
  location: { lat: number; lng: number }
): Promise<WeatherData> {
  return fetchWithFallback(
    `${BASE_URLS.weather}/currentConditions:lookup?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        location: {
          latitude: location.lat,
          longitude: location.lng,
        },
      }),
    },
    () => generateMockWeatherData(location)
  );
}

// ============================================================================
// POLLEN API
// ============================================================================

export interface PollenData {
  dateTime: string;
  regionCode: string;
  dailyInfo: Array<{
    date: {
      year: number;
      month: number;
      day: number;
    };
    pollenTypeInfo: Array<{
      type: string;
      displayName: string;
      indexInfo: {
        code: string;
        displayName: string;
        value: number;
        category: string;
        color: {
          red: number;
          green: number;
          blue: number;
        };
      };
      plantInfo: Array<{
        plantName: string;
        inSeason: boolean;
        potency: number;
      }>;
    }>;
  }>;
}

function generateMockPollenData(location: { lat: number; lng: number }): PollenData {
  const pollenTypes = ['Tree', 'Grass', 'Weed'];
  const value = Math.floor(Math.random() * 8) + 1; // 1-9
  let category = 'Low';
  let color = { red: 0, green: 255, blue: 0 };
  
  if (value > 6) {
    category = 'High';
    color = { red: 255, green: 0, blue: 0 };
  } else if (value > 3) {
    category = 'Moderate';
    color = { red: 255, green: 255, blue: 0 };
  }

  return {
    dateTime: new Date().toISOString(),
    regionCode: 'US',
    dailyInfo: [
      {
        date: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
        },
        pollenTypeInfo: pollenTypes.map((type) => ({
          type: type.toLowerCase(),
          displayName: type,
          indexInfo: {
            code: 'pollen_index',
            displayName: `${type} Pollen Index`,
            value,
            category,
            color,
          },
          plantInfo: [
            {
              plantName: `${type} Species 1`,
              inSeason: true,
              potency: Math.floor(Math.random() * 5) + 1,
            },
            {
              plantName: `${type} Species 2`,
              inSeason: Math.random() > 0.5,
              potency: Math.floor(Math.random() * 5) + 1,
            },
          ],
        })),
      },
    ],
  };
}

export async function getPollenData(
  location: { lat: number; lng: number }
): Promise<PollenData> {
  return fetchWithFallback(
    `${BASE_URLS.pollen}/forecast:lookup?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        location: {
          latitude: location.lat,
          longitude: location.lng,
        },
      }),
    },
    () => generateMockPollenData(location)
  );
}

// ============================================================================
// PLACES API
// ============================================================================

export interface Place {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  userRatingCount: number;
  types: string[];
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
}

export interface PlacesSearchResult {
  places: Place[];
  nextPageToken?: string;
}

function generateMockPlaces(location: { lat: number; lng: number }): PlacesSearchResult {
  const placeNames = [
    'Race Track Main Entrance',
    'Pit Lane Restaurant',
    'Track Viewing Area',
    'Racing Museum',
    'Gift Shop',
    'Parking Area A',
    'VIP Lounge',
    'Media Center',
  ];

  return {
    places: placeNames.map((name, i) => ({
      id: `place_${i}`,
      displayName: {
        text: name,
        languageCode: 'en',
      },
      formattedAddress: `${name}, Track Location`,
      location: {
        latitude: location.lat + (Math.random() - 0.5) * 0.01,
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
      },
      rating: Math.random() * 2 + 3, // 3-5 stars
      userRatingCount: Math.floor(Math.random() * 500) + 10,
      types: ['establishment', 'point_of_interest'],
      photos: [
        {
          name: `photo_${i}`,
          widthPx: 1920,
          heightPx: 1080,
        },
      ],
    })),
  };
}

export async function searchPlaces(
  location: { lat: number; lng: number },
  query?: string
): Promise<PlacesSearchResult> {
  return fetchWithFallback(
    `${BASE_URLS.places}/places:searchText?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        textQuery: query || 'race track',
        locationBias: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng,
            },
            radius: 5000, // 5km
          },
        },
      }),
    },
    () => generateMockPlaces(location)
  );
}

export async function getPlaceDetails(placeId: string): Promise<Place | null> {
  return fetchWithFallback(
    `${BASE_URLS.places}/places/${placeId}?key=${getApiKey()}`,
    {
      method: 'GET',
    },
    () => ({
      id: placeId,
      displayName: {
        text: 'Mock Place',
        languageCode: 'en',
      },
      formattedAddress: 'Mock Address',
      location: {
        latitude: 0,
        longitude: 0,
      },
      rating: 4.0,
      userRatingCount: 100,
      types: ['establishment'],
    })
  );
}

// ============================================================================
// DIRECTIONS API
// ============================================================================

export interface DirectionsResult {
  routes: Array<{
    distanceMeters: number;
    duration: string;
    polyline: {
      encodedPolyline: string;
    };
    legs: Array<{
      distanceMeters: number;
      duration: string;
      startLocation: {
        latitude: number;
        longitude: number;
      };
      endLocation: {
        latitude: number;
        longitude: number;
      };
      steps: Array<{
        distanceMeters: number;
        duration: string;
        instructions: string;
        polyline: {
          encodedPolyline: string;
        };
      }>;
    }>;
  }>;
}

function generateMockDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): DirectionsResult {
  const distance = Math.sqrt(
    Math.pow(origin.lat - destination.lat, 2) + Math.pow(origin.lng - destination.lng, 2)
  ) * 111000; // rough conversion to meters
  
  const durationSeconds = Math.floor(distance / 20); // assuming 20 m/s average speed
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  return {
    routes: [
      {
        distanceMeters: Math.floor(distance),
        duration: `${hours}h ${minutes}m ${seconds}s`,
        polyline: {
          encodedPolyline: 'mock_encoded_polyline',
        },
        legs: [
          {
            distanceMeters: Math.floor(distance),
            duration: `${hours}h ${minutes}m ${seconds}s`,
            startLocation: { latitude: origin.lat, longitude: origin.lng },
            endLocation: { latitude: destination.lat, longitude: destination.lng },
            steps: [
              {
                distanceMeters: Math.floor(distance / 2),
                duration: `${Math.floor(hours / 2)}h ${Math.floor(minutes / 2)}m`,
                instructions: 'Head toward destination',
                polyline: {
                  encodedPolyline: 'mock_step_polyline',
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DirectionsResult> {
  return fetchWithFallback(
    `${BASE_URLS.directions}?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      }),
    },
    () => generateMockDirections(origin, destination)
  );
}

// ============================================================================
// DISTANCE MATRIX API
// ============================================================================

export interface DistanceMatrixResult {
  origins: Array<{
    location: {
      latitude: number;
      longitude: number;
    };
  }>;
  destinations: Array<{
    location: {
      latitude: number;
      longitude: number;
    };
  }>;
  rows: Array<{
    elements: Array<{
      distanceMeters: number;
      duration: string;
      status: string;
    }>;
  }>;
}

function generateMockDistanceMatrix(
  origins: Array<{ lat: number; lng: number }>,
  destinations: Array<{ lat: number; lng: number }>
): DistanceMatrixResult {
  return {
    origins: origins.map((o) => ({ location: { latitude: o.lat, longitude: o.lng } })),
    destinations: destinations.map((d) => ({ location: { latitude: d.lat, longitude: d.lng } })),
    rows: origins.map((origin) => ({
      elements: destinations.map((dest) => {
        const distance = Math.sqrt(
          Math.pow(origin.lat - dest.lat, 2) + Math.pow(origin.lng - dest.lng, 2)
        ) * 111000;
        const durationSeconds = Math.floor(distance / 20);
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const seconds = durationSeconds % 60;

        return {
          distanceMeters: Math.floor(distance),
          duration: `${hours}h ${minutes}m ${seconds}s`,
          status: 'OK',
        };
      }),
    })),
  };
}

export async function getDistanceMatrix(
  origins: Array<{ lat: number; lng: number }>,
  destinations: Array<{ lat: number; lng: number }>
): Promise<DistanceMatrixResult> {
  return fetchWithFallback(
    `${BASE_URLS.distanceMatrix}?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        origins: origins.map((o) => ({
          location: {
            latLng: {
              latitude: o.lat,
              longitude: o.lng,
            },
          },
        })),
        destinations: destinations.map((d) => ({
          location: {
            latLng: {
              latitude: d.lat,
              longitude: d.lng,
            },
          },
        })),
      }),
    },
    () => generateMockDistanceMatrix(origins, destinations)
  );
}

// ============================================================================
// ROADS API (Snap to Road)
// ============================================================================

export interface SnappedPoints {
  snappedPoints: Array<{
    location: {
      latitude: number;
      longitude: number;
    };
    originalIndex: number;
    placeId: string;
  }>;
}

function generateMockSnappedPoints(
  path: Array<{ lat: number; lng: number }>
): SnappedPoints {
  return {
    snappedPoints: path.map((point, index) => ({
      location: {
        latitude: point.lat + (Math.random() - 0.5) * 0.0001,
        longitude: point.lng + (Math.random() - 0.5) * 0.0001,
      },
      originalIndex: index,
      placeId: `snapped_${index}`,
    })),
  };
}

export async function snapToRoad(
  path: Array<{ lat: number; lng: number }>
): Promise<SnappedPoints> {
  const pathString = path.map((p) => `${p.lat},${p.lng}`).join('|');
  
  return fetchWithFallback(
    `${BASE_URLS.roads}/snapToRoads?path=${pathString}&key=${getApiKey()}`,
    {
      method: 'GET',
    },
    () => generateMockSnappedPoints(path)
  );
}

// ============================================================================
// ELEVATION API
// ============================================================================

export interface ElevationResult {
  results: Array<{
    elevation: number;
    location: {
      lat: number;
      lng: number;
    };
    resolution: number;
  }>;
  status: string;
}

function generateMockElevation(
  locations: Array<{ lat: number; lng: number }>
): ElevationResult {
  return {
    results: locations.map((loc) => ({
      elevation: Math.floor(Math.random() * 500) + 100, // 100-600 meters
      location: loc,
      resolution: 4.77,
    })),
    status: 'OK',
  };
}

export async function getElevation(
  locations: Array<{ lat: number; lng: number }>
): Promise<ElevationResult> {
  const locationsString = locations.map((l) => `${l.lat},${l.lng}`).join('|');
  
  return fetchWithFallback(
    `${BASE_URLS.elevation}?locations=${locationsString}&key=${getApiKey()}`,
    {
      method: 'GET',
    },
    () => generateMockElevation(locations)
  );
}

// ============================================================================
// TIME ZONE API
// ============================================================================

export interface TimeZoneResult {
  dstOffset: number;
  rawOffset: number;
  status: string;
  timeZoneId: string;
  timeZoneName: string;
}

function generateMockTimeZone(location: { lat: number; lng: number }): TimeZoneResult {
  // Rough timezone estimation based on longitude
  const timezones = [
    { id: 'America/New_York', name: 'Eastern Standard Time', offset: -5 },
    { id: 'America/Chicago', name: 'Central Standard Time', offset: -6 },
    { id: 'America/Denver', name: 'Mountain Standard Time', offset: -7 },
    { id: 'America/Los_Angeles', name: 'Pacific Standard Time', offset: -8 },
  ];
  
  const tz = timezones[Math.floor(Math.random() * timezones.length)];
  
  return {
    dstOffset: 3600, // 1 hour DST
    rawOffset: tz.offset * 3600,
    status: 'OK',
    timeZoneId: tz.id,
    timeZoneName: tz.name,
  };
}

export async function getTimeZone(
  location: { lat: number; lng: number },
  timestamp?: number
): Promise<TimeZoneResult> {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const locationString = `${location.lat},${location.lng}`;
  
  return fetchWithFallback(
    `${BASE_URLS.timezone}?location=${locationString}&timestamp=${ts}&key=${getApiKey()}`,
    {
      method: 'GET',
    },
    () => generateMockTimeZone(location)
  );
}

// ============================================================================
// ADDRESS VALIDATION API
// ============================================================================

export interface AddressValidationResult {
  result: {
    verdict: {
      inputGranularity: string;
      validationGranularity: string;
      geocodeGranularity: string;
      addressComplete: boolean;
      hasUnconfirmedComponents: boolean;
      hasInferredComponents: boolean;
    };
    address: {
      formattedAddress: string;
      postalAddress: {
        revision: number;
        regionCode: string;
        languageCode: string;
        postalCode: string;
        administrativeArea: string;
        locality: string;
        addressLines: string[];
      };
      addressComponents: Array<{
        componentName: {
          text: string;
          languageCode: string;
        };
        componentType: string;
        confirmationLevel: string;
      }>;
    };
    geocode: {
      location: {
        latitude: number;
        longitude: number;
      };
      plusCode: {
        globalCode: string;
        compoundCode: string;
      };
      bounds: {
        low: {
          latitude: number;
          longitude: number;
        };
        high: {
          latitude: number;
          longitude: number;
        };
      };
      featureSizeMeters: number;
      placeId: string;
      placeTypes: string[];
    };
  };
}

function generateMockAddressValidation(address: string): AddressValidationResult {
  return {
    result: {
      verdict: {
        inputGranularity: 'PREMISE',
        validationGranularity: 'PREMISE',
        geocodeGranularity: 'PREMISE',
        addressComplete: true,
        hasUnconfirmedComponents: false,
        hasInferredComponents: false,
      },
      address: {
        formattedAddress: address,
        postalAddress: {
          revision: 0,
          regionCode: 'US',
          languageCode: 'en',
          postalCode: '12345',
          administrativeArea: 'State',
          locality: 'City',
          addressLines: [address],
        },
        addressComponents: [
          {
            componentName: {
              text: '123',
              languageCode: 'en',
            },
            componentType: 'street_number',
            confirmationLevel: 'CONFIRMED',
          },
          {
            componentName: {
              text: 'Main St',
              languageCode: 'en',
            },
            componentType: 'route',
            confirmationLevel: 'CONFIRMED',
          },
        ],
      },
      geocode: {
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        plusCode: {
          globalCode: '87G8Q2JX+XX',
          compoundCode: 'Q2JX+XX New York, NY, USA',
        },
        bounds: {
          low: {
            latitude: 40.7120,
            longitude: -74.0070,
          },
          high: {
            latitude: 40.7136,
            longitude: -74.0050,
          },
        },
        featureSizeMeters: 50,
        placeId: 'mock_place_id',
        placeTypes: ['street_address'],
      },
    },
  };
}

export async function validateAddress(address: string): Promise<AddressValidationResult> {
  return fetchWithFallback(
    `${BASE_URLS.addressValidation}/addresses:validate?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        address: {
          addressLines: [address],
          regionCode: 'US',
        },
      }),
    },
    () => generateMockAddressValidation(address)
  );
}

// ============================================================================
// MAPS STATIC API
// ============================================================================

export function getStaticMapUrl(
  location: { lat: number; lng: number },
  options: {
    zoom?: number;
    size?: string;
    maptype?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
    markers?: Array<{ lat: number; lng: number; label?: string }>;
  } = {}
): string | null {
  if (!isGoogleMapsAvailable()) {
    return null;
  }

  const {
    zoom = 15,
    size = '600x400',
    maptype = 'roadmap',
    markers = [],
  } = options;

  const params = new URLSearchParams({
    center: `${location.lat},${location.lng}`,
    zoom: zoom.toString(),
    size,
    maptype,
    key: getApiKey(),
  });

  if (markers.length > 0) {
    const markersString = markers
      .map((m) => `${m.lat},${m.lng}${m.label ? `|label:${m.label}` : ''}`)
      .join('|');
    params.append('markers', markersString);
  }

  return `${BASE_URLS.mapsStatic}?${params.toString()}`;
}

// ============================================================================
// STREET VIEW STATIC API
// ============================================================================

export function getStreetViewStaticUrl(
  location: { lat: number; lng: number },
  options: {
    width?: number;
    height?: number;
    heading?: number;
    pitch?: number;
    fov?: number;
  } = {}
): string | null {
  if (!isGoogleMapsAvailable()) {
    return null;
  }

  const { width = 600, height = 400, heading = 0, pitch = 0, fov = 90 } = options;

  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    size: `${width}x${height}`,
    heading: heading.toString(),
    pitch: pitch.toString(),
    fov: fov.toString(),
    key: getApiKey(),
  });

  return `${BASE_URLS.streetViewStatic}?${params.toString()}`;
}

// ============================================================================
// AERIAL VIEW API
// ============================================================================

export interface AerialViewResult {
  videos: Array<{
    uri: string;
    startTime: string;
    endTime: string;
  }>;
}

function generateMockAerialView(location: { lat: number; lng: number }): AerialViewResult {
  return {
    videos: [
      {
        uri: `https://example.com/aerial/${location.lat}_${location.lng}.mp4`,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60000).toISOString(),
      },
    ],
  };
}

export async function getAerialView(
  location: { lat: number; lng: number }
): Promise<AerialViewResult> {
  return fetchWithFallback(
    `${BASE_URLS.aerialView}/videos:renderVideo?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        location: {
          latitude: location.lat,
          longitude: location.lng,
        },
      }),
    },
    () => generateMockAerialView(location)
  );
}

// ============================================================================
// MAP TILES API
// ============================================================================

export function getMapTileUrl(
  location: { lat: number; lng: number },
  zoom: number,
  tileType: 'roadmap' | 'satellite' | 'terrain' = 'roadmap'
): string | null {
  if (!isGoogleMapsAvailable()) {
    return null;
  }

  // Convert lat/lng to tile coordinates
  const n = Math.pow(2, zoom);
  const x = Math.floor((location.lng + 180) / 360 * n);
  const latRad = (location.lat * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);

  return `${BASE_URLS.mapTiles}/${tileType}/${zoom}/${x}/${y}?key=${getApiKey()}`;
}

// ============================================================================
// GEOLOCATION API
// ============================================================================

export interface GeolocationResult {
  location: {
    lat: number;
    lng: number;
  };
  accuracy: number;
}

export async function getGeolocation(
  cellTowers?: Array<{
    cellId: number;
    locationAreaCode: number;
    mobileCountryCode: number;
    mobileNetworkCode: number;
  }>,
  wifiAccessPoints?: Array<{
    macAddress: string;
    signalStrength?: number;
    signalToNoiseRatio?: number;
  }>
): Promise<GeolocationResult> {
  // This API requires special authentication, so we'll use browser geolocation as fallback
  if (navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            accuracy: position.coords.accuracy,
          });
        },
        () => {
          // Fallback to mock data
          resolve({
            location: {
              lat: 40.7128,
              lng: -74.0060,
            },
            accuracy: 100,
          });
        }
      );
    });
  }

  // Mock data fallback
  return {
    location: {
      lat: 40.7128,
      lng: -74.0060,
    },
    accuracy: 100,
  };
}

// ============================================================================
// ROUTE OPTIMIZATION API
// ============================================================================

export interface RouteOptimizationResult {
  routes: Array<{
    vehicleIndex: number;
    vehicleLabel: string;
    visits: Array<{
      shipmentIndex: number;
      shipmentLabel: string;
      arrivalTime: string;
      departureTime: string;
    }>;
    transitions: Array<{
      travelDuration: string;
      travelDistanceMeters: number;
    }>;
    metrics: {
      totalDuration: string;
      totalDistanceMeters: number;
      totalLoad: number;
    };
  }>;
}

function generateMockRouteOptimization(
  shipments: Array<{ lat: number; lng: number; label?: string }>
): RouteOptimizationResult {
  return {
    routes: [
      {
        vehicleIndex: 0,
        vehicleLabel: 'Vehicle 1',
        visits: shipments.map((shipment, index) => ({
          shipmentIndex: index,
          shipmentLabel: shipment.label || `Shipment ${index + 1}`,
          arrivalTime: new Date(Date.now() + index * 600000).toISOString(),
          departureTime: new Date(Date.now() + index * 600000 + 300000).toISOString(),
        })),
        transitions: shipments.slice(1).map(() => ({
          travelDuration: '10m',
          travelDistanceMeters: 5000,
        })),
        metrics: {
          totalDuration: `${shipments.length * 10}m`,
          totalDistanceMeters: shipments.length * 5000,
          totalLoad: shipments.length,
        },
      },
    ],
  };
}

export async function optimizeRoute(
  shipments: Array<{ lat: number; lng: number; label?: string }>
): Promise<RouteOptimizationResult> {
  return fetchWithFallback(
    `${BASE_URLS.routes}/optimizeRoutes?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        model: {
          shipments: shipments.map((s, i) => ({
            label: s.label || `Shipment ${i + 1}`,
            delivery: {
              location: {
                latLng: {
                  latitude: s.lat,
                  longitude: s.lng,
                },
              },
            },
          })),
          vehicles: [
            {
              label: 'Vehicle 1',
              startLocation: {
                latLng: {
                  latitude: shipments[0]?.lat || 0,
                  longitude: shipments[0]?.lng || 0,
                },
              },
            },
          ],
        },
      }),
    },
    () => generateMockRouteOptimization(shipments)
  );
}

// ============================================================================
// PLACES AGGREGATE API
// ============================================================================

export interface PlacesAggregateResult {
  places: Array<{
    placeId: string;
    displayName: string;
    location: {
      latitude: number;
      longitude: number;
    };
    placeTypes: string[];
    count: number;
  }>;
}

function generateMockPlacesAggregate(
  location: { lat: number; lng: number },
  radius: number
): PlacesAggregateResult {
  const placeTypes = ['restaurant', 'gas_station', 'hotel', 'parking'];
  
  return {
    places: placeTypes.map((type, i) => ({
      placeId: `place_${type}_${i}`,
      displayName: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
      location: {
        latitude: location.lat + (Math.random() - 0.5) * 0.01,
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
      },
      placeTypes: [type],
      count: Math.floor(Math.random() * 10) + 1,
    })),
  };
}

export async function getPlacesAggregate(
  location: { lat: number; lng: number },
  radius: number = 5000
): Promise<PlacesAggregateResult> {
  return fetchWithFallback(
    `${BASE_URLS.places}/places:aggregate?key=${getApiKey()}`,
    {
      method: 'POST',
      body: JSON.stringify({
        location: {
          latitude: location.lat,
          longitude: location.lng,
        },
        radiusMeters: radius,
      }),
    },
    () => generateMockPlacesAggregate(location, radius)
  );
}

// ============================================================================
// EXPORT TRACK COORDINATES
// ============================================================================

export function getTrackCoordinates(trackId: string): { lat: number; lng: number; name: string } | null {
  return TRACK_COORDINATES[trackId.toLowerCase()] || null;
}

export function getAllTrackCoordinates(): Record<string, { lat: number; lng: number; name: string }> {
  return TRACK_COORDINATES;
}



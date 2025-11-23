// src/api/googleMaps.ts
// Google Maps Datasets API and Street View Publish API integration
// Fallback to OpenWeatherMap when Google Maps API costs are a concern

const GOOGLE_MAPS_API_KEY = 
  import.meta.env.GOOGLE_MAPS_API_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  '';

const GOOGLE_MAPS_BASE_URL = 'https://mapsplatformdatasets.googleapis.com/v1';
const STREET_VIEW_PUBLISH_BASE_URL = 'https://streetviewpublish.googleapis.com/v1';
const GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

// Track coordinates (matching backend config)
const TRACK_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  barber: { lat: 33.4822, lng: -86.5103, name: 'Barber Motorsports Park' },
  cota: { lat: 30.1327, lng: -97.6351, name: 'Circuit of the Americas' },
  indianapolis: { lat: 39.7953, lng: -86.2347, name: 'Indianapolis Motor Speedway' },
  road_america: { lat: 43.8031, lng: -87.9908, name: 'Road America' },
  sebring: { lat: 27.4547, lng: -81.3544, name: 'Sebring International Raceway' },
  sonoma: { lat: 38.1616, lng: -122.4547, name: 'Sonoma Raceway' },
  vir: { lat: 36.6369, lng: -79.1739, name: 'Virginia International Raceway' },
};

export interface MapsDataset {
  displayName: string;
  versionId: string;
  status: string;
  usage: {
    totalFileCount: number;
    totalFileSize: string;
  };
  createTime: string;
  updateTime: string;
}

export interface StreetViewPhoto {
  photoId: {
    id: string;
  };
  uploadReference?: {
    uploadUrl: string;
  };
  pose: {
    latLngPair: {
      latitude: number;
      longitude: number;
    };
    heading: number;
    pitch: number;
    roll: number;
  };
  captureTime: string;
  connections?: Array<{
    target: {
      id: string;
    };
  }>;
}

export interface TrackLocationData {
  trackId: string;
  trackName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  mapsDatasetId?: string;
  streetViewPhotos?: string[];
  weatherFallback?: {
    source: 'openweathermap' | 'google_maps';
    available: boolean;
  };
}

export interface GeocodingResult {
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  placeId: string;
  types: string[];
}

/**
 * Check if Google Maps API is available
 */
export function isGoogleMapsAvailable(): boolean {
  return !!GOOGLE_MAPS_API_KEY;
}

/**
 * Get track coordinates
 */
export function getTrackCoordinates(trackId: string): { lat: number; lng: number; name: string } | null {
  return TRACK_COORDINATES[trackId.toLowerCase()] || null;
}

/**
 * Geocode address using Google Maps Geocoding API
 * Fallback to track coordinates if API fails
 */
export async function geocodeAddress(
  address: string | { lat: number; lng: number }
): Promise<GeocodingResult | null> {
  if (!isGoogleMapsAvailable()) {
    // Fallback: if it's coordinates, return them
    if (typeof address === 'object') {
      return {
        formattedAddress: `Lat: ${address.lat}, Lng: ${address.lng}`,
        location: address,
        placeId: '',
        types: ['establishment'],
      };
    }
    return null;
  }

  try {
    const query = typeof address === 'string' 
      ? `address=${encodeURIComponent(address)}`
      : `latlng=${address.lat},${address.lng}`;

    const response = await fetch(
      `${GEOCODING_BASE_URL}?${query}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        formattedAddress: result.formatted_address,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        placeId: result.place_id,
        types: result.types,
      };
    }

    return null;
  } catch (error) {
    console.warn('Google Maps geocoding failed, using fallback:', error);
    return null;
  }
}

/**
 * List Maps Datasets for a track
 */
export async function listMapsDatasets(projectId: string): Promise<MapsDataset[]> {
  if (!isGoogleMapsAvailable()) {
    console.warn('Google Maps API not configured - skipping Maps Datasets API');
    return [];
  }

  try {
    const response = await fetch(
      `${GOOGLE_MAPS_BASE_URL}/projects/${projectId}/datasets?key=${GOOGLE_MAPS_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Maps Datasets API failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.datasets || [];
  } catch (error) {
    console.warn('Maps Datasets API failed:', error);
    return [];
  }
}

/**
 * Get track location data with Google Maps integration
 */
export async function getTrackLocationData(
  trackId: string,
  useGoogleMaps: boolean = true
): Promise<TrackLocationData | null> {
  const coords = getTrackCoordinates(trackId);
  
  if (!coords) {
    return null;
  }

  const trackData: TrackLocationData = {
    trackId,
    trackName: coords.name,
    coordinates: {
      lat: coords.lat,
      lng: coords.lng,
    },
    weatherFallback: {
      source: useGoogleMaps && isGoogleMapsAvailable() ? 'google_maps' : 'openweathermap',
      available: useGoogleMaps && isGoogleMapsAvailable(),
    },
  };

  // Try to geocode for formatted address
  if (useGoogleMaps && isGoogleMapsAvailable()) {
    try {
      const geocodeResult = await geocodeAddress({ lat: coords.lat, lng: coords.lng });
      if (geocodeResult) {
        trackData.address = geocodeResult.formattedAddress;
      }
    } catch (error) {
      console.warn('Geocoding failed, using coordinates only:', error);
    }
  }

  return trackData;
}

/**
 * Get Street View photos for a location
 */
export async function getStreetViewPhotos(
  location: { lat: number; lng: number },
  radius: number = 50
): Promise<StreetViewPhoto[]> {
  if (!isGoogleMapsAvailable()) {
    console.warn('Google Maps API not configured - skipping Street View API');
    return [];
  }

  try {
    // Note: Street View Publish API requires OAuth2, so this is a simplified version
    // For public photos, use the Street View Static API instead
    const response = await fetch(
      `${STREET_VIEW_PUBLISH_BASE_URL}/photo?key=${GOOGLE_MAPS_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // This will likely fail without OAuth, but shows the structure
    if (!response.ok) {
      console.warn('Street View Publish API requires OAuth2 authentication');
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Street View API failed:', error);
    return [];
  }
}

/**
 * Get Street View Static Image URL (public API, doesn't need OAuth)
 */
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
    key: GOOGLE_MAPS_API_KEY,
  });

  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

/**
 * Get all tracks with location data
 */
export async function getAllTracksLocationData(
  useGoogleMaps: boolean = true
): Promise<TrackLocationData[]> {
  const tracks = Object.keys(TRACK_COORDINATES);
  const results: TrackLocationData[] = [];

  for (const trackId of tracks) {
    const data = await getTrackLocationData(trackId, useGoogleMaps);
    if (data) {
      results.push(data);
    }
  }

  return results;
}


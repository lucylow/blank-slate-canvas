# Google Maps Integration

This application integrates with Google Maps APIs to provide enhanced track location data and Street View imagery. The integration includes automatic fallback to OpenWeatherMap when cost optimization is needed.

## Enabled APIs

1. **Maps Datasets API** - Provides custom map datasets for track locations
2. **Street View Publish API** - Access Street View imagery for track locations

## Setup

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Library**
4. Enable the following APIs:
   - **Maps Datasets API**
   - **Street View Publish API**
   - **Geocoding API** (for address lookups)
   - **Maps JavaScript API** (optional, for embedded maps)
   - **Street View Static API** (for static Street View images)
5. Create credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > API Key**
   - Restrict the key to the APIs you're using (recommended)
   - Copy your API key

### 2. Configure API Key

Add your Google Maps API key as an environment variable:

**Option 1: Environment Variable (Development)**
```bash
export GOOGLE_MAPS_API_KEY="your-api-key-here"
# or
export VITE_GOOGLE_MAPS_API_KEY="your-api-key-here"
```

**Option 2: Lovable Cloud Secrets (Production)**
1. Go to your Lovable Cloud project settings
2. Navigate to **Secrets**
3. Add a new secret:
   - Name: `GOOGLE_MAPS_API_KEY` or `VITE_GOOGLE_MAPS_API_KEY`
   - Value: Your API key

### 3. Cost Optimization

The application includes automatic fallback to OpenWeatherMap when:
- Google Maps API key is not configured
- You manually disable Google Maps (via toggle in UI)
- API quota/billing limits are reached

This helps manage costs while still providing location-based features.

## Features

### Maps Datasets API

- **Custom Map Datasets**: Store and retrieve custom map data for track locations
- **Track Coordinates**: Accurate lat/lng coordinates for all 7 GR Cup tracks
- **Geocoding**: Convert addresses to coordinates and vice versa

### Street View Publish API

- **Street View Images**: Access Street View imagery for track locations
- **Static Images**: Generate static Street View images via Street View Static API
- **Visual Context**: Provide visual context for track locations

### Track Locations

The application includes coordinates for all 7 GR Cup tracks:

1. **Barber Motorsports Park** - 33.4822° N, 86.5103° W
2. **Circuit of the Americas** - 30.1327° N, 97.6351° W
3. **Indianapolis Motor Speedway** - 39.7953° N, 86.2347° W
4. **Road America** - 43.8031° N, 87.9908° W
5. **Sebring International Raceway** - 27.4547° N, 81.3544° W
6. **Sonoma Raceway** - 38.1616° N, 122.4547° W
7. **Virginia International Raceway** - 36.6369° N, 79.1739° W

## Usage

### In Components

```typescript
import { 
  getTrackLocationData, 
  getAllTracksLocationData,
  getStreetViewStaticUrl,
  isGoogleMapsAvailable 
} from '@/api/googleMaps';

// Check if Google Maps is available
if (isGoogleMapsAvailable()) {
  // Use Google Maps APIs
  const trackData = await getTrackLocationData('cota', true);
  
  // Get Street View image URL
  const streetViewUrl = getStreetViewStaticUrl(
    trackData.coordinates,
    { width: 800, height: 600 }
  );
} else {
  // Fallback to OpenWeatherMap
  console.log('Using OpenWeatherMap fallback');
}
```

### Google Maps Integration Component

The `GoogleMapsIntegration` component provides a complete UI for:
- Viewing all track locations
- Switching between Google Maps and OpenWeatherMap
- Viewing Street View images
- Opening track locations in Google Maps

## API Reference

### Functions

#### `isGoogleMapsAvailable(): boolean`
Check if Google Maps API key is configured.

#### `getTrackCoordinates(trackId: string)`
Get coordinates for a specific track.

#### `geocodeAddress(address: string | { lat: number; lng: number })`
Geocode an address or reverse geocode coordinates.

#### `getTrackLocationData(trackId: string, useGoogleMaps: boolean)`
Get complete track location data with optional Google Maps integration.

#### `getAllTracksLocationData(useGoogleMaps: boolean)`
Get location data for all tracks.

#### `getStreetViewStaticUrl(location, options)`
Get a Street View Static API image URL for a location.

## Cost Considerations

### Google Maps Pricing

- **Maps Datasets API**: Pay-as-you-go pricing
- **Street View Publish API**: Pay-as-you-go pricing
- **Geocoding API**: $5 per 1,000 requests after free tier
- **Street View Static API**: $7 per 1,000 requests after free tier

### OpenWeatherMap Pricing

- **Free Tier**: 60 calls/minute
- **Paid Plans**: Starting at $40/month

### Recommendation

Use Google Maps APIs when:
- You need Street View imagery
- You need custom map datasets
- Budget allows for API costs

Use OpenWeatherMap fallback when:
- Cost optimization is a priority
- Basic weather data is sufficient
- Google Maps features aren't needed

The application automatically falls back to OpenWeatherMap when Google Maps API key is not configured.

## Troubleshooting

### API Key Not Working

1. Verify the API key is correctly set in environment variables
2. Check that required APIs are enabled in Google Cloud Console
3. Verify API key restrictions allow your domain/IP
4. Check browser console for error messages

### Street View Images Not Loading

- Street View Static API requires billing enabled
- Some locations may not have Street View coverage
- Check API quota limits in Google Cloud Console

### Fallback to OpenWeatherMap

The application will automatically use OpenWeatherMap when:
- Google Maps API key is not configured
- API calls fail
- You manually disable Google Maps in the UI

This is expected behavior and helps manage costs.

## References

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Maps Datasets API](https://developers.google.com/maps/documentation/datasets)
- [Street View Publish API](https://developers.google.com/streetview/publish)
- [Street View Static API](https://developers.google.com/maps/documentation/streetview)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)



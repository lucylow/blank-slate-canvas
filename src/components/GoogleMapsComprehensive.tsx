// Comprehensive Google Maps Platform Integration Component
// Displays all Google Maps APIs with organized tabs and sections

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Info,
  Wind,
  Sun,
  Cloud,
  Flower2,
  Navigation,
  Route,
  Mountain,
  Clock,
  Map,
  Camera,
  Building2,
  Package,
  BarChart3,
  Layers,
  Compass,
} from 'lucide-react';
import {
  isGoogleMapsAvailable,
  getTrackCoordinates,
  getAllTrackCoordinates,
  getAirQuality,
  getSolarData,
  getWeatherData,
  getPollenData,
  searchPlaces,
  getDirections,
  getDistanceMatrix,
  snapToRoad,
  getElevation,
  getTimeZone,
  validateAddress,
  getStaticMapUrl,
  getStreetViewStaticUrl,
  getAerialView,
  getGeolocation,
  optimizeRoute,
  getPlacesAggregate,
  type AirQualityData,
  type SolarData,
  type WeatherData,
  type PollenData,
  type PlacesSearchResult,
  type DirectionsResult,
  type DistanceMatrixResult,
  type SnappedPoints,
  type ElevationResult,
  type TimeZoneResult,
  type AddressValidationResult,
  type AerialViewResult,
  type RouteOptimizationResult,
  type PlacesAggregateResult,
} from '@/api/googleMapsComprehensive';

export function GoogleMapsComprehensive() {
  const [useGoogleMaps, setUseGoogleMaps] = useState(isGoogleMapsAvailable());
  const [selectedTrack, setSelectedTrack] = useState<string>('cota');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [solar, setSolar] = useState<SolarData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [pollen, setPollen] = useState<PollenData | null>(null);
  const [places, setPlaces] = useState<PlacesSearchResult | null>(null);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [distanceMatrix, setDistanceMatrix] = useState<DistanceMatrixResult | null>(null);
  const [elevation, setElevation] = useState<ElevationResult | null>(null);
  const [timeZone, setTimeZone] = useState<TimeZoneResult | null>(null);
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [aerialView, setAerialView] = useState<AerialViewResult | null>(null);
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimizationResult | null>(null);
  const [placesAggregate, setPlacesAggregate] = useState<PlacesAggregateResult | null>(null);

  const [addressInput, setAddressInput] = useState('');
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');

  const tracks = getAllTrackCoordinates();
  const currentLocation = getTrackCoordinates(selectedTrack);

  const loadData = useCallback(async (apiName: string, loader: () => Promise<any>, setter: (data: any) => void) => {
    if (!currentLocation) return;
    
    setLoading((prev) => ({ ...prev, [apiName]: true }));
    setError(null);
    
    try {
      const data = await loader();
      setter(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading((prev) => ({ ...prev, [apiName]: false }));
    }
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation) {
      // Load environment data on track change
      loadData('airQuality', () => getAirQuality(currentLocation), setAirQuality);
      loadData('weather', () => getWeatherData(currentLocation), setWeather);
      loadData('pollen', () => getPollenData(currentLocation), setPollen);
      loadData('timeZone', () => getTimeZone(currentLocation), setTimeZone);
    }
  }, [selectedTrack, loadData]);

  const googleMapsAvailable = isGoogleMapsAvailable();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Google Maps Platform - Complete Integration</CardTitle>
                <CardDescription>
                  All Google Maps APIs with comprehensive mock data fallbacks
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="use-google-maps" className="text-sm">
                  Use Google Maps
                </Label>
                <Switch
                  id="use-google-maps"
                  checked={useGoogleMaps && googleMapsAvailable}
                  onCheckedChange={setUseGoogleMaps}
                  disabled={!googleMapsAvailable}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Label>Select Track:</Label>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {Object.entries(tracks).map(([id, track]) => (
                <option key={id} value={id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>
          
          {!googleMapsAvailable && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Google Maps API not configured - Using Mock Data
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set GOOGLE_MAPS_API_KEY environment variable to enable real Google Maps APIs.
                    All features work with detailed mock data fallbacks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {googleMapsAvailable && useGoogleMaps && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Google Maps APIs Enabled
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Using real Google Maps Platform APIs with automatic fallback to mock data on errors.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="environment" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-7">
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="maps">Maps</TabsTrigger>
          <TabsTrigger value="places">Places</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        {/* Environment APIs Tab */}
        <TabsContent value="environment" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Air Quality */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wind className="w-5 h-5 text-primary" />
                    Air Quality API
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('airQuality', () => getAirQuality(currentLocation!), setAirQuality)}
                    disabled={loading.airQuality || !currentLocation}
                  >
                    {loading.airQuality ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {airQuality ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">AQI</span>
                        <Badge
                          variant={
                            airQuality.indexes[0]?.aqi > 100
                              ? 'destructive'
                              : airQuality.indexes[0]?.aqi > 50
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {airQuality.indexes[0]?.aqiDisplay}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {airQuality.indexes[0]?.category}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {airQuality.pollutants.map((pollutant) => (
                        <div key={pollutant.code} className="text-sm">
                          <div className="flex justify-between">
                            <span>{pollutant.displayName}</span>
                            <span className="font-mono">
                              {pollutant.concentration.value.toFixed(1)} {pollutant.concentration.units}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click refresh to load air quality data</p>
                )}
              </CardContent>
            </Card>

            {/* Solar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sun className="w-5 h-5 text-primary" />
                    Solar API
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('solar', () => getSolarData(currentLocation!), setSolar)}
                    disabled={loading.solar || !currentLocation}
                  >
                    {loading.solar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {solar ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Solar Potential</p>
                      <p className="text-2xl font-bold">
                        {solar.solarPotential.maxArrayPanelsCount} panels
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sunshine Hours/Year</span>
                        <p className="font-semibold">{solar.solarPotential.maxSunshineHoursPerYear}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payback Years</span>
                        <p className="font-semibold">
                          {solar.buildingInsights.financialAnalyses[0]?.financialDetails.paybackYears}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Lifetime Savings</span>
                      <p className="font-semibold">
                        ${parseInt(solar.buildingInsights.financialAnalyses[0]?.financialDetails.lifetimeSavings.units || '0').toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click refresh to load solar data</p>
                )}
              </CardContent>
            </Card>

            {/* Weather */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-primary" />
                    Weather API
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('weather', () => getWeatherData(currentLocation!), setWeather)}
                    disabled={loading.weather || !currentLocation}
                  >
                    {loading.weather ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {weather ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-3xl font-bold">{weather.currentConditions.temperature}°F</p>
                      <p className="text-sm text-muted-foreground">{weather.currentConditions.condition}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Humidity</span>
                        <p className="font-semibold">{weather.currentConditions.humidity}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Wind</span>
                        <p className="font-semibold">{weather.currentConditions.windSpeed} mph</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">UV Index</span>
                        <p className="font-semibold">{weather.currentConditions.uvIndex}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pressure</span>
                        <p className="font-semibold">{weather.currentConditions.pressure} inHg</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click refresh to load weather data</p>
                )}
              </CardContent>
            </Card>

            {/* Pollen */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flower2 className="w-5 h-5 text-primary" />
                    Pollen API
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('pollen', () => getPollenData(currentLocation!), setPollen)}
                    disabled={loading.pollen || !currentLocation}
                  >
                    {loading.pollen ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {pollen ? (
                  <div className="space-y-3">
                    {pollen.dailyInfo[0]?.pollenTypeInfo.map((type) => (
                      <div key={type.type} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{type.displayName}</span>
                          <Badge
                            variant={
                              type.indexInfo.value > 6
                                ? 'destructive'
                                : type.indexInfo.value > 3
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {type.indexInfo.value}/9
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{type.indexInfo.category}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click refresh to load pollen data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Maps APIs Tab */}
        <TabsContent value="maps" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Static Maps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Map className="w-5 h-5 text-primary" />
                  Maps Static API
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentLocation && (
                  <div className="space-y-3">
                    {getStaticMapUrl(currentLocation, {
                      zoom: 15,
                      size: '600x400',
                      markers: [{ lat: currentLocation.lat, lng: currentLocation.lng, label: 'T' }],
                    }) ? (
                      <img
                        src={getStaticMapUrl(currentLocation, {
                          zoom: 15,
                          size: '600x400',
                          markers: [{ lat: currentLocation.lat, lng: currentLocation.lng, label: 'T' }],
                        })!}
                        alt="Static Map"
                        className="w-full rounded-lg border"
                      />
                    ) : (
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Map preview unavailable</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Street View */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Street View Static API
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentLocation && (
                  <div className="space-y-3">
                    {getStreetViewStaticUrl(currentLocation, {
                      width: 600,
                      height: 400,
                    }) ? (
                      <img
                        src={getStreetViewStaticUrl(currentLocation, {
                          width: 600,
                          height: 400,
                        })!}
                        alt="Street View"
                        className="w-full rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Street View unavailable</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Elevation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mountain className="w-5 h-5 text-primary" />
                    Elevation API
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('elevation', () => getElevation([currentLocation!]), setElevation)}
                    disabled={loading.elevation || !currentLocation}
                  >
                    {loading.elevation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {elevation ? (
                  <div className="space-y-2">
                    {elevation.results.map((result, i) => (
                      <div key={i} className="text-sm">
                        <div className="flex justify-between">
                          <span>Elevation</span>
                          <span className="font-mono font-semibold">
                            {result.elevation.toFixed(1)} m
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Resolution</span>
                          <span>{result.resolution} m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click refresh to load elevation data</p>
                )}
              </CardContent>
            </Card>

            {/* Time Zone */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Time Zone API
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('timeZone', () => getTimeZone(currentLocation!), setTimeZone)}
                    disabled={loading.timeZone || !currentLocation}
                  >
                    {loading.timeZone ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {timeZone ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Time Zone</span>
                        <span className="font-semibold">{timeZone.timeZoneName}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>UTC Offset</span>
                        <span className="font-mono">
                          {timeZone.rawOffset / 3600 > 0 ? '+' : ''}
                          {timeZone.rawOffset / 3600} hours
                        </span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>DST Offset</span>
                        <span className="font-mono">+{timeZone.dstOffset / 3600} hours</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click refresh to load time zone data</p>
                )}
              </CardContent>
            </Card>

            {/* Aerial View */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Aerial View API
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('aerialView', () => getAerialView(currentLocation!), setAerialView)}
                    disabled={loading.aerialView || !currentLocation}
                  >
                    {loading.aerialView ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {aerialView ? (
                  <div className="space-y-2">
                    {aerialView.videos.map((video, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium">Video {i + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.startTime).toLocaleString()} - {new Date(video.endTime).toLocaleString()}
                        </p>
                        <a
                          href={video.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs hover:underline flex items-center gap-1"
                        >
                          View Video <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click refresh to load aerial view data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Places APIs Tab */}
        <TabsContent value="places" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Places Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Places API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search places..."
                      value={placeSearchQuery}
                      onChange={(e) => setPlaceSearchQuery(e.target.value)}
                    />
                    <Button
                      onClick={() => loadData('places', () => searchPlaces(currentLocation!, placeSearchQuery || undefined), setPlaces)}
                      disabled={loading.places || !currentLocation}
                    >
                      {loading.places ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Search'
                      )}
                    </Button>
                  </div>
                  {places && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {places.places.map((place) => (
                        <div key={place.id} className="p-2 border rounded-lg text-sm">
                          <p className="font-medium">{place.displayName.text}</p>
                          <p className="text-xs text-muted-foreground">{place.formattedAddress}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{place.rating?.toFixed(1)} ⭐</Badge>
                            <span className="text-xs text-muted-foreground">
                              {place.userRatingCount} reviews
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Places Aggregate */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Places Aggregate API
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('placesAggregate', () => getPlacesAggregate(currentLocation!), setPlacesAggregate)}
                    disabled={loading.placesAggregate || !currentLocation}
                  >
                    {loading.placesAggregate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {placesAggregate ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {placesAggregate.places.map((place) => (
                      <div key={place.placeId} className="p-2 border rounded-lg text-sm">
                        <p className="font-medium">{place.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {place.placeTypes.join(', ')}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          Count: {place.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click refresh to load aggregate data</p>
                )}
              </CardContent>
            </Card>

            {/* Address Validation */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Address Validation API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter address to validate..."
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                    />
                    <Button
                      onClick={() => loadData('addressValidation', () => validateAddress(addressInput), setAddressValidation)}
                      disabled={loading.addressValidation || !addressInput}
                    >
                      {loading.addressValidation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Validate'
                      )}
                    </Button>
                  </div>
                  {addressValidation && (
                    <div className="space-y-2 p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Formatted Address</p>
                        <p className="text-sm">{addressValidation.result.address.formattedAddress}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Validation</span>
                          <p className="font-semibold">
                            {addressValidation.result.verdict.addressComplete ? 'Complete' : 'Incomplete'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Granularity</span>
                          <p className="font-semibold">
                            {addressValidation.result.verdict.validationGranularity}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Routes APIs Tab */}
        <TabsContent value="routes" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Directions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  Directions API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      const origin = getTrackCoordinates('cota');
                      const dest = getTrackCoordinates('barber');
                      if (origin && dest) {
                        loadData('directions', () => getDirections(origin, dest), setDirections);
                      }
                    }}
                    disabled={loading.directions}
                  >
                    {loading.directions ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Get Directions (COTA → Barber)'
                    )}
                  </Button>
                  {directions && (
                    <div className="space-y-2">
                      {directions.routes.map((route, i) => (
                        <div key={i} className="p-3 border rounded-lg text-sm">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">Route {i + 1}</span>
                            <Badge>{route.distanceMeters / 1000} km</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Duration: {route.duration}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Distance Matrix */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Route className="w-5 h-5 text-primary" />
                  Distance Matrix API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      const origins = [
                        getTrackCoordinates('cota')!,
                        getTrackCoordinates('barber')!,
                      ];
                      const destinations = [
                        getTrackCoordinates('indianapolis')!,
                        getTrackCoordinates('sonoma')!,
                      ];
                      loadData('distanceMatrix', () => getDistanceMatrix(origins, destinations), setDistanceMatrix);
                    }}
                    disabled={loading.distanceMatrix}
                  >
                    {loading.distanceMatrix ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Calculate Distance Matrix'
                    )}
                  </Button>
                  {distanceMatrix && (
                    <div className="space-y-2 text-sm">
                      {distanceMatrix.rows.map((row, i) => (
                        <div key={i} className="p-2 border rounded">
                          <p className="font-medium mb-1">From Origin {i + 1}</p>
                          {row.elements.map((el, j) => (
                            <div key={j} className="text-xs">
                              To Dest {j + 1}: {el.distanceMeters / 1000} km, {el.duration}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Route Optimization */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Route Optimization API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      const shipments = [
                        getTrackCoordinates('cota')!,
                        getTrackCoordinates('barber')!,
                        getTrackCoordinates('indianapolis')!,
                        getTrackCoordinates('sonoma')!,
                      ].map((track, i) => ({ ...track, label: `Stop ${i + 1}` }));
                      loadData('routeOptimization', () => optimizeRoute(shipments), setRouteOptimization);
                    }}
                    disabled={loading.routeOptimization}
                  >
                    {loading.routeOptimization ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Optimize Route (4 Stops)'
                    )}
                  </Button>
                  {routeOptimization && (
                    <div className="space-y-2">
                      {routeOptimization.routes.map((route, i) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">{route.vehicleLabel}</span>
                            <Badge>
                              {route.metrics.totalDistanceMeters / 1000} km, {route.metrics.totalDuration}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            {route.visits.map((visit, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                  {j + 1}
                                </span>
                                <span>{visit.shipmentLabel}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {visit.arrivalTime.split('T')[1].substring(0, 5)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Geolocation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" />
                  Geolocation API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={async () => {
                      setLoading((prev) => ({ ...prev, geolocation: true }));
                      try {
                        const result = await getGeolocation();
                        alert(`Location: ${result.location.lat.toFixed(6)}, ${result.location.lng.toFixed(6)}\nAccuracy: ${result.accuracy}m`);
                      } catch (err) {
                        setError('Failed to get geolocation');
                      } finally {
                        setLoading((prev) => ({ ...prev, geolocation: false }));
                      }
                    }}
                    disabled={loading.geolocation}
                  >
                    {loading.geolocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Get Current Location'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Uses browser geolocation API with fallback to mock data
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Snap to Road */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Route className="w-5 h-5 text-primary" />
                  Roads API (Snap to Road)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={async () => {
                      if (!currentLocation) return;
                      const path = [
                        currentLocation,
                        { lat: currentLocation.lat + 0.01, lng: currentLocation.lng + 0.01 },
                        { lat: currentLocation.lat + 0.02, lng: currentLocation.lng + 0.02 },
                      ];
                      setLoading((prev) => ({ ...prev, snapToRoad: true }));
                      try {
                        const result = await snapToRoad(path);
                        alert(`Snapped ${result.snappedPoints.length} points to road`);
                      } catch (err) {
                        setError('Failed to snap to road');
                      } finally {
                        setLoading((prev) => ({ ...prev, snapToRoad: false }));
                      }
                    }}
                    disabled={loading.snapToRoad || !currentLocation}
                  >
                    {loading.snapToRoad ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Snap Path to Road'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Snaps GPS coordinates to nearest road
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


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
    <div className="space-y-8 sm:space-y-10">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
                <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl mb-2">Google Maps Platform - Complete Integration</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  All Google Maps APIs with comprehensive mock data fallbacks
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="use-google-maps" className="text-sm sm:text-base font-medium">
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
        <CardContent className="pt-0 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Label className="text-sm sm:text-base font-medium whitespace-nowrap">Select Track:</Label>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="px-4 py-2.5 border rounded-lg bg-background text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {Object.entries(tracks).map(([id, track]) => (
                <option key={id} value={id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>
          
          {!googleMapsAvailable && (
            <div className="p-5 sm:p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm sm:text-base font-medium text-yellow-600 dark:text-yellow-400">
                    Google Maps API not configured - Using Mock Data
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Set GOOGLE_MAPS_API_KEY environment variable to enable real Google Maps APIs.
                    All features work with detailed mock data fallbacks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {googleMapsAvailable && useGoogleMaps && (
            <div className="p-5 sm:p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm sm:text-base font-medium text-green-600 dark:text-green-400">
                    Google Maps APIs Enabled
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 sm:p-2 bg-muted/50 h-auto">
          <TabsTrigger value="environment" className="text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4">Environment</TabsTrigger>
          <TabsTrigger value="maps" className="text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4">Maps</TabsTrigger>
          <TabsTrigger value="places" className="text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4">Places</TabsTrigger>
          <TabsTrigger value="routes" className="text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4">Routes</TabsTrigger>
          <TabsTrigger value="tools" className="text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4">Tools</TabsTrigger>
        </TabsList>

        {/* Environment APIs Tab */}
        <TabsContent value="environment" className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {/* Air Quality */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                    <Wind className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span>Air Quality API</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('airQuality', () => getAirQuality(currentLocation!), setAirQuality)}
                    disabled={loading.airQuality || !currentLocation}
                    className="flex-shrink-0"
                  >
                    {loading.airQuality ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {airQuality ? (
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-border/50">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-sm sm:text-base font-semibold">AQI</span>
                        <Badge
                          variant={
                            airQuality.indexes[0]?.aqi > 100
                              ? 'destructive'
                              : airQuality.indexes[0]?.aqi > 50
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs sm:text-sm px-2.5 py-1"
                        >
                          {airQuality.indexes[0]?.aqiDisplay}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {airQuality.indexes[0]?.category}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {airQuality.pollutants.map((pollutant) => (
                        <div key={pollutant.code} className="text-sm sm:text-base py-1.5">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-muted-foreground">{pollutant.displayName}</span>
                            <span className="font-mono font-semibold text-foreground">
                              {pollutant.concentration.value.toFixed(1)} {pollutant.concentration.units}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-4">Click refresh to load air quality data</p>
                )}
              </CardContent>
            </Card>

            {/* Solar */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                    <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span>Solar API</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('solar', () => getSolarData(currentLocation!), setSolar)}
                    disabled={loading.solar || !currentLocation}
                    className="flex-shrink-0"
                  >
                    {loading.solar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {solar ? (
                  <div className="space-y-5">
                    <div className="pb-3 border-b border-border/50">
                      <p className="text-sm sm:text-base font-medium text-muted-foreground mb-2">Solar Potential</p>
                      <p className="text-2xl sm:text-3xl font-bold">
                        {solar.solarPotential.maxArrayPanelsCount} panels
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs sm:text-sm">Sunshine Hours/Year</span>
                        <p className="font-semibold text-base sm:text-lg">{solar.solarPotential.maxSunshineHoursPerYear}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs sm:text-sm">Payback Years</span>
                        <p className="font-semibold text-base sm:text-lg">
                          {solar.buildingInsights.financialAnalyses[0]?.financialDetails.paybackYears}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 space-y-1">
                      <span className="text-sm sm:text-base text-muted-foreground block">Lifetime Savings</span>
                      <p className="font-semibold text-lg sm:text-xl">
                        ${parseInt(solar.buildingInsights.financialAnalyses[0]?.financialDetails.lifetimeSavings.units || '0').toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-4">Click refresh to load solar data</p>
                )}
              </CardContent>
            </Card>

            {/* Weather */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                    <Cloud className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span>Weather API</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('weather', () => getWeatherData(currentLocation!), setWeather)}
                    disabled={loading.weather || !currentLocation}
                    className="flex-shrink-0"
                  >
                    {loading.weather ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {weather ? (
                  <div className="space-y-5">
                    <div className="pb-3 border-b border-border/50">
                      <p className="text-3xl sm:text-4xl font-bold mb-2">{weather.currentConditions.temperature}°F</p>
                      <p className="text-sm sm:text-base text-muted-foreground">{weather.currentConditions.condition}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs sm:text-sm">Humidity</span>
                        <p className="font-semibold text-base sm:text-lg">{weather.currentConditions.humidity}%</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs sm:text-sm">Wind</span>
                        <p className="font-semibold text-base sm:text-lg">{weather.currentConditions.windSpeed} mph</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs sm:text-sm">UV Index</span>
                        <p className="font-semibold text-base sm:text-lg">{weather.currentConditions.uvIndex}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block text-xs sm:text-sm">Pressure</span>
                        <p className="font-semibold text-base sm:text-lg">{weather.currentConditions.pressure} inHg</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-4">Click refresh to load weather data</p>
                )}
              </CardContent>
            </Card>

            {/* Pollen */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                    <Flower2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span>Pollen API</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('pollen', () => getPollenData(currentLocation!), setPollen)}
                    disabled={loading.pollen || !currentLocation}
                    className="flex-shrink-0"
                  >
                    {loading.pollen ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pollen ? (
                  <div className="space-y-4">
                    {pollen.dailyInfo[0]?.pollenTypeInfo.map((type) => (
                      <div key={type.type} className="space-y-2 py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm sm:text-base font-medium">{type.displayName}</span>
                          <Badge
                            variant={
                              type.indexInfo.value > 6
                                ? 'destructive'
                                : type.indexInfo.value > 3
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs sm:text-sm px-2.5 py-1"
                          >
                            {type.indexInfo.value}/9
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{type.indexInfo.category}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-4">Click refresh to load pollen data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Maps APIs Tab */}
        <TabsContent value="maps" className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {/* Static Maps */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                  <Map className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Maps Static API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentLocation && (
                  <div className="space-y-4">
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
                        className="w-full rounded-lg border shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center border">
                        <p className="text-sm sm:text-base text-muted-foreground">Map preview unavailable</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Street View */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Street View Static API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentLocation && (
                  <div className="space-y-4">
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
                        className="w-full rounded-lg border shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center border">
                        <p className="text-sm sm:text-base text-muted-foreground">Street View unavailable</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Elevation */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                    <Mountain className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span>Elevation API</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('elevation', () => getElevation([currentLocation!]), setElevation)}
                    disabled={loading.elevation || !currentLocation}
                    className="flex-shrink-0"
                  >
                    {loading.elevation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {elevation ? (
                  <div className="space-y-4">
                    {elevation.results.map((result, i) => (
                      <div key={i} className="text-sm sm:text-base py-2 border-b border-border/30 last:border-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-muted-foreground">Elevation</span>
                          <span className="font-mono font-semibold text-foreground">
                            {result.elevation.toFixed(1)} m
                          </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                          <span>Resolution</span>
                          <span>{result.resolution} m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-4">Click refresh to load elevation data</p>
                )}
              </CardContent>
            </Card>

            {/* Time Zone */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span>Time Zone API</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('timeZone', () => getTimeZone(currentLocation!), setTimeZone)}
                    disabled={loading.timeZone || !currentLocation}
                    className="flex-shrink-0"
                  >
                    {loading.timeZone ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {timeZone ? (
                  <div className="space-y-3">
                    <div className="text-sm sm:text-base py-2 border-b border-border/30">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Time Zone</span>
                        <span className="font-semibold text-foreground">{timeZone.timeZoneName}</span>
                      </div>
                    </div>
                    <div className="text-sm sm:text-base py-2 border-b border-border/30">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">UTC Offset</span>
                        <span className="font-mono font-semibold text-foreground">
                          {timeZone.rawOffset / 3600 > 0 ? '+' : ''}
                          {timeZone.rawOffset / 3600} hours
                        </span>
                      </div>
                    </div>
                    <div className="text-sm sm:text-base py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">DST Offset</span>
                        <span className="font-mono font-semibold text-foreground">+{timeZone.dstOffset / 3600} hours</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-4">Click refresh to load time zone data</p>
                )}
              </CardContent>
            </Card>

            {/* Aerial View */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span>Aerial View API</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('aerialView', () => getAerialView(currentLocation!), setAerialView)}
                    disabled={loading.aerialView || !currentLocation}
                    className="flex-shrink-0"
                  >
                    {loading.aerialView ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {aerialView ? (
                  <div className="space-y-4">
                    {aerialView.videos.map((video, i) => (
                      <div key={i} className="text-sm sm:text-base py-3 border-b border-border/30 last:border-0 space-y-2">
                        <p className="font-semibold">Video {i + 1}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(video.startTime).toLocaleString()} - {new Date(video.endTime).toLocaleString()}
                        </p>
                        <a
                          href={video.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs sm:text-sm hover:underline flex items-center gap-1.5 font-medium"
                        >
                          View Video <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-4">Click refresh to load aerial view data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Places APIs Tab */}
        <TabsContent value="places" className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {/* Places Search */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Places API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Search places..."
                      value={placeSearchQuery}
                      onChange={(e) => setPlaceSearchQuery(e.target.value)}
                      className="flex-1 text-sm sm:text-base"
                    />
                    <Button
                      onClick={() => loadData('places', () => searchPlaces(currentLocation!, placeSearchQuery || undefined), setPlaces)}
                      disabled={loading.places || !currentLocation}
                      className="sm:flex-shrink-0"
                    >
                      {loading.places ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Search'
                      )}
                    </Button>
                  </div>
                  {places && (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {places.places.map((place) => (
                        <div key={place.id} className="p-3 sm:p-4 border rounded-lg text-sm sm:text-base hover:bg-muted/50 transition-colors">
                          <p className="font-semibold mb-1.5">{place.displayName.text}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">{place.formattedAddress}</p>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs sm:text-sm">{place.rating?.toFixed(1)} ⭐</Badge>
                            <span className="text-xs sm:text-sm text-muted-foreground">
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
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                    <span>Places Aggregate API</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadData('placesAggregate', () => getPlacesAggregate(currentLocation!), setPlacesAggregate)}
                    disabled={loading.placesAggregate || !currentLocation}
                    className="flex-shrink-0"
                  >
                    {loading.placesAggregate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {placesAggregate ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {placesAggregate.places.map((place) => (
                      <div key={place.placeId} className="p-3 sm:p-4 border rounded-lg text-sm sm:text-base hover:bg-muted/50 transition-colors">
                        <p className="font-semibold mb-1.5">{place.displayName}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                          {place.placeTypes.join(', ')}
                        </p>
                        <Badge variant="secondary" className="text-xs sm:text-sm">
                          Count: {place.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-4">Click refresh to load aggregate data</p>
                )}
              </CardContent>
            </Card>

            {/* Address Validation */}
            <Card className="sm:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Address Validation API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Enter address to validate..."
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      className="flex-1 text-sm sm:text-base"
                    />
                    <Button
                      onClick={() => loadData('addressValidation', () => validateAddress(addressInput), setAddressValidation)}
                      disabled={loading.addressValidation || !addressInput}
                      className="sm:flex-shrink-0"
                    >
                      {loading.addressValidation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Validate'
                      )}
                    </Button>
                  </div>
                  {addressValidation && (
                    <div className="space-y-4 p-4 sm:p-5 border rounded-lg bg-muted/30">
                      <div className="pb-3 border-b border-border/50">
                        <p className="text-sm sm:text-base font-semibold mb-2 text-muted-foreground">Formatted Address</p>
                        <p className="text-sm sm:text-base">{addressValidation.result.address.formattedAddress}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
                        <div className="space-y-1">
                          <span className="text-muted-foreground block text-xs sm:text-sm">Validation</span>
                          <p className="font-semibold text-base sm:text-lg">
                            {addressValidation.result.verdict.addressComplete ? 'Complete' : 'Incomplete'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block text-xs sm:text-sm">Granularity</span>
                          <p className="font-semibold text-base sm:text-lg">
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
        <TabsContent value="routes" className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {/* Directions */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                  <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Directions API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-5">
                  <Button
                    onClick={() => {
                      const origin = getTrackCoordinates('cota');
                      const dest = getTrackCoordinates('barber');
                      if (origin && dest) {
                        loadData('directions', () => getDirections(origin, dest), setDirections);
                      }
                    }}
                    disabled={loading.directions}
                    className="w-full sm:w-auto"
                  >
                    {loading.directions ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Get Directions (COTA → Barber)'
                    )}
                  </Button>
                  {directions && (
                    <div className="space-y-3">
                      {directions.routes.map((route, i) => (
                        <div key={i} className="p-4 border rounded-lg text-sm sm:text-base hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-center mb-2.5">
                            <span className="font-semibold">Route {i + 1}</span>
                            <Badge className="text-xs sm:text-sm">{route.distanceMeters / 1000} km</Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Duration: {route.duration}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Distance Matrix */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                  <Route className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Distance Matrix API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-5">
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
                    className="w-full sm:w-auto"
                  >
                    {loading.distanceMatrix ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Calculate Distance Matrix'
                    )}
                  </Button>
                  {distanceMatrix && (
                    <div className="space-y-3 text-sm sm:text-base">
                      {distanceMatrix.rows.map((row, i) => (
                        <div key={i} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <p className="font-semibold mb-3">From Origin {i + 1}</p>
                          <div className="space-y-2">
                            {row.elements.map((el, j) => (
                              <div key={j} className="text-xs sm:text-sm flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                                <span className="text-muted-foreground">To Dest {j + 1}</span>
                                <span className="font-medium">{el.distanceMeters / 1000} km, {el.duration}</span>
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

            {/* Route Optimization */}
            <Card className="sm:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Route Optimization API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-5">
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
                    className="w-full sm:w-auto"
                  >
                    {loading.routeOptimization ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Optimize Route (4 Stops)'
                    )}
                  </Button>
                  {routeOptimization && (
                    <div className="space-y-4">
                      {routeOptimization.routes.map((route, i) => (
                        <div key={i} className="p-4 sm:p-5 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border/50">
                            <span className="font-semibold text-base sm:text-lg">{route.vehicleLabel}</span>
                            <Badge className="text-xs sm:text-sm">
                              {route.metrics.totalDistanceMeters / 1000} km, {route.metrics.totalDuration}
                            </Badge>
                          </div>
                          <div className="text-sm sm:text-base space-y-2.5">
                            {route.visits.map((visit, j) => (
                              <div key={j} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                                  {j + 1}
                                </span>
                                <span className="flex-1">{visit.shipmentLabel}</span>
                                <span className="text-xs sm:text-sm text-muted-foreground">
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
        <TabsContent value="tools" className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
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



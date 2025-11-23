// src/components/GoogleMapsIntegration.tsx
// Google Maps integration component with Maps Datasets API and Street View Publish API
// Fallback to OpenWeatherMap when Google Maps API costs are a concern

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
import {
  MapPin,
  Image as ImageIcon,
  Globe,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Info,
  Camera,
  Download,
} from 'lucide-react';
import {
  getAllTracksLocationData,
  getTrackLocationData,
  getStreetViewStaticUrl,
  isGoogleMapsAvailable,
  type TrackLocationData,
} from '@/api/googleMaps';

export function GoogleMapsIntegration() {
  const [tracksData, setTracksData] = useState<TrackLocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useGoogleMaps, setUseGoogleMaps] = useState(isGoogleMapsAvailable());
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [streetViewImages, setStreetViewImages] = useState<Record<string, string>>({});

  const loadTracksData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllTracksLocationData(useGoogleMaps);
      setTracksData(data);

      // Load Street View images for each track
      if (useGoogleMaps && isGoogleMapsAvailable()) {
        const images: Record<string, string> = {};
        for (const track of data) {
          const imageUrl = getStreetViewStaticUrl(track.coordinates, {
            width: 800,
            height: 600,
            heading: 0,
            pitch: 0,
            fov: 90,
          });
          if (imageUrl) {
            images[track.trackId] = imageUrl;
          }
        }
        setStreetViewImages(images);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks data');
    } finally {
      setLoading(false);
    }
  }, [useGoogleMaps]);

  useEffect(() => {
    loadTracksData();
  }, [loadTracksData]);

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
                <CardTitle className="text-2xl">Google Maps Integration</CardTitle>
                <CardDescription>
                  Maps Datasets API & Street View Publish API - Fallback to OpenWeatherMap
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
              <Button
                onClick={loadTracksData}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!googleMapsAvailable && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Google Maps API not configured
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set GOOGLE_MAPS_API_KEY environment variable to enable Google Maps features.
                    Currently using OpenWeatherMap fallback.
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
                    Using Maps Datasets API and Street View Publish API for enhanced track data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!useGoogleMaps && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Using OpenWeatherMap Fallback
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost-saving mode: Using OpenWeatherMap for weather data instead of Google Maps APIs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Status */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Maps Datasets API
              {useGoogleMaps && googleMapsAvailable && (
                <Badge variant="outline" className="ml-auto">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Provides custom map datasets for track locations, coordinates, and geographic data.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              {useGoogleMaps && googleMapsAvailable ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Enabled</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-muted-foreground">Using fallback</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Street View Publish API
              {useGoogleMaps && googleMapsAvailable && (
                <Badge variant="outline" className="ml-auto">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access Street View imagery for track locations and visual context.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              {useGoogleMaps && googleMapsAvailable ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Enabled</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-muted-foreground">Using fallback</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
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

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold">Loading Track Data...</p>
              <p className="text-sm text-muted-foreground mt-2">
                {useGoogleMaps && googleMapsAvailable
                  ? 'Fetching from Google Maps APIs'
                  : 'Using OpenWeatherMap fallback'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracks Grid */}
      {!loading && tracksData.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracksData.map((track) => {
            const streetViewUrl = streetViewImages[track.trackId];
            const isSelected = selectedTrack === track.trackId;

            return (
              <motion.div
                key={track.trackId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTrack(isSelected ? null : track.trackId)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{track.trackName}</CardTitle>
                        <CardDescription className="mt-1">
                          {track.address || `${track.coordinates.lat.toFixed(4)}, ${track.coordinates.lng.toFixed(4)}`}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          track.weatherFallback?.source === 'google_maps'
                            ? 'default'
                            : 'outline'
                        }
                        className="ml-2"
                      >
                        {track.weatherFallback?.source === 'google_maps'
                          ? 'Google Maps'
                          : 'OpenWeatherMap'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {streetViewUrl && (
                      <div className="mb-4 rounded-lg overflow-hidden border">
                        <img
                          src={streetViewUrl}
                          alt={`Street View: ${track.trackName}`}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            // Hide image if it fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {track.coordinates.lat.toFixed(6)}, {track.coordinates.lng.toFixed(6)}
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${track.coordinates.lat},${track.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on Google Maps
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Selected Track Details */}
      {selectedTrack && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {tracksData.find((t) => t.trackId === selectedTrack)?.trackName}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTrack(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {streetViewImages[selectedTrack] && (
                    <div className="rounded-lg overflow-hidden border">
                      <img
                        src={streetViewImages[selectedTrack]}
                        alt="Street View"
                        className="w-full h-96 object-cover"
                      />
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Coordinates</Label>
                      <p className="text-sm font-mono mt-1">
                        {tracksData
                          .find((t) => t.trackId === selectedTrack)
                          ?.coordinates.lat.toFixed(6)}
                        ,{' '}
                        {tracksData
                          .find((t) => t.trackId === selectedTrack)
                          ?.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data Source</Label>
                      <p className="text-sm mt-1">
                        {tracksData.find((t) => t.trackId === selectedTrack)?.weatherFallback
                          ?.source === 'google_maps'
                          ? 'Google Maps APIs'
                          : 'OpenWeatherMap (Fallback)'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}


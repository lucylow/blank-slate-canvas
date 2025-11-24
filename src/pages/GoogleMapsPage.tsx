// src/pages/GoogleMapsPage.tsx
// Google Maps Integration Page

import { RouteLayout } from '@/components/layout/RouteLayout';
import { GoogleMapsComprehensive } from '@/components/GoogleMapsComprehensive';
import { Globe } from 'lucide-react';

export default function GoogleMapsPage() {
  return (
    <RouteLayout>
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="space-y-3 text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-xl shadow-primary/20">
            <Globe className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Google Maps Integration
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Complete Google Maps Platform integration with all APIs: Air Quality, Solar, Weather, Pollen, 
            Maps, Places, Routes, Elevation, Time Zone, Address Validation, and more. 
            Comprehensive demo data fallbacks ensure all features work even without API keys.
          </p>
        </div>

        {/* Google Maps Component */}
        <GoogleMapsComprehensive />
      </div>
    </RouteLayout>
  );
}



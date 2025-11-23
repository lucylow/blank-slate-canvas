// src/pages/DriverFingerprintingPage.tsx
// Driver Fingerprinting & Coaching Page

import { RouteLayout } from '@/components/layout/RouteLayout';
import { Users, Target, AlertCircle, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DriverFingerprintingPage() {
  return (
    <RouteLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-4 shadow-xl shadow-purple-500/20">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Driver Fingerprinting & Coaching
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI-powered driver analysis with personalized coaching plans and performance insights
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-purple-500" />
                <CardTitle>Fingerprinting</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Generate unique driver fingerprints from telemetry data including braking consistency, throttle smoothness, and cornering style.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-purple-500" />
                <CardTitle>Coaching Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Real-time coaching alerts with priority levels (critical, high, medium, low) and improvement area identification.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-purple-500" />
                <CardTitle>Coaching Plans</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Personalized weekly coaching plans with specific drills, priority areas, and progress metrics.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-purple-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-500" />
                <CardTitle>Driver Comparison</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Compare drivers with teammates or baseline drivers to identify performance differences and improvement opportunities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Details */}
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader>
            <CardTitle>Available Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Features: Braking consistency, throttle smoothness, cornering style, lap consistency, tire stress index, overall score
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use the coaching page for detailed driver analysis and personalized coaching recommendations.
            </p>
          </CardContent>
        </Card>
      </div>
    </RouteLayout>
  );
}


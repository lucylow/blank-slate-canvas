// src/pages/DriverFingerprintingPage.tsx
// Driver Fingerprinting & Coaching Page

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  AlertCircle, 
  Award, 
  TrendingUp, 
  Loader2,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Activity,
  Gauge,
  Zap,
  UserPlus
} from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import { RouteLayout } from '@/components/layout/RouteLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

import { 
  getFingerprint, 
  getAlerts, 
  getCoachingPlan,
  compareDrivers,
  type DriverFingerprint,
  type CoachingAlert,
  type CoachingPlan
} from '@/api/driverFingerprint';

import {
  generateMockFingerprint,
  generateMockAlerts,
  generateMockCoachingPlan,
  generateMockComparison,
  MOCK_DRIVERS,
} from '@/lib/mockDriverFingerprintData';

import DriverProfileUpload from '@/components/DriverProfileUpload';

// Priority badge component
function PriorityBadge({ priority }: { priority: CoachingAlert['priority'] }) {
  const variants = {
    critical: 'bg-red-500/20 text-red-500 border-red-500/50',
    high: 'bg-orange-500/20 text-orange-500 border-orange-500/50',
    medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    low: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
  };
  
  return (
    <Badge variant="outline" className={variants[priority]}>
      {priority.toUpperCase()}
    </Badge>
  );
}

// Feature metric card
function FeatureMetric({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percentage = (value / max) * 100;
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}/{max}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

export default function DriverFingerprintingPage() {
  const [selectedDriver, setSelectedDriver] = useState<string>('driver-1');
  const [comparisonDriver, setComparisonDriver] = useState<string>('');
  const { isExpanded } = useSidebar();

  // Fetch fingerprint
  const { data: fingerprint, isLoading: fingerprintLoading, refetch: refetchFingerprint } = useQuery({
    queryKey: ['fingerprint', selectedDriver],
    queryFn: async () => {
      try {
        return await getFingerprint(selectedDriver);
      } catch (error) {
        console.warn('Using demo fingerprint data:', error);
        return generateMockFingerprint(selectedDriver);
      }
    },
  });

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts', selectedDriver],
    queryFn: async () => {
      try {
        return await getAlerts(selectedDriver);
      } catch (error) {
        console.warn('Using demo alerts data:', error);
        return generateMockAlerts(selectedDriver);
      }
    },
  });

  // Fetch coaching plan
  const { data: coachingPlan, isLoading: planLoading, refetch: refetchPlan } = useQuery({
    queryKey: ['coaching-plan', selectedDriver],
    queryFn: async () => {
      try {
        return await getCoachingPlan(selectedDriver);
      } catch (error) {
        console.warn('Using demo coaching plan data:', error);
        return generateMockCoachingPlan(selectedDriver);
      }
    },
  });

  // Fetch comparison
  const { data: comparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['driver-comparison', selectedDriver, comparisonDriver],
    queryFn: async () => {
      if (!comparisonDriver) return null;
      try {
        return await compareDrivers(selectedDriver, comparisonDriver);
      } catch (error) {
        console.warn('Comparison failed, using demo data:', error);
        return generateMockComparison(selectedDriver, comparisonDriver);
      }
    },
    enabled: !!comparisonDriver,
  });

  // Prepare radar chart data
  const radarData = fingerprint ? [
    { feature: 'Braking', value: fingerprint.features.braking_consistency },
    { feature: 'Throttle', value: fingerprint.features.throttle_smoothness },
    { feature: 'Cornering', value: fingerprint.features.cornering_style },
    { feature: 'Consistency', value: fingerprint.features.lap_consistency },
    { feature: 'Tire Mgmt', value: fingerprint.features.tire_stress_index },
  ] : [];

  // Prepare comparison chart data
  const comparisonData = comparison ? Object.keys(comparison.driver1 || {}).map(key => ({
    feature: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    driver1: comparison.driver1[key],
    driver2: comparison.driver2[key],
  })) : [];

  const isLoading = fingerprintLoading || alertsLoading || planLoading;

  return (
    <RouteLayout>
      <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl shadow-purple-500/20">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Driver Fingerprinting & Coaching
                </h1>
                <p className="text-xl text-muted-foreground mt-2">
                  AI-powered driver analysis with personalized coaching plans
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchFingerprint();
                refetchAlerts();
                refetchPlan();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Driver Selection */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Select Driver:</span>
            </div>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_DRIVERS.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        )}

        {/* Main Content Tabs */}
        {!isLoading && (
          <Tabs defaultValue="fingerprint" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fingerprint" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Fingerprint
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Alerts
                {alerts && alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {alerts.filter(a => a.priority === 'critical' || a.priority === 'high').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="coaching" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Coaching Plan
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Comparison
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Upload Profile
              </TabsTrigger>
            </TabsList>

            {/* Fingerprint Tab */}
            <TabsContent value="fingerprint" className="space-y-4">
              {fingerprint && (
                <>
                  {/* Overall Score Card */}
                  <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">Overall Performance Score</CardTitle>
                          <CardDescription>Comprehensive driver assessment</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-5xl font-bold text-purple-500">
                            {fingerprint.features.overall_score}
                          </div>
                          <div className="text-sm text-muted-foreground">out of 100</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress 
                        value={fingerprint.features.overall_score} 
                        className="h-3"
                      />
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Radar Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Profile</CardTitle>
                        <CardDescription>Multi-dimensional driver analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="feature" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
                            <Radar
                              name="Performance"
                              dataKey="value"
                              stroke="#a855f7"
                              fill="#a855f7"
                              fillOpacity={0.6}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Feature Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Detailed Metrics</CardTitle>
                        <CardDescription>Individual performance indicators</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FeatureMetric
                          label="Braking Consistency"
                          value={fingerprint.features.braking_consistency}
                        />
                        <FeatureMetric
                          label="Throttle Smoothness"
                          value={fingerprint.features.throttle_smoothness}
                        />
                        <FeatureMetric
                          label="Cornering Style"
                          value={fingerprint.features.cornering_style}
                        />
                        <FeatureMetric
                          label="Lap Consistency"
                          value={fingerprint.features.lap_consistency}
                        />
                        <FeatureMetric
                          label="Tire Stress Index"
                          value={fingerprint.features.tire_stress_index}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Session Info */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Activity className="w-4 h-4" />
                          <span>Session Type: {fingerprint.session_type || 'Race'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Gauge className="w-4 h-4" />
                          <span>Generated: {new Date(fingerprint.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4">
              {alerts && alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert
                        className={
                          alert.priority === 'critical'
                            ? 'border-red-500/50 bg-red-500/10'
                            : alert.priority === 'high'
                            ? 'border-orange-500/50 bg-orange-500/10'
                            : 'border-yellow-500/50 bg-yellow-500/10'
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {alert.priority === 'critical' ? (
                              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            ) : alert.priority === 'high' ? (
                              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                            ) : (
                              <Info className="w-5 h-5 text-yellow-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <AlertTitle className="flex items-center gap-2">
                                {alert.category}
                                <PriorityBadge priority={alert.priority} />
                              </AlertTitle>
                              <AlertDescription className="mt-2">
                                {alert.message}
                              </AlertDescription>
                              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Area: {alert.improvement_area}</span>
                                {alert.feature_value && (
                                  <span>Current: {alert.feature_value}/100</span>
                                )}
                                {alert.threshold && (
                                  <span>Target: {alert.threshold}/100</span>
                                )}
                                {alert.confidence && (
                                  <span>Confidence: {alert.confidence}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Alert>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold">No Active Alerts</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Driver performance is within acceptable parameters
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Coaching Plan Tab */}
            <TabsContent value="coaching" className="space-y-4">
              {coachingPlan && (
                <>
                  <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Personalized Coaching Plan
                      </CardTitle>
                      <CardDescription>
                        Generated on {new Date(coachingPlan.generated_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Priority Areas
                          </h3>
                          <ul className="space-y-2">
                            {coachingPlan.priority_areas.map((area, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                {area}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Weekly Focus
                          </h3>
                          <ul className="space-y-2">
                            {coachingPlan.weekly_focus.map((focus, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                {focus}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Specific Drills</CardTitle>
                      <CardDescription>Practice exercises for improvement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {coachingPlan.specific_drills.map((drill, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-semibold text-purple-500">
                              {idx + 1}
                            </div>
                            <p className="text-sm flex-1">{drill}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Progress Metrics</CardTitle>
                      <CardDescription>Target values for improvement</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FeatureMetric
                        label="Target Braking Consistency"
                        value={coachingPlan.progress_metrics.target_braking_consistency}
                      />
                      <FeatureMetric
                        label="Target Throttle Smoothness"
                        value={coachingPlan.progress_metrics.target_throttle_smoothness}
                      />
                      <FeatureMetric
                        label="Target Lap Consistency"
                        value={coachingPlan.progress_metrics.target_lap_consistency}
                      />
                      <FeatureMetric
                        label="Target Overall Score"
                        value={coachingPlan.progress_metrics.target_overall_score}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compare Drivers</CardTitle>
                  <CardDescription>Select a driver to compare performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Select value={comparisonDriver} onValueChange={setComparisonDriver}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select driver to compare" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_DRIVERS.filter(d => d.id !== selectedDriver).map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {comparisonDriver && (
                <>
                  {comparisonLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                  ) : comparison && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Comparison</CardTitle>
                        <CardDescription>
                          {MOCK_DRIVERS.find(d => d.id === selectedDriver)?.name} vs{' '}
                          {MOCK_DRIVERS.find(d => d.id === comparisonDriver)?.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={comparisonData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="feature" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="driver1" fill="#a855f7" name={MOCK_DRIVERS.find(d => d.id === selectedDriver)?.name} />
                            <Bar dataKey="driver2" fill="#10b981" name={MOCK_DRIVERS.find(d => d.id === comparisonDriver)?.name} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Upload Profile Tab */}
            <TabsContent value="upload" className="space-y-6">
              <DriverProfileUpload />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </RouteLayout>
  );
}

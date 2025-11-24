import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Eye, Download, Share2, ZoomIn, ZoomOut, Settings, Bell } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VisualizationControlsProps {
  selectedDriver: string;
}

const mockChartData = [
  { lap: 1, speed: 185, gForce: 2.1, tireWear: 65 },
  { lap: 2, speed: 188, gForce: 2.2, tireWear: 68 },
  { lap: 3, speed: 190, gForce: 2.3, tireWear: 70 },
  { lap: 4, speed: 192, gForce: 2.4, tireWear: 72 },
  { lap: 5, speed: 189, gForce: 2.3, tireWear: 74 },
];

export function VisualizationControls({ selectedDriver }: VisualizationControlsProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [selectedMetric, setSelectedMetric] = useState<string>('speed');
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleExport = (format: 'png' | 'pdf' | 'csv') => {
    console.log(`Exporting as ${format}`);
    // Implementation would export the current visualization
  };

  const handleShare = () => {
    console.log('Sharing visualization');
    // Implementation would share the visualization
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Interactive Charts</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="export">Export & Share</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Visualization Controls</CardTitle>
                  <CardDescription>Customize your data visualization</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Chart Type</label>
                  <Select value={chartType} onValueChange={(v) => setChartType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Metric</label>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="speed">Speed</SelectItem>
                      <SelectItem value="gForce">G-Force</SelectItem>
                      <SelectItem value="tireWear">Tire Wear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Actions</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('png')}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Visualization</CardTitle>
              <CardDescription>Interactive chart with tooltips and zoom controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
                <ResponsiveContainer width="100%" height={400}>
                  {chartType === 'line' && (
                    <LineChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="lap" tick={{ fill: 'currentColor' }} />
                      <YAxis tick={{ fill: 'currentColor' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  )}
                  {chartType === 'bar' && (
                    <BarChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="lap" tick={{ fill: 'currentColor' }} />
                      <YAxis tick={{ fill: 'currentColor' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey={selectedMetric} fill="#3b82f6" />
                    </BarChart>
                  )}
                  {chartType === 'area' && (
                    <AreaChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="lap" tick={{ fill: 'currentColor' }} />
                      <YAxis tick={{ fill: 'currentColor' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Push Notifications & Alerts</CardTitle>
              <CardDescription>Configure alert banners for urgent coaching actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tire Wear Alert:</strong> Rear left tire approaching critical wear (78%)
                  </AlertDescription>
                </Alert>
                <Alert className="border-yellow-500">
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Strategy Update:</strong> Optimal pit window opening in 2 laps
                  </AlertDescription>
                </Alert>
                <Alert className="border-green-500">
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Performance:</strong> New personal best lap time achieved!
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Alerts
                  </Button>
                  <Button variant="outline">
                    <Bell className="h-4 w-4 mr-2" />
                    Test Notification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export & Share</CardTitle>
              <CardDescription>Export reports and share snapshots or videos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Export Format</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" onClick={() => handleExport('png')}>
                      <Download className="h-4 w-4 mr-2" />
                      PNG Image
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('pdf')}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF Report
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      CSV Data
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Share Options</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Snapshot
                    </Button>
                    <Button variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Generate Shareable Link
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Exported reports include all current visualizations, metrics, and annotations 
                    for comprehensive race analysis and debrief sessions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}




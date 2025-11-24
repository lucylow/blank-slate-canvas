/**
 * Driver Profile Upload Component
 * 
 * Allows users to upload new driver profiles via JSON file or form input
 */

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  FileJson,
  Database,
  Sparkles
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import {
  uploadDriverProfile,
  uploadDriverProfileForm,
  uploadDriverProfileJSON,
  type DriverProfileUploadData,
} from '@/api/driverFingerprint';

interface UploadResult {
  success: boolean;
  message: string;
  profile?: any;
  fingerprint?: any;
  alerts?: any[];
  coaching_plan?: any;
  warning?: string;
}

export default function DriverProfileUpload() {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'form' | 'json'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<DriverProfileUploadData>({
    defaultValues: {
      driver_id: '',
      driver_name: '',
      car_number: '',
      chassis_number: '',
      vehicle_id: '',
      team: '',
      nationality: '',
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setError('Only JSON files are supported');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await uploadDriverProfile(selectedFile);
      setResult(uploadResult);
      
      if (uploadResult.success) {
        // Reset form and file selection
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload driver profile');
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (data: DriverProfileUploadData) => {
    if (!data.driver_id) {
      setError('Driver ID is required');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await uploadDriverProfileForm(data);
      setResult(uploadResult);
      
      if (uploadResult.success) {
        reset();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload driver profile');
    } finally {
      setUploading(false);
    }
  };

  const handleJSONSubmit = async (data: DriverProfileUploadData) => {
    if (!data.driver_id) {
      setError('Driver ID is required');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await uploadDriverProfileJSON(data);
      setResult(uploadResult);
      
      if (uploadResult.success) {
        reset();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload driver profile');
    } finally {
      setUploading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Upload Driver Profile
              </CardTitle>
              <CardDescription>
                Upload a new driver profile via JSON file or form input
              </CardDescription>
            </div>
            {result && (
              <Button variant="ghost" size="sm" onClick={clearResult}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'form' | 'json')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <FileJson className="w-4 h-4" />
                JSON File
              </TabsTrigger>
              <TabsTrigger value="form" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Form Input
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                JSON Data
              </TabsTrigger>
            </TabsList>

            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select JSON File</Label>
                  <div className="mt-2">
                    <Input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload a JSON file containing driver profile data. The file should include driver_id and optionally telemetry_data.
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileJson className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <Button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Profile
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Form Input Tab */}
            <TabsContent value="form" className="space-y-4">
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driver_id">
                      Driver ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="driver_id"
                      {...register('driver_id', { required: 'Driver ID is required' })}
                      placeholder="driver-123"
                    />
                    {errors.driver_id && (
                      <p className="text-sm text-destructive">{errors.driver_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="driver_name">Driver Name</Label>
                    <Input
                      id="driver_name"
                      {...register('driver_name')}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="car_number">Car Number</Label>
                    <Input
                      id="car_number"
                      {...register('car_number')}
                      placeholder="42"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chassis_number">Chassis Number</Label>
                    <Input
                      id="chassis_number"
                      {...register('chassis_number')}
                      placeholder="GR86-001-42"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_id">Vehicle ID</Label>
                    <Input
                      id="vehicle_id"
                      {...register('vehicle_id')}
                      placeholder="GR86-001-42"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Input
                      id="team"
                      {...register('team')}
                      placeholder="Velocity Racing"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    {...register('nationality')}
                    placeholder="USA"
                  />
                </div>

                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Profile
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* JSON Data Tab */}
            <TabsContent value="json" className="space-y-4">
              <form onSubmit={handleSubmit(handleJSONSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="json_driver_id">
                    Driver ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="json_driver_id"
                    {...register('driver_id', { required: 'Driver ID is required' })}
                    placeholder="driver-123"
                  />
                  {errors.driver_id && (
                    <p className="text-sm text-destructive">{errors.driver_id.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="json_driver_name">Driver Name</Label>
                    <Input
                      id="json_driver_name"
                      {...register('driver_name')}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="json_car_number">Car Number</Label>
                    <Input
                      id="json_car_number"
                      {...register('car_number')}
                      placeholder="42"
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Note: JSON upload method sends data as JSON request body. For telemetry data processing, 
                  include telemetry_data in the request.
                </p>

                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Upload Profile (JSON)
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Upload Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Success Result */}
      {result && result.success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Upload Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Profile Created</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>

              {result.profile && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Profile Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Driver ID:</span>{' '}
                      <span className="font-medium">{result.profile.driver_id}</span>
                    </div>
                    {result.profile.driver_name && (
                      <div>
                        <span className="text-muted-foreground">Name:</span>{' '}
                        <span className="font-medium">{result.profile.driver_name}</span>
                      </div>
                    )}
                    {result.profile.car_number && (
                      <div>
                        <span className="text-muted-foreground">Car #:</span>{' '}
                        <span className="font-medium">{result.profile.car_number}</span>
                      </div>
                    )}
                    {result.profile.team && (
                      <div>
                        <span className="text-muted-foreground">Team:</span>{' '}
                        <span className="font-medium">{result.profile.team}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.fingerprint && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Fingerprint Generated
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Overall Score: {result.fingerprint.features?.overall_score || 'N/A'}
                    </Badge>
                  </div>
                </div>
              )}

              {result.warning && (
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>{result.warning}</AlertDescription>
                </Alert>
              )}

              {result.alerts && result.alerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Coaching Alerts</h4>
                  <div className="space-y-1">
                    {result.alerts.slice(0, 3).map((alert: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="mr-2">
                        {alert.category}
                      </Badge>
                    ))}
                    {result.alerts.length > 3 && (
                      <span className="text-sm text-muted-foreground">
                        +{result.alerts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}


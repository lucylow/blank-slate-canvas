// src/pages/LovableCloudConfig.tsx
// Configuration status page for Lovable Cloud debugging

import React, { useEffect, useState } from 'react';
import { 
  getConnectionDiagnostics, 
  getCloudConfig,
  checkBackendHealth,
  testWebSocketConnection,
  formatHealthStatus 
} from '@/utils/lovableCloud';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Info, Copy } from 'lucide-react';
import { LovableCloudStatus } from '@/components/LovableCloudStatus';

export default function LovableCloudConfig() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wsTestResult, setWsTestResult] = useState<boolean | null>(null);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const diag = await getConnectionDiagnostics();
      setDiagnostics(diag);
      
      // Test WebSocket separately
      const wsResult = await testWebSocketConnection();
      setWsTestResult(wsResult);
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading && !diagnostics) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Lovable Cloud Configuration</h1>
        <p className="text-muted-foreground">
          Monitor and debug your Lovable Cloud deployment configuration
        </p>
      </div>

      <div className="grid gap-6 mb-6">
        {/* Health Status */}
        <LovableCloudStatus showDetails={true} />

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Connection Status
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDiagnostics}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {diagnostics && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border/50 bg-card/50">
                    <div className="flex items-center gap-2 mb-2">
                      {diagnostics.health.status === 'healthy' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-semibold">Backend API</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Status: {formatHealthStatus(diagnostics.health).label}</div>
                      {diagnostics.health.latency !== null && (
                        <div>Latency: {diagnostics.health.latency}ms</div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border/50 bg-card/50">
                    <div className="flex items-center gap-2 mb-2">
                      {wsTestResult === true ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : wsTestResult === false ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="font-semibold">WebSocket</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Status: {wsTestResult === true ? 'Connected' : wsTestResult === false ? 'Failed' : 'Unknown'}
                      </div>
                      <div className="font-mono text-xs break-all">
                        {diagnostics.config.wsUrl}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Details */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
          </CardHeader>
          <CardContent>
            {diagnostics && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Environment</h3>
                  <div className="grid md:grid-cols-3 gap-2 text-sm">
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-muted-foreground">Mode</div>
                      <div className="font-mono">{diagnostics.environment.mode}</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-muted-foreground">Development</div>
                      <div>{diagnostics.environment.isDev ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-muted-foreground">Production</div>
                      <div>{diagnostics.environment.isProd ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Service Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div className="p-3 rounded bg-muted/50 flex items-center justify-between">
                      <div>
                        <div className="text-muted-foreground">Lovable Cloud</div>
                        <div>{diagnostics.config.isLovableCloud ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                    <div className="p-3 rounded bg-muted/50 flex items-center justify-between">
                      <div>
                        <div className="text-muted-foreground">Backend URL</div>
                        <div className="font-mono text-xs break-all">
                          {diagnostics.config.backendUrl || '/api (relative)'}
                        </div>
                      </div>
                      {diagnostics.config.backendUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(diagnostics.config.backendUrl)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="p-3 rounded bg-muted/50 flex items-center justify-between">
                      <div>
                        <div className="text-muted-foreground">WebSocket URL</div>
                        <div className="font-mono text-xs break-all">
                          {diagnostics.config.wsUrl}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(diagnostics.config.wsUrl)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    {diagnostics.config.serviceName && (
                      <div className="p-3 rounded bg-muted/50">
                        <div className="text-muted-foreground">Service Name</div>
                        <div className="font-mono">{diagnostics.config.serviceName}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Environment Variables</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(diagnostics.envVars).map(([key, value]) => (
                      <div key={key} className="p-3 rounded bg-muted/50 flex items-center justify-between">
                        <div>
                          <div className="text-muted-foreground font-mono text-xs">{key}</div>
                          <div className="font-mono text-xs break-all mt-1">
                            {String(value)}
                          </div>
                        </div>
                        {value !== 'not set' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(String(value))}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Troubleshooting Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Backend Not Responding</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Verify backend service is deployed in Lovable Cloud</li>
                  <li>Check that health endpoint is accessible: <code className="bg-muted px-1 rounded">/health</code></li>
                  <li>Verify CORS configuration includes your frontend domain</li>
                  <li>Check backend logs in Lovable Cloud dashboard</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">WebSocket Connection Failed</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Ensure WebSocket endpoint is configured: <code className="bg-muted px-1 rounded">/ws</code></li>
                  <li>Verify proxy configuration in Lovable Cloud</li>
                  <li>Check that protocol matches (wss:// for HTTPS, ws:// for HTTP)</li>
                  <li>Test WebSocket connection directly using browser console</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Environment Variables</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Set <code className="bg-muted px-1 rounded">VITE_BACKEND_URL</code> if backend is on different subdomain</li>
                  <li>Set <code className="bg-muted px-1 rounded">VITE_BACKEND_WS_URL</code> for WebSocket connections</li>
                  <li>Use relative paths (<code className="bg-muted px-1 rounded">/api</code>) for automatic proxy routing</li>
                  <li>Verify environment variables are set in Lovable Cloud UI</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



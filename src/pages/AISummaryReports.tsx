// src/pages/AISummaryReports.tsx
import React, { useEffect, useState } from "react";
import { Loader2, FileText, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type Report = {
  id: string;
  filename: string;
  ext: string;
};

// Get AI Summary API base URL
// In dev: uses Vite proxy (/api/reports)
// In production: uses relative paths that Lovable Cloud can proxy
// Or explicit VITE_AI_SUMMARY_API env var if set
function getAISummaryApiBase(): string {
  const explicitUrl = import.meta.env.VITE_AI_SUMMARY_API;
  if (explicitUrl) {
    return explicitUrl;
  }
  // Use relative paths - Vite proxy in dev, Lovable Cloud proxy in production
  return '';
}

export default function AISummaryReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE = getAISummaryApiBase();

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Try to fetch from track analysis API first (main source)
    Promise.all([
      fetch(`${API_BASE}/api/reports/analysis`)
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            // Convert track analysis format to report format
            if (data.analyses && Array.isArray(data.analyses)) {
              return data.analyses
                .filter((a: any) => a.exists)
                .map((a: any) => ({
                  id: a.track_id,
                  filename: a.filename,
                  ext: a.filename.split('.').pop() || 'txt'
                }));
            }
          }
          return [];
        })
        .catch(() => []),
      // Fallback: try original AI summaries endpoint
      fetch(`${API_BASE}/api/reports`)
        .then(async (r) => {
          if (r.ok) {
            return r.json();
          }
          return [];
        })
        .catch(() => [])
    ])
      .then(([trackReports, originalReports]) => {
        // Merge reports, prefer track analysis reports
        const allReports = trackReports.length > 0 ? trackReports : originalReports;
        setReports(allReports || []);
        if (allReports && allReports.length) setSelected(allReports[0].id);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load AI summary reports:', err);
        setError(err instanceof Error ? err.message : 'Failed to load AI summary reports. Make sure the backend API is running.');
        setReports([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_BASE]);

  async function downloadPdf(id: string) {
    setLoadingPdf(true);
    try {
      const resp = await fetch(`${API_BASE}/api/reports/${id}/pdf`);
      if (!resp.ok) {
        const txt = await resp.text();
        setError(`PDF generation failed: ${txt}`);
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`Download failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingPdf(false);
    }
  }

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="max-w-6xl mx-auto py-16 px-6">
        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-2">AI Summary Reports</h1>
          <p className="text-gray-300 max-w-2xl">
            View and export AI-generated race analysis reports for each track
          </p>
        </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <Card className="lg:col-span-1 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full bg-gray-800" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No reports found.</p>
                <p className="text-xs mt-2">
                  Make sure the AI summaries server is running on port 8001
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <Card
                    key={r.id}
                    className={`cursor-pointer transition-all bg-gray-800 border ${
                      selected === r.id
                        ? "bg-[#EB0A1E]/10 border-[#EB0A1E]"
                        : "border-gray-700 hover:border-gray-600 hover:bg-gray-750"
                    }`}
                    onClick={() => setSelected(r.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {r.id.replace(/_/g, " ").replace(/\b\w/g, (l) =>
                              l.toUpperCase()
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 truncate">
                            {r.filename}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {r.ext.toUpperCase()} file
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPdf(r.id);
                          }}
                          disabled={loadingPdf}
                          className="shrink-0 text-gray-300 hover:text-white hover:bg-gray-700"
                        >
                          {loadingPdf ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800"
              style={{ height: "720px" }}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : selected ? (
                (() => {
                  // Try track analysis endpoint first, then fallback to original
                  const trackAnalysisUrl = `${API_BASE}/api/reports/analysis/${selected}`;
                  const originalUrl = `${API_BASE}/api/reports/${selected}/html`;
                  
                  return (
                    <iframe
                      src={originalUrl}
                      title={`report-${selected}`}
                      className="w-full h-full border-0"
                      onError={(e) => {
                        console.error("Failed to load report preview:", e);
                        // Try loading raw text and displaying it
                        fetch(trackAnalysisUrl)
                          .then(async (r) => {
                            if (r.ok) {
                              const text = await r.text();
                              // Create a simple HTML preview
                              const previewHtml = `
                                <html>
                                  <head>
                                    <style>
                                      body { 
                                        font-family: monospace; 
                                        padding: 20px; 
                                        background: #0a0a0a; 
                                        color: #fff;
                                        white-space: pre-wrap;
                                      }
                                    </style>
                                  </head>
                                  <body>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
                                </html>
                              `;
                              const blob = new Blob([previewHtml], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              const iframe = document.querySelector('iframe[title*="report"]') as HTMLIFrameElement;
                              if (iframe) {
                                iframe.src = url;
                              }
                            } else {
                              setError("Failed to load report preview");
                            }
                          })
                          .catch(() => setError("Failed to load report preview"));
                      }}
                    />
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileText className="w-16 h-16 text-gray-400 mb-4 opacity-50" />
                  <p className="text-gray-400">
                    Select a report from the list to preview
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </section>
    </main>
  );
}
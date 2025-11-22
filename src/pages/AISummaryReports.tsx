// src/pages/AISummaryReports.tsx
import React, { useEffect, useState } from "react";

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
  const API_BASE = getAISummaryApiBase();

  useEffect(() => {
    fetch(`${API_BASE}/api/reports`)
      .then(r => r.json())
      .then((j) => {
        setReports(j || []);
        if (j && j.length) setSelected(j[0].id);
      })
      .catch(err => {
        console.error('Failed to load AI summary reports:', err);
      });
  }, [API_BASE]);

  async function downloadPdf(id: string) {
    setLoadingPdf(true);
    try {
      const resp = await fetch(`${API_BASE}/api/reports/${id}/pdf`);
      if (!resp.ok) {
        const txt = await resp.text();
        alert("PDF error: " + txt);
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
      alert("Download failed: " + e);
    } finally {
      setLoadingPdf(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">AI Summary Reports</h1>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <h2 className="font-semibold">Reports</h2>
          <div className="mt-2 space-y-2">
            {reports.map(r => (
              <div key={r.id} className={`p-2 border rounded ${selected === r.id ? "bg-gray-100" : ""}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{r.id}</div>
                    <div className="text-xs text-gray-500">{r.filename}</div>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => setSelected(r.id)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => downloadPdf(r.id)}
                      disabled={loadingPdf}
                      className="px-2 py-1 border rounded bg-black text-white text-sm"
                    >
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-sm text-gray-500">No reports found.</div>
            )}
          </div>
        </div>
        <div className="col-span-2">
          <h2 className="font-semibold">Preview</h2>
          <div className="mt-2 border rounded p-2" style={{ height: "720px" }}>
            {selected ? (
              <iframe
                src={`${API_BASE}/api/reports/${selected}/html`}
                title={`report-${selected}`}
                style={{ width: "100%", height: "100%", border: "none" }}
                onError={(e) => {
                  console.error('Failed to load report preview:', e);
                }}
              />
            ) : (
              <div className="p-6 text-gray-500">Select a report to preview.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
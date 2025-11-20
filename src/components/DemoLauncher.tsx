// src/components/DemoLauncher.tsx
import React from "react";

const DemoLauncher: React.FC = () => {
  return (
    <div className="rounded-lg border border-gray-700 bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <h3 className="text-xl font-semibold">Live demo</h3>
      <p className="mt-2 text-gray-300">Start the local demo server to replay a telemetry stream and drive the PitWall UI (WebSocket).</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="/demo"
          className="rounded bg-[#EB0A1E] px-4 py-2 text-sm font-semibold hover:bg-red-700"
        >
          Open Demo UI
        </a>
        <a
          href="http://localhost:8081/predict_tire/road_america/GR86-DEMO-01"
          target="_blank"
          rel="noreferrer"
          className="rounded border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
        >
          Test Predict Endpoint
        </a>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Tip: run <code>npm run demo-server</code> then open this page.
      </div>
    </div>
  );
};

export default DemoLauncher;


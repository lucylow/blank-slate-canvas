import React, { useState } from "react";
import { Link } from "react-router-dom";

import DemoLauncher from "@/components/DemoLauncher";
import ExplainModal from "@/components/ExplainModal";

const Index: React.FC = () => {
  const [explainOpen, setExplainOpen] = useState(false);
  const [evidence, setEvidence] = useState<string[]>([]);

  // sample evidence used for demo - in your app you'll fetch these from /predict_tire
  const openExplain = () => {
    setEvidence([
      "High tire_stress in S2 (braking-dominant sector)",
      "Avg speed on long straight increased over last 3 laps",
      "Driver brake bias changed -> increased rear slip"
    ]);
    setExplainOpen(true);
  };

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="max-w-6xl mx-auto py-16 px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              PitWall A.I. — Real-time race strategy & tire intelligence
            </h1>
            <p className="mt-3 text-gray-300 max-w-2xl">
              Predict tire loss, recommend pit windows, and get explainable, radio-ready guidance — live.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 rounded bg-[#EB0A1E] px-4 py-2 text-sm font-semibold shadow hover:bg-red-700 transition-colors"
              >
                ▶ Run Demo
              </Link>
              <Link
                to="/strategies"
                className="inline-flex items-center gap-2 rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
              >
                View Race Strategies
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={openExplain}
                className="inline-flex items-center gap-2 rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
              >
                View Demo Explanation
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <DemoLauncher />
        </div>

        {/* Quick Links Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/dashboard"
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">Live Dashboard</h3>
            <p className="text-gray-400 text-sm">
              Real-time race data, telemetry, and live insights
            </p>
          </Link>
          <Link
            to="/strategies"
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">Race Strategies</h3>
            <p className="text-gray-400 text-sm">
              Explore winning strategies and pit window optimization
            </p>
          </Link>
          <Link
            to="/pitwall"
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">PitWall Console</h3>
            <p className="text-gray-400 text-sm">
              Strategy console with AI-powered recommendations
            </p>
          </Link>
          <Link
            to="/analytics"
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">Analytics</h3>
            <p className="text-gray-400 text-sm">
              Performance metrics and detailed analysis
            </p>
          </Link>
          <Link
            to="/coaching"
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">Coaching</h3>
            <p className="text-gray-400 text-sm">
              Driver coaching tools and insights
            </p>
          </Link>
          <Link
            to="/agents"
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">AI Agents</h3>
            <p className="text-gray-400 text-sm">
              Intelligent agents for race strategy
            </p>
          </Link>
        </div>
      </section>

      <ExplainModal open={explainOpen} onClose={() => setExplainOpen(false)} evidence={evidence} />
    </main>
  );
};

export default Index;

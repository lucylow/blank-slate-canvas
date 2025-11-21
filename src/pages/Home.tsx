// src/pages/Home.tsx

import React, { useState } from "react";

import DemoLauncher from "@/components/DemoLauncher";
import ExplainModal from "@/components/ExplainModal";

const Home: React.FC = () => {
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
          <img
            src="/mnt/data/A_vector-based_logo_design_for_&quot;PitWall_AI&quot;_featur.png"
            alt="PitWall AI logo"
            className="w-36 h-auto"
          />
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              PitWall A.I. — Real-time race strategy & tire intelligence
            </h1>
            <p className="mt-3 text-gray-300 max-w-2xl">
              Predict tire loss, recommend pit windows, and get explainable, radio-ready guidance — live.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/demo"
                className="inline-flex items-center gap-2 rounded bg-[#EB0A1E] px-4 py-2 text-sm font-semibold shadow hover:bg-red-700"
              >
                ▶ Run Demo
              </a>
              <a
                href="/assets/demo.mp4"
                className="inline-flex items-center gap-2 rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
              >
                ▶ Watch 3-min Video
              </a>
              <button
                onClick={openExplain}
                className="inline-flex items-center gap-2 rounded border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
              >
                View Demo Explanation
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <DemoLauncher />
        </div>
      </section>

      <ExplainModal open={explainOpen} onClose={() => setExplainOpen(false)} evidence={evidence} />
    </main>
  );
};

export default Home;


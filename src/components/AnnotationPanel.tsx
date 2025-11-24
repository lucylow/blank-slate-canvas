import React from 'react';
import VideoAnalysisCard from './VideoAnalysisCard';
import analysesData from '../content/video-analyses.json';

export default function AnnotationPanel() {
  if (!analysesData || !Array.isArray(analysesData) || analysesData.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No annotations available.
      </div>
    );
  }

  return (
    <section aria-labelledby="annotations-heading" className="space-y-4 p-4">
      <h3 id="annotations-heading" className="text-xl font-semibold">
        Annotations & Agent Analysis
      </h3>
      <div className="grid gap-4">
        {analysesData.map((analysis) => (
          <VideoAnalysisCard key={analysis.id} analysis={analysis} />
        ))}
      </div>
    </section>
  );
}

/**
 * ExplanationViewer Component - Displays AI-generated explanations for predictions
 * Shows top-3 evidence-based explanations with SHAP values, confidence scores, and recommendations
 */
import React, { useState, useEffect } from 'react';
import './ExplanationViewer.css';

interface Explanation {
  explanation_id: string;
  prediction_type: string;
  prediction_value: number;
  top_evidence: Evidence[];
  evidence_frames: EvidenceFrame[];
  human_readable: HumanReadable;
  confidence: Confidence;
  shap_values?: Record<string, ShapValue>;
  generated_at: string;
  model_version: string;
}

interface Evidence {
  rank: number;
  feature: string;
  importance: number;
  impact: 'positive' | 'negative';
  actual_value: number;
  description: string;
  impact_strength: 'high' | 'medium' | 'low';
  evidence_strength: number;
}

interface EvidenceFrame {
  feature: string;
  importance: number;
  impact: string;
  actual_value: number;
  description: string;
  evidence_type: string;
  supporting_data: any;
  contextual_insight: string;
  mini_trace?: MiniTrace;
}

interface MiniTrace {
  timestamps: number[];
  values: number[];
  units: string;
}

interface HumanReadable {
  title: string;
  summary: string;
  key_factors: string[];
  main_contributors: string;
  recommendation?: Recommendation[];
  confidence_note: string;
}

interface Recommendation {
  feature: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  expected_benefit?: string;
}

interface Confidence {
  overall: number;
  coverage: number;
  reliability: 'high' | 'medium' | 'low';
  factors_considered: number;
}

interface ShapValue {
  value: number;
  absolute_value: number;
  direction: 'positive' | 'negative';
}

interface ExplanationViewerProps {
  prediction?: number;
  model?: any;
  features?: Record<string, number>;
  predictionType?: string;
  explanation?: Explanation;
}

const ExplanationViewer: React.FC<ExplanationViewerProps> = ({
  prediction,
  model,
  features,
  predictionType = 'tire_degradation',
  explanation: providedExplanation
}) => {
  const [explanation, setExplanation] = useState<Explanation | null>(providedExplanation || null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'evidence' | 'technical'>('summary');

  // Generate explanation when props change
  useEffect(() => {
    if ((prediction !== undefined && features) && !providedExplanation) {
      generateExplanation();
    }
  }, [prediction, features, predictionType]);

  const generateExplanation = async () => {
    if (!prediction || !features) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/explanations/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prediction_type: predictionType,
          model: model || {},
          features: features,
          prediction: prediction,
          request_id: `req_${Date.now()}`
        })
      });

      const result = await response.json();
      if (result.success && result.explanation) {
        setExplanation(result.explanation);
      } else {
        console.error('Failed to generate explanation:', result.error);
      }
    } catch (error) {
      console.error('Error generating explanation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="explanation-loading">
        <div className="loading-spinner"></div>
        <p>Generating AI explanation...</p>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="explanation-placeholder">
        <p>Explanation will appear here once prediction is generated</p>
      </div>
    );
  }

  return (
    <div className="explanation-viewer">
      <div className="explanation-header">
        <h3>AI Explanation</h3>
        <div className="confidence-badge">
          <span className={`confidence-level ${explanation.confidence.reliability}`}>
            {explanation.confidence.reliability} confidence
          </span>
          <span className="confidence-score">
            {Math.round(explanation.confidence.overall * 100)}%
          </span>
        </div>
      </div>

      <div className="explanation-tabs">
        <button
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`tab-button ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          Evidence
        </button>
        <button
          className={`tab-button ${activeTab === 'technical' ? 'active' : ''}`}
          onClick={() => setActiveTab('technical')}
        >
          Technical
        </button>
      </div>

      <div className="explanation-content">
        {activeTab === 'summary' && (
          <SummaryView explanation={explanation} />
        )}
        {activeTab === 'evidence' && (
          <EvidenceView explanation={explanation} />
        )}
        {activeTab === 'technical' && (
          <TechnicalView explanation={explanation} />
        )}
      </div>
    </div>
  );
};

const SummaryView: React.FC<{ explanation: Explanation }> = ({ explanation }) => (
  <div className="summary-view">
    <div className="explanation-card">
      <h4>{explanation.human_readable.title}</h4>
      <p className="summary-text">{explanation.human_readable.summary}</p>

      <div className="key-factors">
        <h5>Key Factors:</h5>
        <ul>
          {explanation.human_readable.key_factors.map((factor, index) => (
            <li key={index}>{factor}</li>
          ))}
        </ul>
      </div>

      {explanation.human_readable.recommendation && explanation.human_readable.recommendation.length > 0 && (
        <div className="recommendations">
          <h5>Recommendations:</h5>
          {explanation.human_readable.recommendation.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className={`priority-badge ${rec.priority}`}>
                {rec.priority}
              </span>
              <span className="recommendation-text">{rec.recommendation}</span>
              {rec.expected_benefit && (
                <span className="expected-benefit">{rec.expected_benefit}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="confidence-note">
        <small>{explanation.human_readable.confidence_note}</small>
      </div>
    </div>
  </div>
);

const EvidenceView: React.FC<{ explanation: Explanation }> = ({ explanation }) => (
  <div className="evidence-view">
    <h4>Evidence Breakdown</h4>

    <div className="evidence-cards">
      {explanation.top_evidence.map((evidence, index) => (
        <EvidenceCard
          key={evidence.feature}
          evidence={evidence}
          rank={index + 1}
        />
      ))}
    </div>

    {explanation.evidence_frames && explanation.evidence_frames.length > 0 && (
      <div className="evidence-frames">
        <h5>Supporting Evidence</h5>
        {explanation.evidence_frames.map((frame, index) => (
          <EvidenceFrame key={index} frame={frame} />
        ))}
      </div>
    )}
  </div>
);

const EvidenceCard: React.FC<{ evidence: Evidence; rank: number }> = ({ evidence, rank }) => (
  <div className={`evidence-card impact-${evidence.impact_strength}`}>
    <div className="evidence-header">
      <div className="rank-badge">#{rank}</div>
      <div className="impact-indicator">
        <div className={`impact-dot ${evidence.impact_strength}`} />
        <span className="impact-text">{evidence.impact_strength} impact</span>
      </div>
    </div>

    <div className="evidence-content">
      <h5>{evidence.description}</h5>
      <div className="evidence-metrics">
        <div className="metric">
          <span>Importance:</span>
          <span className="value">
            {(evidence.importance * 100).toFixed(1)}%
          </span>
        </div>
        <div className="metric">
          <span>Value:</span>
          <span className="value">{evidence.actual_value.toFixed(3)}</span>
        </div>
        <div className="metric">
          <span>Evidence Strength:</span>
          <span className="value">{Math.round(evidence.evidence_strength)}%</span>
        </div>
      </div>

      <div className="impact-direction">
        <span className={`direction ${evidence.impact}`}>
          {evidence.impact === 'positive' ? '↑ Increases' : '↓ Decreases'} prediction
        </span>
      </div>
    </div>
  </div>
);

const EvidenceFrame: React.FC<{ frame: EvidenceFrame }> = ({ frame }) => {
  const maxValue = frame.mini_trace ? Math.max(...frame.mini_trace.values) : 1;
  
  return (
    <div className="evidence-frame">
      <div className="frame-header">
        <span className="frame-type">{frame.evidence_type.replace(/_/g, ' ')}</span>
        <span className="frame-importance">
          {(frame.importance * 100).toFixed(1)}% weight
        </span>
      </div>

      <p className="contextual-insight">{frame.contextual_insight}</p>

      {frame.mini_trace && (
        <div className="mini-trace">
          <div className="trace-header">
            <span>Telemetry Pattern</span>
          </div>
          <div className="trace-visualization">
            <div className="sparkline">
              {frame.mini_trace.values.map((value, index) => (
                <div
                  key={index}
                  className="sparkline-bar"
                  style={{
                    height: `${(value / maxValue) * 100}%`
                  }}
                />
              ))}
            </div>
          </div>
          <div className="trace-labels">
            <span>Min: {Math.min(...frame.mini_trace.values).toFixed(1)}</span>
            <span>Max: {Math.max(...frame.mini_trace.values).toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const TechnicalView: React.FC<{ explanation: Explanation }> = ({ explanation }) => (
  <div className="technical-view">
    <h4>Technical Details</h4>

    <div className="technical-grid">
      <div className="tech-item">
        <span className="tech-label">Explanation ID:</span>
        <span className="tech-value">{explanation.explanation_id}</span>
      </div>
      <div className="tech-item">
        <span className="tech-label">Model Version:</span>
        <span className="tech-value">{explanation.model_version}</span>
      </div>
      <div className="tech-item">
        <span className="tech-label">Generated At:</span>
        <span className="tech-value">
          {new Date(explanation.generated_at).toLocaleString()}
        </span>
      </div>
      <div className="tech-item">
        <span className="tech-label">Coverage:</span>
        <span className="tech-value">
          {Math.round(explanation.confidence.coverage * 100)}%
        </span>
      </div>
    </div>

    {explanation.shap_values && Object.keys(explanation.shap_values).length > 0 && (
      <div className="shap-values">
        <h5>Feature Importance (SHAP Values)</h5>
        <div className="shap-list">
          {Object.entries(explanation.shap_values).map(([feature, data]) => {
            const maxAbsValue = Math.max(
              ...Object.values(explanation.shap_values || {}).map(d => Math.abs(d.absolute_value))
            );
            const widthPercentage = maxAbsValue > 0 
              ? Math.min(100, (Math.abs(data.absolute_value) / maxAbsValue) * 100)
              : 0;
            
            return (
              <div key={feature} className="shap-item">
                <span className="shap-feature">{feature.replace(/_/g, ' ')}</span>
                <div className="shap-bar-container">
                  <div
                    className={`shap-bar ${data.direction}`}
                    style={{ width: `${widthPercentage}%` }}
                  />
                </div>
                <span className="shap-value">{data.value.toFixed(4)}</span>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
);

export default ExplanationViewer;


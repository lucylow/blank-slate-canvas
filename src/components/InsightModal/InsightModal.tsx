import React from 'react';
import './InsightModal.css';

interface EvidenceItem {
  lap: number;
  sector: number;
  meta_time: string;
  mini_trace?: unknown;
}

interface FeatureItem {
  name: string;
  value: number | string;
}

interface Insight {
  insight_id: string;
  track: string;
  chassis: string;
  created_at: string;
  model_version?: string;
  predictions?: Record<string, number | string>;
  explanation?: {
    top_features?: FeatureItem[];
    evidence?: EvidenceItem[];
  };
  recommendations?: Array<{
    priority: string;
    message: string;
    action?: string;
  }>;
}

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: Insight | null;
}

const InsightModal: React.FC<InsightModalProps> = ({ isOpen, onClose, insight }) => {
  if (!isOpen || !insight) return null;

  const renderEvidence = (evidence: EvidenceItem[] | undefined) => {
    if (!evidence || !Array.isArray(evidence)) return null;

    return (
      <div className="evidence-section">
        <h4>Evidence</h4>
        <div className="evidence-list">
          {evidence.map((item, index) => (
            <div key={index} className="evidence-item">
              <div className="evidence-meta">
                <span>Lap {item.lap}</span>
                <span>Sector {item.sector}</span>
                <span>{new Date(item.meta_time).toLocaleTimeString()}</span>
              </div>
              {item.mini_trace && (
                <div className="mini-trace">
                  <span>Trace: {JSON.stringify(item.mini_trace)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFeatures = (features: FeatureItem[] | undefined) => {
    if (!features || !Array.isArray(features)) return null;

    return (
      <div className="features-section">
        <h4>Feature Contributions</h4>
        <div className="features-list">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <span className="feature-name">{feature.name}</span>
              <div className="feature-bar">
                <div 
                  className="feature-fill"
                  style={{ 
                    width: `${Math.min(100, Math.abs(typeof feature.value === 'number' ? feature.value : 0) * 100)}%`,
                    backgroundColor: (typeof feature.value === 'number' && feature.value > 0) ? '#10B981' : '#EF4444'
                  }}
                />
              </div>
              <span className="feature-value">
                {typeof feature.value === 'number' ? feature.value.toFixed(4) : feature.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="insight-modal-overlay" onClick={onClose}>
      <div className="insight-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Insight Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="insight-meta">
            <div className="meta-item">
              <strong>Track:</strong> {insight.track}
            </div>
            <div className="meta-item">
              <strong>Chassis:</strong> {insight.chassis}
            </div>
            {insight.model_version && (
              <div className="meta-item">
                <strong>Model:</strong> {insight.model_version}
              </div>
            )}
            <div className="meta-item">
              <strong>Generated:</strong> {new Date(insight.created_at).toLocaleString()}
            </div>
          </div>

          {insight.predictions && (
            <div className="predictions-section">
              <h3>Predictions</h3>
              <div className="predictions-grid">
                {Object.entries(insight.predictions).map(([key, value]) => (
                  <div key={key} className="prediction-item">
                    <span className="prediction-label">
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="prediction-value">
                      {typeof value === 'number' ? value.toFixed(3) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insight.explanation && (
            <>
              {renderFeatures(insight.explanation.top_features)}
              {renderEvidence(insight.explanation.evidence)}
            </>
          )}

          {insight.recommendations && (
            <div className="recommendations-section">
              <h3>Recommendations</h3>
              <div className="recommendations-list">
                {insight.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <span className={`priority-badge ${rec.priority}`}>
                      {rec.priority}
                    </span>
                    <span className="recommendation-text">{rec.message}</span>
                    {rec.action && (
                      <span className="recommendation-action">{rec.action}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightModal;


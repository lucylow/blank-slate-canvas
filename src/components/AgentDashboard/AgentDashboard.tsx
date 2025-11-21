import React from 'react';
import { useAgentSystem, type Insight } from '../../hooks/useAgentSystem';
import InsightModal from '../InsightModal/InsightModal';
import RealTimeMetrics from '../RealTimeMetrics/RealTimeMetrics';
import './AgentDashboard.css';

const AgentDashboard: React.FC = () => {
  const {
    agents,
    insights,
    queueStats,
    selectedInsight,
    isModalOpen,
    setIsModalOpen,
    fetchInsightDetails,
    clearInsights
  } = useAgentSystem();

  const getAgentStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#10B981';
      case 'idle': return '#6B7280';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityBadge = (priority?: string): string => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      normal: 'bg-blue-500',
      low: 'bg-gray-500'
    };
    return colors[priority || 'normal'] || colors.normal;
  };

  return (
    <div className="agent-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>PitWall AI Agent System</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-label">Active Agents</span>
            <span className="stat-value">
              {agents.filter(a => a.status === 'active').length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Pending Tasks</span>
            <span className="stat-value">{queueStats.tasksLength || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Recent Insights</span>
            <span className="stat-value">{insights.length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Left Panel - Agents & Queues */}
        <div className="left-panel">
          <div className="card">
            <h3>AI Agents</h3>
            <div className="agents-list">
              {agents.length > 0 ? (
                agents.map(agent => (
                  <div key={agent.id} className="agent-item">
                    <div className="agent-header">
                      <span className="agent-name">{agent.id}</span>
                      <div 
                        className="status-indicator"
                        style={{ backgroundColor: getAgentStatusColor(agent.status) }}
                      />
                    </div>
                    <div className="agent-details">
                      <span>Types: {agent.types?.join(', ') || 'N/A'}</span>
                      <span>Tracks: {agent.tracks?.join(', ') || 'All'}</span>
                      <span>Capacity: {agent.capacity || 1}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No agents registered. Waiting for agents to connect...</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Queue Status</h3>
            <div className="queue-stats">
              <div className="queue-item">
                <span>Tasks Stream</span>
                <span className="queue-count">{queueStats.tasksLength || 0}</span>
              </div>
              <div className="queue-item">
                <span>Results Stream</span>
                <span className="queue-count">{queueStats.resultsLength || 0}</span>
              </div>
              {(queueStats.inboxLengths || []).map(queue => (
                <div key={queue.agentId} className="queue-item">
                  <span>{queue.agentId} Inbox</span>
                  <span className="queue-count">{queue.length}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Insights */}
        <div className="right-panel">
          <div className="card">
            <div className="insights-header">
              <h3>Real-Time Insights</h3>
              <button 
                className="clear-btn"
                onClick={clearInsights}
              >
                Clear All
              </button>
            </div>
            <div className="insights-list">
              {insights.map(insight => (
                <div 
                  key={insight.insight_id} 
                  className={`insight-card ${getPriorityBadge(insight.priority)}`}
                  onClick={() => fetchInsightDetails(insight.insight_id)}
                >
                  <div className="insight-header">
                    <span className="track-badge">{insight.track}</span>
                    <span className="chassis">#{insight.chassis}</span>
                    <span className="timestamp">
                      {new Date(insight.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="insight-content">
                    <h4>{insight.type?.replace('_', ' ') || 'Insight'}</h4>
                    
                    {insight.predictions && (
                      <div className="predictions">
                        {insight.predictions.predicted_loss_per_lap_seconds !== undefined && (
                          <div className="prediction">
                            <span>Loss/Lap:</span>
                            <span className="value">
                              {insight.predictions.predicted_loss_per_lap_seconds.toFixed(3)}s
                            </span>
                          </div>
                        )}
                        {insight.predictions.laps_until_0_5s_loss !== undefined && (
                          <div className="prediction">
                            <span>Laps until 0.5s loss:</span>
                            <span className="value">
                              {insight.predictions.laps_until_0_5s_loss}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {insight.explanation?.top_features && (
                      <div className="features">
                        <strong>Key Factors:</strong>
                        {insight.explanation.top_features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="feature">
                            {feature.name}: {typeof feature.value === 'number' 
                              ? feature.value.toFixed(3) 
                              : feature.value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {insights.length === 0 && (
                <div className="empty-state">
                  <p>No insights yet. Waiting for telemetry data...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <RealTimeMetrics agents={agents} insights={insights} />

      {/* Insight Modal */}
      <InsightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        insight={selectedInsight}
      />
    </div>
  );
};

export default AgentDashboard;


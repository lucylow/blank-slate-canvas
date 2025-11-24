// src/components/InsightModal.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Brain, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  MapPin, 
  Car, 
  Clock, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Activity,
  Zap,
  Target
} from 'lucide-react';
import { useAgentStore } from '../stores/agentStore';
import { Badge } from '@/components/ui/badge';

const INSIGHTS_API = import.meta.env.VITE_INSIGHTS_API || '/api/insights';

export const InsightModal: React.FC<{ id: string; onClose: () => void }> = ({ id, onClose }) => {
  const getInsight = useAgentStore((s) => s.getInsight);
  const setInsightFull = useAgentStore((s) => s.setInsightFull);
  const [loading, setLoading] = useState(false);
  const cached = getInsight(id);

  useEffect(() => {
    if (!id) return;
    if (cached && cached.explanation && cached.evidence) return; // already full

    // improved fetch with retry
    let cancelled = false;
    async function loadWithRetry(retries = 3, backoff = 300) {
      for (let i = 0; i < retries && !cancelled; i++) {
        try {
          setLoading(true);
          const res = await fetch(`${INSIGHTS_API}/${id}`);
          if (!res.ok) throw new Error('http ' + res.status);
          const json = await res.json();
          if (cancelled) return;
          setInsightFull(id, json);
          return;
        } catch (e) {
          if (i === retries - 1) console.error('final insight fetch fail', e);
          await new Promise((r) => setTimeout(r, backoff * Math.pow(2, i)));
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    }
    loadWithRetry();
    return () => { cancelled = true; };
  }, [id, cached, setInsightFull]);

  const insight = getInsight(id);
  if (!insight) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Just now';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getInsightType = (summary?: string) => {
    if (!summary) return 'info';
    const lower = summary.toLowerCase();
    if (lower.includes('alert') || lower.includes('warning') || lower.includes('critical')) return 'alert';
    if (lower.includes('opportunity') || lower.includes('improve') || lower.includes('optimize')) return 'opportunity';
    return 'info';
  };

  const insightType = getInsightType(insight.summary);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1724] via-[#1a1f2e] to-[#0f1724] border border-gray-800/50 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient accent */}
          <div className="relative bg-gradient-to-r from-[#EB0A1E]/10 via-[#EB0A1E]/5 to-transparent border-b border-gray-800/50">
            <div className="flex items-start justify-between p-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[#EB0A1E]/20 to-[#EB0A1E]/10 border border-[#EB0A1E]/30">
                    <Brain className="w-5 h-5 text-[#EB0A1E]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      Live Insight
                      <Badge className="bg-[#EB0A1E]/20 text-[#EB0A1E] border-[#EB0A1E]/30 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Generated
                      </Badge>
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {insight.summary || 'Detailed analysis and predictions'}
                    </p>
                  </div>
                </div>

                {/* Metadata badges */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {insight.track && (
                    <Badge variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-300">
                      <MapPin className="w-3 h-3 mr-1.5" />
                      {insight.track}
                    </Badge>
                  )}
                  {insight.chassis && (
                    <Badge variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-300">
                      <Car className="w-3 h-3 mr-1.5" />
                      {insight.chassis}
                    </Badge>
                  )}
                  {insight.model_version && (
                    <Badge variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-300">
                      <Activity className="w-3 h-3 mr-1.5" />
                      v{insight.model_version}
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-300">
                    <Clock className="w-3 h-3 mr-1.5" />
                    {formatDate(insight.created_at)}
                  </Badge>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="ml-4 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200 border border-gray-700/50 hover:border-gray-600"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#EB0A1E] animate-spin mb-4" />
                  <p className="text-gray-400">Loading detailed evidence...</p>
                </div>
              ) : (
                <>
                  {/* Predictions Section */}
                  {insight.predictions && Object.keys(insight.predictions).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-[#EB0A1E]/10 border border-[#EB0A1E]/20">
                          <TrendingUp className="w-4 h-4 text-[#EB0A1E]" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Predictions</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(insight.predictions).map(([key, value], idx) => (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 + idx * 0.05 }}
                            className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30 hover:border-[#EB0A1E]/30 transition-all"
                          >
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xl font-bold text-white">
                              {typeof value === 'number' 
                                ? value.toFixed(3) 
                                : String(value)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Top Features Section */}
                  {insight.explanation?.top_features && insight.explanation.top_features.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <BarChart3 className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Top Contributing Features</h3>
                      </div>
                      <div className="space-y-3">
                        {insight.explanation.top_features.map((f: any, i: number) => {
                          const value = typeof f.value === 'number' ? f.value : parseFloat(String(f.value)) || 0;
                          const isPositive = value > 0;
                          const absValue = Math.abs(value);
                          const percentage = Math.min(100, absValue * 100);
                          
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.25 + i * 0.05 }}
                              className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-300">{f.name}</span>
                                <span className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                  {value > 0 ? '+' : ''}{value.toFixed(4)}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                                  className={`h-full rounded-full ${
                                    isPositive 
                                      ? 'bg-gradient-to-r from-green-500 to-green-400' 
                                      : 'bg-gradient-to-r from-red-500 to-red-400'
                                  }`}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Evidence Section */}
                  {insight.explanation?.evidence && insight.explanation.evidence.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <FileText className="w-4 h-4 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Supporting Evidence</h3>
                        <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {insight.explanation.evidence.length} items
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insight.explanation.evidence.map((e: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 + i * 0.05 }}
                            className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-purple-500/50 hover:border-purple-400 transition-all"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    Lap {e.lap}
                                  </span>
                                  {e.sector && (
                                    <span className="flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      Sector {e.sector}
                                    </span>
                                  )}
                                </div>
                                {e.meta_time && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(e.meta_time).toLocaleTimeString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            {(e.small_trace || e.trace) && (
                              <div className="mt-3 p-3 bg-gray-800/50 rounded border border-gray-700/30">
                                <div className="text-xs text-gray-500 mb-1 font-mono">Trace Data</div>
                                <div className="text-[11px] text-gray-400 font-mono truncate">
                                  {JSON.stringify(e.small_trace || e.trace || []).slice(0, 100)}
                                  {JSON.stringify(e.small_trace || e.trace || []).length > 100 && '...'}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Empty state if no data */}
                  {!insight.predictions && 
                   (!insight.explanation?.top_features || insight.explanation.top_features.length === 0) &&
                   (!insight.explanation?.evidence || insight.explanation.evidence.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 rounded-full bg-gray-800/50 mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-gray-400">No detailed data available for this insight.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800/50 bg-gray-900/30 px-6 py-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Insight ID: <span className="font-mono text-gray-400">{id.slice(0, 8)}...</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#EB0A1E]/10 hover:bg-[#EB0A1E]/20 text-[#EB0A1E] border border-[#EB0A1E]/30 hover:border-[#EB0A1E]/50 transition-all duration-200 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


// src/components/InsightCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Clock, MapPin, Car, ChevronRight, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InsightSummary } from '../stores/agentStore';

type Props = {
  item: InsightSummary;
  onOpen: (id: string) => void;
};

export const InsightCard: React.FC<Props> = React.memo(({ item, onOpen }) => {
  const getInsightType = (summary?: string) => {
    if (!summary) return 'info';
    const lower = summary.toLowerCase();
    if (lower.includes('alert') || lower.includes('warning') || lower.includes('critical')) return 'alert';
    if (lower.includes('opportunity') || lower.includes('improve') || lower.includes('optimize')) return 'opportunity';
    return 'info';
  };

  const insightType = getInsightType(item.summary);
  
  const getTypeColors = (type: string) => {
    switch (type) {
      case 'alert':
        return {
          bg: 'bg-red-500/10 border-red-500/30 hover:border-red-500/50',
          icon: 'text-red-500',
          badge: 'bg-red-600 text-red-50 border-red-400'
        };
      case 'opportunity':
        return {
          bg: 'bg-green-500/10 border-green-500/30 hover:border-green-500/50',
          icon: 'text-green-500',
          badge: 'bg-green-600 text-green-50 border-green-400'
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50',
          icon: 'text-blue-500',
          badge: 'bg-blue-600 text-blue-50 border-blue-400'
        };
    }
  };

  const colors = getTypeColors(insightType);
  const timeAgo = item.created_at 
    ? new Date(item.created_at).toLocaleTimeString()
    : 'Just now';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`p-4 rounded-xl border-2 ${colors.bg} cursor-pointer transition-all shadow-sm hover:shadow-lg backdrop-blur-sm`}
      onClick={() => onOpen(item.insight_id)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header with badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {item.track && (
              <Badge variant="outline" className="text-xs font-medium">
                <MapPin className="w-3 h-3 mr-1" />
                {item.track}
              </Badge>
            )}
            {item.chassis && (
              <Badge variant="outline" className="text-xs font-medium">
                <Car className="w-3 h-3 mr-1" />
                {item.chassis}
              </Badge>
            )}
            {item.model_version && (
              <Badge variant="outline" className="text-xs font-medium">
                v{item.model_version}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </div>
          </div>

          {/* Insight content */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-lg bg-background/50 border border-border/50 ${colors.icon}`}>
              {insightType === 'alert' ? (
                <AlertCircle className="w-4 h-4" />
              ) : insightType === 'opportunity' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground line-clamp-2 mb-1">
                {item.summary ?? 'New insight available'}
              </p>
              {item.short_explanation && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {typeof item.short_explanation === 'string' 
                    ? item.short_explanation 
                    : Array.isArray(item.short_explanation)
                    ? item.short_explanation.join(', ')
                    : 'View details for more information'}
                </p>
              )}
            </div>
          </div>

          {/* Action indicator */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <Badge className={`${colors.badge} text-xs`}>
              {insightType === 'alert' ? 'Action Required' : 
               insightType === 'opportunity' ? 'Opportunity' : 
               'Information'}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>View details</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

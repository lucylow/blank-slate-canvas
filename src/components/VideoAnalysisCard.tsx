// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Download, ExternalLink, Play, Tag } from 'lucide-react';
import { loadAnnotations, saveAnnotation, type AnnotationRecord } from '@/api/mockAnnotations';
import VideoPreview, { type VideoPreviewHandle } from './VideoPreview';

interface VideoAnalysis {
  id: string;
  title: string;
  video: string;
  poster?: string;
  event_ts: string;
  lap: number;
  sector: number;
  timestamp_s: number;
  telemetry: { speed_kph: number; g: number };
  agents: {
    predictor: { loss_s_per_lap: number; laps_until_cliff: number; confidence: number };
    simulator: { recommendation: string; expected_gain_s: number; confidence: number };
    anomaly: { score: number; type: string };
  };
  shap: Array<{ feature: string; impact: number }>;
  fingerprint: { baseline_similarity: number; note: string };
  coaching: string[];
  severity?: string;
  tags?: string[];
}

interface VideoAnalysisCardProps {
  analysis: VideoAnalysis;
}

export default function VideoAnalysisCard({ analysis }: VideoAnalysisCardProps) {
  const videoRef = useRef<VideoPreviewHandle>(null);
  const [ann, setAnn] = useState<AnnotationRecord | null>(null);
  const [annotation, setAnnotation] = useState({
    tags: analysis.tags || [],
    severity: analysis.severity || 'info',
    note: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validationNote, setValidationNote] = useState('');

  useEffect(() => {
    const loaded = loadAnnotations()[analysis.id];
    if (loaded) {
      setAnn(loaded);
      setAnnotation({
        tags: loaded.tags || analysis.tags || [],
        severity: loaded.severity || analysis.severity || 'info',
        note: loaded.note || ''
      });
    }
  }, [analysis.id, analysis.tags, analysis.severity]);

  const handleJumpTo = () => {
    if (videoRef.current) {
      videoRef.current.seekTo(analysis.timestamp_s);
      videoRef.current.play().catch(() => {});
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.id}-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !annotation.tags.includes(tagInput.trim())) {
      const newTags = [...annotation.tags, tagInput.trim()];
      setAnnotation({ ...annotation, tags: newTags });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setAnnotation({ ...annotation, tags: annotation.tags.filter(t => t !== tag) });
  };

  const handleSaveAnnotation = () => {
    const rec = saveAnnotation(analysis.id, {
      tags: annotation.tags,
      severity: annotation.severity,
      note: annotation.note,
      action: 'manual_update'
    });
    setAnn(rec);
  };

  const handleValidate = (valid: boolean) => {
    const rec = saveAnnotation(analysis.id, {
      validated: valid,
      validation_note: validationNote,
      action: valid ? 'validated' : 'rejected'
    });
    setAnn(rec);
    setShowValidateModal(false);
    setValidationNote('');
  };

  const validated = ann?.validated ?? false;
  const severityColors = {
    info: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
    warn: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    high: 'bg-red-500/20 text-red-500 border-red-500/50',
    success: 'bg-green-500/20 text-green-500 border-green-500/50'
  };

  return (
    <article className="bg-card border rounded-lg p-4 grid grid-cols-12 gap-4" aria-labelledby={`a-${analysis.id}`}>
      <div className="col-span-12 md:col-span-4">
        <div className="rounded-md overflow-hidden mb-2">
          <VideoPreview
            ref={videoRef}
            src={analysis.video}
            poster={analysis.poster || null}
            muted
            playsInline
            preload="metadata"
            className="w-full h-48"
            ariaLabel={`Video for ${analysis.title}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleJumpTo} size="sm" variant="outline" className="flex-1">
            <Play className="h-3 w-3 mr-1" />
            Jump to event
          </Button>
          <Button onClick={() => window.open(analysis.video, '_blank')} size="sm" variant="outline">
            <ExternalLink className="h-3 w-3 mr-1" />
            Open
          </Button>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="col-span-12 md:col-span-8">
        <div className="flex items-start justify-between mb-2">
          <h4 id={`a-${analysis.id}`} className="text-lg font-semibold">{analysis.title}</h4>
          {validated && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Validated
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          Lap {analysis.lap} • Sector {analysis.sector} • {new Date(analysis.event_ts).toLocaleString()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="p-2 bg-muted rounded">
            <div className="text-xs text-muted-foreground mb-1">Telemetry</div>
            <div className="text-sm font-mono">
              Speed: {analysis.telemetry.speed_kph} km/h<br/>
              G: {analysis.telemetry.g}G
            </div>
          </div>

          <div className="p-2 bg-muted rounded">
            <div className="text-xs text-muted-foreground mb-1">Agents</div>
            <div className="text-sm">
              Predictor: {analysis.agents.predictor.laps_until_cliff} laps<br/>
              Simulator: {analysis.agents.simulator.recommendation} (+{analysis.agents.simulator.expected_gain_s}s)<br/>
              Anomaly: {analysis.agents.anomaly.score.toFixed(2)}
            </div>
          </div>

          <div className="p-2 bg-muted rounded">
            <div className="text-xs text-muted-foreground mb-1">Fingerprint</div>
            <div className="text-sm">
              Sim: {(analysis.fingerprint.baseline_similarity * 100).toFixed(0)}%<br/>
              {analysis.fingerprint.note}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Top Features (SHAP-style)</div>
          <ul className="list-none space-y-1">
            {analysis.shap.map((s, idx) => (
              <li key={idx} className="text-sm">
                <strong>{s.feature}</strong> — {Math.round(s.impact * 100)}%
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Coaching Recommendations</div>
          <ol className="list-decimal ml-4 space-y-1 text-sm">
            {analysis.coaching.map((c, i) => <li key={i}>{c}</li>)}
          </ol>
        </div>

        {/* Annotation Controls */}
        <Card className="mt-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Annotations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag"
                  className="h-8 text-sm"
                />
                <Button onClick={handleAddTag} size="sm" variant="outline">
                  <Tag className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {annotation.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Severity</Label>
              <Select
                value={annotation.severity}
                onValueChange={(value) => setAnnotation({ ...annotation, severity: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Note</Label>
              <Textarea
                value={annotation.note}
                onChange={(e) => setAnnotation({ ...annotation, note: e.target.value })}
                placeholder="Add annotation note..."
                className="h-20 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveAnnotation} size="sm" variant="outline" className="flex-1">
                Save Annotation
              </Button>
              <Button onClick={() => setShowValidateModal(true)} size="sm" variant="outline">
                Validate
              </Button>
            </div>

            {ann?.audit && ann.audit.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">Audit Log</div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {ann.audit.slice(-3).map((entry, idx) => (
                    <div key={idx} className="text-xs">
                      {new Date(entry.ts).toLocaleTimeString()} — {entry.action} by {entry.by}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation Modal */}
      <Dialog open={showValidateModal} onOpenChange={setShowValidateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Engineer Validation</DialogTitle>
            <DialogDescription>
              Validate this analysis event. Add a note to explain your decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Validation Note</Label>
              <Textarea
                value={validationNote}
                onChange={(e) => setValidationNote(e.target.value)}
                placeholder="Add validation note..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleValidate(false)}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={() => handleValidate(true)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

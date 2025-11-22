// src/pages/DemoSandbox.tsx
import React, { useEffect, useState, useCallback } from "react";
import { WSClient } from "../lib/wsClient";
import { useAgentStore } from "../stores/agentStore";
import { InsightList } from "../components/InsightList";
import { AgentStatusPanel } from "../components/AgentStatusPanel";
import { TaskQueuePanel } from "../components/TaskQueuePanel";
import InsightModal from "../components/InsightModal/InsightModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Insight } from "@/hooks/useAgentSystem";
import { getInsightDetails } from "@/api/pitwall";

const DEMO_API = import.meta.env.VITE_DEMO_API || "/demo/tracks";
const WS_URL = import.meta.env.VITE_DELIVER_WS || `${location.origin.replace(/^http/, "ws")}/ws/agents`;

interface Track {
  track_id: string;
  track_name: string;
}

export default function DemoSandbox() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addInsightSummary = useAgentStore((s) => s.addInsightSummary);
  const setAgentStatus = useAgentStore((s) => s.setAgentStatus);
  const addTask = useAgentStore((s) => s.addTask);

  const [ws, setWs] = useState<WSClient | null>(null);

  useEffect(() => {
    // load available demo tracks
    fetch(DEMO_API)
      .then((r) => r.json())
      .then((j) => {
        setTracks(j || []);
        if (j && j.length) {
          setSelected((prev) => prev || j[0].track_id || j[0].track_name);
        }
      })
      .catch((e) => {
        console.warn("demo tracks load failed", e);
      });
  }, []);

  useEffect(() => {
    const client = new WSClient({
      url: WS_URL,
      onMessage: (msg: any) => {
        const type = msg.type || msg.t;
        const payload = msg.data || msg.payload || msg;
        if (type === "insight_update" || type === "eda_result") {
          if (payload && payload.insight_id) {
            addInsightSummary({
              insight_id: payload.insight_id,
              track: payload.track,
              chassis: payload.chassis,
              summary: payload.summary,
              created_at: payload.created_at,
            });
          }
        } else if (type === "agent_status") {
          setAgentStatus(payload.agentId, payload.status);
        } else {
          console.debug("demo ws msg", type, payload);
        }
      },
    });
    client.connect();
    setWs(client);
    return () => {
      client.close();
      setWs(null);
    };
  }, [addInsightSummary, setAgentStatus]);

  const handleOpenInsight = useCallback(async (insightId: string) => {
    setOpenId(insightId);
    setIsModalOpen(true);
    try {
      // Try to fetch full insight details
      const response = await getInsightDetails(insightId);
      const detail = response.insight;
      
      // Convert to Insight format
      const insight: Insight = {
        insight_id: detail.decision_id || insightId,
        decision_id: detail.decision_id,
        track: (detail.evidence?.track as string) || (detail.evidence?.chassis as string)?.split('-')[0] || '',
        chassis: (detail.evidence?.chassis as string) || '',
        created_at: new Date().toISOString(),
        type: detail.decision_type,
        decision_type: detail.decision_type,
        agent_id: detail.agent_id,
        agent_type: detail.agent_type,
        action: detail.action,
        confidence: detail.confidence,
        risk_level: detail.risk_level,
        reasoning: detail.reasoning,
        evidence: detail.evidence,
        alternatives: detail.alternatives,
        explanation: detail.reasoning ? {
          top_features: detail.reasoning.map((r: string, idx: number) => ({
            name: `Reason ${idx + 1}`,
            value: r
          }))
        } : undefined,
        predictions: detail.predictions,
      };
      setSelectedInsight(insight);
    } catch (error) {
      console.error("Failed to fetch insight details:", error);
      // Fallback to basic insight from store
      const state = useAgentStore.getState();
      const summary = state.insights.find(i => i.insight_id === insightId);
      if (summary) {
        setSelectedInsight({
          insight_id: summary.insight_id,
          track: summary.track || '',
          chassis: summary.chassis || '',
          created_at: summary.created_at || new Date().toISOString(),
        } as Insight);
      }
    }
  }, []);

  const startDemo = useCallback(() => {
    if (!ws || !selected) return;
    // send a command to the demo server to start the playback for the selected track
    ws.send({ cmd: "start_demo", track_id: selected });
    setPlaying(true);
  }, [ws, selected]);

  const stopDemo = useCallback(() => {
    // for demo server we simply disconnect or send stop if implemented
    setPlaying(false);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Demo Sandbox — 7-track mock data</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Demo track</label>
                <select
                  value={selected ?? ""}
                  onChange={(e) => setSelected(e.target.value)}
                  className="border p-1 rounded"
                  disabled={playing}
                >
                  {tracks.map((t) => (
                    <option key={t.track_id} value={t.track_id}>
                      {t.track_name || t.track_id}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => startDemo()}
                  disabled={!selected || playing}
                >
                  Start
                </Button>
                <Button
                  variant="outline"
                  onClick={() => stopDemo()}
                  disabled={!playing}
                >
                  Stop
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // enqueue a sample aggregate task to the store (visible in TaskQueuePanel)
                    addTask({
                      task_id: `demo_task_${Date.now()}`,
                      task_type: "aggregate_window",
                      track: selected || undefined,
                      chassis: "GR86-001",
                      created_at: new Date().toISOString(),
                    });
                  }}
                >
                  Enqueue Sample Task
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-2">Live insights</h2>
            <InsightList onOpen={handleOpenInsight} />
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <AgentStatusPanel />
          <TaskQueuePanel />
        </div>
      </div>

      {isModalOpen && (
        <InsightModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setOpenId(null);
            setSelectedInsight(null);
          }}
          insight={selectedInsight}
        />
      )}
    </div>
  );
}


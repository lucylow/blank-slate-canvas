// debug-ui/src/App.jsx
import React, { useEffect, useState } from "react";

export default function AgentDebugUI() {
  const [agents, setAgents] = useState([]);
  const [queues, setQueues] = useState(null);
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    fetch("/api/orch/agents").catch(()=>{}); // if orchestrator proxied
    async function load() {
      try {
        const a = await fetch("/api/orch/agents").then(r=>r.json());
        setAgents(a);
        const q = await fetch("/api/orch/queues").then(r=>r.json());
        setQueues(q);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host.replace(/:\d+/,':8082') + "/ws/agents");
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      setMessages(m=>[data, ...m].slice(0,50));
    }
    return () => ws.close();
  }, []);

  return (
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold">PitWall — Agent Debug UI</h1>
      <div style={{display:'flex', gap:20, marginTop:20}}>
        <div style={{flex:1}}>
          <h2>Registered Agents</h2>
          <pre style={{background:'#111', color:'#0f0', padding:10}}>{JSON.stringify(agents, null, 2)}</pre>
          <h2>Queues</h2>
          <pre style={{background:'#111', color:'#0ff', padding:10}}>{JSON.stringify(queues, null, 2)}</pre>
        </div>
        <div style={{flex:1}}>
          <h2>Recent Agent Messages (from Delivery WS)</h2>
          <div style={{height:400, overflow:'auto', background:'#000', color:'#fff', padding:10}}>
            {messages.map((m,i)=>(
              <div key={i} style={{borderBottom:'1px solid #333', padding:8}}>
                <small style={{color:'#999'}}>{m.type} — {m.data && m.data.created_at}</small>
                <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(m, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



# src/agents/visualization_agents.py

"""
Visualization agents for PitWall A.I.

Creates interactive Plotly visualizations and a self-contained HTML dashboard
from outputs of your multi-agent pattern-recognition pipeline.

Drop into your repo at: src/agents/visualization_agents.py
"""

from pathlib import Path
import json
import os
import logging
from typing import Dict, Any, Optional

import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

# UMAP for 2D embedding (fallback to sklearn TSNE if not installed)
try:
    import umap
    _HAS_UMAP = True
except Exception:
    from sklearn.manifold import TSNE
    _HAS_UMAP = False

# Export images via kaleido
# Make sure kaleido is installed: pip install kaleido
import plotly.io as pio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("viz_agents")

# Local design brief URL (developer-provided path)
DESIGN_BRIEF_URL = "file:///mnt/data/Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I.  (4).docx"

# Default image size for mobile-friendly thumbnails
THUMBNAIL_WIDTH = 1080
THUMBNAIL_HEIGHT = 607


# -------------------------
# Helpers
# -------------------------
def ensure_out_dir(out_dir: str):
    p = Path(out_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p

def save_plotly_png(fig: go.Figure, out_path: Path, width=THUMBNAIL_WIDTH, height=THUMBNAIL_HEIGHT):
    """Save a Plotly figure as PNG using kaleido; returns path."""
    try:
        fig.write_image(str(out_path), format="png", width=width, height=height, scale=1)
        logger.info(f"[viz] Saved PNG: {out_path}")
        return str(out_path)
    except Exception as e:
        logger.exception("Failed to save PNG via kaleido: %s", e)
        # fallback: try saving HTML screenshot? For now return None
        return None

def save_plotly_html_div(fig: go.Figure, out_path: Path, include_plotlyjs="cdn"):
    """Save Plotly figure as standalone html div file (fragment)."""
    html = pio.to_html(fig, include_plotlyjs=include_plotlyjs, full_html=False)
    out_path.write_text(html, encoding="utf-8")
    logger.info(f"[viz] Saved HTML fragment: {out_path}")
    return str(out_path)


# -------------------------
# Visualization Agents
# -------------------------
class LapTimeVizAgent:
    """Generate lap-time series visualizations per car and overlay comparisons."""
    name = "lap_time_viz"

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

    def run(self, df: pd.DataFrame, out_dir: str):
        """
        df: expected to contain either per-lap times or telemetry with lap grouping.
        Required (if present): car number column and lap or lap_time fields.
        """
        out_dir = ensure_out_dir(out_dir)
        # Try to detect columns
        car_col = next((c for c in df.columns if c.lower() in ("number","car","car_number","vehicle")), None)
        lap_col = next((c for c in df.columns if "lap" in c.lower()), None)
        lap_time_col = next((c for c in df.columns if "lap_time" in c.lower() or "lap_seconds" in c.lower() or "total_time" in c.lower()), None)

        if lap_col is None or car_col is None:
            logger.warning("[LapTimeVizAgent] Missing lap or car column; aborting.")
            return {"note": "missing lap or car column"}

        # If we have telemetry-level and not aggregated lap_time, aggregate mean lap times
        if lap_time_col is None:
            # attempt to construct lap times via meta_time min/max per lap
            time_col = next((c for c in df.columns if c.lower() in ("meta_time","timestamp","time")), None)
            if time_col:
                lap_df = df.groupby([car_col, lap_col])[time_col].agg(["min","max"]).reset_index()
                lap_df["lap_time_seconds"] = lap_df["max"] - lap_df["min"]
                lap_df = lap_df.rename(columns={lap_col: "lap"})
            else:
                logger.warning("[LapTimeVizAgent] No lap_time or meta_time found; aborting.")
                return {"note": "insufficient timing columns"}
        else:
            lap_df = df[[car_col, lap_col, lap_time_col]].copy()
            lap_df.columns = ["car", "lap", "lap_time_seconds"] if (lap_col != "lap" or lap_time_col != "lap_time_seconds") else lap_df.columns

        # Convert types
        lap_df["lap"] = pd.to_numeric(lap_df["lap"], errors="coerce")
        lap_df["lap_time_seconds"] = pd.to_numeric(lap_df["lap_time_seconds"], errors="coerce")

        # Plot: overlay of selected top N cars by number of laps
        top_n = self.config.get("top_n", 6)
        counts = lap_df["car"].value_counts().nlargest(top_n).index.tolist()
        fig = px.line(lap_df[lap_df["car"].isin(counts)], x="lap", y="lap_time_seconds", color="car",
                      labels={"lap":"Lap", "lap_time_seconds":"Lap time (s)"}, title="Lap times (selected cars)")
        fig.update_layout(template="plotly_white", legend_title="Car #", height=500)
        html_path = Path(out_dir) / "lap_times_overlay.html"
        png_path = Path(out_dir) / "lap_times_overlay.png"
        save_plotly_html_div(fig, html_path)
        save_plotly_png(fig, png_path)
        return {"html": str(html_path), "png": str(png_path)}


class ClusterVizAgent:
    """Visualize clusters (from clustering agent) using UMAP/TSNE and Plotly."""
    name = "cluster_viz"

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

    def run(self, clustering_result: pd.DataFrame, out_dir: str):
        """
        clustering_result: expected dataframe with feature columns and a `cluster` numeric label.
        """
        out_dir = ensure_out_dir(out_dir)
        if clustering_result is None or "cluster" not in clustering_result.columns:
            return {"note": "no clustering dataframe provided"}

        # pick numeric features for embedding (exclude cluster and group keys)
        feature_cols = [c for c in clustering_result.columns if pd.api.types.is_numeric_dtype(clustering_result[c]) and c != "cluster"]
        if len(feature_cols) == 0:
            return {"note": "no numeric features for embedding"}

        X = clustering_result[feature_cols].fillna(0.0).values

        # compute 2D embedding
        try:
            if _HAS_UMAP:
                reducer = umap.UMAP(n_neighbors=self.config.get("n_neighbors", 15), min_dist=0.1, random_state=0)
                emb = reducer.fit_transform(X)
            else:
                tsne = TSNE(n_components=2, random_state=0, perplexity=30)
                emb = tsne.fit_transform(X)
        except Exception as e:
            logger.exception("[ClusterVizAgent] embedding failed: %s", e)
            return {"note": "embedding_failed", "error": str(e)}

        emb_df = pd.DataFrame(emb, columns=["x","y"])
        emb_df["cluster"] = clustering_result["cluster"].values
        # keep label info if present
        label_col = next((c for c in clustering_result.columns if c.lower() in ("car","car_number","label")), None)
        if label_col:
            emb_df["label"] = clustering_result[label_col].values
        else:
            emb_df["label"] = clustering_result.index.astype(str)

        fig = px.scatter(emb_df, x="x", y="y", color="cluster", hover_data=["label"], title="Behavior clusters (2D embedding)")
        fig.update_layout(template="plotly_white", height=600)
        html_path = Path(out_dir) / "clusters_embedding.html"
        png_path = Path(out_dir) / "clusters_embedding.png"
        save_plotly_html_div(fig, html_path)
        save_plotly_png(fig, png_path)
        return {"html": str(html_path), "png": str(png_path)}


class TireWearVizAgent:
    """Plot tire-wear proxy trends per car from TireWearAgent output (slope vs R2)."""
    name = "tire_wear_viz"

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

    def run(self, tire_summary_df: pd.DataFrame, out_dir: str):
        out_dir = ensure_out_dir(out_dir)
        if tire_summary_df is None or tire_summary_df.empty:
            return {"note": "no tire wear summary"}

        # Expect columns: car, slope_acc_mag_sum, r2, n_laps
        df = tire_summary_df.copy()
        # Scatter: slope vs r2 sized by n_laps
        fig = px.scatter(df, x="slope_acc_mag_sum", y="r2", size="n_laps", hover_name="car",
                         labels={"slope_acc_mag_sum":"Stress slope per lap", "r2":"Trend R²"}, title="Tire stress trend per car")
        fig.update_layout(template="plotly_white", height=520)
        html_path = Path(out_dir) / "tire_wear_trends.html"
        png_path = Path(out_dir) / "tire_wear_trends.png"
        save_plotly_html_div(fig, html_path)
        save_plotly_png(fig, png_path)
        return {"html": str(html_path), "png": str(png_path)}


class AnomalyVizAgent:
    """Visualize anomalies over time / per lap from AnomalyAgent output."""
    name = "anomaly_viz"

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

    def run(self, anomaly_per_lap_df: pd.DataFrame, out_dir: str):
        out_dir = ensure_out_dir(out_dir)
        if anomaly_per_lap_df is None or anomaly_per_lap_df.empty:
            return {"note": "no anomaly per-lap data"}

        df = anomaly_per_lap_df.copy()
        # Attempt to identify lap and car columns
        car_col = next((c for c in df.columns if c.lower() in ("car","car_number","number")), None)
        lap_col = next((c for c in df.columns if "lap" in c.lower()), None)
        anomaly_col = next((c for c in df.columns if "_anomaly" in c.lower() or "anomal" in c.lower()), None)
        if anomaly_col is None:
            # If not, try to produce a flag from numeric scores if present
            anomaly_col = [c for c in df.columns if df[c].dtype == bool or set(df[c].unique()).issubset({0,1})]
            if anomaly_col:
                anomaly_col = anomaly_col[0]
            else:
                anomaly_col = None

        if anomaly_col is None:
            return {"note":"no anomaly flag column"}

        # Build timeline per car: heatmap (car rows, lap columns) or scatter with color
        if car_col and lap_col:
            pivot = df.pivot_table(index=car_col, columns=lap_col, values=anomaly_col, aggfunc='max').fillna(0)
            # create heatmap
            fig = px.imshow(pivot.replace({False:0, True:1}).values, aspect="auto",
                            x=pivot.columns.astype(str), y=pivot.index.astype(str),
                            color_continuous_scale=[[0,"#ffffff"],[1,"#e60000"]], title="Anomaly heatmap (cars x laps)")
            fig.update_layout(template="plotly_white", height=500)
            html_path = Path(out_dir) / "anomaly_heatmap.html"
            png_path = Path(out_dir) / "anomaly_heatmap.png"
            save_plotly_html_div(fig, html_path)
            save_plotly_png(fig, png_path)
            return {"html": str(html_path), "png": str(png_path)}
        else:
            # fallback: scatter by index
            df["_idx"] = range(len(df))
            fig = px.scatter(df, x="_idx", y=anomaly_col, color=car_col if car_col else None, title="Anomaly timeline")
            html_path = Path(out_dir) / "anomaly_timeline.html"
            png_path = Path(out_dir) / "anomaly_timeline.png"
            save_plotly_html_div(fig, html_path)
            save_plotly_png(fig, png_path)
            return {"html": str(html_path), "png": str(png_path)}


class PitStrategyVizAgent:
    """Visualize pit patterns detected by PitPatternAgent."""
    name = "pit_pattern_viz"

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

    def run(self, pits_df: pd.DataFrame, out_dir: str):
        out_dir = ensure_out_dir(out_dir)
        if pits_df is None or pits_df.empty:
            return {"note":"no pits detected"}

        df = pits_df.copy()
        # Normalize: columns car, lap, gap (if present)
        if "lap" not in df.columns and "pit_time_index" in df.columns:
            df = df.rename(columns={"pit_time_index":"lap"})
        if "car" not in df.columns:
            possible = [c for c in df.columns if 'car' in c.lower()]
            if possible:
                df = df.rename(columns={possible[0]:'car'})

        # Count pits per car and display stacked bar
        counts = df.groupby("car").size().reset_index(name="pit_count")
        fig = px.bar(counts, x="car", y="pit_count", title="Pit stops per car", labels={"pit_count":"Pit stop count"})
        fig.update_layout(template="plotly_white", height=420)
        html_path = Path(out_dir) / "pit_counts.html"
        png_path = Path(out_dir) / "pit_counts.png"
        save_plotly_html_div(fig, html_path)
        save_plotly_png(fig, png_path)
        return {"html": str(html_path), "png": str(png_path)}


# -------------------------
# Orchestrator for Visualizations
# -------------------------
class VisualizationOrchestrator:
    """
    Build visualizations from agent results and raw DF.

    Usage:
        viz = VisualizationOrchestrator(out_dir="agent_visuals")
        viz.run(results_dict, raw_df)
    """
    def __init__(self, out_dir: str = "agent_visuals", config: Optional[Dict] = None):
        self.out_dir = ensure_out_dir(out_dir)
        self.config = config or {}
        # instantiate agent helpers
        self.lap_viz = LapTimeVizAgent(self.config.get("lap_time", {}))
        self.cluster_viz = ClusterVizAgent(self.config.get("cluster", {}))
        self.tire_viz = TireWearVizAgent(self.config.get("tire", {}))
        self.anomaly_viz = AnomalyVizAgent(self.config.get("anomaly", {}))
        self.pit_viz = PitStrategyVizAgent(self.config.get("pit", {}))

    def run(self, results: Dict[str, Any], raw_df: Optional[pd.DataFrame] = None) -> Dict[str, Dict]:
        """
        results: dict mapping agent_name -> AgentResult or dict containing per_lap/per_car DataFrames
        raw_df: original telemetry/results DataFrame (optional)
        Returns dict of produced visual assets per agent.
        """
        outputs = {}

        # 1) Lap time visualization (prefer raw_df, else try regression/classifier results)
        try:
            if raw_df is not None:
                outputs['lap_time'] = self.lap_viz.run(raw_df, out_dir=str(self.out_dir))
            else:
                # fallback: if cluster or consistency agents have per-lap info, try those
                candidate = None
                for k,v in results.items():
                    per_lap = getattr(v, "per_lap", None) if hasattr(v, "per_lap") else v.get("per_lap") if isinstance(v, dict) else None
                    if per_lap is not None and ("lap" in per_lap.columns or any("lap" in c.lower() for c in per_lap.columns)):
                        candidate = per_lap
                        break
                if candidate is not None:
                    outputs['lap_time'] = self.lap_viz.run(candidate, out_dir=str(self.out_dir))
        except Exception as e:
            logger.exception("lap_time viz failed: %s", e)
            outputs['lap_time'] = {"error": str(e)}

        # 2) Cluster visualization if clustering agent output exists
        try:
            clustering_df = None
            c_out = results.get("clustering_behavior") or results.get("clustering")
            if c_out is not None:
                clustering_df = getattr(c_out, "per_lap", None) if hasattr(c_out, "per_lap") else c_out.get("per_lap")
            if clustering_df is not None:
                outputs['clusters'] = self.cluster_viz.run(clustering_df, out_dir=str(self.out_dir))
        except Exception as e:
            logger.exception("cluster viz failed: %s", e)
            outputs['clusters'] = {"error": str(e)}

        # 3) Tire wear viz
        try:
            tire_df = None
            t_out = results.get("tire_wear_patterns")
            if t_out is not None:
                tire_df = getattr(t_out, "per_car", None) if hasattr(t_out, "per_car") else t_out.get("per_car")
            if tire_df is not None:
                outputs['tire'] = self.tire_viz.run(tire_df, out_dir=str(self.out_dir))
        except Exception as e:
            logger.exception("tire viz failed: %s", e)
            outputs['tire'] = {"error": str(e)}

        # 4) Anomaly viz
        try:
            an_df = None
            a_out = results.get("anomaly_isolation_forest") or results.get("anomaly")
            if a_out is not None:
                an_df = getattr(a_out, "per_lap", None) if hasattr(a_out, "per_lap") else a_out.get("per_lap")
            if an_df is not None:
                outputs['anomaly'] = self.anomaly_viz.run(an_df, out_dir=str(self.out_dir))
        except Exception as e:
            logger.exception("anomaly viz failed: %s", e)
            outputs['anomaly'] = {"error": str(e)}

        # 5) Pit strategy viz
        try:
            pit_df = None
            p_out = results.get("pit_pattern_analysis") or results.get("pit_patterns")
            if p_out is not None:
                pit_df = getattr(p_out, "per_car", None) if hasattr(p_out, "per_car") else p_out.get("per_car")
            if pit_df is not None:
                outputs['pit'] = self.pit_viz.run(pit_df, out_dir=str(self.out_dir))
        except Exception as e:
            logger.exception("pit viz failed: %s", e)
            outputs['pit'] = {"error": str(e)}

        # 6) Compose dashboard HTML that includes returned fragments (if any)
        try:
            dashboard_path = self.generate_dashboard_html(outputs, out_dir=str(self.out_dir))
            outputs['dashboard'] = {"html": str(dashboard_path)}
        except Exception as e:
            logger.exception("dashboard composition failed: %s", e)
            outputs['dashboard'] = {"error": str(e)}

        return outputs

    def generate_dashboard_html(self, assets: Dict[str, Dict], out_dir: str):
        """
        Compose a single HTML file that embeds available Plotly fragments or links to PNGs.
        Each asset dict should have 'html' and/or 'png' keys as returned by agent run()s.
        """
        out_dir = Path(out_dir)
        html_file = out_dir / "ai_insights_dashboard.html"
        parts = []
        header = f"""
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>PitWall A.I. — AI Insights Dashboard</title>
          <style>
            body{{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background:#fff; color:#111; margin:0; padding:18px;}}
            .card{{border-radius:12px; box-shadow: 0 8px 24px rgba(20,20,20,0.06); padding:12px; margin-bottom:18px;}}
            .header{{display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;}}
            .brief{{font-size:0.9rem; color:#666;}}
            .title{{font-weight:700; font-size:1.25rem;}}
            .row{{display:flex; flex-direction:column; gap:12px;}}
            @media(min-width:900px){{ .row{{flex-direction:row}} .card{{flex:1}} }}
          </style>
        </head>
        <body>
        <div class="header">
          <div>
            <div class="title">PitWall A.I. — AI Insights</div>
            <div class="brief">Visualization of agent outputs — interactive charts and thumbnails. <a href="{DESIGN_BRIEF_URL}" target="_blank">Design brief</a></div>
          </div>
          <div><small>Generated by visualization_agents</small></div>
        </div>
        """

        parts.append(header)

        # For each asset type: embed HTML fragment if available, otherwise show PNG image
        order = ["lap_time","clusters","tire","anomaly","pit"]
        for key in order:
            asset = assets.get(key)
            if not asset:
                continue
            parts.append(f'<div class="card"><h3 style="margin:6px 0 8px 0">{key.replace("_"," ").title()}</h3>')
            # If html fragment exists, embed it inline
            htmlfrag = asset.get("html")
            png = asset.get("png")
            if htmlfrag and Path(htmlfrag).exists():
                frag_text = Path(htmlfrag).read_text(encoding="utf-8")
                # wrap fragment
                parts.append(f'<div class="viz-embed">{frag_text}</div>')
            elif png and Path(png).exists():
                parts.append(f'<img src="{Path(png).name}" alt="{key}" style="width:100%; height:auto; border-radius:8px;"/>')
            else:
                parts.append("<div><em>No visualization available</em></div>")
            parts.append("</div>")

        # include thumbnails in an assets folder: copy pngs to same dir so relative src works
        footer = """
        <footer style="margin-top:22px; font-size:0.85rem; color:#666;">
          <div>Generated visual assets located in the same folder as this HTML.</div>
        </footer>
        </body>
        </html>
        """
        parts.append(footer)
        html_text = "\n".join(parts)
        html_file.write_text(html_text, encoding="utf-8")

        # If any pngs exist, ensure they're copied (they are in out_dir already)
        logger.info(f"[viz] Dashboard generated at {html_file}")
        return html_file


# -------------------------
# Example usage
# -------------------------
def example_run(agent_results: Dict[str, Any], raw_csv: Optional[str] = None, out_dir: str = "agent_visuals"):
    """
    agent_results: the dict returned by your MultiAgentOrchestrator (values may be AgentResult objects
                   or dicts with per_car/per_lap keys).
    raw_csv: optional path to original telemetry/results CSV for lap-level plots.
    out_dir: where to write visual assets and dashboard.
    """
    df = None
    if raw_csv:
        df = pd.read_csv(raw_csv)
    viz = VisualizationOrchestrator(out_dir=out_dir)
    outputs = viz.run(agent_results, raw_df=df)
    print("Visualization outputs:", json.dumps(outputs, indent=2))
    print(f"Open {Path(out_dir)/'ai_insights_dashboard.html'} to view the dashboard.")


if __name__ == "__main__":
    # quick CLI example
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", help="Path to raw telemetry/results csv (optional)", default=None)
    parser.add_argument("--results-dir", help="Directory where agent CSV outputs live (optional)", default=None)
    parser.add_argument("--out-dir", help="Output directory for visuals", default="agent_visuals")
    args = parser.parse_args()

    # If results-dir provided, attempt to load standard files saved by pattern_agents
    results = {}
    if args.results_dir:
        rd = Path(args.results_dir)
        # example mapping of expected files
        mappings = {
            "anomaly_isolation_forest": rd / "anomaly_isolation_forest_per_lap.csv",
            "clustering_behavior": rd / "clustering_behavior_per_lap.csv",
            "tire_wear_patterns": rd / "tire_wear_patterns_per_car.csv",
            "pit_pattern_analysis": rd / "pit_pattern_analysis_per_car.csv",
        }
        for k,p in mappings.items():
            if p.exists():
                dfp = pd.read_csv(p)
                results[k] = {"per_lap": dfp} if 'lap' in str(p) or 'lap' in ",".join(dfp.columns).lower() else {"per_car": dfp}
    example_run(results, raw_csv=args.csv, out_dir=args.out_dir)


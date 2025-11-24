#!/usr/bin/env python3
"""
Backtest Script for Tire Wear Model
====================================
Runs model evaluation on historical race data and generates summary report
"""
import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import json
from datetime import datetime
from typing import Dict, List, Any
import logging

from app.config import TRACKS, DATA_DIR
from app.data.data_loader import data_loader
from app.services.tire_wear_predictor import tire_wear_predictor
from app.analytics.eval import evaluate_tire_wear_on_track, evaluate_all_tracks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_backtest(track: str = None, race: int = 1, max_laps: int = 20) -> Dict[str, Any]:
    """
    Run backtest on historical race data
    
    Args:
        track: Track ID (None = all tracks)
        race: Race number
        max_laps: Maximum laps to evaluate per track
    
    Returns:
        Dictionary with backtest results
    """
    logger.info(f"Starting backtest: track={track}, race={race}, max_laps={max_laps}")
    
    if track:
        # Backtest specific track
        if track not in TRACKS:
            raise ValueError(f"Track '{track}' not found")
        
        vehicles = data_loader.get_available_vehicles(track, race)
        if not vehicles:
            raise ValueError(f"No vehicles found for {track} Race {race}")
        
        vehicle = vehicles[0]
        result = evaluate_tire_wear_on_track(track, race, vehicle, max_laps)
        
        return {
            "track": track,
            "race": race,
            "vehicle": vehicle,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        # Backtest all tracks
        results = evaluate_all_tracks(max_samples_per_track=max_laps)
        
        return {
            "tracks": "all",
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        }


def generate_summary_report(backtest_results: Dict[str, Any], output_path: Path):
    """
    Generate a summary report from backtest results
    """
    report = {
        "backtest_summary": {
            "timestamp": datetime.utcnow().isoformat(),
            "model_version": tire_wear_predictor.model_version,
            "results": backtest_results
        },
        "metrics": {},
        "recommendations": []
    }
    
    # Extract metrics
    if "result" in backtest_results:
        # Single track result
        result = backtest_results["result"]
        report["metrics"] = {
            "rmse": result.get("rmse", 0.0),
            "mae": result.get("mae", 0.0),
            "r2_score": result.get("r2_score", 0.0),
            "samples": result.get("n_samples", 0)
        }
    elif "results" in backtest_results:
        # All tracks result
        results = backtest_results["results"]
        per_track_metrics = {}
        for track_result in results.get("per_track", []):
            track_id = track_result.get("track", "unknown")
            per_track_metrics[track_id] = {
                "rmse": track_result.get("rmse", 0.0),
                "mae": track_result.get("mae", 0.0),
                "r2_score": track_result.get("r2_score", 0.0),
                "samples": track_result.get("n_samples", 0)
            }
        
        # Calculate aggregate metrics
        all_rmse = [m["rmse"] for m in per_track_metrics.values()]
        all_mae = [m["mae"] for m in per_track_metrics.values()]
        all_r2 = [m["r2_score"] for m in per_track_metrics.values()]
        
        report["metrics"] = {
            "aggregate": {
                "mean_rmse": sum(all_rmse) / len(all_rmse) if all_rmse else 0.0,
                "mean_mae": sum(all_mae) / len(all_mae) if all_mae else 0.0,
                "mean_r2": sum(all_r2) / len(all_r2) if all_r2 else 0.0
            },
            "per_track": per_track_metrics
        }
    
    # Generate recommendations
    if report["metrics"]:
        if isinstance(report["metrics"], dict) and "aggregate" in report["metrics"]:
            mean_rmse = report["metrics"]["aggregate"].get("mean_rmse", 0.0)
        else:
            mean_rmse = report["metrics"].get("rmse", 0.0)
        
        if mean_rmse < 0.5:
            report["recommendations"].append("Model performance is excellent (RMSE < 0.5)")
        elif mean_rmse < 0.7:
            report["recommendations"].append("Model performance is good (RMSE < 0.7)")
        else:
            report["recommendations"].append("Model performance could be improved (RMSE >= 0.7)")
    
    # Save report
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"Backtest report saved to: {output_path}")
    return report


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Backtest tire wear prediction model")
    parser.add_argument("--track", type=str, default=None, help="Track ID (default: all tracks)")
    parser.add_argument("--race", type=int, default=1, help="Race number (default: 1)")
    parser.add_argument("--max-laps", type=int, default=20, help="Maximum laps to evaluate (default: 20)")
    parser.add_argument("--output", type=str, default="artifacts/backtest_summary.json", help="Output file path")
    
    args = parser.parse_args()
    
    try:
        # Run backtest
        results = run_backtest(track=args.track, race=args.race, max_laps=args.max_laps)
        
        # Generate report
        output_path = Path(args.output)
        report = generate_summary_report(results, output_path)
        
        # Print summary
        print("\n" + "="*60)
        print("BACKTEST SUMMARY")
        print("="*60)
        print(f"Model Version: {tire_wear_predictor.model_version}")
        print(f"Timestamp: {report['backtest_summary']['timestamp']}")
        print("\nMetrics:")
        if "aggregate" in report["metrics"]:
            metrics = report["metrics"]["aggregate"]
            print(f"  Mean RMSE: {metrics['mean_rmse']:.3f}")
            print(f"  Mean MAE: {metrics['mean_mae']:.3f}")
            print(f"  Mean R²: {metrics['mean_r2']:.3f}")
        else:
            metrics = report["metrics"]
            print(f"  RMSE: {metrics.get('rmse', 0.0):.3f}")
            print(f"  MAE: {metrics.get('mae', 0.0):.3f}")
            print(f"  R²: {metrics.get('r2_score', 0.0):.3f}")
        
        if report["recommendations"]:
            print("\nRecommendations:")
            for rec in report["recommendations"]:
                print(f"  - {rec}")
        
        print(f"\nFull report saved to: {output_path}")
        print("="*60 + "\n")
        
    except Exception as e:
        logger.error(f"Backtest failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()




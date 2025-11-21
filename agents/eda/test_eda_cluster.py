#!/usr/bin/env python3
"""
Test script for EDA Cluster Agent

Generates sample telemetry data and tests the clustering pipeline.
"""

import json
import numpy as np
from datetime import datetime, timedelta
from eda_cluster_agent import EDAClusterAgent

def generate_sample_telemetry(n_samples=100):
    """Generate synthetic telemetry data for testing"""
    base_time = datetime.now()
    records = []
    
    # Create 3 distinct driving patterns
    patterns = [
        {"speed_mean": 180, "accx_std": 0.3, "accy_std": 0.4, "steering_mean": 5},
        {"speed_mean": 160, "accx_std": 0.2, "accy_std": 0.3, "steering_mean": 8},
        {"speed_mean": 200, "accx_std": 0.5, "accy_std": 0.6, "steering_mean": 3},
    ]
    
    for i in range(n_samples):
        pattern = patterns[i % len(patterns)]
        record = {
            "meta_time": (base_time + timedelta(seconds=i*0.1)).isoformat() + "Z",
            "lap": (i // 20) + 1,
            "speed_kmh": np.random.normal(pattern["speed_mean"], 10),
            "accx_can": np.random.normal(0, pattern["accx_std"]),
            "accy_can": np.random.normal(0, pattern["accy_std"]),
            "Steering_Angle": np.random.normal(pattern["steering_mean"], 2),
            "rpm": np.random.normal(6000, 500),
            "throttle_pct": np.random.uniform(50, 100),
            "brake_pct": np.random.uniform(0, 30),
        }
        records.append(record)
    
    return records

def main():
    print("=" * 60)
    print("EDA Cluster Agent Test")
    print("=" * 60)
    
    # Generate sample data
    print("\n1. Generating sample telemetry data...")
    records = generate_sample_telemetry(n_samples=100)
    print(f"   Generated {len(records)} records")
    
    # Initialize agent
    print("\n2. Initializing EDA Cluster Agent...")
    agent = EDAClusterAgent(
        workdir="./test_eda_output",
        n_components_pca=8,
        umap_n_neighbors=10,
        cluster_min_cluster_size=5
    )
    
    # Run analysis
    print("\n3. Running clustering analysis...")
    try:
        insights = agent.analyze_batch(records)
        
        print("\n4. Results:")
        print(f"   Profile keys: {list(insights.get('profile', {}).keys())}")
        print(f"   Metrics: {insights.get('metrics', {})}")
        
        # Print cluster profiles
        profile = insights.get('profile', {})
        if profile:
            print("\n5. Cluster Profiles:")
            for cluster_id, info in profile.items():
                print(f"\n   Cluster {cluster_id}:")
                print(f"     Count: {info.get('count', 0)}")
                print(f"     Top Features: {info.get('top_features', [])[:3]}")
        
        print("\n✓ Test completed successfully!")
        print(f"   Artifacts saved to: {agent.workdir}")
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())


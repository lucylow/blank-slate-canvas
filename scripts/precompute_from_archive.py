#!/usr/bin/env python3
"""
Extract and precompute data from backend archive
Creates demo slices and precomputed aggregations from extracted archive
"""
import argparse
import json
import pandas as pd
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def find_telemetry_files(input_dir: Path):
    """Find telemetry CSV files in archive structure"""
    telemetry_files = []
    for pattern in ["*telemetry*.csv", "*Telemetry*.CSV"]:
        telemetry_files.extend(input_dir.rglob(pattern))
    return telemetry_files

def extract_sample_slices(telemetry_files, out_dir: Path, max_rows=100):
    """Extract sample slices from telemetry files"""
    out_dir.mkdir(parents=True, exist_ok=True)
    
    slices_created = []
    
    for i, telemetry_file in enumerate(telemetry_files[:3]):  # Process first 3 files
        try:
            logger.info(f"Processing {telemetry_file.name}...")
            
            # Read sample
            df = pd.read_csv(telemetry_file, nrows=max_rows)
            
            # Convert to records
            records = df.replace({pd.NA: None}).to_dict('records')
            
            # Save as demo slice
            slice_name = f"archive_sample_{i+1}.json"
            slice_path = out_dir / slice_name
            
            with open(slice_path, 'w') as f:
                json.dump(records, f, indent=2, default=str)
            
            slices_created.append(slice_name)
            logger.info(f"✓ Created {slice_name} ({len(records)} records)")
            
        except Exception as e:
            logger.warning(f"Error processing {telemetry_file.name}: {e}")
    
    return slices_created

def compute_lap_aggregates(telemetry_files, out_dir: Path):
    """Compute lap-level aggregates"""
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Placeholder - would compute actual aggregates from telemetry
    # For now, create a simple coverage file
    coverage = {
        "tracks": [],
        "total_files": len(telemetry_files),
        "precomputed_at": pd.Timestamp.now().isoformat()
    }
    
    coverage_path = out_dir / "coverage.json"
    with open(coverage_path, 'w') as f:
        json.dump(coverage, f, indent=2)
    
    logger.info(f"✓ Created coverage.json")
    return coverage

def main():
    parser = argparse.ArgumentParser(description="Precompute data from archive")
    parser.add_argument("--input", type=str, required=True, help="Input directory with extracted archive")
    parser.add_argument("--out", type=str, default="data", help="Output base directory")
    args = parser.parse_args()
    
    input_dir = Path(args.input)
    out_dir = Path(args.out)
    
    if not input_dir.exists():
        logger.warning(f"Input directory {input_dir} does not exist, skipping precompute")
        return
    
    logger.info("=" * 60)
    logger.info("Precomputing Data from Archive")
    logger.info("=" * 60)
    
    # Find telemetry files
    telemetry_files = find_telemetry_files(input_dir)
    logger.info(f"Found {len(telemetry_files)} telemetry files")
    
    if not telemetry_files:
        logger.warning("No telemetry files found, skipping")
        return
    
    # Extract demo slices
    demo_slices_dir = out_dir / "demo_slices"
    slices = extract_sample_slices(telemetry_files, demo_slices_dir)
    
    # Compute aggregates
    precomputed_dir = out_dir / "precomputed"
    coverage = compute_lap_aggregates(telemetry_files, precomputed_dir)
    
    logger.info("=" * 60)
    logger.info(f"✓ Precompute complete")
    logger.info(f"  - Demo slices: {len(slices)} files")
    logger.info(f"  - Precomputed: coverage.json")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()



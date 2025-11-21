#!/usr/bin/env python3
"""
Batch process all 7 track map PDFs using the centerline extraction tool.
This script processes all PDFs in one go.
"""

import subprocess
import sys
from pathlib import Path


# Track name mappings
TRACK_MAPPINGS = {
    "Barber_Circuit_Map.pdf": "barber",
    "COTA_Circuit_Map.pdf": "cota",
    "Indy_Circuit_Map.pdf": "indy",
    "Road_America_Map.pdf": "road_america",
    "Sebring_Track_Sector_Map.pdf": "sebring",
    "Sonoma_Map.pdf": "sonoma",
    "VIR_mapk.pdf": "vir"
}


def find_pdf_files(root_dir: Path) -> list:
    """Find all track PDF files."""
    pdf_files = []
    
    # Check root directory
    for pdf_name, track_key in TRACK_MAPPINGS.items():
        pdf_path = root_dir / pdf_name
        if pdf_path.exists():
            pdf_files.append((pdf_path, track_key))
    
    # Check public/track-maps directory
    track_maps_dir = root_dir / "public" / "track-maps"
    if track_maps_dir.exists():
        for pdf_name, track_key in TRACK_MAPPINGS.items():
            pdf_path = track_maps_dir / pdf_name
            if pdf_path.exists() and pdf_path not in [p[0] for p in pdf_files]:
                pdf_files.append((pdf_path, track_key))
    
    return pdf_files


def process_all_pdfs(root_dir: Path, output_dir: Path = None, page: int = 0):
    """Process all PDF files using extract_centerline.py."""
    root_dir = Path(root_dir)
    output_dir = Path(output_dir) if output_dir else root_dir / "public" / "tracks"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Find extract_centerline.py script
    script_path = root_dir / "tools" / "extract_centerline.py"
    if not script_path.exists():
        print(f"Error: {script_path} not found!")
        sys.exit(1)
    
    pdf_files = find_pdf_files(root_dir)
    
    if not pdf_files:
        print("No track map PDFs found!")
        print(f"Looking in: {root_dir} and {root_dir / 'public' / 'track-maps'}")
        sys.exit(1)
    
    print(f"Found {len(pdf_files)} PDF file(s) to process:\n")
    for pdf_path, track_key in pdf_files:
        print(f"  - {pdf_path.name} -> {track_key}")
    
    print(f"\n{'='*60}")
    print("Processing PDFs...")
    print(f"{'='*60}\n")
    
    results = []
    
    for pdf_path, track_key in pdf_files:
        print(f"Processing: {pdf_path.name} (track: {track_key})")
        
        cmd = [
            sys.executable,
            str(script_path),
            str(pdf_path),
            "--track", track_key,
            "--out", str(output_dir),
            "--page", str(page)
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            print(f"  ✓ Success: {track_key}.svg")
            if result.stdout:
                print(f"    {result.stdout.strip()}")
            results.append((pdf_path, track_key, True, None))
        except subprocess.CalledProcessError as e:
            print(f"  ✗ Failed: {e}")
            if e.stdout:
                print(f"    stdout: {e.stdout}")
            if e.stderr:
                print(f"    stderr: {e.stderr}")
            results.append((pdf_path, track_key, False, str(e)))
        except Exception as e:
            print(f"  ✗ Error: {e}")
            results.append((pdf_path, track_key, False, str(e)))
        
        print()
    
    # Summary
    print(f"{'='*60}")
    print("Summary:")
    print(f"{'='*60}")
    successful = sum(1 for _, _, success, _ in results if success)
    failed = len(results) - successful
    
    print(f"  Successful: {successful}/{len(results)}")
    print(f"  Failed: {failed}/{len(results)}")
    
    if successful > 0:
        print(f"\nOutput directory: {output_dir}")
        print("\nGenerated files:")
        for pdf_path, track_key, success, _ in results:
            if success:
                svg_path = output_dir / f"{track_key}.svg"
                if svg_path.exists():
                    print(f"  ✓ {svg_path}")
    
    if failed > 0:
        print("\nFailed files:")
        for pdf_path, track_key, success, error in results:
            if not success:
                print(f"  ✗ {pdf_path.name} ({track_key}): {error}")
    
    return results


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Batch process all 7 track map PDFs"
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path.cwd(),
        help="Root directory (default: current directory)"
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output directory for SVGs (default: public/tracks)"
    )
    parser.add_argument(
        "--page",
        type=int,
        default=0,
        help="PDF page index (0-based, default: 0)"
    )
    
    args = parser.parse_args()
    
    process_all_pdfs(
        root_dir=args.root,
        output_dir=args.out,
        page=args.page
    )


if __name__ == "__main__":
    main()


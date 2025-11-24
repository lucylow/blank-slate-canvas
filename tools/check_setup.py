#!/usr/bin/env python3
"""
Quick setup checker for PDF extraction tool.
Verifies dependencies and checks for PDF files.
"""

import sys
from pathlib import Path

def check_dependencies():
    """Check if required Python packages are installed."""
    required = {
        'fitz': 'PyMuPDF',
        'PIL': 'Pillow',
        'cv2': 'opencv-python',
        'skimage': 'scikit-image',
        'shapely': 'shapely',
        'svgwrite': 'svgwrite',
        'numpy': 'numpy'
    }
    
    missing = []
    for module, package in required.items():
        try:
            __import__(module)
            print(f"✓ {package} installed")
        except ImportError:
            print(f"✗ {package} missing")
            missing.append(package)
    
    return len(missing) == 0, missing

def check_pdfs():
    """Check for PDF files in common locations."""
    locations = [
        Path("data/COTA_Circuit_Map.pdf"),
        Path("data/Barber_Circuit_Map.pdf"),
        Path("/mnt/data/COTA_Circuit_Map.pdf"),
        Path("/mnt/data/Barber_Circuit_Map.pdf"),
    ]
    
    found = []
    for pdf_path in locations:
        if pdf_path.exists():
            print(f"✓ Found: {pdf_path}")
            found.append(pdf_path)
        else:
            print(f"✗ Not found: {pdf_path}")
    
    return found

if __name__ == "__main__":
    print("=" * 60)
    print("PDF Extraction Tool - Setup Checker")
    print("=" * 60)
    print("\n1. Checking dependencies...")
    deps_ok, missing = check_dependencies()
    
    if not deps_ok:
        print(f"\n⚠ Missing dependencies: {', '.join(missing)}")
        print("Install with: pip install -r tools/requirements.txt")
    else:
        print("\n✓ All dependencies installed!")
    
    print("\n2. Checking for PDF files...")
    pdfs = check_pdfs()
    
    if pdfs:
        print(f"\n✓ Found {len(pdfs)} PDF file(s)")
        print("\nYou can now run extraction:")
        for pdf in pdfs:
            track_name = "cota" if "COTA" in pdf.name else "barber"
            print(f"  python tools/extract_centerline.py {pdf} --track {track_name} --out public/tracks")
    else:
        print("\n⚠ No PDF files found in expected locations")
        print("Please place PDFs in the 'data/' directory:")
        print("  - data/COTA_Circuit_Map.pdf")
        print("  - data/Barber_Circuit_Map.pdf")
    
    print("\n" + "=" * 60)





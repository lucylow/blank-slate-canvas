#!/usr/bin/env python3
"""
Extract Mermaid diagrams from README.md and convert them to JPEG images.
Uses mermaid-cli (mmdc) if available, or falls back to online API.
"""

import os
import re
import sys
import subprocess
from pathlib import Path
import base64
import json

# Configuration
README_PATH = Path("README.md")
OUT_DIR = Path("assets/images/diagrams_jpeg")
THUMB_DIR = OUT_DIR / "thumbs"
MAX_WIDTH = 1600
JPEG_QUALITY = 85
THUMB_SIZE = 400

# Create output directories
OUT_DIR.mkdir(parents=True, exist_ok=True)
THUMB_DIR.mkdir(parents=True, exist_ok=True)

def sanitize_filename(name):
    """Convert diagram title to safe filename."""
    name = name.lower()
    name = re.sub(r'[^a-z0-9_-]', '_', name)
    name = re.sub(r'_+', '_', name)
    return name.strip('_')[:50]  # Limit length

def extract_mermaid_diagrams(readme_path):
    """Extract all Mermaid diagrams from README."""
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match mermaid code blocks
    pattern = r'```mermaid\n(.*?)\n```'
    matches = re.finditer(pattern, content, re.DOTALL)
    
    diagrams = []
    for i, match in enumerate(matches):
        mermaid_code = match.group(1).strip()
        # Get context before the diagram to extract title
        start_pos = match.start()
        context = content[max(0, start_pos-200):start_pos]
        
        # Try to find a heading or description before the diagram
        title_match = re.search(r'###?\s+(.+?)(?:\n|$)', context)
        if title_match:
            title = title_match.group(1).strip()
        else:
            title = f"diagram_{i+1}"
        
        diagrams.append({
            'index': i + 1,
            'title': title,
            'code': mermaid_code,
            'match': match
        })
    
    return diagrams

def check_mermaid_cli():
    """Check if mermaid-cli (mmdc) is available."""
    try:
        result = subprocess.run(['mmdc', '--version'], 
                              capture_output=True, 
                              text=True, 
                              timeout=5)
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False

def convert_with_mermaid_cli(mermaid_code, output_path):
    """Convert Mermaid diagram using mermaid-cli."""
    try:
        # Create temporary mermaid file
        temp_mmd = output_path.with_suffix('.mmd')
        with open(temp_mmd, 'w') as f:
            f.write(mermaid_code)
        
        # Convert to PNG using mmdc
        result = subprocess.run([
            'mmdc',
            '-i', str(temp_mmd),
            '-o', str(output_path.with_suffix('.png')),
            '-w', str(MAX_WIDTH),
            '-b', 'white'
        ], capture_output=True, text=True, timeout=30)
        
        # Clean up temp file
        temp_mmd.unlink()
        
        if result.returncode == 0:
            # Convert PNG to JPEG using Pillow
            try:
                from PIL import Image
                img = Image.open(output_path.with_suffix('.png')).convert('RGB')
                img.save(output_path, 'JPEG', quality=JPEG_QUALITY)
                output_path.with_suffix('.png').unlink()  # Remove PNG
                return True
            except ImportError:
                print("  Warning: Pillow not available, keeping PNG")
                return True
        else:
            print(f"  Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"  Error with mermaid-cli: {e}")
        return False

def convert_with_api(mermaid_code, output_path):
    """Convert Mermaid diagram using Mermaid.ink API (fallback)."""
    try:
        import requests
        from PIL import Image
        from io import BytesIO
        
        # Encode mermaid code to base64
        encoded = base64.urlsafe_b64encode(mermaid_code.encode('utf-8')).decode('utf-8')
        url = f"https://mermaid.ink/img/{encoded}"
        
        # Download image
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            # Convert to JPEG
            img = Image.open(BytesIO(response.content)).convert('RGB')
            
            # Resize if needed
            if img.width > MAX_WIDTH:
                ratio = MAX_WIDTH / img.width
                new_height = int(img.height * ratio)
                img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
            
            img.save(output_path, 'JPEG', quality=JPEG_QUALITY)
            
            # Create thumbnail
            thumb = img.copy()
            thumb.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.LANCZOS)
            thumb_path = THUMB_DIR / f"{output_path.stem}_thumb.jpg"
            thumb.save(thumb_path, 'JPEG', quality=75)
            
            return True
        else:
            print(f"  API returned status {response.status_code}")
            return False
            
    except ImportError:
        print("  Error: requests library not available. Install with: pip install requests")
        return False
    except Exception as e:
        print(f"  Error with API: {e}")
        return False

def main():
    print("Extracting Mermaid diagrams from README.md...")
    diagrams = extract_mermaid_diagrams(README_PATH)
    
    if not diagrams:
        print("No Mermaid diagrams found.")
        return
    
    print(f"Found {len(diagrams)} Mermaid diagrams.")
    
    # Check for mermaid-cli
    has_mmdc = check_mermaid_cli()
    if has_mmdc:
        print("Using mermaid-cli (mmdc) for conversion...")
    else:
        print("mermaid-cli not found. Installing or using API fallback...")
        print("  To install: npm install -g @mermaid-js/mermaid-cli")
        print("  Falling back to online API...")
    
    converted = []
    
    for diagram in diagrams:
        print(f"\nProcessing diagram {diagram['index']}: {diagram['title']}")
        
        safe_name = sanitize_filename(diagram['title'])
        output_path = OUT_DIR / f"{safe_name}.jpg"
        thumb_path = THUMB_DIR / f"{safe_name}_thumb.jpg"
        
        # Skip if already exists
        if output_path.exists() and thumb_path.exists():
            print(f"  Already exists, skipping...")
            converted.append((diagram, output_path))
            continue
        
        # Try conversion
        success = False
        if has_mmdc:
            success = convert_with_mermaid_cli(diagram['code'], output_path)
        else:
            success = convert_with_api(diagram['code'], output_path)
        
        if success:
            print(f"  ✓ Converted to: {output_path.name}")
            converted.append((diagram, output_path))
        else:
            print(f"  ✗ Failed to convert")
    
    print(f"\n✓ Conversion complete! {len(converted)}/{len(diagrams)} diagrams converted.")
    print(f"  Images saved to: {OUT_DIR}")
    print(f"  Thumbnails saved to: {THUMB_DIR}")
    
    return converted

if __name__ == "__main__":
    main()


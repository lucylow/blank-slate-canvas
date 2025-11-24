#!/usr/bin/env python3
"""
Convert technical diagrams (PDFs, SVGs) to JPEG format for GitHub README.
Creates full-size images and thumbnails.
"""

import os
import sys
from pathlib import Path
import re

try:
    from PIL import Image
    import cairosvg
except ImportError:
    print("Installing required packages...")
    os.system(f"{sys.executable} -m pip install --quiet Pillow cairosvg")
    from PIL import Image
    try:
        import cairosvg
    except ImportError:
        print("Warning: cairosvg not available. SVG files will be skipped.")
        cairosvg = None

# Configuration
OUT_DIR = Path("assets/images/diagrams_jpeg")
THUMB_DIR = OUT_DIR / "thumbs"
MAX_WIDTH = 1600
JPEG_QUALITY = 85
THUMB_SIZE = 400

# Create output directories
OUT_DIR.mkdir(parents=True, exist_ok=True)
THUMB_DIR.mkdir(parents=True, exist_ok=True)

def sanitize_filename(name):
    """Convert filename to safe format."""
    # Remove extension, lowercase, replace spaces/special chars
    name = re.sub(r'\.[^.]+$', '', name)
    name = name.lower()
    name = re.sub(r'[^a-z0-9_-]', '_', name)
    name = re.sub(r'_+', '_', name)  # Collapse multiple underscores
    return name.strip('_')

def convert_pdf_to_jpeg(pdf_path, output_path, thumb_path):
    """Convert PDF to JPEG using Pillow (requires pdf2image or similar)."""
    try:
        # Try using pdf2image if available
        try:
            from pdf2image import convert_from_path
            images = convert_from_path(str(pdf_path), dpi=300, first_page=1, last_page=1)
            if images:
                img = images[0].convert('RGB')
                # Resize if needed
                if img.width > MAX_WIDTH:
                    ratio = MAX_WIDTH / img.width
                    new_height = int(img.height * ratio)
                    img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
                img.save(output_path, 'JPEG', quality=JPEG_QUALITY)
                # Create thumbnail
                thumb = img.copy()
                thumb.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.LANCZOS)
                thumb.save(thumb_path, 'JPEG', quality=75)
                return True
        except ImportError:
            print(f"  Warning: pdf2image not installed. Install with: pip install pdf2image")
            print(f"  Skipping PDF: {pdf_path.name}")
            return False
    except Exception as e:
        print(f"  Error converting PDF {pdf_path.name}: {e}")
        return False

def convert_svg_to_jpeg(svg_path, output_path, thumb_path):
    """Convert SVG to JPEG."""
    try:
        if cairosvg is None:
            print(f"  Warning: cairosvg not available. Skipping SVG: {svg_path.name}")
            return False
        
        # Convert SVG to PNG first (using cairosvg)
        png_path = output_path.with_suffix('.png')
        cairosvg.svg2png(url=str(svg_path), write_to=str(png_path), dpi=300)
        
        # Open PNG and convert to JPEG
        img = Image.open(png_path).convert('RGB')
        
        # Resize if needed
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            new_height = int(img.height * ratio)
            img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
        
        img.save(output_path, 'JPEG', quality=JPEG_QUALITY)
        
        # Create thumbnail
        thumb = img.copy()
        thumb.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.LANCZOS)
        thumb.save(thumb_path, 'JPEG', quality=75)
        
        # Clean up temporary PNG
        png_path.unlink()
        
        return True
    except Exception as e:
        print(f"  Error converting SVG {svg_path.name}: {e}")
        return False

def convert_png_to_jpeg(png_path, output_path, thumb_path):
    """Convert PNG to JPEG."""
    try:
        img = Image.open(png_path).convert('RGB')
        
        # Resize if needed
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            new_height = int(img.height * ratio)
            img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
        
        img.save(output_path, 'JPEG', quality=JPEG_QUALITY)
        
        # Create thumbnail
        thumb = img.copy()
        thumb.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.LANCZOS)
        thumb.save(thumb_path, 'JPEG', quality=75)
        
        return True
    except Exception as e:
        print(f"  Error converting PNG {png_path.name}: {e}")
        return False

def find_diagram_files():
    """Find all diagram files in the repository."""
    files = []
    
    # Search in common locations
    search_paths = [
        Path("public/track-maps"),
        Path("public/assets/track-maps"),
        Path("public/tracks"),
        Path("docs"),
    ]
    
    for search_path in search_paths:
        if search_path.exists():
            # Find PDFs
            for pdf_file in search_path.rglob("*.pdf"):
                files.append(pdf_file)
            # Find SVGs
            for svg_file in search_path.rglob("*.svg"):
                files.append(svg_file)
            # Find PNGs
            for png_file in search_path.rglob("*.png"):
                files.append(png_file)
    
    return files

def main():
    print("Finding diagram files...")
    diagram_files = find_diagram_files()
    
    if not diagram_files:
        print("No diagram files found.")
        return
    
    print(f"Found {len(diagram_files)} diagram files.")
    
    converted_files = []
    
    for file_path in diagram_files:
        print(f"\nProcessing: {file_path}")
        
        # Generate output filenames
        safe_name = sanitize_filename(file_path.stem)
        output_path = OUT_DIR / f"{safe_name}.jpg"
        thumb_path = THUMB_DIR / f"{safe_name}_thumb.jpg"
        
        # Skip if already converted
        if output_path.exists() and thumb_path.exists():
            print(f"  Already exists, skipping...")
            converted_files.append((file_path, output_path, thumb_path))
            continue
        
        # Convert based on file type
        success = False
        if file_path.suffix.lower() == '.pdf':
            success = convert_pdf_to_jpeg(file_path, output_path, thumb_path)
        elif file_path.suffix.lower() == '.svg':
            success = convert_svg_to_jpeg(file_path, output_path, thumb_path)
        elif file_path.suffix.lower() == '.png':
            success = convert_png_to_jpeg(file_path, output_path, thumb_path)
        else:
            print(f"  Unsupported file type: {file_path.suffix}")
            continue
        
        if success:
            print(f"  ✓ Converted to: {output_path.name}")
            converted_files.append((file_path, output_path, thumb_path))
    
    print(f"\n✓ Conversion complete! {len(converted_files)} files converted.")
    print(f"  Full-size images: {OUT_DIR}")
    print(f"  Thumbnails: {THUMB_DIR}")
    
    return converted_files

if __name__ == "__main__":
    main()


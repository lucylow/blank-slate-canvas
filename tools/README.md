# Track Centerline Extraction Tool

This tool extracts precise centerline paths from track PDF maps and generates SVG files compatible with LiveMapSVG.

## Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

Or install individually:

```bash
pip install PyMuPDF Pillow opencv-python scikit-image shapely svgwrite numpy
```

## Usage

### Extract centerline from a PDF

```bash
python tools/extract_centerline.py <pdf_path> --track <track_name> --out public/tracks
```

### Examples

**Extract COTA centerline:**
```bash
python tools/extract_centerline.py data/COTA_Circuit_Map.pdf --track cota --out public/tracks
```

**Extract Barber centerline:**
```bash
python tools/extract_centerline.py data/Barber_Circuit_Map.pdf --track barber --out public/tracks
```

**Use a specific PDF page:**
```bash
python tools/extract_centerline.py data/COTA_Circuit_Map.pdf --track cota --page 0 --out public/tracks
```

## How It Works

1. **Vector Extraction (preferred)**: Attempts to extract vector paths directly from the PDF using PyMuPDF
2. **Raster Fallback**: If vector extraction fails:
   - Renders PDF page to high-resolution PNG (400 DPI)
   - Preprocesses image (grayscale, adaptive threshold, morphological cleaning)
   - Skeletonizes to extract centerline
   - Converts skeleton to vector paths
   - Simplifies and normalizes to SVG format

## Output

The tool generates:
- `public/tracks/{track_name}.svg` - SVG file with `id="track-path"` element
- `public/tracks/{track_name}.png` - Intermediate raster image (if raster method used)

## Notes

- The output SVG uses a 1200×600 viewBox by default
- Path stroke is set to `#334155` with width 6
- The path element has `id="track-path"` for compatibility with LiveMapSVG
- For best results, use high-quality PDFs with clear track outlines


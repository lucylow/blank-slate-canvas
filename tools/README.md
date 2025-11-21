# PitWall AI Tools

This directory contains Python tools for processing race data and track maps.

## Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

Or install individually:

```bash
pip install PyMuPDF Pillow opencv-python scikit-image shapely svgwrite numpy pandas
```

## Usage

### Parse All 7 Track Map PDFs

**Comprehensive PDF parser** - Extracts text, metadata, images, and vector paths from all PDFs:

```bash
# Basic parsing (text, metadata, vector paths)
python tools/parse_track_maps.py

# With image extraction
python tools/parse_track_maps.py --extract-images

# With SVG extraction
python tools/parse_track_maps.py --extract-svg

# Custom output directory
python tools/parse_track_maps.py --output data/parsed_maps
```

**Batch centerline extraction** - Process all 7 PDFs using centerline extraction:

```bash
# Process all PDFs at once
python tools/batch_parse_maps.py

# Custom output directory
python tools/batch_parse_maps.py --out public/tracks

# Process specific page
python tools/batch_parse_maps.py --page 0
```

### Extract centerline from a single PDF

```bash
python tools/extract_centerline.py <pdf_path> --track <track_name> --out public/tracks
```

### Examples

**Parse all track maps:**
```bash
python tools/parse_track_maps.py --extract-svg --output data/parsed_track_maps
```

**Batch extract centerlines:**
```bash
python tools/batch_parse_maps.py --out public/tracks
```

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

---

## PDF Parsing Tools

### `parse_track_maps.py`

Comprehensive parser that extracts detailed information from all 7 track map PDFs:

**Features:**
- Extracts PDF metadata (title, author, creation date, etc.)
- Extracts text content from all pages
- Extracts images (optional)
- Extracts vector paths and drawing information
- Generates SVG representations (optional)
- Creates structured JSON output for each track

**Output Structure:**
```
data/parsed_track_maps/
├── parsing_summary.json          # Summary of all parsed PDFs
├── barber/
│   ├── barber_parsed.json        # Full parsing data
│   ├── barber.svg                # SVG representation (if --extract-svg)
│   └── images/                   # Extracted images (if --extract-images)
├── cota/
│   └── ...
└── ...
```

**Track Mappings:**
- `Barber_Circuit_Map.pdf` → `barber`
- `COTA_Circuit_Map.pdf` → `cota`
- `Indy_Circuit_Map.pdf` → `indy`
- `Road_America_Map.pdf` → `road_america`
- `Sebring_Track_Sector_Map.pdf` → `sebring`
- `Sonoma_Map.pdf` → `sonoma`
- `VIR_mapk.pdf` → `vir`

### `batch_parse_maps.py`

Batch processor that uses `extract_centerline.py` to process all 7 PDFs at once:

**Features:**
- Automatically finds all 7 track PDFs
- Processes each PDF using centerline extraction
- Generates SVG centerlines for all tracks
- Provides summary of successful/failed extractions

**Usage:**
```bash
# Process all PDFs
python tools/batch_parse_maps.py

# Custom output directory
python tools/batch_parse_maps.py --out public/tracks

# Process specific page
python tools/batch_parse_maps.py --page 0
```

---

## Data Integration Tool

The `data_integration.py` script processes and integrates race data from all 7 GR Cup tracks.

### Features

- **Multi-source data loading**: Telemetry, lap times, weather, results, and sector data
- **Real-time analytics**: Live gaps, tire wear calculations, lap time predictions
- **Mock data generation**: Generate realistic mock telemetry streams for testing
- **Multi-track processing**: Process data from all 7 tracks in batch

### Usage

```bash
# Run the data integration demonstration
python tools/data_integration.py
```

### Configuration

Edit the `BASE_PATH` variable in the script to point to your data directory:

```python
BASE_PATH = Path("/home/ubuntu/upload")  # Change to your data path
```

### Classes

#### `RaceDataLoader`
Handles loading and integration of race data:
- `load_telemetry(race_num)`: Load and pivot telemetry CSV
- `load_lap_times(race_num)`: Load lap timing data
- `load_weather(race_num)`: Load weather conditions
- `load_results(race_num)`: Load race results
- `load_endurance_sections(race_num)`: Load sector/endurance data
- `integrate_all_data(race_num)`: Merge all data sources

#### `RealTimeAnalytics`
Real-time analytics engine:
- `calculate_live_gaps()`: Calculate gaps between cars
- `calculate_tire_wear()`: Tire wear index based on G-forces
- `predict_lap_time()`: Predict lap times from sector performance
- `driver_consistency_score()`: Driver consistency metrics

### Example Output

The script demonstrates:
1. Loading real data from Barber track
2. Running analytics (gaps, tire wear, predictions, consistency)
3. Generating mock real-time data streams
4. Multi-track integration summary

### Track Names

The script supports all 7 GR Cup tracks:
- `barber`: Barber Motorsports Park
- `cota`: Circuit of the Americas
- `indianapolis`: Indianapolis Motor Speedway
- `road_america`: Road America
- `sebring`: Sebring International Raceway
- `sonoma`: Sonoma Raceway
- `vir`: Virginia International Raceway

### Notes

- Requires race data in CSV format organized by track and race number
- Handles semicolon-separated CSV files (weather, results)
- Automatically pivots telemetry data for easier analysis
- Uses `merge_asof` for time-based data merging


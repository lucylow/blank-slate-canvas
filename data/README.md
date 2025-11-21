# Track PDF Data

Place your track PDF maps in this directory.

## Expected Files

- `COTA_Circuit_Map.pdf` - Circuit of the Americas track map
- `Barber_Circuit_Map.pdf` - Barber Motorsports Park track map

## Usage

Once PDFs are placed here, run the extraction script:

```bash
# Extract COTA
python tools/extract_centerline.py data/COTA_Circuit_Map.pdf --track cota --out public/tracks

# Extract Barber
python tools/extract_centerline.py data/Barber_Circuit_Map.pdf --track barber --out public/tracks
```

The extracted SVG centerlines will be saved to `public/tracks/` and can be used immediately with the LiveMapSVG component.



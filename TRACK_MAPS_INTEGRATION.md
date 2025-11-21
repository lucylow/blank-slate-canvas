# Track Maps Integration

This document describes how the 7 track PDF maps are integrated into the frontend.

## Track PDF Files

All 7 track maps are located in `public/track-maps/`:

1. **Barber_Circuit_Map.pdf** - Barber Motorsports Park
2. **COTA_Circuit_Map.pdf** - Circuit of the Americas
3. **Indy_Circuit_Map.pdf** - Indianapolis Motor Speedway
4. **Road_America_Map.pdf** - Road America
5. **Sebring_Track_Sector_Map.pdf** - Sebring International Raceway
6. **Sonoma_Map.pdf** - Sonoma Raceway
7. **VIR_mapk.pdf** - Virginia International Raceway

## Track Mapping

The frontend uses a mapping object (`TRACK_PDF_MAP`) to associate track names with their PDF filenames:

```typescript
const TRACK_PDF_MAP: Record<string, string> = {
  "Circuit of the Americas": "COTA_Circuit_Map.pdf",
  "Road America": "Road_America_Map.pdf",
  "Sebring International": "Sebring_Track_Sector_Map.pdf",
  "Sonoma Raceway": "Sonoma_Map.pdf",
  "Barber Motorsports Park": "Barber_Circuit_Map.pdf",
  "Virginia International": "VIR_mapk.pdf",
  "Indianapolis Motor Speedway": "Indy_Circuit_Map.pdf",
};
```

## Integration Points

### 1. Tracks Page (`/tracks`)

The Tracks page (`src/pages/Tracks.tsx`) includes:

- **Track Cards**: Each track card displays track information
- **View Map Button**: When a track is expanded, a "View Track Map" button appears
- **PDF Viewer Dialog**: Clicking "View Map PDF" opens a modal dialog with an embedded PDF viewer
- **Open in New Tab**: Option to open the PDF in a new browser tab

**Features:**
- Embedded PDF viewer using `<iframe>`
- Full-screen modal dialog
- External link button to open PDF in new tab
- Responsive design

### 2. Index Page (Homepage)

The Index page (`src/pages/Index.tsx`) includes:

- **Track Section**: Displays all 7 tracks in a grid
- **View Track Map Link**: Each track card has a direct link to view the PDF map
- **External Link**: Opens PDF in a new tab

## Track IDs

Track IDs match the backend configuration:

- `cota` - Circuit of the Americas
- `road-america` - Road America
- `sebring` - Sebring International
- `sonoma` - Sonoma Raceway
- `barber` - Barber Motorsports Park
- `vir` - Virginia International Raceway
- `indianapolis` - Indianapolis Motor Speedway

## Usage

### Viewing Track Maps

**From Tracks Page:**
1. Navigate to `/tracks`
2. Click on a track card to expand it
3. Click "View Track Map" button
4. PDF opens in a modal dialog
5. Use "Open in New Tab" to view in full browser window

**From Homepage:**
1. Scroll to the "GR Cup Track Analytics" section
2. Click "View Track Map" link on any track card
3. PDF opens in a new browser tab

### Direct Access

PDFs can be accessed directly via URL:
```
/track-maps/COTA_Circuit_Map.pdf
/track-maps/Barber_Circuit_Map.pdf
/track-maps/Road_America_Map.pdf
/track-maps/Sebring_Track_Sector_Map.pdf
/track-maps/Sonoma_Map.pdf
/track-maps/VIR_mapk.pdf
/track-maps/Indy_Circuit_Map.pdf
```

## Technical Details

### PDF Storage
- Location: `public/track-maps/`
- Format: PDF files
- Naming: Matches original filenames from the root directory

### Components Used
- `Dialog` - Modal for PDF viewer
- `iframe` - Embedded PDF display
- `Button` - Action buttons
- Icons from `lucide-react`: `FileText`, `ExternalLink`, `MapPin`

### Browser Compatibility
- Modern browsers support PDF viewing in iframes
- Fallback: Users can open PDFs in new tabs if iframe doesn't work
- PDFs are served as static assets from `public/` directory

## Future Enhancements

Potential improvements:
1. Add PDF download buttons
2. Add track sector highlighting
3. Integrate with live telemetry data overlay
4. Add zoom/pan controls for PDF viewer
5. Add track comparison view

## Notes

- All PDFs are served as static assets (no backend required)
- PDFs are accessible to search engines (in `public/` directory)
- File sizes range from ~110KB to ~460KB
- Total size: ~1.6MB for all 7 maps



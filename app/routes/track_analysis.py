"""
Track Analysis Routes
Serves track analysis text files from docs/reports/ai_summary_reports/
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response, PlainTextResponse
from pathlib import Path
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["Track Analysis"])

# Path to track analysis files
TRACK_ANALYSIS_DIR = Path(__file__).parent.parent.parent / "docs" / "reports" / "ai_summary_reports"

# Track ID to filename mapping
TRACK_ANALYSIS_FILES = {
    "barber": "barber_analysis_report.txt",
    "cota": "cota_analysis_report.txt",
    "indianapolis": "INDIANAPOLIS_COMPREHENSIVE_ANALYSIS_REPORT.txt",
    "road_america": "ROAD_AMERICA_COMPREHENSIVE_ANALYSIS_REPORT.txt",
    "sebring": "SEBRING_COMPREHENSIVE_ANALYSIS_REPORT.txt",
    "sonoma": "SONOMA_COMPREHENSIVE_ANALYSIS_REPORT.txt",
    "virginia": "vir_data_analysis_report.txt",
}

# Alternative track ID mappings
TRACK_ID_ALIASES = {
    "vir": "virginia",
    "road_america": "road_america",
    "road-america": "road_america",
}


@router.get("/analysis/{track_id}")
async def get_track_analysis(track_id: str):
    """
    Get track analysis file content for a specific track
    
    Returns the full text content of the analysis file.
    """
    # Normalize track ID (handle aliases)
    track_id_normalized = TRACK_ID_ALIASES.get(track_id.lower(), track_id.lower())
    
    # Get filename
    filename = TRACK_ANALYSIS_FILES.get(track_id_normalized)
    if not filename:
        # Try to find by partial match
        matching = [k for k in TRACK_ANALYSIS_FILES.keys() if track_id_normalized in k or k in track_id_normalized]
        if matching:
            filename = TRACK_ANALYSIS_FILES[matching[0]]
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Track analysis not found for track: {track_id}. Available tracks: {', '.join(TRACK_ANALYSIS_FILES.keys())}"
            )
    
    # Build file path
    file_path = TRACK_ANALYSIS_DIR / filename
    
    if not file_path.exists():
        logger.warning(f"Track analysis file not found: {file_path}")
        # Try alternative locations
        alt_paths = [
            Path(__file__).parent.parent.parent / "reports" / f"{track_id_normalized}_race_analysis.md",
            TRACK_ANALYSIS_DIR.parent / filename,
        ]
        
        found = False
        for alt_path in alt_paths:
            if alt_path.exists():
                file_path = alt_path
                found = True
                break
        
        if not found:
            raise HTTPException(
                status_code=404,
                detail=f"Track analysis file not found for track: {track_id}. Expected: {file_path}"
            )
    
    try:
        # Read file content
        content = file_path.read_text(encoding="utf-8")
        
        # Return as plain text
        return PlainTextResponse(content=content, media_type="text/plain")
    except Exception as e:
        logger.error(f"Error reading track analysis file {file_path}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error reading track analysis file: {str(e)}"
        )


@router.get("/analysis")
async def list_all_track_analyses():
    """
    List all available track analyses
    
    Returns metadata about all available track analysis files.
    """
    analyses = []
    
    for track_id, filename in TRACK_ANALYSIS_FILES.items():
        file_path = TRACK_ANALYSIS_DIR / filename
        
        # Check if file exists
        exists = file_path.exists()
        if not exists:
            # Try alternative locations
            alt_paths = [
                Path(__file__).parent.parent.parent / "reports" / f"{track_id}_race_analysis.md",
                TRACK_ANALYSIS_DIR.parent / filename,
            ]
            for alt_path in alt_paths:
                if alt_path.exists():
                    file_path = alt_path
                    exists = True
                    break
        
        if exists:
            try:
                content = file_path.read_text(encoding="utf-8")
                # Get first few lines as preview
                preview_lines = content.split("\n")[:5]
                preview = "\n".join(preview_lines)
                
                analyses.append({
                    "track_id": track_id,
                    "filename": filename,
                    "exists": True,
                    "size_bytes": len(content.encode("utf-8")),
                    "preview": preview,
                    "path": str(file_path.relative_to(Path(__file__).parent.parent.parent))
                })
            except Exception as e:
                logger.warning(f"Error reading analysis file {file_path}: {e}")
                analyses.append({
                    "track_id": track_id,
                    "filename": filename,
                    "exists": True,
                    "error": str(e)
                })
        else:
            analyses.append({
                "track_id": track_id,
                "filename": filename,
                "exists": False
            })
    
    return {
        "total": len(analyses),
        "available": len([a for a in analyses if a.get("exists")]),
        "analyses": analyses
    }


@router.get("/analysis/bulk")
async def get_all_track_analyses():
    """
    Get all available track analyses in a single response
    
    Returns a dictionary mapping track_id to analysis content.
    """
    all_analyses = {}
    
    for track_id, filename in TRACK_ANALYSIS_FILES.items():
        file_path = TRACK_ANALYSIS_DIR / filename
        
        if not file_path.exists():
            # Try alternative locations
            alt_paths = [
                Path(__file__).parent.parent.parent / "reports" / f"{track_id}_race_analysis.md",
                TRACK_ANALYSIS_DIR.parent / filename,
            ]
            for alt_path in alt_paths:
                if alt_path.exists():
                    file_path = alt_path
                    break
        
        if file_path.exists():
            try:
                content = file_path.read_text(encoding="utf-8")
                all_analyses[track_id] = {
                    "track_id": track_id,
                    "filename": filename,
                    "content": content,
                    "size_bytes": len(content.encode("utf-8"))
                }
            except Exception as e:
                logger.warning(f"Error reading analysis file {file_path}: {e}")
                all_analyses[track_id] = {
                    "track_id": track_id,
                    "filename": filename,
                    "error": str(e)
                }
    
    return {
        "total": len(all_analyses),
        "analyses": all_analyses
    }


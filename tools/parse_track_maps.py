#!/usr/bin/env python3
"""
Parse all 7 track map PDFs and extract useful information.
Extracts text, metadata, images, and vector paths from each PDF.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# PDF processing
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False
    print("Warning: PyMuPDF not installed. Install with: pip install PyMuPDF")

# Image processing (optional)
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


class PDFParser:
    """Parser for track map PDFs."""
    
    def __init__(self, pdf_path: Path):
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
        self.doc = None
        self.metadata = {}
        self.pages_data = []
        
    def open(self):
        """Open the PDF document."""
        if not HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is required. Install with: pip install PyMuPDF")
        self.doc = fitz.open(str(self.pdf_path))
        return self
        
    def close(self):
        """Close the PDF document."""
        if self.doc:
            self.doc.close()
            self.doc = None
    
    def extract_metadata(self) -> Dict[str, Any]:
        """Extract PDF metadata."""
        if not self.doc:
            self.open()
        
        metadata = {
            "file_name": self.pdf_path.name,
            "file_size_bytes": self.pdf_path.stat().st_size,
            "num_pages": len(self.doc),
            "pdf_metadata": {}
        }
        
        # Get PDF metadata
        pdf_meta = self.doc.metadata
        if pdf_meta:
            for key, value in pdf_meta.items():
                if value:
                    metadata["pdf_metadata"][key] = value
        
        self.metadata = metadata
        return metadata
    
    def extract_text(self, page_num: int = 0) -> Dict[str, Any]:
        """Extract text from a specific page."""
        if not self.doc:
            self.open()
        
        if page_num >= len(self.doc):
            return {"error": f"Page {page_num} does not exist (PDF has {len(self.doc)} pages)"}
        
        page = self.doc[page_num]
        text = page.get_text()
        
        # Get text blocks with positions
        blocks = page.get_text("dict")
        
        return {
            "page": page_num,
            "text": text,
            "text_blocks": blocks.get("blocks", []),
            "num_blocks": len(blocks.get("blocks", [])),
            "text_length": len(text)
        }
    
    def extract_images(self, page_num: int = 0, output_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
        """Extract images from a specific page."""
        if not self.doc:
            self.open()
        
        if page_num >= len(self.doc):
            return []
        
        page = self.doc[page_num]
        image_list = page.get_images()
        images_data = []
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = self.doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            img_info = {
                "index": img_index,
                "xref": xref,
                "width": base_image["width"],
                "height": base_image["height"],
                "colorspace": base_image["colorspace"],
                "bpc": base_image["bpc"],
                "size_bytes": len(image_bytes),
                "ext": image_ext
            }
            
            # Save image if output directory provided
            if output_dir:
                output_dir = Path(output_dir)
                output_dir.mkdir(parents=True, exist_ok=True)
                img_filename = f"page{page_num}_img{img_index}.{image_ext}"
                img_path = output_dir / img_filename
                with open(img_path, "wb") as img_file:
                    img_file.write(image_bytes)
                img_info["saved_path"] = str(img_path)
            
            images_data.append(img_info)
        
        return images_data
    
    def extract_vector_paths(self, page_num: int = 0) -> Dict[str, Any]:
        """Extract vector paths from a specific page."""
        if not self.doc:
            self.open()
        
        if page_num >= len(self.doc):
            return {"error": f"Page {page_num} does not exist"}
        
        page = self.doc[page_num]
        
        # Get drawing paths
        paths = []
        drawings = page.get_drawings()
        
        for drawing in drawings:
            path_info = {
                "type": drawing.get("type", "unknown"),
                "rect": drawing.get("rect", []),
                "color": drawing.get("color", []),
                "fill": drawing.get("fill", []),
                "width": drawing.get("width", 0),
                "items": len(drawing.get("items", []))
            }
            paths.append(path_info)
        
        # Try to get SVG representation
        svg_content = None
        try:
            svg_content = page.get_svg_image()
        except Exception as e:
            svg_content = f"Error generating SVG: {str(e)}"
        
        return {
            "page": page_num,
            "num_paths": len(paths),
            "paths": paths,
            "svg_available": svg_content is not None and not svg_content.startswith("Error"),
            "svg_length": len(svg_content) if svg_content else 0
        }
    
    def extract_page_summary(self, page_num: int = 0) -> Dict[str, Any]:
        """Get a comprehensive summary of a page."""
        if not self.doc:
            self.open()
        
        page = self.doc[page_num]
        rect = page.rect
        
        summary = {
            "page": page_num,
            "dimensions": {
                "width": rect.width,
                "height": rect.height,
                "width_points": rect.width,
                "height_points": rect.height
            },
            "rotation": page.rotation,
            "text": self.extract_text(page_num),
            "images": self.extract_images(page_num),
            "vector_paths": self.extract_vector_paths(page_num)
        }
        
        return summary
    
    def parse_all_pages(self, extract_images: bool = False, image_output_dir: Optional[Path] = None) -> Dict[str, Any]:
        """Parse all pages in the PDF."""
        if not self.doc:
            self.open()
        
        result = {
            "metadata": self.extract_metadata(),
            "pages": []
        }
        
        for page_num in range(len(self.doc)):
            print(f"  Processing page {page_num + 1}/{len(self.doc)}...")
            page_data = self.extract_page_summary(page_num)
            
            if extract_images and image_output_dir:
                page_data["images"] = self.extract_images(page_num, image_output_dir)
            
            result["pages"].append(page_data)
        
        return result


def find_all_track_pdfs(root_dir: Path) -> List[Path]:
    """Find all track map PDFs in the repository."""
    pdf_files = []
    
    # Known PDF filenames
    known_pdfs = [
        "Barber_Circuit_Map.pdf",
        "COTA_Circuit_Map.pdf",
        "Indy_Circuit_Map.pdf",
        "Road_America_Map.pdf",
        "Sebring_Track_Sector_Map.pdf",
        "Sonoma_Map.pdf",
        "VIR_mapk.pdf"
    ]
    
    # Search in root and public/track-maps
    search_dirs = [
        root_dir,
        root_dir / "public" / "track-maps"
    ]
    
    for search_dir in search_dirs:
        if not search_dir.exists():
            continue
        
        for pdf_name in known_pdfs:
            pdf_path = search_dir / pdf_name
            if pdf_path.exists() and pdf_path not in pdf_files:
                pdf_files.append(pdf_path)
    
    return sorted(pdf_files)


def get_track_key(pdf_path: Path) -> str:
    """Extract track key from PDF filename."""
    name = pdf_path.stem.lower()
    
    # Map filenames to track keys
    mappings = {
        "barber_circuit_map": "barber",
        "cota_circuit_map": "cota",
        "indy_circuit_map": "indy",
        "road_america_map": "road_america",
        "sebring_track_sector_map": "sebring",
        "sonoma_map": "sonoma",
        "vir_mapk": "vir"
    }
    
    for key, value in mappings.items():
        if key in name:
            return value
    
    # Fallback: sanitize filename
    return name.replace("_", "-").replace(" ", "-")


def parse_all_track_maps(
    root_dir: Path,
    output_dir: Path,
    extract_images: bool = False,
    extract_svg: bool = False
) -> Dict[str, Any]:
    """Parse all 7 track map PDFs."""
    root_dir = Path(root_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    pdf_files = find_all_track_pdfs(root_dir)
    
    if not pdf_files:
        print("No track map PDFs found!")
        return {}
    
    print(f"Found {len(pdf_files)} PDF file(s):")
    for pdf in pdf_files:
        print(f"  - {pdf}")
    
    results = {
        "parsed_at": datetime.now().isoformat(),
        "total_pdfs": len(pdf_files),
        "tracks": {}
    }
    
    for pdf_path in pdf_files:
        track_key = get_track_key(pdf_path)
        print(f"\n{'='*60}")
        print(f"Parsing: {pdf_path.name} (track: {track_key})")
        print(f"{'='*60}")
        
        try:
            parser = PDFParser(pdf_path)
            parser.open()
            
            # Parse the PDF
            track_data = parser.parse_all_pages(
                extract_images=extract_images,
                image_output_dir=output_dir / track_key / "images" if extract_images else None
            )
            
            # Save SVG if requested
            if extract_svg and track_data["pages"]:
                svg_dir = output_dir / track_key
                svg_dir.mkdir(parents=True, exist_ok=True)
                page = parser.doc[0]  # First page
                try:
                    svg_content = page.get_svg_image()
                    svg_path = svg_dir / f"{track_key}.svg"
                    with open(svg_path, "w", encoding="utf-8") as f:
                        f.write(svg_content)
                    track_data["svg_path"] = str(svg_path)
                    print(f"  ✓ Saved SVG: {svg_path}")
                except Exception as e:
                    print(f"  ⚠ Could not extract SVG: {e}")
            
            parser.close()
            
            # Save individual track JSON
            track_json_path = output_dir / track_key / f"{track_key}_parsed.json"
            track_json_path.parent.mkdir(parents=True, exist_ok=True)
            with open(track_json_path, "w", encoding="utf-8") as f:
                json.dump(track_data, f, indent=2, default=str)
            print(f"  ✓ Saved JSON: {track_json_path}")
            
            results["tracks"][track_key] = {
                "pdf_path": str(pdf_path),
                "parsed_data_path": str(track_json_path),
                "num_pages": track_data["metadata"]["num_pages"],
                "file_size_bytes": track_data["metadata"]["file_size_bytes"]
            }
            
        except Exception as e:
            print(f"  ✗ Error parsing {pdf_path.name}: {e}")
            results["tracks"][track_key] = {
                "pdf_path": str(pdf_path),
                "error": str(e)
            }
    
    # Save summary
    summary_path = output_dir / "parsing_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n{'='*60}")
    print(f"Summary saved to: {summary_path}")
    print(f"{'='*60}")
    
    return results


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Parse all 7 track map PDFs and extract information"
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path.cwd(),
        help="Root directory to search for PDFs (default: current directory)"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/parsed_track_maps"),
        help="Output directory for parsed data (default: data/parsed_track_maps)"
    )
    parser.add_argument(
        "--extract-images",
        action="store_true",
        help="Extract images from PDFs"
    )
    parser.add_argument(
        "--extract-svg",
        action="store_true",
        help="Extract SVG representations from PDFs"
    )
    
    args = parser.parse_args()
    
    if not HAS_PYMUPDF:
        print("Error: PyMuPDF is required for PDF parsing.")
        print("Install with: pip install PyMuPDF")
        sys.exit(1)
    
    parse_all_track_maps(
        root_dir=args.root,
        output_dir=args.output,
        extract_images=args.extract_images,
        extract_svg=args.extract_svg
    )


if __name__ == "__main__":
    main()




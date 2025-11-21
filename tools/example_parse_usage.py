#!/usr/bin/env python3
"""
Example usage of the PDF parsing tools.
Shows how to use the parser programmatically.
"""

from pathlib import Path
from parse_track_maps import PDFParser, find_all_track_pdfs, get_track_key


def example_single_pdf():
    """Example: Parse a single PDF."""
    print("=" * 60)
    print("Example 1: Parse a single PDF")
    print("=" * 60)
    
    # Find a PDF
    pdf_files = find_all_track_pdfs(Path.cwd())
    if not pdf_files:
        print("No PDFs found!")
        return
    
    pdf_path = pdf_files[0]
    print(f"Parsing: {pdf_path}")
    
    # Create parser
    parser = PDFParser(pdf_path)
    parser.open()
    
    try:
        # Extract metadata
        metadata = parser.extract_metadata()
        print(f"\nMetadata:")
        print(f"  Pages: {metadata['num_pages']}")
        print(f"  Size: {metadata['file_size_bytes']} bytes")
        
        # Extract text from first page
        text_data = parser.extract_text(page_num=0)
        print(f"\nText from page 0:")
        print(f"  Length: {text_data['text_length']} characters")
        print(f"  Blocks: {text_data['num_blocks']}")
        if text_data['text']:
            preview = text_data['text'][:200].replace('\n', ' ')
            print(f"  Preview: {preview}...")
        
        # Extract vector paths
        paths_data = parser.extract_vector_paths(page_num=0)
        print(f"\nVector paths:")
        print(f"  Number of paths: {paths_data['num_paths']}")
        print(f"  SVG available: {paths_data['svg_available']}")
        
    finally:
        parser.close()


def example_all_pdfs():
    """Example: Parse all PDFs and get summaries."""
    print("\n" + "=" * 60)
    print("Example 2: Find and list all track PDFs")
    print("=" * 60)
    
    pdf_files = find_all_track_pdfs(Path.cwd())
    
    if not pdf_files:
        print("No PDFs found!")
        return
    
    print(f"Found {len(pdf_files)} PDF file(s):\n")
    
    for pdf_path in pdf_files:
        track_key = get_track_key(pdf_path)
        print(f"  {pdf_path.name}")
        print(f"    Track key: {track_key}")
        print(f"    Path: {pdf_path}")
        
        # Quick metadata check
        try:
            parser = PDFParser(pdf_path)
            parser.open()
            metadata = parser.extract_metadata()
            parser.close()
            print(f"    Pages: {metadata['num_pages']}, Size: {metadata['file_size_bytes']} bytes")
        except Exception as e:
            print(f"    Error: {e}")
        print()


def example_extract_images():
    """Example: Extract images from a PDF."""
    print("\n" + "=" * 60)
    print("Example 3: Extract images from a PDF")
    print("=" * 60)
    
    pdf_files = find_all_track_pdfs(Path.cwd())
    if not pdf_files:
        print("No PDFs found!")
        return
    
    pdf_path = pdf_files[0]
    print(f"Extracting images from: {pdf_path.name}")
    
    output_dir = Path("data/example_images")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    parser = PDFParser(pdf_path)
    parser.open()
    
    try:
        images = parser.extract_images(page_num=0, output_dir=output_dir)
        print(f"\nFound {len(images)} image(s) on page 0:")
        for img in images:
            print(f"  Image {img['index']}:")
            print(f"    Size: {img['width']}x{img['height']}")
            print(f"    Format: {img['ext']}")
            print(f"    File size: {img['size_bytes']} bytes")
            if 'saved_path' in img:
                print(f"    Saved to: {img['saved_path']}")
    finally:
        parser.close()


if __name__ == "__main__":
    print("PDF Parser Examples")
    print("=" * 60)
    
    try:
        example_single_pdf()
        example_all_pdfs()
        example_extract_images()
        
        print("\n" + "=" * 60)
        print("Examples completed!")
        print("=" * 60)
        print("\nTo parse all PDFs, run:")
        print("  python tools/parse_track_maps.py")
        print("\nTo batch extract centerlines, run:")
        print("  python tools/batch_parse_maps.py")
        
    except ImportError as e:
        print(f"Error: {e}")
        print("Make sure PyMuPDF is installed: pip install PyMuPDF")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


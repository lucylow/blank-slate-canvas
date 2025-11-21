#!/usr/bin/env python3
"""
Convert Markdown report to PDF
Uses available libraries to generate a professional PDF report
"""

import sys
import re
from pathlib import Path

try:
    from markdown import markdown
    HAS_MARKDOWN = True
except ImportError:
    HAS_MARKDOWN = False

try:
    import markdown2
    HAS_MARKDOWN2 = True
except ImportError:
    HAS_MARKDOWN2 = False

try:
    from weasyprint import HTML
    HAS_WEASYPRINT = True
except ImportError:
    HAS_WEASYPRINT = False

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
    from reportlab.lib import colors
    from reportdown import convert_markdown
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


def markdown_to_html(md_content: str) -> str:
    """Convert markdown to HTML"""
    if HAS_MARKDOWN2:
        html = markdown2.markdown(md_content, extras=['tables', 'fenced-code-blocks'])
    elif HAS_MARKDOWN:
        # Use markdown library
        html = markdown(md_content, extensions=['tables', 'fenced_code'])
    else:
        # Very basic fallback - just escape HTML and add some formatting
        html = "<pre>" + md_content.replace('<', '&lt;').replace('>', '&gt;') + "</pre>"
    
    # Add CSS styling
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: 'Helvetica', 'Arial', sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                color: #333;
            }}
            h1 {{
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
            }}
            h2 {{
                color: #34495e;
                border-bottom: 2px solid #95a5a6;
                padding-bottom: 5px;
                margin-top: 30px;
            }}
            h3 {{
                color: #34495e;
                margin-top: 25px;
            }}
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }}
            th {{
                background-color: #3498db;
                color: white;
                font-weight: bold;
            }}
            tr:nth-child(even) {{
                background-color: #f2f2f2;
            }}
            code {{
                background-color: #f4f4f4;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
            }}
            pre {{
                background-color: #f4f4f4;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
            }}
            blockquote {{
                border-left: 4px solid #3498db;
                margin: 20px 0;
                padding-left: 20px;
                color: #555;
            }}
            ul, ol {{
                margin: 15px 0;
                padding-left: 30px;
            }}
            li {{
                margin: 5px 0;
            }}
            hr {{
                border: none;
                border-top: 2px solid #ecf0f1;
                margin: 30px 0;
            }}
        </style>
    </head>
    <body>
        {html}
    </body>
    </html>
    """
    return styled_html


def convert_to_pdf(input_file: str, output_file: str):
    """Convert markdown file to PDF"""
    md_path = Path(input_file)
    pdf_path = Path(output_file)
    
    if not md_path.exists():
        print(f"Error: Input file {input_file} not found")
        return False
    
    print(f"Reading markdown from {md_path}...")
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert to HTML
    print("Converting markdown to HTML...")
    html_content = markdown_to_html(md_content)
    
    # Convert HTML to PDF
    if HAS_WEASYPRINT:
        print(f"Generating PDF with WeasyPrint...")
        try:
            HTML(string=html_content).write_pdf(pdf_path)
            print(f"✓ PDF saved to {pdf_path.absolute()}")
            return True
        except Exception as e:
            print(f"Error generating PDF with WeasyPrint: {e}")
            print("Trying alternative method...")
    
    # Alternative: Save as HTML and instruct user
    html_path = pdf_path.with_suffix('.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"\n✓ HTML version saved to {html_path.absolute()}")
    print(f"\nTo convert to PDF, you can:")
    print(f"  1. Open {html_path} in a browser and print to PDF")
    print(f"  2. Install WeasyPrint: pip install weasyprint")
    print(f"     Then run: weasyprint {html_path} {pdf_path}")
    print(f"  3. Install pandoc: https://pandoc.org/installing.html")
    print(f"     Then run: pandoc {md_path} -o {pdf_path}")
    
    return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python markdown_to_pdf.py <input.md> [output.pdf]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else Path(input_file).with_suffix('.pdf')
    
    success = convert_to_pdf(input_file, output_file)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()


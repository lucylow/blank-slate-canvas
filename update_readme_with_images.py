#!/usr/bin/env python3
"""
Replace Mermaid code blocks in README.md with image links.
"""

import re
from pathlib import Path

README_PATH = Path("README.md")
OUT_DIR = Path("assets/images/diagrams_jpeg")

def sanitize_filename(title):
    """Convert diagram title to safe filename (same as conversion script)."""
    title = title.lower()
    title = re.sub(r'[^a-z0-9_-]', '_', title)
    title = re.sub(r'_+', '_', title)
    return title.strip('_')[:50]

def extract_and_replace_mermaid(readme_path):
    """Extract Mermaid diagrams and replace with image links."""
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match mermaid code blocks
    pattern = r'```mermaid\n(.*?)\n```'
    
    def replace_with_image(match):
        mermaid_code = match.group(1).strip()
        start_pos = match.start()
        
        # Get context to find title - look further back and check multiple patterns
        context = content[max(0, start_pos-500):start_pos]
        # Try multiple patterns for finding the title
        title_match = re.search(r'###?\s+(.+?)(?:\n|$)', context)
        title = None
        
        if title_match:
            title = title_match.group(1).strip()
        else:
            # Try looking for subgraph titles in the mermaid code itself
            subgraph_match = re.search(r'subgraph\s+"([^"]+)"', mermaid_code)
            if subgraph_match:
                title = subgraph_match.group(1).strip()
            else:
                # Try looking for section headers with colons
                colon_match = re.search(r'^([^:]+):\s*$', context, re.MULTILINE)
                if colon_match:
                    title = colon_match.group(1).strip()
        
        if not title:
            title = "diagram"
        
        # Keep the original title format for matching
        original_title = title
        # Clean up title (remove numbering, etc.)
        title = re.sub(r'^\d+\.\s*', '', title)  # Remove leading numbers
        title_clean = re.sub(r'\s*\([^)]+\)', '', title)  # Remove parentheticals
        
        # Try multiple filename variations
        safe_name = sanitize_filename(title_clean)
        safe_name_with_num = sanitize_filename(original_title)  # Keep numbers
        
        # Check both variations
        image_path = OUT_DIR / f"{safe_name_with_num}.jpg"
        if not image_path.exists():
            image_path = OUT_DIR / f"{safe_name}.jpg"
        
        # Check if image exists
        if image_path.exists():
            # Return markdown image link
            rel_path = str(image_path).replace('\\', '/')  # Use forward slashes
            return f'![{title_clean}]({rel_path})'
        else:
            # Keep original mermaid if image doesn't exist
            print(f"  Warning: Image not found for '{title_clean}' (tried: {safe_name_with_num}.jpg, {safe_name}.jpg)")
            return match.group(0)
    
    # Replace all mermaid blocks
    new_content = re.sub(pattern, replace_with_image, content, flags=re.DOTALL)
    
    return new_content

def main():
    print("Updating README.md with image links...")
    
    new_content = extract_and_replace_mermaid(README_PATH)
    
    # Write backup
    backup_path = README_PATH.with_suffix('.md.backup')
    with open(backup_path, 'w', encoding='utf-8') as f:
        with open(README_PATH, 'r', encoding='utf-8') as orig:
            f.write(orig.read())
    print(f"Backup saved to: {backup_path}")
    
    # Write updated content
    with open(README_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✓ README.md updated with image links!")

if __name__ == "__main__":
    main()


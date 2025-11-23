# tools/extract_centerline.py

import os
import sys
import json
from pathlib import Path
import numpy as np

# optional: vector extraction
try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

# raster processing
from PIL import Image
import cv2
from skimage.morphology import skeletonize
from skimage import img_as_ubyte
from svgwrite import Drawing
from shapely.geometry import LineString
from shapely.ops import unary_union, linemerge
from math import hypot

# ---- helper functions ----

def render_pdf_to_png(pdf_path, page_no=0, dpi=300, out_png=None):
    if fitz is None:
        raise RuntimeError("PyMuPDF (fitz) is required for PDF rendering. `pip install PyMuPDF`")
    doc = fitz.open(pdf_path)
    page = doc[page_no]
    mat = fitz.Matrix(dpi/72, dpi/72)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    out_png = out_png or (Path(pdf_path).with_suffix(f".p{page_no}.png"))
    pix.save(str(out_png))
    return str(out_png)

def preprocess_image(png_path, blur=3):
    img = cv2.imread(str(png_path), cv2.IMREAD_GRAYSCALE)
    # contrast normalize
    img = cv2.equalizeHist(img)
    # adaptive threshold (works across scans)
    th = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY_INV, 25, 8)
    # morphological opening to remove small specks
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
    th = cv2.morphologyEx(th, cv2.MORPH_OPEN, kernel, iterations=1)
    return th

def extract_centerline_from_binary(bin_img):
    # skeletonize (expects boolean)
    bw = bin_img > 0
    skel = skeletonize(bw)
    skel = img_as_ubyte(skel)
    return skel

def get_line_strings_from_skeleton(skel):
    # Convert skeleton pixels to polyline clusters (walk pixels)
    h,w = skel.shape
    visited = np.zeros_like(skel, dtype=np.uint8)
    lines = []

    def neighbors(y,x):
        for dy in (-1,0,1):
            for dx in (-1,0,1):
                if dy==0 and dx==0: continue
                ny, nx = y+dy, x+dx
                if 0<=ny<h and 0<=nx<w and skel[ny,nx]:
                    yield ny,nx

    for y in range(h):
        for x in range(w):
            if skel[y,x] and not visited[y,x]:
                # start new chain - walk until end (naive traversal)
                pts = [(x,y)]
                visited[y,x]=1
                cur = (y,x)
                while True:
                    neighs = [n for n in neighbors(*cur) if not visited[n]]
                    if not neighs:
                        # mark neighbors visited to avoid loops
                        for n in neighbors(*cur):
                            visited[n]=1
                        break
                    nxt = neighs[0]
                    pts.append((nxt[1], nxt[0]))
                    visited[nxt] = 1
                    cur = nxt
                if len(pts) > 3:
                    lines.append(LineString(pts))
    # merge small segments
    if not lines:
        return []
    merged = linemerge(unary_union(lines))
    if isinstance(merged, LineString):
        return [merged]
    else:
        return list(merged)

def simplify_lines_to_svg(line_strings, out_svg_path, view_w=1200, view_h=600, stroke="#334155", stroke_width=6):
    # Combine into a single long path (pick longest)
    if not line_strings:
        raise RuntimeError("No lines to write")
    # pick largest by length
    best = sorted(line_strings, key=lambda L: L.length, reverse=True)[0]
    coords = list(best.coords)
    # coordinate normalization: map original pixel coords to viewbox
    xs = [p[0] for p in coords]; ys = [p[1] for p in coords]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    w = maxx - minx if maxx>minx else 1
    h = maxy - miny if maxy>miny else 1
    # maintain aspect
    scale = min(view_w / w, view_h / h) * 0.9
    tx = (view_w - w*scale)/2
    ty = (view_h - h*scale)/2
    # build path d
    d = []
    for i,(x,y) in enumerate(coords):
        X = (x - minx) * scale + tx
        Y = (y - miny) * scale + ty
        if i==0:
            d.append(f"M{X:.2f},{Y:.2f}")
        else:
            d.append(f"L{X:.2f},{Y:.2f}")
    d_str = " ".join(d)
    dwg = Drawing(str(out_svg_path), size=(f"{view_w}px", f"{view_h}px"), profile="tiny")
    dwg.add(dwg.path(d=d_str, stroke=stroke, fill="none", stroke_width=stroke_width, stroke_linecap="round", stroke_linejoin="round", id="track-path"))
    dwg.save()
    return str(out_svg_path)

# ---- main pipeline ----

def process_pdf(pdf_path, out_dir, track_key, page_no=0):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    # 1) try parse vector paths via PyMuPDF path extraction (if available)
    svg_out = out_dir / f"{track_key}.svg"
    try:
        if fitz:
            doc = fitz.open(pdf_path)
            page = doc[page_no]
            # try to extract path data (simple approach: save page to SVG using MuPDF)
            svg_blob = page.get_svg_image()
            # quick heuristic: find any <path id="..."> with meaningful d attribute
            if svg_blob and "path" in svg_blob:
                with open(svg_out, "w", encoding="utf8") as f:
                    f.write(svg_blob)
                print(f"[vector-extract] saved svg: {svg_out}")
                return str(svg_out)
    except Exception as e:
        print("vector extraction failed:", e)

    # 2) fallback to raster approach
    png = out_dir / f"{track_key}.png"
    print(f"[raster] rendering PDF page to PNG: {png}")
    png_path = render_pdf_to_png(pdf_path, page_no=page_no, dpi=400, out_png=png)
    print("[raster] preprocessing...")
    bin_img = preprocess_image(png_path)
    print("[raster] skeletonizing...")
    skel = extract_centerline_from_binary(bin_img)
    print("[raster] extracting line strings...")
    lines = get_line_strings_from_skeleton(skel)
    if not lines:
        raise RuntimeError("No skeleton paths found - try higher DPI or different page_no")
    print(f"[raster] got {len(lines)} lines; simplifying to SVG")
    svg_path = simplify_lines_to_svg(lines, svg_out)
    print(f"wrote svg: {svg_path}")
    return svg_path

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Extract centerline SVG from track PDF")
    p.add_argument("pdf", help="PDF path (e.g. data/COTA_Circuit_Map.pdf)")
    p.add_argument("--out", default="public/tracks", help="output folder for SVGs")
    p.add_argument("--track", required=True, help="track key name (e.g. cota, barber)")
    p.add_argument("--page", type=int, default=0, help="pdf page index (0-based)")
    args = p.parse_args()
    svg = process_pdf(args.pdf, args.out, args.track, page_no=args.page)
    print("DONE ->", svg)




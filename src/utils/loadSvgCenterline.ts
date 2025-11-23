// src/utils/loadSvgCenterline.ts

export async function loadSvgPath(svgUrl: string, pathId = "track-path") {
  try {
    const r = await fetch(svgUrl);
    const text = await r.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const path = doc.getElementById(pathId) || doc.querySelector("path");
    if (!path) throw new Error("No path found in SVG");
    const d = path.getAttribute("d");
    // option: extract viewBox if present
    const svgEl = doc.querySelector("svg");
    const viewBox = svgEl ? svgEl.getAttribute("viewBox") : null;
    return { d, viewBox };
  } catch (e) {
    console.error("loadSvgPath error:", e);
    return null;
  }
}




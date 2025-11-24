#!/usr/bin/env bash
set -euo pipefail

mkdir -p public/videos/posters

# Generate thumbnails (1 second into video)
if command -v ffmpeg &> /dev/null; then
  ffmpeg -y -ss 00:00:01 -i "multimodal/1) OVERTAKE — Clean inside pass (Turn 3) — Circuit of the Americas (COTA).mp4" -frames:v 1 -q:v 2 public/videos/posters/overtake-turn3.jpg 2>/dev/null || echo "Warning: Failed to generate thumbnail for overtake-turn3.mp4"
  
  ffmpeg -y -ss 00:00:01 -i "multimodal/2) DEFENSIVE MOVE — Straight-line block vs #23 — Road America.mp4" -frames:v 1 -q:v 2 public/videos/posters/defensive-block-roadamerica.jpg 2>/dev/null || echo "Warning: Failed to generate thumbnail for defensive-block-roadamerica.mp4"
  
  ffmpeg -y -ss 00:00:01 -i "multimodal/3) PERSONAL BEST LAP — Fast Lap Highlight — Sebring.mp4" -frames:v 1 -q:v 2 public/videos/posters/personal-best-sebring.jpg 2>/dev/null || echo "Warning: Failed to generate thumbnail for personal-best-sebring.mp4"
  
  ffmpeg -y -ss 00:00:01 -i "multimodal/4) NEAR MISS — Avoided collision at Turn 5 — Barber.mp4" -frames:v 1 -q:v 2 public/videos/posters/near-miss-barber.jpg 2>/dev/null || echo "Warning: Failed to generate thumbnail for near-miss-barber.mp4"
  
  echo "Posters generated in public/videos/posters/"
else
  echo "ffmpeg not found. Skipping thumbnail generation. Install ffmpeg to generate poster images."
fi


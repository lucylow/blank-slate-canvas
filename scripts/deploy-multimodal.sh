#!/usr/bin/env bash
set -euo pipefail

# Copies multimodal mp4s from project root to public/videos with friendly slugs

mkdir -p public/videos

# Copy and rename files to safe slugs
cp -v "multimodal/1) OVERTAKE — Clean inside pass (Turn 3) — Circuit of the Americas (COTA).mp4" public/videos/overtake-turn3.mp4 || true
cp -v "multimodal/2) DEFENSIVE MOVE — Straight-line block vs #23 — Road America.mp4" public/videos/defensive-block-roadamerica.mp4 || true
cp -v "multimodal/3) PERSONAL BEST LAP — Fast Lap Highlight — Sebring.mp4" public/videos/personal-best-sebring.mp4 || true
cp -v "multimodal/4) NEAR MISS — Avoided collision at Turn 5 — Barber.mp4" public/videos/near-miss-barber.mp4 || true

echo "Copied multimodal files to public/videos/"


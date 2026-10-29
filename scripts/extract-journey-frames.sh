#!/usr/bin/env bash
# Builds the scroll-film frame sequences in public/journey/ from the 4K master.
# The film is drawn to a canvas frame by frame (components/sections/journey-showcase.tsx),
# which scrubs smoothly in every browser, unlike seeking a <video>.
#
#   bash scripts/extract-journey-frames.sh [source.mp4]
#
# 12 fps of the 24 fps master: 240 frames per set. Desktop 1600w, mobile 960w.
set -euo pipefail

SRC="${1:-public/showcase-master-4k.mp4}"
OUT="public/journey"

rm -rf "$OUT/d" "$OUT/m"
mkdir -p "$OUT/d" "$OUT/m"

ffmpeg -v error -i "$SRC" -vf "select='not(mod(n\,2))',scale=1600:-2:flags=lanczos" \
  -fps_mode passthrough -c:v libwebp -quality 72 -compression_level 6 -start_number 0 "$OUT/d/%03d.webp"
ffmpeg -v error -i "$SRC" -vf "select='not(mod(n\,2))',scale=960:-2:flags=lanczos" \
  -fps_mode passthrough -c:v libwebp -quality 66 -compression_level 6 -start_number 0 "$OUT/m/%03d.webp"

echo "desktop: $(ls "$OUT/d" | wc -l) frames, $(du -sh "$OUT/d" | cut -f1)"
echo "mobile:  $(ls "$OUT/m" | wc -l) frames, $(du -sh "$OUT/m" | cut -f1)"

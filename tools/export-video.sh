#!/usr/bin/env bash
# 게임 녹화본(WebM, 1280x720)을 픽셀이 뭉개지지 않게 확대해 MP4로 변환
#  - 2160p: 정수배(×3) nearest neighbor
#  - 1080p: ×3 nearest 후 1/2 area 축소 (1.5배 비정수 확대의 픽셀 들쭉날쭉함 방지)
# usage: tools/export-video.sh captures/road-to-k-master.webm [1080|2160]
set -euo pipefail
IN="$1"
RES="${2:-1080}"
if [ "$RES" = "2160" ]; then
  VF="fps=60,scale=iw*3:ih*3:flags=neighbor,format=yuv420p"
else
  VF="fps=60,scale=iw*3:ih*3:flags=neighbor,scale=iw/2:ih/2:flags=area,format=yuv420p"
fi
OUT="${IN%.*}_${RES}p.mp4"
ffmpeg -y -i "$IN" -vf "$VF" \
  -c:v libx264 -preset slow -crf 14 -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "→ $OUT"

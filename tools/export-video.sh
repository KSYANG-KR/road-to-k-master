#!/usr/bin/env bash
# 게임 녹화본(WebM)을 MP4로 변환
#  - 기본 녹화 해상도는 2560x1440 (ZOOM 4). ?lo 로 녹화했다면 1280x720.
#  - 1080p: area 축소 (픽셀아트·글자 모두 깔끔하게)
#  - 2160p: lanczos 확대
# usage: tools/export-video.sh captures/road-to-k-master.webm [1080|2160]
set -euo pipefail
IN="$1"
RES="${2:-1080}"
if [ "$RES" = "2160" ]; then
  VF="fps=60,scale=3840:2160:flags=lanczos,format=yuv420p"
else
  VF="fps=60,scale=1920:1080:flags=area,format=yuv420p"
fi
OUT="${IN%.*}_${RES}p.mp4"
ffmpeg -y -i "$IN" -vf "$VF" \
  -c:v libx264 -preset slow -crf 14 -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "→ $OUT"

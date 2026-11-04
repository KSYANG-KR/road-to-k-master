"""마젠타 배경의 AI 생성 스프라이트 시트를 개별 픽셀 스프라이트로 잘라 아틀라스(PNG+JSON)로 만든다.

usage: python slice_sprites.py <sheet.png> <out_prefix> <factor> <names comma separated> [rows]
 - factor: 원본 → 게임 픽셀 축소 배율 (예: 7 → 1024px 시트가 146px로)
 - names: 위→아래, 왼→오 순서의 이름. 개수가 맞지 않으면 실패 처리
"""
import sys, json
import numpy as np
import cv2
from PIL import Image


def magenta_mask(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    # 마젠타 및 마젠타가 섞인 가장자리
    return (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90)


def main():
    src, prefix, factor, names = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4].split(',')
    nrows = int(sys.argv[5]) if len(sys.argv) > 5 else None
    im = np.array(Image.open(src).convert('RGB'))
    bg = magenta_mask(im)
    fg = (~bg).astype(np.uint8)
    # 같은 아이콘의 떨어진 조각(김, 반짝이)을 합치기 위해 팽창 후 라벨링
    k = max(3, int(factor * 2.2))
    merged = cv2.dilate(fg, np.ones((k, k), np.uint8))
    n, lab, stats, cent = cv2.connectedComponentsWithStats(merged, 8)
    comps = [(i, stats[i]) for i in range(1, n) if stats[i][cv2.CC_STAT_AREA] > (factor * 6) ** 2]
    # 행 단위 정렬
    comps.sort(key=lambda c: c[1][1] + c[1][3] / 2)
    rows, cur, last = [], [], None
    for c in comps:
        cy = c[1][1] + c[1][3] / 2
        if last is not None and cy - last > im.shape[0] * (0.12 if nrows is None else 0.5 / nrows):
            rows.append(cur); cur = []
        cur.append(c); last = cy
    if cur: rows.append(cur)
    ordered = [c for r in rows for c in sorted(r, key=lambda c: c[1][0])]
    if len(ordered) != len(names):
        print(f'WARN: found {len(ordered)} sprites, expected {len(names)}', [len(r) for r in rows])
    sprites = []
    for (i, st), name in zip(ordered, names):
        x, y, w, h = st[0], st[1], st[2], st[3]
        crop = im[y:y + h, x:x + w]
        mask = (lab[y:y + h, x:x + w] == i) & (fg[y:y + h, x:x + w] > 0)
        rgba = np.dstack([crop, (mask * 255).astype(np.uint8)])
        pil = Image.fromarray(rgba, 'RGBA')
        tw, th = max(1, round(w / factor)), max(1, round(h / factor))
        # 색은 BOX 평균, 알파는 다수결
        col = pil.convert('RGB').resize((tw, th), Image.BOX)
        al = Image.fromarray((mask * 255).astype(np.uint8)).resize((tw, th), Image.BOX)
        al = al.point(lambda v: 255 if v > 110 else 0)
        col = col.quantize(colors=24, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
        out = col.convert('RGBA'); out.putalpha(al)
        sprites.append((name, out))
    # 아틀라스 패킹 (단순 가로줄)
    pad = 1
    maxh = max(s.height for _, s in sprites)
    cols = min(8, len(sprites))
    cw = max(s.width for _, s in sprites) + pad * 2
    ch = maxh + pad * 2
    atlas = Image.new('RGBA', (cw * cols, ch * ((len(sprites) + cols - 1) // cols)), (0, 0, 0, 0))
    frames = {}
    for j, (name, s) in enumerate(sprites):
        ax, ay = (j % cols) * cw + pad, (j // cols) * ch + pad
        atlas.paste(s, (ax, ay))
        frames[name] = {'frame': {'x': ax, 'y': ay, 'w': s.width, 'h': s.height}, 'rotated': False, 'trimmed': False,
                        'spriteSourceSize': {'x': 0, 'y': 0, 'w': s.width, 'h': s.height}, 'sourceSize': {'w': s.width, 'h': s.height}}
    atlas.save(prefix + '.png')
    json.dump({'frames': frames, 'meta': {'image': prefix.split('/')[-1] + '.png', 'size': {'w': atlas.width, 'h': atlas.height}, 'scale': 1}},
              open(prefix + '.json', 'w'), indent=1)
    print('ok', len(sprites), atlas.size)


if __name__ == '__main__':
    main()

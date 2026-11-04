"""AI 생성 이미지를 실제 픽셀 그리드(기본 640x360)로 스냅하고 팔레트를 제한한다.
usage: python pixelsnap.py in.png out.png [W H COLORS]"""
import sys
from PIL import Image, ImageFilter

def snap(src, dst, w=640, h=360, colors=56):
    im = Image.open(src).convert('RGB')
    # 목표 비율로 중앙 크롭
    sw, sh = im.size
    tr = w / h
    if sw / sh > tr:
        nw = int(sh * tr); im = im.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    else:
        nh = int(sw / tr); im = im.crop((0, (sh - nh) // 2, sw, (sh - nh) // 2 + nh))
    # 중간 해상도에서 노이즈 제거 후 BOX 다운샘플
    im = im.filter(ImageFilter.MedianFilter(3))
    im = im.resize((w, h), Image.BOX)
    im = im.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    im.save(dst)

if __name__ == '__main__':
    a = sys.argv
    if len(a) > 3:
        snap(a[1], a[2], int(a[3]), int(a[4]), int(a[5]))
    else:
        snap(a[1], a[2])

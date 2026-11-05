// 그림 속 글자(간판·배너·스크린·스티커)를 픽셀아트로 굽는다.
//  - 폰트 1px = 화면 논리 1px (= 배경 아트 2px) 로 그려 배경 도트와 같은 크기의 픽셀이 된다
//  - 실제 잉크 영역으로 잘라내 원점(0.5, 0.5)이 글자의 정확한 시각 중심이 된다
//  - 그림자·외곽선도 같은 픽셀 격자 위에 찍어 "그려 넣은" 느낌을 낸다
import Phaser from 'phaser';

export type PixFont = 'g14' | 'g11b' | 'g11' | 'g9' | 'g7';
const FONTS: Record<PixFont, [string, number]> = {
  g14: ['Galmuri14', 15], g11b: ['Galmuri11B', 12], g11: ['Galmuri11', 12], g9: ['Galmuri9', 10], g7: ['Galmuri7', 8],
};

export interface PixLine { t: string; font?: PixFont; color?: string; spacing?: number; vertical?: boolean; vgap?: number; bold?: boolean }
export interface PixOpts { gap?: number; shadow?: string; outline?: string; depth?: number; align?: 'center' | 'left' }

export interface Mask { w: number; h: number; m: Uint8Array }

// 한 줄(또는 세로쓰기 한 열)을 0/1 마스크로
export function lineMask(l: PixLine): Mask {
  const [fam, size] = FONTS[l.font ?? 'g11'];
  const sp = l.spacing ?? 0;
  const chars = [...l.t];
  const cv = document.createElement('canvas');
  const g = cv.getContext('2d')!;
  g.font = `${size}px ${fam}`;
  const adv = chars.map((c) => Math.round(g.measureText(c).width));
  let W0: number, H0: number;
  if (l.vertical) { W0 = Math.max(...adv, 1) + 4; H0 = chars.length * (size + (l.vgap ?? 1)) + 4; }
  else { W0 = adv.reduce((a, b) => a + b + sp, 0) + 4; H0 = size + 6; }
  cv.width = W0; cv.height = H0;
  g.font = `${size}px ${fam}`;
  g.textBaseline = 'top';
  g.fillStyle = '#000';
  let x = 2, y = 2;
  chars.forEach((c, i) => {
    if (l.vertical) { g.fillText(c, Math.round((W0 - adv[i]) / 2), y); y += size + (l.vgap ?? 1); }
    else { g.fillText(c, x, 2); x += adv[i] + sp; }
  });
  const d = g.getImageData(0, 0, W0, H0).data;
  // 잉크 영역으로 자르기
  let x0 = W0, y0 = H0, x1 = -1, y1 = -1;
  for (let yy = 0; yy < H0; yy++) for (let xx = 0; xx < W0; xx++) if (d[(yy * W0 + xx) * 4 + 3] >= 128) {
    if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
  }
  if (x1 < 0) return { w: 1, h: 1, m: new Uint8Array(1) };
  const b = l.bold ? 1 : 0;
  const w = x1 - x0 + 1 + b, h = y1 - y0 + 1;
  const m = new Uint8Array(w * h);
  const ink = (xx: number, yy: number) => xx >= 0 && xx <= x1 - x0 && d[((yy + y0) * W0 + xx + x0) * 4 + 3] >= 128;
  // 픽셀 볼드: 오른쪽으로 1px 겹쳐 찍기
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) m[yy * w + xx] = ink(xx, yy) || (b && ink(xx - 1, yy)) ? 1 : 0;
  return { w, h, m };
}

const rgb = (c: string) => { const n = parseInt(c.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

// 여러 줄(서로 다른 폰트·색)을 가운데 맞춰 쌓아 하나의 픽셀 텍스처로
export function pixTexture(scene: Phaser.Scene, lines: PixLine[], o: PixOpts = {}) {
  const key = `pix|${JSON.stringify(lines)}|${o.gap ?? 2}|${o.shadow ?? ''}|${o.outline ?? ''}|${o.align ?? 'center'}`;
  if (scene.textures.exists(key)) return key;
  const masks = lines.map(lineMask);
  const gap = o.gap ?? 2;
  const pad = (o.outline ? 1 : 0) + 1;
  const bw = Math.max(...masks.map((m) => m.w));
  const bh = masks.reduce((a, m) => a + m.h, 0) + gap * (masks.length - 1);
  const W = bw + pad * 2, H = bh + pad * 2 + (o.shadow ? 1 : 0);
  const color = new Int16Array(W * H).fill(-1); // 줄 번호(글자 면)
  let y = pad;
  masks.forEach((mk, li) => {
    const x = o.align === 'left' ? pad : pad + Math.floor((bw - mk.w) / 2);
    for (let yy = 0; yy < mk.h; yy++) for (let xx = 0; xx < mk.w; xx++) if (mk.m[yy * mk.w + xx]) color[(y + yy) * W + x + xx] = li;
    y += mk.h + gap;
  });
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(W, H);
  const put = (i: number, c: number[]) => { img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255; };
  const at = (xx: number, yy: number) => (xx >= 0 && yy >= 0 && xx < W && yy < H ? color[yy * W + xx] : -1);
  const sh = o.shadow ? rgb(o.shadow) : null, ol = o.outline ? rgb(o.outline) : null;
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
    const i = yy * W + xx;
    const li = color[i];
    if (li >= 0) { put(i, rgb(lines[li].color ?? '#ffffff')); continue; }
    if (ol && (at(xx - 1, yy) >= 0 || at(xx + 1, yy) >= 0 || at(xx, yy - 1) >= 0 || at(xx, yy + 1) >= 0)) { put(i, ol); continue; }
    if (sh && (at(xx, yy - 1) >= 0 || (ol && (at(xx - 1, yy - 1) >= 0 || at(xx + 1, yy - 1) >= 0 || at(xx, yy - 2) >= 0)))) put(i, sh);
  }
  g.putImageData(img, 0, 0);
  scene.textures.addCanvas(key, cv);
  return key;
}

// 화면에 붙이기: (x, y) = 글자 잉크의 정확한 중심
export function pixText(scene: Phaser.Scene, x: number, y: number, lines: PixLine[] | string, o: PixOpts & { font?: PixFont; color?: string } = {}) {
  const ls = typeof lines === 'string' ? [{ t: lines, font: o.font, color: o.color }] : lines;
  const im = scene.add.image(Math.round(x), Math.round(y), pixTexture(scene, ls, o));
  // 홀수 크기면 반 픽셀 어긋나지 않게 원점을 정수 픽셀에 맞춤
  im.setOrigin(Math.floor(im.width / 2) / im.width, Math.floor(im.height / 2) / im.height);
  if (o.depth !== undefined) im.setDepth(o.depth);
  return im;
}

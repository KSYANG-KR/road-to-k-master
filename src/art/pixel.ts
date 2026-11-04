// 코드로 픽셀아트를 그리기 위한 최소 페인터.
// 모든 캐릭터·아이콘·이펙트 텍스처는 이 클래스로 만들어 Phaser 텍스처로 등록한다.

export type Color = number; // 0xRRGGBB

export function hex(c: string): Color {
  return parseInt(c.replace('#', ''), 16);
}

export function shade(c: Color, f: number): Color {
  const r = Math.max(0, Math.min(255, Math.round(((c >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((c >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((c & 255) * f)));
  return (r << 16) | (g << 8) | b;
}

export function mix(a: Color, b: Color, t: number): Color {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

export class PixelCanvas {
  readonly data: Uint8ClampedArray;
  // oy: 그리기 좌표계의 y 원점 이동 (머리 위 여유 공간 확보용)
  constructor(readonly w: number, readonly h: number, public oy = 0) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  set(x: number, y: number, c: Color, a = 255) {
    x |= 0; y = (y | 0) + this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = (c >> 16) & 255;
    this.data[i + 1] = (c >> 8) & 255;
    this.data[i + 2] = c & 255;
    this.data[i + 3] = a;
  }

  clear(x: number, y: number) {
    y += this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[(y * this.w + x) * 4 + 3] = 0;
  }

  alpha(x: number, y: number): number {
    y += this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }

  get(x: number, y: number): Color {
    const i = (y * this.w + x + this.oy * this.w) * 4;
    return (this.data[i] << 16) | (this.data[i + 1] << 8) | this.data[i + 2];
  }

  rect(x: number, y: number, w: number, h: number, c: Color) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  // 두 점을 잇는 두께 t의 선 (팔·다리 각도 표현용)
  line(x0: number, y0: number, x1: number, y1: number, c: Color, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n);
      const y = Math.round(y0 + ((y1 - y0) * s) / n);
      this.rect(x - Math.floor((t - 1) / 2), y - Math.floor((t - 1) / 2), t, t, c);
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: Color) {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++)
        if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) this.set(cx + x, cy + y, c);
  }

  // 각 행의 [x0,x1] 구간으로 도형을 채운다
  rows(y0: number, spans: [number, number][], c: Color) {
    spans.forEach(([a, b], j) => {
      for (let x = a; x <= b; x++) this.set(x, y0 + j, c);
    });
  }

  // 이미 칠해진 픽셀에만 색을 덮는다 (무늬·음영용)
  paintIf(x: number, y: number, c: Color) {
    if (this.alpha(x, y) > 0) this.set(x, y, c);
  }

  // 원본 캔버스의 실제 픽셀(원점 이동 무시)을 이 캔버스의 실제 좌표 (dx,dy)에 복사
  blit(src: PixelCanvas, dx: number, dy: number, flipX = false) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const sx = flipX ? src.w - 1 - x : x;
        const si = (y * src.w + sx) * 4;
        if (src.data[si + 3] === 0) continue;
        const tx = dx + x, ty = dy + y;
        if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
        const ti = (ty * this.w + tx) * 4;
        this.data[ti] = src.data[si]; this.data[ti + 1] = src.data[si + 1];
        this.data[ti + 2] = src.data[si + 2]; this.data[ti + 3] = src.data[si + 3];
      }
  }

  // 실루엣 바깥 1px 셀렉티브 아웃라인: 이웃 색을 어둡게 한 색으로 테두리를 그린다
  outline(factor = 0.42, fixed?: Color) {
    const marks: [number, number, Color][] = [];
    for (let y = -this.oy; y < this.h - this.oy; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y) > 0) continue;
        const nb: [number, number][] = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
        for (const [nx, ny] of nb) {
          if (this.alpha(nx, ny) > 0) {
            marks.push([x, y, fixed ?? shade(this.get(nx, ny), factor)]);
            break;
          }
        }
      }
    for (const [x, y, c] of marks) this.set(x, y, c);
  }

  toCanvas(scale = 1): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = this.w * scale;
    cv.height = this.h * scale;
    const ctx = cv.getContext('2d')!;
    const img = new ImageData(new Uint8ClampedArray(this.data), this.w, this.h);
    if (scale === 1) {
      ctx.putImageData(img, 0, 0);
    } else {
      const tmp = document.createElement('canvas');
      tmp.width = this.w; tmp.height = this.h;
      tmp.getContext('2d')!.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, cv.width, cv.height);
    }
    return cv;
  }
}

// Scale2x(EPX): 픽셀아트 윤곽의 계단을 둥글게 다듬으며 2배 확대 (원점 이동도 2배)
export function scale2x(src: PixelCanvas): PixelCanvas {
  const { w, h } = src;
  const out = new PixelCanvas(w * 2, h * 2, src.oy * 2);
  const s32 = new Uint32Array(src.data.buffer.slice(0));
  const o32 = new Uint32Array(out.data.buffer);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : s32[y * w + x]);
  const ow = w * 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
      const i = y * 2 * ow + x * 2;
      o32[i] = C === A && C !== D && A !== B ? A : P;
      o32[i + 1] = A === B && A !== C && B !== D ? B : P;
      o32[i + ow] = D === C && D !== B && C !== A ? C : P;
      o32[i + ow + 1] = B === D && B !== A && D !== C ? D : P;
    }
  return out;
}

// 여러 프레임을 한 장의 캔버스로 합쳐 Phaser 텍스처(이름 있는 프레임)로 등록
export function registerFrames(
  scene: Phaser.Scene,
  key: string,
  frames: { name: string; pc: PixelCanvas }[],
) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const fw = Math.max(...frames.map((f) => f.pc.w));
  const fh = Math.max(...frames.map((f) => f.pc.h));
  const cols = Math.min(frames.length, 16);
  const rows = Math.ceil(frames.length / cols);
  const sheet = new PixelCanvas(cols * fw, rows * fh);
  frames.forEach((f, i) => sheet.blit(f.pc, (i % cols) * fw, Math.floor(i / cols) * fh));
  const tex = scene.textures.addCanvas(key, sheet.toCanvas())!;
  frames.forEach((f, i) => tex.add(f.name, 0, (i % cols) * fw, Math.floor(i / cols) * fh, f.pc.w, f.pc.h));
  return tex;
}

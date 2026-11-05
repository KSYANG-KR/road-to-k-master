// 파라메트릭 HD 픽셀 캐릭터 생성기.
// 96x112 프레임에 신체 부위를 "파트" 단위로 그린 뒤
//  ① 파트별 3톤 음영(빛: 좌상단) ② 파트 경계 컨투어 ③ 앞머리·턱 그림자 ④ 얼굴·소품 데칼 ⑤ 바깥 셀아웃 외곽선
// 순서로 마감한다. 미션에서 옷/헤어를 바꾸면 같은 정의로 시트를 다시 굽는다.
import { PixelCanvas, registerFrames, shade, mix, type Color } from './pixel';

export const FRAME = 96;
export const FRAME_H = 112;
// 텍스처 1px = 화면 논리 0.5px (scale 2로 배치하면 1:1)
export const CHAR_TEX_SCALE = 0.5;
// 스프라이트 원점: 발바닥 (setOrigin(0.5, FOOT_ORIGIN_Y))
export const FOOT_ORIGIN_Y = 110 / 112;
// 서 있는 정면 포즈의 얼굴 중심 (텍스처 좌표) — 초상화 크롭 기준
export const FACE_CX = 48;
export const FACE_CY = 40;

export type Skin = 'fair' | 'light' | 'tan' | 'brown' | 'dark';
export type HairStyle =
  | 'wavy' | 'long' | 'short' | 'messy' | 'bob' | 'ponytail' | 'bun' | 'puff'
  | 'locs' | 'slick' | 'pigtails' | 'buzz' | 'braid' | 'curly' | 'fluffy' | 'twists';
export type TopStyle =
  | 'tee' | 'longsleeve' | 'jacket' | 'suit' | 'uniform' | 'hanbokF' | 'hanbokM' | 'monk'
  | 'jjimjil' | 'crop' | 'dress' | 'sweater' | 'hoodie' | 'runvest' | 'runjacket' | 'apron' | 'cardigan'
  | 'pinafore' | 'blouse';
export type BottomStyle = 'jeans' | 'pants' | 'shorts' | 'skirt' | 'chima' | 'baji' | 'baggy' | 'none';
export type Acc =
  | 'glasses' | 'sunglasses' | 'headphones' | 'cap' | 'crown' | 'towel' | 'headband' | 'beanie' | 'ribbon' | 'gat' | 'flower';

export interface Outfit {
  top: TopStyle;
  topColor: Color;
  topColor2?: Color;
  pattern?: 'plaid' | 'stripe' | 'patch' | 'cross';
  patternColor?: Color;
  bottom: BottomStyle;
  bottomColor: Color;
  bottomColor2?: Color;
  shoes: Color;
  barefoot?: boolean;
  socks?: Color;
  backpack?: Color;
  bag?: Color; // 크로스백
  waistTie?: Color; // 허리에 묶은 니트
  acc?: Acc[];
  accColor?: Color;
}

export interface CharDef {
  id: string;
  name: string;
  skin: Skin;
  hair: HairStyle;
  hairColor: Color;
  outfit: Outfit;
}

type Arm = 'down' | 'up' | 'wave' | 'wave2' | 'out' | 'mouth' | 'hold' | 'fwd' | 'v' | 'hip' | 'swingF' | 'swingB' | 'point' | 'chin' | 'cam';
type Legs = 'stand' | 'walk1' | 'walk2' | 'wide' | 'sit' | 'kneelUp' | 'none';
type Face = 'normal' | 'smile' | 'open' | 'joy' | 'focus' | 'wink' | 'chew' | 'surprise';

interface Pose {
  armL: Arm;
  armR: Arm;
  legs: Legs;
  face: Face;
  dy?: number;
  view?: 'front' | 'back' | 'side' | 'lie';
  run?: number; // side view stride phase 0..3
  kick?: number; // lie pose leg phase
}

// 포즈 테이블 — 장면 스크립트는 이 이름으로 프레임을 고른다
export const POSES: Record<string, Pose> = {
  idle0: { armL: 'down', armR: 'down', legs: 'stand', face: 'smile' },
  idle1: { armL: 'down', armR: 'down', legs: 'stand', face: 'smile', dy: 1 },
  blink: { armL: 'down', armR: 'down', legs: 'stand', face: 'joy' },
  walk0: { armL: 'swingF', armR: 'swingB', legs: 'walk1', face: 'smile' },
  walk1: { armL: 'down', armR: 'down', legs: 'stand', face: 'smile', dy: 1 },
  walk2: { armL: 'swingB', armR: 'swingF', legs: 'walk2', face: 'smile' },
  walk3: { armL: 'down', armR: 'down', legs: 'stand', face: 'smile', dy: 1 },
  cheer0: { armL: 'up', armR: 'up', legs: 'stand', face: 'open' },
  cheer1: { armL: 'up', armR: 'up', legs: 'wide', face: 'joy', dy: 1 },
  wave0: { armL: 'down', armR: 'wave', legs: 'stand', face: 'open' },
  wave1: { armL: 'down', armR: 'wave2', legs: 'stand', face: 'smile' },
  eat0: { armL: 'down', armR: 'mouth', legs: 'stand', face: 'chew' },
  eat1: { armL: 'down', armR: 'hold', legs: 'stand', face: 'joy' },
  hold: { armL: 'hold', armR: 'hold', legs: 'stand', face: 'smile' },
  v0: { armL: 'hip', armR: 'v', legs: 'stand', face: 'wink' },
  v1: { armL: 'v', armR: 'v', legs: 'stand', face: 'open' },
  point: { armL: 'down', armR: 'point', legs: 'stand', face: 'open' },
  surprise: { armL: 'out', armR: 'out', legs: 'stand', face: 'surprise' },
  focus0: { armL: 'fwd', armR: 'fwd', legs: 'stand', face: 'focus' },
  focus1: { armL: 'fwd', armR: 'fwd', legs: 'stand', face: 'focus', dy: 1 },
  chin: { armL: 'chin', armR: 'chin', legs: 'stand', face: 'smile' },
  selfie: { armL: 'v', armR: 'cam', legs: 'stand', face: 'open' },
  sit0: { armL: 'down', armR: 'down', legs: 'sit', face: 'smile' },
  sit1: { armL: 'down', armR: 'down', legs: 'sit', face: 'smile', dy: 1 },
  sitEat0: { armL: 'hold', armR: 'mouth', legs: 'sit', face: 'chew' },
  sitEat1: { armL: 'hold', armR: 'hold', legs: 'sit', face: 'joy' },
  sitCheer: { armL: 'up', armR: 'up', legs: 'sit', face: 'open' },
  dance0: { armL: 'up', armR: 'out', legs: 'wide', face: 'open' },
  dance1: { armL: 'hip', armR: 'point', legs: 'stand', face: 'wink', dy: 1 },
  dance2: { armL: 'out', armR: 'up', legs: 'wide', face: 'joy' },
  dance3: { armL: 'v', armR: 'hip', legs: 'kneelUp', face: 'open' },
  back0: { armL: 'down', armR: 'down', legs: 'stand', face: 'normal', view: 'back' },
  back1: { armL: 'up', armR: 'up', legs: 'stand', face: 'normal', view: 'back' },
  back2: { armL: 'down', armR: 'wave', legs: 'stand', face: 'normal', view: 'back' },
  back3: { armL: 'down', armR: 'wave2', legs: 'stand', face: 'normal', view: 'back', dy: 1 },
  run0: { armL: 'down', armR: 'down', legs: 'none', face: 'smile', view: 'side', run: 0 },
  run1: { armL: 'down', armR: 'down', legs: 'none', face: 'smile', view: 'side', run: 1 },
  run2: { armL: 'down', armR: 'down', legs: 'none', face: 'smile', view: 'side', run: 2 },
  run3: { armL: 'down', armR: 'down', legs: 'none', face: 'smile', view: 'side', run: 3 },
  lie0: { armL: 'down', armR: 'down', legs: 'none', face: 'smile', view: 'lie', kick: 0 },
  lie1: { armL: 'down', armR: 'down', legs: 'none', face: 'joy', view: 'lie', kick: 1 },
  lieEat: { armL: 'down', armR: 'down', legs: 'none', face: 'chew', view: 'lie', kick: 2 },
};

const SKIN: Record<Skin, Color> = {
  fair: 0xffe2cf,
  light: 0xf9d0ae,
  tan: 0xe2a878,
  brown: 0xb0754a,
  dark: 0x82543a,
};
const GIRLS = new Set(['hana', 'amara', 'mei', 'sofia', 'emma', 'server', 'stylist']);
export const isGirl = (id: string) => GIRLS.has(id);
const IRIS: Record<string, Color> = { hana: 0x9a5a34, leo: 0x3f86d8, sofia: 0x3a9aa8, emma: 0x5f9a3e, james: 0x5a70b0, mei: 0x6a4a3a };
const INK = 0x2a1830;
const OUTLINE = 0x1b1828;
const EYE = 0x1b1626;
const MOUTH = 0x8a2a3e;

type P = [number, number];

// ---------------- 파트 버퍼 ----------------
interface PartOpt {
  sr?: number; // 오른쪽 그림자 폭
  sb?: number; // 아래쪽 그림자 폭
  hl?: number; // 왼쪽·위쪽 하이라이트 폭
  contour?: boolean; // 뒤 파트와 닿는 가장자리를 진하게
  cast?: number; // 아래로 드리우는 그림자 길이 (앞머리, 턱)
  flat?: boolean; // 음영 없음
}

class Spr {
  readonly w = FRAME;
  readonly h = FRAME_H;
  col = new Uint32Array(FRAME * FRAME_H);
  id = new Uint16Array(FRAME * FRAME_H);
  opts: PartOpt[] = [{}];
  cur = 0;
  c: Color = 0;

  part(c: Color, o: PartOpt = {}) {
    this.opts.push(o);
    this.cur = this.opts.length - 1;
    this.c = c;
    return this.cur;
  }

  ink(c: Color) { this.c = c; return this; }

  idAt(x: number, y: number) {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.id[y * this.w + x];
  }

  px(x: number, y: number) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    this.col[i] = this.c;
    this.id[i] = this.cur;
  }

  rect(x: number, y: number, w: number, h: number) {
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, clip?: (x: number, y: number) => boolean) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1 && (!clip || clip(x, y))) this.px(x, y);
      }
  }

  // 픽셀 중심(x+.5, y+.5)이 다각형 안이면 칠함
  poly(pts: P[], clip?: (x: number, y: number) => boolean) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++)
        if (inPoly(pts, x + 0.5, y + 0.5) && (!clip || clip(x, y))) this.px(x, y);
  }

  // 두께 2r 캡슐 선
  seg(x0: number, y0: number, x1: number, y1: number, r: number) {
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
    for (let y = Math.floor(Math.min(y0, y1) - r); y <= Math.ceil(Math.max(y0, y1) + r); y++)
      for (let x = Math.floor(Math.min(x0, x1) - r); x <= Math.ceil(Math.max(x0, x1) + r); x++) {
        const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L2));
        const ex = x - (x0 + t * dx), ey = y - (y0 + t * dy);
        if (ex * ex + ey * ey <= r * r) this.px(x, y);
      }
  }

  path(pts: P[], r: number) {
    for (let i = 0; i < pts.length - 1; i++) this.seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], r);
  }

  // 이미 칠해진 픽셀의 색만 바꿈 (only: 특정 파트에만)
  dot(x: number, y: number, c: Color, only?: number | number[]) {
    x = Math.round(x); y = Math.round(y);
    const k = this.idAt(x, y);
    if (!k) return;
    if (only !== undefined && (Array.isArray(only) ? !only.includes(k) : k !== only)) return;
    this.col[y * this.w + x] = c;
  }

  get(x: number, y: number) { return this.col[y * this.w + x]; }
}

function inPoly(pts: P[], x: number, y: number) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

// 색조를 살짝 옮긴 3톤 (그림자는 보랏빛, 하이라이트는 따뜻하게)
function tone(c: Color, k: number): Color {
  if (k > 0) return mix(c, 0xfff3de, 0.18);
  if (k === -1) return mix(shade(c, 0.8), 0x3c2c7a, 0.1);
  return mix(shade(c, 0.6), 0x281a52, 0.2);
}

function lum(c: Color) {
  return (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255;
}

function shadeAll(s: Spr) {
  const out = s.col.slice();
  const { w, h } = s;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x, k = s.id[i];
      if (!k) continue;
      const o = s.opts[k];
      if (o.flat) continue;
      const same = (dx: number, dy: number) => s.idAt(x + dx, y + dy) === k;
      const sr = o.sr ?? 2, sb = o.sb ?? 1, hl = o.hl ?? 1;
      let t = 0;
      for (let d = 1; d <= sr && !t; d++) if (!same(d, 0)) t = -1;
      for (let d = 1; d <= sb && !t; d++) if (!same(0, d)) t = -1;
      for (let d = 1; d <= hl && !t; d++) if (!same(-d, 0) || !same(0, -d)) t = 1;
      if (t) out[i] = tone(s.col[i], t);
    }
  // 앞 파트가 뒤 파트와 맞닿는 가장자리 = 진한 컨투어
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x, k = s.id[i];
      if (!k || s.opts[k].contour === false) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const j = s.idAt(x + dx, y + dy);
        if (j && j < k) { out[i] = tone(s.col[i], -2); break; }
      }
    }
  // 드리운 그림자
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const k = s.id[y * w + x];
      const n = k ? s.opts[k].cast ?? 0 : 0;
      for (let d = 1; d <= n; d++) {
        const j = s.idAt(x, y + d);
        if (!j || j >= k) break;
        const bi = (y + d) * w + x;
        out[bi] = tone(s.col[bi], -1);
      }
    }
  s.col.set(out);
}

// 바깥 1px 셀아웃 외곽선 → PixelCanvas
function toCanvas(s: Spr): PixelCanvas {
  const pc = new PixelCanvas(s.w, s.h);
  const put = (x: number, y: number, c: Color) => {
    const i = (y * s.w + x) * 4;
    pc.data[i] = (c >> 16) & 255; pc.data[i + 1] = (c >> 8) & 255; pc.data[i + 2] = c & 255; pc.data[i + 3] = 255;
  };
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++) {
      const i = y * s.w + x;
      if (s.id[i]) { put(x, y, s.col[i]); continue; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (s.idAt(x + dx, y + dy)) { put(x, y, mix(shade(s.get(x + dx, y + dy), 0.3), OUTLINE, 0.8)); break; }
      }
    }
  return pc;
}

// ---------------- 그리기 컨텍스트 ----------------
interface FaceRec { id: number; cx: number; cy: number; face: Face; side: boolean }
interface Ctx {
  s: Spr;
  d: CharDef;
  o: Outfit;
  acc: Acc[];
  skin: Color;
  hc: Color;
  girl: boolean;
  iris: Color;
  hairIds: number[];
  faces: FaceRec[];
  torsoIds: number[];
}

const HF: PartOpt = { sr: 2, sb: 1, hl: 1, cast: 2 };
const HB: PartOpt = { sr: 3, sb: 2, hl: 0 };
const SKIN_O: PartOpt = { sr: 2, sb: 1, hl: 0 };

// ---------------- 얼굴 ----------------
function headShape(c: Ctx, cx: number, cy: number, side = false) {
  const s = c.s;
  // 귀
  s.part(c.skin, SKIN_O);
  if (side) s.ellipse(cx - 4, cy + 2, 3, 4);
  else { s.ellipse(cx - 16.5, cy + 2, 2.5, 3.5); s.ellipse(cx + 16.5, cy + 2, 2.5, 3.5); }
  const id = s.part(c.skin, { sr: 2, sb: 1, hl: 0, cast: 3 });
  const rx = side ? 15.5 : 16, ry = 15.5;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const dy = (y - cy) / ry;
      // 턱 쪽은 좁혀서 둥근 얼굴
      const taper = dy > 0 ? 1 - 0.2 * dy * dy : 1;
      const dx = (x - cx - (side ? 1 : 0)) / (rx * taper);
      if (dx * dx + dy * dy <= 1) s.px(x, y);
    }
  if (side) { s.px(cx + 16, cy + 3); s.px(cx + 16, cy + 4); }
  // 이마 하이라이트
  return id;
}

function decalFace(c: Ctx, r: FaceRec) {
  const s = c.s;
  const put = (x: number, y: number, col: Color) => s.dot(x, y, col, r.id);
  const { cx, cy, face } = r;
  void INK; void MOUTH;
  const pat = (rows: string[], x0: number, y0: number, col: Color = EYE) =>
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'K') put(x0 + i, y0 + j, col); }));
  const blush = mix(c.skin, 0xff6f8f, 0.42);
  const MO = 0x2a1424, RED = 0xd23e4e, TON = 0xf48a98;
  // 콘티의 활짝 웃는 입: 위는 일자, 아래는 둥근 D 모양 (안쪽 빨강 + 혀)
  const openMouth = (X: number, Y: number, w: number, h: number) => {
    const x0 = X - Math.floor(w / 2);
    for (let j = 0; j < h; j++) {
      const ins = j === h - 1 ? 1 : 0;
      for (let i = ins; i < w - ins; i++) {
        const edge = j === 0 || j === h - 1 || i === ins || i === w - 1 - ins;
        put(x0 + i, Y + j, edge ? MO : j >= h - 2 && i > 1 && i < w - 2 ? TON : RED);
      }
    }
  };
  const EYE_ROWS = (h: number) => Array.from({ length: h }, () => 'KKK');
  const EH = 6;
  if (r.side) {
    const ex = cx + 7, ey = cy - 1;
    if (!c.acc.includes('sunglasses')) {
      if (face === 'joy' || face === 'chew') pat(['.K.', 'K.K'], ex - 1, ey + 2);
      else pat(['KK', 'KK', 'KK', 'KK', 'KK', 'KK'], ex, ey - 1);
    }
    for (let i = 0; i < 3; i++) { put(cx + 8 + i, cy + 6, blush); put(cx + 8 + i, cy + 7, blush); }
    openMouth(cx + 11, cy + 8, 5, 4);
    return;
  }
  const ey = cy - 2;
  if (!c.acc.includes('sunglasses')) {
    for (const [ex, right] of [[cx - 9, false], [cx + 7, true]] as [number, boolean][]) {
      const happy = face === 'joy' || face === 'chew' || (face === 'wink' && right);
      if (happy) pat(['.KKK.', 'K...K'], ex - 1, ey + 2);
      else if (face === 'focus') pat(['KKK', 'KKK'], ex, ey + 3);
      else if (face === 'surprise') pat(EYE_ROWS(EH + 1), ex, ey - 1);
      else pat(EYE_ROWS(EH), ex, ey);
    }
  }
  // 볼터치 (눈 바깥 아래)
  const bw = face === 'chew' ? 5 : 4;
  for (const bx of [cx - 10 - bw, cx + 11]) for (let i = 0; i < bw; i++) { put(bx + i, cy + 5, blush); put(bx + i, cy + 6, blush); }
  void bw;
  // 입
  const X = cx, Y = cy + 6;
  switch (face) {
    case 'open': case 'joy': case 'wink':
      openMouth(X, Y, 9, 5);
      break;
    case 'smile':
      openMouth(X, Y, 7, 4);
      break;
    case 'surprise':
      pat(['.KK.', 'K..K', 'K..K', '.KK.'], X - 2, Y, MO);
      put(X - 1, Y + 1, RED); put(X, Y + 1, RED); put(X - 1, Y + 2, RED); put(X, Y + 2, RED);
      break;
    case 'focus':
      for (let i = -1; i <= 1; i++) put(X + i, Y + 1, MO);
      break;
    case 'chew':
      [[-2, 0], [-1, 1], [0, 0], [1, 1], [2, 0]].forEach(([i, j]) => put(X + i, Y + 1 + j, MO));
      break;
    default:
      [[-2, 0], [-1, 1], [0, 1], [1, 1], [2, 0]].forEach(([i, j]) => put(X + i, Y + j, MO));
  }
}

// ---------------- 헤어 ----------------
function hairHi(hc: Color) {
  return lum(hc) < 0.25 ? mix(hc, 0xbcb4f0, 0.32) : mix(hc, 0xfff6e0, 0.42);
}

function cap(c: Ctx, cx: number, cy: number, r = 19, sideTo = cy - 2, col = c.hc) {
  const s = c.s;
  const id = s.part(col, HF);
  c.hairIds.push(id);
  s.ellipse(cx, cy - 3, r, r + 0.5, (x, y) => y <= cy - 12 || (Math.abs(x - cx) >= 12 && y <= sideTo));
  // 정수리에서 퍼지는 결
  const dk = shade(col, 0.78);
  for (const k of [-11, -5, 4, 10]) for (let t = 0; t < 5; t++) s.dot(cx + k + Math.round((k * t) / 12), cy - 20 + t, dk, id);
  return id;
}

type Bang = 'blunt' | 'swept' | 'spiky' | 'curtain' | 'curly' | 'short';
function bangs(c: Ctx, cx: number, cy: number, kind: Bang) {
  const s = c.s;
  const id = s.part(c.hc, HF);
  c.hairIds.push(id);
  const tri = [0, 1, 2, 3, 2, 1];
  const bottoms: number[] = [];
  for (let x = cx - 14; x <= cx + 14; x++) {
    const u = x - cx, k = u + 14;
    let b: number;
    switch (kind) {
      case 'blunt': b = cy - 4 - (k % 6 === 0 ? 1 : 0); break;
      case 'swept': b = cy - 11 + Math.round(k * 0.36) + tri[k % 6]; break;
      case 'spiky': b = cy - 9 + [0, 2, 4, 2, 0][k % 5]; break;
      case 'curtain': b = cy - 12 + Math.round(Math.abs(u) * 0.55) + tri[k % 6] - 1; break;
      case 'curly': b = cy - 8 + Math.round(2.5 * Math.abs(Math.sin(u * 0.62))); break;
      case 'short': b = cy - 10 + [0, 1, 2, 1][k % 4]; break;
    }
    b = Math.min(b, cy - 4);
    bottoms.push(b);
    for (let y = cy - 16; y <= b; y++) s.px(x, y);
  }
  // 결: 뭉치 사이 진한 선
  const dk = shade(c.hc, 0.74);
  bottoms.forEach((b, i) => {
    if (i % 6 !== 3 || kind === 'curly') return;
    for (let t = 1; t <= 4; t++) s.dot(cx - 14 + i, b - t - 1, dk, id);
  });
  return id;
}

// 얼굴 옆으로 내려오는 머리
function locks(c: Ctx, cx: number, cy: number, len: number, wave = 0, w = 6) {
  const s = c.s;
  const id = s.part(c.hc, HF);
  c.hairIds.push(id);
  for (let y = cy - 8; y <= cy + len; y++) {
    const k = y > cy + len - 5 ? (cy + len - y + 1) / 6 : 1;
    const ww = Math.max(1, Math.round(w * k));
    const off = wave ? Math.round(Math.sin((y - cy) / 3) * wave) : 0;
    s.rect(cx - 19 + off, y, ww, 1);
    s.rect(cx + 19 - ww + 1 - off, y, ww, 1);
  }
  const dk = shade(c.hc, 0.76);
  for (let y = cy - 4; y <= cy + len - 3; y++) { s.dot(cx - 16, y, dk, id); s.dot(cx + 16, y, dk, id); }
  return id;
}

function backMass(c: Ctx, cx: number, cy: number, style: HairStyle) {
  const s = c.s;
  const hc = c.hc;
  const dk = shade(hc, 0.8);
  const part = () => { const id = s.part(hc, HB); c.hairIds.push(id); return id; };
  switch (style) {
    case 'wavy': {
      const id = part();
      for (let y = cy - 10; y <= cy + 38; y++) {
        const t = (y - cy + 10) / 48;
        const wv = Math.round(Math.sin(y / 3.2) * 1.6 * Math.min(1, t * 3));
        const half = 21 + Math.round(Math.min(1, t * 4) * 2) - (y > cy + 33 ? (y - cy - 33) * 2 : 0);
        s.rect(cx - half - wv, y, half * 2 + 1 + wv * 2, 1);
      }
      for (const k of [-17, -10, 10, 17]) for (let y = cy + 6; y < cy + 34; y++) s.dot(cx + k + Math.round(Math.sin(y / 3.2) * 1.5), y, dk, id);
      break;
    }
    case 'long': {
      const id = part();
      for (let y = cy - 10; y <= cy + 40; y++) {
        // 어깨 아래로 살짝 퍼지는 생머리, 끝은 뭉치로
        const flare = y > cy + 14 ? Math.min(3, Math.floor((y - cy - 14) / 6)) : 0;
        const half = 20 + (y > cy - 2 ? 1 : 0) + flare - (y > cy + 37 ? (y - cy - 37) * 2 : 0);
        s.rect(cx - half, y, half * 2 + 1, 1);
      }
      for (const k of [-19, -12, 12, 19]) s.poly([[cx + k - 3, cy + 39], [cx + k, cy + 44], [cx + k + 3, cy + 39]]);
      for (const k of [-16, -9, 9, 16]) for (let y = cy + 4; y < cy + 38; y++) s.dot(cx + k, y, dk, id);
      break;
    }
    case 'bob': {
      part();
      s.ellipse(cx, cy - 2, 21.5, 19, (x, y) => y <= cy + 12);
      s.rect(cx - 21, cy + 4, 43, 9);
      break;
    }
    case 'ponytail': {
      const id = part();
      s.ellipse(cx + 2, cy - 15, 5, 4);
      s.path([[cx + 14, cy - 12], [cx + 22, cy - 2], [cx + 24, cy + 12], [cx + 20, cy + 24]], 5);
      for (let t = 0; t < 30; t++) s.dot(cx + 18 + Math.round(Math.sin(t / 5) * 2), cy - 6 + t, dk, id);
      break;
    }
    case 'pigtails': {
      part();
      s.ellipse(cx - 23, cy + 8, 6, 13);
      s.ellipse(cx + 23, cy + 8, 6, 13);
      break;
    }
    case 'puff': {
      const id = part();
      s.ellipse(cx, cy - 8, 25, 21);
      // 몽글몽글한 외곽
      for (let a = 0; a < 18; a++) {
        const th = (a / 18) * Math.PI * 2;
        s.ellipse(cx + Math.cos(th) * 23, cy - 8 + Math.sin(th) * 19, 4.5, 4.5);
      }
      // 곱슬 질감 점
      for (let y = cy - 28; y < cy + 12; y += 4) for (let x = cx - 24; x < cx + 24; x += 5) s.dot(x + ((y / 4) % 2 ? 2 : 0), y, dk, id);
      break;
    }
    case 'curly': {
      const id = part();
      for (const [dx, dy, r] of [[-18, -6, 8], [18, -6, 8], [-20, 6, 7], [20, 6, 7], [-16, 16, 6], [16, 16, 6], [0, -16, 12], [-10, -16, 9], [10, -16, 9]] as [number, number, number][]) s.ellipse(cx + dx, cy + dy, r, r);
      for (let y = cy - 26; y < cy + 22; y += 4) for (let x = cx - 26; x < cx + 26; x += 5) s.dot(x + ((y / 4) % 2 ? 2 : 0), y, dk, id);
      break;
    }
    case 'locs': {
      const id = part();
      for (let x = cx - 20; x <= cx + 20; x += 4) {
        s.ink(Math.abs(x - cx) % 8 === 0 ? hc : shade(hc, 0.85));
        s.seg(x, cy - 14, x + (x < cx ? -1 : 1), cy + 18 - Math.round(Math.abs(x - cx) * 0.15), 2);
      }
      s.ink(hc);
      void id;
      break;
    }
    case 'bun': {
      const id = part();
      s.ellipse(cx, cy - 23, 8, 7);
      for (let t = -5; t <= 5; t++) s.dot(cx + t, cy - 23 + Math.round(Math.abs(t) * 0.4), dk, id);
      break;
    }
    case 'braid':
      part();
      s.ellipse(cx, cy - 2, 19.5, 18);
      break;
    default:
      break;
  }
}

function hairFrontStyle(c: Ctx, cx: number, cy: number, style: HairStyle) {
  const s = c.s;
  switch (style) {
    case 'wavy': cap(c, cx, cy); bangs(c, cx, cy, 'swept'); locks(c, cx, cy, 14, 1.2); break;
    case 'long': cap(c, cx, cy); bangs(c, cx, cy, 'blunt'); locks(c, cx, cy, 18); break;
    case 'bob': cap(c, cx, cy, 19.5); bangs(c, cx, cy, 'blunt'); locks(c, cx, cy, 10, 0, 7); break;
    case 'ponytail': cap(c, cx, cy); bangs(c, cx, cy, 'swept'); locks(c, cx, cy, 3, 0, 4); break;
    case 'pigtails': cap(c, cx, cy); bangs(c, cx, cy, 'blunt'); locks(c, cx, cy, 3, 0, 4); break;
    case 'bun': cap(c, cx, cy); bangs(c, cx, cy, 'curtain'); locks(c, cx, cy, 5, 0, 4); break;
    case 'braid': {
      cap(c, cx, cy); bangs(c, cx, cy, 'curtain'); locks(c, cx, cy, 4, 0, 4);
      const id = s.part(c.hc, HF); c.hairIds.push(id);
      for (let i = 0; i < 6; i++) s.ellipse(cx + 16 + (i % 2), cy + 8 + i * 5, 4, 3.2);
      for (let i = 0; i < 6; i++) s.dot(cx + 14 + (i % 2), cy + 10 + i * 5, shade(c.hc, 0.7), id);
      s.part(c.o.accColor ?? 0xe0483e, { sr: 1, sb: 0 }); s.ellipse(cx + 17, cy + 38, 3, 2);
      break;
    }
    case 'short': {
      cap(c, cx, cy, 18.5, cy - 3);
      bangs(c, cx, cy, 'short');
      const id = s.part(c.hc, HF); c.hairIds.push(id);
      for (const [x, h] of [[-9, 3], [-3, 4], [3, 4], [9, 3]]) s.poly([[cx + x - 3, cy - 18], [cx + x + 1, cy - 19 - h], [cx + x + 3, cy - 18]]);
      break;
    }
    case 'messy': {
      cap(c, cx, cy, 19.5, cy - 1);
      bangs(c, cx, cy, 'spiky');
      const id = s.part(c.hc, HF); c.hairIds.push(id);
      // 한쪽으로 쓸린 삐침머리
      const tufts: [number, number, number, number, number][] = [[-12, -17, -15, -24, 6], [-4, -20, 1, -28, 7], [6, -19, 13, -25, 6], [16, -12, 23, -15, 4], [-18, -8, -22, -11, 3]];
      for (const [x0, y0, x1, y1, w] of tufts) s.poly([[cx + x0 - w, cy + y0 + 3], [cx + x1, cy + y1], [cx + x0 + w, cy + y0 + 3], [cx + x0, cy + y0 + 1]]);
      break;
    }
    case 'slick': {
      cap(c, cx, cy, 19, cy - 3);
      const id = s.part(c.hc, HF); c.hairIds.push(id);
      // 옆으로 넘긴 앞머리 웨이브
      s.poly([[cx - 16, cy - 10], [cx - 10, cy - 16], [cx + 2, cy - 17], [cx + 12, cy - 14], [cx + 16, cy - 9], [cx + 8, cy - 12], [cx - 4, cy - 12], [cx - 12, cy - 8]]);
      for (let t = 0; t < 7; t++) s.dot(cx - 6 + t, cy - 18 + Math.round(t * 0.3), shade(c.hc, 0.65), c.hairIds);
      break;
    }
    case 'buzz':
      cap(c, cx, cy, 17.5, cy - 6, mix(c.hc, c.skin, 0.25));
      break;
    case 'puff': {
      const id = cap(c, cx, cy, 19, cy - 3);
      bangs(c, cx, cy, 'curly');
      for (let x = cx - 14; x <= cx + 14; x += 3) s.dot(x, cy - 12, shade(c.hc, 0.75), [id, ...c.hairIds]);
      break;
    }
    case 'curly': cap(c, cx, cy, 19.5); bangs(c, cx, cy, 'curly'); locks(c, cx, cy, 8, 1, 6); break;
    case 'fluffy': {
      // 콘티 레오·노아: 귀를 덮는 몽실몽실한 웨이브 단발
      cap(c, cx, cy, 20, cy + 1);
      bangs(c, cx, cy, 'curly');
      fluff(c, cx, cy, 99);
      break;
    }
    case 'twists': {
      // 콘티 코피: 위로 솟고 이마로 내려오는 짧은 트위스트
      cap(c, cx, cy, 19.5, cy - 2);
      const id = s.part(c.hc, HF); c.hairIds.push(id);
      twists(c, cx, cy, false);
      break;
    }
    case 'locs': {
      cap(c, cx, cy, 19, cy - 4);
      bangs(c, cx, cy, 'short');
      const id = s.part(c.hc, HF); c.hairIds.push(id);
      for (const x of [-18, -14, 14, 18]) s.seg(cx + x, cy - 6, cx + x + (x < 0 ? -1 : 1), cy + 14, 1.6);
      s.part(0xd8a040, { sr: 1, sb: 0 }); s.rect(cx - 3, cy - 22, 6, 2);
      break;
    }
  }
}

const FLUFF: [number, number, number][] = [[-18, 2, 3.5], [18, 2, 3.5], [-17, -6, 4.5], [17, -6, 4.5], [-13, -14, 6], [13, -14, 6], [-5, -18, 6], [5, -18, 6], [-9, -10, 4], [1, -11, 4.5], [10, -10, 4]];

// 몽실한 웨이브 머리: 하나의 덩어리 + 뭉치마다 초승달 결 (maxDx: 옆모습에서 얼굴 쪽 뭉치 생략)
function fluff(c: Ctx, cx: number, cy: number, maxDx: number) {
  const s = c.s;
  const id = s.part(c.hc, HF); c.hairIds.push(id);
  const L = FLUFF.filter(([dx]) => dx <= maxDx);
  L.forEach(([dx, dy, r]) => s.ellipse(cx + dx, cy + dy, r, r));
  const dk = shade(c.hc, 0.7);
  L.forEach(([dx, dy, r]) => {
    if (r < 5 || dy > -8) return;
    // 뭉치 아래쪽에 짧은 곡선 결
    const side = dx < 0 ? 1 : -1;
    for (let a = 0; a < 5; a++) {
      const th = Math.PI * (0.35 + a * 0.12);
      s.dot(cx + dx + side * Math.round(Math.cos(th) * (r - 2)), cy + dy + Math.round(Math.sin(th) * (r - 2)), dk, id);
    }
  });
}

function twists(c: Ctx, cx: number, cy: number, back: boolean) {
  const s = c.s;
  const dk = shade(c.hc, 0.55), hi = mix(c.hc, 0xb8b0e8, 0.3);
  for (let x = cx - 18; x <= cx + 18; x += 4) {
    const u = (x - cx) / 18, odd = Math.round((x - cx) / 4) % 2 !== 0;
    const top = cy - 23 + Math.round(u * u * 7) - (odd ? 1 : 0);
    const bot = back ? cy + 4 : Math.abs(u) > 0.75 ? cy + 2 : cy - 6 + (odd ? 1 : 0);
    s.ink(c.hc); s.seg(x, top, x, bot, 1.8);
    // 가닥 사이 홈 + 마디 하이라이트
    if (odd) for (let y = top + 2; y < bot - 1; y++) s.dot(x + 2, y, dk, c.hairIds);
    for (let y = top + 2; y < bot - 1; y += 4) s.dot(x - 1, y, hi, c.hairIds);
  }
}

// 엔젤링 하이라이트 (음영 후 덮음)
function hairShine(c: Ctx, cx: number, cy: number) {
  const s = c.s;
  const hl = hairHi(c.hc), hl2 = mix(c.hc, hl, 0.5);
  for (let x = cx - 13; x <= cx + 13; x++) {
    if ((x - cx + 13) % 6 === 5) continue;
    const t = (x - cx) / 13;
    const y = Math.round(cy - 16 + t * t * 5);
    s.dot(x, y, hl, c.hairIds);
    s.dot(x, y + 1, hl2, c.hairIds);
  }
}

// ---------------- 소품 ----------------
function accHead(c: Ctx, cx: number, cy: number, back: boolean) {
  const s = c.s;
  const col = c.o.accColor ?? 0xe0483e;
  for (const a of c.acc) switch (a) {
    case 'headphones': {
      s.part(0x2f3550, { sr: 1, sb: 1, hl: 1 });
      s.path([[cx - 20, cy], [cx - 18, cy - 12], [cx - 10, cy - 20], [cx, cy - 22], [cx + 10, cy - 20], [cx + 18, cy - 12], [cx + 20, cy]], 1.6);
      s.part(0x2f3550, { sr: 2, sb: 1, hl: 1 });
      s.ellipse(cx - 20, cy + 2, 4, 6.5); s.ellipse(cx + 20, cy + 2, 4, 6.5);
      s.part(0x4fc3ff, { flat: true });
      if (!back) { s.rect(cx - 21, cy + 1, 2, 3); s.rect(cx + 20, cy + 1, 2, 3); }
      break;
    }
    case 'cap': {
      s.part(col, { sr: 3, sb: 1, hl: 1 });
      s.ellipse(cx, cy - 6, 20, 16, (_x, y) => y <= cy - 7);
      if (!back) {
        s.part(shade(col, 0.8), { sr: 2, sb: 1, hl: 0 });
        s.ellipse(cx + 3, cy - 7, 22, 3.5, (_x, y) => y >= cy - 8);
        s.part(0xffffff, { flat: true }); s.rect(cx - 3, cy - 17, 6, 4);
      }
      break;
    }
    case 'beanie': {
      s.part(col, { sr: 3, sb: 1, hl: 1 });
      s.ellipse(cx, cy - 8, 21, 17, (_x, y) => y <= cy - 5);
      s.part(shade(col, 0.82), { sr: 2, sb: 1, hl: 1 });
      s.rect(cx - 21, cy - 10, 43, 5);
      s.part(0xffffff, { sr: 1, sb: 1, hl: 1 }); s.ellipse(cx, cy - 26, 4, 4);
      break;
    }
    case 'crown': {
      s.part(0xffcc33, { sr: 2, sb: 1, hl: 1 });
      s.poly([[cx - 12, cy - 15], [cx - 13, cy - 28], [cx - 6, cy - 21], [cx, cy - 31], [cx + 6, cy - 21], [cx + 13, cy - 28], [cx + 12, cy - 15]]);
      s.part(0xd18a12, { sr: 1, sb: 0, hl: 0 }); s.rect(cx - 12, cy - 17, 24, 2);
      for (const [x, k] of [[-6, 0xe23d5a], [0, 0x3da8e2], [6, 0x3de29a]] as [number, number][]) { s.part(k, { flat: true }); s.rect(cx + x - 1, cy - 21, 3, 3); }
      break;
    }
    case 'towel': {
      const w = 0xfdfaf2;
      s.part(w, { sr: 3, sb: 2, hl: 0 });
      s.ellipse(cx, cy - 8, 21.5, 15, (_x, y) => y <= cy - 4);
      s.part(w, { sr: 2, sb: 2, hl: 1 });
      s.ellipse(cx - 16, cy - 17, 7, 7); s.ellipse(cx + 16, cy - 17, 7, 7);
      for (const dx of [-16, 16]) for (let a = 0; a < 12; a++) {
        const r = 1 + a * 0.4, th = a * 0.9;
        s.dot(cx + dx + Math.round(Math.cos(th) * r), cy - 17 + Math.round(Math.sin(th) * r), 0xd8cfbc);
      }
      for (let x = cx - 20; x <= cx + 20; x++) s.dot(x, cy - 6, 0xe2dccd);
      break;
    }
    case 'headband': {
      s.part(col, { sr: 1, sb: 1, hl: 0 });
      s.path([[cx - 19, cy - 6], [cx - 12, cy - 15], [cx, cy - 18], [cx + 12, cy - 15], [cx + 19, cy - 6]], 1.6);
      break;
    }
    case 'ribbon': {
      s.part(col, { sr: 1, sb: 1, hl: 1 });
      const x = cx + 15, y = cy - 15;
      s.poly([[x, y], [x - 8, y - 5], [x - 8, y + 5]]);
      s.poly([[x, y], [x + 8, y - 5], [x + 8, y + 5]]);
      s.part(shade(col, 0.75), { flat: true }); s.ellipse(x, y, 2, 2);
      break;
    }
    case 'flower': {
      // 콘티 소피아·엠마의 분홍 꽃 핀 (엠마는 똥머리 옆)
      const fx = c.d.hair === 'bun' ? cx + (back ? -7 : 7) : cx + (back ? 15 : -15), fy = c.d.hair === 'bun' ? cy - 20 : cy - 14;
      s.part(0xffd2de, { sr: 1, sb: 1, hl: 0 });
      for (const [dx, dy] of [[0, -2.5], [2.4, -0.8], [1.5, 2], [-1.5, 2], [-2.4, -0.8]]) s.ellipse(fx + dx, fy + dy, 1.7, 1.7);
      s.part(0xf2c040, { flat: true }); s.rect(fx - 0.5, fy - 0.5, 2, 2);
      break;
    }
    case 'gat': {
      s.part(0x1d1b22, { sr: 2, sb: 0, hl: 1 });
      s.rect(cx - 10, cy - 31, 21, 17);
      s.part(0x26232c, { sr: 0, sb: 1, hl: 1 });
      s.ellipse(cx, cy - 14, 31, 4);
      if (!back) { s.part(0xe8d070, { flat: true }); for (let t = 0; t < 12; t += 2) { s.px(cx - 17 + t * 0.2, cy - 10 + t * 2); s.px(cx + 17 - t * 0.2, cy - 10 + t * 2); } }
      break;
    }
    default:
      break;
  }
}

// 얼굴 위 소품 (음영 후)
function accFace(c: Ctx, cx: number, cy: number) {
  const s = c.s;
  const all = (x: number, y: number, col: Color) => s.dot(x, y, col);
  if (c.acc.includes('glasses')) {
    const fr = c.o.accColor ?? 0x2b2b33;
    for (const ex of [cx - 14, cx + 4]) {
      for (let i = 0; i < 10; i++) { all(ex + i, cy - 3, fr); all(ex + i, cy + 5, fr); }
      for (let j = -2; j < 5; j++) { all(ex, cy + j, fr); all(ex + 9, cy + j, fr); }
      all(ex + 2, cy - 1, 0xffffff); all(ex + 3, cy - 1, 0xdfe8ff);
    }
    for (let i = cx - 4; i <= cx + 4; i++) all(i, cy - 1, fr);
  }
  if (c.acc.includes('sunglasses')) {
    for (const ex of [cx - 14, cx + 4]) {
      for (let j = -3; j <= 4; j++) for (let i = 0; i < 10; i++) if (!((j === -3 || j === 4) && (i === 0 || i === 9))) all(ex + i, cy + j, 0x1d1d26);
      all(ex + 2, cy - 1, 0x6c7bd6); all(ex + 3, cy - 2, 0x6c7bd6); all(ex + 2, cy, 0x4a58b0);
    }
    for (let i = cx - 4; i <= cx + 4; i++) all(i, cy - 2, 0x1d1d26);
  }
}

// ---------------- 팔 ----------------
const ARMS: Record<Arm, P[]> = {
  down: [[0, 0], [-3, 10], [-4, 20]],
  up: [[0, 0], [-6, -10], [-9, -22]],
  wave: [[0, 0], [-9, -5], [-11, -17]],
  wave2: [[0, 0], [-11, -3], [-18, -13]],
  out: [[0, 0], [-10, 4], [-20, 2]],
  point: [[0, 0], [-10, -7], [-18, -17]],
  mouth: [[0, 0], [-3, 10], [5, -9]],
  hold: [[0, 0], [-1, 10], [7, 9]],
  fwd: [[0, 0], [-1, 10], [5, 15]],
  v: [[0, 0], [-6, 9], [-4, -12]],
  hip: [[0, 0], [-8, 8], [-2, 15]],
  swingF: [[0, 0], [1, 10], [3, 19]],
  swingB: [[0, 0], [-5, 9], [-8, 18]],
  chin: [[0, 0], [-3, 10], [4, -4]],
  cam: [[0, 0], [-10, -2], [-19, -12]],
};

function sleeveInfo(o: Outfit): { col: Color; len: number; wide: boolean; cuff?: Color } {
  switch (o.top) {
    case 'tee': case 'jjimjil': return { col: o.topColor, len: 8, wide: false };
    case 'runvest': return { col: o.topColor2 ?? 0xffffff, len: 8, wide: false };
    case 'crop': return { col: o.topColor, len: 6, wide: false };
    case 'hanbokF': return { col: o.topColor, len: 99, wide: true, cuff: o.topColor2 };
    case 'hanbokM': case 'monk': return { col: o.topColor, len: 99, wide: true };
    case 'pinafore': return { col: o.topColor2 ?? 0xf3ead6, len: 99, wide: false };
    default: return { col: o.topColor, len: 99, wide: false };
  }
}

function arm(c: Ctx, a: Arm, right: boolean, sx: number, sy: number) {
  const s = c.s;
  const sv = sleeveInfo(c.o);
  const pts: P[] = ARMS[a].map(([x, y]) => [sx + (right ? -x : x), sy + y]);
  // 경로를 1px 간격으로 샘플링
  const samples: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
    for (let k = 0; k < n; k++) samples.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  samples.push(pts[pts.length - 1]);
  const sl = Math.min(sv.len, samples.length - 4);
  const sid = s.part(sv.col, { sr: 2, sb: 1, hl: 1 });
  c.torsoIds.push(sid);
  for (let i = 0; i < sl; i++) {
    const r = sv.wide ? 3.6 + Math.min(1.4, (i / samples.length) * 2) : 3.3;
    s.ellipse(samples[i][0], samples[i][1], r, r);
  }
  if (sv.cuff && sl > 3) { s.part(sv.cuff, { sr: 1, sb: 1, hl: 0 }); for (let i = sl - 3; i < sl; i++) s.ellipse(samples[i][0], samples[i][1], 4.8, 4.8); }
  s.part(c.skin, { sr: 1, sb: 1, hl: 0 });
  for (let i = Math.max(0, sl - 1); i < samples.length; i++) s.ellipse(samples[i][0], samples[i][1], 2.7, 2.7);
  const [hx, hy] = pts[pts.length - 1];
  s.ellipse(hx, hy, 3.4, 3.4);
  if (a === 'v') { s.seg(hx - 1, hy - 2, hx - 2, hy - 8, 1); s.seg(hx + 1, hy - 2, hx + 2, hy - 8, 1); }
  if (a === 'point') { const dx = right ? 1 : -1; s.seg(hx, hy, hx + dx * 4, hy - 4, 1); }
  if (a === 'cam') { s.part(0x2d3047, { sr: 1, sb: 0, hl: 1 }); s.rect(hx - 3, hy - 9, 7, 11); s.part(0x9fd8ff, { flat: true }); s.rect(hx - 2, hy - 8, 5, 7); }
}

// ---------------- 몸통 ----------------
function torsoFront(c: Ctx, ty: number) {
  const s = c.s, o = c.o;
  const T = o.topColor, T2 = o.topColor2 ?? 0xffffff;
  const short = o.top === 'crop' ? 15 : o.top === 'hanbokF' ? 13 : 25;
  if (o.top === 'crop') { s.part(c.skin, SKIN_O); s.rect(38, ty + 13, 21, 13); }
  const id = s.part(T, { sr: 3, sb: 2, hl: 1 });
  c.torsoIds.push(id);
  s.poly([[39, ty], [58, ty], [62, ty + 4], [62, ty + short], [35, ty + short], [35, ty + 4]]);
  const L = (x0: number, y0: number, x1: number, y1: number, col: Color) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) s.dot(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, col, id);
  };
  const neck = () => { s.part(c.skin, SKIN_O); s.ellipse(48, ty, 4.5, 3.5); };
  switch (o.top) {
    case 'tee': case 'longsleeve': case 'jjimjil': neck(); break;
    case 'crop':
      neck();
      s.part(c.skin, SKIN_O); s.px(48, ty + 21);
      break;
    case 'jacket': case 'cardigan': {
      const inner = s.part(T2, { sr: 1, sb: 1, hl: 0 });
      s.poly([[44, ty], [53, ty], [52, ty + 25], [45, ty + 25]]);
      if (o.top === 'cardigan') for (const y of [ty + 8, ty + 14, ty + 20]) { s.part(0xe8d8a0, { flat: true }); s.rect(42, y, 2, 2); }
      void inner;
      neck();
      L(43, ty + 1, 45, ty + 12, shade(T, 0.7)); L(53, ty + 1, 51, ty + 12, shade(T, 0.7));
      break;
    }
    case 'suit': case 'uniform': {
      s.part(0xf6f6f8, { sr: 1, sb: 1, hl: 0 });
      s.poly([[43, ty], [54, ty], [48.5, ty + 12]]);
      const tie = o.accColor ?? (o.top === 'uniform' ? 0x2f5fb3 : 0x3a6fd8);
      s.part(tie, { sr: 1, sb: 0, hl: 1 });
      s.poly([[47, ty + 1], [50, ty + 1], [51, ty + 13], [48.5, ty + 15], [46, ty + 13]]);
      L(42, ty + 1, 47, ty + 14, shade(T, 0.65)); L(55, ty + 1, 50, ty + 14, shade(T, 0.65));
      if (o.top === 'uniform') {
        s.part(0xf2d04a, { flat: true }); s.rect(54, ty + 8, 3, 3);
        // 교복 넥타이 사선 줄무늬
        for (let y = ty + 3; y < ty + 14; y += 3) for (let x = 46; x <= 51; x++) s.dot(x, y + (x - 46 > 2 ? 1 : 0), 0x22305a, [s.cur - 1]);
      }
      s.part(shade(T, 0.85), { flat: true }); s.rect(46, ty + 18, 1, 1); s.rect(46, ty + 22, 1, 1);
      break;
    }
    case 'hanbokF': {
      // 저고리: 흰 동정 + 고름
      for (let k = 0; k < 9; k++) { s.dot(44 + k * 0.8, ty + k, 0xffffff, id); s.dot(45 + k * 0.8, ty + k, 0xffffff, id); }
      neck();
      s.part(T2, { sr: 1, sb: 1, hl: 1 });
      s.ellipse(52, ty + 10, 2.2, 2);
      s.path([[52, ty + 11], [55, ty + 24]], 1.2);
      s.path([[51, ty + 11], [49, ty + 22]], 1.2);
      break;
    }
    case 'hanbokM': {
      neck();
      for (let k = 0; k < 9; k++) s.dot(44 + k * 0.8, ty + k, 0xffffff, id);
      s.part(T2, { sr: 2, sb: 1, hl: 1 });
      s.poly([[37, ty + 4], [43, ty + 2], [44, ty + 25], [37, ty + 25]]);
      s.poly([[53, ty + 2], [60, ty + 4], [60, ty + 25], [53, ty + 25]]);
      s.part(0x7a4fd1, { flat: true }); s.rect(46, ty + 14, 5, 2);
      break;
    }
    case 'monk': {
      neck();
      L(43, ty, 52, ty + 12, shade(T, 0.72)); L(53, ty, 49, ty + 6, shade(T, 0.72));
      s.part(shade(T, 0.78), { sr: 1, sb: 0, hl: 0 }); s.rect(36, ty + 18, 25, 2);
      break;
    }
    case 'dress': neck(); break;
    case 'pinafore': {
      // 크림색 블라우스 위에 검정 멜빵 원피스 (콘티 메이)
      s.part(T2, { sr: 2, sb: 1, hl: 1 });
      s.poly([[40, ty], [57, ty], [61, ty + 4], [61, ty + 9], [36, ty + 9], [36, ty + 4]]);
      s.part(T, { sr: 2, sb: 1, hl: 1 });
      s.poly([[40, ty + 6], [57, ty + 6], [58, ty + 25], [39, ty + 25]]);
      s.rect(41, ty, 3, 7); s.rect(53, ty, 3, 7);
      neck();
      break;
    }
    case 'blouse': {
      // 흰 칼라 블라우스 (콘티 소피아)
      s.part(0xffffff, { sr: 1, sb: 1, hl: 0 });
      s.poly([[42, ty - 1], [48, ty + 3], [44, ty + 5]]); s.poly([[54, ty - 1], [48, ty + 3], [52, ty + 5]]);
      neck();
      break;
    }
    case 'sweater': {
      s.part(0xffffff, { sr: 1, sb: 1, hl: 0 });
      s.poly([[42, ty - 1], [48, ty + 3], [44, ty + 5]]); s.poly([[54, ty - 1], [48, ty + 3], [52, ty + 5]]);
      neck();
      for (let x = 37; x <= 60; x += 2) { s.dot(x, ty + 22, shade(T, 0.78), id); s.dot(x, ty + 23, shade(T, 0.78), id); }
      // 아래로 살짝 보이는 셔츠 밑단
      if (o.topColor2) { s.part(o.topColor2, { sr: 1, sb: 1, hl: 0 }); s.rect(37, ty + 23, 24, 3); }
      break;
    }
    case 'hoodie': {
      s.part(shade(T, 0.85), { sr: 1, sb: 1, hl: 1 });
      s.ellipse(48, ty + 1, 9, 4);
      neck();
      s.part(0xffffff, { flat: true }); s.rect(45, ty + 4, 1, 7); s.rect(51, ty + 4, 1, 7);
      L(41, ty + 15, 55, ty + 15, shade(T, 0.75)); L(41, ty + 15, 41, ty + 22, shade(T, 0.75)); L(55, ty + 15, 55, ty + 22, shade(T, 0.75));
      break;
    }
    case 'runvest': {
      s.part(T2, { sr: 1, sb: 1, hl: 0 });
      s.poly([[43, ty], [54, ty], [54, ty + 25], [43, ty + 25]]);
      neck();
      s.part(0xd9ff5a, { flat: true }); s.rect(37, ty + 12, 6, 2); s.rect(54, ty + 12, 6, 2);
      break;
    }
    case 'runjacket': {
      L(48, ty, 48, ty + 25, shade(T, 0.6));
      s.part(mix(T, 0xffffff, 0.3), { sr: 1, sb: 0, hl: 0 }); s.rect(44, ty - 1, 9, 3);
      s.part(0xd9ff5a, { flat: true }); s.rect(36, ty + 14, 25, 2);
      break;
    }
    case 'apron': {
      neck();
      s.part(T2, { sr: 2, sb: 1, hl: 1 });
      s.poly([[41, ty + 8], [56, ty + 8], [57, ty + 25], [40, ty + 25]]);
      s.path([[42, ty + 8], [45, ty + 1]], 0.8); s.path([[55, ty + 8], [52, ty + 1]], 0.8);
      break;
    }
  }
  if (o.backpack) {
    s.part(shade(o.backpack, 0.82), { sr: 1, sb: 0, hl: 0 });
    s.rect(39, ty + 1, 3, 14); s.rect(55, ty + 1, 3, 14);
  }
  if (o.waistTie) {
    // 허리에 묶은 니트: 띠 + 매듭 + 늘어진 소매
    s.part(o.waistTie, { sr: 2, sb: 1, hl: 1 });
    s.rect(35, ty + 20, 28, 5);
    s.part(o.waistTie, { sr: 1, sb: 1, hl: 1 });
    s.ellipse(48, ty + 25, 3.5, 2.5); s.rect(43, ty + 25, 4, 9); s.rect(50, ty + 25, 4, 9);
  }
  if (o.bag) {
    // 어깨에서 반대쪽 허리로 내려오는 크로스백
    s.part(shade(o.bag, 0.75), { flat: true });
    for (let k = 0; k <= 19; k++) s.rect(41 + Math.round(k * 0.7), ty + 1 + k, 2, 1);
    s.part(o.bag, { sr: 1, sb: 1, hl: 1 }); s.rect(53, ty + 19, 8, 6);
  }
}

function torsoBack(c: Ctx, ty: number) {
  const s = c.s, o = c.o;
  const id = s.part(o.topColor, { sr: 3, sb: 2, hl: 1 });
  c.torsoIds.push(id);
  const short = o.top === 'crop' ? 15 : o.top === 'hanbokF' ? 13 : 25;
  if (o.top === 'crop') { s.part(c.skin, SKIN_O); s.rect(38, ty + 13, 21, 13); s.part(o.topColor, { sr: 3, sb: 2, hl: 1 }); }
  s.poly([[39, ty], [58, ty], [62, ty + 4], [62, ty + short], [35, ty + short], [35, ty + 4]]);
  if (o.top === 'hoodie') { s.part(shade(o.topColor, 0.85), { sr: 2, sb: 1, hl: 1 }); s.ellipse(48, ty + 4, 9, 7); }
  if (o.backpack) {
    const b = o.backpack;
    s.part(b, { sr: 3, sb: 2, hl: 1 });
    s.poly([[39, ty + 2], [58, ty + 2], [59, ty + 22], [38, ty + 22]]);
    s.part(shade(b, 0.85), { sr: 1, sb: 1, hl: 0 });
    s.rect(41, ty + 13, 15, 7);
    s.part(0xf6f6f6, { flat: true }); s.rect(46, ty + 15, 5, 1);
  }
}

// ---------------- 하체 ----------------
function legsFront(c: Ctx, legs: Legs, up: number) {
  const s = c.s, o = c.o;
  const B = o.bottomColor;
  const pantsLeg = ['jeans', 'pants', 'baggy', 'baji'].includes(o.bottom);
  const shoe = o.barefoot ? c.skin : o.shoes;
  if (legs === 'none') return;
  if (legs === 'sit') {
    const y0 = 92;
    s.part(pantsLeg || o.bottom === 'shorts' ? B : c.skin, { sr: 2, sb: 1, hl: 1 });
    s.poly([[34, y0], [62, y0], [70, y0 + 6], [68, y0 + 13], [28, y0 + 13], [26, y0 + 6]]);
    if (o.bottom === 'shorts') { s.part(c.skin, SKIN_O); s.ellipse(32, y0 + 9, 5, 4); s.ellipse(64, y0 + 9, 5, 4); }
    s.part(B, { sr: 1, sb: 0, hl: 0 }); s.rect(47, y0 + 4, 2, 9);
    s.part(shoe, { sr: 1, sb: 1, hl: 1 }); s.ellipse(25, y0 + 10, 5, 3.5); s.ellipse(71, y0 + 10, 5, 3.5);
    if (o.bottom === 'skirt' || o.bottom === 'chima') { s.part(B, { sr: 2, sb: 1, hl: 1 }); s.poly([[36, y0 - 4], [60, y0 - 4], [66, y0 + 6], [30, y0 + 6]]); }
    return;
  }
  let lUp = 0, rUp = 0, lx = 42, rx = 54, spread = 0;
  if (legs === 'walk1') { lUp = 2; lx -= 1; rx += 1; }
  if (legs === 'walk2') { rUp = 2; lx -= 1; rx += 1; }
  if (legs === 'wide') spread = 5;
  if (legs === 'kneelUp') rUp = 7;
  const wide = o.bottom === 'baggy' || o.bottom === 'baji' ? 6.5 : 5.5;
  const leg = (cx: number, upY: number, dir: number) => {
    const off = spread * dir;
    const top = 79, bot = 103 - upY;
    s.part(pantsLeg ? B : c.skin, { sr: 2, sb: 0, hl: 0 });
    c.torsoIds.push(s.cur);
    s.poly([[cx - wide, top], [cx + wide + 1, top], [cx + wide + 1 + off, bot], [cx - wide + off, bot]]);
    if (o.bottom === 'shorts') { s.part(B, { sr: 2, sb: 1, hl: 0 }); s.poly([[cx - 5.5, top], [cx + 6.5, top], [cx + 6.5 + off * 0.4, top + 11], [cx - 5.5 + off * 0.4, top + 11]]); }
    if (o.bottom === 'jeans') { s.dot(cx + off * 0.6, 95 - upY, mix(B, 0xffffff, 0.15)); }
    if (o.bottom === 'baji') { s.part(0xf4f0e8, { flat: true }); s.rect(cx - wide + off, bot - 3, wide * 2 + 1, 2); }
    if (o.socks && !pantsLeg) { s.part(o.socks, { sr: 1, sb: 0, hl: 0 }); s.poly([[cx - wide + off * 0.8, bot - 5], [cx + wide + 1 + off * 0.8, bot - 5], [cx + wide + 1 + off, bot + 1], [cx - wide + off, bot + 1]]); }
    // 신발
    s.part(shoe, { sr: 2, sb: 1, hl: 1 });
    s.ellipse(cx + off + dir * 0.5, bot + 3, 6, 3.6);
    s.rect(cx - 5 + off, bot, 11, 3);
    if (!o.barefoot) {
      s.part(lum(shoe) > 0.8 ? 0xcfd0dc : 0xf2f2f2, { flat: true });
      s.rect(cx - 5 + off, bot + 5, 12, 1);
    }
  };
  leg(lx, lUp, -1);
  leg(rx, rUp, 1);
  // 허리/하의
  switch (o.bottom) {
    case 'jeans': case 'pants': case 'shorts': case 'baggy': case 'baji': {
      s.part(B, { sr: 2, sb: 1, hl: 1 });
      s.rect(36, 77 + Math.min(up, 2), 26, 7);
      if (o.bottom === 'jeans') { s.part(0xd8b04a, { flat: true }); s.px(48, 79 + Math.min(up, 2)); }
      break;
    }
    case 'skirt': {
      const id = s.part(B, { sr: 3, sb: 2, hl: 1 });
      s.poly([[36, 77 + up], [61, 77 + up], [66, 94], [31, 94]]);
      if (o.bottomColor2) for (let y = 77 + up; y < 94; y++) for (let x = 32; x < 66; x++) {
        if ((x - 32) % 5 === 0 || (y - 77) % 5 === 0) s.dot(x, y, (x - 32) % 5 === 0 && (y - 77) % 5 === 0 ? shade(o.bottomColor2, 0.8) : o.bottomColor2, id);
      }
      for (const x of [40, 48, 56]) for (let y = 86; y < 94; y++) s.dot(x + (x - 48) * (y - 86) * 0.05, y, shade(B, 0.82), id);
      break;
    }
  }
}

function chima(c: Ctx, ty: number) {
  const s = c.s, B = c.o.bottomColor;
  const id = s.part(B, { sr: 4, sb: 2, hl: 1 });
  s.poly([[39, ty + 11], [58, ty + 11], [62, ty + 24], [68, 102], [66, 107], [30, 107], [28, 102], [34, ty + 24]]);
  for (const x of [42, 48, 54]) for (let y = ty + 18; y < 106; y++) s.dot(x + (x - 48) * (y - ty) * 0.012, y, shade(B, 0.84), id);
  if (c.o.bottomColor2) { s.part(c.o.bottomColor2, { sr: 2, sb: 0, hl: 0 }); s.rect(29, 101, 39, 3); }
  // 치마 아래 코신
  s.part(c.o.shoes, { sr: 1, sb: 1, hl: 1 }); s.ellipse(41, 107, 5, 2.5); s.ellipse(55, 107, 5, 2.5);
}

// ---------------- 옆모습 달리기 ----------------
function drawSide(c: Ctx, phase: number) {
  const s = c.s, o = c.o;
  const B = o.bottomColor;
  const pantsLeg = ['jeans', 'pants', 'baggy', 'baji'].includes(o.bottom);
  const legs: [P[], P[]][] = [
    [[[50, 82], [57, 92], [62, 101]], [[47, 82], [40, 91], [32, 94]]],
    [[[50, 82], [53, 93], [50, 102]], [[47, 82], [43, 91], [42, 100]]],
    [[[47, 82], [41, 91], [34, 94]], [[50, 82], [56, 92], [60, 101]]],
    [[[47, 82], [44, 92], [43, 101]], [[50, 82], [52, 93], [49, 102]]],
  ];
  const [front, back] = legs[phase];
  const leg = (pts: P[], dark: boolean) => {
    const k = (col: Color) => (dark ? shade(col, 0.82) : col);
    s.part(k(pantsLeg ? B : c.skin), { sr: 1, sb: 1, hl: 1 });
    s.path(pts, 4);
    if (o.bottom === 'shorts') { s.part(k(B), { sr: 1, sb: 1, hl: 1 }); s.path([pts[0], [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]], 4.6); }
    const [fx, fy] = pts[pts.length - 1];
    s.part(k(o.shoes), { sr: 1, sb: 1, hl: 1 });
    s.ellipse(fx + 2, fy + 2, 6, 3.5);
    s.part(0xf2f2f2, { flat: true }); s.rect(fx - 3, fy + 5, 11, 1);
  };
  const armsB: P[][] = [[[49, 63], [56, 71], [62, 66]], [[49, 63], [48, 74], [52, 79]], [[49, 63], [42, 72], [37, 78]], [[49, 63], [48, 74], [52, 79]]];
  const armsF: P[][] = [[[49, 63], [42, 72], [37, 78]], [[49, 63], [50, 74], [55, 78]], [[49, 63], [56, 71], [62, 66]], [[49, 63], [50, 74], [55, 78]]];
  const sv = sleeveInfo(o);
  const armDraw = (pts: P[], dark: boolean) => {
    const k = (col: Color) => (dark ? shade(col, 0.82) : col);
    s.part(k(sv.len > 10 ? sv.col : c.skin), { sr: 1, sb: 1, hl: 1 });
    s.path(pts, 2.8);
    s.part(k(sv.col), { sr: 1, sb: 1, hl: 1 });
    s.path([pts[0], [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.6, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.6]], 3.3);
    s.part(k(c.skin), { sr: 1, sb: 1, hl: 0 });
    const [hx, hy] = pts[pts.length - 1];
    s.ellipse(hx, hy, 3.2, 3.2);
  };
  // 뒷머리 (긴 머리는 뒤로 흩날림)
  const cx = 52, cy = 41;
  const hb = s.part(c.hc, HB); c.hairIds.push(hb);
  if (['wavy', 'long', 'braid'].includes(c.d.hair)) s.poly([[cx - 6, cy - 14], [cx - 20, cy - 4], [cx - 30, cy + 18], [cx - 24, cy + 22], [cx - 12, cy + 12], [cx - 4, cy + 6]]);
  if (c.d.hair === 'ponytail') s.path([[cx - 12, cy - 12], [cx - 24, cy - 4], [cx - 30, cy + 8]], 4);
  if (c.d.hair === 'puff' || c.d.hair === 'curly') s.ellipse(cx - 4, cy - 8, 22, 20);
  if (c.d.hair === 'bun') s.ellipse(cx - 10, cy - 20, 7, 6);
  leg(back, true);
  armDraw(armsB[phase], true);
  // 몸통
  const tid = s.part(o.top === 'runvest' ? o.topColor2 ?? 0xffffff : o.topColor, { sr: 3, sb: 1, hl: 1 });
  c.torsoIds.push(tid);
  s.poly([[43, 58], [55, 58], [58, 81], [43, 81]]);
  if (o.top === 'runvest') { s.part(o.topColor, { sr: 2, sb: 1, hl: 1 }); s.poly([[43, 60], [49, 60], [49, 81], [43, 81]]); s.part(0xd9ff5a, { flat: true }); s.rect(43, 70, 6, 2); }
  if (o.top === 'runjacket') { s.part(0xd9ff5a, { flat: true }); s.rect(43, 72, 15, 2); }
  if (o.backpack) { s.part(o.backpack, { sr: 2, sb: 1, hl: 1 }); s.poly([[36, 60], [44, 60], [44, 78], [36, 78]]); }
  s.part(B, { sr: 2, sb: 1, hl: 1 }); s.rect(43, 78, 16, 6);
  leg(front, false);
  // 머리
  s.part(c.skin, SKIN_O); s.rect(47, 52, 7, 8);
  const fid = headShape(c, cx, cy, true);
  c.faces.push({ id: fid, cx, cy, face: 'smile', side: true });
  // 앞머리/옆머리: 뒤통수 쪽을 덮음
  const id = s.part(c.d.hair === 'buzz' ? mix(c.hc, c.skin, 0.25) : c.hc, HF); c.hairIds.push(id);
  const bald = c.d.hair === 'buzz';
  s.ellipse(cx - 2, cy - 3, 19, 19.5, (x, y) => y <= cy - 11 || (x <= cx - 5 + Math.max(0, cy - 4 - y) * 0.4 && y <= cy + (bald ? -4 : 8)));
  if (!bald) s.poly([[cx + 2, cy - 17], [cx + 16, cy - 11], [cx + 15, cy - 6], [cx + 10, cy - 9], [cx + 6, cy - 6], [cx + 2, cy - 10]]);
  if (c.d.hair === 'messy') { s.poly([[cx - 8, cy - 20], [cx - 2, cy - 28], [cx + 2, cy - 20]]); s.poly([[cx + 2, cy - 20], [cx + 10, cy - 26], [cx + 10, cy - 17]]); }
  if (c.d.hair === 'fluffy') fluff(c, cx - 2, cy, 8);
  if (c.d.hair === 'twists') twists(c, cx - 3, cy, true);
  c.acc.forEach(() => undefined);
  accHead(c, cx - 1, cy, false);
  armDraw(armsF[phase], false);
}

// ---------------- 엎드려 눕기(온돌) ----------------
function drawLie(c: Ctx, kick: number, face: Face) {
  const s = c.s, o = c.o;
  const T = o.topColor, B = o.bottomColor;
  const legC = ['jeans', 'pants', 'baggy', 'baji'].includes(o.bottom) ? B : c.skin;
  const shins: P[][] = [[[80, 98], [86, 82]], [[80, 98], [82, 80]], [[80, 98], [89, 85]]];
  const shins2: P[][] = [[[78, 98], [79, 80]], [[78, 98], [86, 84]], [[78, 98], [82, 81]]];
  const shin = (pts: P[], dark: boolean) => {
    s.part(dark ? shade(legC, 0.82) : legC, { sr: 1, sb: 1, hl: 1 });
    s.path(pts, 3.6);
    const [fx, fy] = pts[1];
    s.part(o.barefoot ? c.skin : dark ? shade(o.shoes, 0.82) : o.shoes, { sr: 1, sb: 1, hl: 1 });
    s.ellipse(fx, fy - 2, 3.6, 5);
  };
  shin(shins2[kick], true);
  s.part(B, { sr: 2, sb: 2, hl: 1 }); s.poly([[62, 88], [80, 90], [84, 101], [62, 102]]);
  shin(shins[kick], false);
  const tid = s.part(T, { sr: 2, sb: 2, hl: 1 }); c.torsoIds.push(tid);
  s.poly([[38, 88], [66, 87], [67, 102], [38, 103]]);
  // 머리 (턱 괴기)
  const cx = 32, cy = 70;
  const hair = c.d.hair === 'wavy' || c.d.hair === 'long' ? 'bob' : c.d.hair;
  backMass(c, cx, cy, hair);
  s.part(c.skin, SKIN_O); s.rect(28, 82, 9, 6);
  const fid = headShape(c, cx, cy);
  c.faces.push({ id: fid, cx, cy, face, side: false });
  hairFrontStyle(c, cx, cy, hair);
  accHead(c, cx, cy, false);
  // 턱 아래로 모은 손
  const sv = sleeveInfo(o);
  s.part(sv.len > 10 ? sv.col : c.skin, { sr: 1, sb: 1, hl: 1 });
  s.path([[18, 101], [24, 92]], 3.4); s.path([[46, 101], [40, 92]], 3.4);
  s.part(c.skin, { sr: 1, sb: 1, hl: 0 });
  s.ellipse(25, 88, 3.6, 3.6); s.ellipse(39, 88, 3.6, 3.6);
}

// ---------------- 메인 렌더 ----------------
export function renderPose(d: CharDef, poseName: string, outfit?: Outfit): PixelCanvas {
  const pose = POSES[poseName];
  const o = outfit ?? d.outfit;
  const s = new Spr();
  const c: Ctx = {
    s, d, o, acc: o.acc ?? [], skin: SKIN[d.skin], hc: d.hairColor, girl: GIRLS.has(d.id),
    iris: IRIS[d.id] ?? 0x5a3a2a, hairIds: [], faces: [], torsoIds: [],
  };
  const pattern = () => {
    if (!o.pattern) return;
    const alt = o.patternColor ?? 0xffffff;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const k = s.idAt(x, y);
      if (!c.torsoIds.includes(k) || s.get(x, y) !== o.topColor) continue;
      if (o.pattern === 'cross') {
        // 니트의 작은 + 무늬 (줄마다 엇갈리게)
        const m6 = (v: number) => ((v % 6) + 6) % 6;
        const row = Math.floor((y - 57) / 6);
        const mx = m6(x - 35 + (row % 2) * 3), my = m6(y - 57);
        if ((mx === 2 && my >= 1 && my <= 3) || (my === 2 && mx >= 1 && mx <= 3)) s.dot(x, y, alt);
        continue;
      }
      if (o.pattern === 'patch') {
        const PAT = [0xd8443a, 0x3a6fd0, 0xf2c94c, 0x3a9a5a];
        const m = (v: number) => ((v % 4) + 4) % 4;
        const cell = PAT[m(Math.floor((x - 36) / 4) + Math.floor((y - 57) / 4) * 3)];
        s.dot(x, y, m(x - 36) === 0 || m(y - 57) === 0 ? shade(cell, 0.72) : cell);
        continue;
      }
      if (o.pattern === 'plaid') {
        const a = (x - 36) % 5 === 0, b = (y - 57) % 5 === 0;
        if (a && b) s.dot(x, y, shade(alt, 0.8)); else if (a || b) s.dot(x, y, mix(o.topColor, alt, 0.7));
      } else if ((y - 57) % 4 === 0) s.dot(x, y, alt);
    }
  };
  const finish = () => {
    shadeAll(s);
    c.faces.forEach((f) => decalFace(c, f));
    void hairShine;
    c.faces.filter((f) => !f.side).forEach((f) => accFace(c, f.cx, f.cy));
    return toCanvas(s);
  };

  if (pose.view === 'lie') { drawLie(c, pose.kick ?? 0, pose.face); pattern(); return finish(); }
  if (pose.view === 'side') { drawSide(c, pose.run ?? 0); pattern(); return finish(); }

  const sit = pose.legs === 'sit';
  const up = (pose.dy ?? 0) * 2 + (sit ? 12 : 0);
  const ty = 57 + up, cx = FACE_CX, cy = FACE_CY + up;
  const back = pose.view === 'back';
  const frontArms: Arm[] = ['mouth', 'hold', 'fwd', 'v', 'chin', 'hip'];
  const shL = 38, shR = 58, shY = ty + 5;

  if (!back) backMass(c, cx, cy, d.hair);
  if (!back && d.hair === 'braid') { /* 앞으로 넘긴 땋은 머리는 hairFront에서 */ }
  legsFront(c, pose.legs, up);
  // 목
  s.part(c.skin, SKIN_O); s.rect(44, cy + 12, 9, ty - cy - 10);
  if (back) {
    torsoBack(c, ty);
    if (o.bottom === 'chima') chima(c, ty);
    arm(c, pose.armL, false, shL, shY);
    arm(c, pose.armR, true, shR, shY);
    headShape(c, cx, cy);
    // 뒤통수 전체를 덮는 머리 + 스타일별 긴 머리
    const id = s.part(d.hair === 'buzz' ? mix(c.hc, c.skin, 0.25) : c.hc, HF); c.hairIds.push(id);
    s.ellipse(cx, cy - 2, 19.5, 18.5);
    if (d.hair === 'fluffy') fluff(c, cx, cy, 99);
    if (d.hair === 'twists') twists(c, cx, cy, true);
    if (!['buzz', 'short', 'slick', 'messy', 'fluffy', 'twists'].includes(d.hair)) {
      const hairBackView: HairStyle = d.hair === 'braid' ? 'braid' : d.hair;
      if (hairBackView === 'braid') { s.part(c.hc, HF); for (let i = 0; i < 7; i++) s.ellipse(cx + (i % 2), cy + 14 + i * 5, 4, 3.2); }
      else backMass(c, cx, cy, hairBackView);
    }
    if (d.hair === 'messy') { s.part(c.hc, HF); for (const x of [-12, -4, 5, 13]) s.poly([[cx + x - 4, cy - 16], [cx + x + 1, cy - 25], [cx + x + 4, cy - 16]]); }
    for (let y = cy - 14; y < cy + 12; y += 1) for (const k of [-8, 0, 8]) s.dot(cx + k + Math.round(Math.sin(y / 4)), y, shade(c.hc, 0.8), c.hairIds);
    accHead(c, cx, cy, true);
    pattern();
    shadeAll(s);
    return toCanvas(s);
  }

  torsoFront(c, ty);
  if (o.bottom === 'chima') chima(c, ty);
  // 옆으로 내린 팔은 몸통 위·머리 아래, 얼굴 앞을 지나는 팔은 맨 위
  if (!frontArms.includes(pose.armL)) arm(c, pose.armL, false, shL, shY);
  if (!frontArms.includes(pose.armR)) arm(c, pose.armR, true, shR, shY);
  const fid = headShape(c, cx, cy);
  c.faces.push({ id: fid, cx, cy, face: pose.face, side: false });
  hairFrontStyle(c, cx, cy, d.hair);
  accHead(c, cx, cy, false);
  if (frontArms.includes(pose.armL)) arm(c, pose.armL, false, shL, shY);
  if (frontArms.includes(pose.armR)) arm(c, pose.armR, true, shR, shY);
  pattern();
  return finish();
}

// 캐릭터 한 명의 포즈 시트를 굽고 애니메이션을 등록 (only: 일부 프레임만)
export function bakeCharacter(scene: Phaser.Scene, d: CharDef, outfit?: Outfit, key?: string, only?: string[]): string {
  const k = key ?? `ch_${d.id}`;
  const names = only ?? Object.keys(POSES);
  const frames = names.map((name) => ({ name, pc: renderPose(d, name, outfit) }));
  registerFrames(scene, k, frames);
  const anim = (name: string, fr: string[], rate: number, repeat = -1) => {
    const ak = `${k}:${name}`;
    if (scene.anims.exists(ak)) scene.anims.remove(ak);
    // 일부 프레임만 구웠다면 프레임이 다 있는 애니메이션만 등록
    if (!fr.every((f) => names.includes(f))) return;
    scene.anims.create({ key: ak, frames: fr.map((f) => ({ key: k, frame: f })), frameRate: rate, repeat });
  };
  anim('idle', ['idle0', 'idle0', 'idle1', 'idle1', 'idle0', 'blink', 'idle0', 'idle1'], 4);
  anim('walk', ['walk0', 'walk1', 'walk2', 'walk3'], 8);
  anim('run', ['run0', 'run1', 'run2', 'run3'], 12);
  anim('cheer', ['cheer0', 'cheer1'], 4);
  anim('wave', ['wave0', 'wave1'], 4);
  anim('eat', ['eat0', 'eat1'], 3);
  anim('sitEat', ['sitEat0', 'sitEat1'], 3);
  anim('sit', ['sit0', 'sit0', 'sit1', 'sit1'], 3);
  anim('focus', ['focus0', 'focus1'], 6);
  anim('dance', ['dance0', 'dance1', 'dance2', 'dance3'], 4);
  anim('lie', ['lie0', 'lie1'], 3);
  anim('backWave', ['back2', 'back3'], 4);
  anim('backCheer', ['back0', 'back1'], 3);
  return k;
}

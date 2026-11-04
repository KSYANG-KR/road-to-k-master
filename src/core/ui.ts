// 픽셀 UI 컴포넌트: 대화창, XP HUD, 아이템 핫바, 태그·버튼, 스테이지 배너, 떠오르는 XP 텍스트
// 디자인 시스템: 반투명 다크 글래스 패널 + 1px 라인, 포인트 컬러는 코랄 한 가지만 절제해서 사용
import Phaser from 'phaser';
import { sfx } from './audio';
import { state, LEVELS, MAX_XP } from './state';
import { director } from './director';

export const W = 640;
export const H = 360;
// 실제 렌더 해상도 = 논리 해상도 × ZOOM (기본 2560x1440 → 화면 크기에 맞춰 부드럽게 축소되어 글자가 선명)
// ?lo 를 붙이면 저사양용 1280x720
export const ZOOM = new URLSearchParams(location.search).has('lo') ? 2 : 4;

export function setupCamera(scene: Phaser.Scene) {
  scene.cameras.main.setZoom(ZOOM).centerOn(W / 2, H / 2);
}

// UI 팔레트
export const PAL = {
  surf: 0x151a33, // 패널 바탕
  surf2: 0x232a4a, // 슬롯·트랙
  line: 0x3c4674, // 1px 라인
  edge: 0x070a1a, // 바깥 테두리
  acc: 0xff6b8a, // 포인트 (코랄)
  accDk: 0xc94466,
  gold: 0xffd166,
  mint: 0x58e0b0,
  sky: 0x6cb8ff,
  // 이전 이름 호환
  ink: 0x161b34,
  pink: 0xff6b8a,
  pinkDk: 0xc94466,
  cream: 0xfff8ec,
  cream2: 0xefe4d0,
  goldDk: 0xb8860c,
  violet: 0x8c7cff,
};
// 다크 패널 위 글자
export const TXT = '#ffffff';
export const SUB = '#aeb6d9';
export const ACC = '#ff8fa6';
export const GOLD = '#ffd166';
// 영어 보조 줄: 한글과 나란히 읽혀야 하므로 충분히 밝게
export const EN = '#d4daf7';
// 밝은 말풍선 위 글자
export const INK = '#1b2140';
export const MUTED = '#6b7394';

export const COL = {
  panel: PAL.surf,
  panelHi: 0xffffff,
  border: PAL.line,
  borderDk: PAL.edge,
  gold: GOLD,
  white: '#ffffff',
  cyan: 0x58e0b0,
  pink: PAL.acc,
  xpGreen: 0x58e0b0,
};

// 타이포그래피: 세계(배경·캐릭터)는 픽셀아트, 글자·UI는 Pretendard 한 가족으로 통일 (한글·영문 같은 설계)
export const FONT = 'Pretendard';
export const FONT_B = 'Pretendard';
export const FONT_S = 'Pretendard';

// 글자 크기 단계 (논리 px). 화면에는 ×ZOOM 해상도로 그린다
export const TYPE = { cap: 7, small: 8, body: 9.5, h3: 11, h2: 13, h1: 16 };

type TxtOpts = Partial<Phaser.Types.GameObjects.Text.TextStyle> & { size?: number; px?: number; bold?: boolean; weight?: number; spacing?: number };

// size 는 예전 픽셀 폰트 기준(10/12/15) → 같은 시각적 무게의 Pretendard 크기로 변환. px 로 직접 지정도 가능
export function txt(scene: Phaser.Scene, x: number, y: number, s: string, opts: TxtOpts = {}) {
  const { size = 12, px, bold = false, weight, spacing, ...rest } = opts;
  const fs = px ?? Math.round(size * 0.8 * 2) / 2;
  const t = scene.add.text(Math.round(x), Math.round(y), s, {
    fontFamily: FONT,
    fontSize: `${fs}px`,
    fontStyle: String(weight ?? (bold ? 700 : 500)),
    color: COL.white,
    ...rest,
  });
  if (spacing) t.setLetterSpacing(spacing);
  // 캔버스 픽셀과 1:1 해상도로 그려 화면 어디서든 선명하게
  t.setResolution(ZOOM);
  return t;
}

// 균형 줄바꿈: 필요한 줄 수는 그대로 두고, 줄 길이가 최대한 고르게 되도록 줄바꿈 폭을 줄인다
// (한 단어만 다음 줄로 떨어지는 '고아 단어'를 없앤다)
export function balance(t: Phaser.GameObjects.Text, s: string, maxW: number) {
  t.setWordWrapWidth(maxW, true);
  const n = t.getWrappedText(s).length;
  if (n > 1) {
    let lo = maxW * 0.35, hi = maxW;
    while (hi - lo > 1) {
      const mid = (lo + hi) / 2;
      t.setWordWrapWidth(mid, true);
      if (t.getWrappedText(s).length > n) lo = mid; else hi = mid;
    }
    t.setWordWrapWidth(Math.ceil(hi) + 1, true);
  }
  t.setText(s);
  return t;
}

// pixelArt 모드는 모든 텍스처를 NEAREST로 거르므로, 글자 텍스처만 부드러운 LINEAR로 바꿔 획이 들쭉날쭉하지 않게 한다
{
  const proto = Phaser.GameObjects.Text.prototype as unknown as { updateText: () => unknown };
  const orig = proto.updateText;
  proto.updateText = function (this: Phaser.GameObjects.Text) {
    const r = orig.call(this);
    if (this.texture && this.canvas?.width) this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return r;
  };
}

const css = (c: string) => parseInt(c.replace('#', ''), 16);
export const mixc = (a: number, b: number, t: number) => Phaser.Display.Color.GetColor(
  Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t),
  Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t),
  Math.round((a & 255) * (1 - t) + (b & 255) * t));
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

// 큰 제목 글자 텍스처: 단색 면 + 얇은 외곽선 + 한 방향 하드 섀도 (과한 그라데이션 없이 깔끔하게)
// F = 텍스처 픽셀 / 화면 논리 px × 글자 배율. Pretendard Black 으로 면 + 얇은 외곽선 + 한 방향 그림자
function bigTexture(scene: Phaser.Scene, s: string, F: number, color: string, stroke: string, shadowCol?: string) {
  const key = `big3|${s}|${F}|${color}|${stroke}|${shadowCol ?? ''}`;
  if (scene.textures.exists(key)) return key;
  const fpx = 13 * F;
  const font = `900 ${fpx}px ${FONT}`;
  const gc = document.createElement('canvas');
  const g0 = gc.getContext('2d')!;
  g0.font = font;
  const track = fpx * 0.02;
  (g0 as unknown as { letterSpacing: string }).letterSpacing = `${track}px`;
  const tw = Math.ceil(g0.measureText(s).width) || 1;
  const O = Math.max(2, Math.round(fpx * 0.075));
  const D = Math.max(2, Math.round(fpx * 0.09));
  const pad = O + 4;
  const w = tw + pad * 2, h = Math.ceil(fpx * 1.18) + pad * 2 + D;
  gc.width = w; gc.height = h;
  const g = gc.getContext('2d')!;
  g.font = font;
  (g as unknown as { letterSpacing: string }).letterSpacing = `${track}px`;
  g.textBaseline = 'alphabetic';
  g.lineJoin = 'round';
  const bx = pad, by = pad + Math.round(fpx * 0.9);
  const base = css(color), st = css(stroke);
  const shadowC = shadowCol ? css(shadowCol) : mixc(st, 0x000000, 0.45);
  // 그림자 (외곽선 두께까지 포함해 아래로)
  g.fillStyle = hex(shadowC); g.strokeStyle = hex(shadowC); g.lineWidth = O * 2;
  g.strokeText(s, bx, by + D); g.fillText(s, bx, by + D);
  // 외곽선
  g.strokeStyle = hex(st); g.lineWidth = O * 2;
  g.strokeText(s, bx, by);
  // 면: 위는 그대로, 아래쪽만 아주 살짝 어둡게
  const grad = g.createLinearGradient(0, by - fpx * 0.75, 0, by);
  grad.addColorStop(0, hex(mixc(base, 0xffffff, 0.12)));
  grad.addColorStop(0.55, hex(base));
  grad.addColorStop(1, hex(mixc(base, 0x000000, 0.1)));
  g.fillStyle = grad;
  g.fillText(s, bx, by);
  const tex = scene.textures.addCanvas(key, gc)!;
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return key;
}

// 큰 픽셀 로고 텍스트 (기존 Text처럼 setText/setColor/setScale을 지원)
export class BigText extends Phaser.GameObjects.Container {
  img: Phaser.GameObjects.Image;
  str: string;
  col: string;
  stroke: string;
  shadowCol?: string;
  F: number;

  constructor(scene: Phaser.Scene, x: number, y: number, s: string, scale: number, color: string, stroke: string, shadowCol?: string) {
    super(scene, Math.round(x), Math.round(y));
    this.F = Math.max(2, Math.round(scale * ZOOM));
    this.str = s; this.col = color; this.stroke = stroke; this.shadowCol = shadowCol;
    this.img = scene.add.image(0, 0, '__WHITE').setScale(1 / this.F);
    this.add(this.img);
    this.setScale(scale);
    this.redraw();
    scene.add.existing(this);
  }

  redraw() {
    if (!this.str) { this.img.setVisible(false); return; }
    this.img.setVisible(true).setTexture(bigTexture(this.scene, this.str, this.F, this.col, this.stroke, this.shadowCol));
  }

  get text() { return this.str; }
  get textWidth() { return this.img.width / this.F; }
  setText(s: string) { this.str = s; this.redraw(); return this; }
  setColor(c: string) { this.col = c; this.redraw(); return this; }
  setStroke(c: string, _t?: number) { this.stroke = c; this.redraw(); return this; }
  setOrigin(_x?: number, _y?: number) { return this; }
}

// 외곽선 색은 항상 어두운 계열로 (밝은 색을 넘기면 진한 남색으로 바꿈)
export function bigText(scene: Phaser.Scene, x: number, y: number, s: string, scale: number, color = '#ffffff', stroke = '#151a33', shadow: boolean | string = true) {
  const st = css(stroke);
  const lum = (((st >> 16) & 255) * 0.3 + ((st >> 8) & 255) * 0.59 + (st & 255) * 0.11) / 255;
  return new BigText(scene, x, y, s, scale, color, lum > 0.45 ? '#151a33' : stroke, typeof shadow === 'string' ? shadow : undefined);
}

export function shade(c: number, amt: number) {
  const col = Phaser.Display.Color.ValueToColor(c);
  return (amt > 0 ? col.lighten(amt) : col.darken(-amt)).color;
}

// 둥근 사각형 (반지름이 크기를 넘지 않게)
export function rrect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rr <= 0) g.fillRect(x, y, w, h); else g.fillRoundedRect(x, y, w, h, rr);
}
function rstroke(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rr <= 0) g.strokeRect(x, y, w, h); else g.strokeRoundedRect(x, y, w, h, rr);
}
const chamfer = (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, c = 3) => rrect(g, x, y, w, h, c + 1);

// 다크 글래스 패널: 부드러운 그림자 + 반투명 면 + 0.5px 헤어라인 + 위쪽 하이라이트
export function panel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number = PAL.surf, border: number = PAL.line, _dark: number = PAL.edge, shadow = true, alpha = 0.9, r = 5) {
  if (shadow) {
    g.fillStyle(0x000000, 0.14); rrect(g, x - 1, y + 1, w + 2, h + 3, r + 1);
    g.fillStyle(0x000000, 0.22); rrect(g, x, y + 1.5, w, h, r);
  }
  g.fillStyle(fill, alpha); rrect(g, x, y, w, h, r);
  g.lineStyle(0.75, border, 1); rstroke(g, x + 0.375, y + 0.375, w - 0.75, h - 0.75, r);
  g.lineStyle(0.5, 0xffffff, 0.1); g.lineBetween(x + r, y + 1.25, x + w - r, y + 1.25);
}

// 밝은 말풍선용 패널
export function lightPanel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r = 5) {
  g.fillStyle(0x000000, 0.2); rrect(g, x, y + 1.5, w, h, r);
  g.fillStyle(0xffffff, 1); rrect(g, x, y, w, h, r);
  g.lineStyle(0.75, 0x1b2140, 0.35); rstroke(g, x + 0.375, y + 0.375, w - 0.75, h - 0.75, r);
}

// 작은 라벨. bg를 주면 단색, 없으면 다크 글래스
export function tag(scene: Phaser.Scene, x: number, y: number, s: string, o: { bg?: number; fg?: string; size?: number; bold?: boolean; ox?: number; oy?: number; depth?: number; pop?: boolean; clamp?: boolean } = {}) {
  const c = scene.add.container(Math.round(x), Math.round(y));
  const t = txt(scene, 0, 0, s, { size: o.size ?? 10, weight: o.bold ? 700 : 600, color: o.fg ?? '#ffffff', align: 'center', lineSpacing: 1 });
  const w = Math.ceil(t.width) + 12, h = Math.ceil(t.height) + 5;
  let left = -Math.round(w * (o.ox ?? 0.5));
  const top = -Math.round(h * (o.oy ?? 0.5));
  // 화면 가장자리를 넘지 않게 안쪽으로 밀어 넣음
  if (o.clamp !== false) {
    if (x + left < 4) left = 4 - Math.round(x);
    if (x + left + w > W - 4) left = W - 4 - w - Math.round(x);
  }
  const g = scene.add.graphics();
  if (o.bg === undefined || o.bg === PAL.ink || o.bg === PAL.surf) panel(g, left, top, w, h, PAL.surf, PAL.line, PAL.edge, true, 0.9, 4);
  else panel(g, left, top, w, h, o.bg, mixc(o.bg, 0xffffff, 0.35), PAL.edge, true, 1, 4);
  t.setPosition(left + 6, top + (h - t.height) / 2);
  c.add([g, t]);
  c.setSize(w, h);
  c.setDepth(o.depth ?? 960);
  c.setData('label', t);
  if (o.pop) {
    c.setScale(0);
    scene.tweens.add({ targets: c, scale: 1, duration: 240, ease: 'Back.Out' });
  }
  return c;
}

// 버튼: 코랄 단색 + 아래쪽 2px 두께, 누르면 한 칸 내려감
export function button(scene: Phaser.Scene, x: number, y: number, label: string, o: { w?: number; h?: number; bg?: number; size?: number; sub?: string } = {}) {
  const w = o.w ?? 96, h = o.h ?? 24, bg = o.bg ?? PAL.acc;
  const c = scene.add.container(Math.round(x), Math.round(y));
  const r = Math.min(6, h / 2);
  const base = scene.add.graphics();
  base.fillStyle(0x000000, 0.25); rrect(base, -w / 2, -h / 2 + 3, w, h, r);
  base.fillStyle(mixc(bg, 0x000000, 0.38)); rrect(base, -w / 2, -h / 2 + 1.5, w, h, r);
  const face = scene.add.graphics();
  face.fillStyle(bg); rrect(face, -w / 2, -h / 2, w, h, r);
  face.lineStyle(0.5, 0xffffff, 0.35); face.lineBetween(-w / 2 + r, -h / 2 + 0.75, w / 2 - r, -h / 2 + 0.75);
  const ly = o.sub ? -Math.round(h * 0.16) : 0, sy = Math.round(h * 0.24);
  const t = txt(scene, 0, ly, label, { weight: 800, size: o.size ?? 12, color: '#ffffff', spacing: 1.5 }).setOrigin(0.5);
  const parts: Phaser.GameObjects.GameObject[] = [base, face, t];
  let st: Phaser.GameObjects.Text | undefined;
  if (o.sub) { st = txt(scene, 0, sy, o.sub, { px: TYPE.small, weight: 600, color: '#ffe9ee' }).setOrigin(0.5); parts.push(st); }
  c.add(parts);
  c.setSize(w, h + 2);
  c.setInteractive({ useHandCursor: true });
  const press = (d: number) => { face.y = d; t.y = ly + d; if (st) st.y = sy + d; };
  c.on('pointerdown', () => press(1));
  c.on('pointerup', () => press(0));
  c.on('pointerout', () => press(0));
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.04, duration: 100 }));
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 100 }));
  c.setData('label', t);
  return c;
}

// 픽셀 별 아이콘
export function starIcon(scene: Phaser.Scene, x: number, y: number, on = true, scale = 1) {
  const g = scene.add.graphics({ x, y });
  const S = ['....#....', '...###...', '#########', '.#######.', '..#####..', '.###.###.', '.##...##.'];
  const fill = on ? PAL.gold : 0x3a4166, hi = on ? 0xfff1c4 : 0x4c5480, edge = on ? 0x5a3a10 : 0x101428;
  // 테두리 → 면 → 하이라이트
  S.forEach((r, j) => [...r].forEach((ch, i) => {
    if (ch !== '#') return;
    g.fillStyle(edge); g.fillRect(i - 5, j - 4, 3, 3);
  }));
  S.forEach((r, j) => [...r].forEach((ch, i) => {
    if (ch !== '#') return;
    g.fillStyle(j < 3 && i < 5 ? hi : fill); g.fillRect(i - 4, j - 3, 1, 1);
  }));
  g.setScale(scale);
  return g;
}

// 줄바꿈된 줄 배열에서 앞에서부터 n글자만 (줄 구조 유지)
function cut(lines: string[], n: number) {
  const out: string[] = [];
  for (const l of lines) {
    if (n <= 0) break;
    out.push(l.slice(0, n));
    n -= l.length;
  }
  return out.join('\n');
}

// 바운스하는 작은 삼각형 (계속/다음 표시)
function caret(scene: Phaser.Scene, x: number, y: number, color: number = PAL.acc) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(color); g.fillTriangle(-4, -2, 4, -2, 0, 2);
  return g;
}

// ---------------- 대화/미션 창 ----------------
export class DialogBox extends Phaser.GameObjects.Container {
  ko: Phaser.GameObjects.Text;
  en: Phaser.GameObjects.Text;
  arrow: Phaser.GameObjects.Graphics;
  bw: number;
  bh: number;
  isMission: boolean;

  g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, mission = false) {
    super(scene, x, y);
    this.bw = w; this.bh = h;
    this.isMission = mission;
    this.g = scene.add.graphics();
    const top = this.top;
    this.ko = txt(scene, 12, top, '', { px: TYPE.body + 0.5, weight: 700, color: TXT, lineSpacing: 1, wordWrap: { width: w - 26, useAdvancedWrap: true } });
    this.en = txt(scene, 12, top, '', { px: TYPE.body - 0.5, weight: 500, color: EN, lineSpacing: 1, wordWrap: { width: w - 26, useAdvancedWrap: true } });
    this.arrow = caret(scene, w - 12, h - 9);
    this.add([this.g, this.ko, this.en, this.arrow]);
    if (mission) {
      const tt = txt(scene, 12, 6, 'MISSION', { px: TYPE.cap, weight: 800, color: ACC, spacing: 1.5 });
      const tt2 = txt(scene, 12 + tt.width + 6, 6, '미션', { px: TYPE.cap, weight: 700, color: SUB });
      this.add([tt, tt2]);
      this.arrow.setVisible(false);
    }
    this.resize(h);
    this.setDepth(900);
    scene.add.existing(this);
  }

  // 글 길이에 맞춰 창 높이를 다시 그림
  resize(h: number) {
    this.bh = h;
    this.g.clear();
    panel(this.g, 0, 0, this.bw, h);
    // 왼쪽 포인트 줄
    this.g.fillStyle(this.isMission ? PAL.acc : PAL.sky, 1); this.g.fillRoundedRect(4, 6, 2, h - 12, 1);
    this.scene.tweens.killTweensOf(this.arrow);
    this.arrow.setPosition(this.bw - 12, h - 9);
    this.scene.tweens.add({ targets: this.arrow, y: h - 7, yoyo: true, repeat: -1, duration: 380, ease: 'Sine.InOut' });
  }

  get top() { return this.isMission ? 18 : 9; }

  // 줄바꿈 결과를 미리 계산해 창 높이를 맞추고, 타자 효과 중에도 줄 위치가 흔들리지 않게 고정
  fit(ko: string, en: string) {
    balance(this.ko, ko || ' ', this.bw - 26);
    balance(this.en, en, this.bw - 26);
    const kh = ko ? this.ko.height : 0;
    this.en.y = this.top + (ko ? kh + 2 : 0);
    const h = this.top + 8 + kh + (en ? this.en.height + (ko ? 2 : 0) : 0);
    this.ko.setText(''); this.en.setText('');
    this.resize(Math.max(h, 28));
  }

  // 한글·영어를 같은 속도 비율로 동시에 타자 출력 (영어가 늦게 나오지 않게)
  async say(ko: string, en = '', speed = 28) {
    this.fit(ko, en);
    const koW = this.ko.getWrappedText(ko), enW = en ? this.en.getWrappedText(en) : [];
    const kn = ko.length, n = Math.max(kn, 1);
    for (let i = 1; i <= n; i++) {
      this.ko.setText(cut(koW, Math.round((i / n) * kn)));
      if (enW.length) this.en.setText(cut(enW, Math.round((i / n) * en.length)));
      if (i % 2 === 0) sfx.typing();
      await director.wait(this.scene, speed);
    }
    this.ko.setText(koW.join('\n'));
    this.en.setText(enW.join('\n'));
  }

  static mission(scene: Phaser.Scene, ko: string, en: string, x = 10, y = 10, _w?: number) {
    ko = ko.replace(/\n/g, ' '); en = en.replace(/\n/g, ' ');
    const m1 = txt(scene, 0, 0, ko, { px: TYPE.body + 0.5, weight: 700 }), m2 = txt(scene, 0, 0, en, { px: TYPE.body - 0.5, weight: 500 });
    const w = Phaser.Math.Clamp(Math.ceil(Math.max(m1.width, m2.width)) + 28, 170, 300);
    m1.destroy(); m2.destroy();
    const d = new DialogBox(scene, x, y, w, 40, true);
    d.fit(ko, en);
    d.ko.setText(ko);
    d.en.setText(en);
    d.setAlpha(0);
    scene.tweens.add({ targets: d, alpha: 1, x: { from: x - 8, to: x }, duration: 260, ease: 'Quad.Out' });
    return d;
  }
}

// ---------------- XP HUD (우측 상단) ----------------
export class XpHud extends Phaser.GameObjects.Container {
  bar: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  title: Phaser.GameObjects.Text;
  lvTag: Phaser.GameObjects.Text;
  lvBg: Phaser.GameObjects.Graphics;
  shown = 0;

  constructor(scene: Phaser.Scene, portraitKey: string) {
    super(scene, W - 214, 6);
    const g = scene.add.graphics();
    panel(g, 20, 4, 188, 34);
    // 바 트랙
    g.fillStyle(PAL.edge, 1); g.fillRect(42, 25, 158, 6);
    g.fillStyle(PAL.surf2, 1); g.fillRect(43, 26, 156, 4);
    // 초상화 링
    g.fillStyle(0x000000, 0.3); g.fillCircle(18, 22, 18);
    g.fillStyle(PAL.edge, 1); g.fillCircle(18, 20, 18);
    g.fillStyle(PAL.acc, 1); g.fillCircle(18, 20, 16);
    g.fillStyle(PAL.surf2, 1); g.fillCircle(18, 20, 14);
    this.bar = scene.add.graphics();
    // 머리 부분만 잘라 초상화로 사용
    const face = scene.add.image(18 - 24, 20 - 19, portraitKey, 'idle0').setOrigin(0).setScale(0.5).setCrop(26, 16, 44, 44);
    this.title = txt(scene, 42, 8, '', { bold: true, color: TXT, spacing: 1 });
    this.lvBg = scene.add.graphics();
    this.lvTag = txt(scene, 18, 40, '', { size: 10, color: '#ffffff' }).setOrigin(0.5, 1);
    this.label = txt(scene, 200, 10, '', { size: 10, color: SUB }).setOrigin(1, 0);
    this.add([g, this.bar, face, this.title, this.label, this.lvBg, this.lvTag]);
    this.setDepth(950);
    scene.add.existing(this);
    this.shown = state.xp;
    this.refresh();
  }

  refresh() {
    const lv = state.maxed ? LEVELS[2] : state.level;
    this.title.setText(state.maxed ? 'K-MASTER' : lv.title);
    if (this.lvTag.text !== `LV.${lv.lv}`) {
      this.lvTag.setText(`LV.${lv.lv}`);
      const w = Math.ceil(this.lvTag.width) + 8;
      this.lvBg.clear();
      panel(this.lvBg, 18 - Math.round(w / 2), 28, w, 13, PAL.acc, mixc(PAL.acc, 0xffffff, 0.3), PAL.edge, false, 1);
    }
    this.label.setText(`${Math.round(this.shown)} / ${MAX_XP} XP`);
    this.bar.clear();
    const fw = Math.round((this.shown / MAX_XP) * 156);
    if (fw > 0) {
      this.bar.fillStyle(lv.color, 1); this.bar.fillRect(43, 26, fw, 4);
      this.bar.fillStyle(0xffffff, 0.45); this.bar.fillRect(43, 26, fw, 1);
    }
  }

  // XP 증가 애니메이션
  animateTo(xp: number, dur = 700) {
    return new Promise<void>((ok) => {
      this.scene.tweens.addCounter({
        from: this.shown, to: xp, duration: dur, ease: 'Quad.Out',
        onUpdate: (tw) => { this.shown = tw.getValue() ?? xp; this.refresh(); },
        onComplete: () => ok(),
      });
    });
  }
}

// ---------------- 아이템 핫바 (하단 중앙) ----------------
export interface ItemRef { id: string; tex: string; frame?: string | number; }

// 고른 칸 위에 보여줄 아이템 이름
export const ITEM_NAMES: Record<string, [string, string]> = {
  sneaker: ['운동화', 'Sneakers'], tshirt: ['티셔츠', 'T-shirt'], backpack: ['가방', 'Backpack'], cap: ['모자', 'Cap'], sunglasses: ['선글라스', 'Sunglasses'],
  water: ['생수', 'Water'], glove: ['장갑', 'Gloves'], headband: ['머리띠', 'Headband'],
  watermelon: ['수박', 'Watermelon'], yakgwa: ['약과', 'Yakgwa'], gimbap: ['김밥', 'Gimbap'], sikhye: ['식혜', 'Sikhye'], apple: ['사과', 'Apple'],
  eggs: ['맥반석 계란', 'Baked eggs'], tteok: ['떡', 'Rice cake'], persimmon: ['곶감', 'Dried persimmon'],
  hoodie: ['후드티', 'Hoodie'], monkrobe: ['승복', 'Monk robe'], hanbok: ['한복', 'Hanbok'], uniform: ['교복', 'School uniform'],
  runvest: ['러닝조끼', 'Running vest'], runjacket: ['바람막이', 'Windbreaker'],
  cupramen: ['컵라면', 'Cup ramyeon'], corndog: ['핫도그', 'Corn dog'], soda: ['콜라', 'Cola'], chicken: ['치킨', 'Fried chicken'],
  bananamilk: ['바나나우유', 'Banana milk'], cupramen2: ['컵라면', 'Cup ramyeon'], cheese: ['치즈', 'Cheese'], samgak: ['삼각김밥', 'Triangle gimbap'],
  icecream: ['아이스크림', 'Ice cream'], sausage: ['소시지', 'Sausage'], cookies: ['쿠키', 'Cookies'], tteokbokki: ['떡볶이', 'Tteokbokki'],
  chips: ['과자', 'Chips'], donut: ['도넛', 'Donut'], icedcoffee: ['아이스커피', 'Iced coffee'], strawmilk: ['딸기우유', 'Strawberry milk'],
  bungeo: ['붕어빵', 'Bungeoppang'], sportsdrink: ['이온음료', 'Sports drink'], oj: ['오렌지주스', 'Orange juice'], popsicle: ['아이스바', 'Ice pop'],
};
export const itemName = (id: string) => { const n = ITEM_NAMES[id]; return n ? `${n[0]} ${n[1]}` : id; };

export class Hotbar extends Phaser.GameObjects.Container {
  slots: Phaser.GameObjects.Image[] = [];
  cursor: Phaser.GameObjects.Graphics;
  nameTag?: Phaser.GameObjects.Container;
  index = 0;
  items: ItemRef[];
  onPick?: (id: string, slot: number) => void;
  enabled = true;
  keyHandler?: (e: KeyboardEvent) => void;
  slotW = 36;
  x0: number;
  trayW: number;
  timerG: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, items: ItemRef[], startIndex = 2) {
    super(scene, 0, H - 46);
    this.items = items;
    const trayW = items.length * this.slotW + 10;
    this.trayW = trayW;
    this.x0 = Math.round((W - trayW) / 2) + 5;
    const g = scene.add.graphics();
    panel(g, this.x0 - 5, 0, trayW, 42);
    items.forEach((_, i) => {
      const x = this.x0 + i * this.slotW;
      g.fillStyle(0x000000, 0.25); rrect(g, x + 2, 5, this.slotW - 4, 30, 4);
      g.fillStyle(PAL.surf2, 1); rrect(g, x + 2.5, 5.5, this.slotW - 5, 29, 3.5);
    });
    this.add(g);
    this.cursor = scene.add.graphics();
    this.timerG = scene.add.graphics();
    this.add([this.cursor, this.timerG]);
    items.forEach((it, i) => {
      const im = scene.add.image(this.slotX(i), 20, it.tex, it.frame).setInteractive({ useHandCursor: true });
      const s = Math.min(24 / im.width, 24 / im.height, 1);
      im.setScale(s >= 1 ? 1 : s);
      im.setData('s', im.scale);
      im.on('pointerdown', () => { if (this.enabled) { this.setIndex(i); this.pick(); } });
      this.slots.push(im);
      this.add(im);
    });
    if (!director.auto) {
      const help = tag(scene, W - 8, 21, '← →  이동  Move\nENTER  선택  Select', { ox: 1, depth: 0, clamp: false, fg: SUB });
      if (this.x0 + items.length * this.slotW + help.width + 14 < W) this.add(help); else help.destroy();
    }
    this.setIndex(Math.min(startIndex, items.length - 1), false);
    this.setDepth(940);
    scene.add.existing(this);
    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.enabled || director.auto) return;
      const n = this.items.length;
      if (e.key === 'ArrowLeft') this.setIndex((this.index - 1 + n) % n);
      if (e.key === 'ArrowRight') this.setIndex((this.index + 1) % n);
      if (e.key === 'Enter' || e.key === ' ') this.pick();
    };
    window.addEventListener('keydown', this.keyHandler);
    this.once('destroy', () => window.removeEventListener('keydown', this.keyHandler!));
    this.y = H + 30;
    scene.tweens.add({ targets: this, y: H - 46, duration: 300, ease: 'Quad.Out' });
  }

  slotX(i: number) {
    return this.x0 + i * this.slotW + this.slotW / 2;
  }

  // 남은 시간 게이지 (트레이 아래쪽)
  setTimer(frac: number | null) {
    const g = this.timerG;
    g.clear();
    if (frac === null) return;
    const x = this.x0, w = this.trayW - 10;
    g.fillStyle(0x000000, 0.35); rrect(g, x + 2, 37, w - 4, 2, 1);
    const col = frac > 0.5 ? PAL.mint : frac > 0.25 ? PAL.gold : PAL.acc;
    g.fillStyle(col); rrect(g, x + 2, 37, Math.max(0, (w - 4) * frac), 2, 1);
  }

  setIndex(i: number, sound = true) {
    this.index = Phaser.Math.Clamp(i, 0, this.items.length - 1);
    const x = this.slotX(this.index);
    const c = this.cursor;
    c.clear();
    c.fillStyle(0x3a2a4e); rrect(c, x - 16, 5, 32, 30, 4);
    c.fillStyle(PAL.acc, 0.2); rrect(c, x - 16, 5, 32, 30, 4);
    c.lineStyle(1.25, PAL.acc, 1); rstroke(c, x - 15.5, 5.5, 31, 29, 4);
    // 선택된 아이템만 살짝 키움
    this.slots.forEach((im, k) => { this.scene.tweens.killTweensOf(im); im.setPosition(this.slotX(k), k === this.index ? 19 : 20).setScale(im.getData('s') * (k === this.index ? 1.1 : 1)); });
    // 이름표
    this.nameTag?.destroy();
    const n = ITEM_NAMES[this.items[this.index].id];
    if (n) {
      this.nameTag = tag(this.scene, x, -10, `${n[0]}  ${n[1]}`, { depth: 0 });
      this.add(this.nameTag);
    }
    if (sound) sfx.move();
  }

  pick() {
    sfx.select();
    const im = this.slots[this.index];
    this.scene.tweens.killTweensOf(im);
    im.setPosition(this.slotX(this.index), 19);
    this.scene.tweens.add({ targets: im, y: 14, yoyo: true, duration: 90 });
    this.onPick?.(this.items[this.index].id, this.index);
  }

  slotWorldPos(id: string) {
    const i = this.items.findIndex((it) => it.id === id);
    return { x: this.slotX(i), y: this.y + 20 };
  }

  // 자동 연출: 커서를 한 칸씩 옮겨 목표 아이템을 고른다
  async autoPick(id: string, stepMs = 220) {
    const target = this.items.findIndex((it) => it.id === id);
    while (this.index !== target) {
      await director.wait(this.scene, stepMs);
      this.setIndex(this.index + Math.sign(target - this.index));
    }
    await director.wait(this.scene, stepMs + 150);
    this.pick();
  }

  hide() {
    this.enabled = false;
    this.scene.tweens.add({ targets: this, y: H + 30, duration: 240, ease: 'Quad.In', onComplete: () => this.destroy() });
  }
}

// ---------------- 떠오르는 XP / 문구 ----------------
export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color = '#ffffff', size = 12) {
  const t = txt(scene, x, y, s, { px: Math.max(9, size * 0.85), weight: 800, color, stroke: '#0b0f24', strokeThickness: 2.5 }).setOrigin(0.5).setDepth(960);
  t.setScale(0.5);
  scene.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: y - 24, duration: 1100, ease: 'Quad.Out' });
  scene.tweens.add({ targets: t, alpha: 0, delay: 800, duration: 400, onComplete: () => t.destroy() });
  return t;
}

export function xpPop(scene: Phaser.Scene, x: number, y: number, n: number) {
  sfx.coin();
  return floatText(scene, x, y, `+${n} XP`, GOLD, 12);
}

// (예전 리본 — 호환용) 단순한 라인 장식으로 대체
export function ribbonShape(g: Phaser.GameObjects.Graphics, w: number, _h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(-w / 2, 18, w / 2 - 20, 2); g.fillRect(20, 18, w / 2 - 20, 2);
  g.fillRect(-4, 16, 8, 6);
}

// 스테이지 타이틀 카드 (중앙)
export function stageBanner(scene: Phaser.Scene, lv: number) {
  const info = LEVELS[lv - 1];
  const c = scene.add.container(W / 2, H / 2).setDepth(970);
  const dim = scene.add.rectangle(0, 0, W * 6, H * 6, 0x070a1a, 0.45);
  const g = scene.add.graphics();
  const w = 300, h = 112;
  panel(g, -w / 2, -h / 2, w, h);
  g.fillStyle(PAL.acc); g.fillRoundedRect(-18, -h / 2 + 0.5, 36, 2, 1);
  const t1 = txt(scene, 0, -h / 2 + 12, `STAGE ${lv}  ·  스테이지 ${lv}`, { px: TYPE.cap + 0.5, weight: 800, color: ACC, spacing: 2 }).setOrigin(0.5, 0);
  const t2 = txt(scene, 0, -24, info.ko, { px: 17, weight: 800, color: TXT }).setOrigin(0.5, 0);
  const t3 = txt(scene, 0, -2, info.en, { px: TYPE.body, weight: 500, color: EN }).setOrigin(0.5, 0);
  g.fillStyle(PAL.line); g.fillRect(-110, 20, 220, 0.75);
  const t4 = txt(scene, 0, 29, `LV.${lv}  ${info.title}`, { px: TYPE.small + 0.5, weight: 800, color: GOLD, spacing: 1.5 }).setOrigin(0.5, 0);
  c.add([dim, g, t1, t2, t3, t4]);
  c.setAlpha(0).setScale(0.9);
  scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 300, ease: 'Quad.Out' });
  return c;
}

// 미션 클리어 (별점 1~3)
export async function missionClear(scene: Phaser.Scene, got = 3) {
  sfx.clear();
  const band = scene.add.graphics({ x: W / 2, y: 128 }).setDepth(979);
  band.fillStyle(0x070a1a, 0.66); band.fillRect(-W, -52, W * 2, 104);
  band.fillStyle(PAL.acc, 1); band.fillRect(-W, -52, W * 2, 0.75); band.fillRect(-W, 51.25, W * 2, 0.75);
  band.setScale(1, 0);
  scene.tweens.add({ targets: band, scaleY: 1, duration: 180, ease: 'Quad.Out' });
  const c = scene.add.container(W / 2, 128).setDepth(980);
  const label = txt(scene, 0, -44, 'MISSION CLEAR  ·  미션 완료', { px: TYPE.cap + 0.5, weight: 800, color: ACC, spacing: 2 }).setOrigin(0.5, 0);
  const stars = [-36, 0, 36].map((dx, i) => {
    const s = starIcon(scene, dx, -12, i < got, 3);
    s.setAlpha(0);
    scene.tweens.add({ targets: s, alpha: 1, y: { from: -22, to: -12 }, delay: 150 + i * 140, duration: 220, ease: 'Back.Out', onStart: () => { if (i < got) sfx.coin(); } });
    return s;
  });
  const grade = got >= 3 ? ['PERFECT', '완벽해요!'] : got === 2 ? ['GREAT', '잘했어요!'] : ['GOOD', '좋아요!'];
  const g1 = txt(scene, 0, 12, grade[0], { px: 20, weight: 900, color: got >= 3 ? GOLD : TXT, spacing: 2 }).setOrigin(0.5, 0);
  const g2 = txt(scene, 0, 36, grade[1], { px: TYPE.body, weight: 600, color: EN }).setOrigin(0.5, 0);
  c.add([label, ...stars, g1, g2]);
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 200 });
  await director.wait(scene, 1600);
  scene.tweens.add({ targets: [c, band], alpha: 0, duration: 300, onComplete: () => { c.destroy(); band.destroy(); } });
}

export { hex };

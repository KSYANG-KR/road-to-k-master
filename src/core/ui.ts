// 픽셀 UI 컴포넌트: 대화창, XP HUD, 아이템 핫바, 태그·버튼, 스테이지 배너, 떠오르는 XP 텍스트
// 공통 스타일: 크림색 카드 + 진한 잉크 외곽선 + 아래쪽 그림자 (밝은 배경에서도 또렷하게)
import Phaser from 'phaser';
import { sfx } from './audio';
import { state, LEVELS, MAX_XP } from './state';
import { director } from './director';

export const W = 640;
export const H = 360;
// 실제 렌더 해상도 = 논리 해상도 × ZOOM (1280x720)
export const ZOOM = 2;

export function setupCamera(scene: Phaser.Scene) {
  scene.cameras.main.setZoom(ZOOM).centerOn(W / 2, H / 2);
}

// UI 팔레트
export const PAL = {
  ink: 0x2a2346,
  cream: 0xfff8ec,
  cream2: 0xefe0c4,
  pink: 0xff6fa5,
  pinkDk: 0xc93a74,
  mint: 0x3fd6bd,
  sky: 0x5aaeff,
  gold: 0xffc94a,
  goldDk: 0xb8780c,
  violet: 0x7d5cff,
};
export const INK = '#2a2346';
export const MUTED = '#7b6d97';

export const COL = {
  panel: PAL.cream,
  panelHi: 0xffffff,
  border: 0xffffff,
  borderDk: PAL.ink,
  gold: '#ffd66b',
  white: '#ffffff',
  cyan: 0x3ef0d8,
  pink: PAL.pink,
  xpGreen: 0x7ce35a,
};

export const FONT = 'Galmuri11';
export const FONT_B = 'Galmuri11B';
export const FONT_S = 'Galmuri9';

export function txt(scene: Phaser.Scene, x: number, y: number, s: string, opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> & { size?: number; bold?: boolean } = {}) {
  const { size = 12, bold = false, ...rest } = opts;
  const t = scene.add.text(Math.round(x), Math.round(y), s, {
    fontFamily: bold ? FONT_B : size <= 10 ? FONT_S : FONT,
    fontSize: `${size}px`,
    color: COL.white,
    ...rest,
  });
  // 4배 해상도로 그린 뒤 알파를 잘라내면(아래 패치) 화면에서 정확히 2px 단위의 또렷한 픽셀 글자가 된다
  t.setResolution(4);
  return t;
}

// 브라우저는 Galmuri 획을 반 픽셀씩 번지게(안티앨리어싱) 그린다.
// 텍스트 캔버스를 그린 직후 알파를 0/255로 잘라 1px 획이 또렷한 진짜 픽셀 글자가 되게 한다.
{
  const proto = Phaser.GameObjects.Text.prototype as unknown as { updateText: () => unknown };
  const orig = proto.updateText;
  proto.updateText = function (this: Phaser.GameObjects.Text) {
    const r = orig.call(this);
    const fam = String(this.style.fontFamily);
    const cv = this.canvas;
    if (!fam.startsWith('Galmuri') || !cv.width || !cv.height) return r;
    const ctx = this.context;
    const img = ctx.getImageData(0, 0, cv.width, cv.height);
    const d = img.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 128 ? 255 : 0;
    ctx.putImageData(img, 0, 0);
    const self = this as unknown as { renderer?: { gl?: unknown; canvasToTexture: (c: HTMLCanvasElement, t: unknown, f: boolean) => unknown }; frame: { source: { glTexture: unknown } } };
    if (self.renderer?.gl) self.frame.source.glTexture = self.renderer.canvasToTexture(cv, self.frame.source.glTexture, true);
    return r;
  };
}

const css = (c: string) => parseInt(c.replace('#', ''), 16);
const mixc = (a: number, b: number, t: number) => Phaser.Display.Color.GetColor(
  Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t),
  Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t),
  Math.round((a & 255) * (1 - t) + (b & 255) * t));

// 큰 제목 글자 텍스처: 픽셀 글자 모양은 굵게 유지하고, 그라데이션·외곽선·입체 그림자는 화면 1px 단위로 섬세하게
function bigTexture(scene: Phaser.Scene, s: string, F: number, color: string, stroke: string) {
  const key = `big|${s}|${F}|${color}|${stroke}`;
  if (scene.textures.exists(key)) return key;
  const font = `${12 * F}px ${FONT_B}`;
  const meas = document.createElement('canvas').getContext('2d')!;
  meas.font = font;
  const tw = Math.ceil(meas.measureText(s).width) || 1;
  const O = Math.min(6, Math.max(2, Math.round(F * 0.7)));
  const D = Math.min(6, Math.max(2, Math.round(F * 0.7)));
  const pad = O + 2;
  const w = tw + pad * 2, h = 13 * F + pad * 2 + D;
  const gc = document.createElement('canvas');
  gc.width = w; gc.height = h;
  const g = gc.getContext('2d')!;
  g.font = font; g.textBaseline = 'alphabetic'; g.fillStyle = '#000';
  g.fillText(s, pad, pad + 11 * F);
  const src = g.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  let top = h, bot = 0;
  for (let i = 0; i < w * h; i++) if (src[i * 4 + 3] >= 120) { mask[i] = 1; const y = (i / w) | 0; top = Math.min(top, y); bot = Math.max(bot, y); }
  const at = (m: Uint8Array, x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? m[y * w + x] : 0);
  // 둥근 외곽선 = 마스크 팽창
  const outl = new Uint8Array(w * h);
  const offs: [number, number][] = [];
  for (let dy = -O; dy <= O; dy++) for (let dx = -O; dx <= O; dx++) if (dx * dx + dy * dy <= O * O + O * 0.5) offs.push([dx, dy]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) for (const [dx, dy] of offs) {
    const X = x + dx, Y = y + dy;
    if (X >= 0 && Y >= 0 && X < w && Y < h) outl[Y * w + X] = 1;
  }
  const base = css(color), st = css(stroke);
  const light = mixc(base, 0xffffff, 0.55), dark = mixc(base, 0x000000, 0.18);
  const ext = mixc(st, 0x000000, 0.35);
  const out = g.createImageData(w, h);
  const put = (i: number, c: number) => { out.data[i * 4] = (c >> 16) & 255; out.data[i * 4 + 1] = (c >> 8) & 255; out.data[i * 4 + 2] = c & 255; out.data[i * 4 + 3] = 255; };
  const hi = Math.max(1, Math.round(F / 3));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (mask[i]) {
      const t = (y - top) / Math.max(1, bot - top);
      let c = t < 0.42 ? light : t < 0.78 ? base : dark;
      if (!at(mask, x, y - hi)) c = mixc(base, 0xffffff, 0.85);
      put(i, c);
    } else if (outl[i]) put(i, st);
    else if (at(outl, x, y - D)) put(i, ext);
  }
  // 외곽선 위쪽에 아주 얇은 밝은 테
  const tex = scene.textures.createCanvas(key, w, h)!;
  tex.getContext().putImageData(out, 0, 0);
  tex.refresh();
  return key;
}

// 큰 픽셀 로고 텍스트 (기존 Text처럼 setText/setColor/setScale을 지원)
export class BigText extends Phaser.GameObjects.Container {
  img: Phaser.GameObjects.Image;
  str: string;
  col: string;
  stroke: string;
  F: number;

  constructor(scene: Phaser.Scene, x: number, y: number, s: string, scale: number, color: string, stroke: string) {
    super(scene, Math.round(x), Math.round(y));
    this.F = Math.max(2, Math.round(scale * 2));
    this.str = s; this.col = color; this.stroke = stroke;
    this.img = scene.add.image(0, 0, '__WHITE').setScale(1 / this.F);
    this.add(this.img);
    this.setScale(scale);
    this.redraw();
    scene.add.existing(this);
  }

  redraw() {
    if (!this.str) { this.img.setVisible(false); return; }
    this.img.setVisible(true).setTexture(bigTexture(this.scene, this.str, this.F, this.col, this.stroke));
  }

  get text() { return this.str; }
  setText(s: string) { this.str = s; this.redraw(); return this; }
  setColor(c: string) { this.col = c; this.redraw(); return this; }
  setStroke(c: string, _t?: number) { this.stroke = c; this.redraw(); return this; }
  setOrigin(_x?: number, _y?: number) { return this; }
}

export function bigText(scene: Phaser.Scene, x: number, y: number, s: string, scale: number, color = '#ffffff', stroke = '#1d1440', _shadow = true) {
  return new BigText(scene, x, y, s, scale, color, stroke);
}

export function shade(c: number, amt: number) {
  const col = Phaser.Display.Color.ValueToColor(c);
  return (amt > 0 ? col.lighten(amt) : col.darken(-amt)).color;
}

// 모서리를 c픽셀 깎은 사각형
function chamfer(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, c = 2) {
  if (c <= 0) { g.fillRect(x, y, w, h); return; }
  g.fillRect(x + c, y, w - c * 2, h);
  g.fillRect(x, y + c, w, h - c * 2);
  if (c >= 2) g.fillRect(x + 1, y + 1, w - 2, h - 2);
}

// 모서리를 깎은 픽셀 패널 (그림자 + 잉크 외곽선 + 밝은 테두리 + 하단 음영)
export function panel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill = PAL.cream, border = 0xffffff, dark = PAL.ink, shadow = true) {
  if (shadow) { g.fillStyle(0x000000, 0.28); chamfer(g, x + 1, y + 3, w, h); }
  g.fillStyle(dark, 1); chamfer(g, x, y, w, h);
  g.fillStyle(border, 1); chamfer(g, x + 1, y + 1, w - 2, h - 2, 1);
  g.fillStyle(fill, 1); g.fillRect(x + 2, y + 2, w - 4, h - 4);
  if (h > 16) { g.fillStyle(0x000000, 0.07); g.fillRect(x + 2, y + h - 5, w - 4, 3); }
  g.fillStyle(0xffffff, 0.4); g.fillRect(x + 2, y + 2, w - 4, 1);
}

// 작은 알약 모양 라벨 (장소 이름, 알림 등)
export function tag(scene: Phaser.Scene, x: number, y: number, s: string, o: { bg?: number; fg?: string; size?: number; bold?: boolean; ox?: number; oy?: number; depth?: number; pop?: boolean } = {}) {
  const c = scene.add.container(Math.round(x), Math.round(y));
  const bg = o.bg ?? PAL.pink;
  const t = txt(scene, 0, 0, s, { size: o.size ?? 10, bold: o.bold, color: o.fg ?? '#ffffff' });
  const w = Math.ceil(t.width) + 10, h = Math.ceil(t.height) + 4;
  const left = -Math.round(w * (o.ox ?? 0.5)), top = -Math.round(h * (o.oy ?? 0.5));
  const g = scene.add.graphics();
  panel(g, left, top, w, h, bg, shade(bg, 22), PAL.ink);
  t.setPosition(left + 5, top + 2);
  c.add([g, t]);
  c.setSize(w, h);
  c.setDepth(o.depth ?? 960);
  c.setData('label', t);
  if (o.pop) {
    c.setScale(0);
    scene.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.Out' });
  }
  return c;
}

// 입체 픽셀 버튼 (아래쪽 두께 + 눌림 효과)
export function button(scene: Phaser.Scene, x: number, y: number, label: string, o: { w?: number; h?: number; bg?: number; size?: number } = {}) {
  const w = o.w ?? 96, h = o.h ?? 24, bg = o.bg ?? PAL.pink;
  const c = scene.add.container(Math.round(x), Math.round(y));
  const base = scene.add.graphics();
  base.fillStyle(0x000000, 0.3); chamfer(base, -w / 2 + 1, -h / 2 + 5, w, h + 1);
  base.fillStyle(PAL.ink); chamfer(base, -w / 2, -h / 2, w, h + 4);
  base.fillStyle(shade(bg, -28)); chamfer(base, -w / 2 + 1, -h / 2 + 1, w - 2, h + 2, 1);
  const face = scene.add.graphics();
  face.fillStyle(bg); chamfer(face, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 1);
  face.fillStyle(0xffffff, 0.5); face.fillRect(-w / 2 + 3, -h / 2 + 2, w - 6, 1);
  face.fillStyle(0xffffff, 0.35); face.fillRect(-w / 2 + 3, -h / 2 + 4, 3, 2);
  const t = txt(scene, 0, -1, label, { bold: true, size: o.size ?? 12, color: '#ffffff', stroke: Phaser.Display.Color.IntegerToColor(shade(bg, -40)).rgba, strokeThickness: 2 }).setOrigin(0.5);
  c.add([base, face, t]);
  c.setSize(w, h + 4);
  c.setInteractive({ useHandCursor: true });
  // 누를 때 버튼 면이 한 칸 내려감
  const press = (d: number) => { face.y = d; t.y = -1 + d; };
  c.on('pointerdown', () => press(2));
  c.on('pointerup', () => press(0));
  c.on('pointerout', () => press(0));
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.06, duration: 100 }));
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 100 }));
  c.setData('label', t);
  return c;
}

// 바운스하는 작은 삼각형 (계속/다음 표시)
function caret(scene: Phaser.Scene, x: number, y: number, color = PAL.pink) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(PAL.ink); g.fillTriangle(-5, -3, 5, -3, 0, 3);
  g.fillStyle(color); g.fillTriangle(-3, -2, 3, -2, 0, 1);
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
    const top = mission ? 10 : 8;
    this.ko = txt(scene, 10, top, '', { bold: true, color: INK, lineSpacing: 1, wordWrap: { width: w - 22, useAdvancedWrap: true } });
    this.en = txt(scene, 10, top, '', { size: 10, color: MUTED, wordWrap: { width: w - 22, useAdvancedWrap: true } });
    this.arrow = caret(scene, w - 11, h - 9);
    this.add([this.g, this.ko, this.en, this.arrow]);
    if (mission) {
      // 상단 "MISSION" 리본 탭
      const tab = scene.add.graphics();
      panel(tab, 8, -7, 60, 13, PAL.pink, shade(PAL.pink, 22), PAL.ink, false);
      const tt = txt(scene, 14, -6, '★ MISSION', { size: 10, color: '#ffffff' });
      this.add([tab, tt]);
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
    this.g.fillStyle(this.isMission ? PAL.pink : PAL.sky, 1); this.g.fillRect(2, 3, 2, h - 7);
    this.scene.tweens.killTweensOf(this.arrow);
    this.arrow.setPosition(this.bw - 11, h - 9);
    this.scene.tweens.add({ targets: this.arrow, y: h - 7, yoyo: true, repeat: -1, duration: 380, ease: 'Sine.InOut' });
  }

  get top() { return this.isMission ? 10 : 8; }

  fit(ko: string, en: string) {
    this.ko.setText(ko);
    this.en.setText(en);
    this.en.y = this.top + 3 + this.ko.height;
    const h = this.top + 8 + this.ko.height + (en ? this.en.height + 3 : 0);
    this.ko.setText(''); this.en.setText('');
    this.resize(Math.max(h, 30));
  }

  // 글자를 타자기처럼 출력
  async say(ko: string, en = '', speed = 28) {
    this.fit(ko, en);
    for (let i = 1; i <= ko.length; i++) {
      this.ko.setText(ko.slice(0, i));
      if (i % 2 === 0) sfx.typing();
      await director.wait(this.scene, speed);
    }
    this.en.y = this.top + 3 + this.ko.height;
    this.en.setText(en);
  }

  static mission(scene: Phaser.Scene, ko: string, en: string, x = 10, y = 10, w = 230) {
    const d = new DialogBox(scene, x, y + 4, w, 40, true);
    d.fit(ko, en);
    d.ko.setText(ko);
    d.en.y = d.top + 3 + d.ko.height;
    d.en.setText(en);
    d.setAlpha(0);
    scene.tweens.add({ targets: d, alpha: 1, y: { from: y - 4, to: y + 4 }, duration: 280, ease: 'Back.Out' });
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
  segs = 10;

  constructor(scene: Phaser.Scene, portraitKey: string) {
    super(scene, W - 214, 6);
    const g = scene.add.graphics();
    // 카드
    panel(g, 22, 3, 186, 34);
    // 바 홈
    g.fillStyle(PAL.ink, 1); g.fillRect(41, 21, 160, 11);
    g.fillStyle(0xe4d5b8, 1); g.fillRect(42, 22, 158, 9);
    g.fillStyle(0x000000, 0.12); g.fillRect(42, 22, 158, 2);
    // 초상화 링
    g.fillStyle(0x000000, 0.28); g.fillCircle(19, 22, 18);
    g.fillStyle(PAL.ink, 1); g.fillCircle(18, 20, 18);
    g.fillStyle(PAL.gold, 1); g.fillCircle(18, 20, 16);
    g.fillStyle(0xffe9a8, 1); g.fillCircle(18, 19, 15);
    g.fillStyle(0xfff6e6, 1); g.fillCircle(18, 20, 13);
    this.bar = scene.add.graphics();
    // 머리 부분만 잘라 초상화로 사용 (crop 중심 24,25 → 링 중심 18,20)
    const face = scene.add.image(18 - 24, 20 - 19, portraitKey, 'idle0').setOrigin(0).setScale(0.5).setCrop(26, 16, 44, 44);
    this.title = txt(scene, 41, 5, '', { bold: true, color: INK });
    this.lvBg = scene.add.graphics();
    this.lvTag = txt(scene, 18, 39, '', { size: 10, color: '#4a2a00' }).setOrigin(0.5, 1);
    this.label = txt(scene, 201, 8, '', { size: 10, color: MUTED }).setOrigin(1, 0);
    this.add([g, this.bar, face, this.title, this.label, this.lvBg, this.lvTag]);
    this.setDepth(950);
    scene.add.existing(this);
    this.shown = state.xp;
    this.refresh();
  }

  refresh() {
    const lv = state.maxed ? LEVELS[2] : state.level;
    this.title.setText(state.maxed ? 'K-MASTER' : lv.title);
    if (this.lvTag.text !== `Lv.${lv.lv}`) {
      this.lvTag.setText(`Lv.${lv.lv}`);
      const w = Math.ceil(this.lvTag.width) + 8;
      this.lvBg.clear();
      panel(this.lvBg, 18 - Math.round(w / 2), 27, w, 13, PAL.gold, 0xffe9a0, PAL.ink, false);
    }
    this.label.setText(`${Math.round(this.shown)}/${MAX_XP} XP`);
    this.bar.clear();
    const fw = Math.round((this.shown / MAX_XP) * 158);
    if (fw > 0) {
      this.bar.fillStyle(lv.color, 1); this.bar.fillRect(42, 22, fw, 9);
      this.bar.fillStyle(0xffffff, 0.45); this.bar.fillRect(42, 23, fw, 2);
      this.bar.fillStyle(0x000000, 0.15); this.bar.fillRect(42, 29, fw, 2);
      this.bar.fillStyle(0xffffff, 0.9); this.bar.fillRect(42 + fw - 1, 22, 1, 9);
    }
    // 눈금
    for (let i = 1; i < this.segs; i++) {
      this.bar.fillStyle(PAL.ink, 0.25); this.bar.fillRect(42 + Math.round((i * 158) / this.segs), 22, 1, 9);
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
      this.scene.tweens.add({ targets: this, scale: { from: 1.05, to: 1 }, duration: 250 });
    });
  }
}

// ---------------- 아이템 핫바 (하단 중앙) ----------------
export interface ItemRef { id: string; tex: string; frame?: string | number; }

// 고른 칸 위에 보여줄 아이템 이름
const ITEM_NAMES: Record<string, string> = {
  sneaker: '운동화', sword: '검', shield: '방패', potion: '물약', chest: '보물상자', tshirt: '티셔츠', glove: '장갑', backpack: '가방',
  watermelon: '수박', yakgwa: '약과', gimbap: '김밥', sikhye: '식혜', apple: '사과', eggs: '맥반석 계란', tteok: '떡', persimmon: '감',
  hoodie: '후드티', monkrobe: '승복', hanbok: '한복', uniform: '교복', cupramen: '컵라면', corndog: '핫도그', soda: '탄산음료', chicken: '치킨',
  bananamilk: '바나나우유', cupramen2: '컵라면', cheese: '치즈', samgak: '삼각김밥', icecream: '아이스크림', sausage: '소시지', cookies: '쿠키', tteokbokki: '떡볶이',
};

export class Hotbar extends Phaser.GameObjects.Container {
  slots: Phaser.GameObjects.Image[] = [];
  cursor: Phaser.GameObjects.Graphics;
  nameTag?: Phaser.GameObjects.Container;
  index = 0;
  items: ItemRef[];
  onPick?: (id: string, slot: number) => void;
  enabled = true;
  keyHandler?: (e: KeyboardEvent) => void;
  slotW = 34;
  x0: number;

  constructor(scene: Phaser.Scene, items: ItemRef[], startIndex = 2) {
    super(scene, 0, H - 44);
    this.items = items;
    const trayW = items.length * this.slotW + 10;
    this.x0 = Math.round((W - trayW) / 2) + 5;
    const g = scene.add.graphics();
    panel(g, this.x0 - 5, 0, trayW, 40);
    items.forEach((_, i) => {
      const x = this.x0 + i * this.slotW;
      g.fillStyle(PAL.cream2, 1); g.fillRect(x + 2, 5, this.slotW - 4, 30);
      g.fillStyle(0x000000, 0.1); g.fillRect(x + 2, 5, this.slotW - 4, 2);
      g.fillStyle(0xffffff, 0.6); g.fillRect(x + 2, 34, this.slotW - 4, 1);
    });
    this.add(g);
    this.cursor = scene.add.graphics();
    this.add(this.cursor);
    items.forEach((it, i) => {
      const im = scene.add.image(this.slotX(i), 20, it.tex, it.frame).setInteractive({ useHandCursor: true });
      const s = Math.min(26 / im.width, 26 / im.height, 1);
      im.setScale(s >= 1 ? 1 : s);
      im.setData('s', im.scale);
      im.on('pointerdown', () => { if (this.enabled) { this.setIndex(i); this.pick(); } });
      this.slots.push(im);
      this.add(im);
    });
    if (!director.auto) {
      const help = tag(scene, W - 8, 20, '◀ ▶ 이동   ENTER 선택', { bg: PAL.ink, fg: '#e8e0ff', ox: 1, depth: 0 });
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
    scene.tweens.add({ targets: this, y: H - 44, duration: 320, ease: 'Back.Out' });
  }

  slotX(i: number) {
    return this.x0 + i * this.slotW + this.slotW / 2;
  }

  setIndex(i: number, sound = true) {
    this.index = Phaser.Math.Clamp(i, 0, this.items.length - 1);
    const x = this.slotX(this.index);
    const c = this.cursor;
    c.clear();
    c.fillStyle(PAL.ink); c.fillRect(x - 17, 2, 34, 36);
    c.fillStyle(PAL.pink); c.fillRect(x - 16, 3, 32, 34);
    c.fillStyle(0xfff0f6); c.fillRect(x - 14, 5, 28, 30);
    c.fillStyle(0xffffff, 0.8); c.fillRect(x - 14, 5, 28, 2);
    // 모서리 반짝
    c.fillStyle(0xffffff); c.fillRect(x - 16, 3, 2, 2); c.fillRect(x + 14, 33, 2, 2);
    // 선택된 아이템만 살짝 키움
    this.slots.forEach((im, k) => { this.scene.tweens.killTweensOf(im); im.setPosition(this.slotX(k), k === this.index ? 19 : 20).setScale(im.getData('s') * (k === this.index ? 1.12 : 1)); });
    // 이름표
    this.nameTag?.destroy();
    const name = ITEM_NAMES[this.items[this.index].id];
    if (name) {
      this.nameTag = tag(this.scene, x, -9, name, { bg: PAL.ink, fg: '#ffffff', depth: 0 });
      this.add(this.nameTag);
    }
    if (sound) sfx.move();
  }

  pick() {
    sfx.select();
    const im = this.slots[this.index];
    this.scene.tweens.killTweensOf(im);
    im.setPosition(this.slotX(this.index), 19);
    this.scene.tweens.add({ targets: im, y: 13, yoyo: true, duration: 90 });
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
    this.scene.tweens.add({ targets: this, y: H + 30, duration: 250, ease: 'Back.In', onComplete: () => this.destroy() });
  }
}

// ---------------- 떠오르는 XP / 문구 ----------------
export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color = '#ffffff', size = 12) {
  const t = txt(scene, x, y, s, { bold: true, size, color, stroke: INK, strokeThickness: 3 }).setOrigin(0.5).setDepth(960);
  t.setShadow(0, 1, INK, 0, true, false);
  t.setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: y - 26, duration: 1100, ease: 'Quad.Out' });
  scene.tweens.add({ targets: t, alpha: 0, delay: 800, duration: 400, onComplete: () => t.destroy() });
  return t;
}

export function xpPop(scene: Phaser.Scene, x: number, y: number, n: number) {
  sfx.coin();
  return floatText(scene, x, y, `+${n} XP`, '#fff27a', 12);
}

// 리본 (양 끝이 접힌 띠)
export function ribbonShape(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  const dk = shade(color, -30), dd = shade(color, -45);
  const tail = (s: number) => {
    const x0 = s * (w / 2 - 6), x1 = s * (w / 2 + 22), x2 = s * (w / 2 + 12);
    g.fillStyle(PAL.ink); g.fillPoints([{ x: x0, y: -h / 2 + 5 }, { x: x1 + s * 2, y: -h / 2 + 5 }, { x: x2 + s * 2, y: 4 }, { x: x1 + s * 2, y: h / 2 + 7 }, { x: x0, y: h / 2 + 7 }], true);
    g.fillStyle(dk); g.fillPoints([{ x: x0, y: -h / 2 + 6 }, { x: x1, y: -h / 2 + 6 }, { x: x2, y: 4 }, { x: x1, y: h / 2 + 6 }, { x: x0, y: h / 2 + 6 }], true);
    g.fillStyle(dd); g.fillTriangle(s * (w / 2 - 6), h / 2, s * (w / 2 + 6), h / 2 + 6, s * (w / 2 - 6), h / 2 + 6);
  };
  tail(-1); tail(1);
  g.fillStyle(0x000000, 0.25); g.fillRect(-w / 2 + 1, -h / 2 + 3, w, h);
  g.fillStyle(PAL.ink); g.fillRect(-w / 2, -h / 2, w, h);
  g.fillStyle(color); g.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
  g.fillStyle(0xffffff, 0.35); g.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, 2);
  g.fillStyle(0x000000, 0.15); g.fillRect(-w / 2 + 1, h / 2 - 4, w - 2, 3);
}

// 스테이지 타이틀 박스 (중앙)
export function stageBanner(scene: Phaser.Scene, lv: number) {
  const info = LEVELS[lv - 1];
  const c = scene.add.container(W / 2, H / 2).setDepth(970);
  // 화면을 살짝 어둡게
  const dim = scene.add.rectangle(0, 0, W * 2, H * 2, 0x14102a, 0.35);
  const g = scene.add.graphics();
  panel(g, -128, -26, 256, 66);
  g.fillStyle(PAL.cream2, 1); g.fillRect(-110, 13, 220, 1);
  const rg = scene.add.graphics({ y: -30 });
  ribbonShape(rg, 200, 22, PAL.pink);
  const t1 = txt(scene, 0, -36, `STAGE ${lv}  ·  ${info.title}`, { bold: true, color: '#ffffff', stroke: Phaser.Display.Color.IntegerToColor(PAL.pinkDk).rgba, strokeThickness: 2 }).setOrigin(0.5, 0);
  const t2 = txt(scene, 0, -6, info.ko, { size: 14, color: INK }).setOrigin(0.5, 0).setFontFamily('Galmuri14');
  const t3 = txt(scene, 0, 19, info.en, { size: 10, color: MUTED }).setOrigin(0.5, 0);
  const stars = [-1, 1].map((s) => txt(scene, s * (t2.width / 2 + 14), 2, '★', { color: '#ffc94a', stroke: INK, strokeThickness: 2 }).setOrigin(0.5));
  c.add([dim, g, rg, t1, t2, t3, ...stars]);
  stars.forEach((st, i) => scene.tweens.add({ targets: st, angle: i ? 15 : -15, yoyo: true, repeat: -1, duration: 500 }));
  c.setScale(0.2).setAlpha(0);
  dim.setScale(5);
  scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 380, ease: 'Back.Out' });
  return c;
}

// 미션 클리어 스탬프
export async function missionClear(scene: Phaser.Scene) {
  sfx.clear();
  // 화면을 가로지르는 띠
  const band = scene.add.graphics({ x: W / 2, y: 120 }).setDepth(979);
  band.fillStyle(0x14102a, 0.6); band.fillRect(-W, -34, W * 2, 68);
  band.fillStyle(PAL.gold, 1); band.fillRect(-W, -34, W * 2, 2); band.fillRect(-W, 32, W * 2, 2);
  band.setScale(1, 0);
  scene.tweens.add({ targets: band, scaleY: 1, duration: 200, ease: 'Quad.Out' });
  const c = scene.add.container(W / 2, 124).setDepth(980);
  const t = bigText(scene, 0, 0, 'MISSION CLEAR!', 3, '#ffe066', '#7a2d00');
  const stars = [-90, 0, 90].map((dx, i) => {
    const s = txt(scene, dx, -34, '★', { size: 14, color: '#ffe066', stroke: '#7a2d00', strokeThickness: 2 }).setOrigin(0.5).setScale(2);
    s.setAlpha(0);
    scene.tweens.add({ targets: s, alpha: 1, scale: { from: 4, to: i === 1 ? 2.4 : 2 }, delay: 200 + i * 120, duration: 250, ease: 'Back.Out' });
    return s;
  });
  c.add([t, ...stars]);
  c.setScale(0.3);
  scene.tweens.add({ targets: c, scale: 1, duration: 300, ease: 'Back.Out' });
  // 반짝이 점
  for (let i = 0; i < 14; i++) {
    const p = scene.add.rectangle(W / 2 + Phaser.Math.Between(-200, 200), 124 + Phaser.Math.Between(-26, 26), 2, 2, 0xffffff).setDepth(981).setAlpha(0);
    scene.tweens.add({ targets: p, alpha: 1, scale: 2, yoyo: true, delay: Phaser.Math.Between(100, 1100), duration: 200, onComplete: () => p.destroy() });
  }
  await director.wait(scene, 1500);
  scene.tweens.add({ targets: [c, band], alpha: 0, duration: 300, onComplete: () => { c.destroy(); band.destroy(); } });
}

// 게임 위젯: 말풍선(한/영), K-TIP 문화 카드, 하트 목숨, 타이밍 미니게임
import Phaser from 'phaser';
import { sfx } from './audio';
import { director } from './director';
import { panel, lightPanel, rrect, txt, balance, PAL, INK, TXT, SUB, ACC, GOLD, EN, TYPE, W, H, type ItemRef } from './ui';

// ---------------- 말풍선 ----------------
// (x, y) = 꼬리 끝. 한국어 한 줄 + 영어 한 줄, 아이콘(요청 아이템)을 함께 띄울 수 있다.
export function speech(scene: Phaser.Scene, x: number, y: number, ko: string, en = '', o: { icon?: ItemRef; depth?: number; pop?: boolean } = {}) {
  const c = scene.add.container(Math.round(x), Math.round(y)).setDepth(o.depth ?? 975);
  const t1 = ko ? balance(txt(scene, 0, 0, '', { px: TYPE.body, weight: 700, color: INK, lineSpacing: 1 }), ko, 196) : undefined;
  const t2 = en ? balance(txt(scene, 0, 0, '', { px: TYPE.small + 0.5, weight: 500, color: '#4b5378', lineSpacing: 1 }), en, 196) : undefined;
  let im: Phaser.GameObjects.Image | undefined;
  let iconW = 0;
  if (o.icon) {
    im = scene.add.image(0, 0, o.icon.tex, o.icon.frame);
    im.setScale(Math.min(20 / im.width, 20 / im.height));
    iconW = 26;
  }
  const tw = Math.max(t1?.width ?? 0, t2?.width ?? 0);
  const gap = t1 && t2 ? 1 : 0;
  const th = (t1?.height ?? 0) + (t2?.height ?? 0) + gap;
  const w = Math.ceil(tw + iconW + 18), h = Math.ceil(Math.max(th, iconW ? 24 : 0) + 10);
  let bx = -Math.round(w / 2);
  if (x + bx < 4) bx = 4 - Math.round(x);
  if (x + bx + w > W - 4) bx = W - 4 - w - Math.round(x);
  const by = -h - 5;
  const g = scene.add.graphics();
  lightPanel(g, bx, by, w, h);
  const tx = Phaser.Math.Clamp(0, bx + 8, bx + w - 8);
  g.fillStyle(0xffffff); g.fillTriangle(tx - 4, by + h - 0.5, tx + 4, by + h - 0.5, tx, by + h + 5);
  c.add(g);
  if (im) {
    g.fillStyle(0xeef0f8); rrect(g, bx + 4, by + 4, 22, h - 8, 3);
    im.setPosition(bx + 15, by + h / 2); c.add(im);
  }
  let ty = by + (h - th) / 2;
  if (t1) { t1.setPosition(bx + 9 + iconW, ty); c.add(t1); ty += t1.height + gap; }
  if (t2) { t2.setPosition(bx + 9 + iconW, ty); c.add(t2); }
  if (o.pop !== false) {
    c.setScale(0.6).setAlpha(0);
    scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 180, ease: 'Back.Out' });
  }
  return c;
}

// ---------------- K-TIP 문화 카드 ----------------
export async function tipCard(scene: Phaser.Scene, ko: string, en: string) {
  const w = 404;
  const c = scene.add.container(W / 2, 150).setDepth(985);
  const dim = scene.add.rectangle(0, 0, W * 4, H * 4, 0x070a1a, 0.35);
  const t1 = balance(txt(scene, 0, 0, '', { px: TYPE.body + 0.5, weight: 700, color: TXT, lineSpacing: 2 }), ko, w - 72);
  const t2 = balance(txt(scene, 0, 0, '', { px: TYPE.body - 0.5, weight: 500, color: EN, lineSpacing: 1.5 }), en, w - 72);
  const h = Math.max(72, 28 + t1.height + 5 + t2.height + 14);
  const g = scene.add.graphics();
  panel(g, -w / 2, -h / 2, w, h);
  g.fillStyle(PAL.gold); g.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, 2, h - 12, 1);
  // 전구 아이콘 (원형 배지)
  const b = scene.add.graphics({ x: -w / 2 + 28, y: -h / 2 + 30 });
  b.fillStyle(PAL.gold, 0.16); b.fillCircle(0, 0, 15);
  b.fillStyle(PAL.gold); b.fillCircle(0, -2.5, 6.5);
  b.fillStyle(0xfff4d0); b.fillCircle(-2, -4.5, 2);
  b.fillStyle(0xc9cde6); b.fillRoundedRect(-3.5, 3.5, 7, 5.5, 1.5);
  b.fillStyle(0x7d84a8); b.fillRect(-3.5, 5.5, 7, 0.75); b.fillRect(-3.5, 7.2, 7, 0.75);
  const head = txt(scene, -w / 2 + 52, -h / 2 + 9, 'K-TIP', { px: TYPE.cap, weight: 800, color: GOLD, spacing: 1.5 });
  const head2 = txt(scene, -w / 2 + 52 + head.width + 6, -h / 2 + 9, '알아두면 좋은 한국 문화  ·  Good to know', { px: TYPE.cap, weight: 600, color: SUB });
  t1.setPosition(-w / 2 + 52, -h / 2 + 24);
  t2.setPosition(-w / 2 + 52, -h / 2 + 24 + t1.height + 5);
  c.add([dim, g, b, head, head2, t1, t2]);
  if (!director.auto) {
    const k = txt(scene, w / 2 - 12, h / 2 - 7, 'NEXT  ·  다음  →', { px: TYPE.cap, weight: 700, color: ACC, spacing: 1 }).setOrigin(1, 1);
    scene.tweens.add({ targets: k, alpha: 0.4, yoyo: true, repeat: -1, duration: 500 });
    c.add(k);
  }
  c.setAlpha(0).setScale(0.94);
  sfx.sparkle();
  scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 220, ease: 'Quad.Out' });
  await director.waitInput(scene, 3400);
  await new Promise<void>((ok) => scene.tweens.add({ targets: c, alpha: 0, duration: 180, onComplete: () => { c.destroy(); ok(); } }));
}

// ---------------- 하트 목숨 ----------------
export class Lives extends Phaser.GameObjects.Container {
  hearts: Phaser.GameObjects.Graphics[] = [];
  n: number;

  constructor(scene: Phaser.Scene, n = 3) {
    super(scene, W - 10, 52);
    this.n = n;
    const bg = scene.add.graphics();
    const w = n * 17 + 9;
    panel(bg, -w, -10, w, 20, PAL.surf, PAL.line, PAL.edge, true, 0.92, 4);
    this.add(bg);
    for (let i = 0; i < n; i++) {
      const g = scene.add.graphics({ x: -w + 12 + i * 17, y: 0 });
      Lives.draw(g, true);
      this.hearts.push(g);
      this.add(g);
    }
    this.setDepth(950);
    scene.add.existing(this);
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 220 });
  }

  static draw(g: Phaser.GameObjects.Graphics, full: boolean) {
    g.clear();
    const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
    HEART.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch !== '#') return;
      g.fillStyle(full ? (y === 1 && x === 1 ? 0xffd0da : PAL.acc) : 0x3a4166);
      g.fillRect(x - 3, y - 3, 1, 1);
    }));
    g.setScale(2);
  }

  lose() {
    if (this.n <= 0) return;
    this.n--;
    const g = this.hearts[this.n];
    Lives.draw(g, false);
    this.scene.tweens.add({ targets: g, y: -3, yoyo: true, duration: 120 });
    this.scene.tweens.add({ targets: this, x: this.x - 3, yoyo: true, repeat: 2, duration: 40 });
  }

  hide() {
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 250, onComplete: () => this.destroy() });
  }
}

// ---------------- 타이밍 미니게임 ----------------
export type Timing = 'perfect' | 'good' | 'miss';

export function timingGame(scene: Phaser.Scene, ko: string, en: string): Promise<Timing> {
  return new Promise((resolve) => {
    const c = scene.add.container(W / 2, H - 50).setDepth(985);
    const g = scene.add.graphics();
    panel(g, -134, -32, 268, 64);
    g.fillStyle(PAL.acc); g.fillRoundedRect(-130, -26, 2, 52, 1);
    const title = txt(scene, -122, -25, ko, { px: TYPE.body + 0.5, weight: 700, color: TXT });
    const sub = txt(scene, -122 + title.width + 6, -25 + (title.height - 11) / 2 + 1, en, { px: TYPE.small + 0.5, weight: 500, color: EN });
    const keyHint = txt(scene, 122, 14, director.auto ? '' : 'SPACE · TAP  ·  타이밍에 맞춰 눌러요', { px: TYPE.cap, weight: 700, color: ACC, spacing: 0.5 }).setOrigin(1, 0);
    // 게이지
    const bw = 236, bx = -118, by = -6;
    const zoneC = Phaser.Math.Between(-70, 70);
    const gz = 52, pz = 14;
    g.fillStyle(0x000000, 0.35); rrect(g, bx - 1, by - 1, bw + 2, 12, 4);
    g.fillStyle(PAL.surf2); rrect(g, bx, by, bw, 10, 3.5);
    g.fillStyle(PAL.mint, 0.8); g.fillRect(zoneC - gz / 2, by, gz, 10);
    g.fillStyle(PAL.gold); g.fillRect(zoneC - pz / 2, by, pz, 10);
    const cur = scene.add.graphics();
    cur.fillStyle(0x000000, 0.45); cur.fillRoundedRect(-2.5, -4, 5, 18, 2);
    cur.fillStyle(0xffffff); cur.fillRoundedRect(-1.5, -3, 3, 16, 1.5);
    cur.setPosition(bx, by);
    c.add([g, title, sub, keyHint, cur]);
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, y: { from: H - 40, to: H - 50 }, duration: 200, ease: 'Quad.Out' });
    const tw = scene.tweens.add({ targets: cur, x: bx + bw, duration: 950, yoyo: true, repeat: -1, ease: 'Linear', delay: 300 });
    let done = false;
    const press = () => {
      if (done) return;
      done = true;
      tw.stop();
      window.removeEventListener('keydown', onKey);
      scene.input.off('pointerdown', press);
      const d = Math.abs(cur.x - zoneC);
      const r: Timing = d <= pz / 2 + 1 ? 'perfect' : d <= gz / 2 ? 'good' : 'miss';
      if (r === 'miss') sfx.wrong(); else sfx.clear();
      const label = r === 'perfect' ? 'PERFECT  완벽해요' : r === 'good' ? 'GOOD  좋아요' : 'MISS  아쉬워요';
      const jt = txt(scene, 0, -46, label, { px: 16, weight: 900, color: r === 'perfect' ? GOLD : r === 'good' ? '#7ef0c4' : '#ff9aa8', stroke: '#0b0f24', strokeThickness: 3, spacing: 1 }).setOrigin(0.5);
      c.add(jt);
      jt.setScale(0.6);
      scene.tweens.add({ targets: jt, y: -50, scale: 1, duration: 260, ease: 'Back.Out' });
      scene.time.delayedCall(800 / director.speed, () => scene.tweens.add({ targets: c, alpha: 0, duration: 200, onComplete: () => { c.destroy(); resolve(r); } }));
    };
    const onKey = (e: KeyboardEvent) => { if (!director.auto && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp')) press(); };
    scene.time.delayedCall(350, () => {
      window.addEventListener('keydown', onKey);
      scene.input.on('pointerdown', press);
    });
    scene.events.once('shutdown', () => window.removeEventListener('keydown', onKey));
    if (director.auto) {
      const ev = scene.time.addEvent({ delay: 16, loop: true, callback: () => {
        if (done) { ev.remove(); return; }
        if (Math.abs(cur.x - zoneC) <= 2 && scene.time.now > 900) { ev.remove(); press(); }
      } });
    }
  });
}

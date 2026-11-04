// 장면 전환(브릿지)과 파티클 이펙트
// FxScene 은 항상 최상단에서 돌며, 씬이 바뀌어도 전환 화면을 유지한다.
import Phaser from 'phaser';
import { sfx } from './audio';
import { W, H, setupCamera } from './ui';

export type Wipe = 'hearts' | 'food' | 'pixel' | 'dissolve' | 'fade' | 'crt' | 'flash' | 'white';

const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];

export class FxScene extends Phaser.Scene {
  cover!: Phaser.GameObjects.Container;
  pendingReveal: Wipe | null = null;
  cells: Phaser.GameObjects.GameObject[] = [];

  constructor() { super({ key: 'fx', active: false }); }

  create() {
    setupCamera(this);
    this.cover = this.add.container(0, 0).setDepth(10);
  }

  private clearCells() {
    this.cover.removeAll(true);
    this.cells = [];
  }

  // 화면을 덮는다 → resolve 시점에 화면은 완전히 가려져 있음
  async wipeIn(kind: Wipe, from?: Phaser.Scene): Promise<void> {
    this.scene.bringToTop();
    this.clearCells();
    const wait = (ms: number) => new Promise<void>((ok) => this.time.delayedCall(ms, () => ok()));
    switch (kind) {
      case 'hearts': {
        // 하트 픽셀이 무작위로 번지며 화면을 덮음 (#11-12)
        sfx.sparkle();
        const cols = [0xff8fc8, 0xf06bd0, 0xb06cf0, 0xffffff, 0x9fd8ff, 0xffb3e0];
        const bg = this.add.rectangle(0, 0, W, H, 0xffb3e0).setOrigin(0).setAlpha(0);
        this.cover.add(bg);
        for (let i = 0; i < 70; i++) {
          const x = Phaser.Math.Between(-20, W), y = Phaser.Math.Between(-20, H);
          const s = Phaser.Math.Between(4, 10);
          const g = this.add.graphics({ x, y });
          g.fillStyle(Phaser.Utils.Array.GetRandom(cols), 1);
          HEART.forEach((row, ry) => [...row].forEach((ch, rx) => ch === '#' && g.fillRect(rx * s, ry * s, s, s)));
          g.setScale(0);
          this.tweens.add({ targets: g, scale: 1, delay: i * 12, duration: 260, ease: 'Back.Out' });
          this.cover.add(g);
        }
        this.tweens.add({ targets: bg, alpha: 1, delay: 500, duration: 400 });
        await wait(950);
        break;
      }
      case 'food': {
        // 음식 픽셀 아이콘이 쏟아지며 덮음 (#16-17)
        sfx.sparkle();
        const bg = this.add.rectangle(0, 0, W, H, 0xfff1c9).setOrigin(0).setAlpha(0);
        this.cover.add(bg);
        const frames = this.textures.exists('food') ? this.textures.get('food').getFrameNames() : [];
        for (let i = 0; i < 90; i++) {
          const x = (i % 15) * 44 + Phaser.Math.Between(-6, 26), y = Math.floor(i / 15) * 62 + Phaser.Math.Between(-10, 20);
          const im = frames.length ? this.add.image(x, y, 'food', Phaser.Utils.Array.GetRandom(frames)) : this.add.rectangle(x, y, 24, 24, 0xff9fc8);
          (im as Phaser.GameObjects.Image).setScale(0);
          this.tweens.add({ targets: im, scale: 0.7, angle: Phaser.Math.Between(-15, 15), delay: Phaser.Math.Between(0, 600), duration: 220, ease: 'Back.Out' });
          this.cover.add(im);
        }
        this.tweens.add({ targets: bg, alpha: 1, delay: 450, duration: 350 });
        await wait(1000);
        break;
      }
      case 'pixel': {
        // 픽셀 포커스 아웃 (#24-25): 이전 씬 카메라를 점점 굵은 픽셀로
        const cam = from?.cameras.main;
        if (cam && this.game.renderer.type === Phaser.WEBGL) {
          const px = cam.postFX.addPixelate(1);
          this.tweens.add({ targets: px, amount: 28, duration: 900, ease: 'Quad.In' });
          const bg = this.add.rectangle(0, 0, W, H, 0x2a2060).setOrigin(0).setAlpha(0);
          this.cover.add(bg);
          this.tweens.add({ targets: bg, alpha: 1, delay: 700, duration: 300 });
          await wait(1050);
        } else {
          await this.wipeIn('fade');
        }
        break;
      }
      case 'dissolve': {
        // 픽셀 디졸브 → 블랙 (#29-30)
        const s = 8;
        const cells: Phaser.GameObjects.Rectangle[] = [];
        for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
          const r = this.add.rectangle(x, y, s, s, 0x000000).setOrigin(0).setAlpha(0);
          cells.push(r); this.cover.add(r);
        }
        Phaser.Utils.Array.Shuffle(cells);
        // 왼쪽에서 오른쪽으로 번지는 느낌을 위해 x 가중
        cells.forEach((r) => {
          const d = (r.x / W) * 700 + Math.random() * 500;
          this.tweens.add({ targets: r, alpha: 1, delay: d, duration: 60 });
        });
        await wait(1300);
        break;
      }
      case 'crt': {
        const bg = this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0).setAlpha(0);
        const line = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff).setAlpha(0);
        this.cover.add([bg, line]);
        this.tweens.add({ targets: bg, alpha: 1, duration: 200 });
        line.setAlpha(1).setScale(1, 1);
        this.tweens.add({ targets: line, scaleY: 0.01, duration: 180, ease: 'Quad.In' });
        this.tweens.add({ targets: line, scaleX: 0, delay: 180, duration: 160, ease: 'Quad.In' });
        await wait(380);
        break;
      }
      case 'flash': case 'white': {
        const bg = this.add.rectangle(0, 0, W, H, 0xffffff).setOrigin(0).setAlpha(0);
        this.cover.add(bg);
        this.tweens.add({ targets: bg, alpha: 1, duration: kind === 'flash' ? 120 : 500 });
        await wait(kind === 'flash' ? 140 : 520);
        break;
      }
      default: {
        const bg = this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0).setAlpha(0);
        this.cover.add(bg);
        this.tweens.add({ targets: bg, alpha: 1, duration: 400 });
        await wait(420);
      }
    }
    this.pendingReveal = kind;
  }

  // 새 씬 위의 덮개를 걷어낸다
  async wipeOut(to?: Phaser.Scene): Promise<void> {
    const kind = this.pendingReveal;
    this.pendingReveal = null;
    if (!kind) return;
    this.scene.bringToTop();
    const wait = (ms: number) => new Promise<void>((ok) => this.time.delayedCall(ms, () => ok()));
    const items = [...this.cover.list] as unknown as Phaser.GameObjects.Components.Alpha[];
    if (kind === 'pixel' && to && this.game.renderer.type === Phaser.WEBGL) {
      const px = to.cameras.main.postFX.addPixelate(28);
      this.tweens.add({ targets: items, alpha: 0, duration: 250 });
      this.tweens.add({ targets: px, amount: 1, duration: 900, ease: 'Quad.Out', onComplete: () => to.cameras.main.postFX.remove(px) });
      await wait(950);
    } else if (kind === 'crt') {
      this.clearCells();
      const line = this.add.rectangle(W / 2, H / 2, 2, 2, 0xffffff);
      const bg = this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);
      this.cover.add([bg, line]);
      this.tweens.add({ targets: line, displayWidth: W, duration: 160 });
      this.tweens.add({ targets: line, displayHeight: H, delay: 160, duration: 200, ease: 'Quad.Out' });
      this.tweens.add({ targets: [line, bg], alpha: 0, delay: 330, duration: 250 });
      await wait(600);
    } else if (kind === 'hearts' || kind === 'food' || kind === 'dissolve') {
      const bgs = items.filter((o) => o instanceof Phaser.GameObjects.Rectangle && (o as Phaser.GameObjects.Rectangle).width === W);
      this.tweens.add({ targets: bgs, alpha: 0, duration: 300 });
      const rest = Phaser.Utils.Array.Shuffle(items.filter((o) => !bgs.includes(o)));
      rest.forEach((o, i) => this.tweens.add({ targets: o, alpha: 0, delay: (i / rest.length) * 600, duration: 120 }));
      await wait(kind === 'dissolve' ? 200 : 750);
      if (kind === 'dissolve') { this.tweens.killTweensOf(rest); rest.forEach((o) => o.setAlpha(0)); const bg = this.add.rectangle(0, 0, W, H, 0).setOrigin(0); this.cover.add(bg); this.tweens.add({ targets: bg, alpha: 0, duration: 900 }); await wait(900); }
    } else {
      this.tweens.add({ targets: items, alpha: 0, duration: kind === 'flash' ? 300 : 450 });
      await wait(kind === 'flash' ? 300 : 460);
    }
    this.clearCells();
  }
}

// ---------------- 파티클 유틸 ----------------
export function makeFxTextures(scene: Phaser.Scene) {
  const g = scene.make.graphics({}, false);
  const mk = (key: string, w: number, h: number, draw: () => void) => {
    if (scene.textures.exists(key)) return;
    g.clear(); draw(); g.generateTexture(key, w, h);
  };
  mk('px', 2, 2, () => { g.fillStyle(0xffffff); g.fillRect(0, 0, 2, 2); });
  mk('px1', 1, 1, () => { g.fillStyle(0xffffff); g.fillRect(0, 0, 1, 1); });
  mk('spark', 5, 5, () => { g.fillStyle(0xffffff); g.fillRect(2, 0, 1, 5); g.fillRect(0, 2, 5, 1); });
  mk('plus', 7, 7, () => { g.fillStyle(0xffffff); g.fillRect(2, 0, 3, 7); g.fillRect(0, 2, 7, 3); });
  mk('heart', 7, 6, () => { g.fillStyle(0xffffff); HEART.forEach((r, y) => [...r].forEach((c, x) => c === '#' && g.fillRect(x, y, 1, 1))); });
  mk('star', 9, 9, () => {
    g.fillStyle(0xffffff);
    ['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '##.....##'].forEach((r, y) => [...r].forEach((c, x) => c === '#' && g.fillRect(x, y, 1, 1)));
  });
  g.destroy();
}

export function sparkles(scene: Phaser.Scene, x: number, y: number, n = 14, colors = [0xffffff, 0xffe066, 0x9fefff, 0xff9fd8], spread = 40) {
  for (let i = 0; i < n; i++) {
    const s = scene.add.image(x, y, Phaser.Utils.Array.GetRandom(['spark', 'plus', 'px'])).setTint(Phaser.Utils.Array.GetRandom(colors)).setDepth(800);
    const a = Math.random() * Math.PI * 2, d = spread * (0.4 + Math.random() * 0.6);
    scene.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 500 + Math.random() * 400, ease: 'Quad.Out', onComplete: () => s.destroy() });
  }
}

export function hearts(scene: Phaser.Scene, x: number, y: number, n = 3) {
  for (let i = 0; i < n; i++) {
    const h = scene.add.image(x + Phaser.Math.Between(-10, 10), y, 'heart').setTint(0xff6fa8).setDepth(800).setScale(1);
    scene.tweens.add({ targets: h, y: y - 24 - i * 6, alpha: 0, delay: i * 150, duration: 900, onComplete: () => h.destroy() });
  }
}

export function firework(scene: Phaser.Scene, x: number, y: number, color?: number, size = 1, depth = 500) {
  const cols = [0xff5fa2, 0xffd23f, 0x6ff0ff, 0xb98bff, 0x7dff8a, 0xff8a4c, 0xffffff];
  const c = color ?? Phaser.Utils.Array.GetRandom(cols);
  sfx.firework();
  const rays = 22;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const d = (34 + Math.random() * 10) * size;
    for (let k = 0; k < 3; k++) {
      const p = scene.add.image(x, y, 'px').setTint(k === 0 ? 0xffffff : c).setDepth(depth);
      scene.tweens.add({
        targets: p, x: x + Math.cos(a) * d * (1 - k * 0.18), y: y + Math.sin(a) * d * (1 - k * 0.18) + 8 * size,
        alpha: 0, duration: 1100 + k * 150, ease: 'Quad.Out', onComplete: () => p.destroy(),
      });
    }
  }
  const core = scene.add.image(x, y, 'plus').setTint(0xffffff).setScale(2 * size).setDepth(depth);
  scene.tweens.add({ targets: core, scale: 0, alpha: 0, duration: 400, onComplete: () => core.destroy() });
}

export function launchFirework(scene: Phaser.Scene, x: number, fromY: number, toY: number, size = 1, depth = 500) {
  sfx.launch();
  const p = scene.add.image(x, fromY, 'px').setTint(0xfff3b0).setDepth(depth);
  scene.tweens.add({
    targets: p, y: toY, duration: 650, ease: 'Quad.Out',
    onUpdate: () => {
      const t = scene.add.image(p.x, p.y, 'px1').setTint(0xffc96b).setDepth(depth);
      scene.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    },
    onComplete: () => { p.destroy(); firework(scene, x, toY, undefined, size, depth); },
  });
}

export function confetti(scene: Phaser.Scene, n = 60, depth = 700) {
  const cols = [0xff5fa2, 0xffd23f, 0x6ff0ff, 0xb98bff, 0x7dff8a, 0xffffff];
  for (let i = 0; i < n; i++) {
    const p = scene.add.rectangle(Phaser.Math.Between(0, W), -10, 3, 5, Phaser.Utils.Array.GetRandom(cols)).setDepth(depth);
    scene.tweens.add({
      targets: p, y: H + 10, x: p.x + Phaser.Math.Between(-60, 60), angle: Phaser.Math.Between(-360, 360),
      delay: Phaser.Math.Between(0, 900), duration: Phaser.Math.Between(1500, 2600), onComplete: () => p.destroy(),
    });
  }
}

export function shake(scene: Phaser.Scene, target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject) {
  // 연타해도 제자리에서 흔들리도록 원래 x를 기억
  if (target.getData('homeX') === undefined) target.setData('homeX', target.x);
  const x0 = target.getData('homeX') as number;
  scene.tweens.killTweensOf(target);
  target.x = x0;
  scene.tweens.add({ targets: target, x: x0 + 3, yoyo: true, repeat: 3, duration: 40, onComplete: () => (target.x = x0) });
}

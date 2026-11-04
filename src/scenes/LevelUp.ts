// #11 / #16 레벨업, #22~#24 엔딩 레벨(XP 1000 → MAX LEVEL → 명예 한국인)
import Phaser from 'phaser';
import { BaseScene } from '../core/BaseScene';
import { bigText, ribbonShape, tag, txt, PAL, W, H } from '../core/ui';
import { playMusic, sfx } from '../core/audio';
import { confetti, launchFirework, sparkles } from '../core/fx';
import { state, LEVELS } from '../core/state';
import { CAST, OUTFITS } from '../art/cast';
import { CHAR_TEX_SCALE, type Outfit } from '../art/characters';

// 세로 그라데이션 + 회전하는 빛줄기 + 은은한 도트
function burstBg(scene: Phaser.Scene, top: number, bottom: number, cy = 214) {
  const g = scene.add.graphics().setDepth(-100);
  const A = Phaser.Display.Color.ValueToColor(top), B = Phaser.Display.Color.ValueToColor(bottom);
  for (let y = 0; y < H; y += 4) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(A, B, H, y);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); g.fillRect(0, y, W, 4);
  }
  const rays = scene.add.graphics({ x: W / 2, y: cy }).setDepth(-99);
  for (let i = 0; i < 24; i += 2) {
    const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2;
    rays.fillStyle(0xffffff, 0.1);
    rays.fillTriangle(0, 0, Math.cos(a0) * 700, Math.sin(a0) * 700, Math.cos(a1) * 700, Math.sin(a1) * 700);
  }
  scene.tweens.add({ targets: rays, angle: 360, duration: 40000, repeat: -1 });
  const dots = scene.add.graphics().setDepth(-98);
  dots.fillStyle(0xffffff, 0.12);
  for (let y = 6; y < H; y += 14) for (let x = (y / 14) % 2 ? 13 : 6; x < W; x += 14) dots.fillRect(x, y, 2, 2);
  return g;
}

function ribbon(scene: Phaser.Scene, y: number, label: string, scale = 3) {
  const g = scene.add.graphics({ x: W / 2, y: y + 1 });
  ribbonShape(g, 300 * (scale / 3), 32, 0xe8303a);
  const t = bigText(scene, W / 2, y + 1, label, scale, '#ffe066', '#5a1a00');
  return [g, t];
}

// 레벨 표시 칩
function lvChip(scene: Phaser.Scene, x: number, y: number, lv: number, scale = 2) {
  return tag(scene, x, y, `Lv.${lv}`, { bg: PAL.gold, fg: '#4a2a00', bold: true, depth: 10 }).setScale(scale);
}
function setChip(chip: Phaser.GameObjects.Container, lv: number) {
  (chip.getData('label') as Phaser.GameObjects.Text).setText(`Lv.${lv}`);
}

// 카드 프레임 (레벨 카드)
function card(scene: Phaser.Scene, x: number, y: number, color: number) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x000000, 0.3); g.fillRect(-44, -62, 92, 128);
  g.fillStyle(PAL.ink); g.fillRect(-46, -66, 92, 128);
  g.fillStyle(0xffd23f); g.fillRect(-45, -65, 90, 126);
  g.fillStyle(0xfff0a0); g.fillRect(-45, -65, 90, 2);
  g.fillStyle(0xc98a12); g.fillRect(-45, 58, 90, 3);
  g.fillStyle(PAL.ink); g.fillRect(-40, -60, 80, 116);
  g.fillStyle(color); g.fillRect(-39, -59, 78, 114);
  // 대각선 광택
  g.fillStyle(0xffffff, 0.14);
  for (let i = 0; i < 4; i++) g.fillPoints([{ x: -39 + i * 30, y: -59 }, { x: -27 + i * 30, y: -59 }, { x: -39 + i * 30 - 30, y: 55 }, { x: -39 + i * 30 - 42, y: 55 }].map((p) => ({ x: Math.max(-39, p.x), y: p.y })), true);
  g.fillStyle(0xffffff, 0.3);
  for (let i = 0; i < 6; i++) g.fillRect(-32 + (i * 13) % 60, -50 + i * 17, 3, 3);
  g.fillStyle(0xffffff); [[-44, -64], [40, -64], [-44, 56], [40, 56]].forEach(([a, b]) => g.fillRect(a, b, 4, 4));
  return g;
}

// 제자리 360도 회전 연출 후 의상 변경
async function spinTransform(scene: BaseScene, s: Phaser.GameObjects.Sprite, newOutfit: Outfit, scale: number) {
  const turn = (dur: number) => new Promise<void>((ok) => scene.tweens.add({ targets: s, scaleX: 0, duration: dur, yoyo: true, onYoyo: () => s.setFrame(s.frame.name === 'back0' ? 'idle0' : 'back0'), onComplete: () => ok() }));
  s.anims.stop();
  for (const d of [220, 160, 110, 80, 80]) { await turn(d); sfx.whoosh(); }
  sparkles(scene, s.x, s.y - scale * 22, 30, undefined, 80);
  sfx.sparkle();
  scene.redress(s, CAST.hana, newOutfit, 'cheer');
  s.setScale(scale * CHAR_TEX_SCALE);
  scene.tweens.add({ targets: s, scale: scale * 1.1 * CHAR_TEX_SCALE, yoyo: true, duration: 150 });
}

export class LevelUp extends BaseScene {
  constructor() { super('LevelUp'); }

  async create() {
    playMusic('title');
    const from = state.stage; // 0 → Lv2, 1 → Lv3
    const lvA = LEVELS[from], lvB = LEVELS[from + 1];
    burstBg(this, from === 0 ? 0xff8ad0 : 0x6ad8ff, from === 0 ? 0x8a3ce0 : 0x2f5be0);
    const [rg, rt] = ribbon(this, 46, 'LEVEL UP!');
    [rg, rt].forEach((o) => (o as Phaser.GameObjects.Components.Transform).setScale?.(0));
    const outfits = [OUTFITS.hanaLv1, OUTFITS.hanaLv2, OUTFITS.hanaLv3];
    const hero = this.char('hana', W / 2, 300, { scale: 4, outfit: outfits[from], key: 'lv_hero' });
    this.play(hero, 'idle');
    const chip = lvChip(this, W / 2, 96, lvA.lv);
    const name = bigText(this, W / 2, 326, lvA.title, 3, '#ffffff', '#2a1660');
    await this.reveal();
    sfx.levelup();
    this.tweens.add({ targets: rg, scale: 1, duration: 400, ease: 'Back.Out' });
    this.tweens.add({ targets: rt, scale: 3, duration: 400, ease: 'Back.Out' });
    for (let i = 0; i < 6; i++) {
      const st = this.add.image(W / 2 - 60 + i * 24, 20, 'star').setTint(0xffe066).setScale(0);
      this.tweens.add({ targets: st, scale: 2, delay: 300 + i * 80, duration: 300, ease: 'Back.Out' });
      this.tweens.add({ targets: st, angle: 20, yoyo: true, repeat: -1, duration: 600 + i * 40 });
    }
    // 반짝이 배경
    this.time.addEvent({ delay: 120, loop: true, callback: () => sparkles(this, Phaser.Math.Between(20, W - 20), Phaser.Math.Between(20, H - 20), 2, [0xffffff, 0xffe066], 10) });
    await this.wait(1000);
    // 카드 등장 + 회전 변신
    const c = card(this, W / 2, 214, from === 0 ? 0xe8303a : 0x2fb86a).setDepth(-1).setScale(0);
    await spinTransform(this, hero, outfits[from + 1], 4);
    this.tweens.add({ targets: c, scaleX: 1.55, scaleY: 1.6, duration: 300, ease: 'Back.Out' });
    setChip(chip, lvB.lv);
    name.setText(lvB.title);
    this.tweens.add({ targets: [chip, name], scale: '*=1.3', yoyo: true, duration: 150 });
    confetti(this, 80);
    sfx.levelup();
    state.stage += 1;
    state.xp = 0;
    await this.wait(2600);
    await this.goto('WorldMap', {}, from === 0 ? 'hearts' : 'food');
  }
}

// ---------------- #22~#24 XP 1000 → MAX LEVEL → 명예 한국인 ----------------
export class Finale extends BaseScene {
  constructor() { super('Finale'); }

  async create() {
    playMusic('title');
    // 방사형 빛줄기 배경
    const bg = this.add.graphics().setDepth(-100);
    bg.fillStyle(0x3a1fb0); bg.fillRect(0, 0, W, H);
    const rays = this.add.graphics({ x: W / 2, y: H / 2 }).setDepth(-99);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      rays.fillStyle(i % 2 ? 0x4a2ad0 : 0x5a36e0);
      rays.fillTriangle(0, 0, Math.cos(a) * 600, Math.sin(a) * 600, Math.cos(a + 0.2) * 600, Math.sin(a + 0.2) * 600);
    }
    this.tweens.add({ targets: rays, angle: 360, duration: 30000, repeat: -1 });
    this.time.addEvent({ delay: 450, loop: true, callback: () => launchFirework(this, Phaser.Math.Between(60, W - 60), H, Phaser.Math.Between(40, 140), 1, -50) });

    // 큰 XP 바 (#22)
    const xpBox = this.add.container(W / 2, 150);
    const g = this.add.graphics();
    g.fillStyle(0x15112e); g.fillRect(-150, -14, 300, 28);
    g.fillStyle(0xffc94a); g.fillRect(-148, -12, 296, 24);
    g.fillStyle(0x2a1e5a); g.fillRect(-120, -8, 200, 16);
    g.fillStyle(0x15112e); g.fillCircle(-150, 0, 30);
    g.fillStyle(0xffc94a); g.fillCircle(-150, 0, 27);
    g.fillStyle(0xfff4d6); g.fillCircle(-150, 0, 23);
    const fill = this.add.graphics();
    const portrait = this.char('hana', -150, 72, { scale: 2, outfit: OUTFITS.hanaLv3, key: 'fin_portrait', noShadow: true }).setCrop(26, 16, 44, 44);
    const title = txt(this, -116, -30, 'K-MASTER', { bold: true, stroke: '#2a1660', strokeThickness: 2 }).setScale(1.5);
    const lv = tag(this, -150, 30, 'Lv.3', { bg: PAL.gold, fg: '#4a2a00', depth: 0 });
    const num = txt(this, 86, -6, 'XP\n0/1000', { size: 9, lineSpacing: -3 });
    xpBox.add([g, fill, portrait, title, lv, num]);
    const big = bigText(this, W / 2, 230, '★ XP 1000 ★', 5, '#ffe066', '#7a2d00').setAlpha(0);
    await this.reveal();
    const counter = { v: 0 };
    await new Promise<void>((ok) => this.tweens.add({
      targets: counter, v: 1000, duration: 1600, ease: 'Quad.In',
      onUpdate: () => {
        fill.clear();
        const w = Math.round((counter.v / 1000) * 196);
        for (let x = 0; x < w; x += 17) { fill.fillStyle(0xff6fa8); fill.fillRect(-118 + x, -6, Math.min(15, w - x), 12); fill.fillStyle(0xffffff, 0.4); fill.fillRect(-118 + x, -6, Math.min(15, w - x), 2); }
        num.setText(`XP\n${Math.round(counter.v)}/1000`);
        if (Math.random() < 0.3) sfx.hit();
      },
      onComplete: () => ok(),
    }));
    sfx.levelup();
    big.setAlpha(1).setScale(10);
    this.tweens.add({ targets: big, scale: 5, duration: 450, ease: 'Bounce.Out' });
    this.cameras.main.shake(250, 0.01);
    confetti(this, 100);
    await this.wait(1800);

    // (#23-24) XP 화면이 우측 상단으로 축소되며 MAX LEVEL 화면으로 원씬 전환
    this.tweens.add({ targets: xpBox, x: W - 70, y: 26, scale: 0.32, duration: 700, ease: 'Cubic.InOut' });
    this.tweens.add({ targets: big, alpha: 0, scale: 2, duration: 400 });
    await this.wait(500);
    const [rg, rt] = ribbon(this, 44, 'MAX LEVEL!', 3);
    // 픽셀 왕관
    const crown = this.add.graphics({ x: W / 2, y: 14 });
    crown.fillStyle(PAL.ink); crown.fillPoints([{ x: -15, y: 9 }, { x: -17, y: -9 }, { x: -8, y: -1 }, { x: 0, y: -12 }, { x: 8, y: -1 }, { x: 17, y: -9 }, { x: 15, y: 9 }], true);
    crown.fillStyle(0xffd23f); crown.fillPoints([{ x: -13, y: 7 }, { x: -14, y: -5 }, { x: -7, y: 2 }, { x: 0, y: -8 }, { x: 7, y: 2 }, { x: 14, y: -5 }, { x: 13, y: 7 }], true);
    crown.fillStyle(0xc98a12); crown.fillRect(-13, 4, 26, 3);
    crown.fillStyle(0xe8303a); crown.fillRect(-2, 0, 4, 4);
    crown.fillStyle(0x5aaeff); crown.fillRect(-10, 1, 3, 3); crown.fillRect(7, 1, 3, 3);
    crown.fillStyle(0xffffff); crown.fillRect(-1, -6, 2, 2);
    [rg, rt, crown].forEach((o) => this.tweens.add({ targets: o, y: { from: -60, to: (o as { y: number }).y }, duration: 500, ease: 'Bounce.Out' }));
    const left = this.char('hana', 200, 320, { scale: 3, outfit: OUTFITS.hanaLv3, key: 'fin_left' });
    this.play(left, 'dance');
    lvChip(this, 200, 110, 3);
    bigText(this, 200, 338, 'K-MASTER', 2, '#ffffff', '#2a1660');
    const arrow = txt(this, 320, 230, '▶', { color: '#ffe066', stroke: '#7a2d00', strokeThickness: 2 }).setOrigin(0.5).setScale(3);
    this.tweens.add({ targets: arrow, x: 330, yoyo: true, repeat: -1, duration: 300 });
    const c = card(this, 450, 228, 0xd63be0).setScale(1.3);
    const right = this.char('hana', 450, 300, { scale: 3, outfit: OUTFITS.hanaLv3, key: 'fin_right' });
    await this.wait(900);
    await spinTransform(this, right, OUTFITS.hanaMax, 3);
    right.setFrame('point');
    right.anims.stop();
    state.maxed = true;
    const hk = bigText(this, 450, 338, 'HONORARY KOREAN', 2, '#ffe066', '#7a2d00');
    hk.setScale(0);
    this.tweens.add({ targets: hk, scale: 2, duration: 350, ease: 'Back.Out' });
    this.tweens.add({ targets: c, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 500 });
    confetti(this, 120);
    sfx.levelup();
    // 화면 양쪽 폭죽 콘페티 대포
    for (const x of [30, W - 30]) for (let i = 0; i < 20; i++) {
      const p = this.add.rectangle(x, H - 10, 3, 5, Phaser.Utils.Array.GetRandom([0xff5fa2, 0xffd23f, 0x6ff0ff, 0x7dff8a])).setDepth(700);
      this.tweens.add({ targets: p, x: x + (x < W / 2 ? 1 : -1) * Phaser.Math.Between(40, 200), y: Phaser.Math.Between(40, 200), angle: 360, alpha: 0, duration: 1300, ease: 'Quad.Out', onComplete: () => p.destroy() });
    }
    await this.wait(3000);
    await this.goto('Ending', {}, 'pixel');
  }
}

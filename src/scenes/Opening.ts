// #01~#05-1 오프닝: 비행기 착륙 → 입국장 환호 → 타이틀 → 캐릭터 소개
import Phaser from 'phaser';
import { BaseScene } from '../core/BaseScene';
import { DialogBox, bigText, button, tag, txt, W, H, ZOOM } from '../core/ui';
import { playMusic, sfx } from '../core/audio';
import { director } from '../core/director';
import { sparkles } from '../core/fx';
import { CAST, LINEUP } from '../art/cast';
import { state } from '../core/state';

// 여행 가방 (코드 픽셀)
export function suitcase(scene: Phaser.Scene, x: number, y: number, color: number) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x2a2a3a); g.fillRect(-1, -22, 2, 7); g.fillRect(-4, -23, 8, 2);
  g.fillStyle(0x1a1a26); g.fillRect(-7, -16, 14, 17);
  g.fillStyle(color); g.fillRect(-6, -15, 12, 15);
  g.fillStyle(0xffffff, 0.25); g.fillRect(-6, -15, 12, 2);
  g.fillStyle(0x000000, 0.2); g.fillRect(-2, -13, 1, 12); g.fillRect(2, -13, 1, 12);
  g.fillStyle(0x1a1a26); g.fillRect(-6, 1, 2, 2); g.fillRect(4, 1, 2, 2);
  g.setDepth(y + 1);
  return g;
}

export class Intro extends BaseScene {
  constructor() { super('Intro'); }

  async create() {
    playMusic('title');
    // --- #01 하늘을 나는 비행기 ---
    const sky = this.bg('sky');
    const plane = this.add.image(-160, 120, 'plane', 'plane').setScale(0.5).setAngle(4);
    this.reveal();
    sfx.plane();
    this.tweens.add({ targets: sky, x: -10, duration: 4200 });
    this.tweens.add({ targets: plane, x: W / 2 + 40, y: 190, duration: 2600, ease: 'Sine.Out' });
    this.tweens.add({ targets: plane, y: '+=3', yoyo: true, repeat: -1, duration: 500 });
    await this.wait(2700);
    this.tweens.add({ targets: plane, x: W + 220, y: 290, angle: 8, duration: 1500, ease: 'Quad.In' });
    await this.wait(1200);
    await this.goto('Arrival', {}, 'white');
  }
}

export class Arrival extends BaseScene {
  constructor() { super('Arrival'); }

  async create() {
    this.bg('airport');
    // 창밖으로 착륙하는 비행기
    const plane = this.add.image(170, 96, 'plane', 'plane').setScale(0.11).setAngle(6).setDepth(-50);
    // 안내판 문구
    txt(this, 320, 34, 'WELCOME TO KOREA!', { bold: true, size: 12, color: '#ffffff' }).setOrigin(0.5).setScale(2).setDepth(-40);
    txt(this, 448, 54, 'IMMIGRATION', { size: 10, color: '#c9d2ff' }).setOrigin(1, 0.5).setDepth(-40);
    const vtext = (x: number, s: string) => txt(this, x, 34, s.split('').join('\n'), { size: 10, color: '#4a5aa8', align: 'center', lineSpacing: -2 }).setOrigin(0.5, 0).setDepth(-40);
    vtext(58, 'GOOD♡TRIP');
    vtext(581, 'KOREA♡YOU');
    this.reveal();
    await this.wait(300);
    this.tweens.add({ targets: plane, x: 330, y: 150, angle: 0, duration: 2200, ease: 'Sine.Out' });
    await this.wait(2200);
    sparkles(this, 300, 158, 6, [0xffffff, 0xdfe6ff], 10);
    this.tweens.add({ targets: plane, x: 470, duration: 1500, ease: 'Quad.Out' });

    // --- #02~#04 여행자들이 양쪽에서 뛰어들어와 환호 ---
    const xs = [70, 140, 210, 280, 360, 430, 500, 570];
    const cases = [0x3d6fd6, 0xf08ab0, 0x3a8a5a, 0xc0c0c8, 0x2e3f74, 0xf0e2c0, 0x5a5a66, 0x3a3a4a];
    const crew = LINEUP.map((id, i) => {
      const fromLeft = i < 4;
      const s = this.char(id, fromLeft ? -40 - i * 30 : W + 40 + (7 - i) * 30, 300, { scale: 2 });
      const bag = suitcase(this, s.x, 300, cases[i]).setScale(2);
      return { s, bag, x: xs[i], i };
    });
    await Promise.all(crew.map(async ({ s, bag, x, i }) => {
      await this.wait(i * 60);
      this.tweens.add({ targets: bag, x: x + (i < 4 ? 26 : -26), duration: 1100 });
      await this.walk(s, x, 300, 260);
    }));
    crew.forEach(({ s }, i) => { s.setFlipX(false); this.time.delayedCall(i * 70, () => this.play(s, 'cheer')); this.emote(s, (['!', '♥', '♪', '★'] as const)[i % 4], 200 + i * 120); });
    sfx.levelup();
    sparkles(this, 320, 160, 30, undefined, 200);
    await this.wait(700);
    const d = new DialogBox(this, 170, 308, 300, 40);
    await d.say('대한민국 곳곳의 미션을 수행해 명예 한국인이 되어보세요!', 'Take on quests across Korea, unlock your honorary Korean title!');
    await director.waitInput(this, 1600);
    await d.say('Ready to play?', '', 40);
    // 카메라가 무리 쪽으로 살짝 줌인 (#04)
    this.camZoom(1.15 * ZOOM, 1200, 'Sine.easeInOut');
    await director.waitInput(this, 1200);
    await this.goto('Title', {}, 'crt');
  }
}

export class Title extends BaseScene {
  constructor() { super('Title'); }

  async create() {
    playMusic('title');
    this.bg('title');
    // 로고: 두께감 있는 픽셀 레터링 (아래로 겹겹이 쌓아 입체감)
    const logo = this.add.container(0, 0).setDepth(20);
    const road = bigText(this, 320, 24, 'ROAD TO', 2, '#ffffff', '#3a1f7a');
    const k = bigText(this, 320, 72, 'K-MASTER', 4, '#ff6fb5', '#3a1f7a');
    logo.add([road, k]);
    const heartL = txt(this, 320 - 74, 23, '♥', { color: '#ff5fa2', stroke: '#ffffff', strokeThickness: 2 }).setOrigin(0.5).setScale(2);
    const heartR = txt(this, 320 + 74, 23, '♥', { color: '#ff5fa2', stroke: '#ffffff', strokeThickness: 2 }).setOrigin(0.5).setScale(2);
    logo.add([heartL, heartR]);
    logo.y = -120;
    this.tweens.add({ targets: logo, y: 0, duration: 800, ease: 'Bounce.Out' });
    this.tweens.add({ targets: [heartL, heartR], scale: 2.4, yoyo: true, repeat: -1, duration: 400 });
    // 로고 주변 반짝임
    this.time.addEvent({ delay: 420, loop: true, callback: () => sparkles(this, Phaser.Math.Between(180, 460), Phaser.Math.Between(50, 100), 2, [0xffffff, 0xffe066], 6) });

    // PLAY 버튼
    const btn = button(this, 320, 136, '▶  PLAY', { w: 112, h: 26 }).setDepth(30);
    this.tweens.add({ targets: btn, y: 133, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.InOut' });
    if (!director.auto) {
      const press = txt(this, 320, 160, 'CLICK · TAP · ENTER', { size: 10, color: '#ffffff', stroke: '#2a2346', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: press, alpha: 0.35, yoyo: true, repeat: -1, duration: 600 });
    }

    // 하단 캐릭터 라인업
    LINEUP.forEach((id, i) => {
      const s = this.char(id, 82 + i * 68, 350, { scale: 2 });
      this.time.delayedCall(400 + i * 90, () => this.play(s, 'cheer'));
      this.time.addEvent({ delay: 2600, loop: true, startAt: i * 300, callback: () => this.hop(s, 6) });
    });

    // 픽셀 손가락 커서
    const hand = this.add.graphics({ x: 420, y: 200 }).setDepth(999);
    const HAND = ['..##.....', '.#..#....', '.#..#....', '.#..###..', '.#..#..##', '##..#..#.#', '#.#.....#', '#.......#', '.#......#', '..#....#.', '...####..'];
    HAND.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') { hand.fillStyle(0x1a1a26); hand.fillRect(x * 2, y * 2, 2, 2); } }));
    hand.fillStyle(0xffffff); hand.fillRect(4, 2, 4, 18); hand.fillRect(8, 8, 8, 12); hand.fillRect(2, 12, 6, 6);
    hand.setVisible(director.auto);

    await this.reveal();
    const start = async () => {
      btn.disableInteractive();
      sfx.select();
      this.tweens.add({ targets: btn, scale: 1.3, alpha: 0, duration: 250 });
      await this.wait(300);
      this.goto('CastRoll', {}, 'flash');
    };
    btn.on('pointerdown', start);
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.keyboard?.once('keydown-SPACE', start);
    if (director.auto) {
      await this.wait(1600);
      this.tweens.add({ targets: hand, x: 334, y: 134, duration: 800, ease: 'Sine.InOut' });
      await this.wait(1000);
      this.tweens.add({ targets: hand, scale: 0.85, yoyo: true, duration: 90 });
      await this.wait(200);
      start();
    }
  }
}

// #05-1 등장인물 훑어보기
export class CastRoll extends BaseScene {
  constructor() { super('CastRoll'); }

  async create() {
    this.cameras.main.setBackgroundColor('#2a1f6e');
    const spacing = 150;
    const worldW = 120 + 7 * spacing + 200;
    // 위→아래 그라데이션 + 사선 줄무늬 + 무대 바닥
    const g = this.add.graphics().setDepth(-100);
    const A = Phaser.Display.Color.ValueToColor(0x3b2a9a), B = Phaser.Display.Color.ValueToColor(0x1c1450);
    for (let y = 0; y < H; y += 4) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(A, B, H, y);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); g.fillRect(0, y, worldW, 4);
    }
    g.fillStyle(0xffffff, 0.05);
    for (let x = -H; x < worldW; x += 28) g.fillPoints([{ x, y: 0 }, { x: x + 12, y: 0 }, { x: x + 12 + 250, y: 250 }, { x: x + 250, y: 250 }], true);
    g.fillStyle(0x15103a); g.fillRect(0, 300, worldW, H - 300);
    g.fillStyle(0x4a3ab0); g.fillRect(0, 300, worldW, 2);
    const colors = [0xff6fa5, 0xffa040, 0x5aaeff, 0xb57bff, 0x3fd6bd, 0xff7a7a, 0x7ad04a, 0x7a8aa8];
    const tags = ['CURIOUS', 'FOODIE', 'GAMER', 'DREAMER', 'LEADER', 'ARTIST', 'RUNNER', 'WORKER'];
    LINEUP.forEach((id, i) => {
      const x = 120 + i * spacing;
      // 스포트라이트
      const spot = this.add.graphics({ x, y: 0 }).setDepth(-90);
      spot.fillStyle(0xffffff, 0.07); spot.fillPoints([{ x: -18, y: 0 }, { x: 18, y: 0 }, { x: 62, y: 300 }, { x: -62, y: 300 }], true);
      spot.fillStyle(0xffffff, 0.12); spot.fillEllipse(0, 302, 124, 18);
      this.tweens.add({ targets: spot, alpha: 0.6, yoyo: true, repeat: -1, duration: 900 + i * 70 });
      const s = this.char(id, x, 300, { scale: 4 });
      this.play(s, i % 2 ? 'wave' : 'idle');
      this.time.delayedCall(600 + i * 700, () => { this.hop(s, 10); this.emote(s, (['♪', '♥', '!', '★'] as const)[i % 4]); });
      tag(this, x - 34, 50, tags[i], { bg: colors[i], ox: 0, depth: 5 });
      txt(this, x - 34, 64, CAST[id].name, { bold: true, color: '#ffffff', stroke: '#2a2346', strokeThickness: 2 }).setScale(2).setDepth(5);
      if (id === 'hana') {
        const you = tag(this, x - 34, 98, '1P ▶ YOU', { bg: 0x2a2346, fg: '#7cf0ff', ox: 0, depth: 5 });
        this.tweens.add({ targets: you, alpha: 0.4, yoyo: true, repeat: -1, duration: 450 });
      }
    });
    this.cameras.main.setBounds(0, 0, worldW, H);
    await this.reveal();
    this.camPan(120 + 7 * spacing - 200, H / 2, 6000);
    await this.wait(6200);
    const hero = 120 + 4 * spacing;
    this.camPan(hero, H / 2, 900);
    await this.wait(1000);
    sfx.select();
    bigText(this, hero, 50, 'START!', 3, '#ffe066', '#7a2d00').setScrollFactor(1);
    await this.wait(900);
    state.reset();
    await this.goto('WorldMap', {}, 'flash');
  }
}

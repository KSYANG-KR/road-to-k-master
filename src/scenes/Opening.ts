// #01~#05-1 오프닝: 비행기 착륙 → 입국장 환호 → 타이틀 → 캐릭터 소개
import Phaser from 'phaser';
import { BaseScene } from '../core/BaseScene';
import { DialogBox, bigText, button, tag, txt, PAL, TYPE, W, H, ZOOM } from '../core/ui';
import { playMusic, sfx } from '../core/audio';
import { director } from '../core/director';
import { sparkles } from '../core/fx';
import { CAST, LINEUP, PROFILE, setHero } from '../art/cast';
import { state } from '../core/state';
import { suitcaseTex } from '../art/props';
import { pixText } from '../art/pixeltext';
import { planeTex } from '../art/props';

// 여행 가방 (코드 픽셀)
export function suitcase(scene: Phaser.Scene, x: number, y: number, color: number) {
  return scene.add.image(x, y + 2, suitcaseTex(scene, color)).setOrigin(0.5, 1).setDepth(y + 1);
}

export class Intro extends BaseScene {
  constructor() { super('Intro'); }

  async create() {
    playMusic('title');
    // --- #01 하늘을 나는 비행기 ---
    const sky = this.bg('sky');
    const plane = this.add.image(-160, 120, planeTex(this)).setScale(0.5).setAngle(4);
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
    // 안내판 (면: x 186~452, y 26~62 → 중심 319, 44) — 배경 도트와 같은 크기의 픽셀 글자로 그려 넣음
    pixText(this, 319, 44, [
      { t: 'WELCOME TO KOREA', font: 'g14', color: '#f4f8ff', spacing: 1, bold: true },
      { t: '대한민국에 오신 것을 환영합니다', font: 'g11', color: '#8fb8ff' },
    ], { gap: 5, shadow: '#0a1d48', depth: -40 });
    // 세로 배너 (면: 폭 38, y 26~151): 한글 세로쓰기 + 영문 세로 쌓기
    const banner = (x: number, ko: string, en: string) => pixText(this, x, 89, [
      { t: ko, font: 'g11b', color: '#2c3c88', vertical: true, vgap: 2 },
      { t: '♥', font: 'g9', color: '#ff6b8a' },
      { t: en, font: 'g7', color: '#6c7bc0', vertical: true, vgap: 0 },
    ], { gap: 5, depth: -40 });
    banner(60, '환영해요', 'WELCOME');
    banner(581, '즐거운여행', 'ENJOY');
    this.reveal();
    await this.wait(600);

    // --- #02~#04 여행자들이 양쪽에서 뛰어들어와 환호 ---
    // 콘티 공항 컷처럼 9명이 각자 색 캐리어를 끌고 들어온다
    const N = LINEUP.length, half = Math.ceil(N / 2);
    const xs = LINEUP.map((_, i) => Math.round(W / 2 + (i - (N - 1) / 2) * 68));
    const cases = [0x3d6fd6, 0xf08ab0, 0x3a8a5a, 0xc0c0c8, 0x2e3f74, 0xf0e2c0, 0x5a5a66, 0x3a3a4a];
    const crew = LINEUP.map((id, i) => {
      const fromLeft = i < half;
      const s = this.char(id, fromLeft ? -40 - i * 30 : W + 40 + (N - 1 - i) * 30, 300, { scale: 2 });
      const bag = suitcase(this, s.x, 300, cases[i]);
      return { s, bag, x: xs[i], i };
    });
    await Promise.all(crew.map(async ({ s, bag, x, i }) => {
      await this.wait(i * 60);
      this.tweens.add({ targets: bag, x: x + (i < half ? 24 : -24), duration: 1100 });
      await this.walk(s, x, 300, 260);
    }));
    crew.forEach(({ s }, i) => { s.setFlipX(false); this.time.delayedCall(i * 70, () => this.play(s, 'cheer')); this.emote(s, (['!', '♥', '♪', '★'] as const)[i % 4], 200 + i * 120); });
    sfx.levelup();
    sparkles(this, 320, 160, 30, undefined, 200);
    await this.wait(700);
    const d = new DialogBox(this, 110, 306, 420, 40);
    d.bottom = H - 8;
    await d.say('한국 곳곳에서 미션을 해내고 명예 한국인이 되어 보세요!', 'Complete missions across Korea and become an honorary Korean.');
    await director.waitInput(this, 1600);
    await d.say('준비됐나요? 출발해요!', "Ready? Let's go!", 40);
    await director.waitInput(this, 1200);
    // 대화창을 걷고 카메라가 무리 쪽으로 살짝 줌인 (#04) — 줌인하면 화면 아래 대화창이 잘리므로 먼저 숨김
    this.tweens.add({ targets: d, alpha: 0, duration: 200 });
    this.camZoom(1.15 * ZOOM, 1000, 'Sine.easeInOut');
    await this.wait(1100);
    await this.goto('Title', {}, 'crt');
  }
}

export class Title extends BaseScene {
  constructor() { super('Title'); }

  async create() {
    playMusic('title');
    setHero(new URLSearchParams(location.search).get('hero') ?? 'mei');
    this.bg('title');
    // 로고 가독성을 위한 상단 그라데이션
    const shadeTop = this.add.graphics().setDepth(5);
    for (let y = 0; y < 180; y += 3) { shadeTop.fillStyle(0x0b0f24, 0.72 * (1 - y / 190)); shadeTop.fillRect(0, y, W, 3); }
    // 로고: 자간 넓힌 소제목 + 흰 레터링 + 코랄 하드 섀도
    const logo = this.add.container(0, 0).setDepth(20);
    const road = txt(this, 320, 18, 'ROAD TO', { bold: true, color: '#ffffff', spacing: 6 }).setOrigin(0.5, 0);
    const deco = this.add.graphics();
    deco.fillStyle(PAL.acc); deco.fillRect(320 - 80, 24, 24, 1); deco.fillRect(320 + 56, 24, 24, 1);
    const k = bigText(this, 320, 70, 'K-MASTER', 4, '#ffffff', '#151a33', '#c94466');
    const sub = tag(this, 320, 118, '명예 한국인이 되어 보세요   ·   Become an honorary Korean', { depth: 0, fg: '#e6eaff' });
    logo.add([road, deco, k, sub]);
    logo.setAlpha(0).setY(-10);
    this.tweens.add({ targets: logo, alpha: 1, y: 0, duration: 700, ease: 'Quad.Out' });

    // PLAY 버튼
    const btn = button(this, 320, 156, 'PLAY', { w: 124, h: 38, sub: '게임 시작' }).setDepth(30);
    if (!director.auto) {
      const press = tag(this, 320, 192, 'ENTER  ·  CLICK  ·  TAP', { depth: 30, size: 9 });
      this.tweens.add({ targets: press, alpha: 0.4, yoyo: true, repeat: -1, duration: 700 });
    }

    // 하단 캐릭터 라인업
    LINEUP.forEach((id, i) => {
      const s = this.char(id, Math.round(W / 2 + (i - (LINEUP.length - 1) / 2) * 72), 350, { scale: 2 });
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
      this.tweens.add({ targets: hand, x: 334, y: 152, duration: 800, ease: 'Sine.InOut' });
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
    const worldW = 120 + (LINEUP.length - 1) * spacing + 200;
    // 위→아래 그라데이션 + 사선 줄무늬 + 무대 바닥
    const g = this.add.graphics().setDepth(-100);
    const A = Phaser.Display.Color.ValueToColor(0x232a5e), B = Phaser.Display.Color.ValueToColor(0x0b0f24);
    for (let y = 0; y < H; y += 4) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(A, B, H, y);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); g.fillRect(0, y, worldW, 4);
    }
    g.fillStyle(0xffffff, 0.05);
    for (let x = -H; x < worldW; x += 28) g.fillPoints([{ x, y: 0 }, { x: x + 12, y: 0 }, { x: x + 12 + 250, y: 250 }, { x: x + 250, y: 250 }], true);
    g.fillStyle(0x080b1c); g.fillRect(0, 300, worldW, H - 300);
    g.fillStyle(PAL.line); g.fillRect(0, 300, worldW, 1);
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
      // 역할(영/한) → 이름 순으로 가운데 정렬. 카메라가 가로로 흐르므로 화면 가장자리 고정(clamp)은 끈다
      tag(this, x, 46, `${PROFILE[id].role[0]}  ·  ${PROFILE[id].role[1]}`, { bg: PAL.acc, depth: 5, clamp: false, bold: true });
      txt(this, x, 58, CAST[id].name, { px: 22, weight: 900, color: '#ffffff', spacing: 1 }).setOrigin(0.5, 0).setDepth(5);
    });
    this.cameras.main.setBounds(0, 0, worldW, H);
    await this.reveal();
    this.camPan(120 + (LINEUP.length - 1) * spacing - 200, H / 2, 6600);
    await this.wait(7000);
    await this.goto('CharSelect', {}, 'fade');
  }
}

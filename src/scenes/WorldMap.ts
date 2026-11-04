// #06 / #12 / #17 스테이지 맵: 관광지도 → 한강 도시 → 쇼핑몰 단면
import Phaser from 'phaser';
import { BaseScene } from '../core/BaseScene';
import { state, STAGES } from '../core/state';
import { playMusic, sfx } from '../core/audio';
import { director } from '../core/director';
import { stageBanner, tag, txt, panel, COL, PAL, ACC, SUB, W } from '../core/ui';
import { sparkles } from '../core/fx';

type Pt = [number, number];
interface NodeDef { key: string; at: Pt; tag: Pt; path?: Pt[] } // path: 이전 노드에서 오는 경유점

const MAPS: { bg: string; music: string; start: Pt; nodes: NodeDef[]; elevator?: boolean }[] = [
  {
    bg: 'map1', music: 'stage1', start: [92, 316],
    nodes: [
      { key: 'hanok', at: [178, 316], tag: [130, 250] },
      { key: 'jjimjil', at: [180, 117], tag: [96, 132], path: [[120, 290], [80, 220], [120, 150]] },
      { key: 'temple', at: [400, 210], tag: [430, 178], path: [[230, 140], [270, 200], [330, 214]] },
      { key: 'palace', at: [500, 318], tag: [560, 240], path: [[420, 250], [440, 300]] },
      { key: 'park', at: [467, 103], tag: [520, 120], path: [[560, 290], [550, 180], [520, 110]] },
    ],
  },
  {
    bg: 'map2', music: 'stage2', start: [150, 340],
    nodes: [
      { key: 'pcbang', at: [80, 208], tag: [40, 228], path: [[120, 260]] },
      { key: 'hangang', at: [330, 214], tag: [300, 236], path: [[160, 230], [250, 170], [300, 190]] },
      { key: 'cvs', at: [470, 300], tag: [510, 330], path: [[380, 270], [430, 290]] },
    ],
  },
  {
    bg: 'map3', music: 'stage3', start: [90, 338], elevator: true,
    nodes: [
      { key: 'hansik', at: [300, 338], tag: [580, 300] },
      { key: 'salon', at: [300, 262], tag: [580, 226] },
      { key: 'photo', at: [300, 188], tag: [580, 152] },
      { key: 'dance', at: [300, 112], tag: [580, 78] },
    ],
  },
];

export class WorldMap extends BaseScene {
  hero!: Phaser.GameObjects.Sprite;
  constructor() { super('WorldMap'); }

  async create() {
    this.entering = false;
    const map = MAPS[state.stage];
    playMusic(map.music);
    this.bg(map.bg);
    const stage = STAGES[state.stage];
    const next = state.nextMission();

    // 경로 점선
    const route = this.add.graphics().setDepth(1);
    let prev: Pt = map.start;
    map.nodes.forEach((n) => {
      const pts = [prev, ...(n.path ?? []), n.at];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const d = Math.hypot(x1 - x0, y1 - y0);
        for (let s = 0; s < d; s += 7) {
          const x = x0 + ((x1 - x0) * s) / d, y = y0 + ((y1 - y0) * s) / d;
          route.fillStyle(0x1a1430, 0.45); route.fillRect(Math.round(x) - 1, Math.round(y), 4, 3);
          route.fillStyle(0xffffff, 1); route.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
        }
      }
      prev = n.at;
    });

    // 노드와 장소 태그
    map.nodes.forEach((n, i) => {
      const m = stage[i];
      const done = state.cleared.has(m.key);
      const isNext = next?.key === m.key;
      const [nx, ny] = n.at;
      const g = this.add.graphics({ x: nx, y: ny }).setDepth(2);
      // 바닥 그림자 + 동그란 스테이지 핀
      g.fillStyle(0x000000, 0.3); g.fillEllipse(1, 3, 18, 8);
      g.fillStyle(PAL.edge); g.fillCircle(0, 0, 7);
      g.fillStyle(done ? PAL.mint : isNext ? PAL.acc : 0x8a90b0); g.fillCircle(0, 0, 6);
      g.fillStyle(0xffffff, 0.5); g.fillRect(-3, -4, 3, 1);
      if (done) { g.fillStyle(PAL.edge); g.fillRect(-3, 0, 2, 2); g.fillRect(-1, 2, 2, 2); g.fillRect(1, 0, 2, 2); g.fillRect(3, -2, 2, 2); }
      if (isNext) {
        // 다음 목적지: 퍼지는 링 + 통통 튀는 화살표
        const ring = this.add.circle(nx, ny, 7).setStrokeStyle(2, 0xffffff).setDepth(2);
        this.tweens.add({ targets: ring, scale: 2.4, alpha: 0, repeat: -1, duration: 900, ease: 'Quad.Out' });
        const arrow = this.add.graphics({ x: nx, y: ny - 14 }).setDepth(4);
        arrow.fillStyle(PAL.edge); arrow.fillTriangle(-6, -6, 6, -6, 0, 2);
        arrow.fillStyle(0xffffff); arrow.fillTriangle(-4, -5, 4, -5, 0, 0);
        this.tweens.add({ targets: arrow, y: ny - 19, yoyo: true, repeat: -1, duration: 320, ease: 'Sine.InOut' });
      }
      // 장소 태그
      const t = this.placeCard(n.tag[0], n.tag[1], `${state.stage + 1}-${i + 1}`, m.label, m.en, done ? 'done' : isNext ? 'next' : 'lock');
      const hit = this.add.zone(nx, ny, 40, 40).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { if (isNext && !director.auto) this.enter(i); });
      t.on('pointerdown', () => { if (isNext && !director.auto) this.enter(i); });
    });

    // 엘리베이터 (스테이지3) + 건물 간판
    if (map.elevator) {
      txt(this, 312, 15.5, 'K-STYLE MALL', { px: 10, weight: 900, color: '#2a2f6a', spacing: 1.5 }).setOrigin(0.5).setDepth(2);
      txt(this, 312, 26, '케이 스타일 몰', { px: 6.5, weight: 700, color: '#c94466', spacing: 1 }).setOrigin(0.5).setDepth(2);
      this.elevatorCar = this.add.graphics().setDepth(5);
      this.drawElevator(this.floorY(Math.max(0, this.currentFloor() - 1)));
    }

    // 주인공 위치: 마지막으로 깬 노드 또는 시작점
    const lastIdx = stage.reduce((a, m, i) => (state.cleared.has(m.key) ? i : a), -1);
    const at = lastIdx >= 0 ? map.nodes[lastIdx].at : map.start;
    this.hero = this.char('hana', at[0], at[1], { outfit: state.heroOutfit, key: `map_hero_${state.stage}_${state.maxed}` });
    this.hero.setDepth(10);
    this.addHud();

    await this.reveal();
    // 스테이지 첫 진입 시 타이틀 박스 (#06/#12/#17)
    if (lastIdx < 0) {
      const banner = stageBanner(this, state.stage + 1);
      sfx.levelup();
      await director.waitInput(this, 2200);
      this.tweens.add({ targets: banner, alpha: 0, scale: 0.8, duration: 250, onComplete: () => banner.destroy() });
    }
    if (!director.auto && next) tag(this, W / 2, 350, 'Click the glowing spot or press ENTER  ·  빛나는 장소를 클릭하거나 ENTER', { bg: PAL.ink, fg: '#ffffff', oy: 1, depth: 20, pop: true });
    const idx = next ? stage.indexOf(next) : -1;
    if (idx < 0) return;
    const go = () => this.enter(idx);
    this.input.keyboard?.once('keydown-ENTER', go);
    this.input.keyboard?.once('keydown-SPACE', go);
    if (director.auto) { await this.wait(500); go(); }
  }

  // 장소 카드: 번호 칩 + 한글 이름 + 영문 이름
  placeCard(x: number, y: number, num: string, ko: string, en: string, st: 'done' | 'next' | 'lock') {
    const c = this.add.container(0, 0).setDepth(3);
    const t1 = txt(this, 0, 0, ko, { bold: true, color: st === 'lock' ? '#d6daf0' : '#ffffff' });
    const t2 = txt(this, 0, 0, en, { size: 10, color: st === 'next' ? ACC : st === 'done' ? '#7ef0c4' : SUB });
    const chipW = 22;
    const w = Math.ceil(Math.max(t1.width, t2.width)) + chipW + 16, h = 32;
    const left = Phaser.Math.Clamp(Math.round(x - w / 2), 4, W - 4 - w), top = Math.round(y - h / 2);
    const g = this.add.graphics();
    panel(g, left, top, w, h);
    const chipC = st === 'done' ? PAL.mint : st === 'next' ? PAL.acc : PAL.line;
    g.fillStyle(chipC); g.fillRect(left + 4, top + 4, chipW, h - 8);
    const nt = txt(this, left + 4 + chipW / 2, top + h / 2, num, { size: 10, color: st === 'lock' ? '#d6daf0' : '#0b0f24' }).setOrigin(0.5);
    t1.setPosition(left + chipW + 10, top + 4);
    t2.setPosition(left + chipW + 10, top + 18);
    c.add([g, nt, t1, t2]);
    c.setSize(w, h);
    if (st === 'next') {
      const glow = this.add.graphics();
      glow.lineStyle(1, PAL.acc, 1); glow.strokeRect(left - 1, top - 1, w + 2, h + 2);
      c.addAt(glow, 0);
      this.tweens.add({ targets: glow, alpha: 0.2, yoyo: true, repeat: -1, duration: 600 });
    }
    c.setInteractive(new Phaser.Geom.Rectangle(left, top, w, h), Phaser.Geom.Rectangle.Contains);
    return c;
  }

  elevatorCar?: Phaser.GameObjects.Graphics;
  floorY(f: number) { return [338, 262, 188, 112][f]; }
  currentFloor() { return Math.max(0, STAGES[2].filter((m) => state.cleared.has(m.key)).length); }

  drawElevator(y: number) {
    const g = this.elevatorCar!;
    g.clear();
    g.fillStyle(0x1a1430); g.fillRect(123, y - 34, 34, 36);
    g.fillStyle(0xe8e2ff); g.fillRect(125, y - 32, 30, 32);
    g.fillStyle(0xb8b0e0); g.fillRect(139, y - 32, 2, 32);
    g.fillStyle(0xffd23f); g.fillRect(125, y - 32, 30, 2);
    g.setData('y', y);
  }

  entering = false;
  async enter(i: number) {
    if (this.entering) return;
    this.entering = true;
    const map = MAPS[state.stage];
    const n = map.nodes[i];
    sfx.select();
    if (map.elevator) {
      // 엘리베이터로 이동 → 해당 층에서 내림
      const fy = this.floorY(i);
      const curY = this.hero.y;
      await this.walk(this.hero, 140, curY, 90);
      this.hero.setDepth(6);
      const car = { y: curY };
      await new Promise<void>((ok) => this.tweens.add({
        targets: car, y: fy, duration: Math.max(300, Math.abs(curY - fy) * 8), ease: 'Sine.InOut',
        onUpdate: () => { this.drawElevator(car.y); this.hero.y = car.y; },
        onComplete: () => ok(),
      }));
      sfx.bell();
      this.hero.setDepth(10);
      await this.walk(this.hero, n.at[0], fy, 90);
    } else {
      const pts = [...(n.path ?? []), n.at];
      for (const [x, y] of pts) await this.walk(this.hero, x, y, 110);
    }
    sparkles(this, n.at[0], n.at[1] - 20, 16);
    this.emote(this.hero, '!');
    this.hop(this.hero, 8);
    this.play(this.hero, 'cheer');
    await this.wait(500);
    const m = STAGES[state.stage][i];
    await this.goto(m.scene, m.data ?? {}, 'fade');
  }
}

export { COL };

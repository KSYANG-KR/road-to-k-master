// #06 / #12 / #17 스테이지 맵: 관광 섬 지도 → 한강 공원 → K-스타일 몰 단면
import Phaser from 'phaser';
import { BaseScene } from '../core/BaseScene';
import { state, STAGES } from '../core/state';
import { playMusic, sfx } from '../core/audio';
import { director } from '../core/director';
import { stageBanner, tag, txt, panel, rrect, COL, PAL, ACC, SUB, TYPE, W } from '../core/ui';
import { sparkles } from '../core/fx';

type Pt = [number, number];
// at: 길 그래프의 지점 이름, tag: 장소 카드 위치, area: 건물 그림 영역(클릭)
interface NodeDef { key: string; at: string; tag: Pt; area: [number, number, number, number] }
interface MapDef { bg: string; music: string; start: string; pts: Record<string, Pt>; edges: string; nodes: NodeDef[]; elevator?: boolean }

// 지도 그림의 실제 길(모래색 길·다리) 위 지점과 연결. 주인공은 이 길만 따라 걷는다.
const MAPS: MapDef[] = [
  {
    // #06 관광 섬 지도: 가운데 나무 단상에서 다섯 갈래 길
    bg: 'map1', music: 'stage1', start: 'H',
    pts: {
      H: [312, 183], W1: [284, 168], W2: [248, 161], B1: [214, 163], B0: [192, 164], HANOK: [192, 143], J1: [174, 186], JJ: [152, 208],
      S1: [298, 199], S2: [258, 219], S3: [224, 243], S4: [209, 280], S5: [220, 316], S6: [258, 330], TB: [296, 330], TEMPLE: [296, 308],
      R1: [330, 201], R2: [362, 230], R3: [380, 275], R4: [372, 316], R5: [336, 330],
      N1: [334, 166], N2: [366, 150], N3: [398, 146], PK1: [416, 134], PARK: [430, 122], P1: [410, 160], P2: [424, 182], PALACE: [438, 204],
    },
    edges: 'H-W1 W1-W2 W2-B1 B1-B0 B0-HANOK B0-J1 J1-JJ H-S1 S1-S2 S2-S3 S3-S4 S4-S5 S5-S6 S6-TB TB-TEMPLE H-R1 R1-R2 R2-R3 R3-R4 R4-R5 R5-TB H-N1 N1-N2 N2-N3 N3-PK1 PK1-PARK N3-P1 P1-P2 P2-PALACE',
    nodes: [
      { key: 'hanok', at: 'HANOK', tag: [190, 40], area: [115, 55, 160, 95] },
      { key: 'jjimjil', at: 'JJ', tag: [70, 160], area: [45, 165, 145, 135] },
      { key: 'temple', at: 'TEMPLE', tag: [296, 222], area: [225, 228, 150, 88] },
      { key: 'palace', at: 'PALACE', tag: [520, 166], area: [395, 180, 235, 170] },
      { key: 'park', at: 'PARK', tag: [566, 104], area: [350, 35, 155, 95] },
    ],
  },
  {
    // #12 한강 공원: 아래에서 올라와 PC방 · 분수(러닝 트랙) · 편의점으로 갈라지는 길
    bg: 'map2', music: 'stage2', start: 'START',
    pts: {
      START: [318, 352], J: [318, 302], PC1: [262, 300], PCBANG: [218, 304], CV1: [370, 300], CVS: [398, 304],
      U1: [318, 258], F1: [276, 234], F2: [278, 204], T1: [318, 192], HANGANG: [318, 180],
    },
    edges: 'START-J J-PC1 PC1-PCBANG J-CV1 CV1-CVS J-U1 U1-F1 F1-F2 F2-T1 T1-HANGANG',
    nodes: [
      { key: 'pcbang', at: 'PCBANG', tag: [140, 212], area: [60, 225, 165, 120] },
      { key: 'hangang', at: 'HANGANG', tag: [196, 118], area: [255, 30, 130, 185] },
      { key: 'cvs', at: 'CVS', tag: [492, 212], area: [385, 228, 200, 120] },
    ],
  },
  {
    // #17 K-스타일 몰 단면: 왼쪽 엘리베이터로 층 이동 (1F 한식 · 2F 미용 · 3F 포토 · 4F 댄스)
    bg: 'map3', music: 'stage3', start: 'START', elevator: true,
    pts: { START: [34, 352], HANSIK: [250, 341], SALON: [175, 251], PHOTO: [398, 175], DANCE: [150, 103] },
    edges: '',
    nodes: [
      { key: 'hansik', at: 'HANSIK', tag: [0, 0], area: [100, 262, 470, 84] },
      { key: 'salon', at: 'SALON', tag: [0, 0], area: [100, 182, 470, 76] },
      { key: 'photo', at: 'PHOTO', tag: [0, 0], area: [100, 110, 470, 70] },
      { key: 'dance', at: 'DANCE', tag: [0, 0], area: [100, 30, 470, 78] },
    ],
  },
];

// 몰 오른쪽 세로 간판(한식·미용·포토·댄스) 영역: 1F → 4F
const SIGNS: [number, number, number, number][] = [[576, 267, 30, 64], [576, 189, 30, 57], [576, 117, 30, 57], [576, 34, 30, 65]];
const CAR_X = 70; // 엘리베이터 통로 가운데

// 길 그래프 최단 경로 (지점 이름 목록)
function route(m: MapDef, from: string, to: string): string[] {
  const adj: Record<string, string[]> = {};
  m.edges.split(' ').filter(Boolean).forEach((e) => {
    const [a, b] = e.split('-');
    (adj[a] ??= []).push(b);
    (adj[b] ??= []).push(a);
  });
  const d = (a: string, b: string) => Math.hypot(m.pts[a][0] - m.pts[b][0], m.pts[a][1] - m.pts[b][1]);
  const dist: Record<string, number> = { [from]: 0 };
  const prev: Record<string, string> = {};
  const open = new Set([from]);
  while (open.size) {
    let u = '';
    open.forEach((k) => { if (!u || dist[k] < dist[u]) u = k; });
    open.delete(u);
    if (u === to) break;
    for (const v of adj[u] ?? []) {
      const nd = dist[u] + d(u, v);
      if (dist[v] === undefined || nd < dist[v]) { dist[v] = nd; prev[v] = u; open.add(v); }
    }
  }
  if (dist[to] === undefined) return [from, to];
  const out = [to];
  while (out[0] !== from) out.unshift(prev[out[0]]);
  return out;
}

export class WorldMap extends BaseScene {
  hero!: Phaser.GameObjects.Sprite;
  cur = '';
  routeG?: Phaser.GameObjects.Graphics;
  constructor() { super('WorldMap'); }

  async create() {
    this.entering = false;
    const map = MAPS[state.stage];
    playMusic(map.music);
    this.bg(map.bg);
    const stage = STAGES[state.stage];
    const next = state.nextMission();
    const lastIdx = stage.reduce((a, m, i) => (state.cleared.has(m.key) ? i : a), -1);
    this.cur = lastIdx >= 0 ? map.nodes[lastIdx].at : map.start;

    // 노드(핀)와 장소 표시
    map.nodes.forEach((n, i) => {
      const m = stage[i];
      const done = state.cleared.has(m.key);
      const isNext = next?.key === m.key;
      const st = done ? 'done' : isNext ? 'next' : 'lock';
      const [nx, ny] = map.pts[n.at];
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
      // 장소 카드 (몰은 층별 세로 간판을 카드로 사용)
      const t = map.elevator
        ? this.floorSign(i, map.pts[n.at][1], m.en, st)
        : this.placeCard(n.tag[0], n.tag[1], `${state.stage + 1}-${i + 1}`, m.label, m.en, st);
      // 건물 그림·핀·장소 카드 어디를 눌러도 반응
      const [ax, ay, aw, ah] = n.area;
      const zones = [this.add.zone(ax, ay, aw, ah).setOrigin(0), this.add.zone(nx, ny, 40, 40)];
      zones.forEach((z) => z.setDepth(1.5).setInteractive({ useHandCursor: true }));
      t.input!.cursor = 'pointer';
      const tap = () => this.tapPlace(i, st, t);
      [...zones, t].forEach((o) => {
        o.on('pointerdown', tap);
        o.on('pointerover', () => this.tweens.add({ targets: t, scale: 1.04, duration: 100 }));
        o.on('pointerout', () => this.tweens.add({ targets: t, scale: 1, duration: 100 }));
      });
    });

    // 엘리베이터 (스테이지3)
    const at = map.pts[this.cur];
    if (map.elevator) {
      this.elevatorCar = this.add.graphics().setDepth(5);
      this.drawElevator(Math.min(343, at[1]));
    }

    // 주인공: 마지막으로 깬 장소 또는 시작점
    this.hero = this.char('hana', at[0], at[1], { outfit: state.heroOutfit, key: `map_hero_${state.stage}_${state.maxed}` });
    this.hero.setDepth(10);
    this.addHud();

    // 다음 장소까지 실제 길을 따라 점선 안내
    const idx = next ? stage.indexOf(next) : -1;
    if (idx >= 0 && !map.elevator) this.drawRoute(route(map, this.cur, map.nodes[idx].at).map((k) => map.pts[k]));

    await this.reveal();
    // 스테이지 첫 진입 시 타이틀 박스 (#06/#12/#17)
    if (lastIdx < 0) {
      const banner = stageBanner(this, state.stage + 1);
      sfx.levelup();
      await director.waitInput(this, 2200);
      this.tweens.add({ targets: banner, alpha: 0, scale: 0.8, duration: 250, onComplete: () => banner.destroy() });
    }
    if (!director.auto && next) tag(this, 8, 8, '빛나는 장소를 누르거나 ENTER  ·  Tap the glowing place or press ENTER', { bg: PAL.ink, fg: '#ffffff', ox: 0, oy: 0, depth: 20, pop: true });
    if (idx < 0) return;
    const go = () => this.enter(idx);
    this.input.keyboard?.once('keydown-ENTER', go);
    this.input.keyboard?.once('keydown-SPACE', go);
    if (director.auto) { await this.wait(500); go(); }
  }

  // 길 안내 점선
  drawRoute(pts: Pt[]) {
    const g = (this.routeG = this.add.graphics().setDepth(1));
    let carry = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const d = Math.hypot(x1 - x0, y1 - y0);
      let s = carry;
      for (; s < d; s += 7) {
        const x = x0 + ((x1 - x0) * s) / d, y = y0 + ((y1 - y0) * s) / d;
        g.fillStyle(0x1a1430, 0.45); g.fillRect(Math.round(x) - 1, Math.round(y), 4, 3);
        g.fillStyle(0xffffff, 1); g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      }
      carry = s - d;
    }
    this.tweens.add({ targets: g, alpha: 0.55, yoyo: true, repeat: -1, duration: 700 });
  }

  // 장소 카드: 번호 칩 + 한글 이름 + 영문 이름
  placeCard(x: number, y: number, num: string, ko: string, en: string, st: 'done' | 'next' | 'lock') {
    const c = this.add.container(0, 0).setDepth(3);
    const t1 = txt(this, 0, 0, ko, { px: TYPE.body + 0.5, weight: 700, color: st === 'lock' ? '#d6daf0' : '#ffffff' });
    const t2 = txt(this, 0, 0, en, { px: TYPE.small, weight: 600, color: st === 'next' ? ACC : st === 'done' ? '#7ef0c4' : SUB });
    const chipW = 22;
    const w = Math.ceil(Math.max(t1.width, t2.width)) + chipW + 16, h = 32;
    const left = Phaser.Math.Clamp(Math.round(x - w / 2), 4, W - 4 - w), top = Math.round(y - h / 2);
    const g = this.add.graphics();
    panel(g, left, top, w, h);
    const chipC = st === 'done' ? PAL.mint : st === 'next' ? PAL.acc : PAL.line;
    g.fillStyle(chipC); rrect(g, left + 4, top + 4, chipW, h - 8, 4);
    const nt = txt(this, left + 4 + chipW / 2, top + h / 2, num, { px: TYPE.small, weight: 800, color: st === 'lock' ? '#d6daf0' : '#0b0f24' }).setOrigin(0.5);
    t1.setPosition(left + chipW + 10, top + 4);
    t2.setPosition(left + chipW + 10, top + 18);
    c.add([g, nt, t1, t2]);
    c.setSize(w, h);
    if (st === 'next') {
      const glow = this.add.graphics();
      glow.lineStyle(1.25, PAL.acc, 1); glow.strokeRoundedRect(left - 1.5, top - 1.5, w + 3, h + 3, 6);
      c.addAt(glow, 0);
      this.tweens.add({ targets: glow, alpha: 0.2, yoyo: true, repeat: -1, duration: 600 });
    }
    c.setInteractive(new Phaser.Geom.Rectangle(left, top, w, h), Phaser.Geom.Rectangle.Contains);
    return c;
  }

  // 몰 층 간판: 그림 속 세로 간판(한글)을 그대로 쓰고, 번호 칩 + 영문 이름 + 상태만 덧입힘
  floorSign(i: number, floorY: number, en: string, st: 'done' | 'next' | 'lock') {
    const [sx, sy, sw, sh] = SIGNS[i];
    const c = this.add.container(0, 0).setDepth(3);
    const g = this.add.graphics();
    if (st === 'lock') { g.fillStyle(0x1a1430, 0.42); rrect(g, sx, sy, sw, sh, 3); }
    // 간판 왼쪽 라벨: 번호 + 영문 (한글은 간판에 이미 있음)
    const num = `${state.stage + 1}-${i + 1}`;
    const t = txt(this, 0, 0, `${num}  ${en}`, { px: TYPE.small, weight: 800, color: st === 'next' ? '#0b0f24' : st === 'done' ? '#0b0f24' : '#d6daf0' });
    const lw = Math.ceil(t.width) + 10, lh = 14;
    // 층 바닥 오른쪽 구석 (방 안 인물과 겹치지 않는 자리)
    const lx = sx - 4 - lw, ly = floorY - lh;
    const bgc = st === 'next' ? PAL.acc : st === 'done' ? PAL.mint : PAL.surf;
    panel(g, lx, ly, lw, lh, bgc, st === 'lock' ? PAL.line : 0xffffff, PAL.edge, true, st === 'lock' ? 0.85 : 1, 3);
    t.setPosition(lx + 5, ly + 2);
    c.add([g, t]);
    if (st === 'next') {
      const glow = this.add.graphics();
      glow.lineStyle(2, 0xffe066, 1); glow.strokeRoundedRect(sx - 2, sy - 2, sw + 4, sh + 4, 4);
      c.addAt(glow, 0);
      this.tweens.add({ targets: glow, alpha: 0.25, yoyo: true, repeat: -1, duration: 600 });
      // 라벨만 살짝 숨쉬기 (간판과 겹치지 않게 왼쪽 기준)
      this.tweens.add({ targets: t, x: t.x - 1, yoyo: true, repeat: -1, duration: 500 });
    }
    if (st === 'done') {
      g.fillStyle(PAL.edge); g.fillCircle(sx + sw, sy + 2, 6);
      g.fillStyle(PAL.mint); g.fillCircle(sx + sw, sy + 2, 5);
      g.fillStyle(PAL.edge); g.fillRect(sx + sw - 3, sy + 2, 2, 2); g.fillRect(sx + sw - 1, sy + 4, 2, 2); g.fillRect(sx + sw + 1, sy + 2, 2, 2); g.fillRect(sx + sw + 3, sy, 2, 2);
    }
    c.setSize(sw + lw + 4, sh);
    c.setInteractive(new Phaser.Geom.Rectangle(lx, Math.min(sy, ly), sw + lw + 4, Math.max(sy + sh, ly + lh) - Math.min(sy, ly)), Phaser.Geom.Rectangle.Contains);
    return c;
  }

  // 장소를 눌렀을 때: 다음 장소면 입장, 아니면 짧은 안내
  toast?: Phaser.GameObjects.Container;
  tapPlace(i: number, st: 'done' | 'next' | 'lock', card: Phaser.GameObjects.Container) {
    if (director.auto || this.entering) return;
    if (st === 'next') { this.enter(i); return; }
    sfx.move();
    const next = state.nextMission();
    const msg = st === 'done'
      ? '이미 다녀온 곳이에요  ·  Already visited'
      : `먼저 ${next?.label ?? ''}부터 가 봐요  ·  Visit the ${next?.en ?? ''} first`;
    this.toast?.destroy();
    const b = card.getBounds();
    this.toast = tag(this, b.centerX, Math.max(14, b.top - 12), msg, { depth: 30, pop: true });
    const t = this.toast;
    this.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 250, onComplete: () => t.destroy() });
    this.tweens.add({ targets: card, x: card.x + 3, yoyo: true, repeat: 2, duration: 50 });
  }

  elevatorCar?: Phaser.GameObjects.Graphics;
  drawElevator(y: number) {
    const g = this.elevatorCar!;
    g.clear();
    g.fillStyle(0x1a1430); g.fillRect(CAR_X - 15, y - 36, 30, 38);
    g.fillStyle(0xe8e2ff); g.fillRect(CAR_X - 13, y - 34, 26, 34);
    g.fillStyle(0xb8b0e0); g.fillRect(CAR_X - 1, y - 34, 2, 34);
    g.fillStyle(0xffd23f); g.fillRect(CAR_X - 13, y - 34, 26, 2);
  }

  // 길 지점들을 끊김 없이 이어 걷기
  async walkPath(pts: Pt[], speed = 100) {
    const s = this.hero;
    if (!pts.length) return;
    this.play(s, 'walk', false);
    this.puff(s.x, s.y, 2);
    const dust = this.time.addEvent({ delay: 280, loop: true, callback: () => Math.random() < 0.6 && this.puff(s.x - (s.flipX ? -6 : 6), s.y, 1) });
    for (const [x, y] of pts) {
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < 0.5) continue;
      if (Math.abs(x - s.x) > 1) s.setFlipX(x < s.x);
      await new Promise<void>((ok) => this.tweens.add({ targets: s, x, y, duration: (d / speed) * 1000, onComplete: () => ok() }));
    }
    dust.remove();
    this.play(s, 'idle');
  }

  entering = false;
  async enter(i: number) {
    if (this.entering) return;
    this.entering = true;
    const map = MAPS[state.stage];
    const n = map.nodes[i];
    const [tx, ty] = map.pts[n.at];
    sfx.select();
    this.routeG?.destroy();
    if (map.elevator) {
      // 엘리베이터로 이동 → 해당 층에서 내림
      const curY = Math.min(343, this.hero.y);
      await this.walkPath([[CAR_X, curY]], 90);
      this.hero.setDepth(6);
      const car = { y: curY };
      await new Promise<void>((ok) => this.tweens.add({
        targets: car, y: ty, duration: Math.max(300, Math.abs(curY - ty) * 8), ease: 'Sine.InOut',
        onUpdate: () => { this.drawElevator(car.y); this.hero.y = car.y; },
        onComplete: () => ok(),
      }));
      sfx.bell();
      this.hero.setDepth(10);
      await this.walkPath([[tx, ty]], 90);
    } else {
      await this.walkPath(route(map, this.cur, n.at).slice(1).map((k) => map.pts[k]));
    }
    sparkles(this, tx, ty - 20, 16);
    this.emote(this.hero, '!');
    this.hop(this.hero, 8);
    this.play(this.hero, 'cheer');
    await this.wait(500);
    const m = STAGES[state.stage][i];
    await this.goto(m.scene, m.data ?? {}, 'fade');
  }
}

export { COL };

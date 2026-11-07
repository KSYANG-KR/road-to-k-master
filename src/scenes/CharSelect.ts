// 캐릭터 선택 (아케이드 SELECT START PLAYER 화면): 8명 중 한 명을 골라 그 캐릭터로 여행한다
// 왼쪽 4×2 초상 카드(고르지 않은 카드는 흑백), 오른쪽 K-MASTER 로고 · PLAYER 01 · 스포트라이트 무대
import Phaser from 'phaser';
import { BaseScene } from '../core/BaseScene';
import { bigText, rrect, txt, W, H } from '../core/ui';
import { playMusic, sfx } from '../core/audio';
import { director } from '../core/director';
import { CAST, LINEUP, PROFILE, setHero } from '../art/cast';
import { bakeCharacter } from '../art/characters';
import { state } from '../core/state';
import { sparkles } from '../core/fx';

const KO_NAME: Record<string, string> = { hana: '하나', amara: '아마라', mei: '메이', leo: '레오', sofia: '소피아', noah: '노아', emma: '엠마', kofi: '코피', james: '제임스' };

const COLS = 4, CW = 88, CH = 100, GAP = 8;
const GX = 34, GY = 80; // 카드 그리드 왼쪽 위
const RX = 428, RW = 186; // 오른쪽 패널
const PINK = 0xff5fae, NAVY = 0x26307e, EDGE = 0x161a4a, GOLD = 0xffcf3a;

// 흑백 초상 텍스처 (고르지 않은 카드용)
function greyTex(scene: Phaser.Scene, key: string) {
  const gk = `${key}_grey`;
  if (scene.textures.exists(gk)) return gk;
  const f = scene.textures.getFrame(key, 'idle0');
  const src = f.source.image as CanvasImageSource;
  const c = scene.textures.createCanvas(gk, f.cutWidth, f.cutHeight)!;
  const ctx = c.getContext();
  ctx.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
  const im = ctx.getImageData(0, 0, f.cutWidth, f.cutHeight);
  const d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    const v = 42 + l * 0.72;
    d[i] = v - 4; d[i + 1] = v - 2; d[i + 2] = v + 10;
  }
  ctx.putImageData(im, 0, 0);
  c.refresh();
  return gk;
}

// 작은 픽셀 하트
function heart(g: Phaser.GameObjects.Graphics, x: number, y: number, c: number) {
  const rows = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  g.fillStyle(EDGE);
  rows.forEach((r, j) => [...r].forEach((ch, i) => ch === 'X' && g.fillRect(x + i - 1, y + j - 1, 3, 3)));
  g.fillStyle(c);
  rows.forEach((r, j) => [...r].forEach((ch, i) => ch === 'X' && g.fillRect(x + i, y + j, 1, 1)));
  g.fillStyle(0xffffff); g.fillRect(x + 1, y + 1, 1, 1);
}

// 흰 장갑 손 커서 (아래를 가리킴)
function hand(scene: Phaser.Scene) {
  const rows = [
    '..KK......',
    '.KWWK.....',
    '.KWWK.....',
    '.KWWKKK...',
    '.KWWKWWKK.',
    'KKWWKWWKWK',
    'KWWWWWWWWK',
    'KWWWWWWWWK',
    '.KWWWWWWK.',
    '..KWWWWK..',
    '...KKKK...',
  ];
  const g = scene.add.graphics();
  rows.forEach((r, j) => [...r].forEach((ch, i) => {
    if (ch === '.') return;
    g.fillStyle(ch === 'K' ? EDGE : 0xffffff); g.fillRect(i - 5, j - 11, 1, 1);
  }));
  return g;
}

export class CharSelect extends BaseScene {
  constructor() { super('CharSelect'); }

  async create() {
    playMusic('title');
    setHero('mei');
    this.cameras.main.setBackgroundColor('#8c9ff0');

    // 배경: 보라빛 하늘색 + 사선 줄무늬
    const bgG = this.add.graphics().setDepth(-100);
    bgG.fillStyle(0x8c9ff0); bgG.fillRect(0, 0, W, H);
    for (let x = -H; x < W + H; x += 46) {
      bgG.fillStyle(0xb7c3ff, 0.55); bgG.fillPoints([{ x, y: 0 }, { x: x + 14, y: 0 }, { x: x + 14 - H, y: H }, { x: x - H, y: H }], true);
      bgG.fillStyle(0xe9b8f2, 0.45); bgG.fillPoints([{ x: x + 20, y: 0 }, { x: x + 26, y: 0 }, { x: x + 26 - H, y: H }, { x: x + 20 - H, y: H }], true);
    }

    // 바깥 프레임
    const fr = this.add.graphics().setDepth(-90);
    fr.fillStyle(EDGE, 0.35); rrect(fr, 13, 12, 616, 340, 10);
    fr.fillStyle(0x3346c8); rrect(fr, 10, 8, 620, 340, 10);
    fr.fillStyle(0xd6e2ff); rrect(fr, 13, 11, 614, 334, 8);
    fr.fillStyle(0x93abf7); rrect(fr, 15, 13, 610, 330, 7);

    // 상단 배너: ♥ SELECT START PLAYER ♥
    const bn = this.add.graphics().setDepth(-80);
    bn.fillStyle(EDGE); rrect(bn, 30, 19, 580, 42, 9);
    bn.fillStyle(0xf59ad6); rrect(bn, 31, 18, 578, 40, 9);
    bn.fillStyle(0xffffff); rrect(bn, 33, 20, 574, 36, 7);
    bn.fillStyle(NAVY); rrect(bn, 35, 22, 570, 32, 6);
    bn.fillStyle(0x323c96); bn.fillRect(41, 24, 558, 2);
    heart(bn, 62, 31, PINK); heart(bn, 571, 31, PINK);
    bigText(this, W / 2, 38, 'SELECT START PLAYER', 2, '#ffffff', '#0d1036', '#3a2a8a').setDepth(-70);
    txt(this, GX + (COLS * CW + (COLS - 1) * GAP) / 2, 297, '함께 여행할 캐릭터를 골라 주세요  ·  Choose your traveler', { px: 8.5, weight: 800, color: '#141c5c' }).setOrigin(0.5, 0).setDepth(-70);

    // 왼쪽 카드 그리드 판
    const gp = this.add.graphics().setDepth(-60);
    gp.fillStyle(EDGE, 0.3); rrect(gp, GX - 9, GY - 9, COLS * CW + (COLS - 1) * GAP + 20, 2 * CH + GAP + 20, 8);
    gp.fillStyle(0xc4d2ff); rrect(gp, GX - 10, GY - 10, COLS * CW + (COLS - 1) * GAP + 20, 2 * CH + GAP + 20, 8);
    gp.fillStyle(0x7e95ea); rrect(gp, GX - 8, GY - 8, COLS * CW + (COLS - 1) * GAP + 16, 2 * CH + GAP + 16, 7);

    const cards = LINEUP.map((id, i) => {
      const row = Math.floor(i / COLS);
      const x = GX + (i % COLS) * (CW + GAP) + CW / 2;
      const y = GY + row * (CH + GAP) + CH / 2;
      const c = this.add.container(x, y);
      const key = `ch_${CAST[id].id}`;
      if (!this.textures.exists(key)) bakeCharacter(this, CAST[id]);
      const gk = greyTex(this, key);
      const back = this.add.graphics();
      // 얼굴이 카드를 꽉 채우는 상반신 (텍스처 x 12~84, y 6~86)
      const S = 1.12;
      const mk = (k: string) => this.add.image(0, -CH / 2 + 4, k, k === key ? 'idle0' : undefined).setOrigin(0.5, 0).setScale(S).setCrop(12, 6, 72, 80);
      // 원본 프레임의 좌상단 기준 크롭 → 이미지 원점을 맞추기 위해 위로 당김
      const color = mk(key).setY(-CH / 2 + 4 - 6 * S);
      const grey = mk(gk).setY(-CH / 2 + 4 - 6 * S);
      const front = this.add.graphics();
      c.add([back, color, grey, front]);
      c.setSize(CW, CH);
      c.setInteractive(new Phaser.Geom.Rectangle(-CW / 2, -CH / 2, CW, CH), Phaser.Geom.Rectangle.Contains);
      c.input!.cursor = 'pointer';
      return { id, c, back, front, color, grey };
    });

    // 카드 그리기 (선택 = 분홍 빛살 + 금테, 나머지 = 회색 + 흑백)
    const drawCard = (k: typeof cards[number], on: boolean) => {
      const { back, front } = k;
      back.clear(); front.clear();
      const x0 = -CW / 2, y0 = -CH / 2;
      if (on) {
        back.fillStyle(0xff7ac8); back.fillRect(x0 + 3, y0 + 3, CW - 6, CH - 6);
        // 빛살
        // 빛살: 카드 안쪽 사각형 경계까지만
        const hw = CW / 2 - 3, hh = CH / 2 - 3, oy = -8;
        const edge = (t: number) => {
          const c = Math.cos(t), s = Math.sin(t);
          const k = Math.min(Math.abs(c) > 1e-6 ? hw / Math.abs(c) : 1e9, Math.abs(s) > 1e-6 ? (s < 0 ? hh + oy : hh - oy) / Math.abs(s) : 1e9);
          return [c * k, oy + s * k] as const;
        };
        back.fillStyle(0xffb3e3, 0.85);
        for (let a = 0; a < 14; a++) {
          const t0 = (a / 14) * Math.PI * 2, t1 = t0 + 0.2;
          const [ax, ay] = edge(t0), [bx, by] = edge(t1);
          back.fillTriangle(0, oy, ax, ay, bx, by);
        }
        back.fillStyle(0xffffff, 0.35); back.fillCircle(0, -10, 16);
        front.lineStyle(2, 0xe0801a); front.strokeRect(x0 - 2, y0 - 2, CW + 4, CH + 4);
        front.lineStyle(3, GOLD); front.strokeRect(x0 + 0.5, y0 + 0.5, CW - 1, CH - 1);
        front.lineStyle(1, 0xfff3b0); front.strokeRect(x0 + 2.5, y0 + 2.5, CW - 5, CH - 5);
      } else {
        back.fillStyle(EDGE); back.fillRect(x0 - 1, y0 - 1, CW + 2, CH + 2);
        back.fillStyle(0xe6ecff); back.fillRect(x0, y0, CW, CH);
        back.fillStyle(0x8e93ac); back.fillRect(x0 + 3, y0 + 3, CW - 6, CH - 6);
        back.fillStyle(0x7d8299); back.fillRect(x0 + 3, y0 + CH * 0.62, CW - 6, CH * 0.38 - 3);
        front.lineStyle(1, 0x5b6080); front.strokeRect(x0 + 3.5, y0 + 3.5, CW - 7, CH - 7);
      }
      k.color.setVisible(on);
      k.grey.setVisible(!on);
    };

    // 선택 카드 장식: 빛줄기 · P1 태그 · 손 커서
    const deco = this.add.container(0, 0).setDepth(20);
    const rays = this.add.graphics();
    rays.fillStyle(0xffe066);
    ([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).forEach(([sx, sy]) => {
      for (let r = 0; r < 3; r++) {
        const a = (sx < 0 ? Math.PI : 0) + (sy < 0 ? -1 : 1) * (0.5 + r * 0.38) * (sx < 0 ? -1 : 1);
        const cx = Math.cos(a), cy = Math.sin(a);
        for (let t = 0; t < 7; t++) rays.fillRect(Math.round(sx * (CW / 2 + 6) + cx * t), Math.round(sy * (CH / 2 + 6) + cy * t), 2, 2);
      }
    });
    const p1g = this.add.graphics();
    const PT = -CH / 2 - 15; // P1 태그 윗변 (제목 띠 아래, 카드 위)
    p1g.fillStyle(EDGE); rrect(p1g, -15, PT + 1, 30, 13, 4);
    p1g.fillStyle(0xffffff); rrect(p1g, -14, PT, 28, 12, 4);
    p1g.fillStyle(0xf0306e); rrect(p1g, -12, PT + 1.5, 24, 9, 3);
    p1g.fillStyle(0xf0306e); p1g.fillTriangle(-4, PT + 10, 4, PT + 10, 0, PT + 14);
    const p1 = bigText(this, 0, PT + 6, 'P1', 1, '#ffffff', '#7a0f36');
    const cursor = hand(this).setPosition(-20, -CH / 2 - 2);
    deco.add([rays, p1g, p1, cursor]);
    this.tweens.add({ targets: cursor, y: cursor.y - 3, yoyo: true, repeat: -1, duration: 260, ease: 'Sine.InOut' });
    this.tweens.add({ targets: rays, alpha: 0.35, yoyo: true, repeat: -1, duration: 380 });

    // 오른쪽: K-MASTER 로고
    const logo = bigText(this, RX + RW / 2, 84, 'K-MASTER', 3, '#ff6fbf', '#2a1c66', '#7a2a9a');
    if (logo.textWidth * 3 > RW) logo.setScale(2);
    const bar = this.add.graphics();
    bar.fillStyle(EDGE); rrect(bar, RX + 10, 104, RW - 20, 6, 3);
    bar.fillStyle(0xff8fd0); bar.fillRect(RX + 12, 105, RW - 24, 4);
    bar.fillStyle(0xffe27a); bar.fillRect(RX + 12, 106, RW - 24, 2);
    for (const gx of [RX + 12, RX + RW - 12]) {
      bar.fillStyle(EDGE); bar.fillCircle(gx, 107, 5);
      bar.fillStyle(0xff5fae); bar.fillCircle(gx, 107, 4);
      bar.fillStyle(0xffd0ea); bar.fillRect(gx - 2, 105, 2, 2);
    }
    // PLAYER 01 알약
    const pill = this.add.graphics();
    pill.fillStyle(EDGE); rrect(pill, RX + 18, 117, RW - 36, 24, 12);
    pill.fillStyle(0xffffff); rrect(pill, RX + 19, 116, RW - 38, 22, 11);
    pill.fillStyle(0x2f64e8); rrect(pill, RX + 21, 118, RW - 42, 18, 9);
    pill.fillStyle(0x4f84ff); pill.fillRect(RX + 30, 119, RW - 60, 2);
    bigText(this, RX + RW / 2, 127, 'PLAYER 01', 1, '#ffffff', '#14205e');

    // 무대 상자: 스포트라이트 + 바닥 빛 고리
    const SX = RX + 2, SY = 146, SW = RW - 4, SH = 158;
    const st = this.add.graphics().setDepth(-50);
    st.fillStyle(EDGE); rrect(st, SX - 2, SY - 2, SW + 4, SH + 4, 8);
    st.fillStyle(0xc4d2ff); rrect(st, SX - 1, SY - 1, SW + 2, SH + 2, 8);
    for (let y = 0; y < SH - 2; y += 2) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x232466), Phaser.Display.Color.ValueToColor(0x5a3aa8), SH, y);
      st.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); st.fillRect(SX + 1, SY + 1 + y, SW - 2, 2);
    }
    st.fillStyle(0xffffff, 0.08); st.fillPoints([{ x: SX + SW / 2 - 18, y: SY + 1 }, { x: SX + SW / 2 + 18, y: SY + 1 }, { x: SX + SW / 2 + 62, y: SY + 134 }, { x: SX + SW / 2 - 62, y: SY + 134 }], true);
    st.fillStyle(0xffc8f0, 0.08); st.fillPoints([{ x: SX + SW / 2 - 8, y: SY + 1 }, { x: SX + SW / 2 + 8, y: SY + 1 }, { x: SX + SW / 2 + 40, y: SY + 134 }, { x: SX + SW / 2 - 40, y: SY + 134 }], true);
    // 양옆 LED 칸
    for (const [lx, cs] of [[SX + 8, [0xff7ac8, 0x5ab4ff]], [SX + SW - 16, [0xff7ac8, 0x5ab4ff]]] as [number, number[]][]) {
      for (let j = 0; j < 4; j++) { st.fillStyle(cs[j % 2], 0.85); st.fillRect(lx, SY + 18 + j * 22, 8, 8); st.fillStyle(0xffffff, 0.3); st.fillRect(lx, SY + 18 + j * 22, 8, 2); }
    }
    // 바닥 고리
    const ring = this.add.graphics().setDepth(-45);
    const FY = SY + 114;
    ring.fillStyle(0xff8fd0, 0.35); ring.fillEllipse(SX + SW / 2, FY, 132, 26);
    ring.lineStyle(2, 0xffffff, 0.9); ring.strokeEllipse(SX + SW / 2, FY, 116, 20);
    ring.lineStyle(1, 0xffb3e3, 0.9); ring.strokeEllipse(SX + SW / 2, FY, 92, 14);
    this.tweens.add({ targets: ring, alpha: 0.6, yoyo: true, repeat: -1, duration: 700 });
    // 반짝이
    const twinkles = [[SX + 30, SY + 40], [SX + SW - 34, SY + 30], [SX + 42, SY + 96], [SX + SW - 40, SY + 88], [SX + SW / 2 + 52, SY + 60]];
    twinkles.forEach(([x, y], i) => {
      const s = this.add.graphics({ x, y }).setDepth(-40);
      s.fillStyle(0xfff3b0); s.fillRect(-1, -4, 2, 8); s.fillRect(-4, -1, 8, 2); s.fillStyle(0xffffff); s.fillRect(-1, -1, 2, 2);
      this.tweens.add({ targets: s, alpha: 0.15, scale: 0.6, yoyo: true, repeat: -1, duration: 520 + i * 90, delay: i * 140 });
    });

    // 이름판
    const plate = this.add.graphics().setDepth(30);
    const PY = SY + SH - 40;
    plate.fillStyle(EDGE); rrect(plate, SX + 10, PY - 1, SW - 20, 36, 7);
    plate.fillStyle(0xf59ad6); rrect(plate, SX + 10, PY - 2, SW - 20, 36, 7);
    plate.fillStyle(NAVY); rrect(plate, SX + 12, PY, SW - 24, 32, 6);
    const star = (x: number) => { plate.fillStyle(EDGE); plate.fillRect(x - 3, PY + 12, 7, 7); plate.fillStyle(GOLD); plate.fillRect(x - 1, PY + 12, 3, 7); plate.fillRect(x - 3, PY + 14, 7, 3); };
    star(SX + 22); star(SX + SW - 22);
    const nameT = txt(this, SX + SW / 2, PY + 4, '', { px: 9.5, weight: 800, color: '#ffffff', spacing: 1 }).setOrigin(0.5, 0).setDepth(31);
    const nameK = txt(this, SX + SW / 2, PY + 18, '', { px: 7.5, weight: 700, color: '#ffb3e0' }).setOrigin(0.5, 0).setDepth(31);

    // 아래 띠: >>> START <<< (선택 후 CHARACTER SELECTED!)
    const BY = 318;
    const bb = this.add.graphics().setDepth(-30);
    bb.fillStyle(EDGE); rrect(bb, 22, BY - 1, 596, 24, 4);
    bb.fillStyle(0xc4d2ff); rrect(bb, 22, BY - 2, 596, 24, 4);
    bb.fillStyle(NAVY); bb.fillRect(24, BY, 592, 20);
    for (const [x0, dir] of [[24, 1], [616, -1]] as [number, number][]) {
      for (let i = 0; i < 6; i++) {
        bb.fillStyle(i % 2 ? 0x3a62d8 : 0x4f84ff, 0.9);
        const x = x0 + dir * (i * 14);
        bb.fillPoints([{ x, y: BY }, { x: x + dir * 8, y: BY }, { x: x + dir * 2, y: BY + 20 }, { x: x - dir * 6, y: BY + 20 }], true);
      }
    }
    const chev = this.add.graphics().setDepth(-20);
    const drawChev = (x: number, dir: number) => {
      for (let k = 0; k < 3; k++) {
        const cx = x + k * 7 * dir;
        chev.fillStyle(0xff8fd0);
        for (let t = 0; t < 5; t++) { chev.fillRect(cx + dir * t, BY + 5 + t, 2, 1); chev.fillRect(cx + dir * t, BY + 15 - t, 2, 1); }
      }
    };
    drawChev(150, 1); drawChev(490, -1);
    this.tweens.add({ targets: chev, alpha: 0.4, yoyo: true, repeat: -1, duration: 420 });
    const startT = txt(this, W / 2, BY + 4, '', { px: 10.5, weight: 800, color: '#ffd0ef', spacing: 1 }).setOrigin(0.5, 0).setDepth(-10);
    const setBottom = (s: string) => startT.setText(s);
    setBottom('이 친구로 출발!  ·  START');
    const startZone = this.add.zone(W / 2, BY + 10, 300, 22).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: startT, scale: 1.04, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.InOut' });
    if (!director.auto) txt(this, W / 2, 353.5, '← → ↑ ↓  고르기 Choose   ·   ENTER / 카드 다시 누르기  출발 Go', { px: 6.5, weight: 700, color: '#141c5c' }).setOrigin(0.5, 0.5);

    let preview: Phaser.GameObjects.Sprite | undefined;
    let idx = LINEUP.indexOf('mei');
    const show = (i: number, sound = true) => {
      idx = (i + LINEUP.length) % LINEUP.length;
      const id = LINEUP[idx];
      cards.forEach((k, j) => {
        const on = j === idx;
        drawCard(k, on);
        k.c.setScale(on ? 1.06 : 1).setDepth(on ? 10 : 1);
      });
      const sel = cards[idx].c;
      deco.setPosition(sel.x, sel.y).setScale(1.06);
      const p = PROFILE[id];
      nameT.setText(`${p.role[0]} ${CAST[id].name}`);
      nameK.setText(`${p.role[1]} ${KO_NAME[id] ?? ''}`);
      preview?.destroy();
      preview = this.char(id, SX + SW / 2, FY + 2, { scale: 2, noShadow: true });
      preview.setDepth(25);
      this.play(preview, 'wave');
      this.tweens.add({ targets: preview, y: { from: FY - 4, to: FY + 2 }, duration: 160, ease: 'Back.Out' });
      if (sound) sfx.move();
    };
    show(idx, false);
    await this.reveal();

    let done = false;
    const confirm = async () => {
      if (done) return;
      done = true;
      const id = LINEUP[idx];
      sfx.select();
      this.play(preview!, 'cheer');
      sparkles(this, SX + SW / 2, SY + 60, 24, undefined, 60);
      this.emote(preview!, '♥');
      setBottom('CHARACTER SELECTED!  ·  선택 완료!');
      this.tweens.add({ targets: startT, alpha: 0.3, yoyo: true, repeat: 5, duration: 90 });
      this.cameras.main.flash(160, 255, 255, 255);
      setHero(id);
      state.reset();
      state.hero = id;
      await this.wait(1100);
      this.goto('WorldMap', {}, 'flash');
    };
    cards.forEach((k, j) => k.c.on('pointerdown', () => { if (done) return; if (j === idx) confirm(); else show(j); }));
    startZone.on('pointerdown', confirm);
    const onKey = (e: KeyboardEvent) => {
      if (done || director.auto) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowDown') { if (idx < COLS) show(idx + COLS); }
      else if (e.key === 'ArrowUp') { if (idx >= COLS) show(idx - COLS); }
      else if (e.key === 'Enter' || e.key === ' ') confirm();
    };
    window.addEventListener('keydown', onKey);
    this.events.once('shutdown', () => window.removeEventListener('keydown', onKey));

    if (director.auto) {
      // 녹화용: 한 바퀴 둘러보고 고른 캐릭터로 시작
      const want = Math.max(0, LINEUP.indexOf(new URLSearchParams(location.search).get('hero') ?? 'mei'));
      for (const j of [0, 1, 2, 3, 6, 7, want]) { await this.wait(420); show(j); }
      await this.wait(1000);
      confirm();
    }
  }
}

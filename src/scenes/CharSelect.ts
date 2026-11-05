// 캐릭터 선택: 9명 중 한 명을 골라 그 캐릭터로 여행한다 (5 + 4 카드)
import Phaser from 'phaser';
import { BaseScene } from '../core/BaseScene';
import { bigText, button, panel, rrect, tag, txt, balance, PAL, TXT, SUB, ACC, EN, TYPE, W, H } from '../core/ui';
import { playMusic, sfx } from '../core/audio';
import { director } from '../core/director';
import { CAST, LINEUP, PROFILE, setHero } from '../art/cast';
import { bakeCharacter } from '../art/characters';
import { state } from '../core/state';
import { sparkles } from '../core/fx';

const COLS = 5, CW = 60, CH = 74, GAP = 6;
const GX = 296, GY = 74;

export class CharSelect extends BaseScene {
  constructor() { super('CharSelect'); }

  async create() {
    playMusic('title');
    setHero('hana');
    this.cameras.main.setBackgroundColor('#0b0f24');
    // 배경: 캐스트 롤과 같은 남색 그라데이션 + 사선 줄무늬 + 무대 바닥
    const g = this.add.graphics().setDepth(-100);
    const A = Phaser.Display.Color.ValueToColor(0x232a5e), B = Phaser.Display.Color.ValueToColor(0x0b0f24);
    for (let y = 0; y < H; y += 4) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(A, B, H, y);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); g.fillRect(0, y, W, 4);
    }
    g.fillStyle(0xffffff, 0.04);
    for (let x = -H; x < W; x += 28) g.fillPoints([{ x, y: 0 }, { x: x + 12, y: 0 }, { x: x + 12 + 250, y: 250 }, { x: x + 250, y: 250 }], true);

    // 제목
    txt(this, W / 2, 14, 'CHOOSE YOUR TRAVELER  ·  캐릭터 선택', { px: TYPE.cap + 0.5, weight: 800, color: ACC, spacing: 2 }).setOrigin(0.5, 0);
    txt(this, W / 2, 27, '함께 여행할 친구를 골라 주세요', { px: 15, weight: 800, color: TXT }).setOrigin(0.5, 0);
    txt(this, W / 2, 47, 'Pick who you will explore Korea as', { px: TYPE.body, weight: 500, color: EN }).setOrigin(0.5, 0);

    // 왼쪽: 큰 미리보기 (스포트라이트 + 무대)
    const PX = 150;
    const spot = this.add.graphics({ x: PX, y: 66 }).setDepth(-50);
    spot.fillStyle(0xffffff, 0.06); spot.fillPoints([{ x: -20, y: 0 }, { x: 20, y: 0 }, { x: 74, y: 262 }, { x: -74, y: 262 }], true);
    spot.fillStyle(0xffffff, 0.1); spot.fillEllipse(0, 262, 150, 20);
    const nameT = bigText(this, PX, 86, ' ', 2, '#ffffff', '#151a33', '#c94466');
    let roleTag: Phaser.GameObjects.Container | undefined;
    let preview: Phaser.GameObjects.Sprite | undefined;

    // 오른쪽: 5+4 카드
    const cards = LINEUP.map((id, i) => {
      // 둘째 줄(4장)은 가운데 정렬
      const row = Math.floor(i / COLS);
      const x = GX + (i % COLS) * (CW + GAP) + (row ? (CW + GAP) / 2 : 0), y = GY + row * (CH + GAP);
      const c = this.add.container(x, y);
      const bg = this.add.graphics();
      panel(bg, 0, 0, CW, CH, PAL.surf, PAL.line, PAL.edge, true, 0.85, 6);
      const key = `ch_${CAST[id].id}`;
      if (!this.textures.exists(key)) bakeCharacter(this, CAST[id]);
      // 상반신만 잘라 카드에 (텍스처 좌표 기준 크롭)
      // 텍스처 y 12~84 (머리~허리)를 카드 y 6~60 에 보이게
      const S = 0.68;
      const bust = this.add.sprite(CW / 2, 6 - 12 * S, key, 'idle0').setOrigin(0.5, 0).setScale(S).setCrop(18, 12, 60, 72);
      const nm = txt(this, CW / 2, CH - 14, CAST[id].name, { px: TYPE.small, weight: 800, color: TXT, spacing: 1 }).setOrigin(0.5, 0);
      const sel = this.add.graphics();
      c.add([bg, sel, bust, nm]);
      c.setSize(CW, CH);
      c.setInteractive(new Phaser.Geom.Rectangle(0, 0, CW, CH), Phaser.Geom.Rectangle.Contains);
      c.input!.cursor = 'pointer';
      return { id, c, sel, bust };
    });

    // 오른쪽 아래: 소개
    const info = this.add.graphics();
    const infoW = COLS * CW + (COLS - 1) * GAP;
    panel(info, GX, 248, infoW, 46, PAL.surf, PAL.line, PAL.edge, true, 0.85, 6);
    info.fillStyle(PAL.acc); info.fillRoundedRect(GX + 4, 254, 2, 34, 1);
    const bioKo = txt(this, GX + 14, 256, '', { px: TYPE.body + 0.5, weight: 700, color: TXT });
    const bioEn = txt(this, GX + 14, 273, '', { px: TYPE.body - 0.5, weight: 500, color: EN });

    const startBtn = button(this, GX + infoW / 2, 322, 'START', { w: 168, h: 34, sub: '이 친구로 출발' });
    if (!director.auto) tag(this, PX, 346, '← → ↑ ↓  고르기  Choose   ·   ENTER  출발  Go', { depth: 10, fg: SUB, size: 9 });

    let idx = LINEUP.indexOf('hana');
    const show = (i: number, sound = true) => {
      idx = (i + LINEUP.length) % LINEUP.length;
      const id = LINEUP[idx];
      cards.forEach((k, j) => {
        k.sel.clear();
        const on = j === idx;
        if (on) {
          k.sel.fillStyle(PAL.acc, 0.16); rrect(k.sel, 0, 0, CW, CH, 6);
          k.sel.lineStyle(1.5, PAL.acc, 1); k.sel.strokeRoundedRect(0.75, 0.75, CW - 1.5, CH - 1.5, 6);
        }
        k.c.setScale(on ? 1.04 : 1).setDepth(on ? 2 : 1);
        k.bust.setAlpha(on ? 1 : 0.75);
      });
      nameT.setText(CAST[id].name);
      roleTag?.destroy();
      const p = PROFILE[id];
      roleTag = tag(this, PX, 112, `${p.role[0]}  ·  ${p.role[1]}`, { bg: PAL.acc, bold: true, depth: 5 });
      balance(bioKo, p.bio[0], infoW - 24);
      balance(bioEn, p.bio[1], infoW - 24);
      preview?.destroy();
      preview = this.char(id, PX, 318, { scale: 4 });
      preview.setDepth(10);
      this.play(preview, 'wave');
      this.tweens.add({ targets: preview, y: { from: 324, to: 318 }, duration: 160, ease: 'Back.Out' });
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
      sparkles(this, PX, 200, 24, undefined, 80);
      this.emote(preview!, '♥');
      setHero(id);
      state.reset();
      state.hero = id;
      await this.wait(900);
      this.goto('WorldMap', {}, 'flash');
    };
    cards.forEach((k, j) => k.c.on('pointerdown', () => { if (done) return; if (j === idx) confirm(); else show(j); }));
    startBtn.on('pointerdown', confirm);
    const onKey = (e: KeyboardEvent) => {
      if (done || director.auto) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') show((idx + COLS) % LINEUP.length);
      else if (e.key === 'Enter' || e.key === ' ') confirm();
    };
    window.addEventListener('keydown', onKey);
    this.events.once('shutdown', () => window.removeEventListener('keydown', onKey));

    if (director.auto) {
      // 녹화용: 한 바퀴 둘러보고 하나로 시작
      const want = Math.max(0, LINEUP.indexOf(new URLSearchParams(location.search).get('hero') ?? 'hana'));
      for (const j of [5, 6, 7, want]) { await this.wait(450); show(j); }
      await this.wait(900);
      confirm();
    }
  }
}

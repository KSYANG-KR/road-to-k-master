// Stage 1 (Lv.1 K-ROOKIE) 미션: 한옥 신발벗기 → 온돌 간식 → 찜질방 → 드레스코드(절/고궁/놀이공원)
import Phaser from 'phaser';
import { BaseScene, item } from '../core/BaseScene';
import { DialogBox, Hotbar, tag, txt, W, H, ZOOM } from '../core/ui';
import { sfx } from '../core/audio';
import { hearts, sparkles } from '../core/fx';
import { CAST, NPC, OUTFITS } from '../art/cast';
import type { Outfit } from '../art/characters';

// 말풍선 느낌표
function bubble(scene: Phaser.Scene, x: number, y: number, s = '!') {
  const t = tag(scene, x, y, s, { bg: 0xffffff, fg: '#2a2346', bold: true, oy: 1, depth: 990 });
  scene.tweens.add({ targets: t, y: y - 4, yoyo: true, repeat: 2, duration: 120, onComplete: () => t.destroy() });
  return t;
}

// ---------------- #07 한옥 신발 벗기 ----------------
export class HanokShoes extends BaseScene {
  constructor() { super('HanokShoes'); }

  async create() {
    this.bg('hanok_ext');
    this.addHud();
    const hero = this.char('hana', -40, 312, { scale: 2, outfit: OUTFITS.hanaLv1 });
    const f1 = this.char('amara', -100, 318, { scale: 2 });
    const f2 = this.char('leo', -160, 322, { scale: 2 });
    await this.reveal();
    const box = DialogBox.mission(this, '실내에서 신발 벗기', 'Take off your shoes before entering!');
    this.walk(f1, 150, 318, 90);
    this.walk(f2, 80, 322, 90);
    await this.walk(hero, 270, 312, 90);
    // 마루로 올라가려다 멈춤
    this.tweens.add({ targets: hero, x: 284, yoyo: true, duration: 150 });
    await this.wait(200);
    this.lead = hero;
    this.emote(hero, '!');
    sfx.wrong();
    await this.wait(500);

    const ids = ['backpack', 'backpack', 'sneaker', 'sword', 'shield', 'potion', 'chest', 'tshirt', 'glove'];
    const bar = new Hotbar(this, ids.map((id) => item(this, id)), 5);
    await this.choose(bar, ['sneaker'], async () => {
      bar.hide();
      // 신발을 댓돌 위에 벗어두고 마루로 올라감
      const crew = [hero, f1, f2];
      const spots = [304, 330, 278];
      for (let i = 0; i < crew.length; i++) {
        const s = crew[i];
        const def = [CAST.hana, CAST.amara, CAST.leo][i];
        const base: Outfit = i === 0 ? OUTFITS.hanaLv1 : def.outfit;
        const shoeCol = base.shoes;
        if (i > 0) await this.walk(s, spots[i], s.y, 110);
        else await this.walk(s, spots[0], 312, 80);
        sfx.pop();
        const shoes = this.add.graphics({ x: spots[i], y: 254 }).setDepth(255);
        for (const dx of [-7, 1]) {
          shoes.fillStyle(0x1a1430); shoes.fillRect(dx - 1, -4, 8, 5);
          shoes.fillStyle(shoeCol); shoes.fillRect(dx, -3, 6, 3);
          shoes.fillStyle(0xf2f2f2); shoes.fillRect(dx, 0, 6, 1);
        }
        shoes.setScale(0).setY(240);
        this.tweens.add({ targets: shoes, scale: 2, y: 256, duration: 250, ease: 'Back.Out' });
        this.redress(s, def, { ...base, shoes: 0xf7f7f7 });
        this.emote(s, '♪');
        this.award(50, s.x, s.y - 100);
        // 마루로 올라가 방 안으로
        this.tweens.add({ targets: s, y: 246, duration: 350, ease: 'Quad.Out' });
        await this.wait(380);
        this.walk(s, 320 + (i - 1) * 6, 240, 70).then(() => this.tweens.add({ targets: s, alpha: 0, scale: 0.9, duration: 400 }));
        await this.wait(350);
      }
    });
    await this.wait(1600);
    box.destroy();
    await this.goto('HanokOndol', {}, 'fade');
  }
}

// ---------------- #08 온돌에 누워 간식 먹기 ----------------
export class HanokOndol extends BaseScene {
  constructor() { super('HanokOndol'); }

  async create() {
    this.bg('hanok_int');
    this.addHud();
    // 아지랑이 (온돌 열기)
    this.time.addEvent({
      delay: 140, loop: true, callback: () => {
        const p = this.add.image(Phaser.Math.Between(20, W - 20), 340, 'px').setTint(0xfff1b0).setAlpha(0.5).setDepth(5);
        this.tweens.add({ targets: p, y: 230, x: p.x + Phaser.Math.Between(-10, 10), alpha: 0, duration: 1800, onComplete: () => p.destroy() });
      },
    });
    const ids = ['hana', 'amara', 'leo'];
    const xs = [160, 330, 500];
    const quiltCols = [[0xf08ab0, 0xffd6e6], [0x6aa8f0, 0xd6eaff], [0x7cc46a, 0xe0f5d0]];
    const quilts = xs.map((x, i) => {
      const g = this.add.graphics({ x, y: 318 }).setDepth(250);
      g.fillStyle(0x6a3a2a, 0.35); g.fillRect(-64, 2, 128, 6);
      g.fillStyle(quiltCols[i][0]); g.fillRect(-62, -14, 124, 18);
      g.fillStyle(quiltCols[i][1]);
      for (let k = -58; k < 60; k += 12) g.fillRect(k, -12, 6, 14);
      g.fillStyle(0xffffff); g.fillRect(-62, -14, 18, 18);
      g.setScale(0, 1);
      return g;
    });
    const crew = ids.map((id, i) => this.char(id, xs[i] + 200, 316, { scale: 2, outfit: id === 'hana' ? { ...OUTFITS.hanaLv1, shoes: 0xf7f7f7 } : { ...CAST[id].outfit, shoes: 0xf7f7f7 } }));
    await this.reveal();
    // 이불 펴기
    quilts.forEach((q, i) => this.tweens.add({ targets: q, scaleX: 1, delay: i * 200, duration: 400, ease: 'Back.Out', onStart: () => sfx.whoosh() }));
    await Promise.all(crew.map((s, i) => this.walk(s, xs[i], 316, 140)));
    crew.forEach((s) => { this.play(s, 'lie'); s.setDepth(300); s.y = 322; });
    this.lead = crew[0];
    crew.forEach((s, i) => this.emote(s, '♪', 300 + i * 200));
    sfx.pop();
    const box = DialogBox.mission(this, '온돌에 누워 간식먹기', 'Relax on a ondol and enjoy some snacks!');
    await this.wait(600);
    const bar = new Hotbar(this, ['backpack', 'backpack', 'watermelon', 'yakgwa', 'gimbap', 'apple', 'tteok', 'persimmon'].map((id) => item(this, id)), 6);
    await this.choose(bar, ['yakgwa'], async () => {
      bar.hide();
      for (let i = 0; i < crew.length; i++) {
        const from = bar.slotWorldPos('yakgwa');
        const it = this.add.image(from.x, from.y, 'items1', 'yakgwa').setDepth(400).setScale(0.5);
        await new Promise<void>((ok) => this.tweens.add({ targets: it, x: xs[i] - 40, y: 318, duration: 380, ease: 'Quad.Out', onComplete: () => ok() }));
        sfx.pop();
        crew[i].setFrame('lieEat');
        this.time.delayedCall(500, () => this.play(crew[i], 'lie'));
        hearts(this, xs[i] - 30, 270, 3);
        this.emote(crew[i], '♥');
        this.award(i === 2 ? 66 : 67, xs[i], 250);
        await this.wait(250);
      }
    });
    await this.wait(1200);
    box.destroy();
    await this.completeMission('hanok');
  }
}

// ---------------- #09 찜질방: 식혜와 맥반석 계란 ----------------
export class Jjimjil extends BaseScene {
  constructor() { super('Jjimjil'); }

  // 이마에 계란 톡! (찜질방 국룰)
  async eggBonk(s: Phaser.GameObjects.Sprite) {
    const egg = this.add.image(s.x - 14, s.y - 34, 'items1', 'eggs').setScale(0.12).setDepth(900);
    await new Promise<void>((ok) => this.tweens.add({ targets: egg, x: s.x, y: s.y - 74, duration: 300, ease: 'Quad.Out', onComplete: () => ok() }));
    sfx.hit();
    this.cameras.main.shake(80, 0.002);
    s.anims.stop();
    s.setFrame('sit0');
    const t = txt(this, s.x + 16, s.y - 92, '톡!', { bold: true, color: '#ff8a1a', stroke: '#ffffff', strokeThickness: 2 }).setDepth(990).setOrigin(0.5);
    this.tweens.add({ targets: t, y: t.y - 8, scale: 1.4, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    sparkles(this, s.x, s.y - 76, 6, [0xffffff, 0xffe066], 10);
    await this.wait(450);
    this.tweens.add({ targets: egg, x: s.x + 14, y: s.y - 34, duration: 250 });
    this.play(s, 'sitEat');
    this.emote(s, '♪');
    await this.wait(300);
  }

  async create() {
    this.bg('jjimjil');
    this.addHud();
    // 가마 불빛 일렁임
    const glow = this.add.rectangle(0, 0, W, H, 0xff8a3a, 0.08).setOrigin(0).setDepth(1000).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: 0.16, yoyo: true, repeat: -1, duration: 700 });
    const ids = ['mei', 'hana', 'emma', 'amara'];
    const xs = [190, 280, 370, 460];
    const crew = ids.map((id, i) => {
      const base = id === 'hana' ? CAST.hana : CAST[id];
      const s = this.char(id, xs[i], 262, { scale: 2, outfit: OUTFITS.jjimjil(), key: `jj_${id}`, def: base });
      this.play(s, 'sit');
      return s;
    });
    this.lead = crew[1];
    // 땀 송골송골 (찜질방 열기)
    crew.forEach((s, i) => this.time.addEvent({ delay: 2200, loop: true, startAt: i * 500, callback: () => Math.random() < 0.5 && this.emote(s, '💧') }));
    await this.reveal();
    const box = DialogBox.mission(this, '찜질방에서 시원한 식혜와\n맥반석 계란 먹어보기', 'Try sweet rice punch\nand roasted eggs at a jjimjilbang!');
    await this.wait(700);
    const bar = new Hotbar(this, ['backpack', 'backpack', 'watermelon', 'yakgwa', 'gimbap', 'sikhye', 'apple', 'eggs'].map((id) => item(this, id)), 2);
    const held: Phaser.GameObjects.Image[] = [];
    await this.choose(bar, ['sikhye', 'eggs'], async (id) => {
      sfx.sparkle();
      if (id === 'eggs') {
        const plate = this.add.image(325, 270, 'items1', 'eggs').setDepth(400).setScale(0);
        this.tweens.add({ targets: plate, scale: 0.5, duration: 300, ease: 'Back.Out' });
      }
      crew.forEach((s, i) => {
        const from = bar.slotWorldPos(id);
        const it = this.add.image(from.x, from.y, 'items1', id).setDepth(500).setScale(id === 'eggs' ? 0.23 : 0.3);
        const hx = s.x + (id === 'sikhye' ? 14 : -14), hy = s.y - 34;
        this.tweens.add({ targets: it, x: hx, y: hy, delay: i * 90, duration: 400, ease: 'Quad.Out' });
        held.push(it);
        this.time.delayedCall(450 + i * 90, () => { this.play(s, 'sitEat'); hearts(this, s.x, s.y - 90, 2); });
      });
      await this.wait(800);
      if (id === 'eggs') await this.eggBonk(crew[1]);
      crew.forEach((s, i) => this.emote(s, '♥', i * 120));
      await this.award(100, 320, 150);
    });
    bar.hide();
    await this.wait(1500);
    box.destroy();
    await this.completeMission('jjimjil');
  }
}

// ---------------- #10 드레스코드: 같은 앵글, 배경과 의상만 바뀜 ----------------
const DRESS: Record<string, { bg: string; ko: string; en: string; item: string; outfits: Outfit[] }> = {
  temple: {
    bg: 'temple', ko: '절에서 승복!', en: "Monk's robes at a temple!", item: 'monkrobe',
    outfits: [OUTFITS.monk, OUTFITS.monk, OUTFITS.monk, OUTFITS.monk],
  },
  palace: {
    bg: 'palace', ko: '고궁에서 한복!', en: 'Hanbok at a palace!', item: 'hanbok',
    outfits: [
      OUTFITS.hanbokM(0xf4f4f4, 0x2a3a8a, 0x2a3a8a),
      OUTFITS.hanbokF(0xf6a6b8, 0x2b3a8c, 0xd83a5a),
      OUTFITS.hanbokF(0xf2d45a, 0x3a8a5a, 0xc23a32),
      OUTFITS.hanbokF(0xffffff, 0x8fd0f0, 0x3a7ad8),
    ],
  },
  park: {
    bg: 'park', ko: '놀이공원에서 교복!', en: 'School uniforms at an amusement park!', item: 'uniform',
    outfits: [OUTFITS.uniformM, OUTFITS.uniformF, OUTFITS.uniformF, OUTFITS.uniformF],
  },
};

export class DressCode extends BaseScene {
  constructor() { super('DressCode'); }

  async create(data: { variant: 'temple' | 'palace' | 'park' }) {
    const v = DRESS[data.variant ?? 'temple'];
    this.bg(v.bg);
    // 배경 인물
    if (data.variant === 'temple') {
      const monk = this.char('monk', 60, 250, {});
      this.walk(monk, 150, 250, 14);
    } else if (data.variant === 'palace') {
      [70, 110, 530, 570].forEach((x) => this.char('guard', x, 262, { anim: 'idle' }));
    }
    this.addHud();
    const ids = ['leo', 'hana', 'amara', 'mei'];
    const xs = [165, 270, 375, 480];
    const defs = ids.map((id) => (id === 'hana' ? { ...CAST.hana, outfit: OUTFITS.hanaLv1 } : CAST[id]));
    const crew = ids.map((id, i) => {
      const s = this.char(id, xs[i], 352 + (i % 2) * 8, { scale: 4, outfit: defs[i].outfit, key: `dc_${id}` });
      this.play(s, i === 3 ? 'selfie' : i === 0 ? 'v0' : 'idle');
      if (i === 3) s.setFlipX(true);
      return s;
    });
    // 셀카 프레이밍: 아래에서 살짝 들어오는 카메라 무빙
    this.cameras.main.setZoom(1.04 * ZOOM).centerOn(W / 2, H / 2 + 6);
    await this.reveal();
    this.camZoom(ZOOM, 1600, 'Sine.easeOut');
    const box1 = DialogBox.mission(this, '드레스코드 맞추기', 'Dress for the occasion!', 10, 10, 160);
    await this.wait(400);
    const box2 = DialogBox.mission(this, v.ko, v.en, 10, box1.y + box1.bh + 6, 200);
    await this.wait(400);
    const bar = new Hotbar(this, ['backpack', 'backpack', 'hoodie', 'monkrobe', 'hanbok', 'uniform'].map((id) => item(this, id)), 2);
    this.lead = crew[1];
    await this.choose(bar, [v.item], async () => {
      bar.hide();
      await this.fx.wipeIn('flash');
      crew.forEach((s, i) => {
        this.redress(s, defs[i], v.outfits[i], i === 3 ? 'selfie' : 'idle');
        s.setFrame(['v1', 'cheer0', 'v0', 'selfie'][i]);
      });
      this.fx.wipeOut();
      sfx.sparkle();
      crew.forEach((s, i) => { sparkles(this, s.x, s.y - 110, 12, undefined, 50); this.hop(s, 10, i * 90); this.emote(s, i % 2 ? '♥' : '★', 200 + i * 100); });
      await this.wait(700);
      // 셀카 찰칵
      sfx.shutter();
      await this.fx.wipeIn('flash');
      this.fx.wipeOut();
      await this.award(this.missionXp(data.variant), 320, 140);
    });
    await this.wait(1200);
    box1.destroy(); box2.destroy();
    await this.completeMission(data.variant);
  }
}

export { NPC };

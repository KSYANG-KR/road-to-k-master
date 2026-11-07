// Stage 2 (Lv.2 K-PLAYER) 미션: PC방 → 한강 러닝 → 편의점 황금조합
import Phaser from 'phaser';
import { pixText } from '../art/pixeltext';
import { BaseScene, item } from '../core/BaseScene';
import { speech } from '../core/widgets';
import { DialogBox, Hotbar, panel, rrect, TYPE, EN, txt, bigText, floatText, itemName, ITEM_NAMES, tag as uiTag, PAL, INK, MUTED, W, H } from '../core/ui';
import { bridgeSignTex } from '../art/props';
import { Lives } from '../core/widgets';
import { sfx } from '../core/audio';
import { director } from '../core/director';
import { hearts, sparkles } from '../core/fx';
import { ambientFor, pigeons } from '../core/ambient';
import { CAST, OUTFITS, pickCrew } from '../art/cast';
import type { CharDef, Outfit } from '../art/characters';

function tag(scene: Phaser.Scene, x: number, y: number, s: string) {
  return uiTag(scene, x, y, s, { bg: PAL.acc, bold: true, pop: true });
}

// ---------------- #13 PC방 ----------------
// 콘티 #5: 헤드셋을 낀 셋이 게이밍 의자에 크게 앉아, 모니터 앞에서 라면·핫도그·치킨을 먹음
function drumstickTex(scene: Phaser.Scene) {
  if (scene.textures.exists('drumstick')) return 'drumstick';
  const g = scene.make.graphics({}, false);
  // 뼈 (왼쪽 아래) + 바삭한 닭다리 살 (오른쪽 위)
  g.fillStyle(0x3a2014); g.fillRect(1, 15, 9, 6); g.fillRect(3, 13, 4, 10);
  g.fillStyle(0xfff6e4); g.fillRect(2, 16, 7, 4); g.fillRect(4, 14, 2, 8);
  g.fillStyle(0x3a2014); g.fillEllipse(14, 9, 18, 15);
  g.fillStyle(0xc8741e); g.fillEllipse(14, 9, 16, 13);
  g.fillStyle(0xe89a3a); g.fillEllipse(13, 7, 11, 8);
  g.fillStyle(0xffc86a); g.fillRect(10, 4, 3, 2); g.fillRect(15, 3, 2, 2); g.fillRect(18, 7, 2, 2);
  g.fillStyle(0x9a4e14); g.fillRect(16, 12, 2, 2); g.fillRect(11, 11, 2, 1);
  g.lineStyle(1, 0x3a2014); g.lineBetween(8, 13, 6, 15);
  g.generateTexture('drumstick', 24, 24);
  g.destroy();
  return 'drumstick';
}

export class PcBang extends BaseScene {
  constructor() { super('PcBang'); }

  async create() {
    this.bg('pcbang2');
    this.addHud();
    const ids = pickCrew(['leo', 'hana', 'amara']);
    // 배경 게이밍 의자 세 개에 맞춰 크게 앉힘
    const xs = [200, 320, 445];
    const SY = 360;
    const defs: CharDef[] = ids.map((id) => {
      const d = id === 'hana' ? { ...CAST.hana, outfit: OUTFITS.hanaLv2 } : CAST[id];
      return { ...d, outfit: { ...d.outfit, acc: [...(d.outfit.acc ?? []), 'headphones'] } as Outfit };
    });
    const crew = ids.map((id, i) => {
      const s = this.char(id, xs[i], SY, { scale: 4, def: defs[i], key: `pc_${id}`, noShadow: true });
      s.setDepth(300);
      this.play(s, 'focus');
      this.time.delayedCall(800 + i * 400, () => this.emote(s, '💧'));
      return s;
    });
    this.lead = crew[1];
    // 전경: 책상 + 각자 정면의 모니터 뒷면 + 빛나는 키보드 (손에 든 음식은 모니터 위로 보이게)
    crew.forEach((s) => s.setData('propDepth', 520));
    const desk = this.add.graphics().setDepth(500);
    const DT = 332;
    desk.fillStyle(0x0d0b1f); desk.fillRect(0, DT, W, H - DT);
    desk.fillStyle(0x2a2650); desk.fillRect(0, DT, W, 3);
    desk.fillStyle(0x3ef0d8); desk.fillRect(0, DT + 3, W, 1);
    desk.fillStyle(0x15132e); for (let x = 0; x < W; x += 106) desk.fillRect(x, DT + 6, 1, 30);
    xs.forEach((x, i) => {
      // 게이밍 모니터 뒷면: 둥근 본체 + 가운데 목 + V자 받침, 가장자리로 화면 빛이 새어 나옴
      const MW = 92, MH = 40, my = DT - 8 - MH, mx = x - MW / 2;
      const rim = [0x3ef0d8, 0xff5fa2, 0x9a7aff][i % 3];
      desk.fillStyle(rim, 0.35); desk.fillRoundedRect(mx - 3, my - 3, MW + 6, MH + 5, 6);
      desk.fillStyle(0x05040f); desk.fillRoundedRect(mx - 1, my - 1, MW + 2, MH + 2, 5);
      desk.fillStyle(0x1b1838); desk.fillRoundedRect(mx, my, MW, MH, 4);
      desk.fillStyle(0x24204a); desk.fillRoundedRect(mx + 3, my + 2, MW - 6, MH - 8, 3);
      desk.fillStyle(0x2e2a5c); desk.fillRect(mx + 6, my + 3, MW - 12, 2);
      // 뒷면 통풍구 + 가운데 로고 + 아래 RGB 띠
      desk.fillStyle(0x15132e); for (let k = 0; k < 6; k++) desk.fillRect(mx + 10 + k * 4, my + 10, 2, 12);
      desk.fillStyle(0x15132e); for (let k = 0; k < 6; k++) desk.fillRect(mx + MW - 32 + k * 4, my + 10, 2, 12);
      desk.fillStyle(rim, 0.9); desk.fillTriangle(x - 4, my + 20, x + 4, my + 20, x, my + 13);
      desk.fillStyle(rim, 0.7); desk.fillRect(mx + 8, my + MH - 4, MW - 16, 1);
      // 목 + 받침
      desk.fillStyle(0x05040f); desk.fillRect(x - 5, my + MH, 10, 9);
      desk.fillStyle(0x2a2650); desk.fillRect(x - 4, my + MH, 8, 8);
      desk.fillStyle(0x05040f); desk.fillRect(x - 18, DT - 2, 36, 3);
      desk.fillStyle(0x3a3570); desk.fillRect(x - 17, DT - 2, 34, 1);
      // 키보드 (RGB) + 마우스
      desk.fillStyle(0x2a2650); desk.fillRect(x - 34, DT + 7, 60, 9);
      [0xff5fa2, 0xffd23f, 0x6fd8ff, 0x7dff8a].forEach((c, k) => { desk.fillStyle(c, 0.6); desk.fillRect(x - 32 + k * 14, DT + 9, 12, 2); });
      desk.fillStyle(0x2a2650); desk.fillRoundedRect(x + 32, DT + 8, 8, 11, 3);
      desk.fillStyle(rim, 0.8); desk.fillRect(x + 35, DT + 9, 2, 3);
    });
    // 모니터 화면빛이 얼굴에 비침
    const glow = crew.map((s) => this.add.rectangle(s.x, s.y - 150, 96, 110, 0x6fd8ff, 0.07).setDepth(301).setBlendMode(Phaser.BlendModes.ADD));
    glow.forEach((gl, i) => this.tweens.add({ targets: gl, alpha: 0.18, yoyo: true, repeat: -1, duration: 200 + i * 70 }));
    this.time.addEvent({ delay: 180, loop: true, callback: () => sfx.typing() });

    await this.reveal();
    const box = DialogBox.mission(this, 'PC방에서 게임하며 야식 주문하기', 'Order snacks while gaming at a PC bang');
    const bonus = tag(this, 330, 84, 'BONUS MISSION  ·  보너스 미션');
    await this.wait(800);
    const bar = new Hotbar(this, ['tteokbokki', 'cupramen', 'bananamilk', 'corndog', 'soda', 'chicken'].map((id) => item(this, id)), 0);
    // 친구마다 원하는 야식이 다르다 (순서는 매번 섞임, 녹화 모드는 고정)
    const wants = ['soda', 'cupramen', 'corndog'];
    const order = director.auto ? [1, 0, 2] : Phaser.Utils.Array.Shuffle([0, 1, 2]);
    const reqs: { who: number | -1; id: string }[] = [...order.map((i) => ({ who: i, id: wants[i] })), { who: -1, id: 'chicken' }];
    let step = 0;
    let bubble: Phaser.GameObjects.Container | undefined;
    const ask = () => {
      bubble?.destroy();
      const r = reqs[step];
      if (!r) return;
      const n = ITEM_NAMES[r.id];
      if (r.who < 0) {
        this.lead = crew[1];
        bubble = speech(this, 320, 150, '마무리는 다 같이 치킨!', 'Let\'s finish with fried chicken!', { icon: item(this, r.id) });
      } else {
        const s = crew[r.who];
        this.lead = s;
        this.emote(s, '!');
        bubble = speech(this, s.x, 150, `${n[0]} 시켜 줘!`, `Get me ${n[1].toLowerCase()}, please!`, { icon: item(this, r.id) });
      }
    };
    ask();
    await this.choose(bar, reqs.map((r) => r.id), async (id) => {
      bubble?.destroy();
      const ref = item(this, id);
      const from = bar.slotWorldPos(id);
      const it = this.add.image(from.x, from.y, ref.tex, ref.frame).setDepth(600).setScale(0.5);
      const r = reqs[step++];
      if (r.who < 0) {
        // 치킨 상자는 가운데 책상에, 다 같이 닭다리 하나씩
        await new Promise<void>((ok) => this.tweens.add({ targets: it, x: 258, y: DT + 4, scale: 0.9, duration: 400, ease: 'Quad.Out', onComplete: () => ok() }));
        sfx.pop();
        it.setDepth(520);
        this.award(75, 320, 200);
        const dk = drumstickTex(this);
        await Promise.all(crew.map(async (s, i) => {
          await this.wait(i * 150);
          await this.eat(s, { tex: dk }, { size: 34, bites: 3 });
          s.setFrame('cheer0');
          hearts(this, s.x, 140, 2);
        }));
      } else {
        const s = crew[r.who];
        await new Promise<void>((ok) => this.tweens.add({ targets: it, x: s.x + 8, y: s.y - 90, scale: 0.5, duration: 400, ease: 'Quad.Out', onComplete: () => ok() }));
        it.destroy();
        sfx.pop();
        sparkles(this, s.x, 180, 10);
        this.award(75, s.x, 140);
        const drink = id === 'soda' || id === 'bananamilk';
        const noodle = id === 'cupramen' || id === 'tteokbokki';
        await this.eat(s, id, { drink, hot: noodle, size: id === 'corndog' ? 38 : 30, bites: drink ? 2 : 3, ...(noodle ? { utensil: id === 'cupramen' ? 'chopsticks' : 'spoon', foodColor: id === 'cupramen' ? 0xf2c25a : 0xe8503a } as const : {}) });
        this.play(s, 'focus');
      }
      ask();
    }, true, { time: 10 });
    bar.hide();
    await this.wait(1200);
    bonus.destroy();
    box.destroy();
    await this.tip(
      '한국 PC방에서는 자리에서 라면, 핫도그, 음료를 주문해 먹을 수 있어요. 맛도 꽤 좋아요.',
      'At a Korean PC bang, you can order ramyeon, corn dogs and drinks right from your seat. They taste great, too.',
    );
    await this.completeMission('pcbang');
  }
}

// ---------------- #14 한강 러닝 (횡스크롤) ----------------
// 콘티 #18: 잠수교 아래 러닝 트랙. 머리 위 다리 상판, 기둥 사이로 한강·남산, 간판 'HANGANG RIVER RUNNING'·'잠수교'
export class Hangang extends BaseScene {
  constructor() { super('Hangang'); }
  hero!: Phaser.GameObjects.Sprite;
  ground = 330;
  vy = 0;
  jumping = false;
  speed = 160;
  gear: Outfit = OUTFITS.run0;
  items: { o: Phaser.GameObjects.Image; id: string; xp: number }[] = [];
  cones: Phaser.GameObjects.Image[] = [];
  hurt = 0;
  done = false;

  makeTiles() {
    if (this.textures.exists('track2')) return;
    const g = this.make.graphics({}, false);
    // 러닝 트랙 (빨간 우레탄 + 흰 점선 + 아래 보도블록)
    g.fillStyle(0x4f9a36); g.fillRect(0, 0, 64, 4);
    g.fillStyle(0x2f6a26); g.fillRect(0, 4, 64, 2);
    g.fillStyle(0xb8483a); g.fillRect(0, 6, 64, 30);
    g.fillStyle(0xd0644a); g.fillRect(0, 6, 64, 2);
    g.fillStyle(0xffffff); g.fillRect(8, 20, 22, 3);
    g.fillStyle(0x8e3428); for (let i = 0; i < 14; i++) g.fillRect((i * 23) % 64, 10 + (i * 7) % 24, 1, 1);
    g.fillStyle(0x9a9eae); g.fillRect(0, 36, 64, 12);
    g.fillStyle(0x7c8092); for (let x = 0; x < 64; x += 16) g.fillRect(x, 36, 1, 12);
    g.fillStyle(0xb4b8c6); g.fillRect(0, 36, 64, 1);
    g.generateTexture('track2', 64, 48);
    g.clear();
    // 강변 난간 (남색 기둥 + 가로대)
    g.fillStyle(0x1e2a50); g.fillRect(0, 2, 32, 3); g.fillRect(0, 15, 32, 2);
    g.fillStyle(0x3a4a80); g.fillRect(0, 2, 32, 1);
    g.fillStyle(0x1e2a50); g.fillRect(2, 0, 4, 30);
    g.fillStyle(0x3a4a80); g.fillRect(2, 0, 1, 30);
    g.fillStyle(0x1e2a50); for (let x = 10; x < 32; x += 6) g.fillRect(x, 5, 1, 10);
    g.generateTexture('rail2', 32, 30);
    g.clear();
    // 다리 상판 아랫면 (머리 위): 남색 띠 + 흰 조명 + 콘크리트 보
    g.fillStyle(0x2a3460); g.fillRect(0, 0, 160, 16);
    g.fillStyle(0xffffff); g.fillRect(20, 6, 30, 4); g.fillRect(100, 6, 30, 4);
    g.fillStyle(0x9aa4c4); g.fillRect(0, 16, 160, 14);
    g.fillStyle(0xb8c2dc); g.fillRect(0, 16, 160, 2);
    g.fillStyle(0x7a84a6); g.fillRect(0, 28, 160, 2);
    g.fillStyle(0x8892b4); for (let x = 0; x < 160; x += 40) g.fillRect(x, 18, 1, 10);
    g.generateTexture('deck2', 160, 30);
    g.destroy();
  }

  // 다리 기둥 (트랙 뒤, 강 앞). 간판을 붙일 수 있음
  pillar(x: number, sign?: 'run' | 'jamsu') {
    const c = this.add.container(x, 0).setDepth(90);
    const g = this.add.graphics();
    const top = 30, bot = 300;
    g.fillStyle(0x6c7696); g.fillRect(-25, top, 50, bot - top);
    g.fillStyle(0xc4cce0); g.fillRect(-23, top, 40, bot - top);
    g.fillStyle(0xdde3f0); g.fillRect(-23, top, 6, bot - top);
    g.fillStyle(0x9aa4c4); g.fillRect(11, top, 6, bot - top);
    // 기둥머리
    g.fillStyle(0x6c7696); g.fillRect(-33, top, 66, 12);
    g.fillStyle(0xb8c2dc); g.fillRect(-31, top, 62, 10);
    g.fillStyle(0xdde3f0); g.fillRect(-31, top, 62, 2);
    // 콘크리트 이음매
    g.fillStyle(0xaab2ca); for (let y = 80; y < bot; y += 56) g.fillRect(-23, y, 40, 1);
    c.add(g);
    if (sign === 'run') {
      const p = this.add.graphics();
      p.fillStyle(0x1a2a6a); p.fillRect(-60, 70, 120, 74);
      p.fillStyle(0x3a6ae0); p.fillRect(-58, 72, 116, 70);
      p.fillStyle(0xffffff); for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) p.fillRect(-50 + i * 8, 124 + k * 7 + (i % 2 ? 2 : 0), 6, 2);
      c.add(p);
      c.add(pixText(this, 0, 98, [{ t: 'HANGANG', font: 'g11b', color: '#ffffff' }, { t: 'RIVER RUNNING', font: 'g11b', color: '#ffffff' }, { t: '한강 러닝 코스', font: 'g9', color: '#cfe0ff' }], { gap: 1 }));
    }
    if (sign === 'jamsu') {
      const p = this.add.graphics();
      p.fillStyle(0x1a2a6a); p.fillRect(-21, 64, 42, 86);
      p.fillStyle(0xe8eef8); p.fillRect(-19, 66, 38, 82);
      p.fillStyle(0x3a6ae0); for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) p.fillRect(-13 + i * 7, 128 + k * 7 + (i % 2 ? 2 : 0), 5, 2);
      c.add(p);
      c.add(pixText(this, 0, 92, [{ t: '잠수교', font: 'g11b', color: '#1a2a6a' }, { t: 'JAMSUGYO', font: 'g7', color: '#3a6ae0' }], { gap: 2 }));
    }
    return c;
  }

  async create() {
    // 씬 인스턴스는 재사용되므로 상태 초기화
    this.done = false; this.jumping = false; this.vy = 0; this.items = []; this.cones = []; this.hurt = 0; this.gear = OUTFITS.run0;
    this.makeTiles();
    const far = this.add.image(0, -14, 'hangang').setOrigin(0).setDepth(-100);
    far.setScale(H / far.height);
    // 지하철·새 (유람선은 배경 그림에 이미 있음)
    const train = this.add.graphics({ x: 900, y: 132 }).setDepth(-95);
    for (let c = 0; c < 4; c++) { train.fillStyle(0xd8dce8); train.fillRect(c * 26, 0, 24, 7); train.fillStyle(0x3aa86a); train.fillRect(c * 26, 4, 24, 1); train.fillStyle(0x2a3550); for (let w = 2; w < 22; w += 5) train.fillRect(c * 26 + w, 1, 3, 2); }
    this.time.delayedCall(3000, () => this.tweens.add({ targets: train, x: -120, duration: 6000 }));
    this.time.addEvent({
      delay: 2600, loop: true, callback: () => {
        for (let i = 0; i < 3; i++) {
          const b = this.add.graphics({ x: W + i * 18, y: 60 + i * 10 }).setDepth(-80);
          b.fillStyle(0xffffff); b.fillRect(0, 0, 3, 1); b.fillRect(3, 1, 2, 1); b.fillRect(5, 0, 3, 1);
          this.tweens.add({ targets: b, x: -30, y: b.y - 20, duration: 7000, onComplete: () => b.destroy() });
        }
      },
    });
    // 다리 상판(머리 위) + 기둥 (트랙과 같은 속도로 지나감)
    const deck = this.add.tileSprite(0, 0, W, 30, 'deck2').setOrigin(0).setDepth(95);
    const pillars = [this.pillar(110, 'run'), this.pillar(420), this.pillar(730, 'jamsu'), this.pillar(1040), this.pillar(1350, 'run'), this.pillar(1660, 'jamsu')];
    const rail = this.add.tileSprite(0, 276, W, 30, 'rail2').setOrigin(0).setDepth(100);
    const track = this.add.tileSprite(0, this.ground - 6, W, 48, 'track2').setOrigin(0).setDepth(100);
    // 상단 진행 바 (출발 → 결승)
    const prog = this.add.graphics().setDepth(960);
    const PX0 = 236, PX1 = 456, PY = 82;
    const drawProg = (t: number) => {
      prog.clear();
      prog.fillStyle(0x0b0f24, 0.85); prog.fillRoundedRect(PX0 - 64, PY - 9, PX1 - PX0 + 124, 18, 6);
      prog.fillStyle(0x3a4270); prog.fillRect(PX0, PY - 1, PX1 - PX0, 3);
      prog.fillStyle(0xff8fa6); prog.fillRect(PX0, PY - 1, (PX1 - PX0) * t, 3);
      prog.fillStyle(0xffffff); prog.fillCircle(PX0 + (PX1 - PX0) * t, PY, 4);
      prog.fillStyle(0xffd23f); prog.fillRect(PX1 + 6, PY - 6, 2, 12); prog.fillTriangle(PX1 + 8, PY - 6, PX1 + 16, PY - 3, PX1 + 8, PY);
    };
    drawProg(0);
    txt(this, PX0 - 58, PY - 5, '한강 러닝', { px: 8, weight: 800, color: '#ffffff' }).setDepth(961);
    const progM = txt(this, PX1 + 20, PY - 5, '0m', { px: 8, weight: 800, color: '#ffd23f' }).setDepth(961);

    const def = { ...CAST.hana, outfit: this.gear };
    this.hero = this.char('hana', 190, this.ground, { scale: 3, def, key: 'run_hero' });
    this.hero.setDepth(400);
    this.hero.setData('ground', this.ground);
    this.play(this.hero, 'run', false);
    // 진행 방향으로 몸을 살짝 기울여 달리는 자세 (발이 기준점)
    this.hero.setAngle(5);
    // 달리는 발밑 먼지 + 몸 뒤로 지나가는 바람 선 + 가끔 땀방울
    this.time.addEvent({ delay: 240, loop: true, callback: () => !this.jumping && !this.done && this.puff(this.hero.x - 16, this.ground, 1) });
    this.time.addEvent({
      delay: 120, loop: true, callback: () => {
        if (this.done) return;
        const y = this.hero.y - Phaser.Math.Between(40, 170);
        const l = this.add.rectangle(this.hero.x - 46, y, Phaser.Math.Between(14, 26), 1.5, 0xffffff, 0.75).setOrigin(1, 0.5).setDepth(390);
        this.tweens.add({ targets: l, x: l.x - 60, alpha: 0, duration: 320, onComplete: () => l.destroy() });
      },
    });
    this.time.addEvent({
      delay: 1700, loop: true, callback: () => {
        if (this.done) return;
        const d = this.add.image(this.hero.x - 18, this.hero.y - 150, 'px').setTint(0xbfe8ff).setScale(2, 3).setDepth(410);
        this.tweens.add({ targets: d, x: d.x - 14, y: d.y + 18, alpha: 0, duration: 500, onComplete: () => d.destroy() });
      },
    });
    ambientFor(this, 'hangang');
    this.addHud();
    await this.reveal();
    const box = DialogBox.mission(this, '러닝 장비 갖추고 한강 달리기', 'Gear up and run along the Hangang');
    if (!director.auto) uiTag(this, 320, 352, 'SPACE · ↑ · TAP  ·  점프해서 콘을 피해요  Jump over the cones', { bg: PAL.ink, oy: 1, pop: true });
    this.lives = new Lives(this);

    // 트랙 위에 놓인 러닝 장비 (달려가며 줍기)
    const plan: [string, number, number][] = [
      ['cap', 560, 100], ['water', 980, 40], ['runvest', 1420, 100], ['runjacket', 2000, 100], ['water', 2280, 40],
    ];
    if (!this.textures.exists('cone')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0x2a1a14); g.fillRect(0, 15, 14, 3); g.fillRect(4, 0, 6, 16); g.fillRect(2, 6, 10, 10);
      g.fillStyle(0xff7a1a); g.fillRect(5, 1, 4, 15); g.fillRect(3, 7, 8, 9);
      g.fillStyle(0xffffff); g.fillRect(4, 5, 6, 2); g.fillRect(3, 10, 8, 2);
      g.fillStyle(0xffb070); g.fillRect(5, 1, 1, 14);
      g.fillStyle(0x3a3a46); g.fillRect(1, 15, 12, 2);
      g.generateTexture('cone', 14, 18);
      g.destroy();
    }
    this.cones = [780, 1200, 1720, 2150].map((x) => this.add.image(x, this.ground + 1, 'cone').setOrigin(0.5, 1).setDepth(440).setScale(1.7));
    plan.forEach(([id, x, xp]) => {
      const sh = this.add.ellipse(x, this.ground + 1, 24, 5, 0x1a1030, 0.25).setDepth(445);
      const o = this.add.image(x, this.ground - 14, 'items2', id).setDepth(450).setScale(0.6);
      o.setData('shadow', sh);
      this.tweens.add({ targets: o, y: o.y - 4, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.InOut' });
      this.items.push({ o, id, xp });
    });
    // 결승 테이프
    const FIN = 2520;
    const finish = this.add.container(FIN, 0).setDepth(430);
    const fg = this.add.graphics();
    fg.fillStyle(0x1e2a50); fg.fillRect(-60, 200, 5, this.ground - 200); fg.fillRect(55, 200, 5, this.ground - 200);
    fg.fillStyle(0xff5fa2); fg.fillRect(-58, 200, 116, 18);
    fg.fillStyle(0xffffff); fg.fillRect(-58, 232, 116, 3);
    finish.add([fg, pixText(this, 0, 209, [{ t: 'FINISH  결승', font: 'g9', color: '#ffffff' }])]);

    const jump = () => {
      if (this.jumping || this.done) return;
      this.jumping = true;
      this.vy = -420;
      sfx.jump();
      this.puff(this.hero.x, this.ground, 3);
    };
    this.input.on('pointerdown', jump);
    this.input.keyboard?.on('keydown-SPACE', jump);
    this.input.keyboard?.on('keydown-UP', jump);

    let dist = 0;
    const onUpdate = (_t: number, dt: number) => {
      if (this.done) return;
      const d = (this.speed * dt) / 1000;
      dist += d;
      const pr = Math.min(1, dist / (FIN - 190));
      drawProg(pr);
      progM.setText(`${Math.round(pr * 5000).toLocaleString()}m`);
      track.tilePositionX += d;
      rail.tilePositionX += d * 0.95;
      deck.tilePositionX += d;
      pillars.forEach((p) => { p.x -= d; if (p.x < -80) p.x += 6 * 310; });
      finish.x -= d;
      far.x = Math.max(-200, -dist * 0.07);
      // 점프 물리
      if (this.jumping) {
        this.vy += 1200 * (dt / 1000);
        this.hero.y += this.vy * (dt / 1000);
        this.hero.setFrame('run0');
        if (this.hero.y >= this.ground) {
          this.hero.y = this.ground; this.jumping = false; this.play(this.hero, 'run', false);
          this.tweens.add({ targets: this.hero, scaleY: this.hero.scaleX * 0.85, yoyo: true, duration: 70 });
          this.puff(this.hero.x, this.ground, 3);
        }
      }
      for (const it of this.items) {
        if (!it.o.active) continue;
        it.o.x -= d;
        (it.o.getData('shadow') as Phaser.GameObjects.Ellipse).x = it.o.x;
        if (Math.random() < 0.03) sparkles(this, it.o.x, it.o.y - 8, 2, [0xffffff, 0xfff3b0], 8);
        if (Math.abs(it.o.x - this.hero.x) < 20 && this.hero.y > this.ground - 40) this.collect(it);
      }
      for (const c of this.cones) {
        if (!c.active) continue;
        c.x -= d;
        const dx = c.x - this.hero.x;
        if (director.auto && !this.jumping && dx > 40 && dx < 60) jump();
        if (Math.abs(dx) < 14 && this.hero.y > this.ground - 26 && this.time.now > this.hurt) {
          this.hurt = this.time.now + 900;
          c.setActive(false);
          this.tweens.add({ targets: c, angle: 80, x: c.x + 24, y: c.y + 2, duration: 300 });
          sfx.wrong();
          this.cameras.main.shake(120, 0.004);
          this.mistakes++;
          this.lives?.lose();
          this.emote(this.hero, '💧');
          floatText(this, this.hero.x, this.hero.y - 170, '아야!  Ouch!', '#ff8a8a', 12);
          this.tweens.add({ targets: this.hero, alpha: 0.3, yoyo: true, repeat: 3, duration: 90 });
        }
      }
      if (finish.x <= this.hero.x + 4 && !this.done) {
        // 결승 테이프 끊기
        sparkles(this, this.hero.x + 10, 220, 20, [0xff5fa2, 0xffffff, 0xffd23f], 30);
        fg.clear();
        fg.fillStyle(0x1e2a50); fg.fillRect(-60, 200, 5, this.ground - 200); fg.fillRect(55, 200, 5, this.ground - 200);
        fg.fillStyle(0xff5fa2); fg.fillRect(-58, 200, 116, 18);
        drawProg(1); progM.setText('5,000m');
        this.finish(box);
      }
    };
    this.events.on('update', onUpdate);
    this.events.once('shutdown', () => this.events.off('update', onUpdate));
  }

  collect(it: { o: Phaser.GameObjects.Image; id: string; xp: number }) {
    it.o.setActive(false);
    (it.o.getData('shadow') as Phaser.GameObjects.Ellipse).destroy();
    sparkles(this, it.o.x, it.o.y, 12);
    this.tweens.add({ targets: it.o, y: it.o.y - 40, scale: 1, alpha: 0, duration: 300 });
    this.award(it.xp, it.o.x, it.o.y - 20);
    const equip: Record<string, Partial<Outfit>> = {
      cap: { acc: ['cap'], accColor: 0x2f6fe0 },
      runvest: { top: 'runvest', topColor: 0xd9ff5a, topColor2: 0xffffff },
      runjacket: { top: 'runjacket', topColor: 0xe0383a },
    };
    if (equip[it.id]) {
      this.gear = { ...this.gear, ...equip[it.id], acc: [...(this.gear.acc ?? []), ...(equip[it.id].acc ?? [])] };
      this.redress(this.hero, CAST.hana, this.gear, 'run', ['run0', 'run1', 'run2', 'run3', 'cheer0', 'cheer1', 'idle0', 'idle1', 'blink', 'surprise']);
      floatText(this, this.hero.x, this.hero.y - 170, `${ITEM_NAMES[it.id]?.[0] ?? ''} 장착!  ${ITEM_NAMES[it.id]?.[1] ?? ''} ON`, '#d9ff5a', 12);
      this.emote(this.hero, '★');
      sfx.sparkle();
    } else {
      // 물은 달리며 꿀꺽
      floatText(this, this.hero.x, this.hero.y - 170, '물 한 모금!  Water break!', '#bfe8ff', 12);
      sfx.gulp();
    }
  }

  async finish(box: DialogBox) {
    this.done = true;
    this.play(this.hero, 'cheer');
    this.hero.setAngle(0);
    this.hero.y = this.ground;
    sfx.clear();
    hearts(this, this.hero.x, this.hero.y - 150, 5);
    floatText(this, this.hero.x + 40, this.hero.y - 190, 'GOAL!  완주!', '#ffd23f', 16);
    await this.wait(1100);
    box.destroy();
    await this.tip(
      '한강공원에서는 달리기, 자전거, 치킨 피크닉을 즐겨요. 편의점 즉석 라면도 꼭 먹어 봐요.',
      'At Hangang Park, people run, cycle and picnic with fried chicken. Try the instant ramyeon, too.',
    );
    await this.completeMission('hangang');
  }
}

// ---------------- #15 편의점 황금 조합 ----------------
// 꿀조합 완성품 텍스처: 재료 두 개를 한 그림으로 (손에 들고 먹을 때 사용)
function comboTex(scene: Phaser.Scene, key: string) {
  if (scene.textures.exists(key)) return key;
  const cv = document.createElement('canvas');
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const draw = (id: string, x: number, y: number, s = 1, alpha = 1) => {
    const r = item(scene, id);
    const f = scene.textures.getFrame(r.tex, r.frame);
    g.globalAlpha = alpha;
    g.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, f.cutWidth, f.cutHeight, Math.round(x), Math.round(y), Math.round(f.cutWidth * s), Math.round(f.cutHeight * s));
    g.globalAlpha = 1;
  };
  const ball = (x: number, y: number, r: number) => {
    g.fillStyle = '#2a1630'; g.beginPath(); g.arc(x, y, r + 1, 0, 7); g.fill();
    g.fillStyle = '#d98a2a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = '#f6c060'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.45, 0, 7); g.fill();
    g.fillStyle = '#5a2a14'; g.fillRect(Math.round(x + r * 0.1), Math.round(y + r * 0.1), 2, 2);
  };
  if (key === 'combo_ramen') {
    cv.width = 48; cv.height = 60;
    draw('cupramen2', 0, 8);
    // 녹아내리는 치즈 한 장
    g.fillStyle = '#2a1630'; g.fillRect(11, 5, 26, 14);
    g.fillStyle = '#ffd23f'; g.fillRect(12, 6, 24, 12);
    g.fillRect(14, 18, 5, 5); g.fillRect(28, 18, 4, 7);
    g.fillStyle = '#fff07a'; g.fillRect(13, 7, 10, 2);
    g.fillStyle = '#e8a820'; g.fillRect(25, 12, 3, 3); g.fillRect(17, 10, 2, 2);
  } else if (key === 'combo_icecream') {
    cv.width = 40; cv.height = 66;
    draw('icecream', 3, 4);
    ball(10, 14, 5); ball(28, 12, 5); ball(19, 6, 5.5); ball(21, 20, 4.5);
  } else if (key === 'combo_ball') {
    // 홈런볼 한 알
    cv.width = 16; cv.height = 16;
    ball(8, 8, 6);
  } else {
    // 블루레모네이드에 밀키스를 부어 섞은 한 컵 (빨대로 마심)
    const f = scene.textures.getFrame(item(scene, 'bluemix').tex, 'bluemix');
    cv.width = f.cutWidth; cv.height = f.cutHeight;
    draw('bluemix', 0, 0);
  }
  scene.textures.addCanvas(key, cv);
  return key;
}

export class Cvs extends BaseScene {
  constructor() { super('Cvs'); }

  async create() {
    this.bg('cvs');
    this.addHud();
    const [idL, , idA, idK] = pickCrew(['leo', 'hana', 'amara', 'kofi']);
    const leo = this.char(idL, 104, 338, { scale: 3 });
    const hana = this.char('hana', 212, 344, { scale: 3, outfit: OUTFITS.hanaLv2, key: 'cvs_hana' });
    const amara = this.char(idA, 320, 338, { scale: 3 });
    const kofi = this.char(idK, 528, 344, { scale: 3, def: { ...CAST[idK], outfit: { ...CAST[idK].outfit, acc: ['cap', 'sunglasses'], accColor: 0xf4f4f4 } }, key: `cvs_${idK}` });
    const all = [leo, hana, amara, kofi];
    all.forEach((s) => this.play(s, 'idle'));
    this.lead = hana;
    pigeons(this, [[400, 334], [440, 342], [610, 330]]);
    await this.reveal();
    const box = DialogBox.mission(this, '편의점 꿀조합 3가지 만들기', 'Make three convenience-store combos');
    await this.wait(600);
    // 보기 9개 = 정답 6개 + 오답 3개
    const bar = new Hotbar(this, ['bananamilk', 'cupramen2', 'milkis', 'samgak', 'homerunball', 'cheese', 'sausage', 'bluelemonade', 'icecream'].map((id) => item(this, id)), 0);
    // 진행 표시: 꿀조합 0/3
    const prog = uiTag(this, 10, 78, '꿀조합  0 / 3', { ox: 0, bg: PAL.ink, bold: true });
    const setProg = (n: number) => {
      const t = prog.list.find((o) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text | undefined;
      t?.setText(`꿀조합  ${n} / 3`);
      this.tweens.add({ targets: prog, scale: 1.15, yoyo: true, duration: 120 });
    };

    const recipes: { a: string; b: string; ko: string; en: string; who: Phaser.GameObjects.Sprite; pos: [number, number]; combo: string; drink?: boolean; hot?: boolean }[] = [
      { a: 'cupramen2', b: 'cheese', ko: '치즈 라면', en: 'Cheese ramyeon', who: hana, pos: [212, 120], combo: 'combo_ramen', hot: true },
      { a: 'homerunball', b: 'icecream', ko: '홈런볼 아이스크림', en: 'Home Run Ball ice cream', who: kofi, pos: [490, 120], combo: 'combo_icecream' },
      { a: 'bluelemonade', b: 'milkis', ko: '블루레모네이드 밀키스', en: 'Blue lemonade Milkis', who: amara, pos: [340, 120], combo: 'combo_soda', drink: true },
    ];
    let made = 0;
    // 받은 꿀조합은 손에 들고 있다가 미션이 끝나면 다 같이 먹는다
    const holding = new Map<Phaser.GameObjects.Sprite, Phaser.GameObjects.Image>();
    for (const r of recipes) {
      // SHOP 팝업
      const win = this.add.container(r.pos[0], r.pos[1]).setDepth(930);
      const g = this.add.graphics();
      panel(g, -78, -52, 156, 98);
      g.fillStyle(PAL.acc); g.fillRoundedRect(-74, -46, 2, 18, 1);
      g.fillStyle(PAL.line); g.fillRect(-72, -24.5, 144, 0.75);
      for (const sx of [-52, 14]) {
        g.fillStyle(0x000000, 0.3); rrect(g, sx - 1, -21, 40, 36, 5);
        g.fillStyle(PAL.surf2); rrect(g, sx - 0.5, -20.5, 39, 35, 4.5);
      }
      const title = txt(this, -66, -48, r.ko, { px: TYPE.body + 0.5, weight: 800, color: '#ffffff' });
      const titleEn = txt(this, -66, -35, r.en, { px: TYPE.cap, color: EN });
      const num = txt(this, 72, -47, `${made + 1}/3`, { px: TYPE.cap, weight: 800, color: '#ffd23f' }).setOrigin(1, 0);
      const plus = txt(this, 0, -5, '+', { bold: true, color: '#ffffff' }).setOrigin(0.5);
      const qs = [-33, 33].map((x) => txt(this, x, -5, '?', { px: 18, weight: 900, color: '#5c6690' }).setOrigin(0.5));
      const btn = this.add.graphics();
      btn.fillStyle(0x000000, 0.25); rrect(btn, -42, 21.5, 84, 19, 6);
      btn.fillStyle(PAL.accDk); rrect(btn, -42, 20.5, 84, 19, 6);
      btn.fillStyle(PAL.acc); rrect(btn, -42, 19, 84, 19, 6);
      const bt = txt(this, 0, 28.5, 'CREATE  만들기', { px: TYPE.small, weight: 800, color: '#ffffff', spacing: 1 }).setOrigin(0.5);
      win.add([g, title, titleEn, num, plus, btn, bt, ...qs]);
      this.lead = r.who;
      // 말풍선은 팝업 버튼을 가리지 않게 살짝 아래로
      const sb = this.say(r.who, `${r.ko} 만들어 줘!`, `${r.en}, please!`, 2000);
      sb.y += 10;
      win.setScale(0);
      this.tweens.add({ targets: win, scale: 1, duration: 300, ease: 'Back.Out' });
      const slotsX = [-33, 33];
      let n = 0;
      await this.choose(bar, [r.a, r.b], async (id) => {
        const from = bar.slotWorldPos(id);
        const tex = item(this, id);
        const it = this.add.image(from.x, from.y, tex.tex, tex.frame).setDepth(935).setScale(0.5);
        await new Promise<void>((ok) => this.tweens.add({ targets: it, x: r.pos[0] + slotsX[n], y: r.pos[1] - 5, duration: 350, ease: 'Quad.Out', onComplete: () => ok() }));
        qs[n].setVisible(false);
        win.add(it.setPosition(slotsX[n], -5));
        n++;
        sfx.pop();
      }, false, {
        time: 12,
        wrong: {
          bananamilk: ['바나나우유는 조합이 아니야', 'Banana milk is not in this combo.'],
          samgak: ['삼각김밥은 나중에!', 'Save the triangle gimbap for later!'],
          sausage: ['소시지는 이번 조합이 아니야', 'Sausage is not in this combo.'],
        },
      });
      // CREATE!
      await this.wait(director.auto ? 500 : 200);
      this.tweens.add({ targets: [btn, bt], scale: 0.9, yoyo: true, duration: 80 });
      sfx.select();
      await this.wait(150);
      sparkles(this, r.pos[0], r.pos[1], 24, undefined, 60);
      sfx.sparkle();
      // 완성품이 팝업에서 튀어나와 손님 손으로
      const ck = comboTex(this, r.combo);
      const prod = this.add.image(r.pos[0], r.pos[1] - 5, ck).setDepth(936).setScale(0);
      this.tweens.add({ targets: prod, scale: 1, angle: 360, duration: 380, ease: 'Back.Out' });
      this.tweens.add({ targets: win, scale: 0, duration: 250, delay: 200, onComplete: () => win.destroy() });
      floatText(this, r.pos[0], r.pos[1] - 34, `${r.ko}!`, '#ffe066', 14);
      made++;
      setProg(made);
      const done = uiTag(this, r.pos[0], r.pos[1] + 40, `꿀조합 완성! ${made}/3  Combo complete!`, { bg: PAL.acc, bold: true, pop: true });
      this.tweens.add({ targets: done, alpha: 0, delay: 1500, duration: 300, onComplete: () => done.destroy() });
      await this.wait(450);
      await new Promise<void>((ok) => this.tweens.add({ targets: prod, x: r.who.x + 10, y: r.who.y - 90, scale: 0.5, duration: 350, ease: 'Quad.In', onComplete: () => ok() }));
      prod.destroy();
      // 손님이 완성품을 받아 들고 기뻐함 (먹는 건 미션이 끝난 뒤 다 같이)
      r.who.anims.stop();
      r.who.setFrame(r.hot ? 'eatL1' : 'eat1');
      holding.set(r.who, this.hold(r.who, { tex: ck }, 32, !!r.hot));
      this.say(r.who, '고마워! 이따 같이 먹자', "Thanks! Let's eat together later.", 1400);
      all.forEach((s) => !holding.has(s) && this.play(s, 'cheer'));
      this.award(150, r.who.x, r.who.y - 110);
      hearts(this, r.who.x, r.who.y - 100, 3);
      await this.wait(1300);
      all.forEach((s) => !holding.has(s) && this.play(s, 'idle'));
      await this.wait(300);
    }
    bar.hide();
    // 미션 완료: 방금 만든 꿀조합 3개를 받은 사람들이 다 같이 먹음
    this.lead = hana;
    this.say(hana, '다 같이 먹자!', "Let's dig in!", 1200);
    this.play(leo, 'cheer');
    await this.wait(700);
    await Promise.all(recipes.map((r, i) => this.wait(i * 220).then(() => {
      holding.get(r.who)?.destroy();
      return this.eat(r.who, { tex: comboTex(this, r.combo) }, { hot: r.hot, drink: r.drink, size: 32, bites: r.drink ? 3 : 4, ...(r.hot ? { utensil: 'chopsticks', foodColor: 0xffd23f } as const : {}) });
    })));
    holding.clear();
    all.forEach((s, i) => { this.play(s, 'cheer'); this.hop(s, 8, i * 90); });
    await this.wait(800);
    prog.destroy();
    box.destroy();
    await this.tip(
      '편의점 꿀조합: 컵라면+치즈, 아이스크림+홈런볼, 블루레모네이드+밀키스. 24시간 열고, 먹고 갈 자리도 있어요.',
      'Store combos: cup ramyeon + cheese, ice cream + Home Run Ball, blue lemonade + Milkis. Open 24/7 with seats to eat in.',
    );
    await this.completeMission('cvs');
  }
}

export { bigText };

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
import { CAST, OUTFITS } from '../art/cast';
import type { CharDef, Outfit } from '../art/characters';

function tag(scene: Phaser.Scene, x: number, y: number, s: string) {
  return uiTag(scene, x, y, s, { bg: PAL.acc, bold: true, pop: true });
}

// ---------------- #13 PC방 ----------------
export class PcBang extends BaseScene {
  constructor() { super('PcBang'); }

  async create() {
    this.bg('pcbang2');
    this.addHud();
    const ids = ['leo', 'hana', 'amara'];
    const xs = [197, 320, 457];
    const defs: CharDef[] = ids.map((id) => {
      const d = id === 'hana' ? { ...CAST.hana, outfit: OUTFITS.hanaLv2 } : CAST[id];
      return { ...d, outfit: { ...d.outfit, acc: [...(d.outfit.acc ?? []), 'headphones'] } as Outfit };
    });
    const crew = ids.map((id, i) => {
      const s = this.char(id, xs[i], 244, { scale: 2, def: defs[i], key: `pc_${id}` });
      this.play(s, 'focus');
      this.time.delayedCall(800 + i * 400, () => this.emote(s, '💧'));
      return s;
    });
    this.lead = crew[1];
    // 전경 책상과 모니터 뒷면
    const desk = this.add.graphics().setDepth(500);
    const DY = 34;
    desk.fillStyle(0x0d0b1f); desk.fillRect(0, 246 + DY, W, 114);
    desk.fillStyle(0x23204a); desk.fillRect(0, 246 + DY, W, 4);
    desk.fillStyle(0x3ef0d8); desk.fillRect(0, 250 + DY, W, 1);
    desk.fillStyle(0x15132e); for (let x = 0; x < W; x += 80) desk.fillRect(x, 252 + DY, 1, 40);
    xs.forEach((x) => {
      desk.fillStyle(0x15132e); desk.fillRect(x - 46, 204 + DY, 92, 46);
      desk.fillStyle(0x2a2650); desk.fillRect(x - 44, 206 + DY, 88, 2);
      desk.fillStyle(0x3ef0d8, 0.6); desk.fillRect(x - 46, 204 + DY, 92, 1);
      desk.fillStyle(0x0d0b1f); desk.fillRect(x - 6, 250 + DY, 12, 6);
      // 키보드·마우스
      desk.fillStyle(0x2a2650); desk.fillRect(x - 34, 258 + DY, 60, 9);
      desk.fillStyle(0x6fd8ff, 0.5); for (let k = 0; k < 6; k++) desk.fillRect(x - 32 + k * 10, 260 + DY, 8, 2);
      desk.fillStyle(0xff5fa2, 0.6); desk.fillRect(x - 32, 265 + DY, 56, 1);
      desk.fillStyle(0x2a2650); desk.fillRect(x + 32, 260 + DY, 8, 9);
    });
    // 모니터 빛 깜빡임
    const glow = xs.map((x) => this.add.rectangle(x, 222, 90, 60, 0x6fd8ff, 0.08).setDepth(499).setBlendMode(Phaser.BlendModes.ADD));
    glow.forEach((gl, i) => this.tweens.add({ targets: gl, alpha: 0.2, yoyo: true, repeat: -1, duration: 200 + i * 70 }));
    this.time.addEvent({ delay: 180, loop: true, callback: () => sfx.typing() });

    await this.reveal();
    const box = DialogBox.mission(this, 'PC방에서 게임하며 야식 주문하기', 'Order snacks while gaming at a PC bang');
    tag(this, 330, 84, 'BONUS MISSION  ·  보너스 미션');
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
        await new Promise<void>((ok) => this.tweens.add({ targets: it, x: 560, y: 286, duration: 400, ease: 'Quad.Out', onComplete: () => ok() }));
        sfx.pop();
        crew.forEach((s) => { s.anims.stop(); s.setFrame('cheer0'); hearts(this, s.x, 120, 2); });
        await this.award(75, 560, 230);
      } else {
        const s = crew[r.who];
        await new Promise<void>((ok) => this.tweens.add({ targets: it, x: s.x + 18, y: 220, scale: 0.35, duration: 400, ease: 'Quad.Out', onComplete: () => ok() }));
        sfx.pop();
        this.play(s, 'eat');
        this.emote(s, '♥');
        this.tweens.add({ targets: it, x: s.x + 10, y: 204, yoyo: true, repeat: 3, duration: 330 });
        sparkles(this, s.x, 150, 10);
        await this.award(75, s.x, 120);
      }
      ask();
    }, true, { time: 10 });
    bar.hide();
    await this.wait(1200);
    box.destroy();
    await this.tip(
      '한국 PC방에서는 자리에서 라면, 핫도그, 음료를 주문해 먹을 수 있어요. 맛도 꽤 좋아요.',
      'At a Korean PC bang, you can order ramyeon, corn dogs and drinks right from your seat. They taste great, too.',
    );
    await this.completeMission('pcbang');
  }
}

// ---------------- #14 한강 러닝 (횡스크롤) ----------------
export class Hangang extends BaseScene {
  constructor() { super('Hangang'); }
  hero!: Phaser.GameObjects.Sprite;
  ground = 326;
  vy = 0;
  jumping = false;
  speed = 150;
  gear: Outfit = OUTFITS.run0;
  items: { o: Phaser.GameObjects.Image; id: string; xp: number }[] = [];
  cones: Phaser.GameObjects.Image[] = [];
  hurt = 0;
  done = false;

  makeTiles() {
    // 러닝 트랙 타일 (빨간 우레탄 + 흰 점선)
    if (!this.textures.exists('track')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0x5aa83a); g.fillRect(0, 0, 64, 6);
      g.fillStyle(0x3d7d2a); g.fillRect(0, 6, 64, 2);
      g.fillStyle(0xc0503a); g.fillRect(0, 8, 64, 30);
      g.fillStyle(0xd86a4c); g.fillRect(0, 8, 64, 2);
      g.fillStyle(0xffffff); g.fillRect(4, 22, 20, 2);
      g.fillStyle(0x9a3a2a); for (let i = 0; i < 12; i++) g.fillRect((i * 23) % 64, 12 + (i * 7) % 24, 1, 1);
      g.fillStyle(0x8c8c96); g.fillRect(0, 38, 64, 10);
      g.fillStyle(0x6c6c76); for (let x = 0; x < 64; x += 16) g.fillRect(x, 38, 1, 10);
      g.generateTexture('track', 64, 48);
      g.clear();
      // 난간
      g.fillStyle(0x2f3a5a); g.fillRect(0, 0, 32, 3); g.fillRect(0, 12, 32, 2);
      g.fillRect(2, 0, 3, 30); g.fillStyle(0x4a5a8a); g.fillRect(2, 0, 1, 30);
      g.fillStyle(0x2f3a5a); for (let x = 8; x < 32; x += 6) g.fillRect(x, 3, 1, 9);
      g.generateTexture('rail', 32, 30);
      g.destroy();
    }
  }

  async create() {
    // 씬 인스턴스는 재사용되므로 상태 초기화
    this.done = false; this.jumping = false; this.vy = 0; this.items = []; this.cones = []; this.hurt = 0; this.gear = OUTFITS.run0;
    this.makeTiles();
    const far = this.add.image(0, -20, 'hangang').setOrigin(0).setDepth(-100);
    far.setScale(H / far.height);
    // 유람선
    const boat = this.add.graphics({ x: 700, y: 214 }).setDepth(-90);
    boat.fillStyle(0x1a1430); boat.fillRect(-1, -9, 34, 11);
    boat.fillStyle(0xffffff); boat.fillRect(0, -8, 32, 6); boat.fillRect(6, -12, 18, 4);
    boat.fillStyle(0x3a7ad8); boat.fillRect(0, -2, 32, 3); boat.fillRect(8, -11, 2, 2); boat.fillRect(13, -11, 2, 2); boat.fillRect(18, -11, 2, 2);
    this.tweens.add({ targets: boat, x: -60, duration: 26000 });
    // 다리 위 지하철
    const train = this.add.graphics({ x: 900, y: 106 }).setDepth(-95);
    for (let c = 0; c < 4; c++) { train.fillStyle(0xd8dce8); train.fillRect(c * 26, 0, 24, 7); train.fillStyle(0x3aa86a); train.fillRect(c * 26, 4, 24, 1); train.fillStyle(0x2a3550); for (let w = 2; w < 22; w += 5) train.fillRect(c * 26 + w, 1, 3, 2); }
    this.time.delayedCall(4000, () => this.tweens.add({ targets: train, x: -120, duration: 6000 }));
    // 새 떼
    this.time.addEvent({
      delay: 2600, loop: true, callback: () => {
        for (let i = 0; i < 3; i++) {
          const b = this.add.graphics({ x: W + i * 18, y: 50 + i * 10 }).setDepth(-80);
          b.fillStyle(0xffffff); b.fillRect(0, 0, 3, 1); b.fillRect(3, 1, 2, 1); b.fillRect(5, 0, 3, 1);
          this.tweens.add({ targets: b, x: -30, y: b.y - 20, duration: 7000, onComplete: () => b.destroy() });
          this.tweens.add({ targets: b, scaleY: -1, yoyo: true, repeat: -1, duration: 200 });
        }
      },
    });
    const rail = this.add.tileSprite(0, 272, W, 30, 'rail').setOrigin(0).setDepth(100);
    const track = this.add.tileSprite(0, 312, W, 48, 'track').setOrigin(0).setDepth(100);
    // 다리 기둥 (잠수교) 전경
    const pillars = this.add.container(0, 0).setDepth(700);
    const mkPillar = (x: number) => {
      const g = this.add.graphics({ x, y: 0 });
      g.fillStyle(0x6a6e80); g.fillRect(0, 0, 42, H);
      g.fillStyle(0x8a8ea0); g.fillRect(0, 0, 6, H);
      g.fillStyle(0x4a4e60); g.fillRect(36, 0, 6, H);
      g.fillStyle(0x50546a); g.fillRect(-200, 0, 480, 26);
      g.fillStyle(0xf0f0f0); for (let k = -180; k < 260; k += 60) g.fillRect(k, 10, 26, 6);
      // 콘크리트 이음매와 그림자
      g.fillStyle(0x5a5e70); for (let y = 40; y < H; y += 46) g.fillRect(0, y, 42, 1);
      g.fillStyle(0x000000, 0.18); g.fillRect(0, 26, 42, 6);
      g.fillStyle(0x2a2e40); g.fillRect(-200, 24, 480, 2);
      pillars.add(g);
      pillars.add(this.add.image(x + 21, 124, bridgeSignTex(this)).setScale(2));
      pillars.add(pixText(this, x + 21, 125, [{ t: '잠수교', font: 'g11b', color: '#ffffff' }, { t: 'JAMSUGYO', font: 'g7', color: '#bcd6ff' }], { gap: 2, shadow: '#123a7a' }));
    };
    mkPillar(520); mkPillar(1500);
    uiTag(this, 320, 22, 'HANGANG RUN  ·  한강 러닝', { depth: 960 });

    const def = { ...CAST.hana, outfit: this.gear };
    this.hero = this.char('hana', 150, this.ground, { scale: 2, def, key: 'run_hero' });
    this.hero.setDepth(400);
    this.hero.setData('ground', this.ground);
    this.play(this.hero, 'run', false);
    ambientFor(this, 'hangang');
    this.addHud();
    await this.reveal();
    const box = DialogBox.mission(this, '러닝 장비 갖추고 한강 달리기', 'Gear up and run along the Hangang');
    if (!director.auto) uiTag(this, 320, 352, 'SPACE · ↑ · TAP  ·  점프해서 콘을 피해요  Jump over the cones', { bg: PAL.ink, oy: 1, pop: true });
    this.lives = new Lives(this);

    // 아이템 배치 (x는 출발 후 거리)
    const plan: [string, number, number, number][] = [
      ['heart', 500, 0, 20], ['cap', 800, 1, 100], ['heart', 1050, 0, 20], ['runvest', 1350, 1, 100],
      ['heart', 1600, 1, 20], ['water', 1850, 0, 40], ['runjacket', 2150, 1, 100],
    ];
    // 장애물: 트래픽 콘 (부딪히면 하트 -1)
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
    this.cones = [650, 1220, 1720, 2020].map((x) => this.add.image(x, this.ground + 1, 'cone').setOrigin(0.5, 1).setDepth(440).setScale(1.3));
    plan.forEach(([id, x, high, xp]) => {
      const o = this.add.image(x, high ? this.ground - 92 : this.ground - 44, 'items2', id).setDepth(450).setScale(0.5);
      this.tweens.add({ targets: o, y: o.y - 4, yoyo: true, repeat: -1, duration: 400 });
      this.items.push({ o, id, xp });
    });
    // 다른 러너·자전거
    this.time.delayedCall(3000, () => {
      const r = this.char('runner', -40, this.ground + 6, { scale: 2 });
      this.play(r, 'run');
      this.tweens.add({ targets: r, x: W + 60, duration: 5000, onComplete: () => r.destroy() });
    });

    const jump = () => {
      if (this.jumping || this.done) return;
      this.jumping = true;
      this.vy = -390;
      sfx.jump();
      this.puff(this.hero.x, this.ground, 2);
    };
    this.input.on('pointerdown', jump);
    this.input.keyboard?.on('keydown-SPACE', jump);
    this.input.keyboard?.on('keydown-UP', jump);

    let dist = 0;
    const onUpdate = (_t: number, dt: number) => {
      if (this.done) return;
      const d = (this.speed * dt) / 1000;
      dist += d;
      track.tilePositionX += d;
      rail.tilePositionX += d * 0.9;
      pillars.x -= d * 1.15;
      far.x = Math.max(-200, -dist * 0.07);
      // 점프 물리
      if (this.jumping) {
        this.vy += 1100 * (dt / 1000);
        this.hero.y += this.vy * (dt / 1000);
        this.hero.setFrame('run1');
        if (this.hero.y >= this.ground) {
          this.hero.y = this.ground; this.jumping = false; this.play(this.hero, 'run', false);
          // 착지 스쿼시 + 먼지
          this.tweens.add({ targets: this.hero, scaleY: this.hero.scaleX * 0.82, yoyo: true, duration: 70 });
          this.puff(this.hero.x, this.ground, 3);
        }
      }
      for (const it of this.items) {
        if (!it.o.active) continue;
        it.o.x -= d;
        // 자동 연출: 높은 아이템 앞에서 점프
        if (director.auto && !this.jumping && it.o.y < this.ground - 60 && it.o.x - this.hero.x < 95 && it.o.x - this.hero.x > 60) jump();
        if (Math.abs(it.o.x - this.hero.x) < 18 && Math.abs(it.o.y - (this.hero.y - 46)) < 40) this.collect(it);
      }
      for (const c of this.cones) {
        if (!c.active) continue;
        c.x -= d;
        const dx = c.x - this.hero.x;
        if (director.auto && !this.jumping && dx > 34 && dx < 52) jump();
        if (Math.abs(dx) < 11 && this.hero.y > this.ground - 20 && this.time.now > this.hurt) {
          // 콘에 걸려 휘청
          this.hurt = this.time.now + 900;
          c.setActive(false);
          this.tweens.add({ targets: c, angle: 80, x: c.x + 20, y: c.y + 2, duration: 300 });
          sfx.wrong();
          this.cameras.main.shake(120, 0.004);
          this.mistakes++;
          this.lives?.lose();
          this.emote(this.hero, '💧');
          floatText(this, this.hero.x, this.hero.y - 120, '아야!  Ouch!', '#ff8a8a', 12);
          this.tweens.add({ targets: this.hero, alpha: 0.3, yoyo: true, repeat: 3, duration: 90 });
        }
      }
      if (dist > 2500 && !this.done) this.finish(box);
    };
    this.events.on('update', onUpdate);
    this.events.once('shutdown', () => this.events.off('update', onUpdate));
  }

  collect(it: { o: Phaser.GameObjects.Image; id: string; xp: number }) {
    it.o.setActive(false);
    sparkles(this, it.o.x, it.o.y, 10);
    this.tweens.add({ targets: it.o, scale: 1, alpha: 0, duration: 250 });
    this.award(it.xp, it.o.x, it.o.y - 10);
    const equip: Record<string, Partial<Outfit>> = {
      cap: { acc: ['cap'], accColor: 0x2f6fe0 },
      runvest: { top: 'runvest', topColor: 0xd9ff5a, topColor2: 0xffffff },
      runjacket: { top: 'runjacket', topColor: 0xe0383a },
    };
    if (equip[it.id]) {
      this.gear = { ...this.gear, ...equip[it.id], acc: [...(this.gear.acc ?? []), ...(equip[it.id].acc ?? [])] };
      this.redress(this.hero, CAST.hana, this.gear, 'run', ['run0', 'run1', 'run2', 'run3', 'cheer0', 'cheer1', 'idle0', 'idle1', 'blink', 'surprise']);
      floatText(this, this.hero.x, this.hero.y - 120, `${ITEM_NAMES[it.id]?.[0] ?? ''} 장착!  ${ITEM_NAMES[it.id]?.[1] ?? ''} ON`, '#d9ff5a', 12);
      this.emote(this.hero, '★');
      sfx.sparkle();
    }
  }

  async finish(box: DialogBox) {
    this.done = true;
    this.play(this.hero, 'cheer');
    this.hero.y = this.ground;
    sfx.clear();
    hearts(this, this.hero.x, this.hero.y - 100, 4);
    await this.wait(900);
    box.destroy();
    await this.tip(
      '한강공원에서는 달리기, 자전거, 치킨 피크닉을 즐겨요. 편의점 즉석 라면도 꼭 먹어 봐요.',
      'At Hangang Park, people run, cycle and picnic with fried chicken. Try the instant ramyeon, too.',
    );
    // 남은 XP 보정 (점프 실패로 놓친 경우에도 스테이지 합계가 맞도록)
    await this.completeMission('hangang');
  }
}

// ---------------- #15 편의점 황금 조합 ----------------
export class Cvs extends BaseScene {
  constructor() { super('Cvs'); }

  async create() {
    this.bg('cvs');
    this.addHud();
    const leo = this.char('leo', 92, 312, { scale: 2 });
    const hana = this.char('hana', 152, 318, { scale: 2, outfit: OUTFITS.hanaLv2, key: 'cvs_hana' });
    const amara = this.char('amara', 214, 312, { scale: 2 });
    const kofi = this.char('kofi', 470, 318, { scale: 2, def: { ...CAST.kofi, outfit: { ...CAST.kofi.outfit, acc: ['cap', 'sunglasses'], accColor: 0xf4f4f4 } }, key: 'cvs_kofi' });
    [leo, hana, amara, kofi].forEach((s) => this.play(s, 'idle'));
    this.lead = hana;
    pigeons(this, [[300, 334], [560, 340], [600, 330]]);
    await this.reveal();
    const box = DialogBox.mission(this, '편의점 꿀조합 만들기', 'Make a convenience-store combo');
    await this.wait(600);
    const bar = new Hotbar(this, ['bananamilk', 'cupramen2', 'samgak', 'cheese', 'icecream', 'sausage', 'cookies', 'tteokbokki'].map((id) => item(this, id)), 0);

    const recipes: { a: string; b: string; ko: string; en: string; who: Phaser.GameObjects.Sprite; pos: [number, number] }[] = [
      { a: 'cupramen2', b: 'cheese', ko: '치즈 라면', en: 'Cheese ramyeon', who: hana, pos: [312, 150] },
      { a: 'cookies', b: 'icecream', ko: '쿠키 아이스크림', en: 'Cookie ice cream', who: kofi, pos: [470, 150] },
    ];
    for (const r of recipes) {
      // SHOP 팝업
      const win = this.add.container(r.pos[0], r.pos[1]).setDepth(930);
      const g = this.add.graphics();
      panel(g, -74, -52, 148, 98);
      g.fillStyle(PAL.acc); g.fillRoundedRect(-70, -46, 2, 18, 1);
      g.fillStyle(PAL.line); g.fillRect(-68, -24.5, 136, 0.75);
      for (const sx of [-52, 14]) {
        g.fillStyle(0x000000, 0.3); rrect(g, sx - 1, -21, 40, 36, 5);
        g.fillStyle(PAL.surf2); rrect(g, sx - 0.5, -20.5, 39, 35, 4.5);
      }
      const title = txt(this, -62, -48, r.ko, { px: TYPE.body + 0.5, weight: 800, color: '#ffffff' });
      const titleEn = txt(this, -62, -35, `RECIPE  ·  ${r.en}`, { px: TYPE.cap, weight: 700, color: EN, spacing: 0.5 });
      const plus = txt(this, 0, -5, '+', { bold: true, color: '#ffffff' }).setOrigin(0.5);
      const qs = [-33, 33].map((x) => txt(this, x, -5, '?', { px: 18, weight: 900, color: '#5c6690' }).setOrigin(0.5));
      const btn = this.add.graphics();
      btn.fillStyle(0x000000, 0.25); rrect(btn, -42, 21.5, 84, 19, 6);
      btn.fillStyle(PAL.accDk); rrect(btn, -42, 20.5, 84, 19, 6);
      btn.fillStyle(PAL.acc); rrect(btn, -42, 19, 84, 19, 6);
      const bt = txt(this, 0, 28.5, 'CREATE  만들기', { px: TYPE.small, weight: 800, color: '#ffffff', spacing: 1 }).setOrigin(0.5);
      win.add([g, title, titleEn, plus, btn, bt, ...qs]);
      this.lead = r.who;
      this.say(r.who, `${r.ko} 만들어 줘!`, `Make me some ${r.en.toLowerCase()}!`, 2000);
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
      }, false, { time: 12 });
      // CREATE!
      await this.wait(director.auto ? 500 : 200);
      this.tweens.add({ targets: [btn, bt], scale: 0.9, yoyo: true, duration: 80 });
      sfx.select();
      await this.wait(150);
      sparkles(this, r.pos[0], r.pos[1], 24, undefined, 60);
      sfx.sparkle();
      this.tweens.add({ targets: win, scale: 0, duration: 250, delay: 200, onComplete: () => win.destroy() });
      floatText(this, r.pos[0], r.pos[1] - 10, `${r.ko}!`, '#ffe066', 14);
      const done = uiTag(this, r.pos[0], r.pos[1] + 40, '꿀조합 완성!  Combo complete!', { bg: PAL.acc, bold: true, pop: true });
      this.tweens.add({ targets: done, alpha: 0, delay: 1500, duration: 300, onComplete: () => done.destroy() });
      this.play(r.who, 'eat');
      this.emote(r.who, '♥');
      hearts(this, r.who.x, r.who.y - 100, 3);
      [leo, amara].forEach((s) => s !== r.who && this.play(s, 'cheer'));
      await this.award(150, r.who.x, r.who.y - 110);
      await this.wait(900);
    }
    bar.hide();
    await this.wait(800);
    box.destroy();
    await this.tip(
      '편의점 꿀조합은 컵라면에 치즈, 아이스크림에 쿠키예요. 24시간 열고, 먹고 갈 자리도 있어요.',
      'Store combos: cheese in cup ramyeon and cookies on ice cream. Stores are open 24/7 with seats to eat in.',
    );
    await this.completeMission('cvs');
  }
}

export { bigText };

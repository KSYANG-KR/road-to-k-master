// Stage 1 (Lv.1 K-ROOKIE) 미션: 한옥 신발벗기 → 온돌 전통간식 → 찜질방 → 드레스코드(절/고궁/놀이공원)
import Phaser from 'phaser';
import { BaseScene, item } from '../core/BaseScene';
import { DialogBox, Hotbar, floatText, itemName, W, H, ZOOM } from '../core/ui';
import { sfx } from '../core/audio';
import { hearts, sparkles } from '../core/fx';
import { CAST, NPC, OUTFITS, fitGender } from '../art/cast';
import { shoeTex, beddingTex, eggTex } from '../art/props';
import type { Outfit } from '../art/characters';
import type { Timing } from '../core/widgets';

// ---------------- #07 한옥 신발 벗기 ----------------
export class HanokShoes extends BaseScene {
  constructor() { super('HanokShoes'); }

  // 댓돌 위에 벗어 둔 신발 (정리 결과에 따라 가지런히/삐뚤게)
  placeShoes(x: number, color: number, r: Timing) {
    const key = shoeTex(this, color);
    const im = this.add.image(x, 230, key).setOrigin(0.5, 1).setDepth(255).setAlpha(0);
    const angle = r === 'perfect' ? 0 : r === 'good' ? 6 : -18;
    const dx = r === 'miss' ? 6 : 0;
    this.tweens.add({ targets: im, y: 257, x: x + dx, angle, alpha: 1, duration: 260, ease: 'Bounce.Out' });
    if (r === 'perfect') this.time.delayedCall(260, () => sparkles(this, x, 250, 8, [0xffffff, 0xffe066], 14));
    sfx.pop();
    return im;
  }

  async create() {
    this.bg('hanok_ext');
    this.addHud();
    const hero = this.char('hana', -40, 312, { scale: 2, outfit: OUTFITS.hanaLv1 });
    const f1 = this.char('amara', -100, 318, { scale: 2 });
    const f2 = this.char('leo', -160, 322, { scale: 2 });
    await this.reveal();
    const box = DialogBox.mission(this, '실내에서 신발 벗기', 'Take off your shoes indoors');
    this.walk(f1, 150, 318, 90);
    this.walk(f2, 80, 322, 90);
    await this.walk(hero, 270, 312, 90);
    // 마루로 올라가려다 멈춤
    this.tweens.add({ targets: hero, x: 284, yoyo: true, duration: 150 });
    await this.wait(200);
    this.lead = hero;
    this.emote(hero, '!');
    sfx.wrong();
    await this.wait(300);
    this.say(hero, '잠깐! 들어가기 전에 뭘 해야 하지?', 'Wait, what do I do before going in?', 2400);
    await this.wait(600);

    const bar = new Hotbar(this, ['backpack', 'cap', 'sneaker', 'sunglasses', 'tshirt', 'water'].map((id) => item(this, id)), 0);
    await this.choose(bar, ['sneaker'], async () => { bar.hide(); }, false, {
      wrong: {
        backpack: ['가방은 들고 들어가도 괜찮아', 'You can keep your bag on.'],
        cap: ['모자 말고, 발을 봐!', 'Not the cap. Look at your feet!'],
        sunglasses: ['선글라스는 상관없어', 'Sunglasses don\'t matter here.'],
        tshirt: ['옷은 그대로 입어도 돼', 'Keep your clothes on.'],
        water: ['목마른 게 아니야', 'I\'m not thirsty.'],
      },
    });

    // 주인공: 댓돌에서 신발 정리 미니게임
    await this.walk(hero, 304, 312, 80);
    const r = await this.timing('신발을 가지런히', 'Line up your shoes');
    this.placeShoes(304, OUTFITS.hanaLv1.shoes, r);
    this.redress(hero, CAST.hana, { ...OUTFITS.hanaLv1, shoes: 0xf7f7f7 });
    if (r === 'miss') { this.emote(hero, '💧'); this.say(hero, '앗, 삐뚤어졌다', 'Oops, a bit messy.', 1400); }
    else { this.emote(hero, '♪'); this.say(hero, r === 'perfect' ? '완벽하게 정리했어!' : '이 정도면 깔끔해', r === 'perfect' ? 'Perfectly neat!' : 'Neat enough.', 1400); }
    await this.award(100, hero.x, hero.y - 110);
    this.tweens.add({ targets: hero, y: 246, duration: 350, ease: 'Quad.Out' });
    await this.wait(400);
    this.walk(hero, 320, 240, 70).then(() => this.tweens.add({ targets: hero, alpha: 0, scale: 0.9, duration: 400 }));

    // 친구들도 따라서
    const friends: [Phaser.GameObjects.Sprite, string, number][] = [[f1, 'amara', 330], [f2, 'leo', 278]];
    for (const [s, id, x] of friends) {
      const def = CAST[id];
      await this.walk(s, x, s.y, 110);
      this.placeShoes(x, def.outfit.shoes, 'perfect');
      this.redress(s, def, { ...def.outfit, shoes: 0xf7f7f7 });
      this.emote(s, '♪');
      this.award(25, s.x, s.y - 100);
      this.tweens.add({ targets: s, y: 246, duration: 350, ease: 'Quad.Out' });
      await this.wait(380);
      this.walk(s, 320 + (x - 304) / 4, 240, 70).then(() => this.tweens.add({ targets: s, alpha: 0, scale: 0.9, duration: 400 }));
      await this.wait(300);
    }
    await this.wait(900);
    box.destroy();
    await this.tip(
      '한국 집에서는 따뜻한 바닥(온돌)에 앉고 눕기 때문에 현관에서 신발을 벗어요. 벗은 신발은 가지런히 놓아요.',
      'Korean homes have heated floors (ondol) for sitting and sleeping, so shoes come off at the door, neatly lined up.',
    );
    await this.goto('HanokOndol', {}, 'fade');
  }
}

// ---------------- #08 온돌에 누워 전통 간식 먹기 ----------------
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
    const xs = [150, 320, 490];
    const bedCols: [number, number][] = [[0xf08ab0, 0xffffff], [0x5a9ae8, 0xffe066], [0x6cbf5a, 0xff8ab0]];
    const beds = xs.map((x, i) => this.add.image(x + 6, 298, beddingTex(this, bedCols[i][0], bedCols[i][1])).setOrigin(0.5, 1).setDepth(250).setScale(0, 1));
    const crew = ids.map((id, i) => this.char(id, xs[i] + 200, 284, { scale: 2, outfit: id === 'hana' ? { ...OUTFITS.hanaLv1, shoes: 0xf7f7f7 } : { ...CAST[id].outfit, shoes: 0xf7f7f7 } }));
    await this.reveal();
    // 이불 펴기
    beds.forEach((b, i) => this.tweens.add({ targets: b, scaleX: 1, delay: i * 200, duration: 400, ease: 'Back.Out', onStart: () => sfx.whoosh() }));
    await Promise.all(crew.map((s, i) => this.walk(s, xs[i], 284, 140)));
    // 베개 쪽(오른쪽)에 머리가 오도록 눕기
    crew.forEach((s) => { this.play(s, 'lie'); s.setFlipX(true).setDepth(300); s.y = 292; });
    this.lead = crew[0];
    crew.forEach((s, i) => this.emote(s, '♪', 300 + i * 200));
    sfx.pop();
    const box = DialogBox.mission(this, '온돌에 누워 전통 간식 먹기', 'Snack on Korean treats on a warm ondol');
    await this.wait(500);
    this.say(crew[0], '전통 간식 3개를 골라 줘!', 'Pick 3 traditional Korean snacks!', 2600);
    await this.wait(700);

    const bar = new Hotbar(this, ['chips', 'yakgwa', 'donut', 'tteok', 'cookies', 'persimmon'].map((id) => item(this, id)), 0);
    let n = 0;
    await this.choose(bar, ['yakgwa', 'tteok', 'persimmon'], async (id) => {
      const s = crew[n++];
      const ref = item(this, id);
      const from = bar.slotWorldPos(id);
      const it = this.add.image(from.x, from.y, ref.tex, ref.frame).setDepth(400).setScale(0.45);
      await new Promise<void>((ok) => this.tweens.add({ targets: it, x: s.x + 34, y: s.y - 20, scale: 0.32, duration: 380, ease: 'Quad.Out', onComplete: () => ok() }));
      sfx.pop();
      s.setFrame('lieEat');
      this.time.delayedCall(600, () => this.play(s, 'lie'));
      floatText(this, s.x + 10, s.y - 52, itemName(id) + '!', '#fff27a', 10);
      hearts(this, s.x + 16, s.y - 50, 3);
      this.emote(s, '♥');
      await this.award(50, s.x, s.y - 100);
    }, false, {
      wrong: {
        chips: ['과자는 편의점 간식이야', 'Chips are a convenience-store snack.'],
        donut: ['도넛은 전통 간식이 아니야', 'Donuts aren\'t traditional.'],
        cookies: ['쿠키 말고 전통 간식!', 'Not cookies. Something traditional!'],
      },
    });
    bar.hide();
    crew.forEach((s, i) => this.emote(s, '♥', i * 120));
    await this.award(50, 320, 160);
    await this.wait(900);
    box.destroy();
    await this.tip(
      '약과는 꿀과 참기름으로 만든 전통 과자예요. 떡과 곶감도 명절에 즐겨 먹어요.',
      'Yakgwa is a honey and sesame-oil cookie. Rice cakes and dried persimmons are holiday favorites, too.',
    );
    await this.completeMission('hanok');
  }
}

// ---------------- #09 찜질방: 식혜와 맥반석 계란 ----------------
export class Jjimjil extends BaseScene {
  constructor() { super('Jjimjil'); }

  // 이마에 계란 톡! (찜질방 국룰)
  async eggBonk(s: Phaser.GameObjects.Sprite, r: Timing) {
    const egg = this.add.image(s.x - 16, s.y - 30, eggTex(this)).setDepth(900);
    await new Promise<void>((ok) => this.tweens.add({ targets: egg, x: s.x, y: s.y - 82, duration: 300, ease: 'Quad.Out', onComplete: () => ok() }));
    sfx.hit();
    this.cameras.main.shake(r === 'miss' ? 220 : 80, r === 'miss' ? 0.006 : 0.002);
    s.anims.stop();
    s.setFrame(r === 'miss' ? 'surprise' : 'sit0');
    const label = r === 'miss' ? '아야!  Ouch!' : '톡!  Crack!';
    floatText(this, s.x + 24, s.y - 100, label, r === 'miss' ? '#ff8a8a' : '#ffd23f', 12);
    if (r === 'miss') this.emote(s, '💧'); else sparkles(this, s.x, s.y - 82, 8, [0xffffff, 0xffe066], 10);
    await this.wait(500);
    this.tweens.add({ targets: egg, x: s.x + 16, y: s.y - 30, duration: 250, onComplete: () => egg.destroy() });
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
    crew.forEach((s, i) => this.time.addEvent({ delay: 2600, loop: true, startAt: i * 500, callback: () => Math.random() < 0.4 && !this.bubble?.active && this.emote(s, '💧') }));
    await this.reveal();
    const box = DialogBox.mission(this, '찜질방 필수 간식 먹기', 'Try the must-have jjimjilbang snacks');
    await this.wait(500);
    this.say(crew[1], '찜질방에 왔으면 이 두 가지는 꼭 먹어야 해!', 'You have to try these two here!', 2400);
    await this.wait(700);
    const bar = new Hotbar(this, ['icedcoffee', 'sikhye', 'chips', 'eggs', 'soda', 'icecream'].map((id) => item(this, id)), 0);
    await this.choose(bar, ['sikhye', 'eggs'], async (id) => {
      sfx.sparkle();
      const ref = item(this, id);
      if (id === 'eggs') {
        const plate = this.add.image(325, 272, ref.tex, ref.frame).setDepth(400).setScale(0);
        this.tweens.add({ targets: plate, scale: 0.45, duration: 300, ease: 'Back.Out' });
      } else {
        crew.forEach((s, i) => {
          const from = bar.slotWorldPos(id);
          const it = this.add.image(from.x, from.y, ref.tex, ref.frame).setDepth(500).setScale(0.3);
          this.tweens.add({ targets: it, x: s.x + 14, y: s.y - 34, delay: i * 90, duration: 400, ease: 'Quad.Out' });
          this.time.delayedCall(450 + i * 90, () => { this.play(s, 'sitEat'); hearts(this, s.x, s.y - 90, 2); });
        });
      }
      floatText(this, 320, 190, itemName(id) + '!', '#fff27a', 12);
      await this.wait(700);
      await this.award(60, 320, 150);
    }, false, {
      wrong: {
        icedcoffee: ['커피 말고 찜질방 음료!', 'Not coffee. A jjimjilbang drink!'],
        chips: ['과자는 나중에 먹자', 'Chips can wait.'],
        soda: ['콜라 말고 전통 음료!', 'Not cola. Something traditional!'],
        icecream: ['사우나에선 너무 차가워', 'Too cold for the sauna.'],
      },
    });
    bar.hide();
    // 계란 이마 깨기 미니게임
    await this.wait(300);
    this.say(crew[1], '계란은 이마로 깨 먹는 거래!', 'You crack the egg on your forehead!', 1800);
    await this.wait(600);
    const r = await this.timing('이마로 계란 톡!', 'Crack it on your forehead!');
    await this.eggBonk(crew[1], r);
    crew.forEach((s, i) => { if (i !== 1) this.time.delayedCall(i * 120, () => { this.play(s, 'sitEat'); }); this.emote(s, '♥', i * 120); });
    await this.award(r === 'perfect' ? 80 : 50, 320, 150);
    await this.wait(900);
    box.destroy();
    await this.tip(
      '찜질방에서는 양머리 수건을 쓰고, 달콤한 식혜와 맥반석 계란을 먹는 게 정석이에요.',
      'At a jjimjilbang, wear the "sheep towel" and enjoy sweet sikhye with baked eggs.',
    );
    await this.completeMission('jjimjil');
  }
}

// ---------------- #10 드레스코드: 같은 앵글, 배경과 의상만 바뀜 ----------------
const DRESS: Record<string, { bg: string; ko: string; en: string; item: string; outfits: Outfit[]; tip: [string, string] }> = {
  temple: {
    bg: 'temple', ko: '절에 어울리는 옷 입기', en: 'Dress right for a temple', item: 'monkrobe',
    outfits: [OUTFITS.monk, OUTFITS.monk, OUTFITS.monk, OUTFITS.monk],
    tip: ['템플스테이에서는 수련복을 입고 명상과 예불을 체험해요. 경내에서는 조용히 다녀요.', 'On a temple stay, you wear practice robes and try meditation. Keep quiet on the grounds.'],
  },
  palace: {
    bg: 'palace', ko: '고궁에 어울리는 옷 입기', en: 'Dress right for a royal palace', item: 'hanbok',
    outfits: [
      OUTFITS.hanbokM(0xf4f4f4, 0x2a3a8a, 0x2a3a8a),
      OUTFITS.hanbokF(0xf6a6b8, 0x2b3a8c, 0xd83a5a),
      OUTFITS.hanbokF(0xf2d45a, 0x3a8a5a, 0xc23a32),
      OUTFITS.hanbokF(0xffffff, 0x8fd0f0, 0x3a7ad8),
    ],
    tip: ['한복을 입으면 경복궁 같은 고궁에 무료로 들어갈 수 있어요.', 'Wear hanbok and get free entry to royal palaces like Gyeongbokgung.'],
  },
  park: {
    bg: 'park', ko: '놀이공원에 어울리는 옷 입기', en: 'Dress right for a theme park', item: 'uniform',
    outfits: [OUTFITS.uniformM, OUTFITS.uniformF, OUTFITS.uniformF, OUTFITS.uniformF],
    tip: ['친구들과 교복을 빌려 입고 놀이공원에 가는 게 요즘 인기예요.', 'Renting school uniforms for a theme-park day with friends is a popular trend.'],
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
    const box = DialogBox.mission(this, v.ko, v.en);
    await this.wait(500);
    const bar = new Hotbar(this, ['hoodie', 'monkrobe', 'hanbok', 'uniform', 'runjacket'].map((id) => item(this, id)), 0);
    this.lead = crew[1];
    const elsewhere: [string, string] = ['그건 다른 곳에 더 어울려', 'That fits somewhere else.'];
    const wrong: Record<string, [string, string]> = {
      hoodie: ['후드티는 너무 평범해', 'A hoodie is too casual.'],
      runjacket: ['운동하러 온 게 아니야', 'We\'re not here to work out.'],
      monkrobe: elsewhere, hanbok: elsewhere, uniform: elsewhere,
    };
    await this.choose(bar, [v.item], async () => {
      bar.hide();
      await this.fx.wipeIn('flash');
      crew.forEach((s, i) => {
        this.redress(s, defs[i], fitGender(v.outfits[i], defs[i].id), i === 3 ? 'selfie' : 'idle');
        s.setFrame(['v1', 'cheer0', 'v0', 'selfie'][i]);
      });
      this.fx.wipeOut();
      sfx.sparkle();
      floatText(this, 320, 120, itemName(v.item) + '!', '#fff27a', 12);
      crew.forEach((s, i) => { sparkles(this, s.x, s.y - 110, 12, undefined, 50); this.hop(s, 10, i * 90); this.emote(s, i % 2 ? '♥' : '★', 200 + i * 100); });
      await this.wait(700);
      // 셀카 찰칵
      sfx.shutter();
      await this.fx.wipeIn('flash');
      this.fx.wipeOut();
      await this.award(this.missionXp(data.variant), 320, 140);
    }, false, { wrong });
    await this.wait(900);
    box.destroy();
    await this.tip(v.tip[0], v.tip[1]);
    await this.completeMission(data.variant);
  }
}

export { NPC };

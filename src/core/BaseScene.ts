// 모든 게임 씬의 공통 기반: 배경, 캐릭터, XP, 전환, 자동 연출
import Phaser from 'phaser';
import { bakeCharacter, handPos, CHAR_TEX_SCALE, FOOT_ORIGIN_Y, type CharDef, type Outfit } from '../art/characters';
import { CAST, NPC } from '../art/cast';
import { state, STAGES } from './state';
import { director } from './director';
import { FxScene, shake, sparkles, type Wipe } from './fx';
export type TexRef = { tex: string; frame?: string | number };
import { XpHud, missionClear, xpPop, floatText, setupCamera, txt, W, H, type Hotbar, type ItemRef } from './ui';
import { sfx } from './audio';
import { ambientFor } from './ambient';
import { speech, tipCard, timingGame, Lives, type Timing } from './widgets';

// 오답일 때 랜덤으로 보여줄 한/영 반응
const OOPS: [string, string][] = [['음, 그건 아닌 것 같아', 'Hmm, not that one.'], ['다른 걸 골라 볼까?', 'Let\'s try another one.'], ['앗, 그게 아니야', 'Oops, that\'s not it.']];

export const ATLASES = ['items1', 'items2', 'items3', 'items4', 'food', 'hansikfood', 'plane'];

export function item(scene: Phaser.Scene, id: string): ItemRef {
  for (const a of ATLASES) if (scene.textures.get(a).has(id)) return { id, tex: a, frame: id };
  throw new Error(`unknown item ${id}`);
}

export class BaseScene extends Phaser.Scene {
  hud?: XpHud;
  // 스크립트 중단 플래그 (씬 종료 시 async 연출이 계속 돌지 않게)
  alive = true;

  shadows: { s: Phaser.GameObjects.Sprite; e: Phaser.GameObjects.Ellipse }[] = [];
  // 오답일 때 '?' 말풍선을 띄울 주인공
  lead?: Phaser.GameObjects.Sprite;
  // 이번 미션에서 틀린 횟수 (별점 계산)
  mistakes = 0;
  lives?: Lives;
  bubble?: Phaser.GameObjects.Container;

  init() {
    setupCamera(this);
    this.shadows = [];
    this.lead = undefined;
    this.mistakes = 0;
    this.lives = undefined;
    this.bubble = undefined;
    this.events.off('update', this.syncShadows, this);
    this.events.on('update', this.syncShadows, this);
    this.alive = true;
    this.events.once('shutdown', () => (this.alive = false));
  }

  get fx(): FxScene {
    return this.scene.get('fx') as FxScene;
  }

  bg(key: string, x = 0, y = 0) {
    const im = this.add.image(x, y, key).setOrigin(0).setDepth(-100);
    // 고해상도 배경(논리 해상도의 2배 이상)은 화면 높이에 맞춰 축소 표시
    if (im.height >= H * 1.5) im.setScale(H / im.height);
    ambientFor(this, key);
    this.vignette();
    return im;
  }

  // 화면 가장자리를 살짝 어둡게 (배경과 UI가 한 장면처럼 묶이도록)
  vignette(depth = 850) {
    if (!this.textures.exists('vignette')) {
      const c = this.textures.createCanvas('vignette', W, H)!;
      const ctx = c.getContext();
      const gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.62);
      gr.addColorStop(0, 'rgba(20,12,44,0)');
      gr.addColorStop(1, 'rgba(20,12,44,0.38)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
      c.refresh();
    }
    return this.add.image(0, 0, 'vignette').setOrigin(0).setDepth(depth);
  }

  wait(ms: number) {
    return director.wait(this, ms);
  }

  // 캐릭터 스프라이트 (원점 = 발바닥). outfit을 주면 별도 키로 다시 굽는다.
  char(id: string, x: number, y: number, opts: { outfit?: Outfit; scale?: number; anim?: string; flip?: boolean; key?: string; def?: CharDef; noShadow?: boolean; hd?: boolean } = {}) {
    const def = opts.def ?? CAST[id] ?? NPC[id];
    // 크게(×3 이상) 보이는 캐릭터는 2배 해상도 텍스처
    const hd = opts.hd ?? (opts.scale ?? 1) >= 3;
    let key = `ch_${def.id}${hd ? '_hd' : ''}`;
    if (opts.outfit || opts.def) {
      key = (opts.key ?? `ch_${def.id}_${Math.random().toString(36).slice(2, 7)}`) + (hd ? '_hd' : '');
      bakeCharacter(this, def, opts.outfit, key, undefined, hd);
    } else if (!this.textures.exists(key)) bakeCharacter(this, def, undefined, undefined, undefined, hd);
    const s = this.add.sprite(x, y, key, 'idle0').setOrigin(0.5, FOOT_ORIGIN_Y);
    s.setData('tk', hd ? 2 : 1);
    s.setScale(((opts.scale ?? 1) * CHAR_TEX_SCALE) / (hd ? 2 : 1)).setFlipX(!!opts.flip);
    s.setDepth(y);
    if (opts.anim) this.play(s, opts.anim);
    // 발밑 그림자
    if (!opts.noShadow) {
      const sc = opts.scale ?? 1;
      const e = this.add.ellipse(x, y, 22 * sc, 5 * sc, 0x1a1030, 0.22);
      this.shadows.push({ s, e });
    }
    return s;
  }

  // 그림자를 캐릭터 발밑에 붙여둠 (점프 중엔 작아짐)
  syncShadows() {
    for (const { s, e } of this.shadows) {
      if (!s.active) { e.destroy(); continue; }
      const lift = s.getData('ground') !== undefined ? Math.max(0, s.getData('ground') - s.y) : 0;
      e.setPosition(s.x, (s.getData('ground') ?? s.y) - 1).setDepth(s.depth - 0.5);
      e.setVisible(s.visible && s.alpha > 0.3 && s.y < H + 4 && s.frame.name !== 'lie0' && s.frame.name !== 'lie1' && s.frame.name !== 'lieEat');
      e.setScale(1 - Math.min(0.5, lift / 120));
    }
    this.shadows = this.shadows.filter((x) => x.s.active);
  }

  // 카메라 이동/줌 (트윈 기반: 내장 pan 이펙트 대신 사용)
  camPan(x: number, y: number, duration: number, ease = 'Sine.easeInOut') {
    const cam = this.cameras.main;
    const o = { x: cam.midPoint.x, y: cam.midPoint.y };
    return new Promise<void>((ok) => this.tweens.add({ targets: o, x, y, duration, ease, onUpdate: () => cam.centerOn(o.x, o.y), onComplete: () => ok() }));
  }

  camZoom(z: number, duration: number, ease = 'Sine.easeInOut') {
    return new Promise<void>((ok) => this.tweens.add({ targets: this.cameras.main, zoom: z, duration, ease, onComplete: () => ok() }));
  }

  // 머리 위 감정 말풍선 (♥ ! ? ♪ … 💧)
  emote(s: Phaser.GameObjects.Sprite, kind: '♥' | '!' | '?' | '♪' | '…' | '💧' | '★', delay = 0) {
    const top = Math.max(80, s.y - s.displayHeight * 0.78);
    const colors: Record<string, string> = { '♥': '#ff4f8a', '!': '#ff8a1a', '?': '#5a7aff', '♪': '#2ab07a', '…': '#5a5a7a', '💧': '#3aa0ff', '★': '#f2b400' };
    this.time.delayedCall(delay, () => {
      if (!s.active) return;
      const c = this.add.container(s.x + 10, top).setDepth(980);
      const g = this.add.graphics();
      g.fillStyle(0x1a1430); g.fillRoundedRect(-8, -9, 16, 15, 4); g.fillTriangle(-4, 5, 2, 5, -6, 10);
      g.fillStyle(0xffffff); g.fillRoundedRect(-7, -8, 14, 13, 3); g.fillTriangle(-3, 4, 1, 4, -5, 8);
      let t: Phaser.GameObjects.GameObject;
      if (kind === '💧') {
        const d = this.add.graphics();
        d.fillStyle(0x3aa0ff); d.fillTriangle(0, -6, -3.2, 0, 3.2, 0); d.fillCircle(0, 0.5, 3.4);
        d.fillStyle(0xffffff, 0.7); d.fillCircle(-1.2, 0, 1);
        t = d;
      } else t = txt(this, 0, -1.5, kind, { px: 10, weight: 900, color: colors[kind] }).setOrigin(0.5);
      c.add([g, t]);
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, duration: 220, ease: 'Back.Out' });
      this.tweens.add({ targets: c, y: top - 3, yoyo: true, repeat: 2, duration: 180, delay: 220 });
      this.tweens.add({ targets: c, alpha: 0, scale: 0.6, delay: 1300, duration: 200, onComplete: () => c.destroy() });
      if (kind === '♥') sfx.pop();
    });
  }

  // 발밑 먼지 퐁
  puff(x: number, y: number, n = 3) {
    for (let i = 0; i < n; i++) {
      const p = this.add.circle(x + Phaser.Math.Between(-6, 6), y - 1, Phaser.Math.Between(2, 3), 0xffffff, 0.7).setDepth(y + 1);
      this.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-8, 8), y: y - Phaser.Math.Between(3, 7), scale: 1.8, alpha: 0, duration: 450, onComplete: () => p.destroy() });
    }
  }

  // 기뻐서 콩 뛰기 (스쿼시 & 스트레치)
  hop(s: Phaser.GameObjects.Sprite, height = 8, delay = 0) {
    const y0 = s.y, sx = s.scaleX, sy = s.scaleY;
    s.setData('ground', y0);
    this.tweens.chain({
      targets: s, delay,
      tweens: [
        { scaleY: sy * 0.88, scaleX: sx * 1.08, duration: 70 },
        { y: y0 - height, scaleY: sy * 1.08, scaleX: sx * 0.94, duration: 160, ease: 'Quad.Out' },
        { y: y0, scaleY: sy, scaleX: sx, duration: 150, ease: 'Quad.In' },
        { scaleY: sy * 0.92, scaleX: sx * 1.05, duration: 60, yoyo: true },
      ],
      onComplete: () => { s.setData('ground', undefined); s.setScale(sx, sy); },
    });
  }

  // 시트 키를 유지한 채 애니메이션 재생 (프레임 위상을 흐트러 군무가 기계적으로 보이지 않게)
  play(s: Phaser.GameObjects.Sprite, anim: string, randomStart = true) {
    const key = `${s.texture.key}:${anim}`;
    if (!this.anims.exists(key)) { s.setFrame(anim); return s; }
    s.play({ key, startFrame: randomStart ? Phaser.Math.Between(0, 1) : 0 });
    return s;
  }

  // 같은 스프라이트에 새 의상을 입힘
  redress(s: Phaser.GameObjects.Sprite, def: CharDef, outfit: Outfit, anim = 'idle', only?: string[]) {
    const key = `${s.texture.key.split('#')[0]}#${Math.random().toString(36).slice(2, 6)}`;
    bakeCharacter(this, def, outfit, key, only, s.getData('tk') === 2);
    s.setTexture(key, 'idle0');
    this.play(s, anim);
  }

  // 주인공 정의 (레벨별 의상)
  heroDef(): CharDef {
    return { ...CAST.hana, outfit: state.heroOutfit };
  }

  addHud() {
    const key = 'hud_hero';
    bakeCharacter(this, this.heroDef(), undefined, key);
    this.hud = new XpHud(this, key);
    return this.hud;
  }

  async award(xp: number, x: number, y: number) {
    xpPop(this, x, y, xp);
    state.xp = Math.min(1000, state.xp + xp);
    await this.hud?.animateTo(state.xp, 500);
  }

  // 캐릭터 기본 텍스처 1픽셀의 화면 크기 (고해상도 텍스처면 스프라이트 배율 × 2)
  tk(s: Phaser.GameObjects.Sprite, y = false) {
    return Math.abs(y ? s.scaleY : s.scaleX) * ((s.getData('tk') as number) ?? 1);
  }

  // 소품을 손에 들려 주기: 프레임이 바뀌어도 손끝을 따라다닌다 (size: 화면 픽셀 크기, left: 왼손, grip: 손이 잡는 지점)
  hold(s: Phaser.GameObjects.Sprite, id: string | TexRef, size = 14, left = false, grip: [number, number] = [0.5, 0.5]) {
    const ref = typeof id === 'string' ? item(this, id) : id;
    const im = this.add.image(s.x, s.y, ref.tex, ref.frame);
    const base = size / Math.max(im.width, im.height);
    im.setScale(base).setData('base', base);
    const follow = () => {
      if (!im.active || !s.active) { this.events.off('postupdate', follow); return; }
      const h = handPos(s.frame.name, left);
      if (!h) { im.setVisible(false); return; }
      const k = this.tk(s), ky = this.tk(s, true);
      // 두 손이 가슴 앞에 모일 때 겹치지 않게 살짝 벌림
      const spread = (left ? -3 : 3) * (s.flipX ? -1 : 1);
      im.setFlipX(s.flipX).setOrigin(s.flipX ? 1 - grip[0] : grip[0], grip[1]);
      im.setVisible(s.visible && s.alpha > 0.05);
      im.setPosition(s.x + ((s.flipX ? -h[0] : h[0]) + spread) * k, s.y + (h[1] - 3) * ky);
      im.setDepth(Math.max(s.depth, (s.getData('propDepth') as number) ?? 0) + (left ? 0.4 : 0.5));
    };
    this.events.on('postupdate', follow);
    follow();
    return im;
  }

  // 젓가락(면을 집은 / 빈) · 숟가락(밥을 뜬 / 빈) 텍스처. 손잡이는 오른쪽 아래, 끝은 왼쪽 위(입 쪽)
  utensilTex(kind: 'chopsticks' | 'spoon', loaded: boolean, food = 0xf2c25a) {
    const key = `ut_${kind}_${loaded ? 1 : 0}_${food.toString(16)}`;
    if (this.textures.exists(key)) return key;
    const cv = document.createElement('canvas');
    cv.width = 24; cv.height = 24;
    const g = cv.getContext('2d')!;
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
    const line = (x0: number, y0: number, x1: number, y1: number, c: string, w = 1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      g.fillStyle = c;
      for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), w, w);
    };
    if (kind === 'chopsticks') {
      // 한국식 납작한 쇠젓가락 두 짝
      line(21, 22, 6, 4, '#3a3a4a', 2); line(22, 20, 9, 2, '#3a3a4a', 2);
      line(21, 21, 7, 4, '#d8dce8'); line(22, 19, 10, 2, '#f4f6fc');
      if (loaded) {
        // 집어 올린 면발 (끝에서 아래로 늘어진 꼬불꼬불한 면)
        for (let k = 0; k < 4; k++) {
          const x0 = 5 + k * 2;
          for (let y = 3; y < 15 + (k % 2) * 3; y++) {
            const x = x0 + Math.round(Math.sin((y + k) * 0.9));
            g.fillStyle = '#5a3418'; g.fillRect(x - 1, y, 1, 1);
            g.fillStyle = hex(food); g.fillRect(x, y, 1, 1);
          }
        }
        g.fillStyle = '#ffe9a8'; g.fillRect(6, 5, 1, 2); g.fillRect(10, 8, 1, 2);
      }
    } else {
      // 숟가락: 자루 + 둥근 머리
      line(20, 22, 10, 9, '#3a3a4a', 3); line(20, 21, 10, 9, '#d8dce8', 2);
      g.fillStyle = '#3a3a4a'; g.beginPath(); g.ellipse(8, 7, 6, 4.5, -0.7, 0, 7); g.fill();
      g.fillStyle = '#e8ecf6'; g.beginPath(); g.ellipse(8, 7, 5, 3.5, -0.7, 0, 7); g.fill();
      g.fillStyle = '#ffffff'; g.fillRect(6, 5, 2, 1);
      if (loaded) {
        // 수북이 떠 올린 비빔밥 한 숟갈 (양념 밥 + 색색 나물이 숟가락 위로 봉긋)
        g.fillStyle = '#5a2a1a'; g.beginPath(); g.ellipse(8, 5, 7, 5.5, -0.7, 0, 7); g.fill();
        g.fillStyle = hex(food); g.beginPath(); g.ellipse(8, 5, 6, 4.5, -0.7, 0, 7); g.fill();
        g.fillStyle = '#fbf6ea'; g.fillRect(5, 3, 2, 2); g.fillRect(9, 6, 2, 1); g.fillRect(4, 6, 1, 1); g.fillRect(11, 3, 1, 1);
        const dots: [number, number, string][] = [[6, 1, '#3a9a4a'], [9, 2, '#f2c94c'], [11, 5, '#3a9a4a'], [7, 7, '#f2c94c'], [3, 4, '#ff9a3a'], [8, 4, '#ffffff']];
        dots.forEach(([x, y, c]) => { g.fillStyle = c; g.fillRect(x, y, 2, 2); });
        g.fillStyle = '#ffd7c2'; g.fillRect(6, 2, 1, 1);
      }
    }
    this.textures.addCanvas(key, cv);
    return key;
  }

  // 한 입씩 베어 문 음식 텍스처 (n 입 먹은 상태): 오른쪽 위부터 둥근 이빨 자국
  bitten(ref: TexRef, n: number): TexRef {
    if (n <= 0) return ref;
    const key = `bite_${ref.tex}_${ref.frame ?? ''}_${n}`;
    if (!this.textures.exists(key)) {
      const f = this.textures.getFrame(ref.tex, ref.frame);
      const w = f.cutWidth, h = f.cutHeight;
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const g = cv.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      g.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, w, h, 0, 0, w, h);
      g.globalCompositeOperation = 'destination-out';
      const r = Math.min(w, h) * 0.26;
      for (let k = 0; k < n; k++) {
        const cx = w * (0.98 - k * 0.24), cy = h * (0.06 + k * 0.12);
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
        // 이빨 자국 물결
        for (let t = -2; t <= 2; t++) {
          const a = 2.35 + t * 0.32;
          g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.2, 0, Math.PI * 2); g.fill();
        }
      }
      this.textures.addCanvas(key, cv);
    }
    return { tex: key };
  }

  // 손에 든 음식을 한 입씩 먹기: 베어 문 자국이 늘어나고 마지막 입에 사라짐 (음료는 꿀꺽꿀꺽)
  //  - utensil: 젓가락·숟가락으로 떠먹기. bowl이 있으면 상 위 그릇에서, 없으면 왼손에 든 컵(그릇)에서 떠서 입으로
  //  - 엎드린 자세(lie*)면 앞으로 내민 손에 들고 입으로 가져가 먹음
  async eat(s: Phaser.GameObjects.Sprite, id: string | TexRef, o: { bites?: number; size?: number; hot?: boolean; drink?: boolean; sit?: boolean; keep?: boolean; shrink?: boolean; noBite?: boolean; utensil?: 'chopsticks' | 'spoon'; bowl?: Phaser.GameObjects.Image; foodColor?: number } = {}) {
    const ref = typeof id === 'string' ? item(this, id) : id;
    const lie = s.frame.name.startsWith('lie');
    const sit = o.sit ?? s.frame.name.startsWith('sit');
    const ut = o.utensil;
    const cupInHand = !!ut && !o.bowl;
    const [holdF, mouthF] = lie ? ['lieHold', 'lieEat'] : o.bowl ? ['eatT1', 'eat0'] : sit ? ['sitEat1', 'sitEat0'] : cupInHand ? ['eatL1', 'eatL0'] : ['eat1', 'eat0'];
    s.anims.stop();
    s.setFrame(holdF);
    const kk = this.tk(s);
    // 그릇: 상 위 그릇 / 왼손 컵 / (도구 없이) 손에 든 음식
    const im = o.bowl ?? this.hold(s, ref, o.size ?? 16, cupInHand);
    const base = o.bowl ? o.bowl.scale : (im.getData('base') as number);
    if (!o.bowl) { im.setScale(0); this.tweens.add({ targets: im, scale: base, duration: 180, ease: 'Back.Out' }); }
    // 오른손 도구
    const utSize = Math.round(11 * kk);
    const full = ut ? this.utensilTex(ut, true, o.foodColor) : '';
    const empty = ut ? this.utensilTex(ut, false) : '';
    const tool = ut ? this.hold(s, { tex: full }, utSize, false, [0.78, 0.82]) : undefined;
    if (tool) { const tb = tool.getData('base') as number; tool.setScale(0); this.tweens.add({ targets: tool, scale: tb, duration: 180, ease: 'Back.Out' }); }
    const dipAngle = o.bowl ? (s.flipX ? 90 : -90) : 0;
    if (tool && o.bowl) { tool.setAngle(dipAngle); tool.setDepth(s.depth + 0.5); }
    const steamEv = o.hot ? this.time.addEvent({
      delay: 160, loop: true, callback: () => {
        if (!im.active || !im.visible) return;
        const p = this.add.image(im.x + Phaser.Math.Between(-4, 4), im.y - im.displayHeight / 2, 'px').setAlpha(0.75).setScale(1.5).setDepth(im.depth + 1);
        this.tweens.add({ targets: p, y: p.y - 22, x: p.x + Phaser.Math.Between(-5, 5), alpha: 0, scale: 2.5, duration: 1000, onComplete: () => p.destroy() });
      },
    }) : undefined;
    const bites = o.bites ?? 3;
    const words = o.drink ? ['꿀꺽!', 'Gulp!', '꿀꺽꿀꺽'] : ut === 'chopsticks' ? ['후루룩!', 'Slurp!', '후루룩'] : ['냠!', '냠냠', 'Yum!', '맛있어!'];
    const dir = s.flipX ? -1 : 1;
    const k = this.tk(s);
    const sx0 = s.scaleX, sy0 = s.scaleY;
    for (let b = 0; b < bites; b++) {
      await this.wait(300);
      if (!this.alive) break;
      // 입으로 가져가며 몸을 살짝 앞으로, 음식(음료)은 입 쪽으로 기울임
      s.setFrame(mouthF);
      if (!lie) this.tweens.add({ targets: s, angle: dir * 2.5, duration: 110, yoyo: true, hold: 160 });
      // 숟가락은 입 앞에서 수평으로 눕혀 떠 온 음식이 코가 아니라 입으로 들어가게
      if (tool) this.tweens.add({ targets: tool, angle: ut === 'spoon' ? -dir * 30 : 0, duration: 110 });
      if (!ut) this.tweens.add({ targets: im, angle: dir * (o.drink ? -32 : -14), duration: 110, yoyo: true, hold: 160 });
      await this.wait(tool ? 300 : 130);
      const mx = tool ? tool.x - dir * tool.displayWidth * 0.6 : im.x, my = tool ? tool.y - tool.displayHeight * 0.6 : im.y - im.displayHeight * 0.3;
      if (o.drink) {
        sfx.gulp();
        for (let q = 0; q < 3; q++) {
          const bub = this.add.image(mx + 4 + q * 4, my - 4, 'px').setTint(0xbfe8ff).setScale(2).setDepth(im.depth + 1);
          this.tweens.add({ targets: bub, y: bub.y - 16, alpha: 0, delay: q * 110, duration: 520, onComplete: () => bub.destroy() });
        }
        // 목으로 꿀꺽 넘어가는 출렁임
        this.tweens.add({ targets: im, scaleY: base * 0.88, yoyo: true, duration: 110 });
      } else if (tool) {
        // 떠 온 면·밥을 한 입에: 도구는 비고, 그릇은 조금씩 줄어듦
        sfx.munch();
        tool.setTexture(empty);
        if (o.bowl === undefined && o.shrink !== false) this.tweens.add({ targets: im, scaleY: base * 0.92, yoyo: true, duration: 90 });
      } else {
        sfx.munch();
        if (!o.noBite) {
          const last = b === bites - 1 && !o.keep;
          if (!last) { const t = this.bitten(ref, b + 1); im.setTexture(t.tex, t.frame); }
        } else if (o.shrink) this.tweens.add({ targets: im, scale: base * (1 - ((b + 1) / bites) * 0.5), duration: 90 });
        // 베어 문 자리에서 부스러기가 떨어짐
        for (let q = 0; q < 6; q++) {
          const c = this.add.image(mx + dir * 4 + Phaser.Math.Between(-6, 6), my, 'px').setScale(1.5).setTint(Phaser.Utils.Array.GetRandom([0xf5d29a, 0xe8a85a, 0xffffff, 0xd88a4a])).setDepth(im.depth + 1);
          this.tweens.add({ targets: c, x: c.x + Phaser.Math.Between(-12, 12), y: c.y + Phaser.Math.Between(14, 28), alpha: 0, duration: 540, ease: 'Quad.In', onComplete: () => c.destroy() });
        }
      }
      if (b % 2 === 0) floatText(this, s.x + dir * 18 * k, my - 10, words[(b / 2) % words.length], o.drink ? '#bfe8ff' : '#ffffff', 8 + Math.round(k * 2));
      await this.wait(200);
      s.setFrame(holdF);
      if (tool) this.tweens.add({ targets: tool, angle: o.bowl ? dipAngle : 0, duration: 110 });
      // 그릇에서 다시 한 젓가락(숟갈) 집기
      if (tool && b < bites - 1) this.time.delayedCall(180, () => tool.active && tool.setTexture(full));
      // 오물오물 씹기 (볼이 두 번 들썩)
      if (!o.drink) {
        this.tweens.chain({
          targets: s,
          tweens: [
            { scaleX: sx0 * 1.035, scaleY: sy0 * 0.965, duration: 80 },
            { scaleX: sx0, scaleY: sy0, duration: 80 },
            { scaleX: sx0 * 1.035, scaleY: sy0 * 0.965, duration: 80 },
            { scaleX: sx0, scaleY: sy0, duration: 80 },
          ],
        });
      }
    }
    steamEv?.remove();
    await this.wait(200);
    s.setScale(sx0, sy0).setAngle(0);
    if (tool) this.tweens.add({ targets: tool, scale: 0, alpha: 0, duration: 200, onComplete: () => tool.destroy() });
    if (o.bowl) { this.emote(s, '♥'); return im; }
    if (!o.keep) {
      sparkles(this, im.x, im.y, 6, [0xffffff, 0xffe066], 10);
      this.tweens.add({ targets: im, scale: 0, alpha: 0, duration: 200, onComplete: () => im.destroy() });
      // 다 먹고 한마디
      const yum: [string, string][] = o.drink ? [['캬~ 시원해!', 'Refreshing!'], ['달달해!', 'So sweet!']] : [['맛있다!', 'Delicious!'], ['최고야!', 'The best!']];
      const w = yum[Math.floor(Math.random() * yum.length)];
      const yy = s.y - s.displayHeight * 0.9;
      if (yy >= 90) floatText(this, s.x, yy, `${w[0]}\n${w[1]}`, '#ffd23f', 8 + Math.round(k * 2)).setAlign('center');
    }
    this.emote(s, '♥');
    return im;
  }

  async walk(s: Phaser.GameObjects.Sprite, x: number, y = s.y, speed = 60) {
    const d = Phaser.Math.Distance.Between(s.x, s.y, x, y);
    s.setFlipX(x < s.x);
    this.play(s, 'walk', false);
    this.puff(s.x, s.y, 2);
    const dust = this.time.addEvent({ delay: 280, loop: true, callback: () => Math.random() < 0.6 && this.puff(s.x - (s.flipX ? -6 : 6), s.y, 1) });
    await new Promise<void>((ok) => this.tweens.add({ targets: s, x, y, duration: (d / speed) * 1000, onUpdate: () => s.setDepth(s.y), onComplete: () => ok() }));
    dust.remove();
    this.play(s, 'idle');
  }

  // 씬 전환 (브릿지 효과 포함)
  async goto(key: string, data?: object, wipe: Wipe = 'fade') {
    if (!this.alive) return;
    this.alive = false;
    // 단일 씬 녹화 모드: 첫 씬이 끝나면 저장하고 멈춤
    if (director.only && director.rec && !director.stopped) {
      director.stopped = true;
      await this.fx.wipeIn(wipe, this);
      await director.stopRecording(`${director.start || this.scene.key}.webm`);
      this.game.loop.sleep();
      return;
    }
    await this.fx.wipeIn(wipe, this);
    this.scene.start(key, data);
  }

  // 새 씬이 열릴 때 덮개를 걷음
  reveal() {
    return this.fx.wipeOut(this);
  }

  // 미션 완료 → 맵 또는 레벨업으로
  async completeMission(key: string) {
    state.cleared.add(key);
    // 놓친 XP가 있어도 스테이지 합계(1000)가 맞도록 보정
    const expect = STAGES[state.stage].filter((m) => state.cleared.has(m.key)).reduce((a, m) => a + m.xp, 0);
    if (state.xp < expect) { state.xp = expect; await this.hud?.animateTo(expect, 400); }
    const got = Math.max(1, 3 - this.mistakes);
    state.stars[key] = Math.max(state.stars[key] ?? 0, got);
    this.lives?.hide();
    this.bubble?.destroy();
    await missionClear(this, got);
    if (state.stageDone()) {
      await this.goto(state.stage === 2 ? 'Finale' : 'LevelUp', {}, 'flash');
    } else {
      await this.goto('WorldMap', {}, 'fade');
    }
  }

  // 캐릭터 머리 위 한/영 말풍선 (ms 후 사라짐, 0이면 유지)
  say(s: Phaser.GameObjects.Sprite, ko: string, en = '', ms = 1800, icon?: ItemRef) {
    const b = speech(this, s.x, s.y - s.displayHeight * 0.8, ko, en, { icon });
    if (ms > 0) this.time.delayedCall(ms / director.speed, () => { if (b.active) this.tweens.add({ targets: b, alpha: 0, duration: 200, onComplete: () => b.destroy() }); });
    return b;
  }

  // 미션 끝에 보여주는 문화 팁 카드
  tip(ko: string, en: string) {
    return tipCard(this, ko, en);
  }

  // 타이밍 미니게임 (MISS면 별 하나 감점)
  async timing(ko: string, en: string): Promise<Timing> {
    const r = await timingGame(this, ko, en);
    if (r === 'miss') { this.mistakes++; this.lives?.lose(); }
    return r;
  }

  // 핫바에서 정답 아이템을 모두 고를 때까지 진행. 자동 모드에선 커서가 직접 움직여 고른다.
  //  - 하트 3개: 오답·시간 초과마다 하나씩 잃고 별점이 깎인다
  //  - 아이템별 오답 반응(wrong)과 제한 시간(time, 초)을 줄 수 있다
  choose(bar: Hotbar, correct: string[], onCorrect: (id: string) => Promise<void>, ordered = false, opts: { wrong?: Record<string, [string, string]>; time?: number } = {}) {
    const remaining = [...correct];
    let busy = false;
    let misses = 0;
    let hint: Phaser.GameObjects.Graphics | undefined;
    if (!this.lives) this.lives = new Lives(this);
    const limit = (opts.time ?? 15) * 1000;
    let left = limit;
    const clearHint = () => { hint?.destroy(); hint = undefined; };
    // 두 번 틀리면 정답 칸 위에 화살표 힌트
    const showHint = () => {
      clearHint();
      const i = bar.items.findIndex((it) => it.id === remaining[0]);
      if (i < 0) return;
      hint = this.add.graphics({ x: bar.slotX(i), y: bar.y - 22 }).setDepth(950);
      hint.fillStyle(0x14122a); hint.fillTriangle(-9, -12, 9, -12, 0, 1);
      hint.fillStyle(0xffd23f); hint.fillTriangle(-7, -11, 7, -11, 0, -1);
      this.tweens.add({ targets: hint, y: bar.y - 28, yoyo: true, repeat: -1, duration: 260, ease: 'Sine.InOut' });
    };
    const react = (ko: string, en: string) => {
      this.bubble?.destroy();
      if (this.lead?.active) this.bubble = this.say(this.lead, ko, en, 1600);
    };
    const miss = () => {
      this.mistakes++;
      this.lives?.lose();
      if (++misses >= 2) showHint();
    };
    // 제한 시간 게이지
    const timer = this.time.addEvent({ delay: 50, loop: true, callback: () => {
      if (busy || !bar.active || director.auto) { bar.setTimer(director.auto ? null : left / limit); return; }
      left -= 50;
      bar.setTimer(Math.max(0, left / limit));
      if (left <= 0) {
        sfx.wrong();
        react('시간이 다 됐어! 힌트 줄게', 'Time\'s up! Here\'s a hint.');
        miss(); showHint();
        left = limit;
      }
    } });
    return new Promise<void>((resolve) => {
      bar.onPick = async (id, slot) => {
        if (busy) return;
        const ok = ordered ? remaining[0] === id : remaining.includes(id);
        if (!ok) {
          sfx.wrong();
          shake(this, bar.slots[slot]);
          floatText(this, bar.slots[slot].x, bar.y - 4, '×', '#ff5f5f', 15);
          const w = opts.wrong?.[id] ?? Phaser.Utils.Array.GetRandom(OOPS);
          react(w[0], w[1]);
          if (this.lead) this.emote(this.lead, Math.random() < 0.5 ? '?' : '💧');
          miss();
          return;
        }
        misses = 0;
        clearHint();
        this.bubble?.destroy();
        busy = true;
        bar.enabled = false;
        remaining.splice(remaining.indexOf(id), 1);
        await onCorrect(id);
        left = limit;
        busy = false;
        bar.enabled = true;
        if (!remaining.length) { timer.remove(); bar.setTimer(null); resolve(); }
      };
      if (director.auto) {
        (async () => {
          for (const id of correct) {
            await bar.autoPick(id);
            while (busy || remaining.includes(id)) await this.wait(80);
          }
        })();
      }
    });
  }

  missionXp(key: string) {
    return STAGES.flat().find((m) => m.key === key)?.xp ?? 100;
  }
}

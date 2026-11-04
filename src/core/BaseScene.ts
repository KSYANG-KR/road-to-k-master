// 모든 게임 씬의 공통 기반: 배경, 캐릭터, XP, 전환, 자동 연출
import Phaser from 'phaser';
import { bakeCharacter, CHAR_TEX_SCALE, FOOT_ORIGIN_Y, type CharDef, type Outfit } from '../art/characters';
import { CAST, NPC } from '../art/cast';
import { state, STAGES } from './state';
import { director } from './director';
import { FxScene, shake, type Wipe } from './fx';
import { XpHud, missionClear, xpPop, floatText, setupCamera, txt, W, H, type Hotbar, type ItemRef } from './ui';
import { sfx } from './audio';
import { ambientFor } from './ambient';

export const ATLASES = ['items1', 'items2', 'items3', 'food', 'hansikfood', 'plane'];

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

  init() {
    setupCamera(this);
    this.shadows = [];
    this.lead = undefined;
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
    // 고해상도 배경(논리 해상도의 2배)은 절반으로 표시
    if (im.width >= W * 1.5) im.setScale(0.5);
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
  char(id: string, x: number, y: number, opts: { outfit?: Outfit; scale?: number; anim?: string; flip?: boolean; key?: string; def?: CharDef; noShadow?: boolean } = {}) {
    const def = opts.def ?? CAST[id] ?? NPC[id];
    let key = `ch_${def.id}`;
    if (opts.outfit || opts.def) {
      key = opts.key ?? `ch_${def.id}_${Math.random().toString(36).slice(2, 7)}`;
      bakeCharacter(this, def, opts.outfit, key);
    } else if (!this.textures.exists(key)) bakeCharacter(this, def);
    const s = this.add.sprite(x, y, key, 'idle0').setOrigin(0.5, FOOT_ORIGIN_Y);
    s.setScale((opts.scale ?? 1) * CHAR_TEX_SCALE).setFlipX(!!opts.flip);
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
    const top = s.y - s.displayHeight * 0.78;
    const colors: Record<string, string> = { '♥': '#ff4f8a', '!': '#ff8a1a', '?': '#5a7aff', '♪': '#2ab07a', '…': '#5a5a7a', '💧': '#3aa0ff', '★': '#f2b400' };
    this.time.delayedCall(delay, () => {
      if (!s.active) return;
      const c = this.add.container(s.x + 10, top).setDepth(980);
      const g = this.add.graphics();
      g.fillStyle(0x1a1430); g.fillRoundedRect(-8, -9, 16, 15, 4); g.fillTriangle(-4, 5, 2, 5, -6, 10);
      g.fillStyle(0xffffff); g.fillRoundedRect(-7, -8, 14, 13, 3); g.fillTriangle(-3, 4, 1, 4, -5, 8);
      const t = kind === '💧'
        ? this.add.text(0, -2, '💧', { fontSize: '9px' }).setOrigin(0.5)
        : txt(this, 0, -2, kind, { bold: true, color: colors[kind] }).setOrigin(0.5);
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
  redress(s: Phaser.GameObjects.Sprite, def: CharDef, outfit: Outfit, anim = 'idle') {
    const key = `${s.texture.key.split('#')[0]}#${Math.random().toString(36).slice(2, 6)}`;
    bakeCharacter(this, def, outfit, key);
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
    await missionClear(this);
    if (state.stageDone()) {
      await this.goto(state.stage === 2 ? 'Finale' : 'LevelUp', {}, 'flash');
    } else {
      await this.goto('WorldMap', {}, 'fade');
    }
  }

  // 핫바에서 정답 아이템을 모두 고를 때까지 진행. 자동 모드에선 커서가 직접 움직여 고른다.
  choose(bar: Hotbar, correct: string[], onCorrect: (id: string) => Promise<void>, ordered = false) {
    const remaining = [...correct];
    let busy = false;
    let misses = 0;
    let hint: Phaser.GameObjects.Graphics | undefined;
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
    return new Promise<void>((resolve) => {
      bar.onPick = async (id, slot) => {
        if (busy) return;
        const ok = ordered ? remaining[0] === id : remaining.includes(id);
        if (!ok) {
          sfx.wrong();
          shake(this, bar.slots[slot]);
          floatText(this, bar.slots[slot].x, bar.y - 4, '✕', '#ff5f5f');
          if (this.lead) this.emote(this.lead, Math.random() < 0.5 ? '?' : '💧');
          if (++misses >= 2) showHint();
          return;
        }
        misses = 0;
        clearHint();
        busy = true;
        bar.enabled = false;
        remaining.splice(remaining.indexOf(id), 1);
        await onCorrect(id);
        busy = false;
        bar.enabled = true;
        if (!remaining.length) resolve();
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

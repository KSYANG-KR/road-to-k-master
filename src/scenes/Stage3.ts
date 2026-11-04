// Stage 3 (Lv.3 K-MASTER) 미션: 한식당 리필 → 미용실 → 포토부스 인생샷 → K-POP 댄스
import Phaser from 'phaser';
import { BaseScene } from '../core/BaseScene';
import { DialogBox, panel, tag, txt, bigText, floatText, W, H, COL, PAL, INK, MUTED, ZOOM } from '../core/ui';
import { audioCtx, playMusic, sfx, stopMusic, TRACKS } from '../core/audio';
import { director } from '../core/director';
import { hearts, sparkles, confetti } from '../core/fx';
import { CAST, NPC, OUTFITS } from '../art/cast';
import { bakeCharacter, type CharDef, type HairStyle } from '../art/characters';

// 화면 위 픽셀 손 커서 (자동 연출용 클릭 표시)
async function autoClick(scene: BaseScene, x: number, y: number) {
  if (!director.auto) return;
  const hand = scene.add.text(x + 30, y + 30, '☝', { fontSize: '20px' }).setDepth(999).setOrigin(0.3, 0);
  await new Promise<void>((ok) => scene.tweens.add({ targets: hand, x, y, duration: 450, ease: 'Sine.Out', onComplete: () => ok() }));
  scene.tweens.add({ targets: hand, scale: 0.8, yoyo: true, duration: 90, onComplete: () => scene.time.delayedCall(300, () => hand.destroy()) });
  await scene.wait(120);
}

// ---------------- #18 한식당: 벨 → 종업원 → 반찬 리필 ----------------
export class Hansik extends BaseScene {
  constructor() { super('Hansik'); }

  async create() {
    this.bg('hansik');
    const james = this.char('james', 320, 294, { scale: 3 });
    this.play(james, 'idle');
    // 식탁 전경 (배경의 식탁 부분을 잘라 캐릭터 앞에 다시 그림)
    const tk = this.textures.get('hansik').getSourceImage().width / W;
    this.add.image(0, 0, 'hansik').setOrigin(0).setScale(1 / tk).setCrop(0, 252 * tk, W * tk, 108 * tk).setDepth(400);
    const put = (frame: string, x: number, y: number, s = 0.5, delay = 0) => {
      const o = this.add.image(x, y, 'hansikfood', frame).setScale(0).setDepth(450 + y);
      this.tweens.add({ targets: o, scale: s * 0.5, delay, duration: 260, ease: 'Back.Out', onStart: () => delay && sfx.pop() });
      return o;
    };
    put('bibimbap', 320, 266, 0.62);
    put('kimchi', 214, 286, 0.5);
    put('namul', 426, 286, 0.5);
    const bell = this.add.image(156, 272, 'food', 'callbell').setScale(0.5).setDepth(700).setInteractive({ useHandCursor: true });
    this.add.image(510, 270, 'food', 'sujeo').setScale(0.5).setDepth(700);
    this.addHud();
    await this.reveal();
    const box = DialogBox.mission(this, '식당에서 벨 누르고\n반찬 리필하기', 'Ring the bell for\nfree side dish refills!');
    this.tweens.add({ targets: bell, scale: 0.58, yoyo: true, repeat: -1, duration: 400 });

    // 1) 벨 누르기
    await new Promise<void>((ok) => {
      bell.once('pointerdown', () => ok());
      this.input.keyboard?.once('keydown-ENTER', () => ok());
      this.input.keyboard?.once('keydown-SPACE', () => ok());
      if (director.auto) this.wait(900).then(() => autoClick(this, bell.x, bell.y - 6)).then(ok);
    });
    this.tweens.killTweensOf(bell);
    bell.setScale(0.5);
    sfx.bell();
    this.tweens.add({ targets: bell, y: 275, yoyo: true, duration: 80 });
    sparkles(this, bell.x, bell.y - 10, 8, [0xffe066, 0xffffff], 20);
    james.setFrame('point');
    this.emote(james, '♪');
    await this.wait(500);

    // 2) 종업원 대화창 + 선택지
    const talk = this.add.container(250, 54).setDepth(960);
    const g = this.add.graphics();
    panel(g, 0, 0, 200, 64);
    panel(g, 206, 0, 64, 64, 0xffe3b8);
    g.fillStyle(PAL.cream2); g.fillRect(10, 30, 180, 1);
    bakeCharacter(this, NPC.server);
    const face = this.add.image(167, -27, 'ch_server', 'idle0').setOrigin(0).setScale(1.5).setCrop(26, 19, 44, 42);
    const q = txt(this, 12, 10, '무엇을 도와드릴까요?', { bold: true, color: INK });
    const opts = ['추가주문', '메뉴', '리필'];
    const optT = opts.map((o, i) => txt(this, 22 + i * 60, 39, o, { color: MUTED }));
    const cur = this.add.graphics({ x: 12, y: 45 });
    cur.fillStyle(PAL.ink); cur.fillTriangle(0, -5, 0, 5, 6, 0);
    cur.fillStyle(PAL.pink); cur.fillTriangle(1, -3, 1, 3, 4, 0);
    const nameTag = tag(this, 238, 62, '종업원', { bg: PAL.pink, depth: 0 });
    talk.add([g, face, q, ...optT, cur, nameTag]);
    talk.setScale(0);
    this.tweens.add({ targets: talk, scale: 1, duration: 250, ease: 'Back.Out' });
    let sel = 0;
    const setSel = (i: number, sound = true) => {
      sel = Phaser.Math.Clamp(i, 0, 2);
      this.tweens.killTweensOf(cur);
      cur.x = 12 + sel * 60;
      this.tweens.add({ targets: cur, x: cur.x + 2, yoyo: true, repeat: -1, duration: 260 });
      optT.forEach((t, k) => t.setColor(k === sel ? INK : MUTED).setFontFamily(k === sel ? 'Galmuri11B' : 'Galmuri11'));
      if (sound) sfx.move();
    };
    setSel(0, false);
    await new Promise<void>((ok) => {
      const onKey = (e: KeyboardEvent) => {
        if (director.auto) return;
        if (e.key === 'ArrowRight') setSel(sel + 1);
        if (e.key === 'ArrowLeft') setSel(sel - 1);
        if ((e.key === 'Enter' || e.key === ' ') && sel === 2) { window.removeEventListener('keydown', onKey); ok(); }
      };
      window.addEventListener('keydown', onKey);
      optT.forEach((t, i) => t.setInteractive({ useHandCursor: true }).on('pointerdown', () => { setSel(i); if (i === 2) { window.removeEventListener('keydown', onKey); ok(); } }));
      if (director.auto) (async () => { await this.wait(700); setSel(1); await this.wait(400); setSel(2); await this.wait(500); ok(); })();
    });
    sfx.select();
    q.setText('네~ 리필해 드릴게요!');
    optT.forEach((t) => t.setVisible(false)); cur.setVisible(false);
    await this.wait(700);
    this.tweens.add({ targets: talk, scale: 0, duration: 200 });

    // 3) 반찬이 늘어나며 상이 가득 참
    const more: [string, number, number, number][] = [
      ['sprouts', 150, 300, 0.5], ['tofu', 492, 300, 0.5], ['eggroll', 260, 312, 0.5], ['ricebowl', 380, 312, 0.42],
      ['stew', 566, 300, 0.45], ['kimchi', 80, 306, 0.45], ['namul', 320, 326, 0.42],
    ];
    this.play(james, 'eat');
    for (let i = 0; i < more.length; i++) {
      const [f, x, y, s] = more[i];
      put(f, x, y, s, 0);
      sfx.pop();
      if (i % 2 === 0) floatText(this, x, y - 40, `+${[50, 30, 40, 40][i / 2]}xp`, '#ffffff');
      await this.wait(260);
    }
    hearts(this, 320, 140, 5);
    this.emote(james, '♥');
    this.hop(james, 6);
    await this.award(250, 320, 120);
    james.anims.stop(); james.setFrame('cheer0');
    await this.wait(1400);
    box.destroy();
    await this.completeMission('hansik');
  }
}

// ---------------- #19 미용실: 헤어스타일 선택창 ----------------
const STYLES: HairStyle[] = ['bob', 'ponytail', 'bun', 'pigtails', 'short', 'curly', 'braid', 'long', 'messy'];

export class Salon extends BaseScene {
  constructor() { super('Salon'); }

  async create() {
    this.bg('salon');
    const seats = [145, 318, 478];
    const ids = ['leo', 'amara', 'hana'];
    const defs: CharDef[] = ids.map((id) => (id === 'hana' ? { ...CAST.hana, outfit: OUTFITS.hanaLv3 } : CAST[id]));
    const crew = ids.map((id, i) => {
      const st = this.char('stylist', seats[i] + 34, 290, { scale: 2 });
      st.setFrame('hold');
      this.tweens.add({ targets: st, y: 288, yoyo: true, repeat: -1, duration: 300 + i * 50 });
      const s = this.char(id, seats[i], 292, { scale: 2, def: defs[i], key: `salon_${id}` });
      // 미용 가운 (어깨부터 덮는 사다리꼴)
      const cape = this.add.graphics({ x: seats[i], y: 292 }).setDepth(293);
      cape.fillStyle(0x1a1430); cape.fillPoints([{ x: -14, y: -44 }, { x: 14, y: -44 }, { x: 33, y: -4 }, { x: -33, y: -4 }], true);
      cape.fillStyle(0xfafafa); cape.fillPoints([{ x: -12, y: -42 }, { x: 12, y: -42 }, { x: 31, y: -6 }, { x: -31, y: -6 }], true);
      cape.fillStyle(0xe2e2ea); cape.fillRect(-29, -12, 58, 6); cape.fillRect(-1, -40, 2, 30);
      cape.fillStyle(0xff8fc0); cape.fillRect(-10, -44, 20, 3);
      return { s, def: defs[i] };
    });
    this.addHud();
    await this.reveal();
    const box = DialogBox.mission(this, '케이뷰티로 변신하기', 'Get a K-BEAUTY makeover!');
    await this.wait(500);
    const picks: HairStyle[] = ['short', 'bun', 'ponytail'];
    for (let k = 0; k < crew.length; k++) {
      const { s, def } = crew[k];
      this.emote(s, '?');
      const style = await this.hairPopup(def, seats[k] < 320 ? seats[k] + 50 : seats[k] - 230, 70, picks[k]);
      // 드라이기 바람 + 변신
      sfx.whoosh();
      sparkles(this, s.x, s.y - 80, 24, undefined, 50);
      await this.wait(300);
      this.redress(s, { ...def, hair: style }, def.outfit, 'idle');
      s.anims.stop();
      s.setFrame('v0');
      sfx.sparkle();
      this.emote(s, '★');
      const t = tag(this, s.x, s.y - 150, '✦ NEW LOOK UNLOCKED', { bg: 0xe8303a });
      this.tweens.add({ targets: t, y: t.y - 8, alpha: 0, delay: 1200, duration: 400, onComplete: () => t.destroy() });
      await this.award(k === 2 ? 84 : 83, s.x, s.y - 110);
      await this.wait(400);
    }
    await this.wait(900);
    box.destroy();
    await this.completeMission('salon');
  }

  // 3x3 헤어스타일 선택 팝업
  hairPopup(def: CharDef, x: number, y: number, autoPick: HairStyle): Promise<HairStyle> {
    return new Promise((resolve) => {
      const win = this.add.container(x, y).setDepth(950);
      const g = this.add.graphics();
      panel(g, 0, 0, 180, 178);
      g.fillStyle(PAL.pink); g.fillRect(2, 2, 176, 17);
      g.fillStyle(0xffffff, 0.35); g.fillRect(2, 2, 176, 2);
      g.fillStyle(PAL.ink); g.fillRect(2, 19, 176, 1);
      for (let i = 0; i < 9; i++) {
        const cx = 34 + (i % 3) * 56, cy = 44 + Math.floor(i / 3) * 46;
        g.fillStyle(0xf6ead6); g.fillRect(cx - 26, cy - 22, 52, 44);
        g.fillStyle(0xffffff, 0.7); g.fillRect(cx - 26, cy - 22, 52, 1);
      }
      win.add(g);
      win.add(txt(this, 90, 4, 'CHOOSE YOUR HAIR', { bold: true, color: '#ffffff', stroke: '#a02a5a', strokeThickness: 2 }).setOrigin(0.5, 0));
      const cells: Phaser.GameObjects.Image[] = [];
      STYLES.forEach((st, i) => {
        const key = `hair_${def.id}_${st}`;
        bakeCharacter(this, { ...def, hair: st }, def.outfit, key, ['idle0']);
        const cx = 34 + (i % 3) * 56, cy = 44 + Math.floor(i / 3) * 46;
        const im = this.add.image(cx - 48, cy - 40, key, 'idle0').setOrigin(0).setScale(1).setCrop(22, 18, 52, 44);
        cells.push(im);
        win.add(im);
        win.add(txt(this, cx + 18, cy + 10, `${i + 1}`, { size: 9, color: '#8a7a6a' }));
        const hit = this.add.zone(cx, cy, 50, 44).setOrigin(0.5).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => { setSel(i); done(); });
        win.add(hit);
      });
      const cursor = this.add.graphics();
      win.add(cursor);
      let sel = 4;
      const setSel = (i: number) => {
        sel = Phaser.Math.Clamp(i, 0, 8);
        cursor.clear();
        const cx = 34 + (sel % 3) * 56, cy = 44 + Math.floor(sel / 3) * 46;
        cursor.lineStyle(3, COL.pink, 1);
        cursor.strokeRect(cx - 26, cy - 22, 52, 44);
        cursor.lineStyle(1, PAL.ink, 1);
        cursor.strokeRect(cx - 28, cy - 24, 56, 48);
        cursor.fillStyle(0xffffff); cursor.fillRect(cx - 27, cy - 23, 3, 3);
        sfx.move();
      };
      setSel(4);
      win.setScale(0);
      this.tweens.add({ targets: win, scale: 1, duration: 250, ease: 'Back.Out' });
      let finished = false;
      const onKey = (e: KeyboardEvent) => {
        if (director.auto) return;
        if (e.key === 'ArrowRight') setSel(sel + 1);
        if (e.key === 'ArrowLeft') setSel(sel - 1);
        if (e.key === 'ArrowDown') setSel(sel + 3);
        if (e.key === 'ArrowUp') setSel(sel - 3);
        if (e.key === 'Enter' || e.key === ' ') done();
      };
      const done = () => {
        if (finished) return;
        finished = true;
        window.removeEventListener('keydown', onKey);
        sfx.select();
        this.tweens.add({ targets: win, scale: 0, delay: 200, duration: 200, onComplete: () => win.destroy() });
        resolve(STYLES[sel]);
      };
      window.addEventListener('keydown', onKey);
      if (director.auto) (async () => {
        const target = STYLES.indexOf(autoPick);
        await this.wait(500);
        while (sel !== target) {
          const dr = Math.sign(Math.floor(target / 3) - Math.floor(sel / 3));
          setSel(dr ? sel + dr * 3 : sel + Math.sign(target - sel));
          await this.wait(260);
        }
        await this.wait(300);
        done();
      })();
    });
  }
}

// ---------------- #20 포토부스 인생샷 ----------------
export class PhotoBooth extends BaseScene {
  constructor() { super('PhotoBooth'); }

  async create() {
    this.cameras.main.setBackgroundColor('#f6d86a');
    // 큰 프레임(라이브) + 오른쪽 작은 프레임 4개
    const big = { x: 26, y: 46, w: 300, h: 250 };
    const smalls = [[340, 46], [484, 46], [340, 176], [484, 176]];
    const frameG = this.add.graphics().setDepth(1);
    const drawFrame = (x: number, y: number, w: number, h: number, c: number) => {
      frameG.fillStyle(0x1a1430); frameG.fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 6);
      frameG.fillStyle(c); frameG.fillRoundedRect(x, y, w, h, 4);
    };
    const bgCols = [0xe8503a, 0xf05a8a, 0x1f9a8a, 0x9a7af0];
    drawFrame(big.x, big.y, big.w, big.h, bgCols[0]);
    smalls.forEach(([x, y]) => { frameG.fillStyle(0xf0c84a); frameG.fillRoundedRect(x, y, 130, 120, 6); frameG.lineStyle(1, 0xd0a83a); frameG.strokeRoundedRect(x, y, 130, 120, 6); });
    // 라이브 프레임 내용
    const live = this.add.container(0, 0).setDepth(5);
    const deco = this.add.graphics();
    live.add(deco);
    const maskG = this.make.graphics({}, false).fillRoundedRect(big.x, big.y, big.w, big.h, 4);
    live.setMask(maskG.createGeometryMask());
    const defs: CharDef[] = [
      { ...CAST.amara, outfit: { ...CAST.amara.outfit, acc: ['sunglasses'] } },
      { ...CAST.leo, outfit: { ...CAST.leo.outfit, acc: ['sunglasses'], accColor: 0xff8a3a } },
      CAST.mei,
    ];
    const pplX = [96, 176, 256];
    const ppl = defs.map((d, i) => {
      const s = this.char(d.id, pplX[i], 352 + (i === 1 ? 6 : 0), { scale: 4, def: d, key: `pb_${d.id}`, noShadow: true });
      live.add(s);
      return s;
    });
    const poses = [['v1', 'v0', 'wink'], ['cheer0', 'surprise', 'v1'], ['chin', 'v0', 'cheer1'], ['selfie', 'v1', 'eat1']];
    const setPose = (k: number) => ppl.forEach((s, i) => s.setFrame(poses[k][i] === 'wink' ? 'v0' : poses[k][i]));
    const drawDeco = (k: number) => {
      deco.clear();
      deco.fillStyle(bgCols[k]); deco.fillRect(big.x, big.y, big.w, big.h);
      deco.fillStyle(0xffffff, 0.5);
      for (let i = 0; i < 9; i++) deco.fillRect(big.x + 20 + ((i * 67) % 260), big.y + 14 + ((i * 41) % 120), i % 2 ? 3 : 5, i % 2 ? 3 : 5);
      deco.fillStyle(0xffe066);
      for (let i = 0; i < 5; i++) { const px = big.x + 30 + i * 55, py = big.y + 30 + (i % 2) * 40; deco.fillRect(px, py - 3, 1, 7); deco.fillRect(px - 3, py, 7, 1); }
    };
    drawDeco(0); setPose(0);
    // 대기 중 움직임
    const bob = this.time.addEvent({ delay: 300, loop: true, callback: () => ppl.forEach((s, i) => (s.y += (Math.random() < 0.5 ? -1 : 1) * (i % 2 ? 1 : 0))) });
    void bob;
    this.addHud();
    await this.reveal();
    const box = DialogBox.mission(this, '포토부스에서 인생샷 남기기', 'Snap the perfect shot!', 10, 8, 220);
    box.setDepth(990);
    txt(this, 175, 310, director.auto ? '' : 'SPACE / CLICK = 📸', { size: 10, color: '#3a2200' }).setOrigin(0.5).setDepth(10);
    for (let k = 0; k < 4; k++) {
      drawDeco(k);
      setPose(k);
      ppl.forEach((s) => this.tweens.add({ targets: s, scaleY: 2.1, yoyo: true, duration: 120 }));
      // 카운트다운
      for (const n of ['3', '2', '1']) {
        const c = bigText(this, big.x + big.w / 2, big.y + 40, n, 4, '#ffffff', '#1a1430').setDepth(20);
        sfx.move();
        this.tweens.add({ targets: c, scale: 6, alpha: 0, duration: director.auto ? 380 : 300, onComplete: () => c.destroy() });
        await this.wait(director.auto ? 420 : 350);
      }
      if (!director.auto) await director.waitInput(this);
      // 라이브 프레임을 먼저 캡처한 뒤 찰칵 + 플래시
      const img = await new Promise<HTMLImageElement>((ok) => this.game.renderer.snapshotArea(big.x * ZOOM, big.y * ZOOM, big.w * ZOOM, big.h * ZOOM, (im) => ok(im as HTMLImageElement)));
      sfx.shutter();
      const flash = this.add.rectangle(big.x, big.y, big.w, big.h, 0xffffff).setOrigin(0).setDepth(30);
      this.tweens.add({ targets: flash, alpha: 0, duration: 350, onComplete: () => flash.destroy() });
      const key = `shot_${k}_${Date.now()}`;
      this.textures.addImage(key, img);
      const [sx, sy] = smalls[k];
      const shot = this.add.image(big.x + big.w / 2, big.y + big.h / 2, key).setDepth(40);
      this.tweens.add({ targets: shot, x: sx + 65, y: sy + 60, scale: 112 / big.h / ZOOM, angle: k % 2 ? 2 : -2, duration: 450, ease: 'Cubic.Out' });
      hearts(this, sx + 65, sy + 40, 2);
      // 사진 위 손그림 스티커
      const stk = txt(this, sx + 65 + Phaser.Math.Between(-40, 40), sy + 20 + Phaser.Math.Between(0, 60), Phaser.Utils.Array.GetRandom(['♥', '★', '✿', 'LOVE', 'K!']), { bold: true, color: Phaser.Utils.Array.GetRandom(['#ff4f8a', '#ffffff', '#ffd23f']), stroke: '#1a1430', strokeThickness: 2 }).setOrigin(0.5).setDepth(45).setAngle(Phaser.Math.Between(-15, 15)).setScale(0);
      this.tweens.add({ targets: stk, scale: 1.2, delay: 450, duration: 200, ease: 'Back.Out' });
      await this.award(50, sx + 65, sy + 20);
      await this.wait(300);
    }
    confetti(this, 60);
    await this.wait(1500);
    box.destroy();
    await this.completeMission('photo');
  }
}

// ---------------- #21 K-POP 댄스 리듬게임 ----------------
const LANES = ['left', 'down', 'up', 'right'] as const;
const LANE_ANGLE = { left: 0, down: -90, up: 90, right: 180 };
const LANE_COL = [0xff5fa2, 0x6ff0ff, 0x7dff8a, 0xffd23f];

function makeArrowTex(scene: Phaser.Scene) {
  if (scene.textures.exists('arrow')) return;
  // 왼쪽을 가리키는 픽셀 화살표 (회전해서 사용)
  const A = [
    '......##..........',
    '.....#WW#.........',
    '....#WWW#.........',
    '...#WWWW#########.',
    '..#WWWWWWWWWWWWWW#',
    '.#WWWWWWWWWWWWWWW#',
    '#WWWWWWWWWWWWWWWW#',
    '.#WWWWWWWWWWWWWWW#',
    '..#WWWWWWWWWWWWWW#',
    '...#WWWW#########.',
    '....#WWW#.........',
    '.....#WW#.........',
    '......##..........',
  ];
  const g = scene.make.graphics({}, false);
  A.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '#') { g.fillStyle(0x1a1430); g.fillRect(x * 2, y * 2 + 5, 2, 2); }
    if (c === 'W') { g.fillStyle(0xffffff); g.fillRect(x * 2, y * 2 + 5, 2, 2); }
  }));
  g.generateTexture('arrow', 36, 36);
  g.destroy();
}

export class Dance extends BaseScene {
  constructor() { super('Dance'); }

  async create() {
    stopMusic();
    makeArrowTex(this);
    this.bg('stage');
    // 상단 간판
    const sign = this.add.container(320, 30).setDepth(50);
    const sg = this.add.graphics();
    panel(sg, -92, -14, 184, 28, 0x2a1a6a, 0x6ff0ff, 0x10082a);
    sign.add([sg, txt(this, 0, 0, '♥ K-POP DANCE ♥', { bold: true, color: '#ff8fd0' }).setOrigin(0.5).setScale(1.5)]);
    tag(this, 320, 54, 'FINAL STAGE', { bg: 0xe8303a, depth: 50 });
    // 댄서 6명
    const dancers: [string, CharDef][] = [
      ['mei', { ...CAST.mei, outfit: OUTFITS.dance(0xe8303a, 0xf4f4f4) }],
      ['leo', { ...CAST.leo, outfit: OUTFITS.dance(0x1e1e2a, 0x6a7a3a) }],
      ['hana', { ...CAST.hana, outfit: OUTFITS.hanaLv3 }],
      ['kofi', { ...CAST.kofi, outfit: OUTFITS.dance(0x2a9aaa, 0x1e1e2a, ['cap']) }],
      ['amara', { ...CAST.amara, outfit: OUTFITS.dance(0x1e1e2a, 0xf4f4f4) }],
      ['emma', { ...CAST.emma, outfit: OUTFITS.dance(0xf2d4a0, 0x4a74c0) }],
    ];
    const crew = dancers.map(([id, d], i) => {
      const s = this.char(id, 90 + i * 92, 318, { scale: 2, def: d, key: `dn_${id}` });
      s.setFrame('idle0');
      return s;
    });
    // 레인 & 리시버
    const laneX = [266, 302, 338, 374];
    const recvY = 92;
    const recv = laneX.map((x, i) => this.add.image(x, recvY, 'arrow').setAngle(LANE_ANGLE[LANES[i]]).setTint(0x8a80c0).setAlpha(0.8).setDepth(60));
    // 터치 버튼
    laneX.forEach((x, i) => {
      const b = this.add.image(220 + i * 66, 336, 'arrow').setAngle(LANE_ANGLE[LANES[i]]).setTint(LANE_COL[i]).setAlpha(0.6).setDepth(60).setInteractive();
      b.on('pointerdown', () => press(i));
    });
    const judge = bigText(this, 320, 150, '', 2, '#6fd0ff', '#1a1430').setDepth(70);
    const comboT = txt(this, 320, 196, '', { bold: true, color: '#ffffff', stroke: '#1a1430', strokeThickness: 2 }).setOrigin(0.5).setDepth(70).setScale(1.5);
    this.addHud();
    await this.reveal();
    const box = DialogBox.mission(this, '케이팝 댄스 배워서\n아이돌 되어보기', 'Learn K-POP dance\nand become an idol!', 10, 10, 170);
    await this.wait(800);

    // 채보: 댄스 트랙의 멜로디 음에서 생성 (8분음표 위치만)
    const tr = TRACKS.dance;
    const stepDur = 60 / tr.bpm / 4;
    const notes: { t: number; lane: number; o?: Phaser.GameObjects.Image; hit?: boolean; missed?: boolean }[] = [];
    for (let i = 16; i < tr.steps - 8; i++) if (tr.lead[i] && i % 2 === 0) notes.push({ t: i * stepDur, lane: tr.lead[i] % 4 });
    const t0 = playMusic('dance', true);
    const ac = audioCtx();
    const speed = 170; // px/s
    let combo = 0, hits = 0;
    const xpPer = 300 / notes.length;
    let pendingXp = 0;

    const doJudge = (n: (typeof notes)[0], diff: number) => {
      n.hit = true;
      n.o?.destroy();
      const perfect = Math.abs(diff) < 0.06;
      combo++; hits++;
      judge.setText(perfect ? 'PERFECT' : 'GOOD').setColor(perfect ? '#6fd0ff' : '#7dff8a');
      judge.setScale(2.6); this.tweens.add({ targets: judge, scale: 2, duration: 120 });
      comboT.setText(`COMBO\n${combo}`).setAlign('center').setLineSpacing(-3);
      sparkles(this, laneX[n.lane], recvY, 6, [LANE_COL[n.lane], 0xffffff], 16);
      recv[n.lane].setTint(LANE_COL[n.lane]);
      this.time.delayedCall(90, () => recv[n.lane].setTint(0x8a80c0));
      sfx.hit();
      crew.forEach((s, i) => s.setFrame(`dance${(hits + i) % 4}`));
      if (combo % 10 === 0) this.emote(Phaser.Utils.Array.GetRandom(crew), Phaser.Utils.Array.GetRandom(['♪', '♥', '★'] as const));
      pendingXp += xpPer;
      if (hits % 8 === 0) { this.award(Math.round(pendingXp), Phaser.Math.Between(80, 560), 220); pendingXp = 0; }
    };
    const press = (lane: number) => {
      if (director.auto) return;
      const now = ac.currentTime - t0;
      let best: (typeof notes)[0] | undefined, bd = 1;
      for (const n of notes) if (!n.hit && !n.missed && n.lane === lane && Math.abs(n.t - now) < bd) { best = n; bd = Math.abs(n.t - now); }
      if (best && bd < 0.16) doJudge(best, best.t - now);
    };
    const keyMap: Record<string, number> = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, a: 0, s: 1, w: 2, d: 3 };
    const onKey = (e: KeyboardEvent) => { if (e.key in keyMap) press(keyMap[e.key]); };
    window.addEventListener('keydown', onKey);
    this.events.once('shutdown', () => window.removeEventListener('keydown', onKey));

    await new Promise<void>((resolve) => {
      const upd = () => {
        const now = ac.currentTime - t0;
        for (const n of notes) {
          if (n.hit || n.missed) continue;
          const dt = n.t - now;
          if (dt < 2.2 && !n.o) n.o = this.add.image(laneX[n.lane], 400, 'arrow').setAngle(LANE_ANGLE[LANES[n.lane]]).setTint(LANE_COL[n.lane]).setDepth(65);
          if (n.o) n.o.y = recvY + dt * speed;
          if (director.auto && dt <= 0) doJudge(n, 0);
          else if (dt < -0.16) {
            n.missed = true; n.o?.destroy(); combo = 0;
            judge.setText('MISS').setColor('#ff6f6f');
          }
        }
        if (now > notes[notes.length - 1].t + 1) { this.events.off('update', upd); resolve(); }
      };
      this.events.on('update', upd);
      this.events.once('shutdown', () => this.events.off('update', upd));
    });
    if (pendingXp) this.award(Math.round(pendingXp), 320, 220);
    crew.forEach((s, i) => { this.play(s, 'cheer'); this.hop(s, 12, i * 80); this.emote(s, '♥', i * 100); });
    confetti(this, 120);
    bigText(this, 320, 230, hits === notes.length ? 'FULL COMBO!' : `${hits}/${notes.length}`, 3, '#ffe066', '#7a2d00').setDepth(80);
    await this.wait(1800);
    box.destroy();
    await this.completeMission('dance');
  }
}

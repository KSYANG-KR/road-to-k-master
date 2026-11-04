// #25~#29 한강 야외 스크린(명예 한국인 + 실사/하이라이트 영상), #30~#31 엔딩(틸트업 불꽃놀이 + 로고)
import Phaser from 'phaser';
import { BaseScene } from '../core/BaseScene';
import { pixText } from '../art/pixeltext';
import { DialogBox, bigText, button, tag, txt, W, H } from '../core/ui';
import { playMusic, sfx } from '../core/audio';
import { director } from '../core/director';
import { launchFirework, sparkles } from '../core/fx';
import { glints, makeAmbientTextures, twinkle } from '../core/ambient';
import { CAST, LINEUP, OUTFITS } from '../art/cast';
import { state } from '../core/state';

// 야외 스크린 영역 (night.png 기준)
const SCR = { x: 210, y: 82, w: 220, h: 121 };

// 실사 영상: public/assets/video/clips.json 에 파일 목록을 넣으면 자동 재생
// 예) ["live_01.mp4", "live_02.mp4", "live_03.mp4"]
async function loadClipList(): Promise<string[]> {
  try {
    const r = await fetch('assets/video/clips.json', { cache: 'no-store' });
    if (!r.ok) return [];
    const list = await r.json();
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

export class Ending extends BaseScene {
  constructor() { super('Ending'); }

  async create() {
    playMusic('ending');
    this.bg('night');
    // 반딧불 같은 반짝임
    this.time.addEvent({ delay: 200, loop: true, callback: () => sparkles(this, Phaser.Math.Between(0, W), Phaser.Math.Between(200, 300), 1, [0xffe9a0], 6) });
    const screen = this.add.container(0, 0).setDepth(10);
    const maskG = this.make.graphics({}, false).fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    screen.setMask(maskG.createGeometryMask());

    // 관객: 뒷모습 8인
    const crew = LINEUP.map((id, i) => {
      const def = id === 'hana' ? { ...CAST.hana, outfit: OUTFITS.hanaMax } : CAST[id];
      const s = this.char(id, 120 + i * 58 + (i % 2) * 6, 352 - (i % 2) * 6, { scale: 2, def, key: `end_${id}` });
      s.setFrame('back0');
      return s;
    });
    await this.reveal();

    // (#25) 타이틀 획득: 트로피 + 명예 한국인
    const tg = this.add.graphics();
    tg.fillStyle(0x05040e); tg.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    const trophy = this.add.graphics({ x: SCR.x + SCR.w / 2, y: SCR.y + 34 });
    trophy.fillStyle(0x7a4a00); trophy.fillRect(-13, -15, 26, 18); trophy.fillRect(-5, 3, 10, 6); trophy.fillRect(-10, 9, 20, 4);
    trophy.fillStyle(0xffd23f); trophy.fillRect(-12, -14, 24, 16); trophy.fillRect(-4, 2, 8, 6); trophy.fillRect(-9, 9, 18, 3);
    trophy.fillRect(-17, -12, 4, 8); trophy.fillRect(13, -12, 4, 8);
    trophy.fillStyle(0xfff3a0); trophy.fillRect(-9, -12, 3, 10);
    trophy.fillStyle(0xe8303a); trophy.fillRect(-2, -9, 4, 4);
    const cx = SCR.x + SCR.w / 2;
    const unlock = pixText(this, cx, SCR.y + 60, [{ t: 'TITLE UNLOCKED · 칭호 획득', font: 'g9', color: '#ffd166' }]);
    const hk = pixText(this, cx, SCR.y + 80, [{ t: 'HONORARY KOREAN', font: 'g14', color: '#ffffff', bold: true, spacing: 1 }], { shadow: '#3a2a6a' });
    const hke = pixText(this, cx, SCR.y + 100, [{ t: '명예 한국인', font: 'g11b', color: '#ff9ab0' }]);
    screen.add([tg, trophy, unlock, hk, hke]);
    [trophy, unlock, hk, hke].forEach((o, i) => { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, delay: 300 + i * 250, duration: 300 }); });
    this.time.addEvent({ delay: 250, repeat: 12, callback: () => sparkles(this, SCR.x + Phaser.Math.Between(20, SCR.w - 20), SCR.y + Phaser.Math.Between(10, 60), 3, [0xffe066, 0xffffff], 12) });
    sfx.levelup();
    crew.forEach((s, i) => { this.time.delayedCall(400 + i * 80, () => this.play(s, 'backCheer')); this.emote(s, (['♥', '!', '★', '♪'] as const)[i % 4], 600 + i * 150); });
    await this.wait(3200);

    // (#26~#29) 영상 구간
    const d = new DialogBox(this, SCR.x - 20, SCR.y + SCR.h + 10, SCR.w + 40, 38);
    d.setDepth(990).setAlpha(0);
    const clips = await loadClipList();
    screen.removeAll(true);
    this.tweens.add({ targets: d, alpha: 1, duration: 300 });
    d.say('나도 몰랐던 내 안의 한국인을 만났어요', 'You discovered the Korean in you.', 22);
    if (clips.length) {
      for (const c of clips) {
        const v = this.add.video(SCR.x + SCR.w / 2, SCR.y + SCR.h / 2).setDepth(10);
        screen.add(v);
        v.loadURL(`assets/video/${c}`, true);
        v.setMute(true);
        await new Promise<void>((ok) => {
          v.once('created', () => { const s = Math.max(SCR.w / v.width, SCR.h / v.height); v.setScale(s); });
          v.once('complete', () => ok());
          v.once('error', () => ok());
          v.play();
          this.time.delayedCall(12000, () => ok());
        });
        v.destroy();
      }
    } else {
      // 실사 영상이 아직 없으면: 여정 하이라이트 몽타주 (미션 배경 + 스탬프)
      const reel: [string, string][] = [['hanok_int', '온돌 Ondol'], ['jjimjil', '찜질방 Jjimjilbang'], ['palace', '한복 Hanbok'], ['hangang', '한강 러닝 Hangang run'], ['hansik', '한식 Korean food'], ['stage', '케이팝 댄스 K-pop dance']];
      for (const [ri, [bg, label]] of reel.entries()) {
        const fit = W / this.textures.get(bg).getSourceImage().width;
        const im = this.add.image(SCR.x + SCR.w / 2, SCR.y + SCR.h / 2, bg).setScale(0.42 * fit).setDepth(10);
        const lb = this.add.container(SCR.x + 6, SCR.y + 5).setDepth(11);
        const lt = pixText(this, 0, 0, [{ t: `● REC  ${label}`, font: 'g9', color: '#ffffff' }]);
        const lw = lt.width + 8;
        const lg = this.add.graphics();
        lg.fillStyle(0x7a0a1a); lg.fillRect(0, 0, lw, 14); lg.fillStyle(0xe8303a); lg.fillRect(0, 0, lw, 13);
        lt.setPosition(Math.round(lw / 2), 7);
        lb.add([lg, lt]);
        screen.add([im, lb]);
        this.tweens.add({ targets: im, scale: 0.46 * fit, duration: 1300 });
        crew.forEach((s, i) => (i + ri) % 3 === 0 && this.play(s, 'backCheer'));
        await this.wait(1300);
        im.destroy(); lb.destroy();
      }
    }
    await this.wait(800);
    await this.goto('Outro', {}, 'dissolve');
  }
}

export class Outro extends BaseScene {
  constructor() { super('Outro'); }

  async create() {
    playMusic('ending');
    // 세로로 긴 노을 하늘 배경 (×2)
    const sky = this.add.image(0, 0, 'dusk').setOrigin(0).setDepth(-100);
    sky.setScale(W / sky.width);
    const worldH = sky.displayHeight;
    // 세로 배경 앰비언트: 별 / 구름 / 도시 불빛 / 강물 반짝임
    makeAmbientTextures(this);
    twinkle(this, [[0, 0, W, worldH * 0.4]], 60, [0xffffff, 0xfff3b0, 0xb8c8ff]);
    twinkle(this, [[0, worldH - 230, W, 70]], 40, [0xfff3b0, 0xffd27a]);
    glints(this, [[0, worldH - 150, W, 50]], 14, -85, 0xffd0a0);
    for (let i = 0; i < 6; i++) {
      const c = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(worldH * 0.45, worldH * 0.75), i % 2 ? 'cloud1' : 'cloud2').setDepth(-90).setTint(0xffb8d0).setAlpha(0.55).setScale(0.6 + Math.random() * 0.4);
      this.tweens.add({ targets: c, x: c.x + Phaser.Math.Between(-80, 80), yoyo: true, repeat: -1, duration: Phaser.Math.Between(9000, 14000), ease: 'Sine.InOut' });
    }
    this.cameras.main.setBounds(0, 0, W, worldH);
    this.cameras.main.centerOn(W / 2, worldH - H / 2);
    const groundY = worldH - 26;
    const crew = LINEUP.map((id, i) => {
      const def = id === 'hana' ? { ...CAST.hana, outfit: state.maxed ? OUTFITS.hanaMax : OUTFITS.hanaLv3 } : CAST[id];
      const s = this.char(id, 96 + i * 64, groundY + (i % 2) * 4, { scale: 2, def, key: `out_${id}` });
      s.setFrame('back0');
      return s;
    });
    // PLAY KOREA 로고 (#30)
    const pk1 = bigText(this, W / 2, worldH - 300, 'PLAY', 4, '#7dff8a', '#14345a');
    const pk2 = bigText(this, W / 2 + 10, worldH - 256, 'KOREA', 4, '#6fd0ff', '#14345a');
    [pk1, pk2].forEach((o) => o.setAlpha(0));
    await this.reveal();
    this.tweens.add({ targets: [pk1, pk2], alpha: 1, y: '-=10', duration: 700 });
    // 손 흔들며 작별·환호
    crew.forEach((s, i) => { this.time.delayedCall(i * 90, () => this.play(s, i % 2 ? 'backWave' : 'backCheer')); this.hop(s, 8, 400 + i * 120); });
    await this.wait(2600);
    // (#31) 틸트업 → 불꽃놀이
    this.tweens.add({ targets: [pk1, pk2], alpha: 0, duration: 500 });
    this.camPan(W / 2, H / 2, 3200);
    await this.wait(2000);
    const fw = this.time.addEvent({ delay: 380, loop: true, callback: () => launchFirework(this, Phaser.Math.Between(60, W - 60), H + 40, Phaser.Math.Between(40, 200), 1.3, 50) });
    await this.wait(2200);
    // 브랜드 로고
    const logo = this.add.image(W / 2, H / 2 - 6, 'kto_logo').setDepth(100).setAlpha(0).setScale(0.8);
    this.tweens.add({ targets: logo, alpha: 1, scale: 1, duration: 900, ease: 'Back.Out' });
    sparkles(this, W / 2, H / 2, 40, undefined, 140);
    await this.wait(3800);
    fw.remove();
    // 녹화 종료
    if (director.rec) await director.stopRecording();
    // 다시하기
    const btn = button(this, W / 2, H - 40, 'PLAY AGAIN', { w: 132, h: 34, sub: '다시 하기' }).setDepth(120);
    const again = () => { state.reset(); this.goto('Title', {}, 'crt'); };
    btn.on('pointerdown', again);
    this.input.keyboard?.once('keydown-ENTER', again);
    this.input.keyboard?.once('keydown-SPACE', again);
    // 이번 여행에서 모은 별
    const total = tag(this, W / 2, H - 82, `모은 별  Stars collected   ★ ${state.totalStars} / ${state.maxStars}`, { fg: '#ffd166', bold: true, size: 11, depth: 120 });
    btn.setAlpha(0); total.setAlpha(0);
    this.tweens.add({ targets: [btn, total], alpha: 1, duration: 500 });
  }
}

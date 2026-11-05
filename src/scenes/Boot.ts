import Phaser from 'phaser';
import { bakeCharacter } from '../art/characters';
import { CAST, LINEUP, setHero } from '../art/cast';
import { makeFxTextures } from '../core/fx';
import { ATLASES } from '../core/BaseScene';
import { director } from '../core/director';
import { state } from '../core/state';
import { audioCtx } from '../core/audio';
import { txt, bigText, setupCamera, PAL, SUB, W, H } from '../core/ui';

const BGS = ['sky', 'airport', 'title', 'map1', 'hanok_ext', 'hanok_int', 'jjimjil', 'temple', 'palace', 'park', 'map2', 'pcbang2', 'hangang', 'cvs', 'map3', 'hansik', 'salon', 'stage', 'night', 'dusk'];

// 녹화/디버그용 단축 경로: ?scene=<이름>
const JUMP: Record<string, [string, object?]> = {
  intro: ['Intro'], arrival: ['Arrival'], title: ['Title'], cast: ['CastRoll'], select: ['CharSelect'], map: ['WorldMap'],
  hanok: ['HanokShoes'], ondol: ['HanokOndol'], jjimjil: ['Jjimjil'],
  temple: ['DressCode', { variant: 'temple' }], palace: ['DressCode', { variant: 'palace' }], park: ['DressCode', { variant: 'park' }],
  levelup1: ['LevelUp'], pcbang: ['PcBang'], hangang: ['Hangang'], cvs: ['Cvs'], levelup2: ['LevelUp'],
  hansik: ['Hansik'], salon: ['Salon'], photo: ['PhotoBooth'], dance: ['Dance'], finale: ['Finale'], ending: ['Ending'], outro: ['Outro'],
};
const STATE_AT: Record<string, string> = {
  hanok: 'hanok', ondol: 'hanok', jjimjil: 'jjimjil', temple: 'temple', palace: 'palace', park: 'park', pcbang: 'pcbang',
  hangang: 'hangang', cvs: 'cvs', hansik: 'hansik', salon: 'salon', photo: 'photo', dance: 'dance',
};

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    setupCamera(this);
    this.cameras.main.setBackgroundColor('#0b0f24');
    txt(this, W / 2, H / 2 - 74, 'ROAD TO', { bold: true, color: '#ffffff', spacing: 6 }).setOrigin(0.5, 0);
    const lines = this.add.graphics();
    lines.fillStyle(PAL.acc); lines.fillRect(W / 2 - 80, H / 2 - 67, 22, 1); lines.fillRect(W / 2 + 58, H / 2 - 67, 22, 1);
    bigText(this, W / 2, H / 2 - 26, 'K-MASTER', 3, '#ffffff', '#151a33', '#c94466');
    const track = this.add.rectangle(W / 2 - 80, H / 2 + 14, 160, 2, PAL.line).setOrigin(0, 0.5);
    const bar = this.add.rectangle(W / 2 - 80, H / 2 + 14, 0, 2, PAL.acc).setOrigin(0, 0.5);
    const pct = txt(this, W / 2, H / 2 + 24, 'LOADING  0%', { size: 10, color: SUB, spacing: 2 }).setOrigin(0.5, 0);
    void track;
    this.load.on('progress', (p: number) => { bar.width = 160 * p; pct.setText(`LOADING  ${Math.round(p * 100)}%`); });
    BGS.forEach((b) => this.load.image(b, `assets/bg/${b}.png`));
    ATLASES.forEach((a) => this.load.atlas(a, `assets/sprites/${a}.png`, `assets/sprites/${a}.json`));
    this.load.image('kto_logo', 'assets/brand/imagine_your_korea.png');
  }

  create() {
    makeFxTextures(this);
    // 오프닝에 바로 나오는 8인만 미리 굽고, NPC는 처음 등장할 때 굽는다
    LINEUP.forEach((id) => bakeCharacter(this, CAST[id]));
    this.scene.launch('fx');
    const q = new URLSearchParams(location.search);
    // 테스트용: ?hero=leo 로 주인공 지정
    if (q.get('hero')) { setHero(q.get('hero')!); state.hero = q.get('hero')!; }
    const go = () => {
      const jump = JUMP[director.start];
      if (jump) {
        // 해당 장면 직전의 진행 상태를 만들어 둔다
        if (director.start === 'levelup1') { state.jumpTo('pcbang'); state.stage = 0; state.xp = 1000; }
        else if (director.start === 'levelup2') { state.jumpTo('hansik'); state.stage = 1; state.xp = 1000; }
        else if (['finale', 'ending', 'outro'].includes(director.start)) { state.jumpTo('dance'); state.cleared.add('dance'); state.xp = 1000; }
        else if (STATE_AT[director.start]) state.jumpTo(STATE_AT[director.start]);
        this.scene.start(jump[0], jump[1]);
      } else if (q.has('chartest')) this.scene.start('chartest');
      else this.scene.start('Intro');
    };
    if (director.auto) {
      director.startRecording(this.game.canvas);
      go();
    } else {
      // 첫 입력으로 오디오 잠금 해제
      this.children.list.filter((o) => o instanceof Phaser.GameObjects.Text && o.text.startsWith('LOADING')).forEach((o) => o.destroy());
      const t = txt(this, W / 2, H / 2 + 24, 'CLICK  ·  TAP  ·  ANY KEY', { size: 10, color: '#ffffff', spacing: 2 }).setOrigin(0.5, 0);
      const t2 = txt(this, W / 2, H / 2 + 38, '화면을 눌러 시작해요', { size: 10, color: SUB }).setOrigin(0.5, 0);
      this.tweens.add({ targets: [t, t2], alpha: 0.35, yoyo: true, repeat: -1, duration: 700 });
      const start = () => { audioCtx(); go(); };
      this.input.once('pointerdown', start);
      this.input.keyboard?.once('keydown', start);
      // 개발용 점검: ?tapstart 면 1.5초 뒤 자동으로 시작 (사람 플레이 화면 그대로 확인)
      if (q.has('tapstart') && import.meta.env.DEV) this.time.delayedCall(1500, start);
    }
  }
}

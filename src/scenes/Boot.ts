import Phaser from 'phaser';
import { bakeCharacter } from '../art/characters';
import { CAST, NPC } from '../art/cast';
import { makeFxTextures } from '../core/fx';
import { ATLASES } from '../core/BaseScene';
import { director } from '../core/director';
import { state } from '../core/state';
import { audioCtx } from '../core/audio';
import { txt, bigText, panel, tag, setupCamera, PAL, W, H } from '../core/ui';

const BGS = ['sky', 'airport', 'title', 'map1', 'hanok_ext', 'hanok_int', 'jjimjil', 'temple', 'palace', 'park', 'map2', 'pcbang2', 'hangang', 'cvs', 'map3', 'hansik', 'salon', 'stage', 'night', 'dusk'];

// 녹화/디버그용 단축 경로: ?scene=<이름>
const JUMP: Record<string, [string, object?]> = {
  intro: ['Intro'], title: ['Title'], cast: ['CastRoll'], map: ['WorldMap'],
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
    bigText(this, W / 2, H / 2 - 50, 'ROAD TO', 1, '#ffffff', '#3a1f7a');
    bigText(this, W / 2, H / 2 - 28, 'K-MASTER', 3, '#ff6fb5', '#ffffff');
    const frame = this.add.graphics();
    panel(frame, W / 2 - 104, H / 2 + 2, 208, 14, 0x1d1840, 0x3a3270);
    const bar = this.add.rectangle(W / 2 - 100, H / 2 + 9, 0, 6, PAL.pink).setOrigin(0, 0.5);
    const shine = this.add.rectangle(W / 2 - 100, H / 2 + 7, 0, 1, 0xffffff, 0.6).setOrigin(0, 0.5);
    const pct = txt(this, W / 2, H / 2 + 22, 'LOADING 0%', { size: 10, color: '#c9c0ff' }).setOrigin(0.5, 0);
    this.load.on('progress', (p: number) => { bar.width = 200 * p; shine.width = 200 * p; pct.setText(`LOADING ${Math.round(p * 100)}%`); });
    BGS.forEach((b) => this.load.image(b, `assets/bg/${b}.png`));
    ATLASES.forEach((a) => this.load.atlas(a, `assets/sprites/${a}.png`, `assets/sprites/${a}.json`));
    this.load.image('kto_logo', 'assets/brand/imagine_your_korea.png');
  }

  create() {
    makeFxTextures(this);
    [...Object.values(CAST), ...Object.values(NPC)].forEach((d) => bakeCharacter(this, d));
    this.scene.launch('fx');
    const q = new URLSearchParams(location.search);
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
      const t = tag(this, W / 2, H / 2 + 34, '▶ CLICK · TAP · PRESS ANY KEY', { bg: PAL.pink });
      this.tweens.add({ targets: t, alpha: 0.2, yoyo: true, repeat: -1, duration: 500 });
      const start = () => { audioCtx(); go(); };
      this.input.once('pointerdown', start);
      this.input.keyboard?.once('keydown', start);
    }
  }
}

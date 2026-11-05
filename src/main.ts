import Phaser from 'phaser';
import './core/pixelgfx';
import { W, H, ZOOM } from './core/ui';
import { Boot } from './scenes/Boot';
import { FxScene } from './core/fx';
import { CharTest, charSheet } from './scenes/CharTest';
import { Intro, Arrival, Title, CastRoll } from './scenes/Opening';
import { WorldMap } from './scenes/WorldMap';
import { CharSelect } from './scenes/CharSelect';
import { HanokShoes, HanokOndol, Jjimjil, DressCode } from './scenes/Stage1';
import { PcBang, Hangang, Cvs } from './scenes/Stage2';
import { Hansik, Salon, PhotoBooth, Dance } from './scenes/Stage3';
import { LevelUp, Finale } from './scenes/LevelUp';
import { Ending, Outro } from './scenes/Ending';

// 장면 스크립트(async)에서 난 오류가 조용히 묻히지 않게 콘솔에 남긴다
window.addEventListener('unhandledrejection', (e) => console.error('[scene error]', e.reason));

async function start() {
  await Promise.all([
    ...['Galmuri11B', 'Galmuri11', 'Galmuri9', 'Galmuri7', 'Galmuri14'].map((f) => document.fonts.load(`12px ${f}`, '한글AB')),
  ]);
  const q = new URLSearchParams(location.search);
  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    width: W * ZOOM,
    height: H * ZOOM,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#120f26',
    // ?bg=1 : 창이 숨겨져 있어도 루프가 돌도록 (자동 캡처용)
    fps: { forceSetTimeOut: q.has('bg'), target: 60 },
    render: { preserveDrawingBuffer: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [Boot, FxScene, CharTest, Intro, Arrival, Title, CastRoll, CharSelect, WorldMap, HanokShoes, HanokOndol, Jjimjil, DressCode,
      PcBang, Hangang, Cvs, Hansik, Salon, PhotoBooth, Dance, LevelUp, Finale, Ending, Outro],
  });
  if (q.has('clean')) document.body.style.cursor = 'none';
  // 개발용 자동 점검: ?shots=2000&tag=run → N ms마다 JPEG 저장 + 오류 로그 (captures/)
  if (q.has('shots') && import.meta.env.DEV) {
    const every = Number(q.get('shots')) || 2000, tagName = q.get('tag') ?? 'run';
    const post = (name: string, body: Blob | string) => fetch(`/__capture?name=${name}`, { method: 'POST', body });
    const errs: string[] = [];
    const log = (m: string) => { errs.push(m); post(`${tagName}_errors.txt`, errs.join('\n')); };
    window.addEventListener('error', (e) => log(`error: ${e.message}`));
    window.addEventListener('unhandledrejection', (e) => log(`reject: ${String(e.reason?.stack ?? e.reason)}`));
    let n = 0, outro = 0;
    const timer = setInterval(() => {
      const keys = game.scene.getScenes(true).map((s) => s.scene.key).filter((k) => k !== 'fx').join('-');
      const name = `${tagName}_${String(n++).padStart(3, '0')}_${keys}.jpg`;
      game.canvas.toBlob((bl) => bl && post(name, bl), 'image/jpeg', 0.8);
      if (keys.includes('Outro') && ++outro > 4) { clearInterval(timer); post(`${tagName}_done.txt`, 'done'); }
      // 화면이 멈췄는지 진단용 (게임 루프 프레임·WebGL 컨텍스트 상태)
      post(`${tagName}_status.txt`, `frame=${game.loop.frame} lost=${(game.renderer as any).contextLost} keys=${keys}`);
    }, every);
  }
  // 창 크기 변경·기기 회전 시 항상 다시 맞춤 (Phaser 자동 감지가 놓치는 경우 대비)
  const refit = () => requestAnimationFrame(() => game.scale.refresh());
  new ResizeObserver(refit).observe(document.getElementById('game')!);
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', () => setTimeout(refit, 300));
  window.visualViewport?.addEventListener('resize', refit);
  // 개발용 스냅샷: window.snap('name.png') → captures/name.png
  (window as any).game = game;
  (window as any).charSheet = charSheet;
  (window as any).snap = (name = 'snap.png') =>
    new Promise((ok) =>
      game.canvas.toBlob((b) => fetch(`/__capture?name=${name}`, { method: 'POST', body: b }).then(() => ok(name))),
    );
}

start();

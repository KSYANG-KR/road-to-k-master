import Phaser from 'phaser';
import { W, H, ZOOM } from './core/ui';
import { Boot } from './scenes/Boot';
import { FxScene } from './core/fx';
import { CharTest, charSheet } from './scenes/CharTest';
import { Intro, Arrival, Title, CastRoll } from './scenes/Opening';
import { WorldMap } from './scenes/WorldMap';
import { HanokShoes, HanokOndol, Jjimjil, DressCode } from './scenes/Stage1';
import { PcBang, Hangang, Cvs } from './scenes/Stage2';
import { Hansik, Salon, PhotoBooth, Dance } from './scenes/Stage3';
import { LevelUp, Finale } from './scenes/LevelUp';
import { Ending, Outro } from './scenes/Ending';

async function start() {
  await Promise.all([500, 600, 700, 800, 900].map((w) => document.fonts.load(`${w} 12px Pretendard`, '한글AB')));
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
    scene: [Boot, FxScene, CharTest, Intro, Arrival, Title, CastRoll, WorldMap, HanokShoes, HanokOndol, Jjimjil, DressCode,
      PcBang, Hangang, Cvs, Hansik, Salon, PhotoBooth, Dance, LevelUp, Finale, Ending, Outro],
  });
  if (q.has('clean')) document.body.style.cursor = 'none';
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

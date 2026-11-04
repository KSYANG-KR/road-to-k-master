// 배경 앰비언트 애니메이션: 정지된 배경 그림 위에 구름·물결 반짝임·조명·꽃잎·새·나비·반딧불 등을 얹어 살아 움직이게 한다.
// 모든 좌표는 논리 해상도(640x360) 기준. 텍스처는 2배 해상도로 만들어 0.5배로 표시해 픽셀이 곱게 보이게 한다.
import Phaser from 'phaser';
import { PixelCanvas } from '../art/pixel';
import { W, H } from './ui';

type R = [number, number, number, number]; // x, y, w, h
const rnd = Phaser.Math.Between;
const pick = <T,>(a: T[]) => Phaser.Utils.Array.GetRandom(a) as T;

// ---------- 텍스처 ----------
function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (p: PixelCanvas) => void) {
  if (scene.textures.exists(key)) return;
  const p = new PixelCanvas(w, h);
  draw(p);
  scene.textures.addCanvas(key, p.toCanvas());
}

export function makeAmbientTextures(scene: Phaser.Scene) {
  // 픽셀 구름 2종
  const cloud = (key: string, w: number, h: number, blobs: [number, number, number, number][]) => tex(scene, key, w, h, (p) => {
    blobs.forEach(([x, y, rx, ry]) => p.ellipse(x, y + 2, rx, ry, 0xc9dcf5));
    blobs.forEach(([x, y, rx, ry]) => p.ellipse(x, y, rx, ry, 0xffffff));
    blobs.forEach(([x, y, rx]) => p.rect(x - Math.floor(rx / 2), y - 2, Math.max(2, Math.floor(rx / 3)), 1, 0xffffff));
    p.outline(0.9, 0xb5cdee);
  });
  cloud('cloud1', 72, 30, [[16, 18, 12, 8], [32, 13, 15, 11], [50, 17, 13, 9], [62, 21, 8, 6]]);
  cloud('cloud2', 50, 24, [[14, 15, 10, 7], [28, 11, 12, 9], [40, 16, 8, 6]]);
  // 꽃잎·나뭇잎
  tex(scene, 'petal', 4, 3, (p) => { p.rect(1, 0, 2, 1, 0xffc6dc); p.rect(0, 1, 4, 1, 0xff9ec4); p.rect(1, 2, 2, 1, 0xf27aa8); });
  // 새 (날갯짓 2프레임)
  tex(scene, 'bird0', 9, 4, (p) => { p.rect(0, 0, 2, 1, 0x2a2a3a); p.rect(2, 1, 2, 1, 0x2a2a3a); p.rect(4, 2, 1, 1, 0x2a2a3a); p.rect(5, 1, 2, 1, 0x2a2a3a); p.rect(7, 0, 2, 1, 0x2a2a3a); });
  tex(scene, 'bird1', 9, 4, (p) => { p.rect(0, 2, 2, 1, 0x2a2a3a); p.rect(2, 2, 2, 1, 0x2a2a3a); p.rect(4, 2, 1, 1, 0x2a2a3a); p.rect(5, 2, 2, 1, 0x2a2a3a); p.rect(7, 2, 2, 1, 0x2a2a3a); p.rect(4, 3, 1, 1, 0x2a2a3a); });
  // 나비
  tex(scene, 'fly0', 7, 6, (p) => { p.rect(0, 0, 3, 3, 0xffe066); p.rect(4, 0, 3, 3, 0xffe066); p.rect(1, 3, 2, 2, 0xffb43a); p.rect(4, 3, 2, 2, 0xffb43a); p.rect(3, 1, 1, 4, 0x3a2a2a); });
  tex(scene, 'fly1', 7, 6, (p) => { p.rect(2, 0, 1, 3, 0xffe066); p.rect(4, 0, 1, 3, 0xffe066); p.rect(2, 3, 1, 2, 0xffb43a); p.rect(4, 3, 1, 2, 0xffb43a); p.rect(3, 1, 1, 4, 0x3a2a2a); });
  // 비둘기
  tex(scene, 'pigeon0', 10, 8, (p) => { p.rect(1, 3, 7, 3, 0x8a8ea8); p.rect(6, 1, 3, 3, 0x9a9eb8); p.rect(9, 2, 1, 1, 0xe8a03a); p.rect(7, 2, 1, 1, 0x1a1a22); p.rect(2, 3, 4, 1, 0xb8bcd0); p.rect(6, 4, 2, 1, 0x6fb08a); p.rect(3, 6, 1, 2, 0xe86a5a); p.rect(6, 6, 1, 2, 0xe86a5a); p.rect(0, 4, 1, 1, 0x6a6e88); p.outline(0.5); });
  tex(scene, 'pigeon1', 10, 8, (p) => { p.rect(1, 3, 7, 3, 0x8a8ea8); p.rect(7, 4, 3, 3, 0x9a9eb8); p.rect(9, 7, 1, 1, 0xe8a03a); p.rect(8, 5, 1, 1, 0x1a1a22); p.rect(2, 3, 4, 1, 0xb8bcd0); p.rect(3, 6, 1, 2, 0xe86a5a); p.rect(5, 6, 1, 2, 0xe86a5a); p.rect(0, 4, 1, 1, 0x6a6e88); p.outline(0.5); });
  // 풍선
  ['#ff5f8a', '#ffd23f', '#6fd0ff', '#9a7af0', '#7dff8a'].forEach((c, i) => tex(scene, `balloon${i}`, 9, 20, (p) => {
    const col = parseInt(c.slice(1), 16);
    p.ellipse(4, 5, 4, 5, col); p.rect(2, 2, 1, 2, 0xffffff); p.rect(4, 11, 1, 1, col);
    for (let y = 12; y < 20; y++) p.set(4 + (y % 3 === 0 ? 1 : 0), y, 0xf4f4f4);
    p.outline(0.6);
  }));
  // 부드러운 원형 글로우 (조명용)
  if (!scene.textures.exists('glow')) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const g = cv.getContext('2d')!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    scene.textures.addCanvas('glow', cv);
  }
  // 스포트라이트 빔
  if (!scene.textures.exists('beam')) {
    const cv = document.createElement('canvas');
    cv.width = 120; cv.height = 360;
    const g = cv.getContext('2d')!;
    const gr = g.createLinearGradient(0, 0, 0, 360);
    gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(54, 0); g.lineTo(66, 0); g.lineTo(120, 360); g.lineTo(0, 360); g.closePath(); g.fill();
    scene.textures.addCanvas('beam', cv);
  }
  // 1px(화면 기준) 점
  tex(scene, 'dot', 2, 2, (p) => p.rect(0, 0, 2, 2, 0xffffff));
}

// ---------- 효과 원형 ----------
export function clouds(scene: Phaser.Scene, n: number, yMin: number, yMax: number, speed = 6, depth = -90, alpha = 0.95, scale = 1) {
  for (let i = 0; i < n; i++) {
    const c = scene.add.image(rnd(-60, W + 40), rnd(yMin, yMax), pick(['cloud1', 'cloud2'])).setDepth(depth).setAlpha(alpha).setScale(0.5 * scale * (0.8 + Math.random() * 0.6));
    const v = speed * (0.6 + Math.random() * 0.8);
    const loop = () => {
      const d = ((c.x + 80) / v) * 1000;
      scene.tweens.add({ targets: c, x: -80, duration: d, onComplete: () => { c.x = W + 60; c.y = rnd(yMin, yMax); loop(); } });
    };
    loop();
  }
}

// 지도 위 구름 그림자
export function cloudShadows(scene: Phaser.Scene, n = 3) {
  for (let i = 0; i < n; i++) {
    const sh = scene.add.ellipse(rnd(0, W), rnd(40, H - 40), rnd(120, 200), rnd(50, 80), 0x10203a, 0.12).setDepth(-80);
    scene.tweens.add({ targets: sh, x: sh.x + 260, y: sh.y - 40, duration: rnd(18000, 26000), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
}

// 물 위 반짝임 (짧은 가로 선이 켜졌다 꺼짐)
export function glints(scene: Phaser.Scene, rects: R[], perSec = 8, depth = -85, color = 0xffffff) {
  scene.time.addEvent({
    delay: 1000 / perSec, loop: true, callback: () => {
      const [x, y, w, h] = pick(rects);
      const g = scene.add.rectangle(x + Math.random() * w, y + Math.random() * h, rnd(2, 5), 0.5, color).setDepth(depth).setAlpha(0);
      scene.tweens.add({ targets: g, alpha: 0.9, scaleX: 1.6, yoyo: true, duration: rnd(300, 600), onComplete: () => g.destroy() });
    },
  });
}

// 별·창문 불빛 반짝임
export function twinkle(scene: Phaser.Scene, rects: R[], n = 20, colors = [0xffffff, 0xfff3b0], depth = -85) {
  for (let i = 0; i < n; i++) {
    const [x, y, w, h] = pick(rects);
    const d = scene.add.image(x + Math.random() * w, y + Math.random() * h, 'dot').setTint(pick(colors)).setDepth(depth).setScale(0.5).setAlpha(Math.random());
    scene.tweens.add({ targets: d, alpha: { from: 0.1, to: 1 }, yoyo: true, repeat: -1, duration: rnd(500, 1600), delay: rnd(0, 1500) });
    if (Math.random() < 0.3) scene.tweens.add({ targets: d, scale: 1, yoyo: true, repeat: -1, duration: rnd(700, 1400) });
  }
}

// 은은하게 숨쉬는 조명 (랜턴·네온·불)
export function glow(scene: Phaser.Scene, x: number, y: number, radius: number, color: number, min = 0.25, max = 0.6, period = 900, flicker = false, depth = -80) {
  const g = scene.add.image(x, y, 'glow').setTint(color).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(radius * 2, radius * 2).setAlpha(min);
  scene.tweens.add({ targets: g, alpha: max, yoyo: true, repeat: -1, duration: period, ease: 'Sine.InOut', delay: rnd(0, period) });
  if (flicker) scene.time.addEvent({ delay: 120, loop: true, callback: () => Math.random() < 0.08 && g.setAlpha(min * 0.4) });
  return g;
}

// 떨어지는 꽃잎
export function petals(scene: Phaser.Scene, perSec = 3, depth = 600, area: R = [0, -10, W, 10]) {
  scene.time.addEvent({
    delay: 1000 / perSec, loop: true, callback: () => {
      const p = scene.add.image(area[0] + Math.random() * area[2], area[1] + Math.random() * area[3], 'petal').setDepth(depth).setScale(0.5 + Math.random() * 0.4).setAngle(rnd(0, 360));
      const dur = rnd(5000, 8000);
      scene.tweens.add({ targets: p, y: H + 10, angle: p.angle + rnd(180, 540), duration: dur, onComplete: () => p.destroy() });
      scene.tweens.add({ targets: p, x: p.x + rnd(-60, 30), duration: dur, ease: 'Sine.InOut' });
      scene.tweens.add({ targets: p, scaleX: 0.15, yoyo: true, repeat: -1, duration: rnd(300, 600) });
    },
  });
}

// 떠다니는 먼지/햇살 입자
export function motes(scene: Phaser.Scene, area: R, n = 18, color = 0xfff0b0, depth = 550) {
  for (let i = 0; i < n; i++) {
    const m = scene.add.image(area[0] + Math.random() * area[2], area[1] + Math.random() * area[3], 'dot').setTint(color).setScale(0.5).setAlpha(0).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: m, alpha: { from: 0, to: 0.8 }, yoyo: true, repeat: -1, duration: rnd(1500, 3000), delay: rnd(0, 2000) });
    scene.tweens.add({ targets: m, x: m.x + rnd(-14, 14), y: m.y + rnd(-18, -4), yoyo: true, repeat: -1, duration: rnd(3000, 5000), ease: 'Sine.InOut' });
  }
}

// 김·연기·열기 (위로 피어오름)
export function steam(scene: Phaser.Scene, x: number, y: number, perSec = 3, depth = 600, color = 0xffffff, spread = 6) {
  return scene.time.addEvent({
    delay: 1000 / perSec, loop: true, callback: () => {
      const s = scene.add.image(x + rnd(-spread, spread), y, 'glow').setTint(color).setDepth(depth).setAlpha(0.35).setDisplaySize(6, 6);
      scene.tweens.add({ targets: s, y: y - rnd(18, 30), x: s.x + rnd(-6, 6), displayWidth: 16, displayHeight: 16, alpha: 0, duration: rnd(1200, 1800), ease: 'Sine.Out', onComplete: () => s.destroy() });
    },
  });
}

// 새 떼
export function birds(scene: Phaser.Scene, yMin: number, yMax: number, every = 5000, depth = -70) {
  const flock = () => {
    const y0 = rnd(yMin, yMax), fromLeft = Math.random() < 0.5, n = rnd(2, 4);
    for (let i = 0; i < n; i++) {
      const b = scene.add.sprite(fromLeft ? -20 - i * 14 : W + 20 + i * 14, y0 + i * 6 * (i % 2 ? 1 : -1), 'bird0').setDepth(depth).setScale(0.5).setFlipX(!fromLeft);
      let f = 0;
      const t = scene.time.addEvent({ delay: 160, loop: true, callback: () => b.setTexture(++f % 2 ? 'bird1' : 'bird0') });
      scene.tweens.add({ targets: b, x: fromLeft ? W + 40 : -40, y: b.y - rnd(10, 40), duration: rnd(7000, 10000), onComplete: () => { t.remove(); b.destroy(); } });
    }
  };
  scene.time.delayedCall(rnd(500, 2000), flock);
  scene.time.addEvent({ delay: every, loop: true, callback: flock });
}

// 팔랑이는 나비
export function butterflies(scene: Phaser.Scene, area: R, n = 2, depth = 650) {
  for (let i = 0; i < n; i++) {
    const b = scene.add.sprite(area[0] + Math.random() * area[2], area[1] + Math.random() * area[3], 'fly0').setDepth(depth).setScale(0.5).setTint(i % 2 ? 0xffffff : 0xffc0e0);
    let f = 0;
    scene.time.addEvent({ delay: 110, loop: true, callback: () => b.setTexture(++f % 2 ? 'fly1' : 'fly0') });
    const move = () => scene.tweens.add({
      targets: b, x: area[0] + Math.random() * area[2], y: area[1] + Math.random() * area[3], duration: rnd(1800, 3200), ease: 'Sine.InOut', onComplete: move,
    });
    move();
    scene.tweens.add({ targets: b, y: '+=4', yoyo: true, repeat: -1, duration: 260 });
  }
}

// 반딧불
export function fireflies(scene: Phaser.Scene, area: R, n = 14, depth = 600) {
  for (let i = 0; i < n; i++) {
    const f = scene.add.image(area[0] + Math.random() * area[2], area[1] + Math.random() * area[3], 'glow').setTint(0xfff07a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(5, 5).setDepth(depth).setAlpha(0);
    scene.tweens.add({ targets: f, alpha: { from: 0, to: 0.9 }, yoyo: true, repeat: -1, duration: rnd(900, 1800), delay: rnd(0, 2000) });
    scene.tweens.add({ targets: f, x: f.x + rnd(-30, 30), y: f.y + rnd(-20, 10), yoyo: true, repeat: -1, duration: rnd(3000, 6000), ease: 'Sine.InOut' });
  }
}

// 하늘로 떠오르는 풍선
export function balloons(scene: Phaser.Scene, xs: [number, number], every = 2200, depth = -60) {
  scene.time.addEvent({
    delay: every, loop: true, callback: () => {
      const b = scene.add.image(rnd(xs[0], xs[1]), H - 60, `balloon${rnd(0, 4)}`).setDepth(depth).setScale(0.6);
      scene.tweens.add({ targets: b, y: -30, duration: rnd(7000, 10000), onComplete: () => b.destroy() });
      scene.tweens.add({ targets: b, x: b.x + rnd(-30, 30), angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: rnd(1200, 1800), ease: 'Sine.InOut' });
    },
  });
}

// 비둘기 (종종걸음 + 콕콕)
export function pigeons(scene: Phaser.Scene, spots: [number, number][], depth = 290) {
  spots.forEach(([x, y]) => {
    const p = scene.add.sprite(x, y, 'pigeon0').setDepth(depth + y / 100).setScale(0.75).setFlipX(Math.random() < 0.5);
    const act = () => {
      if (!p.active) return;
      if (Math.random() < 0.5) {
        p.setTexture('pigeon1');
        scene.time.delayedCall(180, () => p.setTexture('pigeon0'));
        scene.time.delayedCall(360, () => p.setTexture('pigeon1'));
        scene.time.delayedCall(540, () => p.setTexture('pigeon0'));
      } else {
        const nx = Phaser.Math.Clamp(p.x + rnd(-14, 14), x - 30, x + 30);
        p.setFlipX(nx < p.x);
        scene.tweens.add({ targets: p, x: nx, duration: 500, onUpdate: () => (p.y = y - Math.abs(Math.sin(p.x / 2)) * 1.5) });
      }
      scene.time.delayedCall(rnd(700, 1600), act);
    };
    act();
  });
}

// 무대 스포트라이트 빔 (좌우로 스윙)
export function spotlights(scene: Phaser.Scene, xs: number[], y: number, colors: number[], depth = -60) {
  xs.forEach((x, i) => {
    const b = scene.add.image(x, y, 'beam').setOrigin(0.5, 0).setTint(colors[i % colors.length]).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.28).setDepth(depth).setScale(0.6, 0.8);
    b.setAngle(i % 2 ? 18 : -18);
    scene.tweens.add({ targets: b, angle: i % 2 ? -18 : 18, yoyo: true, repeat: -1, duration: 1800 + i * 200, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: b, alpha: 0.42, yoyo: true, repeat: -1, duration: 500 + i * 90 });
  });
}

// 기차 (다리 위를 지나감)
export function train(scene: Phaser.Scene, y: number, every = 9000, depth = -84, scale = 1) {
  const run = () => {
    const g = scene.add.graphics({ x: W + 10, y }).setDepth(depth).setScale(scale);
    for (let c = 0; c < 5; c++) {
      g.fillStyle(0x2a2a3a); g.fillRect(c * 17 - 0.5, -0.5, 16, 6);
      g.fillStyle(0xe8ecf4); g.fillRect(c * 17, 0, 15, 5);
      g.fillStyle(0x3aa86a); g.fillRect(c * 17, 3, 15, 1);
      g.fillStyle(0x6fa0e0); for (let w = 1; w < 14; w += 3.5) g.fillRect(c * 17 + w, 1, 2, 1.5);
    }
    scene.tweens.add({ targets: g, x: -100 * scale, duration: 5200, onComplete: () => g.destroy() });
  };
  scene.time.delayedCall(rnd(1000, 3000), run);
  scene.time.addEvent({ delay: every, loop: true, callback: run });
}

// LED 월 색 순환
export function ledCycle(scene: Phaser.Scene, r: R, depth = -70) {
  const o = scene.add.rectangle(r[0], r[1], r[2], r[3], 0xff4fd8).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.12).setDepth(depth);
  const cols = [0xff4fd8, 0x4fd8ff, 0x9a5aff, 0xffd84f];
  let i = 0;
  scene.time.addEvent({ delay: 500, loop: true, callback: () => { o.setFillStyle(cols[++i % cols.length]); o.setAlpha(0.08 + Math.random() * 0.1); } });
}

// ---------- 배경별 구성 ----------
export function ambientFor(scene: Phaser.Scene, bg: string) {
  makeAmbientTextures(scene);
  switch (bg) {
    case 'sky':
      clouds(scene, 7, 30, 320, 40, -60, 1, 1.6);
      break;
    case 'airport':
      clouds(scene, 4, 70, 120, 4, -95, 0.9, 0.6);
      twinkle(scene, [[190, 130, 260, 30]], 14, [0xfff3b0, 0xffffff]);
      glints(scene, [[0, 230, W, 120]], 4, -85, 0xffffff);
      break;
    case 'title':
      clouds(scene, 5, 10, 120, 6, -95);
      birds(scene, 40, 140, 6000);
      glints(scene, [[40, 250, 560, 40]], 10);
      train(scene, 226, 8000, -84, 1);
      break;
    case 'map1':
      glints(scene, [[0, 0, 40, H], [600, 0, 40, H], [0, 330, W, 30], [250, 60, 30, 260]], 14);
      cloudShadows(scene, 3);
      clouds(scene, 3, 10, 300, 5, 2.5, 0.85, 1.2);
      birds(scene, 20, 200, 7000, 9);
      break;
    case 'map2':
      glints(scene, [[60, 20, 120, 120], [130, 140, 140, 120], [200, 250, 130, 110]], 14);
      cloudShadows(scene, 3);
      clouds(scene, 2, 10, 300, 5, 2.5, 0.8, 1.2);
      birds(scene, 20, 200, 7000, 9);
      break;
    case 'map3':
      clouds(scene, 4, 10, 120, 5, -95);
      twinkle(scene, [[0, 120, 100, 150], [540, 120, 100, 150]], 18, [0xfff3b0, 0xffffff]);
      birds(scene, 20, 80, 7000);
      break;
    case 'hanok_ext':
      clouds(scene, 4, 10, 80, 5, -95);
      birds(scene, 20, 90, 6500);
      butterflies(scene, [380, 230, 220, 90], 2, 640);
      petals(scene, 1.2, 650);
      break;
    case 'hanok_int':
      motes(scene, [440, 40, 160, 140], 24);
      glow(scene, 600, 140, 26, 0xffd27a, 0.2, 0.45, 1400);
      break;
    case 'jjimjil':
      [[155, 112], [320, 112], [485, 112]].forEach(([x, y], i) => {
        glow(scene, x, y, 60, 0xff7a2a, 0.35, 0.7, 500 + i * 130, true);
        glow(scene, x, y + 10, 30, 0xffd27a, 0.3, 0.6, 300 + i * 90, true);
      });
      motes(scene, [60, 60, 520, 160], 20, 0xffb070);
      break;
    case 'temple':
      [60, 140, 220, 300, 380, 460, 540, 610].forEach((x, i) => glow(scene, x, 26 + (i % 3) * 8, 16, pick([0xff6a8a, 0xffd84f, 0x7dff8a]), 0.15, 0.45, 800 + i * 80, false, -84));
      petals(scene, 2.5, 650);
      butterflies(scene, [200, 230, 300, 80], 2, 640);
      birds(scene, 20, 90, 8000);
      break;
    case 'palace':
      clouds(scene, 4, 10, 100, 5, -95);
      birds(scene, 20, 110, 6000);
      petals(scene, 0.6, 650);
      break;
    case 'park':
      balloons(scene, [60, 600], 1800);
      twinkle(scene, [[20, 140, 130, 100], [460, 40, 130, 160]], 30, [0xffe066, 0xffffff, 0xff9fd8]);
      clouds(scene, 3, 10, 70, 5, -95);
      break;
    case 'pcbang2':
      glow(scene, 320, 72, 70, 0x4fd8ff, 0.2, 0.5, 700, true, -84);
      glow(scene, 600, 40, 40, 0xff4fd8, 0.1, 0.3, 900, true, -84);
      twinkle(scene, [[0, 130, W, 40]], 20, [0x6fd8ff, 0x9a7aff]);
      break;
    case 'hangang':
      glints(scene, [[0, 150, W, 90]], 16);
      clouds(scene, 4, 5, 60, 4, -95);
      break;
    case 'cvs':
      glints(scene, [[380, 150, 260, 40]], 10);
      clouds(scene, 3, 5, 60, 4, -95);
      twinkle(scene, [[60, 110, 240, 60]], 12, [0xffffff]);
      break;
    case 'hansik':
      [[107, 52], [533, 52], [160, 182], [480, 182]].forEach(([x, y], i) => glow(scene, x, y, 22, 0xffc66a, 0.25, 0.55, 1100 + i * 150, true, -84));
      motes(scene, [220, 40, 200, 160], 20);
      break;
    case 'salon':
      glow(scene, 320, 64, 34, 0xff5fa2, 0.25, 0.65, 800, true, -84);
      twinkle(scene, [[120, 90, 80, 110], [282, 90, 80, 110], [444, 90, 80, 110]], 18, [0xffffff, 0xffd6ec]);
      break;
    case 'stage':
      ledCycle(scene, [90, 50, 460, 180]);
      spotlights(scene, [125, 250, 385, 510], 14, [0xff4fd8, 0x4fd8ff, 0xff4fd8, 0x4fd8ff]);
      twinkle(scene, [[0, 320, W, 20]], 24, [0xff4fd8, 0x4fd8ff, 0xffffff]);
      break;
    case 'night':
      twinkle(scene, [[0, 0, W, 70]], 30, [0xffffff, 0xfff3b0]);
      twinkle(scene, [[0, 120, 190, 70], [450, 100, 190, 90]], 30, [0xfff3b0, 0xffd27a]);
      glints(scene, [[0, 200, W, 30]], 12, -85, 0xffe0a0);
      fireflies(scene, [0, 230, W, 90], 16);
      [[78, 268], [182, 263], [604, 270]].forEach(([x, y]) => glow(scene, x, y, 14, 0xffc66a, 0.3, 0.7, 700, true, -84));
      break;
    case 'dusk':
      break; // Outro 씬에서 세로 배경에 맞춰 직접 구성
  }
}

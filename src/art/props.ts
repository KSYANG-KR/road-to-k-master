// 코드로 그리는 소품 텍스처 (외곽선·음영 포함 픽셀아트): 신발, 요·이불·베개, 맥반석 계란, 여행가방, 다리 기둥 표지판
import { PixelCanvas, shade, mix, type Color } from './pixel';

function reg(scene: Phaser.Scene, key: string, draw: () => PixelCanvas) {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, draw().toCanvas());
  return key;
}

function lum(c: Color) {
  return (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255;
}

// 옆에서 본 운동화 한 켤레 (앞코가 오른쪽)
export function shoeTex(scene: Phaser.Scene, color: Color) {
  return reg(scene, `shoes_${color.toString(16)}`, () => {
    const pc = new PixelCanvas(26, 15);
    const light = lum(color) > 0.8;
    const body = light ? 0xf4f4f8 : color;
    const dark = light ? 0xc8c8d6 : shade(color, 0.72);
    const accent = light ? 0x5a7ad8 : mix(color, 0xffffff, 0.55);
    const one = (x0: number, y0: number, back = false) => {
      const k = (c: Color) => (back ? shade(c, 0.86) : c);
      pc.rows(y0, [[3, 7], [2, 10], [1, 12], [1, 14], [0, 15]].map(([a, b]) => [a + x0, b + x0] as [number, number]), k(body));
      pc.rect(x0 + 3, y0, 3, 1, dark); // 발목 입구
      pc.rect(x0 + 1, y0 + 4, 15, 1, dark);
      // 끈과 줄무늬
      pc.set(x0 + 7, y0 + 1, 0xffffff); pc.set(x0 + 9, y0 + 2, 0xffffff); pc.set(x0 + 11, y0 + 2, 0xffffff);
      pc.rect(x0 + 4, y0 + 3, 6, 1, accent);
      // 밑창
      pc.rect(x0, y0 + 5, 17, 2, 0xf6f4ee);
      pc.rect(x0, y0 + 7, 17, 1, 0xb8b0a8);
      pc.set(x0 + 1, y0 + 1, mix(body, 0xffffff, 0.5));
    };
    // 뒤쪽 신발을 살짝 비켜 겹쳐 놓은 한 켤레
    one(7, 1, true);
    one(1, 5);
    pc.outline(0.35, 0x2a2240);
    return pc;
  });
}

// 온돌 바닥에 펴는 요 + 이불 + 베개 (베개는 오른쪽)
export function beddingTex(scene: Phaser.Scene, color: Color, color2: Color) {
  return reg(scene, `bed_${color.toString(16)}`, () => {
    const pc = new PixelCanvas(136, 28);
    // 요(매트리스)
    const yo = 0xf6ead2;
    pc.rows(13, [[2, 133], [1, 134], [1, 134], [1, 134], [1, 134], [1, 134], [1, 134], [1, 134], [2, 133]], yo);
    pc.rect(2, 13, 132, 1, 0xfffaf0);
    pc.rect(1, 20, 134, 1, 0xe2d2b4);
    pc.rect(2, 21, 132, 1, 0xcdb894);
    // 이불
    pc.rows(8, [[3, 96], [2, 97], [2, 97], [2, 97], [2, 97], [2, 97], [2, 97], [2, 97], [2, 97], [2, 97], [3, 96]], color);
    pc.rect(3, 8, 94, 1, mix(color, 0xffffff, 0.35));
    pc.rect(2, 17, 96, 1, shade(color, 0.8));
    pc.rect(3, 18, 94, 1, shade(color, 0.7));
    // 꽃무늬
    for (let x = 10; x < 92; x += 14) for (const [dx, dy] of [[0, 0], [7, 4]]) {
      const cx = x + dx, cy = 11 + dy;
      if (cx > 94) continue;
      pc.set(cx, cy - 1, color2); pc.set(cx - 1, cy, color2); pc.set(cx + 1, cy, color2); pc.set(cx, cy + 1, color2);
      pc.set(cx, cy, 0xfff2a0);
    }
    // 흰 동정(이불 깃)
    pc.rect(88, 8, 9, 11, 0xffffff);
    pc.rect(88, 17, 9, 1, 0xdedad0);
    // 베개 (양 끝 베갯모)
    pc.rows(6, [[104, 127], [103, 128], [103, 128], [103, 128], [103, 128], [103, 128], [103, 128], [104, 127]], 0xf2e2c2);
    pc.rect(104, 6, 23, 1, 0xfffaf0);
    pc.rect(103, 12, 26, 1, 0xd8c49a);
    for (const ex of [103, 125]) {
      pc.rect(ex, 7, 4, 6, 0xd83a4a);
      pc.set(ex + 1, 9, 0x3a6ad8); pc.set(ex + 2, 10, 0xffd23f);
    }
    pc.outline(0.4, 0x5a3a2a);
    return pc;
  });
}

// 맥반석 계란 한 알
export function eggTex(scene: Phaser.Scene) {
  return reg(scene, 'egg1', () => {
    const pc = new PixelCanvas(12, 14);
    pc.ellipse(6, 7, 4, 5, 0xb0703a);
    pc.ellipse(5, 6, 2, 3, 0xc88850);
    pc.set(4, 4, 0xe8b880); pc.set(4, 5, 0xe8b880);
    pc.set(8, 10, 0x8a5428); pc.set(7, 11, 0x8a5428);
    pc.outline(0.4, 0x3a2414);
    return pc;
  });
}

// 바퀴 달린 여행가방
export function suitcaseTex(scene: Phaser.Scene, color: Color) {
  return reg(scene, `case_${color.toString(16)}`, () => {
    const pc = new PixelCanvas(20, 30);
    // 손잡이
    pc.rect(8, 1, 4, 1, 0x3a3a48); pc.rect(8, 1, 1, 7, 0x3a3a48); pc.rect(11, 1, 1, 7, 0x3a3a48);
    // 본체
    pc.rows(8, Array.from({ length: 18 }, (_, i) => (i === 0 || i === 17 ? [3, 16] : [2, 17]) as [number, number]), color);
    pc.rect(3, 9, 13, 1, mix(color, 0xffffff, 0.35));
    pc.rect(16, 9, 1, 16, shade(color, 0.78));
    pc.rect(3, 24, 14, 1, shade(color, 0.72));
    // 세로 리브
    for (const x of [6, 9, 12]) pc.rect(x, 10, 1, 13, shade(color, 0.86));
    // 이름표 스티커
    pc.rect(4, 12, 3, 4, 0xfff6d8); pc.set(5, 13, 0xe8303a);
    // 바퀴
    pc.rect(4, 26, 2, 2, 0x2a2a34); pc.rect(14, 26, 2, 2, 0x2a2a34);
    pc.outline(0.4, 0x22202e);
    return pc;
  });
}

// 잠수교 기둥에 붙는 파란 도로 표지판
export function bridgeSignTex(scene: Phaser.Scene) {
  return reg(scene, 'jamsu_sign', () => {
    const pc = new PixelCanvas(30, 16);
    pc.rows(1, Array.from({ length: 14 }, (_, i) => (i === 0 || i === 13 ? [2, 27] : [1, 28]) as [number, number]), 0x1f5fb8);
    pc.rect(3, 2, 24, 1, 0xffffff);
    pc.rect(3, 13, 24, 1, 0xffffff);
    pc.rect(2, 3, 1, 10, 0xffffff); pc.rect(27, 3, 1, 10, 0xffffff);
    pc.outline(0.4, 0x14204a);
    return pc;
  });
}

// 비행기: 꼬리 날개의 하트 자리에 픽셀 태극기를 그려 넣은 텍스처 (원본 아트 1도트 = 3px)
const TAEGUK = [
  'ooooooooooooooooo',
  'owwwwwwwwwwwwwwwo',
  'owkwwwwwwwwwwwkwo',
  'owwkwwwwwwwwwkwwo',
  'owwwwwwrrrwwwwwwo',
  'owwwwwrrrrrwwwwwo',
  'owwwwwrrrrbwwwwwo',
  'owwwwwrbbbbwwwwwo',
  'owwwwwwbbbwwwwwwo',
  'owwkwwwwwwwwwkwwo',
  'owkwwwwwwwwwwwkwo',
  'owwwwwwwwwwwwwwwo',
  'ooooooooooooooooo',
];
export function planeTex(scene: Phaser.Scene) {
  const key = 'plane_kr';
  if (scene.textures.exists(key)) return key;
  const fr = scene.textures.getFrame('plane', 'plane');
  const cv = document.createElement('canvas');
  cv.width = fr.cutWidth; cv.height = fr.cutHeight;
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.drawImage(fr.source.image as CanvasImageSource, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
  // 하트 지우기 (꼬리 날개 바탕색으로)
  g.fillStyle = '#f4f6fa';
  g.fillRect(57, 51, 18, 16);
  const col: Record<string, string> = { o: '#9aa6c4', w: '#ffffff', k: '#20202a', r: '#d6283c', b: '#1f4fa8' };
  const P = 3, x0 = 62, y0 = 47;
  TAEGUK.forEach((row, y) => [...row].forEach((c, x) => {
    g.fillStyle = col[c];
    g.fillRect(x0 + x * P, y0 + y * P, P, P);
  }));
  scene.textures.addCanvas(key, cv);
  return key;
}

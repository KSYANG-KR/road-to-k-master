// 모든 Graphics 도형을 논리 픽셀 격자(1px = 화면 4px)에 맞춰 그리도록 패치한다.
// 둥근 사각형은 계단식 모서리, 원·타원·작은 삼각형은 픽셀 행 단위로 채워
// UI 패널·버튼·아이콘이 배경 픽셀아트와 같은 질감이 되게 한다.
import Phaser from 'phaser';

type G = Phaser.GameObjects.Graphics & { _fc?: number; _fa?: number; _lw?: number; _lc?: number; _la?: number };
const P = Phaser.GameObjects.Graphics.prototype as unknown as Record<string, (...a: any[]) => any>;
const orig = {
  fillRect: P.fillRect, fillStyle: P.fillStyle, lineStyle: P.lineStyle,
  fillRoundedRect: P.fillRoundedRect, strokeRoundedRect: P.strokeRoundedRect,
  fillCircle: P.fillCircle, strokeCircle: P.strokeCircle, fillEllipse: P.fillEllipse,
  fillTriangle: P.fillTriangle, strokeRect: P.strokeRect, lineBetween: P.lineBetween,
};
const R = Math.round;

// 모서리 계단 (위에서부터 각 행이 안으로 들어가는 픽셀 수)
function steps(r: number): number[] {
  if (r < 1.5) return [];
  if (r < 3.5) return [1];
  if (r < 6.5) return [2, 1];
  if (r < 9.5) return [3, 1, 1];
  return [4, 2, 1, 1];
}

// 행 단위 범위 목록 [y, x0, x1) → 같은 행이 이어지면 하나의 사각형으로 합쳐 그림
function emitRows(g: G, rows: [number, number, number][]) {
  let i = 0;
  while (i < rows.length) {
    const [y, a, b] = rows[i];
    let j = i + 1;
    while (j < rows.length && rows[j][1] === a && rows[j][2] === b && rows[j][0] === rows[j - 1][0] + 1) j++;
    if (b > a) orig.fillRect.call(g, a, y, b - a, j - i);
    i = j;
  }
}

function boxRows(x: number, y: number, w: number, h: number, r: number) {
  const X = R(x), Y = R(y), W = Math.max(1, R(x + w) - X), H = Math.max(1, R(y + h) - Y);
  const s = steps(Math.min(r, W / 2, H / 2));
  const rows: [number, number, number][] = [];
  for (let k = 0; k < H; k++) {
    const ins = s[k] ?? s[H - 1 - k] ?? 0;
    rows.push([Y + k, X + ins, X + W - ins]);
  }
  return { X, Y, W, H, s, rows };
}

const radius = (r: unknown) => (typeof r === 'number' ? r : (r as { tl?: number })?.tl ?? 4);

P.fillStyle = function (this: G, c: number, a = 1) { this._fc = c; this._fa = a; return orig.fillStyle.call(this, c, a); };
P.lineStyle = function (this: G, w: number, c: number, a = 1) { this._lw = w; this._lc = c; this._la = a; return orig.lineStyle.call(this, w, c, a); };

P.fillRect = function (this: G, x: number, y: number, w: number, h: number) {
  // 큰 배경 사각형은 그대로, UI 크기의 사각형만 정수 픽셀로
  if (Math.abs(w) > 2000 || Math.abs(h) > 2000) return orig.fillRect.call(this, x, y, w, h);
  const X = R(x), Y = R(y);
  const W = w > 0 ? Math.max(1, R(x + w) - X) : 0, H = h > 0 ? Math.max(1, R(y + h) - Y) : 0;
  return orig.fillRect.call(this, X, Y, W, H);
};

P.fillRoundedRect = function (this: G, x: number, y: number, w: number, h: number, r?: unknown) {
  emitRows(this, boxRows(x, y, w, h, radius(r)).rows);
  return this;
};

// 테두리: 바깥 모양에서 안쪽(두께만큼 들어간 같은 모양)을 뺀 픽셀
function ring(g: G, x: number, y: number, w: number, h: number, r: number, t: number) {
  const o = boxRows(x, y, w, h, r);
  const L: [number, number, number][] = [], Rr: [number, number, number][] = [];
  o.rows.forEach(([yy, a, b], k) => {
    const ik = k - t;
    if (ik < 0 || ik >= o.H - 2 * t) { L.push([yy, a, b]); return; }
    const ins = o.s[ik] ?? o.s[o.H - 2 * t - 1 - ik] ?? 0;
    L.push([yy, a, Math.min(b, o.X + t + ins)]);
    Rr.push([yy, Math.max(a, o.X + o.W - t - ins), b]);
  });
  emitRows(g, L); emitRows(g, Rr);
}

function withLineFill(g: G, fn: () => void) {
  const fc = g._fc ?? 0xffffff, fa = g._fa ?? 1;
  orig.fillStyle.call(g, g._lc ?? 0xffffff, g._la ?? 1);
  fn();
  orig.fillStyle.call(g, fc, fa);
}

P.strokeRoundedRect = function (this: G, x: number, y: number, w: number, h: number, r?: unknown) {
  const t = Math.max(1, R(this._lw ?? 1));
  withLineFill(this, () => ring(this, x, y, w, h, radius(r), t));
  return this;
};
P.strokeRect = function (this: G, x: number, y: number, w: number, h: number) {
  const t = Math.max(1, R(this._lw ?? 1));
  withLineFill(this, () => ring(this, x, y, w, h, 0, t));
  return this;
};
P.lineBetween = function (this: G, x1: number, y1: number, x2: number, y2: number) {
  // 가로·세로 선만 픽셀 사각형으로 (사선은 원래대로)
  const t = Math.max(1, R(this._lw ?? 1));
  if (Math.abs(y1 - y2) < 0.01 || Math.abs(x1 - x2) < 0.01) {
    withLineFill(this, () => {
      if (Math.abs(y1 - y2) < 0.01) orig.fillRect.call(this, R(Math.min(x1, x2)), R(y1 - t / 2), Math.max(1, R(Math.abs(x2 - x1))), t);
      else orig.fillRect.call(this, R(x1 - t / 2), R(Math.min(y1, y2)), t, Math.max(1, R(Math.abs(y2 - y1))));
    });
    return this;
  }
  return orig.lineBetween.call(this, x1, y1, x2, y2);
};

function ellipseRows(cx: number, cy: number, rx: number, ry: number) {
  const CX = R(cx * 2) / 2, CY = R(cy * 2) / 2;
  const rows: [number, number, number][] = [];
  const y0 = Math.floor(CY - ry), y1 = Math.ceil(CY + ry);
  for (let y = y0; y < y1; y++) {
    const dy = (y + 0.5 - CY) / ry;
    if (Math.abs(dy) > 1) continue;
    const hw = rx * Math.sqrt(1 - dy * dy);
    const a = R(CX - hw), b = R(CX + hw);
    if (b > a) rows.push([y, a, b]);
  }
  return rows;
}

P.fillCircle = function (this: G, x: number, y: number, r: number) {
  if (r > 80) return orig.fillCircle.call(this, x, y, r);
  emitRows(this, ellipseRows(x, y, r, r));
  return this;
};
P.fillEllipse = function (this: G, x: number, y: number, w: number, h: number) {
  if (w > 200) return orig.fillEllipse.call(this, x, y, w, h);
  emitRows(this, ellipseRows(x, y, w / 2, h / 2));
  return this;
};
P.strokeCircle = function (this: G, x: number, y: number, r: number) {
  const t = Math.max(1, R(this._lw ?? 1));
  const outer = ellipseRows(x, y, r, r), inner = new Map(ellipseRows(x, y, r - t, r - t).map((q) => [q[0], q]));
  withLineFill(this, () => {
    const L: [number, number, number][] = [], Rr: [number, number, number][] = [];
    for (const [yy, a, b] of outer) {
      const i = inner.get(yy);
      if (!i) { L.push([yy, a, b]); continue; }
      L.push([yy, a, i[1]]); Rr.push([yy, i[2], b]);
    }
    emitRows(this, L); emitRows(this, Rr);
  });
  return this;
};

P.fillTriangle = function (this: G, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
  const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2), minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
  if (maxX - minX > 64 || maxY - minY > 64) return orig.fillTriangle.call(this, x0, y0, x1, y1, x2, y2);
  const E = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
  const rows: [number, number, number][] = [];
  for (let y = Math.floor(minY); y < Math.ceil(maxY); y++) {
    const yc = y + 0.5;
    const xs: number[] = [];
    for (const [ax, ay, bx, by] of E) {
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
    }
    if (xs.length < 2) continue;
    const a = R(Math.min(...xs)), b = R(Math.max(...xs));
    rows.push([y, a, Math.max(b, a + 1)]);
  }
  emitRows(this, rows);
  return this;
};

export {};

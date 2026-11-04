// 개발용: 모든 캐릭터·포즈를 한 화면에 늘어놓고 확인 (?scene=chartest)
import Phaser from 'phaser';
import { bakeCharacter, renderPose, POSES, type CharDef, type Outfit } from '../art/characters';
import { CAST, LINEUP, NPC, OUTFITS } from '../art/cast';

export class CharTest extends Phaser.Scene {
  constructor() { super('chartest'); }

  create() {
    this.cameras.main.setZoom(2).centerOn(320, 180);
    this.cameras.main.setBackgroundColor('#cfd8e8');
    const page = Number(new URLSearchParams(location.search).get('page') ?? 0);
    if (page === 0) {
      // 8인 라인업 × 대표 포즈
      const poses = ['idle0', 'walk0', 'cheer0', 'wave0', 'eat0', 'v0', 'sit0', 'back0', 'run0', 'lie0', 'dance0', 'selfie'];
      LINEUP.forEach((id, row) => {
        const key = bakeCharacter(this, CAST[id]);
        poses.forEach((p, col) => this.add.image(8 + col * 52, -4 + row * 44, key, p).setOrigin(0).setScale(0.5));
      });
    } else if (page === 1) {
      // 주인공 의상 변형
      const outfits = [OUTFITS.hanaLv1, OUTFITS.hanaLv2, OUTFITS.hanaLv3, OUTFITS.hanaMax, OUTFITS.jjimjil(), OUTFITS.monk, OUTFITS.uniformF, OUTFITS.run0];
      outfits.forEach((o, row) => {
        const key = bakeCharacter(this, CAST.hana, o, `test_${row}`);
        Object.keys(POSES).slice(0, 12).forEach((p, col) => this.add.image(8 + col * 52, -4 + row * 44, key, p).setOrigin(0).setScale(0.5));
      });
    } else {
      const all = [...Object.values(NPC)];
      all.forEach((d, row) => {
        const key = bakeCharacter(this, d);
        Object.keys(POSES).slice(12, 24).forEach((p, col) => this.add.image(8 + col * 52, 4 + row * 50, key, p).setOrigin(0).setScale(0.5));
      });
    }
  }
}

// 개발용: 캐릭터×포즈 시트를 PNG로 저장  window.charSheet('lineup', 2)
export function charSheet(which = 'lineup', scale = 2) {
  const poses = ['idle0', 'walk0', 'cheer0', 'wave0', 'eat0', 'v0', 'sit0', 'back0', 'run0', 'lie0', 'dance0', 'selfie'];
  let rows: [CharDef, Outfit | undefined][] = LINEUP.map((id) => [CAST[id], undefined]);
  if (which === 'hana') rows = [OUTFITS.hanaLv1, OUTFITS.hanaLv2, OUTFITS.hanaLv3, OUTFITS.hanaMax, OUTFITS.jjimjil(), OUTFITS.monk, OUTFITS.uniformF, OUTFITS.run0].map((o) => [CAST.hana, o]);
  if (which === 'npc') rows = Object.values(NPC).map((d) => [d, undefined]);
  const cv = document.createElement('canvas');
  cv.width = poses.length * 96 * scale; cv.height = rows.length * 112 * scale;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#cfd8e8'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.imageSmoothingEnabled = false;
  rows.forEach(([d, o], r) => poses.forEach((p, i) => ctx.drawImage(renderPose(d, p, o).toCanvas(), i * 96 * scale, r * 112 * scale, 96 * scale, 112 * scale)));
  return new Promise((ok) => cv.toBlob((b) => fetch(`/__capture?name=sheet_${which}.png`, { method: 'POST', body: b }).then(() => ok(which))));
}

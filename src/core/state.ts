// 게임 진행 상태: 레벨/XP/미션 클리어 기록
import { OUTFITS } from '../art/cast';
import type { Outfit } from '../art/characters';

export interface LevelInfo {
  lv: number;
  title: string;
  ko: string;
  en: string;
  color: number;
}

export const LEVELS: LevelInfo[] = [
  { lv: 1, title: 'K-ROOKIE', ko: '한국을 처음 경험하기', en: 'First taste of Korea', color: 0x6fdc5a },
  { lv: 2, title: 'K-PLAYER', ko: '한국을 제대로 즐기기', en: 'Enjoy Korea for real', color: 0xffcc33 },
  { lv: 3, title: 'K-MASTER', ko: '한국인처럼 스며들기', en: 'Blend in like a local', color: 0xff6fa8 },
];

export const MAX_XP = 1000;

// 스테이지별 미션 순서와 보상 (각 스테이지 합계 1000XP)
export interface MissionInfo {
  key: string;
  scene: string;
  label: string;
  en: string;
  xp: number;
  data?: Record<string, unknown>;
}

export const STAGES: MissionInfo[][] = [
  [
    { key: 'hanok', scene: 'HanokShoes', label: '한옥', en: 'Hanok', xp: 350 },
    { key: 'jjimjil', scene: 'Jjimjil', label: '찜질방', en: 'Jjimjilbang', xp: 200 },
    { key: 'temple', scene: 'DressCode', label: '절', en: 'Temple', xp: 150, data: { variant: 'temple' } },
    { key: 'palace', scene: 'DressCode', label: '경복궁', en: 'Palace', xp: 150, data: { variant: 'palace' } },
    { key: 'park', scene: 'DressCode', label: '놀이공원', en: 'Theme park', xp: 150, data: { variant: 'park' } },
  ],
  [
    { key: 'pcbang', scene: 'PcBang', label: 'PC방', en: 'PC bang', xp: 300 },
    { key: 'hangang', scene: 'Hangang', label: '한강 러닝', en: 'Hangang run', xp: 400 },
    { key: 'cvs', scene: 'Cvs', label: '편의점', en: 'Convenience store', xp: 300 },
  ],
  [
    { key: 'hansik', scene: 'Hansik', label: '한식당', en: 'Restaurant', xp: 250 },
    { key: 'salon', scene: 'Salon', label: '미용실', en: 'Hair salon', xp: 250 },
    { key: 'photo', scene: 'PhotoBooth', label: '포토부스', en: 'Photo booth', xp: 200 },
    { key: 'dance', scene: 'Dance', label: '댄스학원', en: 'Dance studio', xp: 300 },
  ],
];

class GameState {
  stage = 0; // 0..2
  xp = 0; // 현재 레벨 안에서의 XP
  cleared = new Set<string>();
  maxed = false;
  hero = 'hana'; // 고른 캐릭터 id (캐릭터 선택에서 정함)
  // 미션별 별점 (1~3)
  stars: Record<string, number> = {};

  get totalStars() { return Object.values(this.stars).reduce((a, b) => a + b, 0); }
  get maxStars() { return STAGES.flat().length * 3; }

  get level(): LevelInfo {
    return LEVELS[this.stage];
  }

  get heroOutfit(): Outfit {
    if (this.maxed) return OUTFITS.hanaMax;
    return [OUTFITS.hanaLv1, OUTFITS.hanaLv2, OUTFITS.hanaLv3][this.stage];
  }

  nextMission(): MissionInfo | undefined {
    return STAGES[this.stage]?.find((m) => !this.cleared.has(m.key));
  }

  stageDone(): boolean {
    return STAGES[this.stage].every((m) => this.cleared.has(m.key));
  }

  reset() {
    this.stage = 0; this.xp = 0; this.cleared.clear(); this.maxed = false; this.stars = {};
  }

  // 디버그/녹화용: 특정 미션 직전 상태로 맞추기
  jumpTo(missionKey: string) {
    this.reset();
    for (let s = 0; s < STAGES.length; s++) {
      for (const m of STAGES[s]) {
        if (m.key === missionKey) { this.stage = s; return; }
        this.cleared.add(m.key);
        this.xp += m.xp;
      }
      this.xp = 0;
    }
  }
}

export const state = new GameState();

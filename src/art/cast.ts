// 등장인물 정의 — 콘티 '최종 통일본' 캐릭터와 같은 머리·옷·색으로 맞춤
import { isGirl, type CharDef, type Outfit } from './characters';

export const CAST: Record<string, CharDef> = {
  // 레벨업 카드의 주인공: 긴 웨이브 갈색 머리, 흰 티, 청바지, 주황 배낭
  hana: {
    id: 'hana', name: 'HANA', skin: 'fair', hair: 'wavy', hairColor: 0x7b4a2c,
    outfit: { top: 'tee', topColor: 0xffffff, bottom: 'jeans', bottomColor: 0x3f6fc4, shoes: 0xf4f4f4, backpack: 0xf09a2a },
  },
  // 아프로, 청록 재킷 + 흰 티, 남색 청바지
  amara: {
    id: 'amara', name: 'AMARA', skin: 'dark', hair: 'puff', hairColor: 0x221816,
    outfit: { top: 'jacket', topColor: 0x2a9a9a, topColor2: 0xf4f4f4, bottom: 'jeans', bottomColor: 0x2f3f74, shoes: 0xffffff, backpack: 0x34407a },
  },
  // 검은 생머리, 크림 블라우스 + 검정 멜빵 원피스, 흰 양말, 분홍 크로스백
  mei: {
    id: 'mei', name: 'MEI', skin: 'light', hair: 'long', hairColor: 0x1e1a22,
    outfit: { top: 'pinafore', topColor: 0x26222c, topColor2: 0xf3ead6, bottom: 'skirt', bottomColor: 0x26222c, shoes: 0x24202a, socks: 0xffffff, bag: 0xf08ab0 },
  },
  // 몽실한 금발, 알록달록 패치워크 체크 셔츠, 청바지, 초록 배낭
  leo: {
    id: 'leo', name: 'LEO', skin: 'fair', hair: 'fluffy', hairColor: 0xe8b44a,
    outfit: { top: 'jacket', topColor: 0xd8443a, topColor2: 0xf3ead6, pattern: 'patch', bottom: 'jeans', bottomColor: 0x3f6fc4, shoes: 0xf4f4f4, backpack: 0x3a8a5a },
  },
  // 금발 웨이브 + 분홍 꽃 핀, 흰 칼라 검정 블라우스, 회색 와이드 팬츠
  sofia: {
    id: 'sofia', name: 'SOFIA', skin: 'fair', hair: 'wavy', hairColor: 0xe8b04a,
    outfit: { top: 'blouse', topColor: 0x24222c, bottom: 'baggy', bottomColor: 0x8c8c96, shoes: 0x24202a, acc: ['flower'] },
  },
  // 갈색 곱슬, 초록 체크 셔츠, 청바지, 갈색 배낭
  noah: {
    id: 'noah', name: 'NOAH', skin: 'light', hair: 'fluffy', hairColor: 0x8a5432,
    outfit: { top: 'jacket', topColor: 0x2e8a4e, topColor2: 0xf3ead6, pattern: 'plaid', patternColor: 0x1d5a36, bottom: 'jeans', bottomColor: 0x3f6fc4, shoes: 0xf4f4f4, backpack: 0xc8903a },
  },
  // 똥머리 + 꽃 핀, 올리브 재킷 + 노란 티, 베이지 치마, 흰 양말, 분홍 배낭
  emma: {
    id: 'emma', name: 'EMMA', skin: 'light', hair: 'bun', hairColor: 0x8a5432,
    outfit: { top: 'jacket', topColor: 0x8a9a52, topColor2: 0xf6c94a, bottom: 'skirt', bottomColor: 0xd6a868, shoes: 0x7a4a2c, socks: 0xffffff, backpack: 0xf0a0a8, acc: ['flower'] },
  },
  // 짧은 트위스트, 흰 칼라 초록 스웨터, 검정 바지, 남색 배낭
  kofi: {
    id: 'kofi', name: 'KOFI', skin: 'brown', hair: 'twists', hairColor: 0x1e1614,
    outfit: { top: 'sweater', topColor: 0x2e7a4e, topColor2: 0xf4f4f4, bottom: 'pants', bottomColor: 0x1e1e26, shoes: 0xf4f4f4, backpack: 0x2c3a6a },
  },
  // 붉은 갈색 가르마, 남색 정장 + 파란 넥타이
  james: {
    id: 'james', name: 'JAMES', skin: 'light', hair: 'slick', hairColor: 0xb87a48,
    outfit: { top: 'suit', topColor: 0x23305e, bottom: 'pants', bottomColor: 0x23305e, shoes: 0x2b2420, accColor: 0x3a7ae0 },
  },
};

// 콘티 공항 라인업 순서 (선택 가능한 8명)
export const LINEUP = ['amara', 'mei', 'leo', 'sofia', 'noah', 'emma', 'kofi', 'james'];

// 캐릭터 소개 (역할 영/한 + 한 줄 소개 한/영)
export const PROFILE: Record<string, { role: [string, string]; bio: [string, string] }> = {
  amara: { role: ['CURIOUS', '호기심쟁이'], bio: ['새로운 건 뭐든 해 보고 싶어요', 'Wants to try everything new'] },
  mei: { role: ['FOODIE', '미식가'], bio: ['맛집 지도 없이는 여행 안 해요', 'Never travels without a food map'] },
  leo: { role: ['GAMER', '게이머'], bio: ['한국 PC방이 제일 궁금해요', 'Can\'t wait to see a Korean PC bang'] },
  sofia: { role: ['DREAMER', '몽상가'], bio: ['K-드라마 속 장면을 찾아왔어요', 'Came looking for K-drama scenes'] },
  noah: { role: ['EXPLORER', '탐험가'], bio: ['골목골목 걸어서 서울을 누벼요', 'Explores Seoul on foot, alley by alley'] },
  hana: { role: ['LEADER', '리더'], bio: ['친구들을 이끄는 여행 리더예요', 'The one who leads the trip'] },
  emma: { role: ['ARTIST', '아티스트'], bio: ['예쁜 사진과 그림을 사랑해요', 'Loves pretty photos and art'] },
  kofi: { role: ['RUNNER', '러너'], bio: ['한강 러닝이 버킷리스트예요', 'A Hangang run is on the bucket list'] },
  james: { role: ['WORKER', '직장인'], bio: ['휴가 내고 온 바쁜 직장인이에요', 'A busy worker on a well-earned break'] },
};

// ---- 주인공 선택 ----
// 장면 스크립트는 주인공 자리를 'hana' 로 쓴다. CAST.hana 에는 고른 캐릭터가 들어간다.
// 고정 출연진 목록에 주인공 본인이 또 있으면 pickCrew() 가 그 자리를 다른 친구로 바꿔 한 장면에 같은 사람이 둘 나오지 않게 한다.
const ORIGINAL: Record<string, CharDef> = { ...CAST };
export let HERO = 'mei';
export function setHero(id: string) {
  Object.assign(CAST, ORIGINAL);
  HERO = LINEUP.includes(id) ? id : 'mei';
  CAST.hana = ORIGINAL[HERO];
}
setHero('mei');
const SPARE = ['sofia', 'noah', 'emma', 'kofi', 'james', 'amara', 'leo', 'mei'];
export function pickCrew(ids: string[]): string[] {
  const used = new Set(ids);
  return ids.map((id) => {
    if (id !== HERO) return id;
    const s = SPARE.find((k) => !used.has(k) && k !== HERO) ?? id;
    used.add(s);
    return s;
  });
}
// 라인업(군중) 장면에서 이 사람이 주인공인지
export const isHero = (id: string) => id === HERO || id === 'hana';
export const heroName = () => CAST.hana.name;

// ---- 미션/레벨별 의상 ----
export const OUTFITS = {
  // 레벨 카드 의상 (콘티 #15·#20·#28) — Lv1 은 고른 캐릭터의 평소 옷
  get hanaLv1(): Outfit { return CAST.hana.outfit; },
  // K-PLAYER: 남색 교복 + 노란 줄무늬 넥타이 + 분홍 배낭 (성별에 맞춰 치마/바지)
  get hanaLv2(): Outfit {
    const base: Outfit = { top: 'uniform', topColor: 0x22305a, bottom: 'pants', bottomColor: 0x26346e, shoes: 0x6a3a22, backpack: 0xf08ab0, accColor: 0xf2c94c };
    return isGirl(CAST.hana.id) ? { ...base, bottom: 'skirt', socks: 0xffffff } : base;
  },
  // K-MASTER: 파란 헤드폰 + 파란 무늬 니트 + 데님 반바지 + 파란 운동화
  hanaLv3: { top: 'sweater', topColor: 0xf3ecdc, pattern: 'cross', patternColor: 0x4a7ad8, bottom: 'shorts', bottomColor: 0x3a5fa8, shoes: 0x3a6fe0, socks: 0xffffff, acc: ['headphones'] } as Outfit,
  // HONORARY KOREAN: 왕관 + 별무늬 남색 상의 + 허리에 묶은 회색 니트 + 와이드 청바지
  hanaMax: { top: 'longsleeve', topColor: 0x22306a, pattern: 'cross', patternColor: 0xdfe8ff, bottom: 'baggy', bottomColor: 0x3a5fb8, shoes: 0xffffff, waistTie: 0xc4c4cc, acc: ['crown'] } as Outfit,

  // 찜질방
  jjimjil: (towel = true): Outfit => ({ top: 'jjimjil', topColor: 0xe8908a, bottom: 'shorts', bottomColor: 0xe8908a, shoes: 0, barefoot: true, acc: towel ? ['towel'] : [] }),
  // 드레스코드
  monk: { top: 'monk', topColor: 0x9c9ca4, bottom: 'baji', bottomColor: 0x9c9ca4, shoes: 0xd8d4c8 } as Outfit,
  hanbokF: (jeo: number, chima: number, ribbon: number): Outfit => ({ top: 'hanbokF', topColor: jeo, topColor2: ribbon, bottom: 'chima', bottomColor: chima, shoes: 0xffffff }),
  hanbokM: (jeo: number, vest: number, baji: number): Outfit => ({ top: 'hanbokM', topColor: jeo, topColor2: vest, bottom: 'baji', bottomColor: baji, shoes: 0x2b2420 }),
  uniformF: { top: 'uniform', topColor: 0x22305a, bottom: 'skirt', bottomColor: 0x9a2a3a, bottomColor2: 0x22305a, shoes: 0x3a2a24, accColor: 0xb8243a } as Outfit,
  uniformM: { top: 'uniform', topColor: 0x22305a, bottom: 'pants', bottomColor: 0x60606c, shoes: 0x3a2a24, accColor: 0xb8243a } as Outfit,
  // 한강 러닝 (단계별 착장)
  run0: { top: 'tee', topColor: 0xffffff, bottom: 'shorts', bottomColor: 0x2b2b38, shoes: 0xff7a3a } as Outfit,
  // 댄스
  dance: (top: number, pants: number, acc: Outfit['acc'] = []): Outfit => ({ top: 'crop', topColor: top, bottom: 'baggy', bottomColor: pants, shoes: 0xffffff, acc }),
};

// NPC
export const NPC: Record<string, CharDef> = {
  monk: { id: 'monk', name: 'MONK', skin: 'light', hair: 'buzz', hairColor: 0x6c5a50, outfit: OUTFITS.monk },
  server: {
    id: 'server', name: 'SERVER', skin: 'light', hair: 'bob', hairColor: 0x2a1c1a,
    outfit: { top: 'apron', topColor: 0xf4e8d6, topColor2: 0x9a3a2a, bottom: 'pants', bottomColor: 0x3a2f2a, shoes: 0x2b2420, acc: ['headband'], accColor: 0x9a3a2a },
  },
  stylist: {
    id: 'stylist', name: 'STYLIST', skin: 'light', hair: 'ponytail', hairColor: 0x3a2a24,
    outfit: { top: 'longsleeve', topColor: 0x1e1e26, bottom: 'pants', bottomColor: 0x1e1e26, shoes: 0x1e1e26 },
  },
  runner: {
    id: 'runner', name: 'RUNNER', skin: 'tan', hair: 'short', hairColor: 0x2a1c1a,
    outfit: { top: 'tee', topColor: 0xff7a3a, bottom: 'shorts', bottomColor: 0x3a5fc0, shoes: 0xffffff },
  },
  guard: {
    id: 'guard', name: 'GUARD', skin: 'light', hair: 'short', hairColor: 0x221a1a,
    outfit: { top: 'hanbokM', topColor: 0xc23a32, topColor2: 0x1f3a7a, bottom: 'baji', bottomColor: 0x1f3a7a, shoes: 0x1d1b22, acc: ['gat'] },
  },
  clerk: {
    id: 'clerk', name: 'CLERK', skin: 'light', hair: 'short', hairColor: 0x2a1c1a,
    outfit: { top: 'runvest', topColor: 0x2a9a7a, topColor2: 0xffffff, bottom: 'pants', bottomColor: 0x2b2b38, shoes: 0xffffff },
  },
};

// 입는 사람의 성별에 맞게 한복·교복을 바꿔 준다 (주인공을 바꿔도 어색하지 않게)
export function fitGender(o: Outfit, id: string): Outfit {
  const girl = isGirl(id);
  if (o.top === 'hanbokF' && !girl) return OUTFITS.hanbokM(0xe6ecf6, o.bottomColor ?? 0x2a3a8a, o.bottomColor ?? 0x2a3a8a);
  if (o.top === 'hanbokM' && girl) return OUTFITS.hanbokF(o.topColor, 0x2b3a8c, 0xd83a5a);
  if (o.top === 'uniform') return girl ? OUTFITS.uniformF : OUTFITS.uniformM;
  return o;
}

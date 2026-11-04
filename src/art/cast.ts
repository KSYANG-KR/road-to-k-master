// 등장인물 정의 (PPTX T&M 8인 라인업을 참고해 새로 디자인)
import { isGirl, type CharDef, type Outfit } from './characters';

export const CAST: Record<string, CharDef> = {
  hana: {
    id: 'hana', name: 'HANA', skin: 'fair', hair: 'wavy', hairColor: 0x7b4a2c,
    outfit: { top: 'tee', topColor: 0xffffff, bottom: 'jeans', bottomColor: 0x3f6fc4, shoes: 0xf4f4f4, backpack: 0xf2b233 },
  },
  amara: {
    id: 'amara', name: 'AMARA', skin: 'dark', hair: 'puff', hairColor: 0x2a1c1a,
    outfit: { top: 'jacket', topColor: 0x2a8c8c, topColor2: 0xf4f4f4, bottom: 'jeans', bottomColor: 0x2f3f74, shoes: 0xffffff, backpack: 0x34407a },
  },
  mei: {
    id: 'mei', name: 'MEI', skin: 'light', hair: 'long', hairColor: 0x221a22,
    outfit: { top: 'cardigan', topColor: 0xf1e2c4, topColor2: 0x26222c, bottom: 'skirt', bottomColor: 0x26222c, shoes: 0x2b2420 },
  },
  leo: {
    id: 'leo', name: 'LEO', skin: 'fair', hair: 'messy', hairColor: 0xe8b84a,
    outfit: { top: 'jacket', topColor: 0xd84a3a, topColor2: 0xffffff, pattern: 'plaid', patternColor: 0xf2c94c, bottom: 'jeans', bottomColor: 0x4a74c0, shoes: 0xf4f4f4, backpack: 0x5b8f3a },
  },
  sofia: {
    id: 'sofia', name: 'SOFIA', skin: 'fair', hair: 'long', hairColor: 0xf0cf72,
    outfit: { top: 'suit', topColor: 0x26262e, bottom: 'pants', bottomColor: 0x8a8a92, shoes: 0x2b2420, acc: ['glasses'], accColor: 0x26262e },
  },
  emma: {
    id: 'emma', name: 'EMMA', skin: 'light', hair: 'bun', hairColor: 0x8a5432,
    outfit: { top: 'jacket', topColor: 0x8a9a52, topColor2: 0xf6c94a, bottom: 'skirt', bottomColor: 0xd6b48a, shoes: 0x7a4a2c },
  },
  kofi: {
    id: 'kofi', name: 'KOFI', skin: 'brown', hair: 'locs', hairColor: 0x221814,
    outfit: { top: 'sweater', topColor: 0x2e7a4e, bottom: 'pants', bottomColor: 0x23232b, shoes: 0xf4f4f4, backpack: 0x5a5a66 },
  },
  james: {
    id: 'james', name: 'JAMES', skin: 'light', hair: 'slick', hairColor: 0x6a4024,
    outfit: { top: 'suit', topColor: 0x23305e, bottom: 'pants', bottomColor: 0x23305e, shoes: 0x2b2420, accColor: 0x3a8ae0 },
  },
};

export const LINEUP = ['amara', 'mei', 'leo', 'sofia', 'hana', 'emma', 'kofi', 'james'];

// 캐릭터 소개 (역할 영/한 + 한 줄 소개 한/영)
export const PROFILE: Record<string, { role: [string, string]; bio: [string, string] }> = {
  amara: { role: ['CURIOUS', '호기심쟁이'], bio: ['새로운 건 뭐든 해 보고 싶어요', 'Wants to try everything new'] },
  mei: { role: ['FOODIE', '미식가'], bio: ['맛집 지도 없이는 여행 안 해요', 'Never travels without a food map'] },
  leo: { role: ['GAMER', '게이머'], bio: ['한국 PC방이 제일 궁금해요', 'Can\'t wait to see a Korean PC bang'] },
  sofia: { role: ['DREAMER', '몽상가'], bio: ['K-드라마 속 장면을 찾아왔어요', 'Came looking for K-drama scenes'] },
  hana: { role: ['LEADER', '리더'], bio: ['친구들을 이끄는 여행 리더예요', 'The one who leads the trip'] },
  emma: { role: ['ARTIST', '아티스트'], bio: ['예쁜 사진과 그림을 사랑해요', 'Loves pretty photos and art'] },
  kofi: { role: ['RUNNER', '러너'], bio: ['한강 러닝이 버킷리스트예요', 'A Hangang run is on the bucket list'] },
  james: { role: ['WORKER', '직장인'], bio: ['휴가 내고 온 바쁜 직장인이에요', 'A busy worker on a well-earned break'] },
};

// ---- 주인공 선택 ----
// 장면 스크립트는 주인공 자리를 'hana' 로 쓴다. 다른 캐릭터를 고르면 CAST 의 두 자리를 맞바꿔
// 'hana' 자리에 고른 캐릭터가, 원래 그 캐릭터 자리에 하나가 들어가게 한다 (텍스처는 각자의 id 로 구워져 섞이지 않음)
const ORIGINAL: Record<string, CharDef> = { ...CAST };
export let HERO = 'hana';
export function setHero(id: string) {
  Object.assign(CAST, ORIGINAL);
  HERO = CAST[id] ? id : 'hana';
  if (HERO !== 'hana') { CAST.hana = ORIGINAL[HERO]; CAST[HERO] = ORIGINAL.hana; }
}
export const heroName = () => CAST.hana.name;

// ---- 미션/레벨별 의상 ----
export const OUTFITS = {
  // 레벨 카드 의상 (주인공) — Lv1 은 고른 캐릭터의 평소 옷, Lv2 한복은 성별에 맞춰
  get hanaLv1(): Outfit { return CAST.hana.outfit; },
  get hanaLv2(): Outfit {
    return isGirl(CAST.hana.id)
      ? { top: 'hanbokF', topColor: 0xf6a6b8, topColor2: 0xd83a5a, bottom: 'chima', bottomColor: 0x2b3a8c, shoes: 0xffffff, acc: ['ribbon'], accColor: 0xd83a5a }
      : { top: 'hanbokM', topColor: 0xf4f4f4, topColor2: 0x2b3a8c, bottom: 'baji', bottomColor: 0x2b3a8c, shoes: 0x2b2420 };
  },
  hanaLv3: { top: 'crop', topColor: 0x1e1e2a, bottom: 'baggy', bottomColor: 0x1e1e2a, shoes: 0xffffff, acc: ['headphones'] } as Outfit,
  hanaMax: { top: 'crop', topColor: 0x2a3a8c, bottom: 'baggy', bottomColor: 0x4a6fd0, shoes: 0xffffff, acc: ['crown'] } as Outfit,

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

# ROAD TO K-MASTER — KTO IP 픽셀아트 웹게임

한국관광공사 IP 영상화 콘티(1028 KTO_IP_game_영상화트리트_B)를 실제로 플레이할 수 있게 만든 반응형 웹게임입니다.
게임을 **녹화 모드**로 돌리면 콘티 #01~#31 흐름 그대로 영상 소스를 뽑을 수 있습니다.

- 엔진: Phaser 3.90 + TypeScript + Vite (서버 불필요, 정적 파일만으로 동작)
- 논리 좌표 640×360, 실제 렌더 2560×1440 (`?lo` 를 붙이면 1280×720) → 화면 크기에 맞춰 부드럽게 맞춤 (PC·태블릿·모바일 가로)
- 디자인: 세계(배경·캐릭터)는 픽셀아트, 글자·UI는 Pretendard 한 가족 + 다크 글래스 패널. 모든 문구는 한글(굵게) 위, 영어(밝은 보조색) 아래 규칙
- 배경 앰비언트 애니메이션(`src/core/ambient.ts`): 구름·새·꽃잎·나비·물결 반짝임·별·창문불빛·조명 글로우·스포트라이트·풍선·비둘기·반딧불·지하철 등 장소별 구성
- 캐릭터 귀여움 요소: 큰 눈+하이라이트·속눈썹·볼터치·ω입·머리 엔젤링, 발밑 그림자, 감정 말풍선(♥ ! ? ♪ 💧 ★), 콩 뛰기(스쿼시&스트레치), 걸을 때 먼지, 오답 시 '?' 반응, 찜질방 계란 톡!, 포토부스 스티커
- 사운드: 외부 음원 없이 WebAudio로 실시간 합성한 오리지널 칩튠 (라이선스 이슈 없음)

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ 에 배포용 정적 파일 생성
npm run preview    # 빌드 결과 확인
```

## 조작
| 입력 | 동작 |
|---|---|
| ← → / 클릭·탭 | 아이템 핫바 선택 |
| Enter / Space | 선택·진행 |
| Space / ↑ / 탭 | 한강 러닝 점프 (트래픽 콘 피하기), 타이밍 미니게임 |
| ← ↓ ↑ → (또는 화면 하단 화살표 탭) | K-POP 댄스 리듬게임 |

## 게임 규칙 (외국인 대상, 모든 텍스트 한/영 병기)
- **하트 3개 · 별점**: 미션마다 하트 3개. 오답·시간 초과·장애물·타이밍 MISS마다 하트 1개를 잃고, 남은 하트로 ★1~3 별점. 엔딩에서 총 별 개수 표시
- **제한 시간**: 핫바 아래 게이지가 줄어들고, 시간이 다 되거나 두 번 틀리면 정답 칸에 힌트 화살표
- **오답 반응**: 아이템마다 캐릭터가 한/영 말풍선으로 이유를 알려줌
- **K-TIP 카드**: 미션이 끝날 때마다 관련 한국 문화 팁(한/영)
- **미션별 게임 요소**: 한옥 신발 정리 타이밍 · 온돌 전통 간식 3종 고르기 · 찜질방 계란 이마 깨기 타이밍 · PC방 친구별 주문 맞추기 · 한강 콘 피하기 · 편의점 레시피 퍼즐 · 한식당 종업원 대화 선택 · 댄스 리듬게임 결과로 별점

## 콘티 ↔ 게임 씬 대응

| 콘티 | 씬 | 내용 |
|---|---|---|
| #01 | `Intro` | 하늘을 나는 비행기 → 착륙 |
| #02~#04 | `Arrival` | 입국장, 8인이 캐리어 끌고 등장해 환호, 안내 대화창 |
| #01-05 브릿지 | CRT 전환 | 브라운관 꺼짐/켜짐 효과로 타이틀 연결 |
| #05 | `Title` | ROAD TO K-MASTER 로고, PLAY 버튼, 라인업 |
| #05-1 | `CastRoll` | 등장인물을 훑어가는 캐릭터 소개 |
| #06 / #12 / #17 | `WorldMap` | 스테이지 맵 3종(관광지도 / 한강 도시 / 쇼핑몰 단면) + 타이틀 박스 |
| #07 | `HanokShoes` | 한옥 앞, 핫바에서 신발 선택 → 댓돌에 신발 벗고 입장 |
| #08 | `HanokOndol` | 이불 펴고 온돌에 누워 약과 먹기 |
| #09 | `Jjimjil` | 양머리 수건, 식혜·맥반석 계란 |
| #10 | `DressCode` | 같은 셀카 앵글에서 배경·의상만 교체 (절 승복 / 고궁 한복 / 놀이공원 교복) |
| #11, #16 | `LevelUp` | 제자리 360° 회전 변신 + 레벨 카드 |
| #11-12 / #16-17 브릿지 | 하트 픽셀 / 음식 픽셀 와이프 |
| #13 | `PcBang` | 게임 중 손에 음식이 생기며 먹는 연출 |
| #14 | `Hangang` | 횡스크롤 러닝, 모자·조끼·자켓 아이템 먹으면 착장 / 새·지하철·유람선·러너 배경 액션 |
| #15 | `Cvs` | SHOP 팝업 조합(컵라면+치즈, 쿠키+아이스크림) |
| #18 | `Hansik` | 벨 → 종업원 대화창(추가주문/메뉴/리필) → 반찬이 늘어나며 상이 가득 참 |
| #19 | `Salon` | 헤어스타일 3×3 선택 팝업 → 변신, NEW LOOK UNLOCKED |
| #20 | `PhotoBooth` | 큰 프레임 라이브 → 카운트다운·플래시 → 오른쪽 프레임에 사진이 하나씩 |
| #21 | `Dance` | 화살표 리듬게임, PERFECT/COMBO, 6인 군무 |
| #22~#24 | `Finale` | XP 1000 → 화면 축소 원씬 전환 → MAX LEVEL / HONORARY KOREAN |
| #24-25 브릿지 | 픽셀 포커스 아웃·인 |
| #25~#29 | `Ending` | 한강 야외 스크린: 명예 한국인 타이틀 → 실사 영상(또는 하이라이트 몽타주) |
| #29-30 브릿지 | 픽셀 디졸브 → 블랙 → 페이드인 |
| #30~#31 | `Outro` | 뒷모습 손 흔들기 → 하늘로 틸트업 → 불꽃놀이 → Imagine your Korea |

## 녹화(영상 소스 추출)

URL 파라미터로 동작합니다.

| 파라미터 | 의미 |
|---|---|
| `?auto=1` | 입력 없이 자동 플레이 (콘티 순서대로 진행) |
| `?rec=1` | 캔버스+사운드를 WebM으로 녹화 (엔딩에서 자동 저장) |
| `?scene=hansik` | 특정 씬부터 시작 (`intro, title, cast, map, hanok, ondol, jjimjil, temple, palace, park, levelup1, pcbang, hangang, cvs, levelup2, hansik, salon, photo, dance, finale, ending, outro`) |
| `?only=1` | `scene`과 함께 쓰면 그 씬 하나만 녹화하고 멈춤 → `<scene>.webm` |
| `?speed=0.8` | 연출 속도 조절 |
| `?clean=1` | 마우스 커서 숨김 |

예) 전체 녹화: `http://localhost:5173/?rec=1`
예) 한식당 컷만: `http://localhost:5173/?rec=1&scene=hansik&only=1`

개발 서버(`npm run dev`)에서 녹화하면 파일이 `captures/` 폴더에 바로 저장되고, 배포 사이트에서는 브라우저 다운로드로 저장됩니다.

### 1080p / 4K 변환 (픽셀 선명 유지)
```bash
bash tools/export-video.sh captures/road-to-k-master.webm 1080   # 1920x1080
bash tools/export-video.sh captures/road-to-k-master.webm 2160   # 3840x2160
```
2560×1440 녹화본을 1080p(area 축소) 또는 2160p(lanczos 확대)로 변환합니다.

## 실사 영상 넣기 (#26~#29)
`public/assets/video/` 에 mp4를 넣고 같은 폴더에 `clips.json` 을 만듭니다.
```json
["live_01.mp4", "live_02.mp4", "live_03.mp4", "live_04.mp4"]
```
파일이 있으면 야외 스크린에서 순서대로 재생하고, 없으면 게임 미션 하이라이트 몽타주를 보여줍니다.

## 배포

빌드 결과 `dist/` 폴더는 정적 파일이라 어디든 올리면 됩니다.

- **소스 납품**: 이 저장소 전체(또는 zip) + 이 README
- **빌드본 납품**: `dist/` 폴더만 고객사 웹서버(Apache/Nginx/IIS/S3 등) 루트나 하위 경로에 업로드 (`base: './'` 설정이라 하위 경로도 동작)
- **호스팅 대행**: Cloudflare Pages / Vercel / Netlify 에 `npm run build`, 출력 폴더 `dist` 로 연결 후 고객 도메인 CNAME 연결

## 에셋 출처·라이선스
- 배경·아이템 아이콘·비행기·음식 스프라이트: 이 프로젝트용으로 새로 생성(Higgsfield, GPT Image) (2K 해상도) 후 `tools/pixelsnap.py`, `tools/slice_sprites.py` 로 1280×720 픽셀 그리드에 맞춰 보정
- 캐릭터: `src/art/characters.ts` 에서 코드로 그리는 파라메트릭 픽셀 스프라이트 (PPTX의 8인 라인업 디자인 참고)
- 폰트: Pretendard (SIL Open Font License 1.1) — `public/assets/fonts/OFL-Pretendard.md`
- 엔진: Phaser (MIT)
- 브랜드 로고 `public/assets/brand/imagine_your_korea.png`: 한국관광공사 제공 자료 (KTO 2027_1016.pptx)

## 폴더 구조
```
src/
  art/        캐릭터 생성기(characters.ts), 등장인물·의상(cast.ts), 픽셀 페인터(pixel.ts)
  core/       상태·XP(state), UI(ui), 전환·이펙트(fx), 배경 앰비언트(ambient), 사운드(audio), 녹화 디렉터(director), 공통 씬(BaseScene)
  scenes/     Opening, WorldMap, Stage1~3, LevelUp(Finale 포함), Ending(Outro 포함)
public/assets/ bg(배경), sprites(아이템 아틀라스), fonts, brand, video
tools/        pixelsnap.py, slice_sprites.py, export-video.sh
```

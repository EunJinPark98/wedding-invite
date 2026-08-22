import type { Category } from "./types";

/**
 * 초대장 배경음악 목록.
 *
 * 저작권이 완전히 자유로운 것만 둔다.
 *   곡(악보) — 저작권이 만료된 고전 (원곡은 origin 에 적어 둔다)
 *   연주     — FluidR3_GM 사운드폰트(Frank Wen, MIT)의 악기 샘플로 직접 연주해
 *              구웠다. 시중 음반을 가져다 쓴 것이 아니라 연주자·음반사 권리가
 *              걸리지 않는다.
 * 악기는 곡마다 다르다 — 오르골·첼레스타·피아노·하프·현악.
 *
 * 새 곡을 넣을 때도 이 기준을 지켜야 한다 — 가요·팝송·영화 OST 처럼 권리가
 * 살아 있는 음원은 하객에게 배포되는 초대장에 실을 수 없다.
 */
export interface BgmTrack {
  id: string;
  name: string;
  /** 원곡 (저작권 만료 표기용) */
  origin: string;
  /** 이 곡을 보여 줄 초대장 종류 */
  category: Category;
}

export const BGM_TRACKS: BgmTrack[] = [
  // 결혼 청첩장
  { id: "canon", name: "캐논", origin: "Pachelbel, Canon in D", category: "wedding" },
  { id: "bridal-chorus", name: "신부 입장", origin: "Wagner, Bridal Chorus", category: "wedding" },
  { id: "wedding-march", name: "결혼 행진곡", origin: "Mendelssohn, Wedding March", category: "wedding" },
  { id: "air", name: "G선상의 아리아", origin: "J.S. Bach, Air on the G String", category: "wedding" },
  { id: "simple-gifts", name: "심플 기프츠", origin: "Simple Gifts (Shaker hymn, traditional)", category: "wedding" },

  // 백일 · 돌잔치
  { id: "twinkle", name: "반짝반짝 작은 별", origin: "Ah! vous dirai-je, maman", category: "doljanchi" },
  { id: "lullaby", name: "브람스 자장가", origin: "Brahms, Wiegenlied", category: "doljanchi" },
  { id: "fur-elise", name: "엘리제를 위하여", origin: "Beethoven, Für Elise", category: "doljanchi" },
  { id: "minuet", name: "미뉴에트", origin: "Petzold, Minuet in G", category: "doljanchi" },
  { id: "rockabye", name: "자장자장 우리 아가", origin: "Rock-a-bye Baby (traditional lullaby)", category: "doljanchi" },

  // 칠순 · 팔순
  { id: "ode-to-joy", name: "환희의 송가", origin: "Beethoven, Ode to Joy", category: "senior" },
  { id: "amazing-grace", name: "어메이징 그레이스", origin: "New Britain (traditional)", category: "senior" },
  { id: "greensleeves", name: "그린슬리브스", origin: "Greensleeves (traditional)", category: "senior" },
  { id: "jesu-joy", name: "예수, 인간 소망의 기쁨", origin: "J.S. Bach, Jesu, Joy of Man's Desiring", category: "senior" },
  { id: "auld-lang-syne", name: "올드 랭 사인", origin: "Auld Lang Syne (Scottish traditional)", category: "senior" },

  // 생일
  { id: "happy-birthday", name: "생일 축하합니다", origin: "Good Morning to All", category: "birthday" },
  { id: "turkish-march", name: "터키 행진곡", origin: "Mozart, Rondo alla Turca", category: "birthday" },
  { id: "blue-danube", name: "아름답고 푸른 도나우", origin: "J. Strauss II, Blue Danube", category: "birthday" },
  { id: "entertainer", name: "엔터테이너", origin: "Scott Joplin, The Entertainer", category: "birthday" },
  { id: "pop-weasel", name: "위즐이 팡!", origin: "Pop! Goes the Weasel (traditional)", category: "birthday" },
];

/**
 * 저장된 값을 검사할 때 쓰는 곡 id 목록.
 * (types.ts 가 normalizeData 에서 가져다 쓴다 — 이 파일은 types 에서 타입만
 *  가져오므로 런타임 순환 참조는 생기지 않는다)
 */
export const BGM_IDS: readonly string[] = BGM_TRACKS.map((t) => t.id);

/** 이 종류에서 고를 수 있는 곡 */
export const bgmFor = (category: Category) =>
  BGM_TRACKS.filter((t) => t.category === category);

/** 저장된 값이 실제로 있는 곡인지 (없으면 배경음악 없음으로 본다) */
export const getBgmTrack = (id: string | undefined | null) =>
  id ? BGM_TRACKS.find((t) => t.id === id) : undefined;

/** 실제 파일 주소 */
export const bgmUrl = (id: string) => `/bgm/${id}.mp3`;

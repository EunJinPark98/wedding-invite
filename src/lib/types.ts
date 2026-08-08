// 모바일 청첩장 데이터 모델

// 초대장 종류 — 결혼 외 인생 이벤트로 확장
export const CATEGORY_IDS = ["wedding", "doljanchi", "senior", "birthday"] as const;
export type Category = (typeof CATEGORY_IDS)[number];

export const TEMPLATE_IDS = [
  // 결혼 청첩장
  "classic",
  "modern",
  "romantic",
  "botanical",
  "starlight",
  "cinema",
  // 돌잔치 전용
  "dolbear",
  "dolcloud",
  "dolhanbok",
  "dolstar",
  "dolgarden",
  "dolcrayon",
  // 칠순 · 팔순 전용
  "seniorgold",
  "seniorbloom",
  "seniorpine",
  "seniorstar",
  "seniorink",
  "seniorwarm",
  // 생일 전용
  "bdaypop",
  "bdayneon",
  "bdayminimal",
  "bdaystar",
  "bdaycake",
  "bdaybloom",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

// 칠순·팔순 등 수연(壽宴) 연세 선택지
export const SENIOR_AGES = [
  { age: 70, label: "칠순", hanja: "七旬" },
  { age: 80, label: "팔순", hanja: "八旬" },
  { age: 90, label: "구순", hanja: "九旬" },
  { age: 100, label: "백수", hanja: "百壽" },
] as const;
export type SeniorAge = (typeof SENIOR_AGES)[number]["age"];
export const getSeniorAgeMeta = (age: number) =>
  SENIOR_AGES.find((s) => s.age === age) ?? SENIOR_AGES[0];
// 연세를 바꾸면 따라 바뀌는 기본 인사말 제목 (사용자가 직접 고친 경우엔 유지)
export const seniorGreetingTitle = (age: number) =>
  `${getSeniorAgeMeta(age).label} 잔치에 초대합니다`;

/**
 * 아기 잔치 종류 — 같은 돌잔치 템플릿을 백일잔치에도 쓸 수 있게 한다.
 * (칠순·팔순의 SENIOR_AGES 와 같은 방식)
 *   event     : 잔치 이름 — 제목·장소 라벨용 ("백일잔치 날짜")
 *   occasion  : 문장 속 표현 ("우리 아기 백일이에요")
 *   milestone : "~을 맞이했습니다" 처럼 예스러운 문장에 쓰는 표현
 *   greeting  : 기본 인사말 제목 (종류마다 자연스러운 조사가 달라 통째로 둔다)
 *   kicker    : 히어로 영문 소문구
 *   english   : 이름 아래 영문 문구 (구름 위 아기 템플릿)
 */
export const DOL_KINDS = [
  {
    id: "baek",
    label: "백일잔치",
    event: "백일잔치",
    occasion: "백일",
    milestone: "백일",
    greeting: "우리 아이의 백일잔치에 초대합니다",
    kicker: "100 DAYS",
    kicker2: "THE 100TH DAY",
    english: "HAPPY 100 DAYS",
  },
  {
    id: "dol",
    label: "돌잔치",
    event: "돌잔치",
    occasion: "첫 생일",
    milestone: "첫 돌",
    greeting: "우리 아이의 돌잔치에 초대합니다",
    kicker: "FIRST BIRTHDAY",
    kicker2: "THE FIRST BIRTHDAY",
    english: "HAPPY BIRTH DAY",
  },
] as const;
export type DolKind = (typeof DOL_KINDS)[number]["id"];
export const DEFAULT_DOL_KIND: DolKind = "dol";
export const getDolKindMeta = (kind: string | undefined) =>
  DOL_KINDS.find((k) => k.id === kind) ?? DOL_KINDS[1];
// 종류를 바꾸면 따라 바뀌는 기본 인사말 (사용자가 직접 고친 경우엔 유지)
export const dolGreetingTitle = (kind: string | undefined) =>
  getDolKindMeta(kind).greeting;
export const dolGreetingMessage = (kind: string | undefined) =>
  `건강하게 자라준 아기의 ${getDolKindMeta(kind).occasion}을\n소중한 분들과 함께 축하하고 싶습니다.\n오셔서 자리를 빛내주시면 감사하겠습니다.`;

/**
 * 아기 성별 — 돌잔치·백일잔치에서 이름 옆에 함께 보여준다.
 * ""(빈 값)이면 표시하지 않는다.
 */
export const BABY_GENDERS = [
  { id: "", label: "표시 안 함", mark: "" },
  { id: "son", label: "아들", mark: "아들" },
  { id: "daughter", label: "딸", mark: "딸" },
] as const;
export type BabyGender = (typeof BABY_GENDERS)[number]["id"];
export const getBabyGenderMark = (id: string | undefined) =>
  BABY_GENDERS.find((g) => g.id === id)?.mark ?? "";

// 대표 사진 모션 (청첩장 업체에서 많이 쓰는 연출 4종)
export const HERO_MOTIONS = [
  { id: "zoomin", label: "줌 인", desc: "천천히 확대" },
  { id: "zoomout", label: "줌 아웃", desc: "천천히 축소" },
  { id: "focus", label: "아웃포커스", desc: "흐림 → 선명" },
  { id: "mono", label: "흑백 → 컬러", desc: "흑백에서 물들듯" },
] as const;
export type HeroMotion = (typeof HERO_MOTIONS)[number]["id"];

/**
 * 인트로(오프닝) 연출 — 초대장을 열면 잠깐 지나가는 첫 화면.
 * "none"이면 바로 본문이 열린다.
 *
 * 앞의 다섯 가지는 종류를 가리지 않고 쓰고, 마지막 하나만 종류에 맞춰
 * 바꾼다 (결혼=꽃잎, 돌잔치=풍선, 칠순=먹, 생일=컨페티).
 * 실제 그림은 InvitationIntro + globals.css 의 inv-intro-* 가 그린다.
 */
const INTRO_COMMON = [
  { id: "none", label: "사용 안 함", desc: "인트로 없이 바로 열림" },
  { id: "blur", label: "글씨 번짐", desc: "문구가 번지듯 또렷해져요" },
  { id: "line", label: "라인 리빌", desc: "선을 따라 문구가 드러나요" },
  { id: "photo", label: "사진 페이드", desc: "사진이 서서히 밝아져요" },
  { id: "star", label: "별빛", desc: "반짝임 속에 떠올라요" },
] as const;

const INTRO_LAST = {
  wedding: { id: "petal", label: "꽃잎", desc: "꽃잎 날리며 한 글자씩" },
  doljanchi: { id: "balloon", label: "풍선", desc: "풍선이 두둥실 떠올라요" },
  senior: { id: "ink", label: "먹번짐", desc: "먹이 번지듯 스며들어요" },
  birthday: { id: "confetti", label: "컨페티", desc: "색종이가 쏟아져요" },
} as const;

export const INTROS = [...INTRO_COMMON, INTRO_LAST.wedding] as const;

/** 종류에 맞는 인트로 6종 */
export const getIntros = (category: Category) => [
  ...INTRO_COMMON,
  INTRO_LAST[category] ?? INTRO_LAST.wedding,
];

export type IntroStyle =
  | (typeof INTRO_COMMON)[number]["id"]
  | (typeof INTRO_LAST)[keyof typeof INTRO_LAST]["id"];

const ALL_INTRO_IDS: readonly string[] = [
  ...INTRO_COMMON.map((i) => i.id),
  ...Object.values(INTRO_LAST).map((i) => i.id),
];
export const isIntroStyle = (v: unknown): v is IntroStyle =>
  typeof v === "string" && ALL_INTRO_IDS.includes(v);

/** 종류별 인트로 문구 예시 (에디터 입력칸의 안내 문구) */
export const introPlaceholder = (category: Category) =>
  category === "doljanchi"
    ? "우리 아기 첫 생일이에요"
    : category === "senior"
      ? "귀한 걸음으로 빛내 주세요"
      : category === "birthday"
        ? "생일파티에 초대합니다!"
        : "We are getting married!";

/**
 * 섹션 사이 구분선 디자인.
 * 실제 모양은 CSS 가 초대장 루트의 data-divider 값을 보고 고른다.
 */
export const DIVIDERS = [
  { id: "diamond", label: "마름모", desc: "선 사이 작은 마름모" },
  { id: "line", label: "가는 선", desc: "가로선 하나로 담백하게" },
  { id: "dots", label: "점 세 개", desc: "점만 콕콕" },
  { id: "flower", label: "꽃", desc: "꽃 하나만" },
  { id: "none", label: "없음", desc: "구분선을 두지 않음" },
] as const;
export type DividerStyle = (typeof DIVIDERS)[number]["id"];

/**
 * 초대장 글꼴 크기 배율.
 * 사진·여백은 그대로 두고 글자 크기만 배율만큼 키우거나 줄인다.
 * (InvitationView 루트에서 --inv-fs 로 내려보내 하위 텍스트에 적용)
 */
export const FONT_SCALES = [
  { value: 0.9, label: "작게" },
  { value: 1, label: "보통" },
  { value: 1.1, label: "크게" },
  { value: 1.2, label: "아주 크게" },
] as const;
export const DEFAULT_FONT_SCALE = 1;
export const isFontScale = (v: unknown): v is number =>
  FONT_SCALES.some((s) => s.value === v);

// 갤러리 사진 최대 장수 — 페이지 로딩 속도를 위한 기술적 한도 (요금제 아님)
export const MAX_GALLERY = 19;

// 에디터 미리보기용 예시 대표 사진 — 개인 사진이므로 실제 초대장 제작에는 사용 불가
export const SAMPLE_MAIN_PHOTO = "/wedding1.jpg";
export const SAMPLE_BABY_PHOTO = "/baby.png";
export const SAMPLE_BIRTHDAY_PHOTO = "/birthday-party.png";
export const SAMPLE_SENIOR_PHOTO = "/70th.png";
// 예시 사진 전체 — 제작 시 본인 사진으로 교체했는지 검사할 때 사용
export const SAMPLE_PHOTOS: readonly string[] = [
  SAMPLE_MAIN_PHOTO,
  SAMPLE_BABY_PHOTO,
  SAMPLE_BIRTHDAY_PHOTO,
  SAMPLE_SENIOR_PHOTO,
];
export const isSamplePhoto = (url: string | undefined | null) =>
  !!url && SAMPLE_PHOTOS.includes(url);

/**
 * 게시 종료 시각 — 행사 다음 날 0시(한국시간)부터 자동 비공개.
 * 예: 예식일 2026-10-10 → 10월 10일까지 열리고 10월 11일에 사라짐.
 * 잘못된 날짜면 null.
 */
export function expiryFromEventDate(eventDate: string | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((eventDate ?? "").trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const day = new Date(Date.UTC(y, mo - 1, d));
  // 2026-02-31처럼 존재하지 않는 날짜는 값이 굴러가므로 걸러낸다
  if (
    day.getUTCFullYear() !== y ||
    day.getUTCMonth() !== mo - 1 ||
    day.getUTCDate() !== d
  ) {
    return null;
  }
  day.setUTCDate(day.getUTCDate() + 1);
  const next = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
  return new Date(`${next}T00:00:00+09:00`).toISOString();
}

/** 게시가 닫히는 날(행사 다음 날)을 안내용으로 표시. 보는 사람의 시간대와 무관. */
export function expiryDateLabel(eventDate: string | undefined): string | null {
  if (!expiryFromEventDate(eventDate)) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((eventDate ?? "").trim());
  const day = new Date(Date.UTC(Number(m![1]), Number(m![2]) - 1, Number(m![3])));
  day.setUTCDate(day.getUTCDate() + 1);
  return `${day.getUTCFullYear()}년 ${day.getUTCMonth() + 1}월 ${day.getUTCDate()}일`;
}

export interface Account {
  side: "신랑측" | "신부측";
  name: string;
  bank: string;
  number: string;
}

export interface InvitationData {
  // 초대장 종류 (기본 "wedding")
  category: Category;
  // 수연 연세 (senior 카테고리 전용 — 70=칠순, 80=팔순, 90=구순, 100=백수)
  seniorAge: number;
  // 아기 잔치 종류 (doljanchi 카테고리 전용 — baek=백일잔치, dol=돌잔치)
  dolKind: DolKind;
  // 아기 성별 (doljanchi 카테고리 전용 — ""=표시 안 함, son=아들, daughter=딸)
  babyGender: BabyGender;
  // 신랑/신부 (다른 카테고리에서는 주인공/아기/생일 주인공으로 재사용)
  groomName: string;
  brideName: string;
  // 혼주
  groomFather: string;
  groomMother: string;
  brideFather: string;
  brideMother: string;
  // 예식 일시/장소
  weddingDate: string; // "2026-10-10"
  weddingTime: string; // "오후 1시"
  venueName: string;
  venueHall: string;
  venueAddress: string;
  // 오시는 길 안내 — 지도 자리에 펼쳐 보는 교통편 안내.
  // 셋 다 비어 있으면 초대장에 안내 버튼 자체가 나오지 않는다.
  directionsSubway: string;
  directionsBus: string;
  directionsParking: string;
  // 인트로(오프닝) 연출 (IntroStyle, "none"=사용 안 함 · 결혼 청첩장 전용)
  intro: string;
  // 인트로에 크게 뜨며 애니메이션되는 문구. 비우면 두 사람 이름이 대신 들어간다.
  introText: string;
  // 인사말
  greetingTitle: string;
  greetingMessage: string;
  // 글꼴 (FontId, "default"=템플릿 기본)
  fontHeading: string; // 메인(제목·이름)
  fontBody: string; // 서브(본문)
  // 맨 위 메인 타이틀(주인공 이름)만 따로 — 생일 초대장에서만 고를 수 있다.
  // "default"면 템플릿이 정한 글꼴을 그대로 쓴다. (TITLE_FONTS)
  titleFont: string;
  // 글꼴 크기 배율 (FONT_SCALES 중 하나, 1=보통)
  fontScale: number;
  // 상단 사진 위 큰 문구 (생일 전용 — 비우면 아무것도 표시하지 않음)
  heroTitle: string;
  // 사진
  mainPhotoUrl: string;
  // 대표 사진 모션 (HeroMotion id)
  heroMotion: string;
  // 섹션 사이 구분선 디자인 (DividerStyle id)
  dividerStyle: string;
  // 신랑/신부 개별 프로필 사진 (선택)
  groomPhotoUrl: string;
  bridePhotoUrl: string;
  // 신랑/신부 한 줄 소개 (선택 — 청첩장 전용, 비우면 아예 표시하지 않음)
  groomIntro: string;
  brideIntro: string;
  gallery: string[];
  // 연락처
  groomPhone: string;
  bridePhone: string;
  // 마음 전하실 곳
  accounts: Account[];
  // 맨 아래 푸터에 들어갈 맺음말 (비우면 이름·날짜 표시)
  footerMessage: string;
}

export interface Invitation {
  slug: string;
  template: TemplateId;
  data: InvitationData;
  createdAt: string;
  // 이 시각이 지나면 발행 페이지 비공개 (null이면 무기한 — 과거 데이터 호환)
  expiresAt: string | null;
}

// 저장/조회 데이터에 누락 필드가 있어도 렌더링이 깨지지 않도록 안전한 빈 값으로 보정.
// (emptyInvitation 의 샘플값이 아니라 빈 문자열/빈 배열로 채운다.)
export const normalizeData = (
  d: Partial<InvitationData> | null | undefined
): InvitationData => ({
  category: CATEGORY_IDS.includes(d?.category as Category)
    ? (d!.category as Category)
    : "wedding",
  seniorAge: SENIOR_AGES.some((s) => s.age === d?.seniorAge)
    ? (d!.seniorAge as number)
    : 70,
  // 값이 없는 과거 돌잔치 초대장은 그대로 돌잔치로 열린다
  dolKind: DOL_KINDS.some((k) => k.id === d?.dolKind)
    ? (d!.dolKind as DolKind)
    : DEFAULT_DOL_KIND,
  // 목록에 없는 값이면 표시하지 않음으로 되돌린다
  babyGender: BABY_GENDERS.some((g) => g.id === d?.babyGender)
    ? (d!.babyGender as BabyGender)
    : "",
  groomName: d?.groomName ?? "",
  brideName: d?.brideName ?? "",
  groomFather: d?.groomFather ?? "",
  groomMother: d?.groomMother ?? "",
  brideFather: d?.brideFather ?? "",
  brideMother: d?.brideMother ?? "",
  weddingDate: d?.weddingDate ?? "",
  weddingTime: d?.weddingTime ?? "",
  venueName: d?.venueName ?? "",
  venueHall: d?.venueHall ?? "",
  venueAddress: d?.venueAddress ?? "",
  directionsSubway: d?.directionsSubway ?? "",
  directionsBus: d?.directionsBus ?? "",
  directionsParking: d?.directionsParking ?? "",
  // 목록에 없는 값(과거 데이터·조작된 입력)은 인트로 없음으로 되돌린다
  intro: isIntroStyle(d?.intro) ? d!.intro! : "none",
  introText: d?.introText ?? "",
  greetingTitle: d?.greetingTitle ?? "",
  greetingMessage: d?.greetingMessage ?? "",
  fontHeading: d?.fontHeading ?? "default",
  fontBody: d?.fontBody ?? "default",
  titleFont: d?.titleFont ?? "default",
  // 목록에 없는 값(과거 데이터·조작된 입력)은 기본 배율로 되돌린다
  fontScale: isFontScale(d?.fontScale) ? d!.fontScale! : DEFAULT_FONT_SCALE,
  heroTitle: d?.heroTitle ?? "",
  mainPhotoUrl: d?.mainPhotoUrl ?? "",
  heroMotion: HERO_MOTIONS.some((m) => m.id === d?.heroMotion)
    ? (d!.heroMotion as HeroMotion)
    : "zoomin",
  dividerStyle: DIVIDERS.some((v) => v.id === d?.dividerStyle)
    ? (d!.dividerStyle as DividerStyle)
    : "diamond",
  groomPhotoUrl: d?.groomPhotoUrl ?? "",
  bridePhotoUrl: d?.bridePhotoUrl ?? "",
  groomIntro: d?.groomIntro ?? "",
  brideIntro: d?.brideIntro ?? "",
  gallery: Array.isArray(d?.gallery)
    ? d.gallery.filter((g) => typeof g === "string").slice(0, MAX_GALLERY)
    : [],
  groomPhone: d?.groomPhone ?? "",
  bridePhone: d?.bridePhone ?? "",
  accounts: Array.isArray(d?.accounts)
    ? d.accounts.filter((a) => a && typeof a === "object")
    : [],
  footerMessage: d?.footerMessage ?? "",
});

// 카테고리별 인물/문구 샘플값 (에디터 초기 상태 + 템플릿 카드 미리보기용)
const CATEGORY_SAMPLE: Record<
  Category,
  {
    groomName: string;
    brideName: string;
    groomFather: string;
    groomMother: string;
    brideFather: string;
    brideMother: string;
    greetingTitle: string;
    greetingMessage: string;
    accountLabel: string;
    mainPhoto: string;
    // 예시 장소 — 실제 영업 중인 업체 대신 공공시설을 쓴다
    venueName: string;
    venueHall: string;
    venueAddress: string;
  }
> = {
  wedding: {
    groomName: "김신랑",
    brideName: "박신부",
    // 혼주 예시는 신랑 성(김)·신부 성(박)에 맞춰 아빠/엄마로 통일
    groomFather: "김아빠",
    groomMother: "김엄마",
    brideFather: "박아빠",
    brideMother: "박엄마",
    greetingTitle: "소중한 분들을 초대합니다",
    greetingMessage:
      "서로 다른 길을 걸어온 저희 두 사람이\n이제 같은 곳을 바라보며\n한 길을 걷고자 합니다.\n오셔서 축복해 주시면 감사하겠습니다.",
    accountLabel: "축의금",
    mainPhoto: SAMPLE_MAIN_PHOTO,
    venueName: "서울시청 시민청",
    venueHall: "지하 1층 태평홀",
    venueAddress: "서울특별시 중구 세종대로 110",
  },
  doljanchi: {
    groomName: "김아기",
    brideName: "",
    groomFather: "",
    groomMother: "",
    brideFather: "",
    brideMother: "",
    greetingTitle: dolGreetingTitle(DEFAULT_DOL_KIND),
    greetingMessage: dolGreetingMessage(DEFAULT_DOL_KIND),
    accountLabel: "축하금",
    mainPhoto: SAMPLE_BABY_PHOTO,
    venueName: "서울여성플라자",
    venueHall: "2층 다목적홀",
    venueAddress: "서울특별시 동작구 여의대방로54길 18",
  },
  senior: {
    groomName: "김별순",
    brideName: "",
    groomFather: "",
    groomMother: "",
    brideFather: "",
    brideMother: "",
    greetingTitle: seniorGreetingTitle(70),
    greetingMessage:
      "그동안 걸어오신 길에 존경과 감사를 담아\n작은 자리를 마련했습니다.\n오셔서 축복해 주시면 큰 힘이 되겠습니다.",
    accountLabel: "축하금",
    mainPhoto: SAMPLE_SENIOR_PHOTO,
    venueName: "세종문화회관",
    venueHall: "3층 연회장",
    venueAddress: "서울특별시 종로구 세종대로 175",
  },
  birthday: {
    groomName: "김생일",
    brideName: "",
    groomFather: "",
    groomMother: "",
    brideFather: "",
    brideMother: "",
    greetingTitle: "생일을 축하하는 자리에 초대합니다",
    greetingMessage:
      "소중한 하루를 함께 나누고 싶어\n작은 자리를 마련했습니다.\n오셔서 자리를 빛내주시면 감사하겠습니다.",
    accountLabel: "축하금",
    mainPhoto: SAMPLE_BIRTHDAY_PHOTO,
    venueName: "국립중앙박물관",
    venueHall: "1층 으뜸홀",
    venueAddress: "서울특별시 용산구 서빙고로 137",
  },
};

// 인물 소개 예시 (소개 칸을 두는 카테고리만 채운다 — CategoryLabels.showIntro).
// 프로필 카드가 반쪽 너비라 한 줄이 열 글자를 넘으면 접히므로 짧은 줄로 끊어 두고,
// 이름은 소개 바로 위에 이미 나오므로 예시에 넣지 않는다.
export const SAMPLE_INTRO: Record<Category, { person1: string; person2: string }> = {
  wedding: {
    person1: "#ISFP\n#개발자\n무뚝뚝해 보이지만\n세상 다정한 F신랑",
    person2: "#INFJ\n#사업가\n웃음이 많은\n장난꾸러기 신부",
  },
  doljanchi: {
    person1: "웃음이 많은\n세상 순한 아기\n잡아당기기 좋아함",
    person2: "",
  },
  senior: {
    person1: "1남2녀 장녀\n울산 출생\n아들1 딸1\n취미 텃밭 가꾸기",
    person2: "",
  },
  birthday: {
    person1: "#INFJ\n#개발자\n#취미 독서\n#아재개그 좋아함",
    person2: "",
  },
};

export const emptyInvitation = (category: Category = "wedding"): InvitationData => {
  const s = CATEGORY_SAMPLE[category];
  return {
    category,
    seniorAge: 70,
    dolKind: DEFAULT_DOL_KIND,
    // 성별은 직접 고르는 항목이라 기본은 표시하지 않음
    babyGender: "",
    groomName: s.groomName,
    brideName: s.brideName,
    groomFather: s.groomFather,
    groomMother: s.groomMother,
    brideFather: s.brideFather,
    brideMother: s.brideMother,
    weddingDate: "2026-10-10",
    weddingTime: "오후 1시",
    venueName: s.venueName,
    venueHall: s.venueHall,
    venueAddress: s.venueAddress,
    // 오시는 길은 직접 채우는 항목이라 비워 둔다 (안 쓰면 그대로 안 나옴)
    directionsSubway: "",
    directionsBus: "",
    directionsParking: "",
    // 인트로는 기본으로 쓰지 않되, 켜면 바로 보이도록 예시 문구는 채워 둔다
    intro: "none",
    // 인트로 문구도 종류마다 예시를 채워 둔다 — 비어 있으면 이름이 대신 떠서
    // 어떤 자리인지 알기 어렵다
    introText: introPlaceholder(category),
    greetingTitle: s.greetingTitle,
    greetingMessage: s.greetingMessage,
    fontHeading: "default",
    fontBody: "default",
    titleFont: "default",
    fontScale: DEFAULT_FONT_SCALE,
    heroTitle: "",
    // 대표 사진: 미리보기용 예시 (제작 시에는 본인 사진으로 교체 필수)
    mainPhotoUrl: s.mainPhoto,
    heroMotion: "zoomin",
    dividerStyle: "diamond",
    groomPhotoUrl: "",
    bridePhotoUrl: "",
    // 소개는 선택 사항이지만, 비어 있으면 어떤 칸인지 알기 어려워 예시를 채워 둔다
    // (소개 칸이 없는 종류는 예시도 빈 값)
    groomIntro: SAMPLE_INTRO[category].person1,
    brideIntro: SAMPLE_INTRO[category].person2,
    // 갤러리: 저작권 문제로 예시 사진 제거 — 빈 슬롯만 두어 사용자가 직접 추가
    gallery: ["", "", ""],
    // 생일·칠순은 연락처가 선택 사항이라 예시 번호를 넣지 않는다
    groomPhone:
      category === "birthday" || category === "senior" ? "" : "010-1234-5678",
    bridePhone: category === "wedding" ? "010-8765-4321" : "",
    accounts:
      // 생일은 축하금 섹션 자체를 두지 않는다
      category === "birthday"
        ? []
        : category === "wedding"
        ? [
            { side: "신랑측", name: "김신랑", bank: "국민은행", number: "123-456-7890" },
            { side: "신부측", name: "박신부", bank: "신한은행", number: "987-654-3210" },
          ]
        : [{ side: "신랑측", name: s.groomName, bank: "국민은행", number: "123-456-7890" }],
    footerMessage: "",
  };
};

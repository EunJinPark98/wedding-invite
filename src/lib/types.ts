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

// 대표 사진 모션 (청첩장 업체에서 많이 쓰는 연출 4종)
export const HERO_MOTIONS = [
  { id: "zoomin", label: "줌 인", desc: "천천히 확대" },
  { id: "zoomout", label: "줌 아웃", desc: "천천히 축소" },
  { id: "focus", label: "아웃포커스", desc: "흐림 → 선명" },
  { id: "mono", label: "흑백 → 컬러", desc: "흑백에서 물들듯" },
] as const;
export type HeroMotion = (typeof HERO_MOTIONS)[number]["id"];

// 갤러리 사진 최대 장수 — 페이지 로딩 속도를 위한 기술적 한도 (요금제 아님)
export const MAX_GALLERY = 20;

// 에디터 미리보기용 예시 대표 사진 — 개인 사진이므로 실제 초대장 제작에는 사용 불가
export const SAMPLE_MAIN_PHOTO = "/wedding1.jpg";
export const SAMPLE_BABY_PHOTO = "/baby.jpg";
export const SAMPLE_BIRTHDAY_PHOTO = "/birthday.jpg";
export const SAMPLE_SENIOR_PHOTO = "/grandmama.png";
// 예시 사진 전체 — 제작 시 본인 사진으로 교체했는지 검사할 때 사용
export const SAMPLE_PHOTOS: readonly string[] = [
  SAMPLE_MAIN_PHOTO,
  SAMPLE_BABY_PHOTO,
  SAMPLE_BIRTHDAY_PHOTO,
  SAMPLE_SENIOR_PHOTO,
];
export const isSamplePhoto = (url: string | undefined | null) =>
  !!url && SAMPLE_PHOTOS.includes(url);

// 청첩장 운영(공개) 기간 선택지 — 모두 무료
export const PERIOD_OPTIONS = [
  { months: 1, label: "1개월" },
  { months: 3, label: "3개월" },
  { months: 6, label: "6개월" },
  { months: 12, label: "1년" },
] as const;
export type PeriodMonths = (typeof PERIOD_OPTIONS)[number]["months"];

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
  // 인사말
  greetingTitle: string;
  greetingMessage: string;
  // 글꼴 (FontId, "default"=템플릿 기본)
  fontHeading: string; // 메인(제목·이름)
  fontBody: string; // 서브(본문)
  // 사진
  mainPhotoUrl: string;
  // 대표 사진 모션 (HeroMotion id)
  heroMotion: string;
  // 신랑/신부 개별 프로필 사진 (선택)
  groomPhotoUrl: string;
  bridePhotoUrl: string;
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
  greetingTitle: d?.greetingTitle ?? "",
  greetingMessage: d?.greetingMessage ?? "",
  fontHeading: d?.fontHeading ?? "default",
  fontBody: d?.fontBody ?? "default",
  mainPhotoUrl: d?.mainPhotoUrl ?? "",
  heroMotion: HERO_MOTIONS.some((m) => m.id === d?.heroMotion)
    ? (d!.heroMotion as HeroMotion)
    : "zoomin",
  groomPhotoUrl: d?.groomPhotoUrl ?? "",
  bridePhotoUrl: d?.bridePhotoUrl ?? "",
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
  }
> = {
  wedding: {
    groomName: "김선일",
    brideName: "박은진",
    groomFather: "김아버지",
    groomMother: "박어머니",
    brideFather: "박아버지",
    brideMother: "엄어머니",
    greetingTitle: "소중한 분들을 초대합니다",
    greetingMessage:
      "서로 다른 길을 걸어온 저희 두 사람이\n이제 같은 곳을 바라보며\n한 길을 걷고자 합니다.\n오셔서 축복해 주시면 감사하겠습니다.",
    accountLabel: "축의금",
    mainPhoto: SAMPLE_MAIN_PHOTO,
  },
  doljanchi: {
    groomName: "김한별",
    brideName: "",
    groomFather: "김아빠",
    groomMother: "박엄마",
    brideFather: "",
    brideMother: "",
    greetingTitle: "우리 아이의 첫 생일에 초대합니다",
    greetingMessage:
      "건강하게 자라준 한별이의 첫 생일을\n소중한 분들과 함께 축하하고 싶습니다.\n오셔서 자리를 빛내주시면 감사하겠습니다.",
    accountLabel: "축하금",
    mainPhoto: SAMPLE_BABY_PHOTO,
  },
  senior: {
    groomName: "김선일",
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
  },
  birthday: {
    groomName: "박은진",
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
  },
};

export const emptyInvitation = (category: Category = "wedding"): InvitationData => {
  const s = CATEGORY_SAMPLE[category];
  return {
    category,
    seniorAge: 70,
    groomName: s.groomName,
    brideName: s.brideName,
    groomFather: s.groomFather,
    groomMother: s.groomMother,
    brideFather: s.brideFather,
    brideMother: s.brideMother,
    weddingDate: "2026-10-10",
    weddingTime: "오후 1시",
    venueName: "그랜드 웨딩홀",
    venueHall: "3층 그랜드볼룸",
    venueAddress: "서울특별시 강남구 테헤란로 123",
    greetingTitle: s.greetingTitle,
    greetingMessage: s.greetingMessage,
    fontHeading: "default",
    fontBody: "default",
    // 대표 사진: 미리보기용 예시 (제작 시에는 본인 사진으로 교체 필수)
    mainPhotoUrl: s.mainPhoto,
    heroMotion: "zoomin",
    groomPhotoUrl: "",
    bridePhotoUrl: "",
    // 갤러리: 저작권 문제로 예시 사진 제거 — 빈 슬롯만 두어 사용자가 직접 추가
    gallery: ["", "", ""],
    groomPhone: "010-1234-5678",
    bridePhone: "010-8765-4321",
    accounts:
      category === "wedding"
        ? [
            { side: "신랑측", name: "김선일", bank: "국민은행", number: "123-456-7890" },
            { side: "신부측", name: "박은진", bank: "신한은행", number: "987-654-3210" },
          ]
        : [{ side: "신랑측", name: s.groomName, bank: "국민은행", number: "123-456-7890" }],
    footerMessage: "",
  };
};

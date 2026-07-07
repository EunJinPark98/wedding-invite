// 모바일 청첩장 데이터 모델

export type TemplateId = "classic" | "modern" | "romantic" | "botanical";

// 갤러리 사진 최대 개수 (무료 플랜 용량 보호)
export const MAX_GALLERY = 7;

// 에디터 미리보기용 예시 대표 사진 — 개인 사진이므로 실제 청첩장 제작에는 사용 불가
export const SAMPLE_MAIN_PHOTO = "/wedding1.jpg";

// 청첩장 운영(공개) 기간 선택지 — 개월 수
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
  // 신랑/신부
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
  gallery: string[];
  // 연락처
  groomPhone: string;
  bridePhone: string;
  // 마음 전하실 곳
  accounts: Account[];
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
  gallery: Array.isArray(d?.gallery)
    ? d.gallery.filter((g) => typeof g === "string").slice(0, MAX_GALLERY)
    : [],
  groomPhone: d?.groomPhone ?? "",
  bridePhone: d?.bridePhone ?? "",
  accounts: Array.isArray(d?.accounts)
    ? d.accounts.filter((a) => a && typeof a === "object")
    : [],
});

export const emptyInvitation = (): InvitationData => ({
  groomName: "김선일",
  brideName: "박은진",
  groomFather: "김아버지",
  groomMother: "박어머니",
  brideFather: "박아버지",
  brideMother: "엄어머니",
  weddingDate: "2026-10-10",
  weddingTime: "오후 1시",
  venueName: "그랜드 웨딩홀",
  venueHall: "3층 그랜드볼룸",
  venueAddress: "서울특별시 강남구 테헤란로 123",
  greetingTitle: "소중한 분들을 초대합니다",
  greetingMessage:
    "서로 다른 길을 걸어온 저희 두 사람이\n이제 같은 곳을 바라보며\n한 길을 걷고자 합니다.\n오셔서 축복해 주시면 감사하겠습니다.",
  fontHeading: "default",
  fontBody: "default",
  // 대표 사진: 미리보기용 예시 (제작 시에는 본인 사진으로 교체 필수)
  mainPhotoUrl: SAMPLE_MAIN_PHOTO,
  // 갤러리: 저작권 문제로 예시 사진 제거 — 빈 슬롯만 두어 사용자가 직접 추가
  gallery: ["", "", ""],
  groomPhone: "010-1234-5678",
  bridePhone: "010-8765-4321",
  accounts: [
    { side: "신랑측", name: "김선일", bank: "국민은행", number: "123-456-7890" },
    { side: "신부측", name: "박은진", bank: "신한은행", number: "987-654-3210" },
  ],
});

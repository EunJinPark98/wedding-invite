import type { Category, TemplateId } from "./types";

export interface TemplateTheme {
  id: TemplateId;
  // 이 템플릿이 속한 초대장 종류 (카테고리별 전용 디자인)
  category: Category;
  name: string;
  description: string;
  // 색상
  accent: string; // 포인트(버튼/강조)
  accentSoft: string; // 옅은 톤 배경
  line: string; // 구분선
  ink: string; // 본문 기본 글자색
  sub: string; // 보조 글자색
  pageBg: string; // 청첩장 카드 배경
  // 폰트 (CSS 변수)
  bodyFont: string; // 본문/이름 한글 서체
  headingFont: string; // 큰 제목용 한글 서체
  // 카드 미리보기용 그라데이션
  swatch: string;
}

export const THEMES: Record<TemplateId, TemplateTheme> = {
  classic: {
    id: "classic",
    category: "wedding",
    name: "클래식",
    description: "단아한 명조체와 따뜻한 베이지 톤의 정통 청첩장",
    accent: "#a98467",
    accentSoft: "#f4ede3",
    line: "#e7ddcd",
    ink: "#4a4036",
    sub: "#8a7e70",
    pageBg: "#fffdf9",
    bodyFont: "var(--font-myeongjo)",
    headingFont: "var(--font-myeongjo)",
    swatch: "linear-gradient(135deg,#cbb393 0%,#a98467 100%)",
  },
  modern: {
    id: "modern",
    category: "wedding",
    name: "모던",
    description: "넉넉한 여백과 또렷한 타이포의 미니멀 청첩장",
    accent: "#222222",
    accentSoft: "#f3f3f2",
    line: "#e6e6e4",
    ink: "#1f2024",
    sub: "#8b8d93",
    pageBg: "#ffffff",
    bodyFont: "var(--font-noto)",
    headingFont: "var(--font-noto)",
    swatch: "linear-gradient(135deg,#4b4f58 0%,#1f2024 100%)",
  },
  romantic: {
    id: "romantic",
    category: "wedding",
    name: "로맨틱",
    description: "은은한 로즈 핑크와 부드러운 곡선의 감성 청첩장",
    accent: "#d6859a",
    accentSoft: "#fdeef1",
    line: "#f5dbe2",
    ink: "#6b4a52",
    sub: "#a9818b",
    pageBg: "#fffafb",
    bodyFont: "var(--font-gowun)",
    headingFont: "var(--font-gowun)",
    swatch: "linear-gradient(135deg,#f3b6c5 0%,#d6859a 100%)",
  },
  botanical: {
    id: "botanical",
    category: "wedding",
    name: "보타니컬",
    description: "차분한 세이지 그린과 식물 무드의 내추럴 청첩장",
    accent: "#6f8c6a",
    accentSoft: "#eef3ea",
    line: "#dbe6d6",
    ink: "#3f4a3c",
    sub: "#7e8c79",
    pageBg: "#fbfdf9",
    bodyFont: "var(--font-gowun)",
    headingFont: "var(--font-myeongjo)",
    swatch: "linear-gradient(135deg,#9cb795 0%,#6f8c6a 100%)",
  },
  starlight: {
    id: "starlight",
    category: "wedding",
    name: "별빛",
    description: "반짝이는 별과 금빛이 쏟아지는 밤하늘 무드 청첩장",
    accent: "#d9bf70",
    accentSoft: "#232948",
    line: "#3a4166",
    ink: "#f2ecd9",
    sub: "#a6abc8",
    pageBg: "#171b34",
    bodyFont: "var(--font-gowun)",
    headingFont: "var(--font-serifkr)",
    swatch: "linear-gradient(135deg,#171b34 0%,#3a4166 55%,#d9bf70 100%)",
  },
  cinema: {
    id: "cinema",
    category: "wedding",
    name: "필름",
    description: "여백과 타이포가 살아있는 필름 화보 무드 청첩장",
    accent: "#c8794f",
    accentSoft: "#f7efe7",
    line: "#eae2d6",
    ink: "#33302c",
    sub: "#8f887e",
    pageBg: "#fdfbf7",
    bodyFont: "var(--font-noto)",
    headingFont: "var(--font-myeongjo)",
    swatch: "linear-gradient(135deg,#fdfbf7 0%,#c8794f 100%)",
  },

  /* ── 돌잔치 전용 ── */
  dolbear: {
    id: "dolbear",
    category: "doljanchi",
    name: "곰돌이",
    description: "포근한 베이지 톤에 풍선과 곰인형이 함께하는 돌잔치",
    accent: "#c08d5a",
    accentSoft: "#faf1e5",
    line: "#eddfcc",
    ink: "#5a4632",
    sub: "#a08a6f",
    pageBg: "#fffdf8",
    bodyFont: "var(--font-dodum)",
    headingFont: "var(--font-gowun)",
    swatch: "linear-gradient(135deg,#f3ddc0 0%,#c08d5a 100%)",
  },
  dolcloud: {
    id: "dolcloud",
    category: "doljanchi",
    name: "구름 위 아기",
    description: "파스텔 하늘 위 무지개와 구름이 흐르는 돌잔치",
    accent: "#6fa8d6",
    accentSoft: "#ecf5fc",
    line: "#d9e9f5",
    ink: "#3e5a70",
    sub: "#8aa6bc",
    pageBg: "#fbfdff",
    bodyFont: "var(--font-dodum)",
    headingFont: "var(--font-gowun)",
    swatch: "linear-gradient(135deg,#bfe0f7 0%,#6fa8d6 60%,#f7c9d9 100%)",
  },
  dolhanbok: {
    id: "dolhanbok",
    category: "doljanchi",
    name: "색동",
    description: "색동 저고리처럼 고운 전통 무드의 돌잔치",
    accent: "#c25b4e",
    accentSoft: "#fdf0ea",
    line: "#f0dcd2",
    ink: "#54382f",
    sub: "#a3796b",
    pageBg: "#fffcf7",
    bodyFont: "var(--font-gowun)",
    headingFont: "var(--font-myeongjo)",
    swatch: "linear-gradient(135deg,#e9b4a0 0%,#c25b4e 50%,#3f6b8f 100%)",
  },

  /* ── 칠순 · 팔순 전용 ── */
  seniorgold: {
    id: "seniorgold",
    category: "senior",
    name: "수연",
    description: "자주빛과 금빛이 어우러진 격조 있는 수연례",
    accent: "#8e3b46",
    accentSoft: "#f9eef0",
    line: "#ecd8db",
    ink: "#4a3037",
    sub: "#9a7d83",
    pageBg: "#fdfaf3",
    bodyFont: "var(--font-myeongjo)",
    headingFont: "var(--font-myeongjo)",
    swatch: "linear-gradient(135deg,#8e3b46 0%,#c9a35c 100%)",
  },
  seniorbloom: {
    id: "seniorbloom",
    category: "senior",
    name: "모란",
    description: "탐스러운 모란처럼 따뜻하고 화사한 잔치",
    accent: "#b06a78",
    accentSoft: "#fbf0f2",
    line: "#f1dce0",
    ink: "#5d434b",
    sub: "#a2848b",
    pageBg: "#fffafb",
    bodyFont: "var(--font-gowun)",
    headingFont: "var(--font-serifkr)",
    swatch: "linear-gradient(135deg,#e5b6c0 0%,#b06a78 100%)",
  },
  seniorpine: {
    id: "seniorpine",
    category: "senior",
    name: "송학",
    description: "소나무와 학처럼 푸르고 장수를 기원하는 잔치",
    accent: "#c9a35c",
    accentSoft: "#eef3ee",
    line: "#dae4da",
    ink: "#31463b",
    sub: "#7d8f83",
    pageBg: "#f9fbf8",
    bodyFont: "var(--font-myeongjo)",
    headingFont: "var(--font-serifkr)",
    swatch: "linear-gradient(135deg,#1e3229 0%,#3f6b5a 55%,#c9a35c 100%)",
  },

  /* ── 생일 전용 ── */
  bdaypop: {
    id: "bdaypop",
    category: "birthday",
    name: "파티팝",
    description: "알록달록 컨페티가 쏟아지는 신나는 생일 파티",
    accent: "#f26d5f",
    accentSoft: "#fff1ec",
    line: "#fadfd7",
    ink: "#453734",
    sub: "#a08a84",
    pageBg: "#ffffff",
    bodyFont: "var(--font-noto)",
    headingFont: "var(--font-noto)",
    swatch: "linear-gradient(135deg,#ffd166 0%,#f26d5f 50%,#5fb7c9 100%)",
  },
  bdayneon: {
    id: "bdayneon",
    category: "birthday",
    name: "네온 나이트",
    description: "네온사인이 반짝이는 나이트 파티 무드",
    accent: "#ff5fa2",
    accentSoft: "#241f33",
    line: "#3b3352",
    ink: "#f1edfc",
    sub: "#a79fc4",
    pageBg: "#16131f",
    bodyFont: "var(--font-noto)",
    headingFont: "var(--font-noto)",
    swatch: "linear-gradient(135deg,#16131f 0%,#ff5fa2 60%,#5fd9e7 100%)",
  },
  bdayminimal: {
    id: "bdayminimal",
    category: "birthday",
    name: "미니멀 데이",
    description: "큼직한 타이포와 여백이 시원한 미니멀 생일 카드",
    accent: "#3556d4",
    accentSoft: "#eef1fc",
    line: "#dde3f7",
    ink: "#22263a",
    sub: "#8b90a8",
    pageBg: "#ffffff",
    bodyFont: "var(--font-noto)",
    headingFont: "var(--font-noto)",
    swatch: "linear-gradient(135deg,#c9d4f7 0%,#3556d4 100%)",
  },
};

export const TEMPLATES: TemplateTheme[] = Object.values(THEMES);

// 카테고리별 전용 템플릿 목록 (메인/에디터 선택 UI용)
export const getTemplatesByCategory = (category: Category): TemplateTheme[] =>
  TEMPLATES.filter((t) => t.category === category);

export const getTheme = (id: string): TemplateTheme =>
  THEMES[id as TemplateId] ?? THEMES.classic;

/* ───────── 글꼴 선택 ───────── */
export interface FontOption {
  id: string;
  name: string;
  family: string; // 비어있으면 템플릿 기본 사용
  sample: string;
}

// 실제 인쇄·모바일 청첩장에서 널리 쓰이는 서체 위주로 구성
export const FONTS: FontOption[] = [
  { id: "default", name: "템플릿 기본", family: "", sample: "가나다 Abc" },
  // 명조(세리프) — 격식 있는 본문·이름
  {
    id: "serifkr",
    name: "본명조",
    family: "var(--font-serifkr)",
    sample: "우리 결혼해요",
  },
  {
    id: "myeongjo",
    name: "나눔명조",
    family: "var(--font-myeongjo)",
    sample: "우리 결혼해요",
  },
  {
    id: "gowun",
    name: "고운바탕",
    family: "var(--font-gowun)",
    sample: "우리 결혼해요",
  },
  {
    id: "song",
    name: "송명",
    family: "var(--font-song)",
    sample: "우리 결혼해요",
  },
  // 고딕 — 깔끔한 모던 스타일
  {
    id: "noto",
    name: "본고딕",
    family: "var(--font-noto)",
    sample: "우리 결혼해요",
  },
  {
    id: "dodum",
    name: "고운돋움",
    family: "var(--font-dodum)",
    sample: "우리 결혼해요",
  },
  {
    id: "nanumgothic",
    name: "나눔고딕",
    family: "var(--font-nanumgothic)",
    sample: "우리 결혼해요",
  },
  // 캘리그라피 — 인사말·타이틀 포인트
  {
    id: "brush",
    name: "붓글씨",
    family: "var(--font-brush)",
    sample: "우리 결혼해요",
  },
];

export const getFontFamily = (id: string): string =>
  FONTS.find((f) => f.id === id)?.family ?? "";

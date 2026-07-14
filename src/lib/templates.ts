import type { TemplateId } from "./types";

export interface TemplateTheme {
  id: TemplateId;
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
};

export const TEMPLATES: TemplateTheme[] = Object.values(THEMES);

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

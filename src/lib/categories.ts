import type { Category } from "./types";

// 메인 페이지 카테고리 선택 카드
export const CATEGORIES: {
  id: Category;
  label: string;
  emoji: string;
  tagline: string;
}[] = [
  {
    id: "wedding",
    label: "결혼 청첩장",
    emoji: "💍",
    tagline: "두 사람의 새로운 시작을 알려요",
  },
  {
    id: "doljanchi",
    label: "돌잔치 초대장",
    emoji: "🎂",
    tagline: "아이의 첫 생일을 함께해요",
  },
  {
    id: "senior",
    label: "칠순 · 팔순 잔치",
    emoji: "🌾",
    tagline: "부모님의 특별한 날을 빛내요",
  },
  {
    id: "birthday",
    label: "생일 초대장",
    emoji: "🎉",
    tagline: "소중한 생일을 축하해요",
  },
];

export const getCategoryMeta = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

// 카테고리별 문구/필드 라벨. wedding 값은 기존 하드코딩 문구와 완전히 동일하게 유지해
// (레이아웃에서 category === "wedding"일 때 기존 로직을 그대로 타도록) 기존 청첩장이
// 한 글자도 바뀌지 않도록 함.
export interface CategoryLabels {
  // 에디터
  editorTitle: string;
  groupTitle: string; // 3단계 그룹 제목
  personLabel: string;
  person2Label: string;
  contact1Label: string;
  contact2Label: string;
  photo1Label: string;
  photo2Label: string;
  showPerson2: boolean;
  showParents: boolean;
  parent1Label: string;
  parent2Label: string;
  dateSectionTitle: string;
  dateFieldLabel: string;
  venueLabel: string;
  accountsGroupTitle: string;
  accountsLabel: string; // 뷰에서 계좌 섹션 소제목 "마음 전하실 곳"
  // 뷰(청첩장 화면)
  sectionCoupleLabel: string; // "GROOM & BRIDE" 대응 섹션 제목
  personTitle: string; // 단일 인물 카드 위 타이틀 (showPerson2=false 전용)
  relation: string; // "OOO·OOO의 {relation}" (showPerson2=false 전용)
  heroKicker: string; // 클래식 소문구 / 별빛 소문구
  heroKicker2: string; // 모던 헤드라인
  heroPhrase: string; // 로맨틱·별빛 붓글씨 문구 (non-wedding 전용)
  countdownLabel: string; // 카운트다운 문구 "OOO의 {countdownLabel}까지"
}

export function getCategoryLabels(category: Category): CategoryLabels {
  switch (category) {
    case "doljanchi":
      return {
        editorTitle: "돌잔치 초대장 만들기",
        groupTitle: "아기 정보",
        personLabel: "아기 이름",
        person2Label: "",
        contact1Label: "보호자 연락처",
        contact2Label: "",
        photo1Label: "아기 사진",
        photo2Label: "",
        showPerson2: false,
        showParents: true,
        parent1Label: "아빠 이름",
        parent2Label: "엄마 이름",
        dateSectionTitle: "돌잔치 일시 · 장소",
        dateFieldLabel: "돌잔치 날짜",
        venueLabel: "돌잔치 장소",
        accountsGroupTitle: "축하 마음 전하실 곳 (계좌)",
        accountsLabel: "축하 마음 전하실 곳",
        sectionCoupleLabel: "우리 아이",
        personTitle: "아기",
        relation: "아이",
        heroKicker: "FIRST BIRTHDAY",
        heroKicker2: "THE FIRST BIRTHDAY",
        heroPhrase: "첫 생일을 축하해요",
        countdownLabel: "첫 생일",
      };
    case "senior":
      return {
        editorTitle: "칠순 · 팔순 초대장 만들기",
        groupTitle: "주인공 정보",
        personLabel: "주인공 성함",
        person2Label: "",
        contact1Label: "연락처",
        contact2Label: "",
        photo1Label: "주인공 사진",
        photo2Label: "",
        showPerson2: false,
        showParents: false,
        parent1Label: "",
        parent2Label: "",
        dateSectionTitle: "잔치 일시 · 장소",
        dateFieldLabel: "잔치 날짜",
        venueLabel: "잔치 장소",
        accountsGroupTitle: "마음 전하실 곳 (계좌)",
        accountsLabel: "마음 전하실 곳",
        sectionCoupleLabel: "축하합니다",
        personTitle: "",
        relation: "",
        heroKicker: "70TH · 80TH BIRTHDAY",
        heroKicker2: "THE CELEBRATION DAY",
        heroPhrase: "귀한 걸음 함께해 주세요",
        countdownLabel: "잔치",
      };
    case "birthday":
      return {
        editorTitle: "생일 초대장 만들기",
        groupTitle: "주인공 정보",
        personLabel: "생일 주인공 이름",
        person2Label: "",
        contact1Label: "연락처",
        contact2Label: "",
        photo1Label: "주인공 사진",
        photo2Label: "",
        showPerson2: false,
        showParents: false,
        parent1Label: "",
        parent2Label: "",
        dateSectionTitle: "파티 일시 · 장소",
        dateFieldLabel: "생일 파티 날짜",
        venueLabel: "파티 장소",
        accountsGroupTitle: "마음 전하실 곳 (계좌)",
        accountsLabel: "마음 전하실 곳",
        sectionCoupleLabel: "생일 축하해요",
        personTitle: "",
        relation: "",
        heroKicker: "HAPPY BIRTHDAY",
        heroKicker2: "THE BIRTHDAY",
        heroPhrase: "생일을 축하해요",
        countdownLabel: "생일",
      };
    case "wedding":
    default:
      return {
        editorTitle: "청첩장 만들기",
        groupTitle: "신랑 · 신부",
        personLabel: "신랑 이름",
        person2Label: "신부 이름",
        contact1Label: "신랑 연락처",
        contact2Label: "신부 연락처",
        photo1Label: "신랑 사진 (선택)",
        photo2Label: "신부 사진 (선택)",
        showPerson2: true,
        showParents: true,
        parent1Label: "",
        parent2Label: "",
        dateSectionTitle: "예식 일시 · 장소",
        dateFieldLabel: "예식일",
        venueLabel: "예식장 이름",
        accountsGroupTitle: "마음 전하실 곳 (계좌)",
        accountsLabel: "마음 전하실 곳",
        sectionCoupleLabel: "신랑 신부",
        personTitle: "",
        relation: "",
        heroKicker: "WEDDING INVITATION",
        heroKicker2: "THE WEDDING DAY",
        heroPhrase: "",
        countdownLabel: "결혼식",
      };
  }
}

import { getDolKindMeta, getSeniorAgeMeta, type Category } from "./types";

// 조사 붙이기 — 카테고리마다 이름이 달라서("예식일" / "돌잔치 날짜")
// 조사를 박아두면 한쪽이 반드시 틀린다. 받침을 보고 고른다.
const hasJongseong = (word: string) => {
  const w = word.trim();
  const code = w.charCodeAt(w.length - 1) - 0xac00;
  // 한글이 아니면(영문·숫자) 받침이 있는 쪽으로 본다
  if (code < 0 || code > 11171) return true;
  return code % 28 !== 0;
};

// "팔순을 맞아" / "백수를 맞아", "예식일을 입력하면" / "돌잔치 날짜를 입력하면"
export const josaEulReul = (word: string) => (hasJongseong(word) ? "을" : "를");

// "예식일은 오늘 이후로" / "돌잔치 날짜는 오늘 이후로"
export const josaEunNeun = (word: string) => (hasJongseong(word) ? "은" : "는");

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
    label: "백일 · 돌잔치",
    emoji: "🎂",
    tagline: "아이의 첫 잔치를 함께해요",
  },
  {
    id: "senior",
    label: "칠순 · 팔순 잔치",
    emoji: "🌾",
    // "빛나는 날" 사이는 줄바꿈 없는 공백 — 좁은 화면에서 "칠순부터 백수까지 /
    // 빛나는 날"로 끊기고 "날"만 홀로 내려가지 않는다
    tagline: "칠순부터 백수까지 빛나는 날",
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

// 초대장 데이터에서 바로 라벨을 뽑는 헬퍼 (칠순 연세·아기 잔치 종류까지 함께 반영)
export const labelsOf = (d: {
  category: Category;
  seniorAge?: number;
  dolKind?: string;
}): CategoryLabels => getCategoryLabels(d.category, d.seniorAge, d.dolKind);

// 카테고리별 문구/필드 라벨. wedding 값은 기존 하드코딩 문구와 완전히 동일하게 유지해
// (레이아웃에서 category === "wedding"일 때 기존 로직을 그대로 타도록) 기존 청첩장이
// 한 글자도 바뀌지 않도록 함.
export interface CategoryLabels {
  // 이 카테고리 초대장의 호칭 (결혼="청첩장", 그 외="초대장")
  noun: string;
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
  showContact: boolean; // 프로필에 전화·문자 버튼을 둘지
  showIntro: boolean; // 프로필에 인물 소개 문구를 둘지 (선택 입력)
  intro1Label: string;
  intro2Label: string;
  parent1Label: string;
  parent2Label: string;
  dateSectionTitle: string;
  dateFieldLabel: string;
  venueLabel: string;
  accountsGroupTitle: string;
  accountsLabel: string; // 뷰에서 계좌 섹션 소제목 "마음 전하실 곳"
  showAccounts: boolean; // 계좌 섹션(에디터 7번 항목)을 둘지
  // 뷰(청첩장 화면)
  sectionCoupleLabel: string; // "GROOM & BRIDE" 대응 섹션 제목
  personTitle: string; // 단일 인물 카드 위 타이틀 (showPerson2=false 전용)
  personPhotoRole: string; // 프로필 사진 빈 슬롯 문구 "OO 사진" (showPerson2=false 전용)
  relation: string; // "OOO·OOO의 {relation}" (showPerson2=false 전용)
  heroKicker: string; // 클래식 소문구 / 별빛 소문구
  heroKicker2: string; // 모던 헤드라인
  heroPhrase: string; // 로맨틱·별빛 붓글씨 문구 (non-wedding 전용)
  countdownLabel: string; // 카운트다운 문구 "OOO의 {countdownLabel}까지"
  seniorLabel: string; // 칠순/팔순/구순/백수 (senior 전용, 그 외 "")
  seniorHanja: string; // 七旬/八旬/九旬/百壽 (senior 전용, 그 외 "")
  dolEvent: string; // 백일잔치/돌잔치 (doljanchi 전용, 그 외 "")
  dolOccasion: string; // 문장 속 표현 — 백일/첫 생일 (doljanchi 전용, 그 외 "")
  dolMilestone: string; // "~을 맞이했습니다" 용 — 백일/첫 돌 (doljanchi 전용, 그 외 "")
  dolEnglish: string; // 이름 아래 영문 문구 — 구름 위 아기 템플릿 (doljanchi 전용, 그 외 "")
}

// seniorAge는 senior 카테고리에서만 의미가 있음 (70=칠순, 80=팔순, 90=구순, 100=백수)
export function getCategoryLabels(
  category: Category,
  seniorAge: number = 70,
  dolKind?: string
): CategoryLabels {
  // 칠순/팔순/구순/백수 — 선택한 연세에 따라 문구가 통째로 바뀜
  const age = getSeniorAgeMeta(seniorAge);
  // 백일잔치/돌잔치 — 선택한 종류에 따라 문구가 통째로 바뀜
  const dol = getDolKindMeta(dolKind);
  switch (category) {
    case "doljanchi":
      return {
        noun: "초대장",
        editorTitle: `${dol.event} 초대장 만들기`,
        groupTitle: "아기 정보",
        personLabel: "아기 이름",
        person2Label: "",
        contact1Label: "보호자 연락처",
        contact2Label: "",
        photo1Label: "아기 사진",
        photo2Label: "",
        showPerson2: false,
        // 아기 잔치는 혼주·연락처 대신 아기 소개만 담백하게 둔다
        showParents: false,
        showContact: false,
        showIntro: true,
        intro1Label: "아기 소개",
        intro2Label: "",
        parent1Label: "",
        parent2Label: "",
        dateSectionTitle: `${dol.event} 일시 · 장소`,
        dateFieldLabel: `${dol.event} 날짜`,
        venueLabel: `${dol.event} 장소`,
        accountsGroupTitle: "마음 전하실 곳 (계좌)",
        accountsLabel: "마음 전하실 곳",
        showAccounts: true,
        sectionCoupleLabel: "주인공",
        personTitle: "",
        personPhotoRole: "아기",
        relation: "",
        heroKicker: dol.kicker,
        heroKicker2: dol.kicker2,
        heroPhrase: `${dol.occasion}을 축하해요`,
        // "OOO의 {countdownLabel}에 초대합니다" (공유 카드·카톡 공유 문구),
        // "OOO님의 {countdownLabel}까지 D-N" (초대장 속 카운트다운)에 쓰인다.
        // dol.occasion("첫 생일")이 아니라 dol.event("돌잔치")를 써야
        // "김아기의 돌잔치에 초대합니다"처럼 자연스럽게 읽힌다.
        countdownLabel: dol.event,
        seniorLabel: "",
        seniorHanja: "",
        dolEvent: dol.event,
        dolOccasion: dol.occasion,
        dolMilestone: dol.milestone,
        dolEnglish: dol.english,
      };
    case "senior":
      return {
        noun: "초대장",
        editorTitle: `${age.label} 초대장 만들기`,
        groupTitle: "주인공 정보",
        personLabel: "주인공 성함",
        person2Label: "",
        contact1Label: "연락처",
        contact2Label: "",
        photo1Label: "주인공 사진",
        photo2Label: "",
        showPerson2: false,
        showParents: false,
        showContact: true,
        showIntro: true,
        intro1Label: "주인공 소개",
        intro2Label: "",
        parent1Label: "",
        parent2Label: "",
        dateSectionTitle: `${age.label} 일시 · 장소`,
        dateFieldLabel: `${age.label} 날짜`,
        venueLabel: "잔치 장소",
        accountsGroupTitle: "마음 전하실 곳 (계좌)",
        accountsLabel: "마음 전하실 곳",
        showAccounts: true,
        sectionCoupleLabel: "주인공",
        personTitle: "",
        personPhotoRole: "주인공",
        relation: "",
        heroKicker: `${age.age}TH BIRTHDAY CELEBRATION`,
        heroKicker2: "THE CELEBRATION DAY",
        heroPhrase: "귀한 걸음 함께해 주세요",
        countdownLabel: `${age.label} 잔치`,
        seniorLabel: age.label,
        seniorHanja: age.hanja,
        dolEvent: "",
        dolOccasion: "",
        dolMilestone: "",
        dolEnglish: "",
      };
    case "birthday":
      return {
        noun: "초대장",
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
        showContact: true,
        showIntro: true,
        intro1Label: "주인공 소개",
        intro2Label: "",
        parent1Label: "",
        parent2Label: "",
        dateSectionTitle: "파티 일시 · 장소",
        dateFieldLabel: "생일 파티 날짜",
        venueLabel: "파티 장소",
        accountsGroupTitle: "마음 전하실 곳 (계좌)",
        accountsLabel: "마음 전하실 곳",
        showAccounts: true,
        sectionCoupleLabel: "주인공",
        personTitle: "",
        personPhotoRole: "주인공",
        relation: "",
        heroKicker: "HAPPY BIRTHDAY",
        heroKicker2: "THE BIRTHDAY",
        heroPhrase: "생일을 축하해요",
        countdownLabel: "생일",
        seniorLabel: "",
        seniorHanja: "",
        dolEvent: "",
        dolOccasion: "",
        dolMilestone: "",
        dolEnglish: "",
      };
    case "wedding":
    default:
      return {
        noun: "청첩장",
        editorTitle: "청첩장 만들기",
        groupTitle: "신랑 · 신부",
        personLabel: "신랑 이름",
        person2Label: "신부 이름",
        contact1Label: "신랑 연락처",
        contact2Label: "신부 연락처",
        photo1Label: "신랑 사진",
        photo2Label: "신부 사진",
        showPerson2: true,
        showParents: true,
        showContact: true,
        showIntro: true,
        intro1Label: "신랑 소개",
        intro2Label: "신부 소개",
        parent1Label: "",
        parent2Label: "",
        dateSectionTitle: "예식 일시 · 장소",
        dateFieldLabel: "예식일",
        venueLabel: "예식장 이름",
        accountsGroupTitle: "마음 전하실 곳 (계좌)",
        accountsLabel: "마음 전하실 곳",
        showAccounts: true,
        sectionCoupleLabel: "신랑 신부",
        personTitle: "",
        personPhotoRole: "",
        relation: "",
        heroKicker: "WEDDING INVITATION",
        heroKicker2: "THE WEDDING DAY",
        heroPhrase: "",
        countdownLabel: "결혼식",
        seniorLabel: "",
        seniorHanja: "",
        dolEvent: "",
        dolOccasion: "",
        dolMilestone: "",
        dolEnglish: "",
      };
  }
}

import {
  getBabyGenderMark,
  normalizeData,
  type InvitationData,
  type TemplateId,
} from "@/lib/types";
import {
  getTheme,
  getFontFamily,
  getTitleFontFamily,
  type TemplateTheme,
} from "@/lib/templates";
import { labelsOf } from "@/lib/categories";
import GalleryAlbum from "./GalleryAlbum";
import AccountList from "./AccountList";
import Countdown from "./Countdown";
import MapSection from "./MapSection";
import ScrollReveal from "./ScrollReveal";
import InvitationIntro from "./InvitationIntro";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAYS_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * 맨 위 메인 타이틀(주인공 이름)에 따로 고른 글꼴.
 *
 * 생일 초대장에서만 고를 수 있는 값이라, 다른 종류에서는 예전 데이터가
 * 남아 있더라도 무시한다. 고르지 않았으면 "" 를 돌려주므로 부르는 쪽에서
 * 템플릿이 정한 글꼴로 넘어가면 된다.
 */
const titleFontOf = (data: InvitationData) =>
  data.category === "birthday" ? getTitleFontFamily(data.titleFont) : "";

/**
 * 상단 문구를 비우면 그 한 줄이 통째로 빠지면서 여백까지 함께 사라져,
 * 아래 글이 사진에 바짝 붙는다. 문구가 없을 때는 바로 다음 요소가 그
 * 간격을 대신 갖게 한다.
 */
const heroGap = (data: InvitationData, withTitle: string, withoutTitle: string) =>
  data.heroTitle.trim() ? withTitle : withoutTitle;

/* ════════ 글꼴 크기 배율 ════════ */

// Tailwind 기본 글자 크기(rem). text-sm 등은 `font-size: var(--text-sm)` 로
// 컴파일되므로, 루트에서 이 변수를 덮어쓰면 하위 요소에 그대로 상속된다.
const TW_TEXT_REM: Record<string, number> = {
  xs: 0.75,
  sm: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  "2xl": 1.5,
  "3xl": 1.875,
  "4xl": 2.25,
};

/**
 * 글꼴 크기 배율을 CSS 변수로 내려보낸다. 사진·여백은 그대로 두고 글자만 커진다.
 *   - `--inv-fs`  : 임의 크기 클래스 text-[calc(15px*var(--inv-fs))] 가 참조
 *   - `--text-*`  : Tailwind 기본 크기 클래스(text-sm 등)가 참조
 * 줄간격은 Tailwind가 비율(계산식)로 두므로 글자 크기를 따라 자동으로 늘어난다.
 */
function fontScaleVars(scale: number): React.CSSProperties {
  const vars: Record<string, string> = { "--inv-fs": String(scale) };
  for (const [name, rem] of Object.entries(TW_TEXT_REM)) {
    vars[`--text-${name}`] = `calc(${rem}rem * var(--inv-fs))`;
  }
  return vars as React.CSSProperties;
}

function parseDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function dateParts(iso: string) {
  const d = parseDate(iso);
  if (!d) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    wkKo: WEEKDAYS[d.getDay()],
    wkEn: WEEKDAYS_EN[d.getDay()],
  };
}
function formatKoDate(iso: string) {
  const p = dateParts(iso);
  if (!p) return iso;
  return `${p.year}년 ${p.month}월 ${p.day}일 ${p.wkKo}요일`;
}

// 글꼴을 키우면 "날짜 + 시간"이 한 줄에 안 들어가 어중간하게 잘린다.
// '크게'(1.1) 이상은 시간을 아예 다음 줄로 내려 깔끔하게 두 줄로 만든다.
const BREAK_TIME_FROM_SCALE = 1.1;

/* ════════ 공통 미니 달력 ════════ */
function MiniCalendar({
  iso,
  t,
  heart = false,
}: {
  iso: string;
  t: TemplateTheme;
  heart?: boolean;
}) {
  const d = parseDate(iso);
  if (!d) return null;
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const MONTHS_EN = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];

  return (
    <div
      className="inv-fade mx-auto max-w-[280px] rounded-2xl px-3 pb-6 pt-7"
      style={{ background: t.accentSoft }}
    >
      <div className="mb-5 text-center">
        <p className="text-2xl font-light" style={{ color: t.ink }}>
          {month + 1}
          <span className="ml-0.5 text-sm" style={{ color: t.sub }}>
            월
          </span>
        </p>
        <p
          className="font-cormorant mt-1 text-[calc(9px*var(--inv-fs))] tracking-[0.4em]"
          style={{ color: t.accent }}
        >
          {MONTHS_EN[month]}
        </p>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className="py-2 text-[calc(11px*var(--inv-fs))] font-medium"
            style={{ color: i === 0 ? t.accent : t.sub }}
          >
            {w}
          </div>
        ))}
        {cells.map((c, i) => {
          const isDay = c === day;
          return (
            <div key={i} className="flex justify-center py-1">
              {c && (
                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    isDay ? "inv-day-pulse" : ""
                  }`}
                  style={
                    isDay
                      ? ({
                          background: t.accent,
                          color: "#fff",
                          fontWeight: 700,
                          "--pulse-color": `${t.accent}40`,
                        } as React.CSSProperties)
                      : { color: i % 7 === 0 ? t.accent : t.ink }
                  }
                >
                  {c}
                  {isDay && heart && (
                    <span className="absolute -right-1 -top-1 text-[calc(10px*var(--inv-fs))]">
                      ♡
                    </span>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════ 내용 블록 (라벨/래퍼 없이 알맹이만) ════════ */
function GreetingInner({
  data,
  t,
  align = "center",
}: {
  data: InvitationData;
  t: TemplateTheme;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "left" ? "text-left" : "text-center"}>
      <h2
        className="inv-fade mb-8 text-[calc(19px*var(--inv-fs))] leading-relaxed tracking-[0.04em]"
        style={{ fontFamily: t.headingFont }}
      >
        {data.greetingTitle}
      </h2>
      <p
        className="inv-fade whitespace-pre-line text-[calc(14px*var(--inv-fs))] leading-[2.2]"
        style={{ color: t.sub }}
      >
        {data.greetingMessage}
      </p>
    </div>
  );
}

// 예식일까지 남은 일수 (지났으면 null)
/**
 * 날짜를 숫자·영문 서체로 쓰는 히어로에서는 시간도 숫자로 맞춘다 ("오후 1시" → "13:00").
 * 한글로 "2026년 10월 10일" 처럼 쓰는 곳은 "오후 1시" 가 자연스러워 그대로 둔다.
 */
function time24(v: string): string {
  const t = (v ?? "").trim();
  if (!t) return "";
  if (/^\d{1,2}:\d{2}$/.test(t)) return t; // 이미 숫자 표기
  const m = t.match(/(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  if (!m) return t; // 직접 적은 값은 건드리지 않는다
  const h12 = Number(m[2]) % 12;
  const h = m[1] === "오전" ? h12 : h12 + 12;
  return `${String(h).padStart(2, "0")}:${String(Number(m[3] ?? 0)).padStart(2, "0")}`;
}

function daysUntil(iso: string): number | null {
  const d = parseDate(iso);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  return diff >= 0 ? diff : null;
}

function DateInner({
  data,
  t,
  calendar = true,
  heart = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  calendar?: boolean;
  heart?: boolean;
}) {
  const dday = daysUntil(data.weddingDate);
  const labels = labelsOf(data);
  return (
    <div className="text-center">
      <p className="inv-fade mb-7 text-lg" style={{ fontFamily: t.headingFont }}>
        {formatKoDate(data.weddingDate)}
        {data.fontScale >= BREAK_TIME_FROM_SCALE ? <br /> : " "}
        {data.weddingTime}
      </p>
      {calendar && <MiniCalendar iso={data.weddingDate} t={t} heart={heart} />}
      {dday !== null && (
        <div className="inv-fade mt-7">
          <p
            className="font-cormorant inline-block rounded-full border px-5 py-1.5 text-xs font-medium tracking-[0.3em]"
            style={{ borderColor: `${t.accent}66`, color: t.accent }}
          >
            {dday === 0 ? "D-DAY" : `D-${dday}`}
          </p>
        </div>
      )}
      {/* 실시간 카운트다운 (일/시/분/초) */}
      <Countdown
        iso={data.weddingDate}
        t={t}
        groomName={data.groomName}
        brideName={data.brideName}
        showPerson2={labels.showPerson2}
        eventLabel={labels.countdownLabel}
      />
    </div>
  );
}

/* ════════ 신랑 · 신부 프로필 ════════ */
function ProfilePhoto({
  src,
  role,
  t,
  arch = false,
  preview = false,
}: {
  src: string;
  role: string;
  t: TemplateTheme;
  arch?: boolean;
  preview?: boolean;
}) {
  const shape = arch
    ? {
        borderTopLeftRadius: "999px",
        borderTopRightRadius: "999px",
        borderBottomLeftRadius: "14px",
        borderBottomRightRadius: "14px",
      }
    : { borderRadius: "12px" };
  if (src)
    return (
      <div
        className="inv-zoom w-full overflow-hidden"
        style={{ ...shape, aspectRatio: "3/4", boxShadow: `0 14px 30px -14px ${t.accent}55` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`${role} 사진`} className="h-full w-full object-cover" />
      </div>
    );
  // 사진 미등록: 미리보기에서만 빈 슬롯 안내
  if (!preview) return null;
  return (
    <div
      className="flex w-full items-center justify-center border border-dashed"
      style={{
        ...shape,
        aspectRatio: "3/4",
        borderColor: t.line,
        background: t.accentSoft,
        color: t.sub,
      }}
    >
      <span className="text-[calc(11px*var(--inv-fs))]">{role} 사진</span>
    </div>
  );
}

/**
 * 아기 이름 아래 성별 표시.
 * 돌잔치·백일잔치에서 성별을 고른 경우에만 나온다.
 */
function GenderMark({ data, t }: { data: InvitationData; t: TemplateTheme }) {
  if (data.category !== "doljanchi") return null;
  const mark = getBabyGenderMark(data.babyGender);
  if (!mark) return null;
  return (
    <p className="inv-hero-in-delay mt-2 text-center">
      <span
        className="inline-block rounded-full px-2.5 py-0.5 text-[calc(11px*var(--inv-fs))] font-normal tracking-normal"
        style={{ background: t.accentSoft, color: t.accent }}
      >
        {mark}
      </span>
    </p>
  );
}

function CoupleInner({
  data,
  t,
  arch = false,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  arch?: boolean;
  preview?: boolean;
}) {
  const labels = labelsOf(data);
  const people = labels.showPerson2
    ? [
        {
          role: "신랑",
          name: data.groomName,
          photo: data.groomPhotoUrl,
          father: data.groomFather,
          mother: data.groomMother,
          relation: "아들",
          tel: data.groomPhone,
          intro: data.groomIntro,
        },
        {
          role: "신부",
          name: data.brideName,
          photo: data.bridePhotoUrl,
          father: data.brideFather,
          mother: data.brideMother,
          relation: "딸",
          tel: data.bridePhone,
          intro: data.brideIntro,
        },
      ]
    : [
        {
          role: labels.personTitle,
          name: data.groomName,
          photo: data.groomPhotoUrl,
          father: data.groomFather,
          mother: data.groomMother,
          relation: labels.relation,
          tel: data.groomPhone,
          intro: data.groomIntro,
        },
      ];
  return (
    <div
      className={
        labels.showPerson2
          ? "grid grid-cols-2 gap-5"
          : "mx-auto max-w-[220px]"
      }
    >
      {people.map((p) => {
        const parents = [p.father, p.mother].map((s) => s.trim()).filter(Boolean);
        return (
          <div key={p.role || "solo"} className="text-center">
            {/* 신랑/신부 타이틀 */}
            {p.role && (
              <p
                className="inv-fade mb-4 text-base tracking-[0.2em]"
                style={{ fontFamily: t.headingFont, color: t.ink }}
              >
                {p.role}
              </p>
            )}
            <ProfilePhoto
              src={p.photo}
              role={p.role || labels.personPhotoRole}
              t={t}
              arch={arch}
              preview={preview}
            />
            {/* 이름 ↵ 성별 ↵ 전화·문자 */}
            <p
              className="inv-fade mt-5 text-lg"
              style={{ fontFamily: t.headingFont, color: t.ink }}
            >
              {p.name}
            </p>
            <GenderMark data={data} t={t} />
            {/* 한 줄 소개 (선택) — 안 적으면 이 줄 자체가 나오지 않는다 */}
            {labels.showIntro && p.intro.trim() && (
              <p
                className="inv-fade mt-2.5 whitespace-pre-line text-[calc(12px*var(--inv-fs))] leading-[1.9]"
                style={{ color: t.sub }}
              >
                {p.intro.trim()}
              </p>
            )}
            {labels.showContact && p.tel && (
              <div className="inv-fade mt-2.5 flex items-center justify-center gap-2">
                  <a
                    href={`tel:${p.tel}`}
                    aria-label="전화하기"
                    className="flex h-7 w-7 items-center justify-center rounded-full border transition"
                    style={{ borderColor: t.line, color: t.accent }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
                    </svg>
                  </a>
                  <a
                    href={`sms:${p.tel}`}
                    aria-label="문자하기"
                    className="flex h-7 w-7 items-center justify-center rounded-full border transition"
                    style={{ borderColor: t.line, color: t.accent }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                  </a>
              </div>
            )}
            {/* 부모 소개: "아버지 · 어머니 ↵ 아들" */}
            {labels.showParents && parents.length > 0 && (
              <p
                className="inv-fade mt-2.5 text-xs leading-6"
                style={{ color: t.sub }}
              >
                {parents.join(" · ")}
                <br />
                {p.relation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LocationInner({
  data,
  t,
}: {
  data: InvitationData;
  t: TemplateTheme;
}) {
  return (
    <div className="text-center">
      <p
        className="inv-fade text-xl tracking-[0.02em]"
        style={{ fontFamily: t.headingFont }}
      >
        {data.venueName}
      </p>
      {data.venueHall && (
        <p className="inv-fade mt-1.5 text-sm" style={{ color: t.sub }}>
          {data.venueHall}
        </p>
      )}
      <p
        className="inv-fade mx-auto mt-4 max-w-[260px] text-[calc(13px*var(--inv-fs))] leading-6"
        style={{ color: t.sub }}
      >
        {data.venueAddress}
      </p>
      {/* 실제 지도 + 네이버 길찾기 + 주소 복사 */}
      <MapSection
        address={data.venueAddress}
        t={t}
        subway={data.directionsSubway}
        bus={data.directionsBus}
        parking={data.directionsParking}
      />
    </div>
  );
}

// 미리보기 전용: 사진이 없을 때 보여줄 빈 공백 슬롯
function GalleryPlaceholder({
  count,
  t,
  rounded,
}: {
  count: number;
  t: TemplateTheme;
  rounded: string;
}) {
  const rest = Math.max(count - 1, 0);
  const box = "flex items-center justify-center border border-dashed";
  const style = {
    borderColor: t.line,
    background: t.accentSoft,
    color: t.sub,
  } as const;
  return (
    <div className="space-y-2.5">
      <div className={`${box} aspect-[4/3] w-full ${rounded}`} style={style}>
        <span className="text-xs">사진</span>
      </div>
      {rest > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: rest }).map((_, i) => (
            <div
              key={i}
              className={`${box} aspect-square w-full ${rounded}`}
              style={style}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryInner({
  data,
  t,
  rounded = "rounded-xl",
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  rounded?: string;
  preview?: boolean;
}) {
  const gallery = data.gallery.filter(Boolean);
  if (gallery.length === 0) {
    if (!preview) return null;
    return (
      <>
        <GalleryPlaceholder
          count={Math.max(data.gallery.length, 3)}
          t={t}
          rounded={rounded}
        />
        <p className="mt-4 text-xs" style={{ color: t.sub }}>
          갤러리 사진을 추가하면 여기에 표시돼요
        </p>
      </>
    );
  }
  return (
    <>
      <GalleryAlbum images={gallery} rounded={rounded} />
    </>
  );
}

// 갤러리 섹션 노출 여부: 사진이 있거나, 미리보기 모드
function showGallery(data: InvitationData, preview: boolean) {
  return preview || data.gallery.filter(Boolean).length > 0;
}

// 계좌 섹션 노출 여부 — 축의금을 받지 않는 종류(생일)는 아예 숨긴다
function showAccounts(data: InvitationData) {
  return (
    labelsOf(data).showAccounts &&
    data.accounts.filter((a) => a.number).length > 0
  );
}

function AccountInner({
  data,
  t,
}: {
  data: InvitationData;
  t: TemplateTheme;
}) {
  const accounts = data.accounts.filter((a) => a.number);
  if (accounts.length === 0) return null;
  return (
    <AccountList
      accounts={accounts}
      t={t}
      showSide={labelsOf(data).showPerson2}
    />
  );
}

/* ════════ 라벨/구분선 (템플릿 변형) ════════ */
function Label({
  text,
  t,
  variant,
  index,
}: {
  text: string;
  t: TemplateTheme;
  variant: TemplateId;
  index?: string;
}) {
  // 한글 라벨은 영문 장식 서체(Cormorant)에 글리프가 없어 대체 글꼴로 떨어지고
  // 넓은 자간까지 겹쳐 어색해진다 → 템플릿 서체에 좁은 자간으로 렌더링
  const isKorean = /[가-힣]/.test(text);

  if (variant === "modern") {
    return (
      <div className="inv-fade mb-5 flex items-baseline gap-3">
        {index && (
          <span className="font-cormorant text-base" style={{ color: t.accent }}>
            {index}
          </span>
        )}
        <span
          className={
            isKorean
              ? "text-[calc(15px*var(--inv-fs))] font-medium tracking-[0.12em]"
              : "font-cormorant text-[calc(15px*var(--inv-fs))] font-semibold tracking-[0.3em]"
          }
          style={{
            color: t.ink,
            ...(isKorean ? { fontFamily: t.headingFont } : null),
          }}
        >
          {text}
        </span>
        <span className="h-px flex-1" style={{ background: t.line }} />
      </div>
    );
  }
  // 큼직한 스몰캡 라벨 — 장식 없이 자간과 컬러로만 구분
  return (
    <div className="inv-fade mb-6 text-center">
      <span
        className={
          isKorean
            ? "text-[calc(17px*var(--inv-fs))] tracking-[0.15em]"
            : "font-cormorant text-[calc(16px*var(--inv-fs))] font-medium tracking-[0.45em]"
        }
        style={{
          color: t.accent,
          ...(isKorean ? { fontFamily: t.headingFont } : null),
        }}
      >
        {text}
      </span>
    </div>
  );
}

function Divider({ t, variant }: { t: TemplateTheme; variant: TemplateId }) {
  // 모던은 섹션 제목 옆 라인만으로 구분 — 구간 사이 가로선은 두지 않는다
  if (variant === "modern") return null;
  // 세 가지 모양을 모두 그려 두고, 초대장 루트의 data-divider 값에 따라
  // CSS 가 한 가지만 보이게 한다. 구분선은 35곳에서 쓰여 값을 일일이
  // 넘기는 대신 이 방식을 택했다.
  return (
    <div
      className="inv-divider flex items-center justify-center gap-2.5 py-1"
      aria-hidden
    >
      <span className="inv-divider-line h-px w-6" style={{ background: t.line }} />
      <span
        className="inv-divider-diamond inline-block h-[3px] w-[3px] rotate-45"
        style={{ background: t.accent, opacity: 0.55 }}
      />
      <span
        className="inv-divider-dots text-[10px] leading-none"
        style={{ color: t.accent, opacity: 0.55 }}
      >
        ● ● ●
      </span>
      <span
        className="inv-divider-flower text-[13px] leading-none"
        style={{ color: t.accent, opacity: 0.6 }}
      >
        ❀
      </span>
      <span className="inv-divider-line h-px w-6" style={{ background: t.line }} />
    </div>
  );
}

/* Section: 라벨 + 알맹이 래퍼 */
function Sec({
  label,
  index,
  section,
  t,
  variant,
  children,
}: {
  label: string;
  index?: string;
  // 에디터가 폼 위치에 맞춰 미리보기를 옮길 때 찾는 표식
  section?: string;
  t: TemplateTheme;
  variant: TemplateId;
  children: React.ReactNode;
}) {
  const align = variant === "modern" ? "text-left" : "text-center";
  return (
    <section className={`inv-fade px-8 py-9 ${align}`} data-inv-section={section}>
      <Label text={label} t={t} variant={variant} index={index} />
      {children}
    </section>
  );
}

function NamesAmp({
  data,
  t,
  heartColor,
}: {
  data: InvitationData;
  t: TemplateTheme;
  heartColor?: string;
}) {
  if (!labelsOf(data).showPerson2) {
    return <>{data.groomName}</>;
  }
  return (
    <>
      {data.groomName}
      <span
        className="inv-heartbeat mx-2.5 align-middle text-[0.8em]"
        style={{ color: heartColor ?? t.accent }}
      >
        ♡
      </span>
      {data.brideName}
    </>
  );
}

// 대표 사진 모션 id → CSS 클래스 (부모에 overflow-hidden 필요).
// "none"은 여기에 없다 — 아무 클래스도 붙이지 않으면 그대로 멈춰 있는다.
const MOTION_CLASS: Record<string, string> = {
  zoomin: "inv-kenburns",
  zoomout: "inv-motion-zoomout",
  focus: "inv-motion-focus",
};

function Photo({
  data,
  t,
  className,
  kenburns = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  className: string;
  // true면 선택된 대표 사진 모션 적용 (부모에 overflow-hidden 필요)
  kenburns?: boolean;
}) {
  // 고른 모션에 클래스가 없으면(=없음) 붙이지 않는다
  const motion = kenburns ? (MOTION_CLASS[data.heroMotion] ?? "") : "";
  if (data.mainPhotoUrl)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={data.mainPhotoUrl}
        alt="대표 사진"
        className={`object-cover ${motion} ${className}`}
      />
    );
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ background: t.accentSoft, color: t.sub }}
    >
      <span className="text-sm">대표 사진을 추가해 주세요</span>
    </div>
  );
}

/* ════════ 레이아웃별 디자인 ════════ */

// 1) 클래식 — 사진 위 이름 오버레이, 정통 세로 구성
function ClassicLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  return (
    <>
      <div className="relative overflow-hidden">
        <Photo data={data} t={t} className="h-[520px] w-full" kenburns />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
        <div className="absolute inset-x-0 bottom-0 px-8 pb-11 text-center text-white">
          <p className="inv-hero-in font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.5em] text-white/80">
            {labels.heroKicker}
          </p>
          <h1
            className="inv-hero-in mt-4 text-[calc(1.8rem*var(--inv-fs))] leading-snug tracking-[0.06em]"
            style={{ fontFamily: t.headingFont }}
          >
            <NamesAmp data={data} t={t} heartColor="#e8c878" />
          </h1>
          {p && (
            <p className="whitespace-nowrap inv-hero-in-delay mt-3 font-cormorant text-sm tracking-[0.35em] text-white/80">
              {p.year}. {String(p.month).padStart(2, "0")}.{" "}
              {String(p.day).padStart(2, "0")}. {p.wkEn}
              {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
            </p>
          )}
        </div>
      </div>
      <Sec label="INVITATION" section="greeting" t={t} variant="classic">
        <GreetingInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="classic" />
      <Sec label={labels.sectionCoupleLabel} section="couple" t={t} variant="classic">
        <CoupleInner data={data} t={t} preview={preview} />
      </Sec>
      <Divider t={t} variant="classic" />
      <Sec label="THE DAY" section="date" t={t} variant="classic">
        <DateInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="classic" />
      <Sec label="LOCATION" section="location" t={t} variant="classic">
        <LocationInner data={data} t={t} />
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="classic" />
          <Sec label="GALLERY" section="gallery" t={t} variant="classic">
            <GalleryInner data={data} t={t} preview={preview} />
          </Sec>
        </>
      )}
      {showAccounts(data) && (
        <>
          <Divider t={t} variant="classic" />
          <Sec label="ACCOUNT" section="accounts" t={t} variant="classic">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              {labelsOf(data).accountsLabel}
            </h3>
            <AccountInner data={data} t={t} />
          </Sec>
        </>
      )}
    </>
  );
}

// 2) 모던 — 에디토리얼, 좌측 정렬·대형 숫자·여백
function ModernLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  return (
    <>
      {/* 에디토리얼 헤더 + 풀블리드 사진 */}
      <header className="px-8 pb-4 pt-16">
        <div
          className="inv-hero-in mb-5 h-px w-10"
          style={{ background: t.ink }}
        />
        <p
          className="inv-hero-in font-cormorant text-base font-semibold tracking-[0.45em]"
          style={{ color: t.sub }}
        >
          {labelsOf(data).heroKicker2}
        </p>
        {p && (
          <p
            className="inv-hero-in mt-3 font-cormorant text-[calc(3.2rem*var(--inv-fs))] leading-none tracking-tight"
            style={{ color: t.ink }}
          >
            {p.year}.{String(p.month).padStart(2, "0")}.
            {String(p.day).padStart(2, "0")}
          </p>
        )}
        <p className="inv-hero-in-delay mt-3 text-sm" style={{ color: t.sub }}>
          {p ? `${p.wkEn} · ${time24(data.weddingTime)}` : time24(data.weddingTime)}
        </p>
      </header>
      <div className="overflow-hidden">
        <Photo data={data} t={t} className="aspect-[4/5] w-full" kenburns />
      </div>
      <Sec label="INVITATION" section="greeting" index="01" t={t} variant="modern">
        <GreetingInner data={data} t={t} align="left" />
      </Sec>
      <Divider t={t} variant="modern" />
      <Sec label={labelsOf(data).sectionCoupleLabel} section="couple" index="02" t={t} variant="modern">
        <CoupleInner data={data} t={t} preview={preview} />
      </Sec>
      <Divider t={t} variant="modern" />
      <Sec label="DATE" section="date" index="03" t={t} variant="modern">
        <DateInner data={data} t={t} calendar />
      </Sec>
      <Divider t={t} variant="modern" />
      <Sec label="LOCATION" section="location" index="04" t={t} variant="modern">
        <div className="text-left">
          <p className="text-lg" style={{ fontFamily: t.headingFont }}>
            {data.venueName}
          </p>
          <p className="mt-1.5 text-sm" style={{ color: t.sub }}>
            {data.venueHall}
          </p>
          <p className="mt-3 text-sm" style={{ color: t.ink }}>
            {data.venueAddress}
          </p>
          {/* 실제 지도 + 네이버 길찾기 + 주소 복사 */}
          <MapSection
            address={data.venueAddress}
            t={t}
            square
            subway={data.directionsSubway}
            bus={data.directionsBus}
            parking={data.directionsParking}
          />
        </div>
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="modern" />
          <Sec label="GALLERY" section="gallery" index="05" t={t} variant="modern">
            <GalleryInner data={data} t={t} rounded="rounded-sm" preview={preview} />
          </Sec>
        </>
      )}
      {showAccounts(data) && (
        <>
          <Divider t={t} variant="modern" />
          <Sec label="ACCOUNT" section="accounts" index="06" t={t} variant="modern">
            <AccountInner data={data} t={t} />
          </Sec>
        </>
      )}
    </>
  );
}

// 3) 로맨틱 — 아치형 사진·곡선·하트
function RomanticLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  return (
    <>
      <div
        className="relative overflow-hidden px-8 pt-12 text-center"
        style={{
          background: `linear-gradient(180deg, ${t.accentSoft} 0%, ${t.pageBg} 70%)`,
        }}
      >
        {/* 흩날리는 꽃잎 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[
            { left: "8%", size: 13, dur: 11, delay: 0 },
            { left: "22%", size: 10, dur: 14, delay: 3 },
            { left: "34%", size: 12, dur: 13, delay: 9 },
            { left: "46%", size: 11, dur: 12, delay: 6 },
            { left: "58%", size: 13, dur: 14, delay: 1 },
            { left: "68%", size: 14, dur: 13, delay: 1.5 },
            { left: "84%", size: 10, dur: 15, delay: 4.5 },
            { left: "93%", size: 12, dur: 12, delay: 8 },
          ].map((f, i) => (
            <span
              key={i}
              className="inv-petal"
              style={{
                left: f.left,
                fontSize: f.size,
                color: t.accent,
                opacity: 0,
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.delay}s`,
              }}
            >
              ❀
            </span>
          ))}
        </div>
        <p
          className="inv-hero-in text-3xl"
          style={{ fontFamily: "var(--font-brush)", color: t.accent }}
        >
          {data.category === "wedding" ? "우리, 결혼해요" : labels.heroPhrase}
        </p>
        <div
          className="inv-hero-in mx-auto mt-6 overflow-hidden border-4"
          style={{
            width: "240px",
            height: "315px",
            borderColor: "#fff",
            borderTopLeftRadius: "130px",
            borderTopRightRadius: "130px",
            boxShadow: `0 16px 40px -12px ${t.accent}55`,
          }}
        >
          <Photo data={data} t={t} className="h-full w-full" kenburns />
        </div>
        <h1
          className="inv-hero-in-delay mt-7 text-2xl tracking-wide"
          style={{ fontFamily: t.headingFont }}
        >
          {labels.showPerson2 ? (
            <>
              {data.groomName}
              <span className="inv-heartbeat mx-2" style={{ color: t.accent }}>
                ♡
              </span>
              {data.brideName}
            </>
          ) : (
            data.groomName
          )}
        </h1>
        <div
          className="inv-hero-in-delay mx-auto mt-3 flex items-center justify-center gap-2"
          aria-hidden
        >
          <span className="h-px w-8" style={{ background: t.line }} />
          <span className="text-[calc(9px*var(--inv-fs))]" style={{ color: t.accent }}>
            ❀
          </span>
          <span className="h-px w-8" style={{ background: t.line }} />
        </div>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-2.5 pb-10 font-cormorant text-base tracking-[0.3em]"
            style={{ color: t.sub }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <Sec label="INVITATION" section="greeting" t={t} variant="romantic">
        <GreetingInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="romantic" />
      <Sec label={labels.sectionCoupleLabel} section="couple" t={t} variant="romantic">
        <CoupleInner data={data} t={t} arch preview={preview} />
      </Sec>
      <Divider t={t} variant="romantic" />
      <Sec label="OUR DAY" section="date" t={t} variant="romantic">
        <DateInner data={data} t={t} heart />
      </Sec>
      <Divider t={t} variant="romantic" />
      <Sec label="LOCATION" section="location" t={t} variant="romantic">
        <LocationInner data={data} t={t} />
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="romantic" />
          <Sec label="GALLERY" section="gallery" t={t} variant="romantic">
            <GalleryInner data={data} t={t} rounded="rounded-2xl" preview={preview} />
          </Sec>
        </>
      )}
      {showAccounts(data) && (
        <>
          <Divider t={t} variant="romantic" />
          <Sec label="ACCOUNT" section="accounts" t={t} variant="romantic">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              {labelsOf(data).accountsLabel}
            </h3>
            <AccountInner data={data} t={t} />
          </Sec>
        </>
      )}
    </>
  );
}

// 4) 보타니컬 — 원형 사진·잎 장식·내부 프레임
function BotanicalLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  return (
    <div className="p-3">
      <div
        className="relative border"
        style={{ borderColor: t.line }}
      >
        <div className="px-7 pt-14 text-center">
          <p
            className="inv-hero-in font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.45em]"
            style={{ color: t.accent }}
          >
            {data.category === "wedding" ? "THE MARRIAGE OF" : labels.heroKicker}
          </p>
          <div
            className="inv-hero-in relative mx-auto mt-6 w-fit rounded-full p-1.5"
            style={{ border: `1px solid ${t.line}` }}
          >
            <div
              className="overflow-hidden rounded-full border-4"
              style={{
                width: "256px",
                height: "256px",
                borderColor: t.accentSoft,
              }}
            >
              <Photo data={data} t={t} className="h-full w-full" kenburns />
            </div>
          </div>
          <h1
            className="inv-hero-in-delay mt-7 text-2xl tracking-wide"
            style={{ fontFamily: t.headingFont }}
          >
            <NamesAmp data={data} t={t} />
          </h1>
          {p && (
            <p className="whitespace-nowrap mt-2 pb-2 font-cormorant text-base tracking-widest" style={{ color: t.sub }}>
              {p.year}. {String(p.month).padStart(2, "0")}.{" "}
              {String(p.day).padStart(2, "0")}. {p.wkEn}
              {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
            </p>
          )}
        </div>
        <Sec label="INVITATION" section="greeting" t={t} variant="botanical">
          <GreetingInner data={data} t={t} />
        </Sec>
        <Divider t={t} variant="botanical" />
        <Sec label={labels.sectionCoupleLabel} section="couple" t={t} variant="botanical">
          <CoupleInner data={data} t={t} preview={preview} />
        </Sec>
        <Divider t={t} variant="botanical" />
        <Sec label="THE DAY" section="date" t={t} variant="botanical">
          <DateInner data={data} t={t} />
        </Sec>
        <Divider t={t} variant="botanical" />
        <Sec label="LOCATION" section="location" t={t} variant="botanical">
          <LocationInner data={data} t={t} />
        </Sec>
        {showGallery(data, preview) && (
          <>
            <Divider t={t} variant="botanical" />
            <Sec label="GALLERY" section="gallery" t={t} variant="botanical">
              <GalleryInner data={data} t={t} preview={preview} />
            </Sec>
          </>
        )}
        {showAccounts(data) && (
          <>
            <Divider t={t} variant="botanical" />
            <Sec label="ACCOUNT" section="accounts" t={t} variant="botanical">
              <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
                {labelsOf(data).accountsLabel}
              </h3>
              <AccountInner data={data} t={t} />
            </Sec>
          </>
        )}
      </div>
    </div>
  );
}

// 5) 별빛 — 밤하늘·반짝이는 별·금빛 글로우 (다크 테마)
function StarlightLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  // 별 위치 (고정 배열 — 렌더마다 동일)
  const stars = [
    { left: "6%", top: "8%", size: 3, delay: 0 },
    { left: "16%", top: "22%", size: 2, delay: 0.9 },
    { left: "26%", top: "5%", size: 2.5, delay: 1.7 },
    { left: "38%", top: "15%", size: 2, delay: 0.4 },
    { left: "52%", top: "7%", size: 3, delay: 2.2 },
    { left: "64%", top: "19%", size: 2, delay: 1.2 },
    { left: "76%", top: "9%", size: 2.5, delay: 0.6 },
    { left: "88%", top: "17%", size: 3, delay: 1.9 },
    { left: "10%", top: "42%", size: 2, delay: 2.6 },
    { left: "90%", top: "38%", size: 2, delay: 0.2 },
    { left: "5%", top: "68%", size: 2.5, delay: 1.4 },
    { left: "93%", top: "62%", size: 2.5, delay: 2.1 },
    { left: "20%", top: "85%", size: 2, delay: 0.8 },
    { left: "80%", top: "88%", size: 2, delay: 1.6 },
    { left: "45%", top: "93%", size: 2.5, delay: 2.4 },
  ];
  return (
    <>
      <div className="relative overflow-hidden px-8 pb-16 pt-16 text-center">
        {/* 밤하늘: 반짝이는 별 + 별똥별 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {stars.map((s, i) => (
            <span
              key={i}
              className="inv-twinkle"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                background: "#ffe9a8",
                boxShadow: "0 0 6px 1px rgba(255,233,168,0.7)",
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
          <span className="inv-shoot" style={{ right: "-10%", top: "12%" }} />
          <span
            className="inv-shoot"
            style={{ right: "-4%", top: "40%", animationDelay: "4.5s" }}
          />
        </div>
        <p
          className="inv-hero-in text-2xl"
          style={{ fontFamily: "var(--font-brush)", color: t.accent }}
        >
          {data.category === "wedding" ? "우리, 결혼합니다" : labels.heroPhrase}
        </p>
        <p
          className="inv-hero-in font-cormorant mt-2 text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
          style={{ color: t.sub }}
        >
          {labels.heroKicker}
        </p>
        {/* 금빛 링 + 글로우 사진 */}
        <div
          className="inv-hero-in inv-glow relative mx-auto mt-8 w-fit rounded-full p-2"
          style={{ border: `1px solid ${t.accent}66` }}
        >
          <div
            className="overflow-hidden rounded-full"
            style={{ width: "212px", height: "212px" }}
          >
            <Photo data={data} t={t} className="h-full w-full" kenburns />
          </div>
        </div>
        <h1
          className="inv-hero-in-delay mt-8 text-2xl tracking-wide"
          style={{ fontFamily: t.headingFont, color: t.ink }}
        >
          <NamesAmp data={data} t={t} />
        </h1>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-3 font-cormorant text-base tracking-[0.3em]"
            style={{ color: t.sub }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}. {p.wkEn}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <Sec label="INVITATION" section="greeting" t={t} variant="starlight">
        <GreetingInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="starlight" />
      <Sec label={labels.sectionCoupleLabel} section="couple" t={t} variant="starlight">
        <CoupleInner data={data} t={t} preview={preview} />
      </Sec>
      <Divider t={t} variant="starlight" />
      <Sec label="THE DAY" section="date" t={t} variant="starlight">
        <DateInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="starlight" />
      <Sec label="LOCATION" section="location" t={t} variant="starlight">
        <LocationInner data={data} t={t} />
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="starlight" />
          <Sec label="GALLERY" section="gallery" t={t} variant="starlight">
            <GalleryInner data={data} t={t} rounded="rounded-2xl" preview={preview} />
          </Sec>
        </>
      )}
      {showAccounts(data) && (
        <>
          <Divider t={t} variant="starlight" />
          <Sec label="ACCOUNT" section="accounts" t={t} variant="starlight">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              {labelsOf(data).accountsLabel}
            </h3>
            <AccountInner data={data} t={t} />
          </Sec>
        </>
      )}
    </>
  );
}

// 6) 필름 — 폴라로이드·필름 스트립·레트로 무드
function CinemaLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  return (
    <>
      {/* 필름 화보 히어로 — 이름 + 화보 사진 + 필카 감성 날짜 스탬프 */}
      <div className="px-6 pt-11">
        <div className="flex items-center justify-center gap-5">
          <p
            className="inv-hero-in text-[calc(22px*var(--inv-fs))] leading-tight"
            style={{ fontFamily: t.headingFont, color: t.ink }}
          >
            {data.groomName}
          </p>
          {labels.showPerson2 && (
            <>
              <span
                className="font-cormorant text-base italic"
                style={{ color: t.accent }}
              >
                and
              </span>
              <p
                className="inv-hero-in text-[calc(22px*var(--inv-fs))] leading-tight"
                style={{ fontFamily: t.headingFont, color: t.ink }}
              >
                {data.brideName}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="relative mt-8 overflow-hidden">
        <Photo data={data} t={t} className="aspect-[3/4.2] w-full" kenburns />
        {/* 세로쓰기 캡션 — 화보 무드 (사진 위 가독성용 검정+흰색 후광) */}
        {data.venueName && (
          <p
            className="absolute left-3.5 top-5 text-[calc(12.5px*var(--inv-fs))] tracking-[0.25em] text-black"
            style={{
              writingMode: "vertical-rl",
              textShadow:
                "0 1px 6px rgba(255,255,255,0.85), 0 0 10px rgba(255,255,255,0.6)",
            }}
          >
            {data.venueName} {data.venueHall}
          </p>
        )}
        {p && (
          <p
            className="absolute right-3.5 top-5 text-[calc(12.5px*var(--inv-fs))] tracking-[0.28em] text-black"
            style={{
              writingMode: "vertical-rl",
              textShadow:
                "0 1px 6px rgba(255,255,255,0.85), 0 0 10px rgba(255,255,255,0.6)",
            }}
          >
            {p.year}.{String(p.month).padStart(2, "0")}.
            {String(p.day).padStart(2, "0")} {time24(data.weddingTime)}
          </p>
        )}
        {/* 필름 카메라 날짜 스탬프 */}
        {p && (
          <span
            aria-hidden
            className="absolute bottom-4 right-4 text-[calc(13px*var(--inv-fs))] tracking-[0.18em]"
            style={{
              fontFamily: "monospace",
              color: "#ffb03a",
              textShadow: "0 0 8px rgba(255,150,40,0.8)",
            }}
          >
            &apos;{String(p.year).slice(2)} {String(p.month).padStart(2, "0")}{" "}
            {String(p.day).padStart(2, "0")}
          </span>
        )}
      </div>
      <Sec label="INVITATION" section="greeting" t={t} variant="cinema">
        <GreetingInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="cinema" />
      <Sec label={labels.sectionCoupleLabel} section="couple" t={t} variant="cinema">
        <CoupleInner data={data} t={t} preview={preview} />
      </Sec>
      <Divider t={t} variant="cinema" />
      <Sec label="THE DAY" section="date" t={t} variant="cinema">
        <DateInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="cinema" />
      <Sec label="LOCATION" section="location" t={t} variant="cinema">
        <LocationInner data={data} t={t} />
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="cinema" />
          <Sec label="GALLERY" section="gallery" t={t} variant="cinema">
            <GalleryInner data={data} t={t} rounded="rounded-sm" preview={preview} />
          </Sec>
        </>
      )}
      {showAccounts(data) && (
        <>
          <Divider t={t} variant="cinema" />
          <Sec label="ACCOUNT" section="accounts" t={t} variant="cinema">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              {labelsOf(data).accountsLabel}
            </h3>
            <AccountInner data={data} t={t} />
          </Sec>
        </>
      )}
    </>
  );
}

/* ════════ 카테고리 전용 템플릿 공통 본문 ════════
   (인사말 → 주인공 → 날짜 → 장소 → 갤러리 → 계좌) */
function CommonBody({
  data,
  t,
  variant,
  preview = false,
  arch = false,
  heart = false,
  rounded = "rounded-xl",
}: {
  data: InvitationData;
  t: TemplateTheme;
  variant: TemplateId;
  preview?: boolean;
  arch?: boolean;
  heart?: boolean;
  rounded?: string;
}) {
  const labels = labelsOf(data);
  return (
    <>
      <Sec label="INVITATION" section="greeting" t={t} variant={variant}>
        <GreetingInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant={variant} />
      <Sec label={labels.sectionCoupleLabel} section="couple" t={t} variant={variant}>
        <CoupleInner data={data} t={t} arch={arch} preview={preview} />
      </Sec>
      <Divider t={t} variant={variant} />
      <Sec label="THE DAY" section="date" t={t} variant={variant}>
        <DateInner data={data} t={t} heart={heart} />
      </Sec>
      <Divider t={t} variant={variant} />
      <Sec label="LOCATION" section="location" t={t} variant={variant}>
        <LocationInner data={data} t={t} />
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant={variant} />
          <Sec label="GALLERY" section="gallery" t={t} variant={variant}>
            <GalleryInner data={data} t={t} rounded={rounded} preview={preview} />
          </Sec>
        </>
      )}
      {showAccounts(data) && (
        <>
          <Divider t={t} variant={variant} />
          <Sec label="ACCOUNT" section="accounts" t={t} variant={variant}>
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              {labels.accountsLabel}
            </h3>
            <AccountInner data={data} t={t} />
          </Sec>
        </>
      )}
    </>
  );
}

/* ════════ 돌잔치 전용 레이아웃 ════════ */

// 돌1) 곰돌이 — 포근한 베이지, 풍선과 곰인형이 함께하는 첫 생일
function DolBearLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  return (
    <>
      <div
        className="relative overflow-hidden px-8 pb-14 pt-14 text-center"
        style={{
          background: `linear-gradient(180deg, ${t.accentSoft} 0%, ${t.pageBg} 85%)`,
        }}
      >
        {/* 두둥실 떠오르는 풍선 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[
            { left: "6%", size: 24, dur: 11, delay: 0 },
            { left: "18%", size: 18, dur: 13, delay: 4 },
            { left: "76%", size: 22, dur: 12, delay: 2 },
            { left: "88%", size: 17, dur: 14, delay: 6 },
            { left: "48%", size: 15, dur: 15, delay: 8 },
          ].map((b, i) => (
            <span
              key={i}
              className="inv-balloon"
              style={{
                left: b.left,
                fontSize: b.size,
                opacity: 0,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
              }}
            >
              🎈
            </span>
          ))}
        </div>
        <p
          className="inv-hero-in font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
          style={{ color: t.accent }}
        >
          {labels.heroKicker}
        </p>
        <p className="inv-hero-in mt-4 text-4xl" aria-hidden>
          <span className="inv-bob">🧸</span>
        </p>
        {/* 흰 테두리 + 점선 링 동그란 사진 */}
        <div
          className="inv-hero-in mx-auto mt-5 rounded-full border border-dashed p-2.5"
          style={{ borderColor: `${t.accent}77`, width: "fit-content" }}
        >
          <div
            className="overflow-hidden rounded-full border-[6px]"
            style={{
              width: "216px",
              height: "216px",
              borderColor: "#fff",
              boxShadow: `0 16px 34px -14px ${t.accent}66`,
            }}
          >
            <Photo data={data} t={t} className="h-full w-full" kenburns />
          </div>
        </div>
        <h1
          className="inv-hero-in-delay mt-7 text-[calc(1.7rem*var(--inv-fs))] tracking-wide"
          style={{ fontFamily: t.headingFont, color: t.ink }}
        >
          {data.groomName}
        </h1>
        <p
          className="inv-hero-in-delay mt-1.5 text-[calc(15px*var(--inv-fs))]"
          style={{ color: t.sub }}
        >
          우리 아이의 {labels.dolOccasion}
        </p>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-4 inline-block rounded-full px-5 py-1.5 font-cormorant text-sm tracking-[0.25em]"
            style={{ background: "#fff", color: t.accent }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="dolbear" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 돌2) 구름 위 아기 — 파스텔 하늘·무지개·흐르는 구름
function DolCloudLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  const stars = [
    { left: "12%", top: "30%", size: 4, delay: 0 },
    { left: "85%", top: "24%", size: 3, delay: 1.1 },
    { left: "22%", top: "62%", size: 3, delay: 2 },
    { left: "78%", top: "58%", size: 4, delay: 0.6 },
    { left: "50%", top: "12%", size: 3, delay: 1.6 },
  ];
  return (
    <>
      <div
        className="relative overflow-hidden px-8 pb-14 pt-12 text-center"
        style={{
          background: `linear-gradient(180deg, ${t.accentSoft} 0%, #fdf3f7 60%, ${t.pageBg} 100%)`,
        }}
      >
        {/* 흐르는 구름 + 반짝이는 별 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[
            { top: "6%", size: 34, dur: 26, delay: -6 },
            { top: "16%", size: 24, dur: 32, delay: -20 },
            { top: "40%", size: 28, dur: 29, delay: -12 },
          ].map((c, i) => (
            <span
              key={i}
              className="inv-cloud"
              style={{
                top: c.top,
                left: 0,
                fontSize: c.size,
                opacity: 0,
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
              }}
            >
              ☁️
            </span>
          ))}
          {stars.map((s, i) => (
            <span
              key={`s${i}`}
              className="inv-twinkle"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                background: "#ffd66e",
                boxShadow: "0 0 6px 1px rgba(255,214,110,0.8)",
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>
        <p
          className="inv-hero-in font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
          style={{ color: t.accent }}
        >
          {labels.heroKicker}
        </p>
        {/* 무지개 아치 */}
        <svg
          viewBox="0 0 120 62"
          className="inv-hero-in mx-auto mt-4 w-36"
          aria-hidden
        >
          {["#f7a6b8", "#f8ce7b", "#a8d8a0", "#8fc3ef"].map((c, i) => (
            <path
              key={c}
              d={`M ${10 + i * 7} 60 A ${50 - i * 7} ${50 - i * 7} 0 0 1 ${110 - i * 7} 60`}
              fill="none"
              stroke={c}
              strokeWidth={6}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div
          className="inv-hero-in mx-auto -mt-9 overflow-hidden rounded-full border-[6px]"
          style={{
            width: "200px",
            height: "200px",
            borderColor: "#fff",
            boxShadow: `0 16px 34px -14px ${t.accent}66`,
          }}
        >
          <Photo data={data} t={t} className="h-full w-full" kenburns />
        </div>
        <h1
          className="inv-hero-in-delay mt-7 text-[calc(1.7rem*var(--inv-fs))] tracking-wide"
          style={{ fontFamily: t.headingFont, color: t.ink }}
        >
          {data.groomName}
        </h1>
        <p
          className="inv-hero-in-delay mt-2 font-cormorant text-[calc(14px*var(--inv-fs))] tracking-[0.3em]"
          style={{ color: t.sub }}
        >
          {labels.dolEnglish}
        </p>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-3.5 font-cormorant text-base tracking-[0.3em]"
            style={{ color: t.sub }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="dolcloud" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 돌3) 색동 — 색동 저고리 무드의 전통 돌잔치
function DolHanbokLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  const saekdong =
    "linear-gradient(90deg, #3f6b8f 0 20%, #e5a13d 20% 40%, #c25b4e 40% 60%, #6f8c6a 60% 80%, #e9c8d8 80% 100%)";
  const obang = ["#3f6b8f", "#e5a13d", "#c25b4e", "#6f8c6a", "#54382f"];
  return (
    <>
      {/* 색동 띠 */}
      <div className="h-3 w-full" style={{ background: saekdong }} aria-hidden />
      <div className="px-8 pb-12 pt-12 text-center">
        <p
          className="inv-hero-in text-[calc(13px*var(--inv-fs))] tracking-[0.35em]"
          style={{ color: t.accent, fontFamily: t.headingFont }}
        >
          {labels.dolEvent}에 초대합니다
        </p>
        {/* 전통 이중 프레임 사진 */}
        <div
          className="inv-hero-in mx-auto mt-7 p-2"
          style={{ border: `1px solid ${t.line}`, width: "fit-content" }}
        >
          <div
            className="overflow-hidden"
            style={{
              width: "228px",
              height: "300px",
              border: `3px solid ${t.accent}`,
              borderRadius: "4px",
            }}
          >
            <Photo data={data} t={t} className="h-full w-full" kenburns />
          </div>
        </div>
        {/* 오방색 점 구분 장식 */}
        <div
          className="inv-hero-in-delay mt-6 flex items-center justify-center gap-2"
          aria-hidden
        >
          {obang.map((c) => (
            <span
              key={c}
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: c }}
            />
          ))}
        </div>
        <h1
          className="inv-hero-in-delay mt-4 text-[calc(1.7rem*var(--inv-fs))] tracking-[0.1em]"
          style={{ fontFamily: t.headingFont, color: t.ink }}
        >
          {data.groomName}
        </h1>
        <p
          className="inv-hero-in-delay mt-1.5 text-[calc(14px*var(--inv-fs))]"
          style={{ color: t.sub }}
        >
          {labels.dolMilestone}을 맞이했습니다
        </p>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-3 text-[calc(15px*var(--inv-fs))] tracking-[0.2em]"
            style={{ color: t.sub, fontFamily: t.headingFont }}
          >
            {p.year}년 {p.month}월 {p.day}일
            {data.weddingTime && ` · ${data.weddingTime}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="dolhanbok" preview={preview} />
    </>
  );
}

/* ════════ 칠순 · 팔순 전용 레이아웃 ════════ */

// 수1) 수연 — 자주빛과 금빛의 격조 있는 수연례
function SeniorGoldLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  const gold = "#d8b46a";
  return (
    <>
      <div
        className="relative overflow-hidden px-8 pb-14 pt-12 text-center"
        style={{
          background: "linear-gradient(180deg, #5a2530 0%, #6d2e3b 100%)",
        }}
      >
        {/* 상하 금빛 이중 헤어라인 */}
        <div className="absolute inset-x-6 top-4" aria-hidden>
          <div className="h-px" style={{ background: `${gold}88` }} />
          <div className="mt-1 h-px" style={{ background: `${gold}44` }} />
        </div>
        <div className="absolute inset-x-6 bottom-4" aria-hidden>
          <div className="h-px" style={{ background: `${gold}44` }} />
          <div className="mt-1 h-px" style={{ background: `${gold}88` }} />
        </div>
        <p className="inv-hero-in mt-2 text-2xl" aria-hidden>
          <span className="inv-sway" style={{ color: gold }}>
            ✿
          </span>
        </p>
        <p
          className="inv-hero-in mt-3 font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
          style={{ color: `${gold}cc` }}
        >
          {labels.heroKicker}
        </p>
        <h1
          className="inv-hero-in mt-4 text-[calc(1.55rem*var(--inv-fs))] tracking-[0.25em]"
          style={{ fontFamily: t.headingFont, color: gold }}
        >
          {labels.seniorLabel}연에 모십니다
        </h1>
        {/* 금빛 이중 링 사진 */}
        <div
          className="inv-hero-in mx-auto mt-7 rounded-full p-1"
          style={{ border: `1px solid ${gold}99`, width: "fit-content" }}
        >
          <div
            className="overflow-hidden rounded-full border-2"
            style={{ width: "208px", height: "208px", borderColor: gold }}
          >
            <Photo data={data} t={t} className="h-full w-full" kenburns />
          </div>
        </div>
        <p
          className="inv-hero-in-delay mt-7 text-[calc(1.5rem*var(--inv-fs))] tracking-[0.15em]"
          style={{ fontFamily: t.headingFont, color: "#f6ead3" }}
        >
          {data.groomName}
        </p>
        {p && (
          <p
            className="inv-hero-in-delay mb-3 mt-3 text-sm tracking-[0.1em] whitespace-nowrap"
            style={{ color: `${gold}bb` }}
          >
            {p.year}년 {p.month}월 {p.day}일 {p.wkKo}요일
            {data.weddingTime && ` · ${data.weddingTime}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="seniorgold" preview={preview} />
    </>
  );
}

// 수2) 모란 — 탐스러운 모란 꽃잎이 흩날리는 화사한 잔치
function SeniorBloomLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  return (
    <>
      <div
        className="relative overflow-hidden px-8 pb-12 pt-12 text-center"
        style={{
          background: `linear-gradient(180deg, ${t.accentSoft} 0%, ${t.pageBg} 75%)`,
        }}
      >
        {/* 흩날리는 모란 꽃잎 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[
            { left: "10%", size: 14, dur: 12, delay: 0 },
            { left: "28%", size: 11, dur: 14, delay: 5 },
            { left: "52%", size: 12, dur: 13, delay: 9 },
            { left: "72%", size: 15, dur: 12, delay: 2 },
            { left: "90%", size: 11, dur: 15, delay: 6 },
          ].map((f, i) => (
            <span
              key={i}
              className="inv-petal"
              style={{
                left: f.left,
                fontSize: f.size,
                color: t.accent,
                opacity: 0,
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.delay}s`,
              }}
            >
              ✿
            </span>
          ))}
        </div>
        <p
          className="inv-hero-in text-[calc(26px*var(--inv-fs))]"
          style={{ fontFamily: "var(--font-brush)", color: t.accent }}
        >
          {labels.heroPhrase}
        </p>
        {/* 아치형 사진 + 안쪽 헤어라인 */}
        <div
          className="inv-hero-in relative mx-auto mt-6 overflow-hidden"
          style={{
            width: "236px",
            height: "310px",
            borderTopLeftRadius: "120px",
            borderTopRightRadius: "120px",
            borderBottomLeftRadius: "10px",
            borderBottomRightRadius: "10px",
            boxShadow: `0 18px 40px -14px ${t.accent}55`,
          }}
        >
          <Photo data={data} t={t} className="h-full w-full" kenburns />
          <div
            className="pointer-events-none absolute inset-2 border border-white/70"
            style={{
              borderTopLeftRadius: "112px",
              borderTopRightRadius: "112px",
              borderBottomLeftRadius: "6px",
              borderBottomRightRadius: "6px",
            }}
            aria-hidden
          />
        </div>
        <h1
          className="inv-hero-in-delay mt-7 text-[calc(1.6rem*var(--inv-fs))] tracking-[0.12em]"
          style={{ fontFamily: t.headingFont, color: t.ink }}
        >
          {data.groomName}
        </h1>
        <div
          className="inv-hero-in-delay mx-auto mt-3 flex items-center justify-center gap-2"
          aria-hidden
        >
          <span className="h-px w-8" style={{ background: t.line }} />
          <span className="text-[calc(10px*var(--inv-fs))]" style={{ color: t.accent }}>
            ✿
          </span>
          <span className="h-px w-8" style={{ background: t.line }} />
        </div>
        {p && (
          <p
            className="inv-hero-in-delay mt-2.5 text-sm tracking-[0.1em] whitespace-nowrap"
            style={{ color: t.sub }}
          >
            {p.year}년 {p.month}월 {p.day}일 {p.wkKo}요일
            {data.weddingTime && ` · ${data.weddingTime}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="seniorbloom" arch preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 수3) 송학 — 소나무·학처럼 푸른 장수 기원 (딥 그린 다크 히어로)
function SeniorPineLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  const gold = t.accent;
  const sparks = [
    { left: "10%", top: "14%", size: 3, delay: 0 },
    { left: "24%", top: "8%", size: 2, delay: 1.2 },
    { left: "76%", top: "10%", size: 2.5, delay: 0.5 },
    { left: "90%", top: "20%", size: 3, delay: 1.8 },
    { left: "8%", top: "62%", size: 2, delay: 2.3 },
    { left: "92%", top: "70%", size: 2.5, delay: 0.9 },
  ];
  return (
    <>
      <div
        className="relative overflow-hidden px-8 pb-14 pt-14 text-center"
        style={{
          background: "linear-gradient(180deg, #16261f 0%, #24382e 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {sparks.map((s, i) => (
            <span
              key={i}
              className="inv-twinkle"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                background: "#e9cf8f",
                boxShadow: "0 0 6px 1px rgba(233,207,143,0.7)",
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>
        <p
          className="inv-hero-in text-[calc(26px*var(--inv-fs))] tracking-[0.15em]"
          style={{ fontFamily: t.headingFont, color: gold }}
        >
          {labels.seniorHanja}
        </p>
        <p
          className="inv-hero-in mt-2 font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
          style={{ color: "#9db4a6" }}
        >
          LONG LIFE &amp; HAPPINESS
        </p>
        <h1
          className="inv-hero-in mt-4 text-[calc(1.45rem*var(--inv-fs))] tracking-[0.2em]"
          style={{ fontFamily: t.headingFont, color: "#eef3ea" }}
        >
          장수를 기원하는 자리
        </h1>
        {/* 금빛 글로우 링 사진 */}
        <div
          className="inv-hero-in inv-glow mx-auto mt-8 rounded-full p-1.5"
          style={{ border: `1px solid ${gold}88`, width: "fit-content" }}
        >
          <div
            className="overflow-hidden rounded-full"
            style={{ width: "206px", height: "206px" }}
          >
            <Photo data={data} t={t} className="h-full w-full" kenburns />
          </div>
        </div>
        <p
          className="inv-hero-in-delay mt-7 text-[calc(1.5rem*var(--inv-fs))] tracking-[0.15em]"
          style={{ fontFamily: t.headingFont, color: gold }}
        >
          {data.groomName}
        </p>
        {p && (
          <p
            className="inv-hero-in-delay mt-3 text-sm tracking-[0.1em] whitespace-nowrap"
            style={{ color: "#9db4a6" }}
          >
            {p.year}년 {p.month}월 {p.day}일 {p.wkKo}요일
            {data.weddingTime && ` · ${data.weddingTime}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="seniorpine" preview={preview} />
    </>
  );
}

/* ════════ 생일 전용 레이아웃 ════════ */

// 생1) 파티팝 — 알록달록 컨페티가 쏟아지는 파티
function BdayPopLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const confetti = [
    { left: "5%", color: "#f26d5f", dur: 6, delay: 0 },
    { left: "15%", color: "#ffd166", dur: 7.5, delay: 2 },
    { left: "27%", color: "#5fb7c9", dur: 6.5, delay: 4 },
    { left: "38%", color: "#9b8cf2", dur: 8, delay: 1 },
    { left: "50%", color: "#f2a3c0", dur: 6, delay: 3 },
    { left: "62%", color: "#ffd166", dur: 7, delay: 5 },
    { left: "73%", color: "#f26d5f", dur: 6.8, delay: 0.5 },
    { left: "84%", color: "#5fb7c9", dur: 7.6, delay: 2.5 },
    { left: "94%", color: "#9b8cf2", dur: 6.2, delay: 4.5 },
  ];
  return (
    <>
      <div className="relative overflow-hidden px-8 pb-12 pt-14 text-center">
        {/* 쏟아지는 컨페티 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {confetti.map((c, i) => (
            <span
              key={i}
              className="inv-confetti"
              style={{
                left: c.left,
                width: 7,
                height: 12,
                borderRadius: 2,
                background: c.color,
                opacity: 0,
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
        </div>
        <p className="inv-hero-in text-3xl" aria-hidden>
          <span className="inv-bob">🎉</span>
        </p>
        <p
          className="inv-hero-in mt-3 font-cormorant text-[calc(13px*var(--inv-fs))] font-semibold tracking-[0.45em]"
          style={{ color: t.accent }}
        >
          HAPPY BIRTHDAY
        </p>
        {/* 상단 문구 — 비우면 표시하지 않는다 */}
        {data.heroTitle.trim() && (
          <h1
            className="inv-hero-in mt-3 text-[calc(2.1rem*var(--inv-fs))] font-extrabold tracking-tight"
            style={{ fontFamily: titleFontOf(data) || undefined, color: t.ink }}
          >
            {data.heroTitle}
          </h1>
        )}
        {/* 살짝 기울어진 폴라로이드풍 사진 */}
        <div
          className="inv-hero-in mx-auto mt-7 -rotate-2 overflow-hidden rounded-[26px] border-[6px]"
          style={{
            width: "248px",
            height: "300px",
            borderColor: "#fff",
            boxShadow: `0 20px 44px -16px ${t.accent}77`,
          }}
        >
          <Photo data={data} t={t} className="h-full w-full" kenburns />
        </div>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-7 inline-block rounded-full px-6 py-2 text-sm font-semibold tracking-[0.15em]"
            style={{ background: t.accentSoft, color: t.accent }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")} {p.wkEn}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="bdaypop" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 생2) 네온 나이트 — 네온사인이 깜빡이는 다크 파티
function BdayNeonLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const stars = [
    { left: "8%", top: "10%", size: 3, delay: 0, color: "#5fd9e7" },
    { left: "20%", top: "26%", size: 2, delay: 1.3, color: "#ff5fa2" },
    { left: "80%", top: "14%", size: 2.5, delay: 0.4, color: "#5fd9e7" },
    { left: "92%", top: "30%", size: 3, delay: 1.9, color: "#ff5fa2" },
    { left: "12%", top: "68%", size: 2, delay: 2.4, color: "#ff5fa2" },
    { left: "88%", top: "74%", size: 2.5, delay: 0.8, color: "#5fd9e7" },
  ];
  return (
    <>
      <div className="relative overflow-hidden px-8 pb-14 pt-16 text-center">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {stars.map((s, i) => (
            <span
              key={i}
              className="inv-twinkle"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                background: s.color,
                boxShadow: `0 0 6px 1px ${s.color}`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>
        <p
          className="inv-hero-in inv-neon font-cormorant text-[calc(22px*var(--inv-fs))] font-semibold tracking-[0.4em]"
          style={{ color: "#ff5fa2" }}
        >
          HAPPY
        </p>
        <p
          className="inv-hero-in inv-neon font-cormorant text-[calc(22px*var(--inv-fs))] font-semibold tracking-[0.4em]"
          style={{ color: "#5fd9e7", animationDelay: "0.9s" }}
        >
          BIRTHDAY
        </p>
        {/* 네온 링 사진 */}
        <div
          className="inv-hero-in inv-neon-ring mx-auto mt-8 rounded-full p-1"
          style={{ border: "1px solid rgba(255,95,162,0.7)", width: "fit-content" }}
        >
          <div
            className="overflow-hidden rounded-full"
            style={{ width: "204px", height: "204px" }}
          >
            <Photo data={data} t={t} className="h-full w-full" kenburns />
          </div>
        </div>
        {/* 상단 문구 — 비우면 표시하지 않는다 */}
        {data.heroTitle.trim() && (
          <h1
            className="inv-hero-in-delay mt-8 text-[calc(1.8rem*var(--inv-fs))] font-bold tracking-wide"
            style={{ fontFamily: titleFontOf(data) || undefined, color: t.ink }}
          >
            {data.heroTitle}
          </h1>
        )}
        {p && (
          <p
            className={`whitespace-nowrap inv-hero-in-delay ${heroGap(data, "mt-3", "mt-9")} text-sm tracking-[0.3em]`}
            style={{ color: t.sub, fontFamily: "monospace" }}
          >
            {p.year}.{String(p.month).padStart(2, "0")}.
            {String(p.day).padStart(2, "0")} {p.wkEn}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="bdayneon" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 생3) 미니멀 데이 — 큼직한 타이포와 여백, 알약형 사진
function BdayMinimalLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  return (
    <>
      <div className="px-8 pb-12 pt-16 text-center">
        <div
          className="inv-hero-in mx-auto h-px w-10"
          style={{ background: t.accent }}
          aria-hidden
        />
        <p
          className="inv-hero-in mt-5 font-cormorant text-[calc(11px*var(--inv-fs))] font-semibold tracking-[0.5em]"
          style={{ color: t.accent }}
        >
          BIRTHDAY INVITATION
        </p>
        {/* 상단 문구 — 비우면 표시하지 않는다 */}
        {data.heroTitle.trim() && (
          <h1
            className="inv-hero-in mt-4 text-[calc(2.4rem*var(--inv-fs))] font-extrabold leading-tight tracking-tight"
            style={{ fontFamily: titleFontOf(data) || undefined, color: t.ink }}
          >
            {data.heroTitle}
          </h1>
        )}
        {p && (
          <p
            className={`whitespace-nowrap inv-hero-in ${heroGap(data, "mt-2", "mt-6")} font-cormorant text-xl tracking-[0.2em]`}
            style={{ color: t.sub }}
          >
            {p.year}.{String(p.month).padStart(2, "0")}.
            {String(p.day).padStart(2, "0")}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
        {/* 알약(캡슐)형 사진 */}
        <div
          className="inv-hero-in-delay mx-auto mt-8 overflow-hidden"
          style={{
            width: "224px",
            height: "324px",
            borderRadius: "999px",
            outline: `1px solid ${t.line}`,
            outlineOffset: "10px",
            boxShadow: `0 18px 40px -16px ${t.accent}55`,
          }}
        >
          <Photo data={data} t={t} className="h-full w-full" kenburns />
        </div>
        <p
          className="inv-hero-in-delay mt-9 text-[calc(15px*var(--inv-fs))]"
          style={{ color: t.sub }}
        >
          소중한 하루, 함께 축하해 주세요
        </p>
      </div>
      <CommonBody data={data} t={t} variant="bdayminimal" preview={preview} rounded="rounded-sm" />
    </>
  );
}

/* ════════ 공용 밤하늘 별밭 ════════ */
const NIGHT_STARS = [
  { left: "6%", top: "8%", size: 3, delay: 0 },
  { left: "16%", top: "22%", size: 2, delay: 0.9 },
  { left: "26%", top: "5%", size: 2.5, delay: 1.7 },
  { left: "38%", top: "15%", size: 2, delay: 0.4 },
  { left: "52%", top: "7%", size: 3, delay: 2.2 },
  { left: "64%", top: "19%", size: 2, delay: 1.2 },
  { left: "76%", top: "9%", size: 2.5, delay: 0.6 },
  { left: "88%", top: "17%", size: 3, delay: 1.9 },
  { left: "10%", top: "42%", size: 2, delay: 2.6 },
  { left: "90%", top: "38%", size: 2, delay: 0.2 },
  { left: "5%", top: "68%", size: 2.5, delay: 1.4 },
  { left: "93%", top: "62%", size: 2.5, delay: 2.1 },
  { left: "20%", top: "85%", size: 2, delay: 0.8 },
  { left: "80%", top: "88%", size: 2, delay: 1.6 },
  { left: "45%", top: "93%", size: 2.5, delay: 2.4 },
];

function NightSky({ shooting = true }: { shooting?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {NIGHT_STARS.map((s, i) => (
        <span
          key={i}
          className="inv-twinkle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: "#ffe9a8",
            boxShadow: "0 0 6px 1px rgba(255,233,168,0.7)",
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {shooting && (
        <>
          <span className="inv-shoot" style={{ right: "-10%", top: "12%" }} />
          <span
            className="inv-shoot"
            style={{ right: "-4%", top: "40%", animationDelay: "4.5s" }}
          />
        </>
      )}
    </div>
  );
}

/* 밤하늘 계열 공용 히어로 — 문구만 바꿔 재사용 (별빛 3종) */
function StarHero({
  data,
  t,
  phrase,
  kicker,
  sub,
  title,
}: {
  data: InvitationData;
  t: TemplateTheme;
  phrase: string;
  kicker: string;
  sub?: string;
  // 넘기지 않으면 주인공 이름을 쓴다. 빈 문자열을 넘기면 아무것도 안 나온다
  title?: string;
}) {
  const heading = title ?? data.groomName;
  const p = dateParts(data.weddingDate);
  return (
    <div className="relative overflow-hidden px-8 pb-12 pt-14 text-center">
      <NightSky />
      <p
        className="inv-hero-in text-2xl"
        style={{ fontFamily: "var(--font-brush)", color: t.accent }}
      >
        {phrase}
      </p>
      <p
        className="inv-hero-in font-cormorant mt-2 text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
        style={{ color: t.sub }}
      >
        {kicker}
      </p>
      <div
        className="inv-hero-in inv-glow relative mx-auto mt-7 w-fit rounded-full p-2"
        style={{ border: `1px solid ${t.accent}66` }}
      >
        <div
          className="overflow-hidden rounded-full"
          style={{ width: "212px", height: "212px" }}
        >
          <Photo data={data} t={t} className="h-full w-full" kenburns />
        </div>
      </div>
      {heading && (
        <h1
          className="inv-hero-in-delay mt-7 text-2xl tracking-wide"
          style={{ fontFamily: titleFontOf(data) || t.headingFont, color: t.ink }}
        >
          {heading}
        </h1>
      )}
      {sub && (
        <p
          className={`inv-hero-in-delay ${heading ? "mt-1.5" : "mt-8"} text-[calc(14px*var(--inv-fs))]`}
          style={{ color: t.sub }}
        >
          {sub}
        </p>
      )}
      {p && (
        <p
          className="whitespace-nowrap inv-hero-in-delay mt-3 font-cormorant text-base tracking-[0.3em]"
          style={{ color: t.sub }}
        >
          {p.year}. {String(p.month).padStart(2, "0")}.{" "}
          {String(p.day).padStart(2, "0")}. {p.wkEn}
          {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
        </p>
      )}
    </div>
  );
}

// 돌4) 아기별 — 밤하늘에 찾아온 작은 별
function DolStarLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const labels = labelsOf(data);
  return (
    <>
      <StarHero
        data={data}
        t={t}
        phrase="우리 집에 온 작은 별"
        kicker={labels.heroKicker}
        sub={`${labels.dolOccasion}에 초대해요`}
      />
      <CommonBody data={data} t={t} variant="dolstar" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 돌5) 꼬마정원 — 새싹과 들꽃이 돋아나는 연둣빛
function DolGardenLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  return (
    <>
      <div
        className="relative overflow-hidden px-8 pb-12 pt-12 text-center"
        style={{
          background: `linear-gradient(180deg, ${t.accentSoft} 0%, ${t.pageBg} 80%)`,
        }}
      >
        {/* 살랑이는 잎사귀 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span
            className="inv-sway absolute text-2xl"
            style={{ left: "7%", top: "14%" }}
          >
            🌿
          </span>
          <span
            className="inv-sway absolute text-xl"
            style={{ right: "8%", top: "22%", animationDelay: "1.2s" }}
          >
            🌱
          </span>
          <span
            className="inv-sway absolute text-lg"
            style={{ left: "12%", bottom: "16%", animationDelay: "2s" }}
          >
            🍃
          </span>
        </div>
        <p
          className="inv-hero-in font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
          style={{ color: t.accent }}
        >
          {labels.heroKicker}
        </p>
        <p
          className="inv-hero-in mt-3 text-[calc(15px*var(--inv-fs))] tracking-[0.1em]"
          style={{ color: t.sub }}
        >
          작은 새싹이 자라 첫 봄을 맞았어요
        </p>
        {/* 아치형 사진 + 안쪽 헤어라인 */}
        <div
          className="inv-hero-in relative mx-auto mt-6 overflow-hidden"
          style={{
            width: "230px",
            height: "300px",
            borderTopLeftRadius: "115px",
            borderTopRightRadius: "115px",
            borderBottomLeftRadius: "12px",
            borderBottomRightRadius: "12px",
            boxShadow: `0 16px 36px -14px ${t.accent}66`,
          }}
        >
          <Photo data={data} t={t} className="h-full w-full" kenburns />
          <div
            className="pointer-events-none absolute inset-2 border border-white/70"
            style={{
              borderTopLeftRadius: "108px",
              borderTopRightRadius: "108px",
              borderBottomLeftRadius: "8px",
              borderBottomRightRadius: "8px",
            }}
            aria-hidden
          />
        </div>
        <h1
          className="inv-hero-in-delay mt-6 text-[calc(1.7rem*var(--inv-fs))] tracking-wide"
          style={{ fontFamily: t.headingFont, color: t.ink }}
        >
          {data.groomName}
        </h1>
        <div
          className="inv-hero-in-delay mx-auto mt-2.5 flex items-center justify-center gap-2"
          aria-hidden
        >
          <span className="h-px w-8" style={{ background: t.line }} />
          <span className="text-[calc(10px*var(--inv-fs))]" style={{ color: t.accent }}>
            ❧
          </span>
          <span className="h-px w-8" style={{ background: t.line }} />
        </div>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-2.5 font-cormorant text-base tracking-[0.3em]"
            style={{ color: t.sub }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="dolgarden" arch preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 돌6) 크레용 — 스케치북에 붙인 손그림 무드
function DolCrayonLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  const crayons = ["#e8873c", "#f2c14e", "#78bcd6", "#8bc48a", "#e0798f"];
  return (
    <>
      <div className="px-7 pb-12 pt-12 text-center">
        {/* 크레용 색칠 막대 */}
        <div
          className="inv-hero-in mx-auto flex w-fit items-end gap-1.5"
          aria-hidden
        >
          {crayons.map((c, i) => (
            <span
              key={c}
              className="inline-block rounded-full"
              style={{
                width: 7,
                height: 16 + (i % 3) * 6,
                background: c,
              }}
            />
          ))}
        </div>
        <p
          className="inv-hero-in mt-4 text-[calc(15px*var(--inv-fs))] font-bold tracking-[0.1em]"
          style={{ color: t.accent }}
        >
          우리 아기 {labels.dolOccasion}이에요!
        </p>
        {/* 스케치북에 테이프로 붙인 사진 */}
        <div className="relative mx-auto mt-7 w-fit">
          <div
            className="inv-hero-in rotate-2 border-[10px] bg-white p-0"
            style={{
              borderColor: "#fff",
              boxShadow: `0 14px 32px -12px ${t.accent}77`,
            }}
          >
            <div
              className="overflow-hidden"
              style={{ width: "216px", height: "270px" }}
            >
              <Photo data={data} t={t} className="h-full w-full" kenburns />
            </div>
          </div>
          {/* 마스킹 테이프 */}
          <span
            className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-6 rounded-[2px]"
            style={{ background: "#f2c14e99" }}
            aria-hidden
          />
        </div>
        <h1
          className="inv-hero-in-delay mt-7 text-[calc(1.9rem*var(--inv-fs))] font-extrabold tracking-tight"
          style={{ color: t.ink }}
        >
          {data.groomName}
        </h1>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-2 inline-block rounded-full px-5 py-1.5 text-sm font-bold"
            style={{ background: t.accentSoft, color: t.accent }}
          >
            {p.year}. {p.month}. {p.day}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="dolcrayon" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 수4) 별빛 수연 — 밤하늘에 금빛으로 새긴 귀한 잔치
function SeniorStarLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const labels = labelsOf(data);
  return (
    <>
      <StarHero
        data={data}
        t={t}
        phrase={`${labels.seniorLabel}연에 모십니다`}
        kicker={labels.heroKicker}
        sub="귀한 걸음으로 자리를 빛내 주세요"
      />
      <CommonBody data={data} t={t} variant="seniorstar" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 수5) 한지 — 수묵의 여백과 낙관(도장)이 있는 정갈한 잔치
function SeniorInkLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  return (
    <>
      <div
        className="relative px-8 pb-12 pt-12"
        style={{
          background: `linear-gradient(160deg, ${t.accentSoft} 0%, ${t.pageBg} 60%)`,
        }}
      >
        {/* 낙관 — 붉은 인장에 연세 한자 */}
        <div
          className="inv-hero-in absolute right-7 top-10 flex items-center justify-center rounded-[3px]"
          style={{
            width: 40,
            height: 40,
            background: "#b3402f",
            color: "#fdf6e8",
            fontFamily: t.headingFont,
            fontSize: 13,
            lineHeight: 1.15,
            letterSpacing: "0.02em",
            writingMode: "vertical-rl",
          }}
          aria-hidden
        >
          {labels.seniorHanja}
        </div>
        <div className="text-center">
          <p
            className="inv-hero-in font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
            style={{ color: t.sub }}
          >
            INVITATION
          </p>
          <h1
            className="inv-hero-in mt-4 text-[calc(1.5rem*var(--inv-fs))] tracking-[0.3em]"
            style={{ fontFamily: t.headingFont, color: t.ink }}
          >
            {labels.seniorLabel}을 맞아
          </h1>
          <p
            className="inv-hero-in mt-2 text-[calc(15px*var(--inv-fs))] tracking-[0.15em]"
            style={{ color: t.sub }}
          >
            귀한 자리에 모십니다
          </p>
          {/* 한지 위 붙인 사진 — 얇은 이중선 프레임 */}
          <div
            className="inv-hero-in mx-auto mt-8 p-1.5"
            style={{ border: `1px solid ${t.line}`, width: "fit-content" }}
          >
            <div
              className="overflow-hidden"
              style={{
                width: "222px",
                height: "290px",
                border: `1px solid ${t.accent}66`,
              }}
            >
              <Photo data={data} t={t} className="h-full w-full" kenburns />
            </div>
          </div>
          {/* 먹선 */}
          <div
            className="inv-hero-in-delay mx-auto mt-7 h-px w-16"
            style={{ background: t.accent, opacity: 0.5 }}
            aria-hidden
          />
          <p
            className="inv-hero-in-delay mt-5 text-[calc(1.5rem*var(--inv-fs))] tracking-[0.25em]"
            style={{ fontFamily: t.headingFont, color: t.ink }}
          >
            {data.groomName}
          </p>
          {p && (
            <p
              className="inv-hero-in-delay mt-3 text-sm tracking-[0.1em] whitespace-nowrap"
              style={{ color: t.sub }}
            >
              {p.year}년 {p.month}월 {p.day}일 {p.wkKo}요일
              {data.weddingTime && ` · ${data.weddingTime}`}
            </p>
          )}
        </div>
      </div>
      <CommonBody data={data} t={t} variant="seniorink" preview={preview} rounded="rounded-none" />
    </>
  );
}

// 수6) 가족앨범 — 빛바랜 사진첩에 모서리 홀더로 끼운 사진
function SeniorWarmLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  const labels = labelsOf(data);
  // 사진 네 모서리 홀더
  const corner = (pos: React.CSSProperties, rot: number) => (
    <span
      className="absolute"
      style={{
        ...pos,
        width: 22,
        height: 22,
        background: `${t.accent}55`,
        clipPath: "polygon(0 0, 100% 0, 0 100%)",
        transform: `rotate(${rot}deg)`,
      }}
      aria-hidden
    />
  );
  return (
    <>
      <div
        className="px-8 pb-12 pt-12 text-center"
        style={{
          background: `linear-gradient(180deg, ${t.accentSoft} 0%, ${t.pageBg} 70%)`,
        }}
      >
        <p
          className="inv-hero-in font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
          style={{ color: t.accent }}
        >
          FAMILY ALBUM
        </p>
        <h1
          className="inv-hero-in mt-3.5 text-[calc(1.5rem*var(--inv-fs))] tracking-[0.15em]"
          style={{ fontFamily: t.headingFont, color: t.ink }}
        >
          {labels.seniorLabel} 잔치에 초대합니다
        </h1>
        {/* 앨범 대지에 끼운 사진 */}
        <div
          className="inv-hero-in relative mx-auto mt-7 bg-white p-3.5"
          style={{
            width: "fit-content",
            boxShadow: `0 14px 34px -14px ${t.accent}77`,
          }}
        >
          <div
            className="overflow-hidden"
            style={{ width: "218px", height: "274px" }}
          >
            <Photo data={data} t={t} className="h-full w-full" kenburns />
          </div>
          {corner({ left: 4, top: 4 }, 0)}
          {corner({ right: 4, top: 4 }, 90)}
          {corner({ right: 4, bottom: 4 }, 180)}
          {corner({ left: 4, bottom: 4 }, 270)}
          {/* 손글씨 캡션 */}
          <p
            className="mt-3 text-[calc(15px*var(--inv-fs))]"
            style={{ fontFamily: "var(--font-brush)", color: t.sub }}
          >
            우리 가족의 가장 빛나는 날
          </p>
        </div>
        <p
          className="inv-hero-in-delay mt-7 text-[calc(1.5rem*var(--inv-fs))] tracking-[0.15em]"
          style={{ fontFamily: t.headingFont, color: t.ink }}
        >
          {data.groomName}
        </p>
        {p && (
          <p
            className="inv-hero-in-delay mt-2.5 font-cormorant text-base tracking-[0.16em] whitespace-nowrap"
            style={{ color: t.sub }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="seniorwarm" preview={preview} rounded="rounded-sm" />
    </>
  );
}

// 생4) 별빛 생일 — 별이 쏟아지는 밤하늘 무드의 생일
function BdayStarLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  return (
    <>
      <StarHero
        data={data}
        t={t}
        phrase="별처럼 빛나는 하루"
        kicker="HAPPY BIRTHDAY"
        sub="생일을 함께 축하해 주세요"
        title={data.heroTitle.trim()}
      />
      <CommonBody data={data} t={t} variant="bdaystar" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 생5) 케이크 — 촛불을 끄는 순간처럼 달콤한 파스텔
function BdayCakeLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  return (
    <>
      <div
        className="relative overflow-hidden px-8 pb-12 pt-12 text-center"
        style={{
          background: `linear-gradient(180deg, ${t.accentSoft} 0%, ${t.pageBg} 80%)`,
        }}
      >
        {/* 떠오르는 풍선 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[
            { left: "9%", size: 20, dur: 12, delay: 0 },
            { left: "84%", size: 17, dur: 14, delay: 5 },
            { left: "50%", size: 14, dur: 15, delay: 9 },
          ].map((b, i) => (
            <span
              key={i}
              className="inv-balloon"
              style={{
                left: b.left,
                fontSize: b.size,
                opacity: 0,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
              }}
            >
              🎈
            </span>
          ))}
        </div>
        <p className="inv-hero-in text-4xl" aria-hidden>
          <span className="inv-bob">🎂</span>
        </p>
        <p
          className="inv-hero-in mt-3.5 font-cormorant text-[calc(11px*var(--inv-fs))] tracking-[0.5em]"
          style={{ color: t.accent }}
        >
          HAPPY BIRTHDAY
        </p>
        {/* 리본이 달린 둥근 사진 */}
        <div
          className="inv-hero-in mx-auto mt-5 overflow-hidden rounded-full border-[7px]"
          style={{
            width: "214px",
            height: "214px",
            borderColor: "#fff",
            boxShadow: `0 16px 36px -14px ${t.accent}77`,
          }}
        >
          <Photo data={data} t={t} className="h-full w-full" kenburns />
        </div>
        {/* 상단 문구 — 비우면 표시하지 않는다 */}
        {data.heroTitle.trim() && (
          <h1
            className="inv-hero-in-delay mt-6 text-[calc(1.8rem*var(--inv-fs))] tracking-wide"
            style={{ fontFamily: titleFontOf(data) || t.headingFont, color: t.ink }}
          >
            {data.heroTitle}
          </h1>
        )}
        <p
          className={`inv-hero-in-delay ${heroGap(data, "mt-1.5", "mt-7")} text-[calc(14px*var(--inv-fs))]`}
          style={{ color: t.sub }}
        >
          생일을 함께 해주세요.
        </p>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-3.5 inline-block rounded-full bg-white px-5 py-1.5 text-sm tracking-[0.15em]"
            style={{ color: t.accent }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="bdaycake" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

// 생6) 플라워 — 꽃다발을 건네듯 화사한 플로럴 카드
function BdayBloomLayout({
  data,
  t,
  preview = false,
}: {
  data: InvitationData;
  t: TemplateTheme;
  preview?: boolean;
}) {
  const p = dateParts(data.weddingDate);
  return (
    <>
      <div
        className="relative overflow-hidden px-8 pb-12 pt-12 text-center"
        style={{
          background: `linear-gradient(180deg, ${t.accentSoft} 0%, ${t.pageBg} 75%)`,
        }}
      >
        {/* 흩날리는 꽃잎 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[
            { left: "12%", size: 12, dur: 13, delay: 0, color: "#e2a6b8" },
            { left: "32%", size: 10, dur: 15, delay: 5, color: "#8a9f6b" },
            { left: "62%", size: 13, dur: 12, delay: 8, color: "#e2a6b8" },
            { left: "86%", size: 11, dur: 14, delay: 3, color: "#8a9f6b" },
          ].map((f, i) => (
            <span
              key={i}
              className="inv-petal"
              style={{
                left: f.left,
                fontSize: f.size,
                color: f.color,
                opacity: 0,
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.delay}s`,
              }}
            >
              ✿
            </span>
          ))}
        </div>
        <p
          className="inv-hero-in font-cormorant text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
          style={{ color: t.accent }}
        >
          HAPPY BIRTHDAY
        </p>
        <p
          className="inv-hero-in mt-3 text-[calc(26px*var(--inv-fs))]"
          style={{ fontFamily: "var(--font-brush)", color: t.accent }}
        >
          당신이 피어나는 날
        </p>
        {/* 원형 사진 + 바깥 헤어라인 링 */}
        <div
          className="inv-hero-in mx-auto mt-6 w-fit rounded-full p-2"
          style={{ border: `1px solid ${t.line}` }}
        >
          <div
            className="overflow-hidden rounded-full border-4"
            style={{
              width: "212px",
              height: "212px",
              borderColor: "#fff",
              boxShadow: `0 16px 34px -14px ${t.accent}55`,
            }}
          >
            <Photo data={data} t={t} className="h-full w-full" kenburns />
          </div>
        </div>
        {/* 상단 문구 — 비우면 표시하지 않는다 */}
        {data.heroTitle.trim() && (
          <h1
            className="inv-hero-in-delay mt-6 text-[calc(1.7rem*var(--inv-fs))] tracking-[0.1em]"
            style={{ fontFamily: titleFontOf(data) || t.headingFont, color: t.ink }}
          >
            {data.heroTitle}
          </h1>
        )}
        <div
          className={`inv-hero-in-delay mx-auto ${heroGap(data, "mt-2.5", "mt-8")} flex items-center justify-center gap-2`}
          aria-hidden
        >
          <span className="h-px w-8" style={{ background: t.line }} />
          <span className="text-[calc(10px*var(--inv-fs))]" style={{ color: t.accent }}>
            ✿
          </span>
          <span className="h-px w-8" style={{ background: t.line }} />
        </div>
        {p && (
          <p
            className="whitespace-nowrap inv-hero-in-delay mt-2.5 font-cormorant text-base tracking-[0.3em]"
            style={{ color: t.sub }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}
            {time24(data.weddingTime) && ` · ${time24(data.weddingTime)}`}
          </p>
        )}
      </div>
      <CommonBody data={data} t={t} variant="bdaybloom" preview={preview} rounded="rounded-2xl" />
    </>
  );
}

/* ════════ 푸터 ════════ */
function Footer({
  data,
  t,
  fp,
  template,
}: {
  data: InvitationData;
  t: TemplateTheme;
  fp: ReturnType<typeof dateParts>;
  template: TemplateId;
}) {
  // 다크 템플릿(별빛 계열·네온)은 본문과 같은 어두운 배경으로 이어지고, 글씨는 액센트로
  const isStar = DARK_TEMPLATES.includes(template);
  const isNeon = template === "bdayneon";
  const bg = isStar || isNeon ? t.pageBg : t.ink;
  const mainColor = isStar || isNeon ? t.accent : t.pageBg;
  // 다크 템플릿은 자기 액센트 색을 옅게 깔아 본문과 톤이 이어지도록
  const subColor = isStar
    ? `${t.accent}99`
    : isNeon
      ? "rgba(255,95,162,0.55)"
      : "rgba(255,255,255,0.55)";
  const lineColor = isStar
    ? `${t.accent}4d`
    : isNeon
      ? "rgba(255,95,162,0.3)"
      : "rgba(255,255,255,0.2)";
  const message = data.footerMessage.trim();

  return (
    <footer
      className="mt-8 px-8 pb-9 pt-10 text-center"
      style={
        isStar
          ? // 밤하늘 계열은 배경이 본문과 이어져 있어 가로선을 두면 오히려 떠 보인다
            { background: bg }
          : isNeon
            ? { background: bg, borderTop: "1px solid rgba(255,95,162,0.25)" }
            : { background: bg }
      }
    >
      <p
        className="font-cormorant mb-5 flex items-center justify-center gap-3 text-[calc(10px*var(--inv-fs))] tracking-[0.5em]"
        style={{ color: subColor }}
      >
        <span className="inline-block h-px w-8" style={{ background: lineColor }} />
        THANK YOU
        <span className="inline-block h-px w-8" style={{ background: lineColor }} />
      </p>
      {message ? (
        // 사용자가 직접 쓴 맺음말
        <p
          className="inv-fade inv-writing whitespace-pre-line text-[calc(17px*var(--inv-fs))] leading-9"
          style={{ fontFamily: t.headingFont, color: mainColor }}
        >
          <span className="inv-write">{message}</span>
        </p>
      ) : (
        <>
          <p
            className="inv-fade inv-writing text-xl tracking-wide"
            style={{ fontFamily: t.headingFont, color: mainColor }}
          >
            <span className="inv-write">
              {labelsOf(data).showPerson2 ? (
                <>
                  {data.groomName}
                  <span className="mx-2 text-[0.8em]" style={{ color: subColor }}>
                    ♡
                  </span>
                  {data.brideName}
                </>
              ) : (
                data.groomName
              )}
            </span>
          </p>
          {fp && (
            <p
              className="inv-fade inv-writing mt-2.5 font-cormorant text-sm tracking-[0.3em]"
              style={{ color: subColor }}
            >
              <span className="inv-write inv-write-late">
                {fp.year}. {String(fp.month).padStart(2, "0")}.{" "}
                {String(fp.day).padStart(2, "0")}
              </span>
            </p>
          )}
        </>
      )}
      <a
        href="/"
        className="mt-6 inline-block text-[calc(10px*var(--inv-fs))] tracking-wider transition"
        style={{ color: subColor }}
      >
        별빛 초대장 ✦ 별마마파파
      </a>
    </footer>
  );
}

/* ════════ 엔트리 ════════ */
// 템플릿 id → 레이아웃 컴포넌트
const LAYOUTS: Record<
  TemplateId,
  (props: {
    data: InvitationData;
    t: TemplateTheme;
    preview?: boolean;
  }) => React.JSX.Element
> = {
  classic: ClassicLayout,
  modern: ModernLayout,
  romantic: RomanticLayout,
  botanical: BotanicalLayout,
  starlight: StarlightLayout,
  cinema: CinemaLayout,
  dolbear: DolBearLayout,
  dolcloud: DolCloudLayout,
  dolhanbok: DolHanbokLayout,
  dolstar: DolStarLayout,
  dolgarden: DolGardenLayout,
  dolcrayon: DolCrayonLayout,
  seniorgold: SeniorGoldLayout,
  seniorbloom: SeniorBloomLayout,
  seniorpine: SeniorPineLayout,
  seniorstar: SeniorStarLayout,
  seniorink: SeniorInkLayout,
  seniorwarm: SeniorWarmLayout,
  bdaypop: BdayPopLayout,
  bdayneon: BdayNeonLayout,
  bdayminimal: BdayMinimalLayout,
  bdaystar: BdayStarLayout,
  bdaycake: BdayCakeLayout,
  bdaybloom: BdayBloomLayout,
};

// 밤하늘 계열 다크 템플릿 — 푸터가 본문 배경으로 이어지도록
const DARK_TEMPLATES: readonly TemplateId[] = [
  "starlight",
  "dolstar",
  "seniorstar",
  "bdaystar",
];

export default function InvitationView({
  template,
  data: rawData,
  preview = false,
}: {
  template: TemplateId;
  data: InvitationData;
  // true면 갤러리가 비어도 빈 공백 슬롯을 미리 보여줌 (에디터 미리보기 전용)
  preview?: boolean;
}) {
  // 누락 필드가 있어도 안전하게 렌더링 (배열/문자열 기본값 보정)
  const data = normalizeData(rawData);
  const base = getTheme(template);
  const headFam = getFontFamily(data.fontHeading);
  const bodyFam = getFontFamily(data.fontBody);
  const t: TemplateTheme = {
    ...base,
    headingFont: headFam || base.headingFont,
    bodyFont: bodyFam || base.bodyFont,
  };
  const fp = dateParts(data.weddingDate);
  // 인트로는 종류마다 마지막 한 가지 연출만 다르다 (getIntros 참고)
  const intro = data.intro;

  return (
    <div
      // relative: 인트로 덮개(absolute)가 이 초대장 안에만 씌워지도록
      className="relative mx-auto min-h-full w-full max-w-md"
      // 구분선 모양은 CSS 가 이 값을 보고 고른다
      data-divider={data.dividerStyle}
      style={{
        background: t.pageBg,
        color: t.ink,
        fontFamily: t.bodyFont,
        ...fontScaleVars(data.fontScale),
      }}
    >
      {/* 스크롤에 맞춰 섹션이 나타나게 — 에디터 미리보기도 실제와 똑같이 */}
      <ScrollReveal />

      {/* 인트로 — 고른 연출이 바뀌면 key 가 바뀌어 미리보기에서 다시 재생된다 */}
      {intro !== "none" && (
        <InvitationIntro key={intro} data={data} t={t} style={intro} />
      )}

      {(() => {
        const Layout = LAYOUTS[template] ?? ClassicLayout;
        return <Layout data={data} t={t} preview={preview} />;
      })()}

      <Footer data={data} t={t} fp={fp} template={template} />
    </div>
  );
}

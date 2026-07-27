import { normalizeData, type InvitationData, type TemplateId } from "@/lib/types";
import { getTheme, getFontFamily, type TemplateTheme } from "@/lib/templates";
import { getCategoryLabels } from "@/lib/categories";
import GalleryAlbum from "./GalleryAlbum";
import AccountList from "./AccountList";
import Countdown from "./Countdown";
import MapSection from "./MapSection";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAYS_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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
function formatKo(iso: string, time: string) {
  const p = dateParts(iso);
  if (!p) return iso;
  return `${p.year}년 ${p.month}월 ${p.day}일 ${p.wkKo}요일 ${time}`;
}

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
          className="font-cormorant mt-1 text-[9px] tracking-[0.4em]"
          style={{ color: t.accent }}
        >
          {MONTHS_EN[month]}
        </p>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className="py-2 text-[11px] font-medium"
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
                    <span className="absolute -right-1 -top-1 text-[10px]">
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
        className="inv-fade mb-8 text-[19px] leading-relaxed tracking-[0.04em]"
        style={{ fontFamily: t.headingFont }}
      >
        {data.greetingTitle}
      </h2>
      <p
        className="inv-fade whitespace-pre-line text-[14px] leading-[2.2]"
        style={{ color: t.sub }}
      >
        {data.greetingMessage}
      </p>
    </div>
  );
}

// 예식일까지 남은 일수 (지났으면 null)
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
  const labels = getCategoryLabels(data.category);
  return (
    <div className="text-center">
      <p className="inv-fade mb-7 text-lg" style={{ fontFamily: t.headingFont }}>
        {formatKo(data.weddingDate, data.weddingTime)}
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
      <span className="text-[11px]">{role} 사진</span>
    </div>
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
  const labels = getCategoryLabels(data.category);
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
        },
        {
          role: "신부",
          name: data.brideName,
          photo: data.bridePhotoUrl,
          father: data.brideFather,
          mother: data.brideMother,
          relation: "딸",
          tel: data.bridePhone,
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
            <ProfilePhoto src={p.photo} role={p.role || "대표"} t={t} arch={arch} preview={preview} />
            {/* 이름 ↵ 전화·문자 */}
            <p
              className="inv-fade mt-5 text-lg"
              style={{ fontFamily: t.headingFont, color: t.ink }}
            >
              {p.name}
            </p>
            {p.tel && (
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
        className="inv-fade mx-auto mt-4 max-w-[260px] text-[13px] leading-6"
        style={{ color: t.sub }}
      >
        {data.venueAddress}
      </p>
      {/* 실제 지도 + 네이버 길찾기 + 주소 복사 */}
      <MapSection address={data.venueAddress} t={t} />
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
        <p className="mb-6 text-sm" style={{ color: t.sub }}>
          우리의 모든 순간을 담았습니다
        </p>
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
      <p className="inv-fade mb-6 text-sm" style={{ color: t.sub }}>
        우리의 모든 순간을 담았습니다
      </p>
      <GalleryAlbum images={gallery} rounded={rounded} />
      <p className="inv-fade mt-4 text-xs" style={{ color: t.sub }}>
        사진을 누르면 크게 볼 수 있어요
      </p>
    </>
  );
}

// 갤러리 섹션 노출 여부: 사진이 있거나, 미리보기 모드
function showGallery(data: InvitationData, preview: boolean) {
  return preview || data.gallery.filter(Boolean).length > 0;
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
      showSide={getCategoryLabels(data.category).showPerson2}
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
  if (variant === "modern") {
    return (
      <div className="inv-fade mb-7 flex items-baseline gap-3">
        {index && (
          <span className="font-cormorant text-base" style={{ color: t.accent }}>
            {index}
          </span>
        )}
        <span
          className="font-cormorant text-[15px] font-semibold tracking-[0.3em]"
          style={{ color: t.ink }}
        >
          {text}
        </span>
        <span className="h-px flex-1" style={{ background: t.line }} />
      </div>
    );
  }
  // 큼직한 스몰캡 라벨 — 장식 없이 자간과 컬러로만 구분
  return (
    <div className="inv-fade mb-9 text-center">
      <span
        className="font-cormorant text-[16px] font-medium tracking-[0.45em]"
        style={{ color: t.accent }}
      >
        {text}
      </span>
    </div>
  );
}

function Divider({ t, variant }: { t: TemplateTheme; variant: TemplateId }) {
  if (variant === "modern")
    return <div className="mx-8 h-px" style={{ background: t.line }} />;
  // 미니멀 헤어라인 — 작은 마름모 하나로 절제
  return (
    <div className="flex items-center justify-center gap-2.5 py-1" aria-hidden>
      <span className="h-px w-6" style={{ background: t.line }} />
      <span
        className="inline-block h-[3px] w-[3px] rotate-45"
        style={{ background: t.accent, opacity: 0.55 }}
      />
      <span className="h-px w-6" style={{ background: t.line }} />
    </div>
  );
}

/* Section: 라벨 + 알맹이 래퍼 */
function Sec({
  label,
  index,
  t,
  variant,
  children,
}: {
  label: string;
  index?: string;
  t: TemplateTheme;
  variant: TemplateId;
  children: React.ReactNode;
}) {
  const align = variant === "modern" ? "text-left" : "text-center";
  return (
    <section className={`inv-fade px-8 py-16 ${align}`}>
      <Label text={label} t={t} variant={variant} index={index} />
      {children}
    </section>
  );
}

// 알파벳이 한 글자씩 나타나는 텍스트 (모던 히어로)
function LetterReveal({ text }: { text: string }) {
  return (
    <span aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className="inv-letter"
          style={{ animationDelay: `${0.4 + i * 0.07}s` }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
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
  if (!getCategoryLabels(data.category).showPerson2) {
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

// 대표 사진 모션 id → CSS 클래스 (부모에 overflow-hidden 필요)
const MOTION_CLASS: Record<string, string> = {
  zoomin: "inv-kenburns",
  zoomout: "inv-motion-zoomout",
  focus: "inv-motion-focus",
  mono: "inv-motion-mono",
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
  const motion = kenburns
    ? (MOTION_CLASS[data.heroMotion] ?? MOTION_CLASS.zoomin)
    : "";
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
  const labels = getCategoryLabels(data.category);
  return (
    <>
      <div className="relative overflow-hidden">
        <Photo data={data} t={t} className="h-[520px] w-full" kenburns />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
        <div className="absolute inset-x-0 bottom-0 px-8 pb-11 text-center text-white">
          <p className="inv-hero-in font-cormorant text-[10px] tracking-[0.5em] text-white/80">
            {labels.heroKicker}
          </p>
          <h1
            className="inv-hero-in mt-4 text-[1.8rem] leading-snug tracking-[0.06em]"
            style={{ fontFamily: t.headingFont }}
          >
            <NamesAmp data={data} t={t} heartColor="#e8c878" />
          </h1>
          {p && (
            <p className="inv-hero-in-delay mt-3 font-cormorant text-sm tracking-[0.35em] text-white/80">
              {p.year}. {String(p.month).padStart(2, "0")}.{" "}
              {String(p.day).padStart(2, "0")}. {p.wkEn}
            </p>
          )}
        </div>
      </div>
      <Sec label="INVITATION" t={t} variant="classic">
        <GreetingInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="classic" />
      <Sec label={labels.sectionCoupleLabel} t={t} variant="classic">
        <CoupleInner data={data} t={t} preview={preview} />
      </Sec>
      <Divider t={t} variant="classic" />
      <Sec label="THE DAY" t={t} variant="classic">
        <DateInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="classic" />
      <Sec label="LOCATION" t={t} variant="classic">
        <LocationInner data={data} t={t} />
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="classic" />
          <Sec label="GALLERY" t={t} variant="classic">
            <GalleryInner data={data} t={t} preview={preview} />
          </Sec>
        </>
      )}
      {data.accounts.filter((a) => a.number).length > 0 && (
        <>
          <Divider t={t} variant="classic" />
          <Sec label="ACCOUNT" t={t} variant="classic">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              {getCategoryLabels(data.category).accountsLabel}
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
          {getCategoryLabels(data.category).heroKicker2}
        </p>
        {p && (
          <p
            className="inv-hero-in mt-3 font-cormorant text-[3.2rem] leading-none tracking-tight"
            style={{ color: t.ink }}
          >
            {p.year}.{String(p.month).padStart(2, "0")}.
            {String(p.day).padStart(2, "0")}
          </p>
        )}
        <p className="inv-hero-in-delay mt-3 text-sm" style={{ color: t.sub }}>
          {p ? `${p.wkEn} · ${data.weddingTime}` : data.weddingTime}
        </p>
      </header>
      <div className="overflow-hidden">
        <Photo data={data} t={t} className="aspect-[4/5] w-full" kenburns />
      </div>
      <Sec label="INVITATION" index="01" t={t} variant="modern">
        <GreetingInner data={data} t={t} align="left" />
      </Sec>
      <Divider t={t} variant="modern" />
      <Sec label={getCategoryLabels(data.category).sectionCoupleLabel} index="02" t={t} variant="modern">
        <CoupleInner data={data} t={t} preview={preview} />
      </Sec>
      <Divider t={t} variant="modern" />
      <Sec label="DATE" index="03" t={t} variant="modern">
        <DateInner data={data} t={t} calendar />
      </Sec>
      <Divider t={t} variant="modern" />
      <Sec label="LOCATION" index="04" t={t} variant="modern">
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
          <MapSection address={data.venueAddress} t={t} square />
        </div>
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="modern" />
          <Sec label="GALLERY" index="05" t={t} variant="modern">
            <GalleryInner data={data} t={t} rounded="rounded-sm" preview={preview} />
          </Sec>
        </>
      )}
      {data.accounts.filter((a) => a.number).length > 0 && (
        <>
          <Divider t={t} variant="modern" />
          <Sec label="ACCOUNT" index="06" t={t} variant="modern">
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
  const labels = getCategoryLabels(data.category);
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
          <span className="text-[9px]" style={{ color: t.accent }}>
            ❀
          </span>
          <span className="h-px w-8" style={{ background: t.line }} />
        </div>
        {p && (
          <p
            className="inv-hero-in-delay mt-2.5 pb-10 font-cormorant text-base tracking-[0.3em]"
            style={{ color: t.sub }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}
          </p>
        )}
      </div>
      <Sec label="INVITATION" t={t} variant="romantic">
        <GreetingInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="romantic" />
      <Sec label={labels.sectionCoupleLabel} t={t} variant="romantic">
        <CoupleInner data={data} t={t} arch preview={preview} />
      </Sec>
      <Divider t={t} variant="romantic" />
      <Sec label="OUR DAY" t={t} variant="romantic">
        <DateInner data={data} t={t} heart />
      </Sec>
      <Divider t={t} variant="romantic" />
      <Sec label="LOCATION" t={t} variant="romantic">
        <LocationInner data={data} t={t} />
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="romantic" />
          <Sec label="GALLERY" t={t} variant="romantic">
            <GalleryInner data={data} t={t} rounded="rounded-2xl" preview={preview} />
          </Sec>
        </>
      )}
      {data.accounts.filter((a) => a.number).length > 0 && (
        <>
          <Divider t={t} variant="romantic" />
          <Sec label="ACCOUNT" t={t} variant="romantic">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              {getCategoryLabels(data.category).accountsLabel}
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
  const labels = getCategoryLabels(data.category);
  return (
    <div className="p-3">
      <div
        className="relative border"
        style={{ borderColor: t.line }}
      >
        <div className="px-7 pt-14 text-center">
          <p
            className="inv-hero-in font-cormorant text-[10px] tracking-[0.45em]"
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
            <p className="mt-2 pb-2 font-cormorant text-base tracking-widest" style={{ color: t.sub }}>
              {p.year}. {String(p.month).padStart(2, "0")}.{" "}
              {String(p.day).padStart(2, "0")}. {p.wkEn}
            </p>
          )}
        </div>
        <Sec label="INVITATION" t={t} variant="botanical">
          <GreetingInner data={data} t={t} />
        </Sec>
        <Divider t={t} variant="botanical" />
        <Sec label={labels.sectionCoupleLabel} t={t} variant="botanical">
          <CoupleInner data={data} t={t} preview={preview} />
        </Sec>
        <Divider t={t} variant="botanical" />
        <Sec label="THE DAY" t={t} variant="botanical">
          <DateInner data={data} t={t} />
        </Sec>
        <Divider t={t} variant="botanical" />
        <Sec label="LOCATION" t={t} variant="botanical">
          <LocationInner data={data} t={t} />
        </Sec>
        {showGallery(data, preview) && (
          <>
            <Divider t={t} variant="botanical" />
            <Sec label="GALLERY" t={t} variant="botanical">
              <GalleryInner data={data} t={t} preview={preview} />
            </Sec>
          </>
        )}
        {data.accounts.filter((a) => a.number).length > 0 && (
          <>
            <Divider t={t} variant="botanical" />
            <Sec label="ACCOUNT" t={t} variant="botanical">
              <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
                {getCategoryLabels(data.category).accountsLabel}
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
  const labels = getCategoryLabels(data.category);
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
          className="inv-hero-in font-cormorant mt-2 text-[10px] tracking-[0.5em]"
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
            className="inv-hero-in-delay mt-3 font-cormorant text-base tracking-[0.3em]"
            style={{ color: t.sub }}
          >
            {p.year}. {String(p.month).padStart(2, "0")}.{" "}
            {String(p.day).padStart(2, "0")}. {p.wkEn}
          </p>
        )}
      </div>
      <Sec label="INVITATION" t={t} variant="starlight">
        <GreetingInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="starlight" />
      <Sec label={labels.sectionCoupleLabel} t={t} variant="starlight">
        <CoupleInner data={data} t={t} preview={preview} />
      </Sec>
      <Divider t={t} variant="starlight" />
      <Sec label="THE DAY" t={t} variant="starlight">
        <DateInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="starlight" />
      <Sec label="LOCATION" t={t} variant="starlight">
        <LocationInner data={data} t={t} />
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="starlight" />
          <Sec label="GALLERY" t={t} variant="starlight">
            <GalleryInner data={data} t={t} rounded="rounded-2xl" preview={preview} />
          </Sec>
        </>
      )}
      {data.accounts.filter((a) => a.number).length > 0 && (
        <>
          <Divider t={t} variant="starlight" />
          <Sec label="ACCOUNT" t={t} variant="starlight">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              {getCategoryLabels(data.category).accountsLabel}
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
  const labels = getCategoryLabels(data.category);
  return (
    <>
      {/* 필름 화보 히어로 — 이름 + 화보 사진 + 필카 감성 날짜 스탬프 */}
      <div className="px-6 pt-11">
        <div className="flex items-center justify-center gap-5">
          <p
            className="inv-hero-in text-[22px] leading-tight"
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
                className="inv-hero-in text-[22px] leading-tight"
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
        {/* 세로쓰기 캡션 — 화보 무드 (사진 위 가독성용 흰색+그림자) */}
        {data.venueName && (
          <p
            className="absolute left-3.5 top-5 text-[12.5px] tracking-[0.25em] text-white"
            style={{
              writingMode: "vertical-rl",
              textShadow: "0 1px 10px rgba(0,0,0,0.55)",
            }}
          >
            {data.venueName} {data.venueHall}
          </p>
        )}
        {p && (
          <p
            className="absolute right-3.5 top-5 text-[12.5px] tracking-[0.28em] text-white"
            style={{
              writingMode: "vertical-rl",
              textShadow: "0 1px 10px rgba(0,0,0,0.55)",
            }}
          >
            {p.year}.{String(p.month).padStart(2, "0")}.
            {String(p.day).padStart(2, "0")} {data.weddingTime}
          </p>
        )}
        {/* 필름 카메라 날짜 스탬프 */}
        {p && (
          <span
            aria-hidden
            className="absolute bottom-4 right-4 text-[13px] tracking-[0.18em]"
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
      <p
        className="pt-10 text-center font-cormorant text-[19px] tracking-[0.3em]"
        style={{ color: t.accent }}
      >
        <LetterReveal text="OUR MOMENT, FOREVER" />
      </p>
      <Sec label="INVITATION" t={t} variant="cinema">
        <GreetingInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="cinema" />
      <Sec label={labels.sectionCoupleLabel} t={t} variant="cinema">
        <CoupleInner data={data} t={t} preview={preview} />
      </Sec>
      <Divider t={t} variant="cinema" />
      <Sec label="THE DAY" t={t} variant="cinema">
        <DateInner data={data} t={t} />
      </Sec>
      <Divider t={t} variant="cinema" />
      <Sec label="LOCATION" t={t} variant="cinema">
        <LocationInner data={data} t={t} />
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="cinema" />
          <Sec label="GALLERY" t={t} variant="cinema">
            <GalleryInner data={data} t={t} rounded="rounded-sm" preview={preview} />
          </Sec>
        </>
      )}
      {data.accounts.filter((a) => a.number).length > 0 && (
        <>
          <Divider t={t} variant="cinema" />
          <Sec label="ACCOUNT" t={t} variant="cinema">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              {getCategoryLabels(data.category).accountsLabel}
            </h3>
            <AccountInner data={data} t={t} />
          </Sec>
        </>
      )}
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
  // 별빛 템플릿은 본문과 같은 네이비로 이어지고, 글씨는 금빛으로
  const isStar = template === "starlight";
  const bg = isStar ? t.pageBg : t.ink;
  const mainColor = isStar ? t.accent : t.pageBg;
  const subColor = isStar ? "rgba(217,191,112,0.6)" : "rgba(255,255,255,0.55)";
  const lineColor = isStar ? "rgba(217,191,112,0.3)" : "rgba(255,255,255,0.2)";
  const message = data.footerMessage.trim();

  return (
    <footer
      className="mt-10 px-8 pb-14 pt-16 text-center"
      style={
        isStar
          ? { background: bg, borderTop: "1px solid rgba(217,191,112,0.25)" }
          : { background: bg }
      }
    >
      <p
        className="font-cormorant mb-6 flex items-center justify-center gap-3 text-[10px] tracking-[0.5em]"
        style={{ color: subColor }}
      >
        <span className="inline-block h-px w-8" style={{ background: lineColor }} />
        THANK YOU
        <span className="inline-block h-px w-8" style={{ background: lineColor }} />
      </p>
      {message ? (
        // 사용자가 직접 쓴 맺음말
        <p
          className="inv-fade whitespace-pre-line text-[17px] leading-9"
          style={{ fontFamily: t.headingFont, color: mainColor }}
        >
          {message}
        </p>
      ) : (
        <>
          <p
            className="text-xl tracking-wide"
            style={{ fontFamily: t.headingFont, color: mainColor }}
          >
            {getCategoryLabels(data.category).showPerson2 ? (
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
          </p>
          {fp && (
            <p
              className="mt-2.5 font-cormorant text-sm tracking-[0.3em]"
              style={{ color: subColor }}
            >
              {fp.year}. {String(fp.month).padStart(2, "0")}.{" "}
              {String(fp.day).padStart(2, "0")}
            </p>
          )}
        </>
      )}
      <a
        href="/"
        className="mt-9 inline-block text-[10px] tracking-wider transition"
        style={{ color: subColor }}
      >
        별빛 초대장 ✦ 별마마파파
      </a>
    </footer>
  );
}

/* ════════ 엔트리 ════════ */
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

  return (
    <div
      className="mx-auto min-h-full w-full max-w-md"
      style={{ background: t.pageBg, color: t.ink, fontFamily: t.bodyFont }}
    >
      {template === "classic" && <ClassicLayout data={data} t={t} preview={preview} />}
      {template === "modern" && <ModernLayout data={data} t={t} preview={preview} />}
      {template === "romantic" && <RomanticLayout data={data} t={t} preview={preview} />}
      {template === "botanical" && <BotanicalLayout data={data} t={t} preview={preview} />}
      {template === "starlight" && <StarlightLayout data={data} t={t} preview={preview} />}
      {template === "cinema" && <CinemaLayout data={data} t={t} preview={preview} />}

      <Footer data={data} t={t} fp={fp} template={template} />
    </div>
  );
}

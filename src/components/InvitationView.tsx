import { normalizeData, type InvitationData, type TemplateId } from "@/lib/types";
import { getTheme, getFontFamily, type TemplateTheme } from "@/lib/templates";
import GalleryAlbum from "./GalleryAlbum";
import AccountList from "./AccountList";

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
      className="mx-auto max-w-[300px] rounded-2xl px-4 pb-5 pt-6"
      style={{ background: t.accentSoft }}
    >
      <div className="mb-4 text-center">
        <p className="text-2xl font-light" style={{ color: t.ink }}>
          {month + 1}
          <span className="ml-0.5 text-sm" style={{ color: t.sub }}>
            월
          </span>
        </p>
        <p
          className="font-cormorant mt-0.5 text-[10px] tracking-[0.35em]"
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
function ParentLine({
  father,
  mother,
  relation,
  role,
  name,
  t,
}: {
  father: string;
  mother: string;
  relation: string;
  role: string;
  name: string;
  t: TemplateTheme;
}) {
  const parents = [father, mother].map((p) => p.trim()).filter(Boolean);
  return (
    <div className="flex items-center justify-center gap-2.5">
      <span
        className="w-8 shrink-0 text-right text-[11px] tracking-wider"
        style={{ color: t.accent }}
      >
        {role}
      </span>
      <span className="text-sm" style={{ color: t.sub }}>
        {parents.length > 0 && (
          <>
            {parents.join(" · ")}
            <span className="mx-1 opacity-60">의 {relation}</span>
          </>
        )}
        <span
          className="ml-0.5 text-[15px] font-semibold"
          style={{ color: t.ink }}
        >
          {name}
        </span>
      </span>
    </div>
  );
}

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
        className="mb-7 text-xl leading-relaxed tracking-[0.02em]"
        style={{ fontFamily: t.headingFont }}
      >
        {data.greetingTitle}
      </h2>
      <p
        className="whitespace-pre-line text-[15px] leading-9"
        style={{ color: t.sub }}
      >
        {data.greetingMessage}
      </p>
      {/* 혼주 소개 */}
      <div
        className={`mt-10 space-y-2.5 border-t pt-7 ${
          align === "left" ? "" : "mx-auto max-w-[280px]"
        }`}
        style={{ borderColor: t.line }}
      >
        <ParentLine
          father={data.groomFather}
          mother={data.groomMother}
          relation="아들"
          role="신랑"
          name={data.groomName}
          t={t}
        />
        <ParentLine
          father={data.brideFather}
          mother={data.brideMother}
          relation="딸"
          role="신부"
          name={data.brideName}
          t={t}
        />
      </div>
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
  return (
    <div className="text-center">
      <p className="mb-7 text-lg" style={{ fontFamily: t.headingFont }}>
        {formatKo(data.weddingDate, data.weddingTime)}
      </p>
      {calendar && <MiniCalendar iso={data.weddingDate} t={t} heart={heart} />}
      {dday !== null && (
        <div className="mt-6">
          <p
            className="font-cormorant inline-block rounded-full px-6 py-2 text-sm font-semibold tracking-[0.25em] text-white"
            style={{ background: t.accent }}
          >
            {dday === 0 ? "D-DAY ♡" : `D-${dday}`}
          </p>
          {dday > 0 && (
            <p className="mt-2.5 text-xs" style={{ color: t.sub }}>
              {data.groomName} · {data.brideName}의 결혼식이{" "}
              <span className="font-semibold" style={{ color: t.accent }}>
                {dday}일
              </span>{" "}
              남았습니다
            </p>
          )}
        </div>
      )}
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
        className="text-xl tracking-[0.02em]"
        style={{ fontFamily: t.headingFont }}
      >
        {data.venueName}
      </p>
      {data.venueHall && (
        <p className="mt-1.5 text-sm" style={{ color: t.sub }}>
          {data.venueHall}
        </p>
      )}
      <p
        className="mx-auto mt-5 max-w-[260px] rounded-xl px-4 py-3 text-sm leading-6"
        style={{ background: t.accentSoft, color: t.ink }}
      >
        {data.venueAddress}
      </p>
      <a
        href={`https://map.kakao.com/?q=${encodeURIComponent(
          data.venueAddress
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-full px-7 py-3 text-sm font-medium text-white transition"
        style={{
          background: t.accent,
          boxShadow: `0 8px 20px -8px ${t.accent}aa`,
        }}
      >
        카카오맵에서 길찾기
      </a>
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
      <p className="mb-6 text-sm" style={{ color: t.sub }}>
        우리의 모든 순간을 담았습니다
      </p>
      <GalleryAlbum images={gallery} rounded={rounded} />
      <p className="mt-4 text-xs" style={{ color: t.sub }}>
        사진을 누르면 크게 볼 수 있어요
      </p>
    </>
  );
}

// 갤러리 섹션 노출 여부: 사진이 있거나, 미리보기 모드
function showGallery(data: InvitationData, preview: boolean) {
  return preview || data.gallery.filter(Boolean).length > 0;
}

function ContactInner({
  data,
  t,
}: {
  data: InvitationData;
  t: TemplateTheme;
}) {
  return (
    <div className="mx-auto grid max-w-[320px] grid-cols-2 gap-3">
      {[
        { role: "신랑", name: data.groomName, tel: data.groomPhone },
        { role: "신부", name: data.brideName, tel: data.bridePhone },
      ].map((c) => (
        <a
          key={c.role}
          href={`tel:${c.tel}`}
          className="rounded-2xl border px-4 py-4 text-center transition"
          style={{ borderColor: t.line, background: t.pageBg }}
        >
          <span
            className="block text-[11px] font-medium tracking-wide"
            style={{ color: t.accent }}
          >
            {c.role}
          </span>
          <span
            className="mt-1 block text-[15px] font-medium"
            style={{ color: t.ink }}
          >
            {c.name}
          </span>
          <span
            className="mt-1.5 inline-flex items-center gap-1 text-xs"
            style={{ color: t.sub }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
            </svg>
            전화하기
          </span>
        </a>
      ))}
    </div>
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
  return <AccountList accounts={accounts} t={t} />;
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
      <div className="mb-6 flex items-baseline gap-3">
        {index && (
          <span className="font-cormorant text-sm" style={{ color: t.accent }}>
            {index}
          </span>
        )}
        <span
          className="font-cormorant text-xs font-semibold tracking-[0.3em]"
          style={{ color: t.ink }}
        >
          {text}
        </span>
        <span className="h-px flex-1" style={{ background: t.line }} />
      </div>
    );
  }
  const ornament =
    variant === "romantic" ? "♡" : variant === "botanical" ? "❧" : "";
  return (
    <div className="mb-7 flex items-center justify-center gap-2.5">
      <span className="h-px w-7" style={{ background: t.line }} />
      {ornament && (
        <span className="text-xs" style={{ color: t.accent }}>
          {ornament}
        </span>
      )}
      <span
        className="font-cormorant text-xs tracking-[0.35em]"
        style={{ color: t.accent }}
      >
        {text}
      </span>
      {ornament && (
        <span className="text-xs" style={{ color: t.accent }}>
          {ornament}
        </span>
      )}
      <span className="h-px w-7" style={{ background: t.line }} />
    </div>
  );
}

function Divider({ t, variant }: { t: TemplateTheme; variant: TemplateId }) {
  if (variant === "modern")
    return <div className="mx-8 h-px" style={{ background: t.line }} />;
  if (variant === "romantic")
    return (
      <div className="flex items-center justify-center gap-3 py-1">
        <span className="h-px w-10" style={{ background: t.line }} />
        <span className="text-xs" style={{ color: t.accent }}>
          ♡
        </span>
        <span className="h-px w-10" style={{ background: t.line }} />
      </div>
    );
  if (variant === "botanical")
    return (
      <div className="flex justify-center py-1.5" style={{ color: t.accent }}>
        <span className="text-sm">❦</span>
      </div>
    );
  // classic
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <span className="h-px w-12" style={{ background: t.line }} />
      <span
        className="inline-block h-1.5 w-1.5 rotate-45"
        style={{ background: t.accent }}
      />
      <span className="h-px w-12" style={{ background: t.line }} />
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

function NamesAmp({
  data,
  t,
  heartColor,
}: {
  data: InvitationData;
  t: TemplateTheme;
  heartColor?: string;
}) {
  return (
    <>
      {data.groomName}
      <span
        className="mx-2.5 align-middle text-[0.8em]"
        style={{ color: heartColor ?? t.accent }}
      >
        ♡
      </span>
      {data.brideName}
    </>
  );
}

function Photo({
  data,
  t,
  className,
}: {
  data: InvitationData;
  t: TemplateTheme;
  className: string;
}) {
  if (data.mainPhotoUrl)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={data.mainPhotoUrl} alt="대표 사진" className={`object-cover ${className}`} />
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
  return (
    <>
      <div className="relative">
        <Photo data={data} t={t} className="h-[500px] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/20" />
        {/* 스테이셔너리풍 이중 인셋 프레임 */}
        <div className="pointer-events-none absolute inset-3 border border-white/40" />
        <div className="pointer-events-none absolute inset-[18px] border border-white/20" />
        <div className="absolute inset-x-0 bottom-0 px-8 pb-10 text-center text-white">
          <p className="inv-hero-in font-cormorant flex items-center justify-center gap-3 text-xs tracking-[0.45em]">
            <span className="inline-block h-px w-6 bg-white/50" />
            WEDDING INVITATION
            <span className="inline-block h-px w-6 bg-white/50" />
          </p>
          <h1
            className="inv-hero-in mt-4 text-[2rem] leading-snug tracking-wide"
            style={{ fontFamily: t.headingFont }}
          >
            <NamesAmp data={data} t={t} heartColor="#e8c878" />
          </h1>
          {p && (
            <p className="inv-hero-in-delay mt-2.5 font-cormorant text-base tracking-[0.3em] text-white/90">
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
      <Divider t={t} variant="classic" />
      <Sec label="CONTACT" t={t} variant="classic">
        <ContactInner data={data} t={t} />
      </Sec>
      {data.accounts.filter((a) => a.number).length > 0 && (
        <>
          <Divider t={t} variant="classic" />
          <Sec label="ACCOUNT" t={t} variant="classic">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              마음 전하실 곳
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
      <header className="px-8 pb-4 pt-16">
        <div
          className="inv-hero-in mb-5 h-px w-10"
          style={{ background: t.ink }}
        />
        <p
          className="inv-hero-in font-cormorant text-xs font-semibold tracking-[0.4em]"
          style={{ color: t.sub }}
        >
          THE WEDDING DAY
        </p>
        {p && (
          <p
            className="inv-hero-in mt-3 font-cormorant text-[3.4rem] leading-none tracking-tight"
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
      <div className="px-8">
        <Photo data={data} t={t} className="aspect-[4/5] w-full rounded-sm" />
      </div>
      <div className="px-8 pb-2 pt-9 text-center">
        <h1
          className="text-[1.9rem] leading-tight tracking-[0.06em]"
          style={{ fontFamily: t.headingFont }}
        >
          {data.groomName}
          <span
            className="font-cormorant mx-3 align-middle text-[0.75em] italic"
            style={{ color: t.accent }}
          >
            &
          </span>
          {data.brideName}
        </h1>
      </div>
      <Sec label="INVITATION" index="01" t={t} variant="modern">
        <GreetingInner data={data} t={t} align="left" />
      </Sec>
      <Divider t={t} variant="modern" />
      <Sec label="DATE" index="02" t={t} variant="modern">
        <DateInner data={data} t={t} calendar />
      </Sec>
      <Divider t={t} variant="modern" />
      <Sec label="LOCATION" index="03" t={t} variant="modern">
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
          <a
            href={`https://map.kakao.com/?q=${encodeURIComponent(
              data.venueAddress
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block border px-6 py-2.5 text-sm"
            style={{ borderColor: t.ink, color: t.ink }}
          >
            카카오맵에서 길찾기 →
          </a>
        </div>
      </Sec>
      {showGallery(data, preview) && (
        <>
          <Divider t={t} variant="modern" />
          <Sec label="GALLERY" index="04" t={t} variant="modern">
            <GalleryInner data={data} t={t} rounded="rounded-sm" preview={preview} />
          </Sec>
        </>
      )}
      <Divider t={t} variant="modern" />
      <Sec label="CONTACT" index="05" t={t} variant="modern">
        <ContactInner data={data} t={t} />
      </Sec>
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
            { left: "46%", size: 11, dur: 12, delay: 6 },
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
          우리, 결혼해요
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
          <Photo data={data} t={t} className="h-full w-full" />
        </div>
        <h1
          className="inv-hero-in-delay mt-7 text-2xl tracking-wide"
          style={{ fontFamily: t.headingFont }}
        >
          {data.groomName}
          <span className="mx-2" style={{ color: t.accent }}>
            ♡
          </span>
          {data.brideName}
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
      <Divider t={t} variant="romantic" />
      <Sec label="CONTACT" t={t} variant="romantic">
        <ContactInner data={data} t={t} />
      </Sec>
      {data.accounts.filter((a) => a.number).length > 0 && (
        <>
          <Divider t={t} variant="romantic" />
          <Sec label="ACCOUNT" t={t} variant="romantic">
            <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
              마음 전하실 곳
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
  const corner = (pos: string, rotate: number) => (
    <span
      aria-hidden
      className={`absolute ${pos} text-lg leading-none`}
      style={{ color: t.accent, transform: `rotate(${rotate}deg)` }}
    >
      ❦
    </span>
  );
  return (
    <div className="p-3">
      <div
        className="relative border"
        style={{ borderColor: t.line }}
      >
        {corner("left-1.5 top-1.5", 0)}
        {corner("right-1.5 top-1.5", 90)}
        {corner("bottom-1.5 right-1.5", 180)}
        {corner("bottom-1.5 left-1.5", 270)}
        <div className="px-7 pt-12 text-center">
          <div className="inv-hero-in mb-4 text-2xl" style={{ color: t.accent }}>
            ❧
          </div>
          <p
            className="inv-hero-in font-cormorant text-xs tracking-[0.4em]"
            style={{ color: t.accent }}
          >
            THE MARRIAGE OF
          </p>
          <div
            className="inv-hero-in relative mx-auto mt-6 w-fit rounded-full p-1.5"
            style={{ border: `1px solid ${t.line}` }}
          >
            <div
              className="overflow-hidden rounded-full border-4"
              style={{
                width: "206px",
                height: "206px",
                borderColor: t.accentSoft,
              }}
            >
              <Photo data={data} t={t} className="h-full w-full" />
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
        <Divider t={t} variant="botanical" />
        <Sec label="CONTACT" t={t} variant="botanical">
          <ContactInner data={data} t={t} />
        </Sec>
        {data.accounts.filter((a) => a.number).length > 0 && (
          <>
            <Divider t={t} variant="botanical" />
            <Sec label="ACCOUNT" t={t} variant="botanical">
              <h3 className="mb-6 text-base" style={{ fontFamily: t.headingFont }}>
                마음 전하실 곳
              </h3>
              <AccountInner data={data} t={t} />
            </Sec>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════ 푸터 ════════ */
function Footer({
  data,
  t,
  fp,
}: {
  data: InvitationData;
  t: TemplateTheme;
  fp: ReturnType<typeof dateParts>;
}) {
  return (
    <footer
      className="mt-10 px-8 pb-14 pt-16 text-center"
      style={{ background: t.ink }}
    >
      <p className="font-cormorant mb-5 flex items-center justify-center gap-3 text-[10px] tracking-[0.5em] text-white/45">
        <span className="inline-block h-px w-8 bg-white/20" />
        THANK YOU
        <span className="inline-block h-px w-8 bg-white/20" />
      </p>
      <p
        className="text-xl tracking-wide"
        style={{ fontFamily: t.headingFont, color: t.pageBg }}
      >
        {data.groomName}
        <span className="mx-2 text-[0.8em]" style={{ color: t.accentSoft }}>
          ♡
        </span>
        {data.brideName}
      </p>
      {fp && (
        <p className="mt-2.5 font-cormorant text-sm tracking-[0.3em] text-white/55">
          {fp.year}. {String(fp.month).padStart(2, "0")}.{" "}
          {String(fp.day).padStart(2, "0")}
        </p>
      )}
      <a
        href="/"
        className="mt-9 inline-block text-[10px] tracking-wider text-white/35 transition hover:text-white/60"
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

      <Footer data={data} t={t} fp={fp} />
    </div>
  );
}

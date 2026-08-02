"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import InvitationView from "./InvitationView";
import AuthStatus from "./AuthStatus";
import KakaoShareButton from "./KakaoShareButton";
import AddressSearch from "./AddressSearch";
import {
  getTemplatesByCategory,
  findTheme,
  FONTS,
  TITLE_FONTS,
  type FontOption,
} from "@/lib/templates";
import { getCategoryLabels } from "@/lib/categories";
import { fileToCompressedBlob } from "@/lib/image";
import {
  emptyInvitation,
  normalizeData,
  BABY_GENDERS,
  CATEGORY_IDS,
  DIVIDERS,
  DOL_KINDS,
  FONT_SCALES,
  HERO_MOTIONS,
  MAX_GALLERY,
  SENIOR_AGES,
  dolGreetingMessage,
  dolGreetingTitle,
  expiryDateLabel,
  isSamplePhoto,
  seniorGreetingTitle,
  type Account,
  type Category,
  type DolKind,
  type InvitationData,
  type TemplateId,
} from "@/lib/types";

/* ───────── 이미지 업로드 ───────── */
// 사진이 올라가는 동안 도는 표시 (업로드가 길어질 때 멈춘 것처럼 보이지 않게)
function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="사진 올리는 중"
      className={`${className} animate-spin rounded-full border-2 border-gold-100 border-t-gold-400`}
    />
  );
}

// 클라이언트에서 압축 → 서버 업로드 → 저장은 URL만
async function uploadPhoto(file: File): Promise<string> {
  const blob = await fileToCompressedBlob(file);
  const form = new FormData();
  form.append("file", blob, "photo.jpg");
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "업로드에 실패했습니다.");
  return json.url as string;
}

function ImageUpload({
  value,
  onChange,
  label,
  className = "h-40",
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadPhoto(file));
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "이미지를 처리하지 못했습니다. 다른 파일을 시도해 주세요."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label
        className={`relative flex ${className} w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400 transition hover:border-gold-300`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{label}</span>
        )}
        {/* 이미 올린 사진을 바꾸는 중에도 보이도록 위에 덮는다 */}
        {busy && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/70">
            <Spinner />
            <span className="text-xs text-gray-500">올리는 중...</span>
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-1.5 text-xs text-gray-400 hover:text-gray-600"
        >
          사진 삭제
        </button>
      )}
    </div>
  );
}

/* ───────── 은행 선택 ───────── */
// 많이 쓰는 은행만 추린 목록 — 여기 없으면 직접 입력으로 넣는다
const BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "새마을금고",
  "우체국",
  "신협",
  "수협",
  "SC제일은행",
  "부산은행",
  "대구은행",
  "경남은행",
  "광주은행",
  "전북은행",
  "제주은행",
];
const BANK_CUSTOM = "__custom__";

function BankPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // "직접 입력"을 고르면 아직 아무것도 안 적었어도 입력칸이 떠 있어야 한다
  const [manual, setManual] = useState(false);
  const known = BANKS.includes(value);
  const showInput = manual || (!!value && !known);

  return (
    <div className="space-y-2">
      <select
        value={showInput ? BANK_CUSTOM : known ? value : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === BANK_CUSTOM) {
            setManual(true);
            onChange("");
          } else {
            setManual(false);
            onChange(v);
          }
        }}
        className={SELECT_CLASS}
      >
        <option value="" disabled>
          은행 선택
        </option>
        {BANKS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
        <option value={BANK_CUSTOM}>직접 입력</option>
      </select>
      {showInput && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="은행 이름을 입력해 주세요"
          className={INPUT_CLASS}
        />
      )}
    </div>
  );
}

/* ───────── 시간 선택 ───────── */
// 저장은 지금까지와 같은 문자열 그대로 ("오후 1시", "오후 1시 30분")
const MERIDIEMS = ["오전", "오후"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 10, 20, 30, 40, 50];

function parseTime(v: string) {
  const m = v.match(/(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  if (!m) return { meridiem: "오후", hour: 1, minute: 0 };
  return { meridiem: m[1], hour: Number(m[2]), minute: Number(m[3] ?? 0) };
}

const formatTime = (meridiem: string, hour: number, minute: number) =>
  minute === 0 ? `${meridiem} ${hour}시` : `${meridiem} ${hour}시 ${minute}분`;

function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const cur = parseTime(value);
  // 예전에 직접 적어 둔 값이 목록에 없을 수 있으니 그 분도 함께 보여 준다
  const minutes = MINUTES.includes(cur.minute)
    ? MINUTES
    : [...MINUTES, cur.minute].sort((a, b) => a - b);

  const cls = `${SELECT_CLASS} min-w-0`;
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-gray-500">시간</span>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={cur.meridiem}
          onChange={(e) => onChange(formatTime(e.target.value, cur.hour, cur.minute))}
          className={cls}
        >
          {MERIDIEMS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={cur.hour}
          onChange={(e) =>
            onChange(formatTime(cur.meridiem, Number(e.target.value), cur.minute))
          }
          className={cls}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}시
            </option>
          ))}
        </select>
        <select
          value={cur.minute}
          onChange={(e) =>
            onChange(formatTime(cur.meridiem, cur.hour, Number(e.target.value)))
          }
          className={cls}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}분
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ───────── 연락처 (칸 - 칸 - 칸) ───────── */
// 저장은 지금까지와 같은 "010-0000-0000" 문자열이라 기존 초대장도 그대로 열린다
function splitPhone(v: string): [string, string, string] {
  const raw = (v ?? "").trim();
  if (raw.includes("-")) {
    const p = raw.split("-");
    return [p[0] ?? "", p[1] ?? "", p[2] ?? ""].map((s) =>
      s.replace(/\D/g, "")
    ) as [string, string, string];
  }
  // 하이픈 없이 저장된 값도 자연스럽게 나눠 준다
  const d = raw.replace(/\D/g, "");
  if (d.length <= 3) return [d, "", ""];
  if (d.length <= 7) return [d.slice(0, 3), d.slice(3), ""];
  return [d.slice(0, 3), d.slice(3, d.length - 4), d.slice(-4)];
}

function joinPhone(parts: string[]) {
  const t = [...parts];
  while (t.length && t[t.length - 1] === "") t.pop(); // "010--" 같은 꼴 방지
  return t.join("-");
}

function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const parts = splitPhone(value);
  const max = [3, 4, 4];
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const setPart = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, max[i]);
    const next = [...parts];
    next[i] = digits;
    onChange(joinPhone(next));
    // 칸이 다 차면 다음 칸으로 옮겨 준다
    if (digits.length === max[i] && i < 2) boxes.current[i + 1]?.focus();
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-gray-500">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {parts.map((p, i) => (
          <div key={i} className="flex min-w-0 flex-1 items-center gap-1.5">
            <input
              ref={(el) => {
                boxes.current[i] = el;
              }}
              value={p}
              onChange={(e) => setPart(i, e.target.value)}
              inputMode="numeric"
              maxLength={max[i]}
              placeholder={i === 0 ? "010" : "0000"}
              className={`${INPUT_CLASS} min-w-0 px-2 text-center`}
            />
            {i < 2 && <span className="text-gray-300">-</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── 작은 입력 컴포넌트 ───────── */
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    // min-w-0 이 없으면 날짜 입력처럼 고유 폭이 큰 칸이 grid 칸을 밀어내
    // 옆 칸과 겹친다 (grid 항목의 기본값이 min-width:auto 라서)
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-gray-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      />
    </label>
  );
}

// 만료일 표시용 (예: 2026년 9월 26일)
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

// 공통 입력 스타일
const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm text-gray-800 transition placeholder:text-gray-300 focus:border-gold-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-100";

// 선택 상자 — 기본 화살표 대신 오른쪽에서 조금 안쪽에 직접 그린다 (globals.css)
const SELECT_CLASS = `${INPUT_CLASS} inv-select`;

function Group({
  title,
  step,
  previewSection,
  children,
}: {
  title: string;
  step?: number;
  // 이 칸을 채우고 있을 때 미리보기가 보여 줄 초대장 섹션
  // (InvitationView 의 data-inv-section 과 같은 값, "top"이면 맨 위)
  previewSection?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-form-section={previewSection}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
    >
      <div className="mb-4 flex items-center gap-2.5">
        {step !== undefined && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-50 text-[11px] font-semibold text-gold-400">
            {step}
          </span>
        )}
        <h3 className="text-sm font-semibold tracking-tight text-gray-800">
          {title}
        </h3>
      </div>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

/* ───────── 폼 ↔ 미리보기 스크롤 맞추기 ───────── */
// 모바일 미니 미리보기 — 390px 폭으로 그린 뒤 상자 크기로 줄여 보여 준다
const MINI_W = 126;
const MINI_H = 182;
const MINI_CONTENT_W = 390;
const MINI_SCALE = MINI_W / MINI_CONTENT_W;

/**
 * 폼에서 지금 보고 있는 단계에 맞춰 미리보기도 그 대목으로 옮긴다.
 * (신랑·신부 칸을 보고 있으면 미리보기도 두 사람이 나오는 자리로)
 *
 * 단계가 "바뀔 때만" 움직인다. 스크롤할 때마다 따라 움직이면 미리보기를
 * 직접 넘겨 보려는 사람과 서로 밀어내게 된다.
 *
 * 반환값은 미니 미리보기를 끌어올릴 거리(초대장 기준 px). 미니 쪽은
 * 스크롤 상자가 아니라 축소해 놓은 그림이라 transform 으로 옮겨야 한다.
 */
function usePreviewSync(
  desk: React.RefObject<HTMLDivElement | null>,
  mini: React.RefObject<HTMLDivElement | null>
) {
  const [miniShift, setMiniShift] = useState(0);

  useEffect(() => {
    // 초대장 맨 위에서 그 섹션까지의 거리. 지금 어디까지 내려와 있든 같은 값이
    // 나와야 해서(=절대 위치) 스크롤 상자면 scrollTop 을 더해 준다.
    const offsetIn = (box: HTMLElement, key: string, scale = 1) => {
      if (key === "top") return 0;
      const el = box.querySelector<HTMLElement>(`[data-inv-section="${key}"]`);
      if (!el) return null;
      return (
        (el.getBoundingClientRect().top - box.getBoundingClientRect().top) / scale +
        box.scrollTop
      );
    };

    const move = (key: string) => {
      const box = desk.current;
      if (box) {
        const top = offsetIn(box, key);
        if (top !== null) {
          box.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
        }
      }
      const small = mini.current;
      if (small) {
        const top = offsetIn(small, key, MINI_SCALE);
        if (top !== null) {
          // 아래쪽 섹션이라도 빈 여백만 보이지 않게 끝을 넘지 않는다
          const max = Math.max(0, small.offsetHeight - MINI_H / MINI_SCALE);
          setMiniShift(Math.min(Math.max(0, top - 6), max));
        }
      }
    };

    let current = "";
    let raf = 0;
    const sync = () => {
      raf = 0;
      // 화면 위쪽 1/3 선을 지난 마지막 단계를 "지금 보고 있는 곳"으로 본다
      const line = window.innerHeight * 0.33;
      let active = "";
      document
        .querySelectorAll<HTMLElement>("[data-form-section]")
        .forEach((g) => {
          if (g.getBoundingClientRect().top <= line) {
            active = g.dataset.formSection ?? "";
          }
        });
      if (!active || active === current) return;
      current = active;
      move(active);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // 첫 위치도 맞춰 둔다 (effect 안에서 바로 setState 하지 않도록 한 박자 뒤)
    raf = requestAnimationFrame(sync);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [desk, mini]);

  return miniShift;
}

function FontPicker({
  value,
  onChange,
  // 메인 타이틀처럼 일부 서체만 보여줘야 하는 곳에서 목록을 좁혀 쓴다
  options = FONTS,
}: {
  value: string;
  onChange: (id: string) => void;
  options?: FontOption[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((f) => {
        const selected = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={`rounded-lg border-2 px-2 py-2.5 text-center text-base text-gray-800 transition ${
              selected
                ? "border-gold-400 bg-gold-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            style={{ fontFamily: f.family || undefined }}
          >
            {f.name}
          </button>
        );
      })}
    </div>
  );
}

export default function EditorClient({
  editSlug,
  initialTemplate,
  initialData,
}: {
  // 수정 모드: 기존 청첩장 slug + 저장된 내용
  editSlug?: string;
  initialTemplate?: TemplateId;
  initialData?: InvitationData;
} = {}) {
  const params = useSearchParams();
  const isEdit = Boolean(editSlug);
  // 신규 제작 시 초대장 종류 결정 (수정 모드는 기존 데이터의 category를 따름).
  // 템플릿을 지정해 들어왔다면 그 템플릿이 속한 종류를 우선한다.
  const categoryParam = params.get("category") as Category | null;
  const category: Category =
    initialData?.category ??
    findTheme(params.get("template"))?.category ??
    (categoryParam && CATEGORY_IDS.includes(categoryParam) ? categoryParam : "wedding");
  // 이 카테고리 전용 템플릿만 선택 가능
  const catTemplates = getTemplatesByCategory(category);

  const [template, setTemplate] = useState<TemplateId>(() => {
    // 수정 모드는 저장된 템플릿 그대로, 신규는 URL 값이 이 카테고리 것일 때만 사용
    if (initialTemplate) return initialTemplate;
    const fromUrl = params.get("template") as TemplateId | null;
    return fromUrl && catTemplates.some((t) => t.id === fromUrl)
      ? fromUrl
      : catTemplates[0].id;
  });
  const [data, setData] = useState<InvitationData>(() =>
    initialData ? normalizeData(initialData) : emptyInvitation(category)
  );
  // 칠순 카테고리는 선택한 연세(70/80/90/100)에 따라 문구가 바뀜
  const labels = getCategoryLabels(category, data.seniorAge, data.dolKind);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false); // 제작 전 확인 모달
  const [showPreview, setShowPreview] = useState(false); // 모바일 전체화면 미리보기
  // 갤러리 여러 장 업로드 진행 상황 (null이면 진행 중 아님)
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [resultExpires, setResultExpires] = useState<string | null>(null); // 발급된 만료일
  const [photoWarn, setPhotoWarn] = useState(false); // 대표 사진 미등록 경고
  const photoSectionRef = useRef<HTMLDivElement>(null);

  // 폼을 내리면 미리보기도 같은 대목으로 따라온다
  const deskPreviewRef = useRef<HTMLDivElement>(null);
  const miniPreviewRef = useRef<HTMLDivElement>(null);
  const miniShift = usePreviewSync(deskPreviewRef, miniPreviewRef);

  // 예시 사진 그대로거나 비어있으면 본인 대표 사진 등록 필요
  const needMainPhoto = !data.mainPhotoUrl || isSamplePhoto(data.mainPhotoUrl);

  // 게시 종료일 — 고르는 게 아니라 행사 다음 날로 자동 결정
  const expiryDate = expiryDateLabel(data.weddingDate);

  function openConfirm() {
    if (needMainPhoto) {
      setPhotoWarn(true);
      photoSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setError(null);
    setConfirming(true);
  }

  const set = <K extends keyof InvitationData>(
    key: K,
    value: InvitationData[K]
  ) => setData((d) => ({ ...d, [key]: value }));

  // 연세를 바꾸면 기본 인사말 제목도 따라감 (직접 고쳐 쓴 제목은 그대로 둠)
  const setSeniorAge = (age: number) =>
    setData((d) => ({
      ...d,
      seniorAge: age,
      greetingTitle:
        d.greetingTitle === seniorGreetingTitle(d.seniorAge)
          ? seniorGreetingTitle(age)
          : d.greetingTitle,
    }));

  // 백일/돌을 바꾸면 기본 인사말 제목도 따라감 (직접 고쳐 쓴 제목은 그대로 둠)
  const setDolKind = (kind: DolKind) =>
    setData((d) => ({
      ...d,
      dolKind: kind,
      greetingTitle:
        d.greetingTitle === dolGreetingTitle(d.dolKind)
          ? dolGreetingTitle(kind)
          : d.greetingTitle,
      greetingMessage:
        d.greetingMessage === dolGreetingMessage(d.dolKind)
          ? dolGreetingMessage(kind)
          : d.greetingMessage,
    }));

  const setAccount = (i: number, patch: Partial<Account>) =>
    setData((d) => ({
      ...d,
      accounts: d.accounts.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }));

  const addAccount = () =>
    setData((d) => ({
      ...d,
      accounts: [
        ...d.accounts,
        { side: "신랑측", name: "", bank: "", number: "" },
      ],
    }));

  const removeAccount = (i: number) =>
    setData((d) => ({
      ...d,
      accounts: d.accounts.filter((_, idx) => idx !== i),
    }));

  const setGallery = (i: number, url: string) =>
    setData((d) => ({
      ...d,
      gallery: d.gallery.map((g, idx) => (idx === i ? url : g)),
    }));
  const removeGallery = (i: number) =>
    setData((d) => ({ ...d, gallery: d.gallery.filter((_, idx) => idx !== i) }));

  // 갤러리 여러 장 한 번에 담기 — 폰 사진첩에서 여러 장을 골라 올릴 수 있게.
  // 한 장씩 순서대로 올려 진행 상황을 보여 준다.
  async function addGalleryFiles(list: FileList | null) {
    const files = list ? [...list] : [];
    if (files.length === 0) return;

    // 빈 슬롯은 자리를 차지하지 않는다 — 실제 담긴 사진만 센다
    const room = MAX_GALLERY - data.gallery.filter(Boolean).length;
    if (room <= 0) {
      alert(`갤러리는 최대 ${MAX_GALLERY}장까지 담을 수 있어요.`);
      return;
    }
    const picked = files.slice(0, room);

    setBulk({ done: 0, total: picked.length });
    try {
      const urls: string[] = [];
      for (const f of picked) {
        urls.push(await uploadPhoto(f));
        setBulk({ done: urls.length, total: picked.length });
      }
      setData((d) => ({
        ...d,
        gallery: [...d.gallery.filter(Boolean), ...urls].slice(0, MAX_GALLERY),
      }));
      if (files.length > picked.length) {
        alert(
          `갤러리는 최대 ${MAX_GALLERY}장이라 ${picked.length}장만 담았어요.`
        );
      }
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "이미지를 처리하지 못했습니다. 다른 파일을 시도해 주세요."
      );
    } finally {
      setBulk(null);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      // 수정 모드는 PATCH, 신규는 POST (게시 종료일은 서버가 행사일로 계산)
      const res = await fetch(
        isEdit ? `/api/invitations/${editSlug}` : "/api/invitations",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? { template, data }
              : { template, data }
          ),
        }
      );
      const json = await res.json();
      if (res.status === 401) {
        // 로그인 필요 → 로그인 후 에디터로 복귀
        const next = isEdit ? `/editor?edit=${editSlug}` : "/editor";
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }
      if (json.code === "LIMIT_REACHED") {
        // 계정당 1개 제한 → 마이페이지에서 안내
        window.location.href = "/my?notice=limit";
        return;
      }
      if (!res.ok) throw new Error(json.error || "저장에 실패했습니다.");
      const url = `${window.location.origin}/v/${json.slug}`;
      setConfirming(false);
      setResultExpires(json.expiresAt ?? null);
      setResult(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-cream text-gray-800">
      {/* 상단 네비 — 화이트 + 골드 헤어라인 */}
      <header className="sticky top-0 z-40 border-b border-gold-200/50 bg-white/85 shadow-[0_1px_14px_rgba(198,162,63,0.10)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 transition hover:text-gold-500"
          >
            <span aria-hidden>←</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              className="h-6 w-6 rounded-full shadow-sm"
            />
            <span
              className="text-ink"
              style={{ fontFamily: "var(--font-song)" }}
            >
              별빛 초대장
            </span>
          </Link>
          <AuthStatus />
        </div>
      </header>

    <div className="mx-auto grid max-w-6xl gap-8 p-4 md:grid-cols-2 md:p-8">
      {/* 폼 */}
      <div className="space-y-4">
        <div className="mb-1">
          <p className="font-cormorant text-sm tracking-[0.4em] text-gold-400">
            {isEdit ? "EDIT YOUR INVITATION" : "CREATE YOUR INVITATION"}
          </p>
          <h1
            className="mt-2 text-[2rem] leading-tight tracking-tight text-gray-900"
            style={{ fontFamily: "var(--font-song)" }}
          >
            {isEdit ? `${labels.editorTitle.replace("만들기", "수정하기")}` : labels.editorTitle}
          </h1>
          <p
            className="mt-2 text-sm text-gray-400"
            style={{ fontFamily: "var(--font-gowun)" }}
          >
            {isEdit
              ? `수정 내용은 저장 즉시 ${labels.noun}에 반영돼요.`
              : "입력한 내용이 미리보기에 실시간으로 반영돼요."}
          </p>
        </div>

        <Group title="메인" step={1} previewSection="top">
          <div className="grid grid-cols-2 gap-3">
            {catTemplates.map((t) => {
              const selected = template === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className="rounded-xl border-2 px-3 py-3 text-left text-sm transition"
                  style={{
                    borderColor: selected ? t.accent : "#e5e7eb",
                    background: selected ? t.accentSoft : "#fff",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full"
                      style={{ background: t.swatch }}
                    />
                    <span className="font-semibold text-gray-800">
                      {t.name}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {t.description}
                  </span>
                </button>
              );
            })}
          </div>
          {/* 섹션 사이 구분선 — 모양을 미리 보여 주고 고르게 한다 */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              구분선 디자인
            </span>
            {/* 자리를 적게 차지하도록 한 줄에 모두 둔다 */}
            <div className="grid grid-cols-5 gap-1.5">
              {DIVIDERS.map((v) => {
                const selected = data.dividerStyle === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => set("dividerStyle", v.id)}
                    className={`min-w-0 rounded-lg border-2 px-1 py-2 text-center transition ${
                      selected
                        ? "border-gold-400 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="block whitespace-nowrap text-[11px] font-medium text-gray-800">
                      {v.label}
                    </span>
                    {/* 고르기 전에 모양을 알 수 있게 실제 모습을 작게 보여 준다.
                        종류마다 실제 초대장과 같은 모습이어야 한다. */}
                    <span className="mt-1 flex h-3 items-center justify-center gap-1 text-gold-400">
                      {v.id === "diamond" && (
                        <>
                          <span className="h-px w-2.5 bg-gray-300" />
                          <span className="h-[3px] w-[3px] shrink-0 rotate-45 bg-gold-400" />
                          <span className="h-px w-2.5 bg-gray-300" />
                        </>
                      )}
                      {v.id === "line" && (
                        <span className="h-px w-full bg-gray-300" />
                      )}
                      {v.id === "dots" && (
                        <span className="text-[5px] tracking-[0.4em]">●●●</span>
                      )}
                      {v.id === "flower" && (
                        <span className="text-[12px] leading-none">❀</span>
                      )}
                      {/* "없음"은 예시도 두지 않는다 */}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div ref={photoSectionRef}>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              대표 사진 <span className="text-gold-400">*필수</span>
            </span>
            <div
              className={
                photoWarn && needMainPhoto
                  ? "rounded-xl ring-2 ring-red-400 ring-offset-2"
                  : undefined
              }
            >
              <ImageUpload
                value={needMainPhoto ? "" : data.mainPhotoUrl}
                onChange={(url) => {
                  set("mainPhotoUrl", url);
                  if (url) setPhotoWarn(false);
                }}
                label="클릭해서 대표 사진 업로드 (필수)"
                className="h-52"
              />
            </div>
            {photoWarn && needMainPhoto && (
              <p className="mt-1.5 text-xs font-medium text-red-500">
                미리보기에 보이는 사진은 예시예요.{" "}
                {labels.showPerson2 ? "두 분의" : "직접 찍은"} 사진을 올려
                주세요.
              </p>
            )}
          </div>
          {/* 대표 사진 모션 — 템플릿과 함께 고르는 첫인상 연출 */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              대표 사진 모션
            </span>
            <div className="grid grid-cols-2 gap-2">
              {HERO_MOTIONS.map((m) => {
                const selected = data.heroMotion === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => set("heroMotion", m.id)}
                    className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                      selected
                        ? "border-gold-400 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-800">
                      {m.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Group>

        <Group title="글꼴" step={2} previewSection="top">
          <div>
            <span className="mb-2 block text-xs font-medium text-gray-500">
              메인 글꼴 · 제목/이름
            </span>
            <FontPicker
              value={data.fontHeading}
              onChange={(id) => set("fontHeading", id)}
            />
          </div>
          <div>
            <span className="mb-2 block text-xs font-medium text-gray-500">
              서브 글꼴 · 본문
            </span>
            <FontPicker
              value={data.fontBody}
              onChange={(id) => set("fontBody", id)}
            />
          </div>
          <div>
            <span className="mb-2 block text-xs font-medium text-gray-500">
              글꼴 크기
            </span>
            <div className="grid grid-cols-4 gap-2">
              {FONT_SCALES.map((s) => {
                const selected = data.fontScale === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("fontScale", s.value)}
                    aria-pressed={selected}
                    className={`rounded-xl border-2 px-2 py-2.5 text-center transition ${
                      selected
                        ? "border-gold-400 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* 배율을 글자 크기로 그대로 보여줘 고르기 전에 감을 잡게 함 */}
                    <span
                      className="block font-medium text-gray-800"
                      style={{ fontSize: `${s.value}rem` }}
                    >
                      가
                    </span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              사진과 여백은 그대로 두고 글자 크기만 조절돼요.
            </p>
          </div>
        </Group>

        <Group title={labels.groupTitle} step={3} previewSection="couple">
          {/* 칠순 · 팔순 · 구순 · 백수 선택 — 초대장 문구가 통째로 바뀜 */}
          {category === "senior" && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                어떤 잔치인가요?
              </span>
              <div className="grid grid-cols-4 gap-2">
                {SENIOR_AGES.map((s) => {
                  const selected = data.seniorAge === s.age;
                  return (
                    <button
                      key={s.age}
                      type="button"
                      onClick={() => setSeniorAge(s.age)}
                      className={`rounded-xl border-2 px-2 py-2.5 text-center transition ${
                        selected
                          ? "border-gold-400 bg-gold-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-gray-800">
                        {s.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        {s.age}세
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* 백일잔치 · 돌잔치 선택 — 초대장 문구가 통째로 바뀜 */}
          {category === "doljanchi" && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                어떤 잔치인가요?
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DOL_KINDS.map((k) => {
                  const selected = data.dolKind === k.id;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setDolKind(k.id)}
                      aria-pressed={selected}
                      className={`rounded-xl border-2 px-2 py-2.5 text-center transition ${
                        selected
                          ? "border-gold-400 bg-gold-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-gray-800">
                        {k.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        {k.occasion}을 축하해요
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className={labels.showPerson2 ? "grid grid-cols-2 gap-3" : ""}>
            <Field
              label={labels.personLabel}
              value={data.groomName}
              onChange={(v) => set("groomName", v)}
            />
            {labels.showPerson2 && (
              <Field
                label={labels.person2Label}
                value={data.brideName}
                onChange={(v) => set("brideName", v)}
              />
            )}
          </div>
          {/* 맨 위에 크게 들어가는 이름이라, 적는 칸 바로 아래에서 글꼴을 고른다 */}
          {category === "birthday" && (
            <div>
              <span className="mb-2 block text-xs font-medium text-gray-500">
                메인 타이틀 글꼴
              </span>
              <FontPicker
                value={data.titleFont}
                onChange={(id) => set("titleFont", id)}
                options={TITLE_FONTS}
              />
              <p className="mt-1.5 text-[11px] text-gray-400">
                맨 위에 크게 들어가는 이름에만 적용돼요.
              </p>
            </div>
          )}
          {/* 아기 성별 — 초대장에서 이름 옆에 함께 표시 */}
          {category === "doljanchi" && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                성별 (이름 옆에 표시돼요)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BABY_GENDERS.map((g) => {
                  const selected = data.babyGender === g.id;
                  return (
                    <button
                      key={g.id || "none"}
                      type="button"
                      onClick={() => set("babyGender", g.id)}
                      aria-pressed={selected}
                      className={`rounded-xl border-2 px-2 py-2.5 text-center text-sm font-semibold transition ${
                        selected
                          ? "border-gold-400 bg-gold-50 text-gray-800"
                          : "border-gray-200 text-gray-800 hover:border-gray-300"
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className={labels.showPerson2 ? "grid grid-cols-2 gap-3" : ""}>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                {labels.photo1Label}
              </span>
              <ImageUpload
                value={data.groomPhotoUrl}
                onChange={(url) => set("groomPhotoUrl", url)}
                label={labels.photo1Label}
                className="h-28"
              />
            </div>
            {labels.showPerson2 && (
              <div>
                <span className="mb-1.5 block text-xs font-medium text-gray-500">
                  {labels.photo2Label}
                </span>
                <ImageUpload
                  value={data.bridePhotoUrl}
                  onChange={(url) => set("bridePhotoUrl", url)}
                  label={labels.photo2Label}
                  className="h-28"
                />
              </div>
            )}
          </div>
          {/* 연락처는 칸이 세 개라 좁은 화면에서 나란히 두면 눌린다 */}
          {labels.showContact && (
            <div className="space-y-3.5">
              <PhoneField
                label={labels.contact1Label}
                value={data.groomPhone}
                onChange={(v) => set("groomPhone", v)}
              />
              {labels.showPerson2 && (
                <PhoneField
                  label={labels.contact2Label}
                  value={data.bridePhone}
                  onChange={(v) => set("bridePhone", v)}
                />
              )}
            </div>
          )}
          {labels.showParents && (
            <div className="grid grid-cols-2 gap-3">
              {labels.showPerson2 ? (
                <>
                  <Field
                    label="신랑 아버지"
                    value={data.groomFather}
                    onChange={(v) => set("groomFather", v)}
                    placeholder="(선택)"
                  />
                  <Field
                    label="신랑 어머니"
                    value={data.groomMother}
                    onChange={(v) => set("groomMother", v)}
                    placeholder="(선택)"
                  />
                  <Field
                    label="신부 아버지"
                    value={data.brideFather}
                    onChange={(v) => set("brideFather", v)}
                    placeholder="(선택)"
                  />
                  <Field
                    label="신부 어머니"
                    value={data.brideMother}
                    onChange={(v) => set("brideMother", v)}
                    placeholder="(선택)"
                  />
                </>
              ) : (
                <>
                  <Field
                    label={labels.parent1Label}
                    value={data.groomFather}
                    onChange={(v) => set("groomFather", v)}
                    placeholder="(선택)"
                  />
                  <Field
                    label={labels.parent2Label}
                    value={data.groomMother}
                    onChange={(v) => set("groomMother", v)}
                    placeholder="(선택)"
                  />
                </>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400">
            사진을 올리면 프로필 섹션이 생겨요.
            {labels.showContact &&
              " 연락처를 입력하면 이름 옆에 전화·문자 버튼이 붙어요."}
            {labels.showParents && " 부모님 성함은 비우면 표시되지 않아요."}
          </p>
        </Group>

        <Group title={labels.dateSectionTitle} step={4} previewSection="date">
          {/* 좁은 화면에서 날짜 칸이 눌리지 않도록 한 줄씩 둔다 */}
          <Field
            label={labels.dateFieldLabel}
            type="date"
            value={data.weddingDate}
            onChange={(v) => set("weddingDate", v)}
          />
          <TimePicker
            value={data.weddingTime}
            onChange={(v) => set("weddingTime", v)}
          />
          <Field
            label={labels.venueLabel}
            value={data.venueName}
            onChange={(v) => set("venueName", v)}
          />
          <Field
            label="홀 / 층"
            value={data.venueHall}
            onChange={(v) => set("venueHall", v)}
          />
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              주소
            </span>
            <div className="flex flex-wrap items-start gap-2">
              <input
                value={data.venueAddress}
                onChange={(e) => set("venueAddress", e.target.value)}
                placeholder="주소 검색으로 채워 주세요"
                className={`${INPUT_CLASS} min-w-0 flex-1`}
              />
              <AddressSearch
                onSelect={(addr) => set("venueAddress", addr)}
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              검색으로 넣으면 초대장 지도와 길찾기가 정확하게 잡혀요.
            </p>
          </div>
          <p className="text-xs text-gray-400">
            {expiryDate
              ? `${expiryDate}에 링크가 닫히고 사진까지 완전히 삭제돼요.`
              : "행사 다음 날 링크가 닫히고 사진까지 완전히 삭제돼요."}{" "}
            사진은 미리 따로 보관해 주세요.
          </p>
        </Group>

        <Group title="인사말" step={5} previewSection="greeting">
          <Field
            label="제목"
            value={data.greetingTitle}
            onChange={(v) => set("greetingTitle", v)}
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              내용
            </span>
            <textarea
              value={data.greetingMessage}
              onChange={(e) => set("greetingMessage", e.target.value)}
              rows={5}
              className={`${INPUT_CLASS} leading-7`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              맺음말 · 맨 아래 문구 (선택)
            </span>
            <textarea
              value={data.footerMessage}
              onChange={(e) => set("footerMessage", e.target.value)}
              rows={2}
              placeholder={
                labels.showPerson2
                  ? "비워두면 두 분의 이름과 날짜가 표시돼요"
                  : "비워두면 이름과 날짜가 표시돼요"
              }
              className={`${INPUT_CLASS} leading-7`}
            />
          </label>
        </Group>

        <Group title="갤러리" step={6} previewSection="gallery">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              갤러리 사진{" "}
              <span className="text-gray-400">
                ({data.gallery.filter(Boolean).length}/{MAX_GALLERY})
              </span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* 빈 슬롯은 두지 않는다. 예전에는 빈 슬롯이 한 장짜리 업로드라,
                  여러 장 담기 타일보다 먼저 눈에 띄어 한 장씩만 올리게 됐다. */}
              {data.gallery.map((g, i) =>
                g ? (
                  <ImageUpload
                    key={i}
                    value={g}
                    onChange={(url) => {
                      if (url) setGallery(i, url);
                      else removeGallery(i);
                    }}
                    label="사진 추가"
                    className="h-24"
                  />
                ) : null
              )}
              {data.gallery.filter(Boolean).length < MAX_GALLERY && (
                // 폰 사진첩에서 여러 장을 한 번에 고를 수 있다
                <label className="relative flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-300 transition hover:border-gold-300 hover:text-gold-400">
                  {bulk ? (
                    // 사진이 다 올라갈 때까지 돌아가는 표시
                    <>
                      <Spinner />
                      <span className="mt-1 text-[11px] font-medium text-gold-400">
                        {bulk.done}/{bulk.total}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl leading-none">+</span>
                      <span className="mt-1 text-[11px]">사진 추가</span>
                    </>
                  )}
                  {/* display:none 으로 숨기면 아이폰에서 사진첩이 열리지 않는다.
                      위 ImageUpload 와 같이 투명하게 덮어 두는 방식을 쓴다. */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={!!bulk}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                      addGalleryFiles(e.target.files);
                      e.target.value = ""; // 같은 사진을 다시 골라도 반응하도록
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            갤러리는 최대 {MAX_GALLERY}장까지 추가할 수 있어요. 사진첩에서 여러
            장을 한 번에 고를 수 있고, 업로드한 사진은 자동으로 압축되어
            저장됩니다.
          </p>
        </Group>

        {/* 생일은 축하금을 받는 자리가 아니라 계좌 단계를 두지 않는다 */}
        {labels.showAccounts && (
        <Group title={labels.accountsGroupTitle} step={7} previewSection="accounts">
          <div className="space-y-3">
            {data.accounts.map((a, i) => (
              <div
                key={i}
                className="space-y-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5"
              >
                <div className="flex items-center gap-2">
                  {labels.showPerson2 && (
                    <select
                      value={a.side}
                      onChange={(e) =>
                        setAccount(i, { side: e.target.value as Account["side"] })
                      }
                      className="inv-select rounded-lg border border-gray-200 bg-white py-1.5 pl-2.5 text-sm text-gray-700"
                    >
                      <option value="신랑측">신랑측</option>
                      <option value="신부측">신부측</option>
                    </select>
                  )}
                  <button
                    onClick={() => removeAccount(i)}
                    className="ml-auto text-xs text-gray-400 hover:text-gold-400"
                  >
                    삭제
                  </button>
                </div>
                <BankPicker
                  value={a.bank}
                  onChange={(bank) => setAccount(i, { bank })}
                />
                <input
                  value={a.number}
                  onChange={(e) => setAccount(i, { number: e.target.value })}
                  placeholder="계좌번호"
                  className={INPUT_CLASS}
                />
                <input
                  value={a.name}
                  onChange={(e) => setAccount(i, { name: e.target.value })}
                  placeholder="예금주"
                  className={INPUT_CLASS}
                />
              </div>
            ))}
          </div>
          <button
            onClick={addAccount}
            className="mt-3 w-full rounded-xl border border-dashed border-gold-200 py-2.5 text-sm font-medium text-gold-400 transition hover:bg-gold-50"
          >
            + 계좌 추가
          </button>
        </Group>
        )}

        <button
          onClick={openConfirm}
          className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-base font-semibold text-white shadow-lg shadow-gold-300/50 transition hover:from-gold-500 hover:to-gold-600"
        >
          {isEdit ? "수정 내용 저장하기" : `${labels.noun} 제작하기`}
        </button>
        {photoWarn && needMainPhoto ? (
          <p className="text-center text-sm font-medium text-red-500">
            대표 사진을 등록해 주세요. 지금 보이는 사진은 예시용이에요.
          </p>
        ) : (
          <p className="text-center text-xs text-gray-400">
            {isEdit
              ? "저장 전에 미리보기로 한 번 더 확인할 수 있어요."
              : "제작 전에 미리보기로 한 번 더 확인할 수 있어요."}
          </p>
        )}
      </div>

      {/* 실시간 미리보기 — 데스크톱(사이드 고정) */}
      <div className="hidden md:sticky md:top-8 md:block md:h-[calc(100vh-4rem)]">
        <p className="mb-3 text-center font-cormorant text-xs tracking-[0.35em] text-gray-400">
          LIVE PREVIEW
        </p>
        <div className="mx-auto h-full max-w-[380px] overflow-hidden rounded-[2rem] border-8 border-gray-800 shadow-xl">
          <div ref={deskPreviewRef} className="h-full overflow-y-auto">
            <InvitationView template={template} data={data} preview />
          </div>
        </div>
      </div>

      {/* 미리보기 — 모바일(우상단 미니, 탭하면 확대) */}
      <div
        className="fixed right-3 top-16 z-40 overflow-hidden rounded-xl border-2 border-gray-800 bg-white shadow-lg md:hidden"
        style={{ width: MINI_W, height: MINI_H }}
      >
        {/* 축소된 실시간 미리보기 (클릭은 위 오버레이가 처리).
            translateY 는 scale 안쪽이라 초대장 기준 거리를 그대로 쓰면 된다. */}
        <div
          ref={miniPreviewRef}
          className="pointer-events-none"
          style={{
            width: MINI_CONTENT_W,
            transformOrigin: "top left",
            transform: `scale(${MINI_SCALE}) translateY(${-miniShift}px)`,
            transition: "transform 0.4s ease",
          }}
        >
          <InvitationView template={template} data={data} preview />
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          aria-label="미리보기 크게 보기"
          className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/55 via-transparent to-transparent pb-1.5 text-xs font-medium text-white"
        >
          🔍 미리보기
        </button>
      </div>

      {/* 완료 모달 */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-2xl">
              💌
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              {isEdit ? "수정이 완료됐어요!" : `${labels.noun}이 완성됐어요!`}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isEdit
                ? `수정 내용이 ${labels.noun}에 반영됐어요. 링크는 그대로예요.`
                : "아래 링크를 공유하세요."}
            </p>
            <div className="mt-4 break-all rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
              {result}
            </div>
            {resultExpires && expiryDate && (
              <p className="mt-2 text-xs text-gray-400">
                {labels.dateFieldLabel} 당일까지 공개 · {expiryDate}에 자동
                비공개
              </p>
            )}
            <KakaoShareButton
              url={result}
              title={
                labels.showPerson2
                  ? `${data.groomName} ♥ ${data.brideName} 결혼합니다`
                  : `${data.groomName}의 ${labels.countdownLabel}에 초대합니다`
              }
              description={
                data.weddingDate
                  ? `${data.weddingDate} · 모바일 초대장이 도착했어요`
                  : "모바일 초대장이 도착했어요"
              }
              imageUrl={data.mainPhotoUrl}
              className="mt-4 w-full py-2.5 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 py-2.5 text-sm font-semibold text-white transition hover:from-gold-500 hover:to-gold-600"
              >
                {copied ? "복사됨!" : "링크 복사"}
              </button>
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-700"
              >
                바로 보기
              </a>
            </div>
            {/* 닫으면 마이페이지로 이동 */}
            <Link
              href="/my"
              className="mt-3 inline-block text-xs text-gray-400 hover:text-gold-500"
            >
              닫기
            </Link>
          </div>
        </div>
      )}

      {/* 모바일 전체화면 미리보기 */}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4 md:hidden"
        >
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            aria-label="닫기"
            className="mb-2 self-end text-3xl leading-none text-white/80"
          >
            ×
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto w-full min-h-0 max-w-[400px] flex-1 overflow-hidden rounded-[2rem] border-8 border-gray-800 bg-white shadow-2xl"
          >
            <div className="h-full overflow-y-auto">
              <InvitationView template={template} data={data} preview />
            </div>
          </div>
        </div>
      )}

      {/* 제작 확인 모달 (미리보기 + 게시 종료 안내 + 한 번 더 확인) */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-3 sm:p-5">
          <div className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col rounded-2xl bg-white p-4 shadow-2xl sm:p-5">
            <h2 className="text-center text-lg font-bold text-gray-800">
              {isEdit ? "이대로 수정할까요?" : "이대로 제작할까요?"}
            </h2>
            <p className="mb-3 mt-1 text-center text-xs text-gray-500">
              {isEdit
                ? "하객에게 보이는 실제 모습이에요. 저장 즉시 반영돼요."
                : "하객에게 보이는 실제 모습이에요. 확인 후 제작해 주세요."}
            </p>
            <div className="mx-auto w-full min-h-0 max-w-[400px] flex-1 overflow-hidden rounded-2xl border-4 border-gray-800">
              <div className="h-full overflow-y-auto">
                <InvitationView template={template} data={data} />
              </div>
            </div>

            {/* 게시 종료일은 행사 다음 날로 자동 결정 (선택 불필요) */}
            <div className="mt-3.5 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-center text-xs leading-5 text-gold-600">
              {expiryDate ? (
                <>
                  {labels.dateFieldLabel} 당일까지 볼 수 있고,
                  <br />
                  <span className="font-semibold">{expiryDate}</span>에 사진까지
                  완전히 삭제돼요.
                </>
              ) : (
                <>{labels.dateFieldLabel}을 입력하면 게시 종료일이 정해져요.</>
              )}
              {isEdit && (
                <>
                  <br />
                  저장하면 바로 반영되고, 링크는 그대로 유지돼요.
                </>
              )}
            </div>

            {error && (
              <p className="mt-2 text-center text-sm text-red-500">{error}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                다시 수정할게요
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-gold-500 hover:to-gold-600 disabled:opacity-50"
              >
                {submitting
                  ? "저장 중..."
                  : isEdit
                    ? "네, 수정할게요"
                    : "네, 제작할게요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

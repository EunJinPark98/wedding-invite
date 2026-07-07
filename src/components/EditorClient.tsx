"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import InvitationView from "./InvitationView";
import AuthStatus from "./AuthStatus";
import { TEMPLATES, FONTS } from "@/lib/templates";
import { fileToCompressedBlob } from "@/lib/image";
import {
  emptyInvitation,
  MAX_GALLERY,
  PERIOD_OPTIONS,
  SAMPLE_MAIN_PHOTO,
  type Account,
  type InvitationData,
  type PeriodMonths,
  type TemplateId,
} from "@/lib/types";

/* ───────── 이미지 업로드 ───────── */
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
      // 클라이언트에서 압축 → 서버 업로드 → 저장은 URL만
      const blob = await fileToCompressedBlob(file);
      const form = new FormData();
      form.append("file", blob, "photo.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "업로드에 실패했습니다.");
      onChange(json.url);
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
          <span>{busy ? "처리 중..." : label}</span>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
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
    <label className="block">
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

function Group({
  title,
  step,
  children,
}: {
  title: string;
  step?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
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

function FontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {FONTS.map((f) => {
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

export default function EditorClient() {
  const params = useSearchParams();
  const initialTemplate = (params.get("template") as TemplateId) || "classic";

  const [template, setTemplate] = useState<TemplateId>(
    TEMPLATES.some((t) => t.id === initialTemplate) ? initialTemplate : "classic"
  );
  const [data, setData] = useState<InvitationData>(emptyInvitation());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false); // 제작 전 확인 모달
  const [showPreview, setShowPreview] = useState(false); // 모바일 전체화면 미리보기
  const [period, setPeriod] = useState<PeriodMonths>(3); // 운영 기간(개월)
  const [resultExpires, setResultExpires] = useState<string | null>(null); // 발급된 만료일
  const [photoWarn, setPhotoWarn] = useState(false); // 대표 사진 미등록 경고
  const photoSectionRef = useRef<HTMLDivElement>(null);

  // 예시 사진 그대로거나 비어있으면 본인 대표 사진 등록 필요
  const needMainPhoto =
    !data.mainPhotoUrl || data.mainPhotoUrl === SAMPLE_MAIN_PHOTO;

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
  const addGallery = () =>
    setData((d) =>
      d.gallery.length >= MAX_GALLERY
        ? d
        : { ...d, gallery: [...d.gallery, ""] }
    );
  const removeGallery = (i: number) =>
    setData((d) => ({ ...d, gallery: d.gallery.filter((_, idx) => idx !== i) }));

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, data, periodMonths: period }),
      });
      const json = await res.json();
      if (res.status === 401) {
        // 로그인 필요 → 로그인 후 에디터로 복귀
        window.location.href = "/login?next=/editor";
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
            CREATE YOUR INVITATION
          </p>
          <h1
            className="mt-2 text-[2rem] leading-tight tracking-tight text-gray-900"
            style={{ fontFamily: "var(--font-song)" }}
          >
            청첩장 만들기
          </h1>
          <p
            className="mt-2 text-sm text-gray-400"
            style={{ fontFamily: "var(--font-gowun)" }}
          >
            입력한 내용이 미리보기에 실시간으로 반영돼요.
          </p>
        </div>

        <Group title="템플릿" step={1}>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((t) => {
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
        </Group>

        <Group title="글꼴" step={2}>
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
        </Group>

        <Group title="신랑 · 신부" step={3}>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="신랑 이름"
              value={data.groomName}
              onChange={(v) => set("groomName", v)}
            />
            <Field
              label="신부 이름"
              value={data.brideName}
              onChange={(v) => set("brideName", v)}
            />
          </div>
        </Group>

        <Group title="혼주" step={4}>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <p className="text-xs text-gray-400">
            비워두면 청첩장에 표시되지 않아요. 부모님 성함을 모두 비우면 이름만
            표기됩니다.
          </p>
        </Group>

        <Group title="예식 일시 · 장소" step={5}>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="예식일"
              type="date"
              value={data.weddingDate}
              onChange={(v) => set("weddingDate", v)}
            />
            <Field
              label="예식 시간"
              value={data.weddingTime}
              onChange={(v) => set("weddingTime", v)}
              placeholder="오후 1시"
            />
          </div>
          <Field
            label="예식장 이름"
            value={data.venueName}
            onChange={(v) => set("venueName", v)}
          />
          <Field
            label="홀 / 층"
            value={data.venueHall}
            onChange={(v) => set("venueHall", v)}
          />
          <Field
            label="주소"
            value={data.venueAddress}
            onChange={(v) => set("venueAddress", v)}
          />
        </Group>

        <Group title="인사말" step={6}>
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
        </Group>

        <Group title="사진" step={7}>
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
                미리보기에 보이는 사진은 예시예요. 두 분의 사진을 올려 주세요.
              </p>
            )}
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              갤러리 사진{" "}
              <span className="text-gray-400">
                ({data.gallery.length}/{MAX_GALLERY})
              </span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {data.gallery.map((g, i) => (
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
              ))}
              {data.gallery.length < MAX_GALLERY ? (
                <button
                  type="button"
                  onClick={addGallery}
                  className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-2xl text-gray-300 transition hover:border-gold-300 hover:text-gold-400"
                >
                  +
                </button>
              ) : (
                <div
                  title="8장부터는 유료 플랜으로 준비 중이에요"
                  className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-300"
                >
                  <span className="text-base">🔒</span>
                  <span className="px-1 text-center text-[10px] leading-tight">
                    8장부터 유료
                    <br />
                    (준비 중)
                  </span>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400">
            갤러리는 최대 {MAX_GALLERY}장까지 추가할 수 있어요. 업로드한 사진은
            자동으로 압축되어 저장됩니다.
          </p>
        </Group>

        <Group title="연락처" step={8}>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="신랑 연락처"
              value={data.groomPhone}
              onChange={(v) => set("groomPhone", v)}
            />
            <Field
              label="신부 연락처"
              value={data.bridePhone}
              onChange={(v) => set("bridePhone", v)}
            />
          </div>
        </Group>

        <Group title="마음 전하실 곳 (계좌)" step={9}>
          <div className="space-y-3">
            {data.accounts.map((a, i) => (
              <div
                key={i}
                className="space-y-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={a.side}
                    onChange={(e) =>
                      setAccount(i, { side: e.target.value as Account["side"] })
                    }
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700"
                  >
                    <option value="신랑측">신랑측</option>
                    <option value="신부측">신부측</option>
                  </select>
                  <button
                    onClick={() => removeAccount(i)}
                    className="ml-auto text-xs text-gray-400 hover:text-gold-400"
                  >
                    삭제
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={a.bank}
                    onChange={(e) => setAccount(i, { bank: e.target.value })}
                    placeholder="은행"
                    className={INPUT_CLASS}
                  />
                  <input
                    value={a.number}
                    onChange={(e) => setAccount(i, { number: e.target.value })}
                    placeholder="계좌번호"
                    className={`${INPUT_CLASS} col-span-2`}
                  />
                </div>
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

        <button
          onClick={openConfirm}
          className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-base font-semibold text-white shadow-lg shadow-gold-300/50 transition hover:from-gold-500 hover:to-gold-600"
        >
          청첩장 제작하기
        </button>
        {photoWarn && needMainPhoto ? (
          <p className="text-center text-sm font-medium text-red-500">
            대표 사진을 등록해 주세요. 지금 보이는 사진은 예시용이에요.
          </p>
        ) : (
          <p className="text-center text-xs text-gray-400">
            제작 전에 미리보기로 한 번 더 확인할 수 있어요.
          </p>
        )}
      </div>

      {/* 실시간 미리보기 — 데스크톱(사이드 고정) */}
      <div className="hidden md:sticky md:top-8 md:block md:h-[calc(100vh-4rem)]">
        <p className="mb-3 text-center font-cormorant text-xs tracking-[0.35em] text-gray-400">
          LIVE PREVIEW
        </p>
        <div className="mx-auto h-full max-w-[380px] overflow-hidden rounded-[2rem] border-8 border-gray-800 shadow-xl">
          <div className="h-full overflow-y-auto">
            <InvitationView template={template} data={data} preview />
          </div>
        </div>
      </div>

      {/* 미리보기 — 모바일(우상단 미니, 탭하면 확대) */}
      <div
        className="fixed right-3 top-16 z-40 overflow-hidden rounded-lg border-2 border-gray-800 bg-white shadow-lg md:hidden"
        style={{ width: 72, height: 104 }}
      >
        {/* 축소된 실시간 미리보기 (클릭은 위 오버레이가 처리) */}
        <div
          className="pointer-events-none"
          style={{
            width: 390,
            transformOrigin: "top left",
            transform: `scale(${72 / 390})`,
          }}
        >
          <InvitationView template={template} data={data} preview />
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          aria-label="미리보기 크게 보기"
          className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/55 via-transparent to-transparent pb-0.5 text-[9px] font-medium text-white"
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
              청첩장이 완성됐어요!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              아래 링크를 공유하세요.
            </p>
            <div className="mt-4 break-all rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
              {result}
            </div>
            {resultExpires && (
              <p className="mt-2 text-xs text-gray-400">
                {fmtDate(resultExpires)}까지 공개 · 이후 자동 비공개
              </p>
            )}
            <div className="mt-4 flex gap-2">
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
            <button
              onClick={() => setResult(null)}
              className="mt-3 text-xs text-gray-400"
            >
              닫고 계속 편집
            </button>
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

      {/* 제작 확인 모달 (미리보기 + 운영 기간 + 한 번 더 확인) */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-3 sm:p-5">
          <div className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col rounded-2xl bg-white p-4 shadow-2xl sm:p-5">
            <h2 className="text-center text-lg font-bold text-gray-800">
              이대로 제작할까요?
            </h2>
            <p className="mb-3 mt-1 text-center text-xs text-gray-500">
              하객에게 보이는 실제 모습이에요. 확인 후 운영 기간을 선택하세요.
            </p>
            <div className="mx-auto w-full min-h-0 max-w-[400px] flex-1 overflow-hidden rounded-2xl border-4 border-gray-800">
              <div className="h-full overflow-y-auto">
                <InvitationView template={template} data={data} />
              </div>
            </div>

            {/* 운영 기간 선택 */}
            <div className="mt-3.5">
              <p className="mb-2 text-center text-xs font-semibold text-gray-600">
                운영 기간
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {PERIOD_OPTIONS.map((p) => {
                  const selected = period === p.months;
                  if (p.paid) {
                    return (
                      <button
                        key={p.months}
                        type="button"
                        disabled
                        title="유료 플랜으로 준비 중이에요"
                        className="relative cursor-not-allowed rounded-xl border-2 border-gray-100 bg-gray-50 py-2 text-sm text-gray-300"
                      >
                        {p.label}
                        <span className="absolute -top-2 right-1 rounded-full bg-gold-400 px-1.5 py-px text-[9px] font-bold text-ink">
                          유료
                        </span>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={p.months}
                      type="button"
                      onClick={() => setPeriod(p.months)}
                      className={`rounded-xl border-2 py-2 text-sm font-medium transition ${
                        selected
                          ? "border-gold-400 bg-gold-50 text-gold-500"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-center text-[11px] text-gray-400">
                <span className="font-medium text-gold-500">
                  {fmtDate(
                    (() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + period);
                      return d.toISOString();
                    })()
                  )}
                </span>
                에 게시가 종료돼요 · 6개월 이상은 유료로 준비 중
              </p>
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
                {submitting ? "제작 중..." : "네, 제작할게요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthStatus from "./AuthStatus";

export interface MyInvitation {
  slug: string;
  templateName: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  createdAt: string;
  expiresAt: string | null;
  edited: boolean;
  expired: boolean;
}

const fmtDate = (iso: string | null) => {
  if (!iso) return "무기한";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function MyPageClient({ items }: { items: MyInvitation[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const notice = params.get("notice");
  const [deleting, setDeleting] = useState<string | null>(null); // 삭제 확인 모달 대상 slug
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleDelete(slug: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${slug}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.status === 401) {
        window.location.href = "/login?next=/my";
        return;
      }
      if (!res.ok) throw new Error(json.error || "삭제에 실패했습니다.");
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function copyLink(slug: string) {
    navigator.clipboard
      .writeText(`${window.location.origin}/v/${slug}`)
      .then(() => {
        setCopied(slug);
        setTimeout(() => setCopied(null), 1500);
      });
  }

  return (
    <main className="min-h-screen bg-cream text-gray-800">
      <header className="sticky top-0 z-40 border-b border-gold-200/50 bg-white/85 shadow-[0_1px_14px_rgba(198,162,63,0.10)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="별빛 초대장 로고"
              className="h-8 w-8 rounded-full shadow-sm"
            />
            <span
              className="text-lg text-ink"
              style={{ fontFamily: "var(--font-song)" }}
            >
              별빛 초대장
            </span>
          </Link>
          <AuthStatus />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1
          className="text-2xl text-ink"
          style={{ fontFamily: "var(--font-song)" }}
        >
          마이페이지
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          청첩장은 계정당 1개만 만들 수 있고, 제작 후 수정은 1회만 가능해요.
        </p>

        {notice === "limit" && (
          <div className="mt-5 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-600">
            이미 만든 청첩장이 있어요. 새로 만들려면 아래에서 기존 청첩장을
            삭제해 주세요.
          </div>
        )}
        {notice === "edited" && (
          <div className="mt-5 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-600">
            이 청첩장은 이미 1회 수정을 완료해서 더 이상 수정할 수 없어요.
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-gold-100 bg-white p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-4xl">💌</p>
            <p className="mt-4 text-gray-500">아직 만든 청첩장이 없어요.</p>
            <Link
              href="/editor"
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/40 transition hover:from-gold-500 hover:to-gold-600"
            >
              무료로 제작하기
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {items.map((inv) => (
              <div
                key={inv.slug}
                className="rounded-3xl border border-gold-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        className="text-lg text-ink"
                        style={{ fontFamily: "var(--font-song)" }}
                      >
                        {inv.groomName} ♥ {inv.brideName}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          inv.expired
                            ? "bg-gray-100 text-gray-400"
                            : "bg-gold-50 text-gold-500"
                        }`}
                      >
                        {inv.expired ? "게시 종료" : "게시 중"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-gray-400">
                      {inv.templateName} 템플릿
                      {inv.weddingDate && <> · 예식일 {inv.weddingDate}</>}
                      <br />
                      게시 종료일: {fmtDate(inv.expiresAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      inv.edited
                        ? "bg-gray-100 text-gray-400"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {inv.edited ? "수정 1회 사용됨" : "수정 1회 가능"}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/v/${inv.slug}`}
                    target="_blank"
                    className="rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-gold-300/40 transition hover:from-gold-500 hover:to-gold-600"
                  >
                    청첩장 보기
                  </Link>
                  <button
                    type="button"
                    onClick={() => copyLink(inv.slug)}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gold-300 hover:text-gold-600"
                  >
                    {copied === inv.slug ? "복사됨!" : "링크 복사"}
                  </button>
                  {inv.edited ? (
                    <span
                      title="수정은 1회만 가능해요"
                      className="cursor-not-allowed rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-300"
                    >
                      수정 완료
                    </span>
                  ) : (
                    <Link
                      href={`/editor?edit=${inv.slug}`}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gold-300 hover:text-gold-600"
                    >
                      수정하기 (1회 가능)
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setDeleting(inv.slug);
                    }}
                    className="ml-auto rounded-xl border border-red-100 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gold-500">
            ← 홈으로 돌아가기
          </Link>
        </p>
      </div>

      {/* 삭제 확인 모달 — 복원 불가 경고 */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="text-3xl">🗑️</p>
            <h2 className="mt-3 text-lg font-bold text-gray-800">
              정말 삭제할까요?
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              삭제한 청첩장은{" "}
              <strong className="text-red-500">복원할 수 없어요.</strong>
              <br />
              공유한 링크도 더 이상 열리지 않아요.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={busy}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleting)}
                disabled={busy}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {busy ? "삭제 중..." : "삭제할게요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

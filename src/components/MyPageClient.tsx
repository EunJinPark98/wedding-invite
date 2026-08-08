"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthStatus from "./AuthStatus";
import KakaoShareButton from "./KakaoShareButton";
import {
  getCategoryLabels,
  getCategoryMeta,
  CATEGORIES,
} from "@/lib/categories";
import { expiryDateLabel, type Category } from "@/lib/types";

export interface MyInvitation {
  slug: string;
  templateName: string;
  category: Category;
  seniorAge: number;
  dolKind: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  mainPhotoUrl: string;
  createdAt: string;
  expiresAt: string | null;
  expired: boolean;
}

// 로그인에 쓴 계정에서 받아온 정보
export interface MyAccount {
  name: string;
  nickname: string;
  email: string;
  provider: string;
}

const PROVIDER_LABEL: Record<string, string> = {
  naver: "네이버",
  kakao: "카카오",
};

// 이메일 제공에 동의하지 않으면 계정을 만들려고 우리가 지어낸 주소가 들어간다.
// 사용자에게는 실제 이메일이 아니므로 보여 주지 않는다.
const isPlaceholderEmail = (email: string) =>
  email.endsWith("@users.noreply.starlight-invite.app");

function AccountCard({ account }: { account: MyAccount }) {
  const provider = PROVIDER_LABEL[account.provider] ?? "";
  const rows: { label: string; value: string }[] = [
    { label: "회원이름", value: account.name },
    { label: "닉네임", value: account.nickname },
    {
      label: "이메일 주소",
      value: isPlaceholderEmail(account.email) ? "" : account.email,
    },
  ];
  return (
    <section className="mt-6 rounded-2xl border border-gold-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-800">내 계정</h2>
        {provider && (
          <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-gold-600">
            {provider} 로그인
          </span>
        )}
      </div>
      <dl className="divide-y divide-gray-100">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-4 py-2.5">
            <dt className="w-20 shrink-0 text-xs text-gray-400">{r.label}</dt>
            <dd className="min-w-0 flex-1 truncate text-sm text-gray-700">
              {r.value || (
                <span className="text-gray-300">제공받지 않음</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-gray-400">
        {provider ? `${provider} 계정에서 받아온 정보예요. ` : ""}
        초대장을 누가 만들었는지 구분하고, 마이페이지에 다시 들어오실 때
        같은 계정을 알아보는 데에만 씁니다.
      </p>
    </section>
  );
}

const fmtDate = (iso: string | null) => {
  if (!iso) return "무기한";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function MyPageClient({
  items,
  account,
}: {
  items: MyInvitation[];
  account?: MyAccount | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const notice = params.get("notice");
  // 제한 안내에 어떤 종류인지 표시
  const limitCategory = params.get("category");
  const limitLabel = limitCategory ? getCategoryMeta(limitCategory).label : null;
  // 아직 만들지 않은 종류 (게시가 끝난 초대장은 자리를 비워줌)
  const usedCategories = new Set(
    items.filter((i) => !i.expired).map((i) => i.category)
  );
  const available = CATEGORIES.filter((c) => !usedCategories.has(c.id));
  const [deleting, setDeleting] = useState<string | null>(null); // 삭제 확인 모달 대상 slug
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // 종류당 1개 제한에 걸려 넘어온 경우 — 알림창으로 알려 준다.
  // 개발 모드에서 효과가 두 번 실행돼도 한 번만 뜨도록 막는다.
  const alerted = useRef(false);
  useEffect(() => {
    if (notice !== "limit" || alerted.current) return;
    alerted.current = true;
    alert(
      `${limitLabel ? `${limitLabel}은` : "이 종류는"} 이미 만드셨어요.\n새로 만들려면 아래에서 기존 초대장을 삭제해 주세요.`
    );
  }, [notice, limitLabel]);

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
              className="text-sm text-ink sm:text-lg"
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
          초대장은 종류마다 1개씩, 최대 {CATEGORIES.length}개까지 만들 수 있습니다.
          수정 · 삭제는 언제든지 가능하고,{" "}
          <strong className="text-gray-600">
            행사 다음 날에는 자동으로 삭제됩니다.
          </strong>{" "}
          삭제되면 추가로 만들 수 있습니다.
        </p>

        {account && <AccountCard account={account} />}

        {/* 아직 만들지 않은 종류 바로 만들기 */}
        {available.length > 0 && (
          <div className="mt-5 rounded-2xl border border-gold-100 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">
              아직 만들지 않은 초대장
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {available.map((c) => (
                <Link
                  key={c.id}
                  href={`/editor?category=${c.id}`}
                  className="rounded-full border border-gold-200 px-3.5 py-2 text-sm text-gold-600 transition hover:bg-gold-50"
                >
                  {c.emoji} {c.label} 만들기
                </Link>
              ))}
            </div>
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
            <p className="mt-4 text-gray-500">아직 만든 초대장이 없어요.</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/40 transition hover:from-gold-500 hover:to-gold-600"
            >
              무료로 제작하기
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {items.map((inv) => {
              const labels = getCategoryLabels(
                inv.category,
                inv.seniorAge,
                inv.dolKind
              );
              return (
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
                        {labels.showPerson2
                          ? `${inv.groomName} ♥ ${inv.brideName}`
                          : inv.groomName}
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
                      {inv.weddingDate && (
                        <> · {labels.dateFieldLabel} {inv.weddingDate}</>
                      )}
                      <br />
                      {inv.expired ? "삭제 예정: " : "자동 삭제일: "}
                      {expiryDateLabel(inv.weddingDate) ??
                        fmtDate(inv.expiresAt)}
                      {inv.expired && " (곧 정리돼요)"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/v/${inv.slug}`}
                    target="_blank"
                    className="rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-gold-300/40 transition hover:from-gold-500 hover:to-gold-600"
                  >
                    {labels.noun} 보기
                  </Link>
                  {!inv.expired && (
                    <KakaoShareButton
                      url={`/v/${inv.slug}`}
                      title={
                        labels.showPerson2
                          ? `${inv.groomName} ♥ ${inv.brideName} 결혼합니다`
                          : `${inv.groomName}의 ${labels.countdownLabel}에 초대합니다`
                      }
                      description={
                        inv.weddingDate
                          ? `${inv.weddingDate} · 모바일 초대장이 도착했어요`
                          : "모바일 초대장이 도착했어요"
                      }
                      imageUrl={inv.mainPhotoUrl}
                      className="px-4 py-2.5 text-sm"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => copyLink(inv.slug)}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gold-300 hover:text-gold-600"
                  >
                    {copied === inv.slug ? "복사됨!" : "링크 복사"}
                  </button>
                  <Link
                    href={`/editor?edit=${inv.slug}`}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gold-300 hover:text-gold-600"
                  >
                    수정하기
                  </Link>
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
              );
            })}
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
              삭제한 초대장은{" "}
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { isExpired, listAllInvitations } from "@/lib/store";
import { getTheme } from "@/lib/templates";
import { getCategoryLabels, getCategoryMeta } from "@/lib/categories";
import { authEnabled, getUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { normalizeData } from "@/lib/types";

export const metadata = { title: "관리자" };
// 목록이 캐시되어 옛 내용이 보이면 안 된다
export const dynamic = "force-dynamic";

const fmt = (iso: string | null) => {
  if (!iso) return "무기한";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "-"
    : `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
};

/**
 * 만들어진 초대장을 훑어보는 운영자 화면.
 *
 * ADMIN_EMAILS 에 적힌 계정으로 로그인했을 때만 열린다. 그 외에는 주소를
 * 알더라도 없는 페이지로 보이게 해서, 이런 화면이 있다는 것 자체를 알리지 않는다.
 */
export default async function AdminPage() {
  if (!authEnabled) notFound();
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const items = await listAllInvitations();
  const live = items.filter((i) => !isExpired(i)).length;

  return (
    <main className="min-h-screen bg-cream text-gray-800">
      <header className="border-b border-gold-200/50 bg-white/85">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
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
          <span className="text-xs text-gray-400">{user?.email}</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1
          className="text-2xl text-ink"
          style={{ fontFamily: "var(--font-song)" }}
        >
          만들어진 초대장
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          전체 {items.length}개 · 게시 중 {live}개 · 게시 종료{" "}
          {items.length - live}개
        </p>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gold-100 bg-white p-12 text-center">
            <p className="text-4xl">💌</p>
            <p className="mt-3 text-sm text-gray-400">
              아직 만들어진 초대장이 없어요.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((inv) => {
              const d = normalizeData(inv.data);
              const labels = getCategoryLabels(d.category, d.seniorAge, d.dolKind);
              const meta = getCategoryMeta(d.category);
              const names = [d.groomName, d.brideName].filter(Boolean).join(" · ");
              const over = isExpired(inv);
              return (
                <li
                  key={inv.slug}
                  className="flex items-center gap-4 rounded-2xl border border-gold-100 bg-white p-4"
                >
                  {/* 대표 사진 — 어떤 초대장인지 한눈에 알아보려고 둔다 */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gold-50">
                    {d.mainPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.mainPhotoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl">
                        {meta.emoji}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-gray-800">
                        {names || "(이름 없음)"}
                      </span>
                      <span className="shrink-0 rounded-full bg-gold-50 px-2 py-0.5 text-[11px] text-gold-600">
                        {meta.label}
                      </span>
                      {over && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">
                          게시 종료
                        </span>
                      )}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {getTheme(inv.template).name} · {labels.dateFieldLabel}{" "}
                      {d.weddingDate || "-"} · 사진{" "}
                      {d.gallery.filter(Boolean).length}장
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-300">
                      만든 날 {fmt(inv.createdAt)} · 사라지는 날{" "}
                      {fmt(inv.expiresAt)} · /v/{inv.slug}
                    </p>
                  </div>

                  <Link
                    href={`/v/${inv.slug}`}
                    target="_blank"
                    className="shrink-0 rounded-xl border border-gold-200 px-3.5 py-2 text-xs font-medium text-gold-600 transition hover:bg-gold-50"
                  >
                    열어 보기
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

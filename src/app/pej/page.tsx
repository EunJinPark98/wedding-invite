import Link from "next/link";
import { notFound } from "next/navigation";
import { isExpired, listAllInvitations } from "@/lib/store";
import { getTheme } from "@/lib/templates";
import { getCategoryMeta } from "@/lib/categories";
import { authEnabled, getUser } from "@/lib/supabase/server";
import { isAdminEmail, listAccounts, type Account } from "@/lib/admin";
import PejDeleteAccount from "@/components/PejDeleteAccount";
import { CATEGORIES } from "@/lib/categories";
import { normalizeData, type Category } from "@/lib/types";

export const metadata = { title: "운영 현황" };
// 한 쪽에 보여 줄 계정 수
const PER_PAGE = 10;
// 목록이 캐시되어 옛 내용이 보이면 안 된다
export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = {
  naver: "네이버",
  kakao: "카카오",
};

const fmt = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "-"
    : `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
};

/** 숫자 하나를 크게 보여 주는 칸 */
function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-gold-100 bg-white px-4 py-4 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-800">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

type Inv = Awaited<ReturnType<typeof listAllInvitations>>[number];

/** 초대장 한 줄 — 눌러서 하객이 보는 화면으로 들어간다 */
function InvitationRow({ inv }: { inv: Inv }) {
  const d = normalizeData(inv.data);
  const meta = getCategoryMeta(d.category);
  const names = [d.groomName, d.brideName].filter(Boolean).join(" · ");
  const over = isExpired(inv);
  return (
    <Link
      href={`/v/${inv.slug}`}
      target="_blank"
      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 transition hover:border-gold-200 hover:bg-gold-50/50"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gold-50">
        {d.mainPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.mainPhotoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg">
            {meta.emoji}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-gray-800">
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
        <p className="mt-0.5 truncate text-[11px] text-gray-400">
          {getTheme(inv.template).name} · {d.weddingDate || "-"} · 사진{" "}
          {d.gallery.filter(Boolean).length}장 · 만든 날 {fmt(inv.createdAt)}
        </p>
      </div>
      <span className="shrink-0 text-xs text-gold-500">열기 ›</span>
    </Link>
  );
}

/** 계정 하나와 그 계정이 만든 초대장 */
function AccountCard({ account, items }: { account: Account; items: Inv[] }) {
  const provider = PROVIDER_LABEL[account.provider] ?? account.provider ?? "";
  const title = account.name || account.nickname || account.email || "(정보 없음)";
  return (
    <li className="rounded-2xl border border-gold-100 bg-white p-4">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {provider && (
            <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-gold-600">
              {provider}
            </span>
          )}
          <span className="text-xs text-gray-400">초대장 {items.length}개</span>
        </div>
        <PejDeleteAccount
          userId={account.id}
          label={title}
          invitations={items.length}
        />
      </div>
      <p className="mt-1 truncate text-xs text-gray-400">
        {account.email || (
          <span className="text-gray-300">이메일 제공 안 함</span>
        )}
        {account.nickname && account.nickname !== title && ` · ${account.nickname}`}
      </p>
      <p className="mt-0.5 text-[11px] text-gray-300">
        가입 {fmt(account.createdAt)} · 마지막 로그인{" "}
        {fmt(account.lastSignInAt)}
      </p>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((inv) => (
            <InvitationRow key={inv.slug} inv={inv} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * 운영 현황 — 가입한 계정과 그 계정이 만든 초대장을 훑어본다.
 *
 * ADMIN_EMAILS 에 적힌 계정으로 로그인했을 때만 열린다. 그 외에는 주소를
 * 알더라도 없는 페이지로 보이게 해서, 이런 화면이 있다는 것 자체를 알리지 않는다.
 */
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  if (!authEnabled) notFound();
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const [accounts, invitations] = await Promise.all([
    listAccounts(),
    listAllInvitations(),
  ]);

  // 계정별로 초대장을 묶는다
  const byUser = new Map<string, Inv[]>();
  const orphans: Inv[] = [];
  for (const inv of invitations) {
    if (!inv.userId) {
      orphans.push(inv);
      continue;
    }
    const list = byUser.get(inv.userId);
    if (list) list.push(inv);
    else byUser.set(inv.userId, [inv]);
  }

  const live = invitations.filter((i) => !isExpired(i)).length;
  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    count: invitations.filter(
      (i) => (normalizeData(i.data).category as Category) === c.id
    ).length,
  }));
  const madeSomething = accounts.filter((a) => (byUser.get(a.id)?.length ?? 0) > 0)
    .length;

  // 이름으로 찾기 — 닉네임·이메일도 함께 본다 (이름을 안 준 계정이 있다)
  const needle = q.toLowerCase();
  const found = needle
    ? accounts.filter((a) =>
        [a.name, a.nickname, a.email].some((v) =>
          v.toLowerCase().includes(needle)
        )
      )
    : accounts;

  const pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), pages);
  const shown = found.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageHref = (n: number) =>
    `/pej?${new URLSearchParams({ ...(q ? { q } : {}), ...(n > 1 ? { page: String(n) } : {}) })}`;

  return (
    <main className="min-h-screen bg-cream text-gray-800">
      <header className="border-b border-gold-200/50 bg-white/85">
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
          <span className="truncate text-xs text-gray-400">{user?.email}</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1
          className="text-2xl text-ink"
          style={{ fontFamily: "var(--font-song)" }}
        >
          운영 현황
        </h1>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <Stat
            label="가입한 계정"
            value={accounts.length}
            sub={`만든 사람 ${madeSomething}명`}
          />
          <Stat
            label="만든 초대장"
            value={invitations.length}
            sub={`게시 중 ${live}개`}
          />
          <Stat
            label="게시 종료"
            value={invitations.length - live}
            sub="자동 삭제 대기"
          />
        </div>

        {/* 종류별 몇 개씩 만들어졌는지 */}
        <div className="mt-2.5 flex flex-wrap gap-2 rounded-2xl border border-gold-100 bg-white px-4 py-3">
          {byCategory.map((c) => (
            <span key={c.id} className="text-xs text-gray-500">
              {c.emoji} {c.label}{" "}
              <strong className="text-gray-800">{c.count}</strong>
            </span>
          ))}
        </div>

        {accounts.length === 0 && (
          <p className="mt-6 rounded-2xl border border-gold-100 bg-white px-4 py-3 text-xs text-gray-400">
            계정 목록을 읽지 못했습니다. SUPABASE_SERVICE_ROLE_KEY 가 설정돼
            있는지 확인해 주세요.
          </p>
        )}

        <h2 className="mt-9 text-sm font-semibold text-gray-800">
          계정 {q ? `${found.length}개 (전체 ${accounts.length}개)` : `${accounts.length}개`}
        </h2>

        {/* 이름으로 찾기 — 자바스크립트 없이 주소로 넘긴다 */}
        <form method="get" className="mt-3 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="이름 · 닉네임 · 이메일로 찾기"
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-100"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-gold-200 px-4 py-2.5 text-sm font-medium text-gold-600 transition hover:bg-gold-50"
          >
            찾기
          </button>
          {q && (
            <Link
              href="/pej"
              className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50"
            >
              전체
            </Link>
          )}
        </form>

        {shown.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-gold-100 bg-white px-4 py-6 text-center text-sm text-gray-400">
            {q ? `"${q}"로 찾은 계정이 없어요.` : "아직 가입한 계정이 없어요."}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {shown.map((a) => (
              <AccountCard key={a.id} account={a} items={byUser.get(a.id) ?? []} />
            ))}
          </ul>
        )}

        {/* 쪽 번호 — 한 쪽에 열 개씩 */}
        {pages > 1 && (
          <nav className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                aria-current={n === page ? "page" : undefined}
                className={`min-w-9 rounded-lg border px-3 py-1.5 text-center text-sm transition ${
                  n === page
                    ? "border-gold-300 bg-gold-50 font-semibold text-gold-600"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}

        {/* 로그인 없이 만들어진(또는 계정이 지워진) 초대장 */}
        {orphans.length > 0 && (
          <>
            <h2 className="mt-9 text-sm font-semibold text-gray-800">
              계정 없는 초대장 {orphans.length}개
            </h2>
            <ul className="mt-3 space-y-2">
              {orphans.map((inv) => (
                <li key={inv.slug}>
                  <InvitationRow inv={inv} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isExpired,
  listAllInvitations,
  readDeletedCounts,
} from "@/lib/store";
import { getTheme } from "@/lib/templates";
import { getCategoryMeta } from "@/lib/categories";
import { authEnabled, getUser } from "@/lib/supabase/server";
import { isAdminEmail, listAccounts, type Account } from "@/lib/admin";
import PejDeleteAccount from "@/components/PejDeleteAccount";
import { CATEGORIES } from "@/lib/categories";
import { isPastEventDate, normalizeData, type Category } from "@/lib/types";

export const metadata = { title: "운영 현황" };
// 한 쪽에 보여 줄 계정 수
const PER_PAGE = 10;
// 아래에 한 번에 내놓을 쪽 번호 개수 (나머지는 화살표로 넘긴다)
const PAGE_WINDOW = 5;
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
  note,
}: {
  label: string;
  value: number;
  sub?: string;
  /** 한 줄 더 — 있을 때만 (예: 마지막 청소 시각) */
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-gold-100 bg-white px-4 py-4 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-800">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
      {note && <p className="mt-0.5 text-[10px] text-gray-300">{note}</p>}
    </div>
  );
}

type Inv = Awaited<ReturnType<typeof listAllInvitations>>[number];

/**
 * 행사가 끝났는지.
 *
 * 게시 종료 시각(expires_at)만 보면 안 된다. 그 칸이 생기기 전에 만들어진
 * 초대장은 값이 비어 있어서(무기한) 행사가 아무리 지나도 "게시 중"으로
 * 남는다. 운영자가 보기에 끝난 것은 행사 날짜가 지난 것이므로 날짜도 본다.
 */
function hasEnded(inv: Inv): boolean {
  return isExpired(inv) || isPastEventDate(normalizeData(inv.data).weddingDate);
}

/** 쪽 넘기는 화살표. 끝에 닿으면 누를 수 없게 흐리게 둔다. */
function PageArrow({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const cls = "min-w-9 rounded-lg border px-3 py-1.5 text-center text-sm";
  if (disabled) {
    return (
      <span
        aria-disabled
        className={`${cls} border-gray-100 text-gray-300`}
        aria-label={label}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${cls} border-gray-200 text-gray-500 transition hover:bg-gray-50`}
    >
      {children}
    </Link>
  );
}

/** 초대장 한 줄 — 눌러서 하객이 보는 화면으로 들어간다 */
function InvitationRow({ inv }: { inv: Inv }) {
  const d = normalizeData(inv.data);
  const meta = getCategoryMeta(d.category);
  const names = [d.groomName, d.brideName].filter(Boolean).join(" · ");
  const over = hasEnded(inv);
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
  searchParams: Promise<{ q?: string; page?: string; made?: string }>;
}) {
  if (!authEnabled) notFound();
  const user = await getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  // 초대장을 하나라도 만든 계정만 보기
  const madeOnly = sp.made === "1";

  const [accounts, invitations, deleted] = await Promise.all([
    listAccounts(),
    listAllInvitations(),
    readDeletedCounts(),
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

  const ended = invitations.filter(hasEnded);
  const live = invitations.length - ended.length;
  // 게시 종료일이 아예 없는 것 — 정기 청소가 손대지 못해 계속 남는다
  const noExpiry = invitations.filter((i) => !i.expiresAt).length;
  const endedNoExpiry = ended.filter((i) => !i.expiresAt).length;
  // 지금까지 지워진 초대장 (행이 사라지므로 지울 때마다 세어 둔 값을 읽는다)
  const goneTotal = deleted.expired + deleted.byUser;
  // 청소가 멈췄는지 판단은 store 가 한다 (여기서 시각을 재면 화면이 순수하지 않다)
  const purgeStale = deleted.ready && deleted.purgeStale;
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
  const found = accounts.filter((a) => {
    if (madeOnly && (byUser.get(a.id)?.length ?? 0) === 0) return false;
    if (!needle) return true;
    return [a.name, a.nickname, a.email].some((v) =>
      v.toLowerCase().includes(needle)
    );
  });

  const pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), pages);
  const shown = found.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageHref = (n: number) =>
    `/pej?${new URLSearchParams({
      ...(q ? { q } : {}),
      ...(madeOnly ? { made: "1" } : {}),
      ...(n > 1 ? { page: String(n) } : {}),
    })}`;
  // 거르기를 켜고 끌 때는 첫 쪽으로 돌아간다 (걸러진 뒤 쪽 수가 달라진다)
  const filterHref = (on: boolean) =>
    `/pej?${new URLSearchParams({
      ...(q ? { q } : {}),
      ...(on ? { made: "1" } : {}),
    })}`;

  // 쪽 번호는 지금 쪽을 가운데 두고 다섯 개만. 나머지는 화살표로 넘긴다.
  let winStart = Math.max(1, page - Math.floor(PAGE_WINDOW / 2));
  const winEnd = Math.min(pages, winStart + PAGE_WINDOW - 1);
  winStart = Math.max(1, winEnd - PAGE_WINDOW + 1);
  const nums = Array.from(
    { length: winEnd - winStart + 1 },
    (_, i) => winStart + i
  );

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
              className="text-base text-ink sm:text-xl"
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
            value={goneTotal}
            sub={
              deleted.ready
                ? `기간 만료 ${deleted.expired} · 직접 삭제 ${deleted.byUser}`
                : "세는 중 아님"
            }
            note={
              deleted.ready && deleted.lastPurgeAt
                ? `마지막 청소 ${fmt(deleted.lastPurgeAt)}`
                : undefined
            }
          />
        </div>

        {/* 청소가 멈춰 있으면 제일 먼저 알려 준다 — 약속한 자동 삭제가 안 된다 */}
        {purgeStale && (
          <p className="mt-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
            <strong>정기 청소가 돌지 않고 있어요.</strong>{" "}
            {deleted.lastPurgeAt
              ? `마지막으로 돈 때가 ${fmt(deleted.lastPurgeAt)} 입니다.`
              : "아직 한 번도 돈 기록이 없습니다."}{" "}
            기간이 끝난 초대장이 지워지지 않고 있다는 뜻이라, 개인정보처리방침에
            적은 자동 삭제가 지켜지지 않습니다. Vercel 에 CRON_SECRET 이 있는지와
            Cron 이 켜져 있는지 확인해 주세요.
          </p>
        )}

        {/* 세는 표가 아직 없으면 "아직 0" 과 구분해 알려 준다 */}
        {!deleted.ready && (
          <p className="mt-2.5 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3 text-xs leading-5 text-red-500">
            지워진 초대장을 세는 표가 아직 없어요. Supabase SQL Editor 에서{" "}
            <code className="rounded bg-white px-1">supabase/schema.sql</code>{" "}
            를 한 번 실행해 주세요. 그전까지 위 숫자는 0으로 보입니다.
          </p>
        )}

        {/* 아직 안 지워졌지만 기간이 끝난 것 — 오늘 밤 청소에 지워진다 */}
        {ended.length > 0 && (
          <p className="mt-2.5 rounded-2xl border border-gold-100 bg-white px-4 py-3 text-xs leading-5 text-gray-500">
            기간이 끝났는데 아직 안 지워진 초대장이{" "}
            <strong className="text-gray-800">{ended.length}개</strong>{" "}
            있어요. 오늘 밤 정리 작업에서 지워집니다.
            {endedNoExpiry > 0 && (
              <>
                {" "}이 가운데 <strong className="text-gray-800">{endedNoExpiry}개</strong>
                는 게시 종료일이 없어 자동으로는 지워지지 않습니다.
              </>
            )}
          </p>
        )}

        {/* 게시 종료일이 없는 초대장 — 자동 삭제가 손대지 못한다 */}
        {noExpiry > 0 && (
          <p className="mt-2.5 rounded-2xl border border-gold-100 bg-white px-4 py-3 text-xs leading-5 text-gray-500">
            게시 종료일이 없는 초대장이{" "}
            <strong className="text-gray-800">{noExpiry}개</strong> 있어요. 게시
            종료일 칸이 생기기 전에 만들어진 것이라, 행사가 지나도 자동으로
            지워지지 않고 계속 남습니다.
          </p>
        )}

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

        <div className="mt-9 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-800">
            계정{" "}
            {q || madeOnly
              ? `${found.length}개 (전체 ${accounts.length}개)`
              : `${accounts.length}개`}
          </h2>
          {/* 초대장을 하나라도 만든 계정만 추려 본다 */}
          <Link
            href={filterHref(!madeOnly)}
            aria-pressed={madeOnly}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
              madeOnly
                ? "border-gold-300 bg-gold-50 text-gold-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {madeOnly ? "✓ " : ""}초대장 만든 계정만
          </Link>
        </div>

        {/* 이름으로 찾기 — 자바스크립트 없이 주소로 넘긴다 */}
        <form method="get" className="mt-3 flex gap-2">
          {/* 찾기를 눌러도 거르기가 풀리지 않게 함께 넘긴다 */}
          {madeOnly && <input type="hidden" name="made" value="1" />}
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
              href={filterHref(madeOnly)}
              className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50"
            >
              전체
            </Link>
          )}
        </form>

        {shown.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-gold-100 bg-white px-4 py-6 text-center text-sm text-gray-400">
            {q
              ? `"${q}"로 찾은 계정이 없어요.`
              : madeOnly
                ? "초대장을 만든 계정이 아직 없어요."
                : "아직 가입한 계정이 없어요."}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {shown.map((a) => (
              <AccountCard key={a.id} account={a} items={byUser.get(a.id) ?? []} />
            ))}
          </ul>
        )}

        {/* 쪽 번호 — 지금 쪽 둘레로 다섯 개, 나머지는 화살표로 */}
        {pages > 1 && (
          <nav className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            <PageArrow
              href={pageHref(page - 1)}
              disabled={page === 1}
              label="이전 쪽"
            >
              ‹
            </PageArrow>
            {nums.map((n) => (
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
            <PageArrow
              href={pageHref(page + 1)}
              disabled={page === pages}
              label="다음 쪽"
            >
              ›
            </PageArrow>
            <span className="ml-1 text-xs text-gray-400">
              {page} / {pages}
            </span>
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

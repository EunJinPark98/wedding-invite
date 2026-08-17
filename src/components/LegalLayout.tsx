import Link from "next/link";
import { EFFECTIVE_DATE } from "@/lib/legal";

/** 이용약관 · 개인정보처리방침이 함께 쓰는 껍데기 (헤더 · 본문 폭 · 시행일) */
export default function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-cream text-gray-800">
      <header className="border-b border-gold-200/50 bg-white/85">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
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
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-6 py-10">
        <h1
          className="text-2xl text-ink"
          style={{ fontFamily: "var(--font-song)" }}
        >
          {title}
        </h1>
        <p className="mt-2 text-xs text-gray-400">시행일 {EFFECTIVE_DATE}</p>
        <div className="legal mt-8">{children}</div>

        <div className="mt-14 border-t border-gold-200/50 pt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gold-600 transition hover:text-gold-500"
          >
            홈으로
          </Link>
        </div>
      </article>
    </main>
  );
}

/** 번호가 붙는 큰 항목 */
export function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="text-base font-semibold text-gray-800">
        제{n}조 ({title})
      </h2>
      <div className="mt-2.5 space-y-2.5 text-sm leading-7 text-gray-600">
        {children}
      </div>
    </section>
  );
}

/** 조 안에서 ①②③ 로 나뉘는 항 */
export function Clause({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  const marks = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return (
    <p className="flex gap-2">
      <span className="shrink-0 text-gray-400">{marks[n - 1] ?? `${n}.`}</span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** 가운뎃점 목록 */
export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="ml-1 space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="shrink-0 text-gold-300">·</span>
          <span className="min-w-0">{it}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * 항목 묶음. 폰 화면에서는 칸이 세 개인 표를 그리면 마지막 칸이 잘려 나가므로,
 * 한 줄을 카드 하나로 눕히고 칸 이름을 왼쪽에 붙인다.
 */
export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div
          key={i}
          className="rounded-xl border border-gold-100 bg-white/60 px-4 py-3"
        >
          {r.map((c, j) => (
            <div key={j} className="flex gap-3 py-1">
              <span className="w-[68px] shrink-0 text-xs leading-6 text-gray-400">
                {head[j]}
              </span>
              <span className="min-w-0 flex-1 text-[13px] leading-6 text-gray-700">
                {c}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

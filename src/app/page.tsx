import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";
import { emptyInvitation } from "@/lib/types";
import InvitationView from "@/components/InvitationView";

// 카드 미리보기용 샘플 (갤러리·계좌는 비워 히어로만 가볍게 보여줌)
const SAMPLE = { ...emptyInvitation(), gallery: [], accounts: [] };

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbf7f3] text-gray-800">
      {/* 상단 네비 */}
      <header className="sticky top-0 z-40 border-b border-rose-100/70 bg-[#fbf7f3]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-400 text-xs text-white">
              ♡
            </span>
            <span
              className="text-lg text-gray-900"
              style={{ fontFamily: "var(--font-song)" }}
            >
              모바일 청첩장
            </span>
          </Link>
          <Link
            href="/editor"
            className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            만들기
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-rose-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-44 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-20 text-center">
          <p className="font-cormorant text-sm tracking-[0.5em] text-rose-400">
            MOBILE WEDDING INVITATION
          </p>
          <h1
            className="mt-6 text-[2.6rem] leading-[1.3] text-gray-900 sm:text-5xl"
            style={{ fontFamily: "var(--font-song)" }}
          >
            우리의 특별한 날,
            <br />
            가장 우리다운 청첩장으로
          </h1>
          <p
            className="mx-auto mt-7 max-w-md text-base leading-7 text-gray-500"
            style={{ fontFamily: "var(--font-gowun)" }}
          >
            마음에 드는 디자인을 고르고 내용을 채우면 끝.
            <br />
            완성된 청첩장 링크를 카톡으로 바로 공유하세요.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/editor"
              className="rounded-full bg-rose-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-rose-200/70 transition hover:bg-rose-600"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#templates"
              className="rounded-full border border-gray-300 bg-white/70 px-7 py-4 text-base font-semibold text-gray-600 backdrop-blur transition hover:border-gray-400"
            >
              템플릿 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* 템플릿 미리보기 */}
      <section
        id="templates"
        className="scroll-mt-16 border-y border-rose-100/70 bg-white"
      >
       <div className="mx-auto max-w-5xl px-6 py-24">
        <p className="text-center font-cormorant text-sm tracking-[0.4em] text-rose-400">
          TEMPLATES
        </p>
        <h2
          className="mt-3 text-center text-[2rem] text-gray-900"
          style={{ fontFamily: "var(--font-song)" }}
        >
          4가지 디자인 템플릿
        </h2>
        <p className="mt-3 text-center text-sm text-gray-500">
          실제 청첩장 모습 그대로 미리 보고 선택하세요.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="group overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(0,0,0,0.1)]"
            >
              {/* 실제 템플릿 히어로 미리보기 */}
              <div className="relative h-[440px] overflow-hidden bg-white">
                <div className="pointer-events-none select-none">
                  <InvitationView template={t.id} data={SAMPLE} />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/85 to-transparent" />
                <span
                  className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm"
                  style={{ background: t.accent }}
                >
                  {t.name}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 px-6 py-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{t.description}</p>
                </div>
                <Link
                  href={`/editor?template=${t.id}`}
                  className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: t.accent }}
                >
                  만들기
                </Link>
              </div>
            </div>
          ))}
        </div>
       </div>
      </section>

      {/* 사용 방법 */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <h2
          className="mb-12 text-center text-[1.7rem] text-gray-900"
          style={{ fontFamily: "var(--font-song)" }}
        >
          이렇게 만들어요
        </h2>
        <div className="grid gap-6 text-center sm:grid-cols-3">
          {[
            ["01", "템플릿 선택", "마음에 드는 디자인을 고르세요"],
            ["02", "내용 입력", "이름, 일시, 장소, 인사말을 작성하세요"],
            ["03", "링크 공유", "완성된 청첩장 링크를 공유하세요"],
          ].map(([n, title, desc]) => (
            <div
              key={n}
              className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm"
            >
              <span className="font-cormorant text-2xl tracking-widest text-rose-300">
                {n}
              </span>
              <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 py-10 text-center">
        <p className="font-cormorant text-xs tracking-[0.4em] text-gray-400">
          MADE WITH LOVE
        </p>
        <p className="mt-2 text-xs text-gray-400">
          나만의 모바일 청첩장 · 무료로 만들기
        </p>
      </footer>
    </main>
  );
}

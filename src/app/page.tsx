import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";
import { emptyInvitation } from "@/lib/types";
import InvitationView from "@/components/InvitationView";
import AuthStatus from "@/components/AuthStatus";

// 카드 미리보기용 샘플 (갤러리·계좌는 비워 히어로만 가볍게 보여줌)
const SAMPLE = { ...emptyInvitation(), gallery: [], accounts: [] };

export default function Home() {
  return (
    <main className="min-h-screen bg-cream text-gray-800">
      {/* 상단 네비 — 화이트 + 골드 헤어라인으로 크림 본문과 구분 */}
      <header className="sticky top-0 z-40 border-b border-gold-200/50 bg-white/85 shadow-[0_1px_14px_rgba(198,162,63,0.10)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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
          <div className="flex items-center gap-4">
            <AuthStatus />
            <Link
              href="/editor"
              className="rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-gold-300/40 transition hover:from-gold-500 hover:to-gold-600"
            >
              만들기
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-gold-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-44 h-72 w-72 rounded-full bg-gold-100/40 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-20 text-center">
          <p className="font-cormorant text-sm tracking-[0.5em] text-gold-400">
            MOBILE WEDDING INVITATION
          </p>
          <h1
            className="mt-6 text-[2.6rem] leading-[1.3] text-ink sm:text-5xl"
            style={{ fontFamily: "var(--font-song)" }}
          >
            우리의 별처럼 빛나는 시작,
            <br />
            가장 우리다운 청첩장으로
          </h1>
          <p
            className="mx-auto mt-7 max-w-md text-base leading-7 text-gray-500"
            style={{ fontFamily: "var(--font-gowun)" }}
          >
            디자인을 고르고 내용을 채우면, 하나뿐인 청첩장이 완성돼요.
            <br />
            반짝이는 시작을 카톡 링크로 바로 전하세요.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/editor"
              className="rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-gold-300/50 transition hover:from-gold-500 hover:to-gold-600"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#templates"
              className="rounded-full border border-gold-300/70 bg-white/80 px-7 py-4 text-base font-semibold text-gray-600 backdrop-blur transition hover:border-gold-400 hover:text-gold-600"
            >
              템플릿 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* 템플릿 미리보기 */}
      <section
        id="templates"
        className="scroll-mt-16 border-y border-gold-100/70 bg-white"
      >
       <div className="mx-auto max-w-5xl px-6 py-24">
        <p className="text-center font-cormorant text-sm tracking-[0.4em] text-gold-400">
          TEMPLATES
        </p>
        <h2
          className="mt-3 text-center text-[2rem] text-ink"
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
                  <h3 className="text-lg font-semibold text-ink">
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
          className="mb-12 text-center text-[1.7rem] text-ink"
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
              <span className="font-cormorant text-2xl tracking-widest text-gold-300">
                {n}
              </span>
              <h3 className="mt-3 font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gold-200/50 bg-white py-14 text-center">
        <div className="flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-full shadow-sm" />
          <span
            className="text-lg text-ink"
            style={{ fontFamily: "var(--font-song)" }}
          >
            별빛 초대장
          </span>
        </div>
        <div className="mx-auto mt-7 flex items-center justify-center gap-2.5">
          <span className="h-px w-12 bg-gold-200" />
          <span className="text-[10px] text-gold-400">✦</span>
          <span className="h-px w-12 bg-gold-200" />
        </div>
        <p className="mt-6 text-xs leading-6 text-gray-400">
          <span className="font-medium text-gold-500">별마마파파</span>
          <br />
          결혼 · 육아 · 가족을 위한 웹서비스
        </p>
        <p className="mt-4 text-[11px] text-gray-300">
          © 2026 별마마파파. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { getTemplatesByCategory } from "@/lib/templates";
import { CATEGORIES, getCategoryMeta } from "@/lib/categories";
import { emptyInvitation, CATEGORY_IDS, type Category } from "@/lib/types";
import InvitationView from "@/components/InvitationView";
import AuthStatus from "@/components/AuthStatus";
import ThemePickerButton from "@/components/ThemePickerButton";
import { OPERATOR_URL } from "@/lib/legal";

// 카카오톡 채널 「별마마파파」 문의 링크
const KAKAO_CHANNEL_URL = "http://pf.kakao.com/_GxfxbwX";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const category: Category = CATEGORY_IDS.includes(rawCategory as Category)
    ? (rawCategory as Category)
    : "wedding";
  const catMeta = getCategoryMeta(category);
  // 선택한 카테고리 전용 템플릿만 노출
  const templates = getTemplatesByCategory(category);
  // 카드 미리보기용 샘플 (갤러리·계좌는 비워 히어로만 가볍게 보여줌)
  const SAMPLE = { ...emptyInvitation(category), gallery: [], accounts: [] };

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
              className="text-base text-ink sm:text-xl"
              style={{ fontFamily: "var(--font-song)" }}
            >
              별빛 초대장
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <AuthStatus />
            {/* 모바일은 헤더가 좁아 숨김 — 히어로의 제작 버튼으로 유도 */}
            <Link
              href="/editor"
              className="hidden rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-gold-300/40 transition hover:from-gold-500 hover:to-gold-600 sm:inline-block"
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
            MOBILE INVITATION
          </p>
          <h1
            className="mt-6 text-[1.9rem] leading-[1.4] text-ink sm:text-5xl sm:leading-[1.3]"
            style={{ fontFamily: "var(--font-song)" }}
          >
            별처럼 빛나는 순간,
            <br />
            직접 만든 초대장으로
          </h1>
          <p
            className="mx-auto mt-7 max-w-md text-base leading-7 text-gray-500"
            style={{ fontFamily: "var(--font-gowun)" }}
          >
            결혼식·백일·돌잔치·칠순·팔순·생일까지,
            <br />
            디자인을 고르고 내용을 채우면
            <br />
            하나뿐인 초대장이 완성돼요.
            <br />
            소중한 날을 카톡 링크로 바로 전하세요.
          </p>
          <div className="mx-auto mt-10 flex max-w-[280px] flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
            <ThemePickerButton className="rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-8 py-4 text-center text-base font-semibold text-white shadow-lg shadow-gold-300/50 transition hover:from-gold-500 hover:to-gold-600" />
            <Link
              href="#templates"
              className="rounded-full border border-gold-300/70 bg-white/80 px-7 py-4 text-center text-base font-semibold text-gray-600 backdrop-blur transition hover:border-gold-400 hover:text-gold-600"
            >
              템플릿 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* 카테고리 선택 — 결혼 외 다른 인생 이벤트 초대장 */}
      <section className="border-t border-gold-100/70 bg-cream/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-center font-cormorant text-sm tracking-[0.4em] text-gold-400">
            OCCASIONS
          </p>
          <h2
            className="mt-3 text-center text-[1.4rem] text-ink sm:text-[1.7rem]"
            style={{ fontFamily: "var(--font-song)" }}
          >
            어떤 초대장을 만들까요?
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {CATEGORIES.map((c) => {
              const selected = c.id === category;
              return (
                <Link
                  key={c.id}
                  href={`/?category=${c.id}#templates`}
                  className={`rounded-2xl border-2 px-4 py-6 text-center transition ${
                    selected
                      ? "border-gold-400 bg-white shadow-md shadow-gold-200/50"
                      : "border-gold-100 bg-white/70 hover:border-gold-300"
                  }`}
                >
                  <span className="block text-3xl">{c.emoji}</span>
                  <span className="mt-3 block text-sm font-semibold text-ink">
                    {c.label}
                  </span>
                  <span className="mt-1 block text-xs text-gray-400">
                    {c.tagline}
                  </span>
                </Link>
              );
            })}
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
          className="mt-3 text-center text-[1.6rem] text-ink sm:text-[2rem]"
          style={{ fontFamily: "var(--font-song)" }}
        >
          {catMeta.label} 템플릿
        </h2>
        <p className="mt-3 text-center text-sm text-gray-500">
          {catMeta.tagline} · 실제 모습 그대로 미리 보고 선택하세요.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {templates.map((t) => (
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
                  href={`/editor?template=${t.id}&category=${category}`}
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
            ["01", "템플릿 선택", "어떤 날인지 고르고 마음에 드는 디자인을 선택하세요"],
            ["02", "내용 입력", "이름, 일시, 장소, 인사말을 작성하세요"],
            ["03", "링크 공유", "완성된 초대장 링크를 공유하세요"],
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
        <span
          className="text-lg text-ink"
          style={{ fontFamily: "var(--font-song)" }}
        >
          별빛 초대장
        </span>
        <div className="mx-auto mt-7 flex items-center justify-center gap-2.5">
          <span className="h-px w-12 bg-gold-200" />
          <span className="text-[10px] text-gold-400">✦</span>
          <span className="h-px w-12 bg-gold-200" />
        </div>
        <a
          href={OPERATOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-1.5 transition hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-5 w-5 rounded-full shadow-sm" />
          <span className="text-xs font-medium text-gold-500">별마마파파</span>
        </a>
        <p className="mt-1.5 text-xs text-gray-400">
          결혼 · 육아 · 가족을 위한 웹서비스
        </p>

        {/* 문의하기 */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <a
            href="https://instagram.com/byeolmamapapa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-gold-200 px-4 py-2 text-xs font-medium text-gold-600 transition hover:bg-gold-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2m-.3 2C5.5 4 4 5.5 4 7.5v9c0 2 1.5 3.5 3.5 3.5h9c2 0 3.5-1.5 3.5-3.5v-9c0-2-1.5-3.5-3.5-3.5h-9m11.1 1.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1m-5.8 1.5c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6m0 2c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" />
            </svg>
            Instagram
          </a>
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-gold-200 px-4 py-2 text-xs font-medium text-gold-600 transition hover:bg-gold-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.54 2 10.9c0 2.8 1.86 5.26 4.66 6.65l-.95 3.51c-.08.31.27.56.54.38l4.13-2.73c.53.05 1.07.08 1.62.08 5.52 0 10-3.54 10-7.9S17.52 3 12 3z" />
            </svg>
            카카오톡 문의
          </a>
        </div>

        {/* 소셜 로그인 동의 화면이 "이 서비스의 이용약관·개인정보처리방침에 따라
            관리된다"고 안내하므로, 두 문서로 가는 길이 늘 열려 있어야 한다 */}
        <div className="mt-7 flex items-center justify-center gap-3 text-xs">
          <Link
            href="/terms"
            className="text-gray-400 transition hover:text-gold-600"
          >
            이용약관
          </Link>
          <span className="h-2.5 w-px bg-gray-200" />
          <Link
            href="/privacy"
            className="font-medium text-gray-500 transition hover:text-gold-600"
          >
            개인정보처리방침
          </Link>
        </div>

        <p className="mt-5 text-[11px] text-gray-300">
          © 2026 별마마파파. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

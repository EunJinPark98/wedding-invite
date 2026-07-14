"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authEnabled, supabaseBrowser } from "@/lib/supabase/client";

type Provider = "kakao" | "naver";

export default function LoginClient() {
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/";
  // open-redirect 방지
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const errParam = params.get("error");
  const reason = params.get("r"); // 실패 단계 (디버그용)
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(
    errParam === "auth"
      ? `로그인에 실패했어요. 다시 시도해 주세요.${reason ? ` (코드: ${reason})` : ""}`
      : errParam === "naver_config"
        ? `네이버 로그인 설정이 아직 완료되지 않았어요.${
            params.get("m") ? ` (누락: ${params.get("m")})` : " (캐시된 이전 오류일 수 있어요 — 다시 눌러보세요)"
          }`
        : null
  );

  // 카카오: Supabase 기본 OAuth
  async function signInKakao() {
    if (!authEnabled) {
      setError("로컬 개발 모드에서는 로그인이 비활성화돼 있어요.");
      return;
    }
    setBusy("kakao");
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setBusy(null);
    }
  }

  // 네이버: 커스텀 OAuth 플로우 (서버 라우트가 처리)
  function signInNaver() {
    if (!authEnabled) {
      setError("로컬 개발 모드에서는 로그인이 비활성화돼 있어요.");
      return;
    }
    setBusy("naver");
    setError(null);
    // 주소창에 남은 이전 에러 파라미터 제거 (뒤로가기 시 재표시 방지)
    window.history.replaceState(null, "", `/login?next=${encodeURIComponent(next)}`);
    // t= 캐시버스터: 브라우저가 과거 실패 리다이렉트를 재사용하지 못하게 함
    window.location.href = `/api/auth/naver/start?next=${encodeURIComponent(next)}&t=${Date.now()}`;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-gold-100 bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="별빛 초대장"
            className="mx-auto h-16 w-16 rounded-full shadow-md"
          />
          <h1
            className="mt-5 text-2xl text-ink"
            style={{ fontFamily: "var(--font-song)" }}
          >
            별빛 초대장
          </h1>
          <p className="mt-5 text-sm leading-6 text-gray-500">
            로그인하고 나만의 청첩장을
            <br />
            만들어 보세요.
          </p>

          <div className="mt-7 space-y-2.5">
            {/* 카카오 */}
            <button
              type="button"
              onClick={signInKakao}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FEE500] py-3.5 text-sm font-semibold text-[#191919] transition hover:brightness-95 disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#191919"
                  d="M12 3C6.48 3 2 6.54 2 10.9c0 2.8 1.86 5.26 4.66 6.65l-.95 3.51c-.08.31.27.56.54.38l4.13-2.73c.53.05 1.07.08 1.62.08 5.52 0 10-3.54 10-7.9S17.52 3 12 3z"
                />
              </svg>
              {busy === "kakao" ? "카카오로 이동 중..." : "카카오로 시작하기"}
            </button>
            {/* 네이버 */}
            <button
              type="button"
              onClick={signInNaver}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#03C75A] py-3.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#fff"
                  d="M16.27 3v9.4L7.9 3H3v18h4.73v-9.4L16.1 21H21V3h-4.73z"
                />
              </svg>
              {busy === "naver" ? "네이버로 이동 중..." : "네이버로 시작하기"}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <p className="mt-6 text-[11px] leading-5 text-gray-400">
            모든 기능 무료 · 계정당 청첩장 1개 · 제작 후 1회 수정 가능
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gold-500">
            ← 홈으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}

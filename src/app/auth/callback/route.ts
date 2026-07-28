import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  SESSION_START_COOKIE,
  sessionMarkerCookieOptions,
} from "@/lib/session";

// SNS 로그인 후 리다이렉트되는 콜백: code를 세션으로 교환
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  // open-redirect 방지: 내부 경로만 허용
  const nextParam = url.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(new URL(next, url.origin));
      // 로그인 시각 기록 — 24시간이 지나면 proxy에서 세션을 정리한다
      res.cookies.set(
        SESSION_START_COOKIE,
        String(Date.now()),
        sessionMarkerCookieOptions
      );
      return res;
    }
  }

  return NextResponse.redirect(
    new URL(`/login?error=auth&next=${encodeURIComponent(next)}`, url.origin)
  );
}

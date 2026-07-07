import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// 네이버 로그인 시작: 네이버 인증 페이지로 리다이렉트 (state는 쿠키로 CSRF 방지)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawNext = url.searchParams.get("next") ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  // 어떤 변수가 비어있는지 진단 정보 포함
  const missing: string[] = [];
  if (!clientId) missing.push("id");
  if (!process.env.NAVER_CLIENT_SECRET?.trim()) missing.push("secret");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push("key");
  if (missing.length > 0) {
    const res = NextResponse.redirect(
      new URL(`/login?error=naver_config&m=${missing.join(",")}`, url.origin)
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const state = randomBytes(16).toString("hex");
  const authorize = new URL("https://nid.naver.com/oauth2.0/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", `${url.origin}/api/auth/naver/callback`);
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize);
  res.headers.set("Cache-Control", "no-store");
  const secure = url.protocol === "https:";
  res.cookies.set("naver_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 600,
    path: "/",
  });
  res.cookies.set("naver_oauth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 600,
    path: "/",
  });
  return res;
}

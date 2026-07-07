import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * 네이버 OAuth 콜백.
 * Supabase는 네이버를 기본 제공하지 않으므로:
 * 네이버 토큰 → 프로필 조회 → (admin) 유저 확보 → magiclink 토큰 발급
 * → verifyOtp 로 쿠키 세션 생성.
 */

// reason: 실패 단계 식별용 (r=state|token|profile|admin|otp)
function fail(origin: string, reason: string) {
  console.error(`[naver-login] failed at: ${reason}`);
  return NextResponse.redirect(
    new URL(`/login?error=auth&r=${reason}`, origin)
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("naver_oauth_state")?.value;
  const rawNext = cookieStore.get("naver_oauth_next")?.value ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // 복사/붙여넣기로 섞인 공백·줄바꿈 방어
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!clientId || !clientSecret || !serviceKey || !supaUrl) {
    const missing = [
      !clientId && "id",
      !clientSecret && "secret",
      !serviceKey && "key",
      !supaUrl && "url",
    ]
      .filter(Boolean)
      .join(",");
    const res = NextResponse.redirect(
      new URL(`/login?error=naver_config&m=${missing}`, url.origin)
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  // CSRF 검증
  if (!code || !state || !savedState || state !== savedState) {
    return fail(url.origin, "state");
  }

  try {
    // 1) 액세스 토큰 교환 (표준 form POST)
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
      }),
      cache: "no-store",
    });
    const token = await tokenRes.json();
    if (!token?.access_token) {
      console.error("[naver-login] token response:", JSON.stringify(token));
      const desc = String(token?.error_description ?? "").slice(0, 60);
      return fail(
        url.origin,
        `token-${token?.error ?? "unknown"}${desc ? `-${desc}` : ""}`
      );
    }

    // 2) 프로필 조회
    const profRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    const prof = (await profRes.json())?.response as
      | { id: string; email?: string; name?: string; nickname?: string }
      | undefined;
    if (!prof?.id) return fail(url.origin, "profile");

    // 이메일 미제공 동의 시에도 계정을 만들 수 있게 결정적 대체 이메일 사용
    const email =
      prof.email ?? `naver-${prof.id}@users.noreply.starlight-invite.app`;
    const name = prof.name ?? prof.nickname ?? "네이버 사용자";

    // 3) admin 클라이언트로 유저 확보 + magiclink 토큰 발급
    const admin = createClient(supaUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let linkRes = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkRes.error) {
      // 처음 로그인 → 유저 생성 후 재시도
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name, provider: "naver", naver_id: prof.id },
      });
      if (created.error) {
        console.error("[naver-login] createUser:", created.error.message);
        return fail(url.origin, "create");
      }
      linkRes = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (linkRes.error) {
        console.error("[naver-login] generateLink:", linkRes.error.message);
        return fail(url.origin, "link");
      }
    }

    const tokenHash = linkRes.data.properties?.hashed_token;
    if (!tokenHash) return fail(url.origin, "hash");

    // 4) ssr 클라이언트로 세션 쿠키 생성
    const supabase = await supabaseServer();
    const { error: otpError } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    if (otpError) {
      console.error("[naver-login] verifyOtp:", otpError.message);
      return fail(url.origin, "otp");
    }

    const res = NextResponse.redirect(new URL(next, url.origin));
    res.cookies.delete("naver_oauth_state");
    res.cookies.delete("naver_oauth_next");
    return res;
  } catch (e) {
    console.error("[naver-login] exception:", e);
    return fail(url.origin, "exception");
  }
}

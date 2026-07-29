import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_START_COOKIE,
  isSessionExpired,
  isSupabaseSessionCookie,
} from "@/lib/session";

/**
 * 로그인 후 24시간이 지난 세션을 정리한다.
 * (브라우저를 닫았을 때의 로그아웃은 인증 쿠키를 세션 쿠키로 발급해 처리 — lib/session.ts)
 */
export function proxy(request: NextRequest) {
  // 로그인 진행 중에만 있는 code_verifier 는 세션이 아니므로 건드리지 않는다
  const authCookies = request.cookies
    .getAll()
    .filter((c) => isSupabaseSessionCookie(c.name));

  // 비로그인(로그인 진행 중 포함) 요청은 그대로 통과
  if (authCookies.length === 0) return NextResponse.next();

  const startedAt = request.cookies.get(SESSION_START_COOKIE)?.value;
  if (!isSessionExpired(startedAt)) return NextResponse.next();

  // 만료 — 이번 요청이 로그인 상태로 렌더되지 않도록 요청 쿠키에서도 걷어낸다
  const stale = new Set([
    ...authCookies.map((c) => c.name),
    SESSION_START_COOKIE,
  ]);
  const headers = new Headers(request.headers);
  const kept = request.cookies.getAll().filter((c) => !stale.has(c.name));
  if (kept.length > 0) {
    headers.set("cookie", kept.map((c) => `${c.name}=${c.value}`).join("; "));
  } else {
    headers.delete("cookie");
  }

  const res = NextResponse.next({ request: { headers } });
  stale.forEach((name) => res.cookies.delete(name));
  return res;
}

export const config = {
  // 정적 자산을 제외한 모든 경로 (페이지 · API 모두 검사)
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};

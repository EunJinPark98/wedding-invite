/**
 * 로그인 세션 수명 정책.
 *
 * Supabase 기본값은 인증 쿠키를 400일 만료로 굽기 때문에 창을 닫았다 열어도
 * 로그인이 유지된다. 두 겹으로 막는다.
 *   1) 인증 쿠키에서 만료 시각을 지워 "세션 쿠키"로 발급 → 브라우저를 닫으면 사라짐
 *   2) 로그인 시각을 표식 쿠키에 남기고, 24시간이 지나면 proxy에서 인증 쿠키 삭제
 *      → 창을 계속 열어둬도 하루가 지나면 로그아웃
 */

// 로그인 시각(ms)을 담는 표식 쿠키
export const SESSION_START_COOKIE = "sl_session_start";

// 로그인 후 최대 유지 시간
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Supabase가 발급하는 인증 쿠키 접두사
export const SUPABASE_COOKIE_PREFIX = "sb-";

// 표식 쿠키도 세션 쿠키로 발급해 인증 쿠키와 생명주기를 맞춘다
export const sessionMarkerCookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
} as const;

/**
 * 표식이 없으면 이 정책 이전에 발급된(=만료 없는) 세션이므로 만료로 취급해
 * 다시 로그인하게 한다.
 */
export function isSessionExpired(startedAt: string | undefined): boolean {
  if (!startedAt) return true;
  const started = Number(startedAt);
  if (!Number.isFinite(started)) return true;
  return Date.now() - started > SESSION_MAX_AGE_MS;
}

type WritableCookieOptions = {
  maxAge?: number;
  expires?: Date;
  [key: string]: unknown;
};

/**
 * 쿠키 옵션에서 만료 시각을 제거해 세션 쿠키로 만든다.
 * maxAge가 0인 경우는 Supabase의 쿠키 삭제 요청이므로 그대로 둔다.
 */
export function toSessionCookie<T extends WritableCookieOptions>(
  options: T | undefined
): Partial<T> {
  if (!options) return {};
  if (options.maxAge === 0) return options;
  const { maxAge: _maxAge, expires: _expires, ...rest } = options;
  return rest as Partial<T>;
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { toSessionCookie } from "@/lib/session";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase 미설정(로컬 개발) 시 로그인 기능 비활성
export const authEnabled = Boolean(URL && KEY);

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// @supabase/ssr 기본 구현과 동일하게 document.cookie를 읽되, 쓸 때만 만료를 뺀다.
function readCookies() {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie.split("; ").map((pair) => {
    const eq = pair.indexOf("=");
    return eq < 0
      ? { name: decode(pair), value: "" }
      : { name: decode(pair.slice(0, eq)), value: decode(pair.slice(eq + 1)) };
  });
}

function serialize(
  name: string,
  value: string,
  options: Record<string, unknown>
) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  const { path, domain, maxAge, sameSite, secure } = options as {
    path?: string;
    domain?: string;
    maxAge?: number;
    sameSite?: string;
    secure?: boolean;
  };
  parts.push(`Path=${path ?? "/"}`);
  if (domain) parts.push(`Domain=${domain}`);
  // maxAge가 남아있는 경우는 Supabase의 삭제 요청(0)뿐
  if (typeof maxAge === "number") parts.push(`Max-Age=${Math.floor(maxAge)}`);
  if (sameSite)
    parts.push(`SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}`);
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function supabaseBrowser() {
  return createBrowserClient(URL!, KEY!, {
    cookies: {
      getAll: readCookies,
      setAll(cookiesToSet) {
        // 만료 시각 없이 저장 → 브라우저를 닫으면 세션이 사라짐
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = serialize(name, value, toSessionCookie(options));
        });
      },
    },
  });
}

import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authEnabled = Boolean(URL && KEY);

// 요청 쿠키에 담긴 세션으로 동작하는 서버용 클라이언트 (Next 16: cookies()는 async)
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(URL!, KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 호출되면 set 불가 — Route Handler에서는 정상 동작
        }
      },
    },
  });
}

// 현재 로그인한 사용자 (없으면 null)
export async function getUser() {
  if (!authEnabled) return null;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { toSessionCookie } from "@/lib/session";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authEnabled = Boolean(URL && KEY);

/**
 * PR 미리보기 배포인가.
 *
 * Vercel 이 배포마다 넣어 주는 값으로, 실제 서비스에서는 반드시 "production"
 * 이라 여기가 true 가 될 수 없다. 로컬 개발에서는 값 자체가 없다.
 */
export const isPreviewDeploy = process.env.VERCEL_ENV === "preview";

/**
 * 로그인을 요구할지.
 *
 * 미리보기 배포는 주소가 배포마다 달라, 카카오·네이버에 등록해 둔 로그인
 * 복귀 주소와 맞지 않아 로그인 자체가 불가능하다. 그래서 미리보기에서만
 * 로그인 없이 둘러볼 수 있게 한다.
 *
 * 실제 서비스(VERCEL_ENV="production")에서는 이 값이 authEnabled 와 같아
 * 지금까지와 똑같이 로그인을 요구한다.
 */
export const loginRequired = authEnabled && !isPreviewDeploy;

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
          // 만료 시각을 지워 세션 쿠키로 발급 (브라우저를 닫으면 로그아웃)
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, toSessionCookie(options))
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

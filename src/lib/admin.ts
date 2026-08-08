import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * 운영 현황 화면(/pej)에 들어올 수 있는 사람.
 *
 * ADMIN_EMAILS 환경 변수에 쉼표로 나열한다 (예: "a@x.com, b@y.com").
 * 비워 두면 아무도 못 들어온다 — 실수로 열려 있는 것보다 닫혀 있는 편이 낫다.
 * 여기서 보는 것은 다른 사람이 만든 초대장이므로, 서비스 운영에 필요한
 * 범위에서만 쓴다.
 */
export const adminEmails = (): string[] =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (email: string | null | undefined): boolean => {
  const list = adminEmails();
  if (list.length === 0 || !email) return false;
  return list.includes(email.trim().toLowerCase());
};

export interface Account {
  id: string;
  email: string;
  name: string;
  nickname: string;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const pick = (m: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) {
    const v = m[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};

/**
 * 가입한 계정 전체.
 *
 * 회원 목록은 service_role 키가 있어야 읽을 수 있다. 키가 없으면 빈 배열을
 * 돌려주고, 화면에서는 초대장만 보여 준다.
 * 한 번에 다 오지 않으므로 더 없을 때까지 이어서 받는다.
 */
export async function listAccounts(): Promise<Account[]> {
  if (!SUPABASE_URL || !SERVICE_KEY) return [];
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const out: Account[] = [];
  const perPage = 200;
  // 끝없이 도는 일이 없도록 상한을 둔다 (200 × 25 = 5,000명)
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    for (const u of users) {
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      const app = (u.app_metadata ?? {}) as Record<string, unknown>;
      out.push({
        id: u.id,
        email: u.email ?? "",
        name: pick(meta, "full_name", "name"),
        nickname: pick(meta, "nickname", "user_name", "preferred_username"),
        // 네이버는 우리가 직접 만든 계정이라 user_metadata 에 표식을 남긴다
        provider: pick(meta, "provider") || pick(app, "provider"),
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
      });
    }
    if (users.length < perPage) break;
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

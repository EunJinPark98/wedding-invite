import "server-only";
import { createClient } from "@supabase/supabase-js";
import { deleteInvitationsOfUser } from "./store";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// 카카오 어드민 키가 있으면 계정을 지울 때 카카오 쪽 연결도 함께 끊는다.
// 없으면 계정만 지우고, 연결 끊기는 사용자가 카카오계정에서 직접 해야 한다.
const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;

export const accountAdminReady = Boolean(SUPABASE_URL && SERVICE_KEY);

function admin() {
  return createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * 카카오 "연결 끊기".
 *
 * 이걸 해 두지 않으면, 탈퇴한 사람이 다시 로그인할 때 카카오가 "이미 동의한
 * 앱"으로 보고 동의 화면 없이 통과시킨다. 실패해도 탈퇴 자체는 막지 않는다.
 */
async function unlinkKakao(kakaoUserId: string): Promise<boolean> {
  if (!KAKAO_ADMIN_KEY) return false;
  try {
    const res = await fetch("https://kapi.kakao.com/v1/user/unlink", {
      method: "POST",
      headers: {
        Authorization: `KakaoAK ${KAKAO_ADMIN_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target_id_type: "user_id",
        target_id: kakaoUserId,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[account-delete] kakao unlink:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[account-delete] kakao unlink:", e);
    return false;
  }
}

/**
 * 계정과 그 계정이 만든 것을 모두 지운다. 되돌릴 수 없다.
 *
 * 초대장을 먼저 지워야 한다 — invitations.user_id 가 auth.users 를 참조해서,
 * 남아 있으면 계정 삭제가 실패한다.
 */
export async function deleteAccount(
  userId: string
): Promise<{ removed: number; unlinked: boolean }> {
  const removed = await deleteInvitationsOfUser(userId);

  // 소셜 연결 끊기 (카카오만 가능 — 네이버는 사용자 토큰이 있어야 한다)
  let unlinked = false;
  const { data: found } = await admin().auth.admin.getUserById(userId);
  const kakao = found?.user?.identities?.find((i) => i.provider === "kakao");
  if (kakao) {
    const kakaoId =
      (kakao.identity_data?.provider_id as string | undefined) ??
      (kakao.identity_data?.sub as string | undefined) ??
      kakao.id;
    if (kakaoId) unlinked = await unlinkKakao(String(kakaoId));
  }

  const { error } = await admin().auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  return { removed, unlinked };
}

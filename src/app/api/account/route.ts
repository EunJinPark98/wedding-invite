import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { accountAdminReady, deleteAccount } from "@/lib/account";
import { isAdminEmail } from "@/lib/admin";

/**
 * 회원 탈퇴 — 만든 초대장과 사진, 계정을 모두 지운다. 되돌릴 수 없다.
 *
 * 몸통에 userId 를 실어 보내면 그 계정을 지운다. 단, 운영자(ADMIN_EMAILS)만
 * 남의 계정을 지울 수 있고, 그 외에는 자기 계정만 지울 수 있다.
 */
export async function DELETE(req: Request) {
  if (!accountAdminReady) {
    return NextResponse.json(
      { error: "서버 설정이 완료되지 않았습니다." },
      { status: 500 }
    );
  }
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // 몸통이 비어 있으면 자기 자신을 지우는 것으로 본다
  let target = user.id;
  try {
    const body = (await req.json()) as { userId?: unknown };
    if (typeof body?.userId === "string" && body.userId) target = body.userId;
  } catch {
    // 몸통 없음 — 자기 탈퇴
  }

  if (target !== user.id && !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const result = await deleteAccount(target);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[account-delete]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "탈퇴에 실패했습니다." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { purgeUnusedImages } from "@/lib/store";

/**
 * 어느 초대장에도 딸리지 않은 사진을 지금 정리한다 (운영자 전용).
 *
 * 만들다 그만두거나 다른 사진으로 바꾸면 아무 데도 쓰이지 않는 파일이 남는데,
 * 밤마다 자동으로 지우던 것은 없앴다 — "이어서 작성"으로 돌아온 사람의 사진까지
 * 지워 버려 사진 자리가 깨져 보였다. 그래서 저장소 용량이 부담될 때 운영자가
 * 판단해서 직접 돌린다.
 *
 * 그래도 이어서 쓸 수 있는 기간(types.ts의 DRAFT_MAX_AGE_HOURS) 안에 올라온
 * 사진은 남긴다. 지금 만들고 있는 사람의 사진까지 지우면 안 되기 때문이다.
 */
export async function POST() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  try {
    const removed = await purgeUnusedImages();
    return NextResponse.json({ ok: true, removed });
  } catch (e) {
    console.error("[pej-images]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "정리에 실패했습니다." },
      { status: 500 }
    );
  }
}

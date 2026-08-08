import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { purgeUnusedImages } from "@/lib/store";

/**
 * 어느 초대장에도 딸리지 않은 사진을 지금 정리한다 (운영자 전용).
 *
 * 밤마다 도는 정리 작업(/api/cron/purge)이 같은 일을 하지만, 저장소가 지저분할
 * 때 기다리지 않고 바로 돌릴 수 있게 둔다.
 * 편집 중인 사람의 사진을 지우지 않도록 올라온 지 하루가 지난 것만 지운다.
 */
export async function POST() {
  const user = await getUser();
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  try {
    const removed = await purgeUnusedImages(24);
    return NextResponse.json({ ok: true, removed });
  } catch (e) {
    console.error("[pej-images]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "정리에 실패했습니다." },
      { status: 500 }
    );
  }
}

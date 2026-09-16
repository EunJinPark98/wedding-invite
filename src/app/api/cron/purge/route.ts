import { NextResponse } from "next/server";
import { purgeExpiredInvitations } from "@/lib/store";

/**
 * 게시 기간이 끝난 초대장을 완전히 삭제하는 정기 작업 (DB 행 + 업로드 사진).
 * 개인정보처리방침 제3조에서 약속한 "행사 다음 날 자동 삭제"가 이것이다.
 * Vercel Cron이 하루 한 번(00:30 KST) 호출한다 — vercel.json 참고.
 *
 * 어느 초대장에도 안 딸린 사진(만들다 그만둔 것)은 여기서 건드리지 않는다.
 * 만들다 만 사람이 "이어서 작성"으로 돌아올 수 있는데, 밤사이에 지워 버리면
 * 돌아왔을 때 사진 자리가 깨져 보였다. 저장소를 비울 일이 있으면 운영자가
 * 마이페이지에서 직접 돌린다 — /api/pej/images 참고.
 *
 * 보호: CRON_SECRET 환경변수를 설정하면 Vercel이 Authorization 헤더에 실어 보낸다.
 * 미설정 시에는 아무나 호출할 수 있으므로 배포 환경에서는 반드시 설정할 것.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET이 설정되지 않았습니다." },
      { status: 503 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const result = await purgeExpiredInvitations();
    console.log(
      `[purge] 초대장 ${result.deleted}건, 사진 ${result.images}장 삭제`
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.";
    console.error("[purge] 실패:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

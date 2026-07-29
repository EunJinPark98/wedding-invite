import { NextResponse } from "next/server";
import { purgeExpiredInvitations } from "@/lib/store";

/**
 * 게시 기간이 끝난 초대장을 완전히 삭제하는 정기 작업 (DB 행 + 업로드 사진).
 * Vercel Cron이 하루 한 번(00:30 KST) 호출한다 — vercel.json 참고.
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

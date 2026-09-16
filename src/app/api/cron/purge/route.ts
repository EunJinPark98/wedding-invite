import { NextResponse } from "next/server";
import { purgeExpiredInvitations, purgeUnusedImages } from "@/lib/store";

/**
 * 밤마다 도는 정리 작업. Vercel Cron이 하루 한 번(00:30 KST) 부른다 — vercel.json 참고.
 *
 * 두 가지를 지운다.
 *
 * 1) 게시 기간이 끝난 초대장 — DB 행과 거기 딸린 사진까지.
 *    개인정보처리방침 제3조·제8조에서 약속한 "행사 다음 날 자동 삭제"가 이것이다.
 *
 * 2) 어느 초대장에도 안 딸린 사진 — 만들다 그만두었거나 다른 사진으로 바꿔서
 *    아무 데도 쓰이지 않게 된 파일.
 *
 *    두 번째는 기준이 중요하다. 만들다 만 사람은 "이어서 작성"으로 돌아올 수
 *    있는데, 돌아올 수 있는 동안에 사진을 지워 버리면 이어서 쓰기를 눌렀을 때
 *    사진 자리가 깨져 보인다. 전에 하루 만에 지우다가 실제로 그랬다. 그래서
 *    이어서 쓸 수 있는 기간(DRAFT_MAX_AGE_HOURS = 일주일)이 지난 것만 지운다.
 *    하루 한 번만 도는 작업이라 경계에서 반나절쯤 더 남을 수 있는데, 일찍
 *    지워서 사진이 깨지는 것보다 늦게 지워지는 편이 낫다.
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
    // 기본값이 "이어서 쓸 수 있는 기간"이라 여기서 숫자를 따로 적지 않는다.
    // 적어 두면 draft 기간만 바뀌었을 때 다시 어긋난다 (types.ts 참고).
    const orphans = await purgeUnusedImages();
    console.log(
      `[purge] 초대장 ${result.deleted}건, 사진 ${result.images}장, 임시저장 사진 ${orphans}장 삭제`
    );
    return NextResponse.json({ ok: true, ...result, orphans });
  } catch (e) {
    const message = e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.";
    console.error("[purge] 실패:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

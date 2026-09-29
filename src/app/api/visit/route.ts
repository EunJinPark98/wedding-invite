import { NextResponse } from "next/server";
import { bumpVisit, type VisitKind } from "@/lib/store";
import { overRateLimit } from "@/lib/ratelimit";

/**
 * 방문 한 번을 센다 (VisitCounter 가 부른다).
 *
 * 로그인 없이 부를 수 있어야 한다 — 하객도 세야 하기 때문이다. 대신 받는 것을
 * 최소한으로 줄인다. 몸통에서 읽는 것은 화면 종류와 "오늘 처음인지"뿐이고,
 * 누가 보냈는지는 보지도 남기지도 않는다.
 *
 * 숫자를 부풀리려고 두드리는 것만 막는다. 한 사람이 한 화면을 여러 번 열 수
 * 있으니 넉넉히 두되, 끝없이 세지는 않는다.
 *
 * 무엇이 잘못되든 200 으로 답한다. 이건 화면 뒤에서 조용히 도는 일이라,
 * 실패를 알려 봐야 보는 사람이 할 수 있는 것도 없고 화면만 시끄러워진다.
 */
const LIMIT = 60;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * 두드리는 쪽을 가르는 값.
 *
 * 접속 주소를 쓰되 세는 동안 기억에만 두고 어디에도 남기지 않는다. 이걸 안
 * 가르고 통째로 한도를 걸면, 사람이 늘었을 때 진짜 방문까지 버려져 숫자가
 * 오히려 틀려진다 — 부풀려지는 것보다 그쪽이 나쁘다.
 */
function who(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0]?.trim() || "unknown";
}

const isKind = (v: unknown): v is VisitKind =>
  v === "service" || v === "invitation";

// "2026-09-29" 모양만 받는다. 브라우저가 보낸 날짜라 그대로 믿지 않는다.
const isDay = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function POST(req: Request) {
  // 셀 수 있으면 세고, 아니면 그냥 넘어간다
  try {
    if (overRateLimit(`visit:${who(req)}`, LIMIT, WINDOW_MS)) {
      return NextResponse.json({ ok: true });
    }
    const body = await req.json();
    if (!isKind(body?.kind) || !isDay(body?.day)) {
      return NextResponse.json({ ok: true });
    }
    await bumpVisit(body.day, body.kind, body.firstToday === true);
  } catch {
    // 조용히 넘어간다 (위 주석 참고)
  }
  return NextResponse.json({ ok: true });
}

"use client";

import { useEffect } from "react";

/**
 * 방문 수를 한 번 올리고 마는 조각. 화면에는 아무것도 그리지 않는다.
 *
 * 누가 왔는지는 남기지 않는다 — IP 도 쿠키도 식별자도 보내지 않고, 서버로
 * 가는 것은 "오늘 서비스 화면을 열었다, 오늘 처음이다/아니다" 뿐이다.
 *
 * "오늘 처음인지"는 이 브라우저가 스스로 판단한다. 마지막으로 센 날짜만
 * 적어 두고 날짜가 바뀌면 처음으로 본다. 서버는 그 판단 결과만 받으므로
 * 사람을 알아보거나 따라다니지 않는다.
 *
 * 화면이 뜨는 것을 붙잡지 않도록 보내 놓고 잊는다. 실패해도 조용히 넘어간다 —
 * 숫자 하나 덜 세는 것보다 초대장이 안 열리는 쪽이 훨씬 나쁘다.
 */
const KEY = "starinvite-visit-day";

function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function VisitCounter() {
  useEffect(() => {
    const path = window.location.pathname;
    // 운영자가 들여다보는 화면은 세지 않는다 — 제 발자국이 숫자에 섞인다
    if (path.startsWith("/pej")) return;
    const kind = path.startsWith("/v/") ? "invitation" : "service";

    const today = todayLocal();
    let firstToday = true;
    try {
      firstToday = localStorage.getItem(KEY) !== today;
      if (firstToday) localStorage.setItem(KEY, today);
    } catch {
      // 사생활 보호 모드 등으로 막혀 있으면 매번 처음으로 친다.
      // 방문자 수가 조금 많게 잡히는 쪽이, 아예 못 세는 것보다 낫다.
    }

    // 보내 놓고 잊는다. keepalive 로 페이지를 바로 닫아도 전송이 끝난다.
    try {
      void fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, firstToday, day: today }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // 여기서 실패해도 화면에는 아무 영향이 없다
    }
  }, []);

  return null;
}

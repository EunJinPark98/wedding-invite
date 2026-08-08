"use client";

import { useState } from "react";

/**
 * 안 쓰는 사진 정리 버튼 (운영 현황).
 *
 * 사진은 "사진 추가"를 누르는 순간 올라가지만 초대장은 "제작하기"를 눌러야
 * 저장되므로, 만들다 그만두면 아무 데도 안 쓰이는 파일이 남는다. 밤마다 도는
 * 정리 작업이 같은 일을 하지만 기다리지 않고 바로 돌릴 수 있게 둔다.
 */
export default function PejCleanImages() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setDone(null);
    try {
      const res = await fetch("/api/pej/images", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "정리에 실패했습니다.");
      setDone(
        json.removed > 0
          ? `${json.removed}장 지웠어요.`
          : "지울 사진이 없었어요."
      );
    } catch (e) {
      setDone(e instanceof Error ? e.message : "정리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2.5 flex items-center gap-2.5 rounded-2xl border border-gold-100 bg-white px-4 py-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="shrink-0 rounded-lg border border-gold-200 px-3 py-1.5 text-xs font-medium text-gold-600 transition hover:bg-gold-50 disabled:opacity-60"
      >
        {busy ? "정리 중..." : "안 쓰는 사진 정리"}
      </button>
      <span className="min-w-0 flex-1 text-[11px] leading-5 text-gray-400">
        {done ?? "만들다 그만둬서 아무 초대장에도 안 딸린 사진을 지웁니다. 올라온 지 하루가 안 된 사진은 편집 중일 수 있어 남깁니다."}
      </span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 운영 현황에서 계정 하나를 지우는 버튼.
 *
 * 그 계정이 만든 초대장과 사진까지 함께 사라지므로, 무엇이 지워지는지 확인
 * 창에서 분명히 알린 뒤에만 보낸다.
 */
export default function PejDeleteAccount({
  userId,
  label,
  invitations,
}: {
  userId: string;
  label: string;
  invitations: number;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "삭제에 실패했습니다.");
      setAsking(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] text-gray-400 transition hover:border-red-200 hover:text-red-500"
      >
        계정 삭제
      </button>

      {asking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="text-3xl">🗑️</p>
            <h2 className="mt-3 text-lg font-bold text-gray-800">
              이 계정을 지울까요?
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              <strong className="text-gray-700">{label}</strong> 계정과 이
              계정이 만든 초대장 {invitations}개, 올린 사진이{" "}
              <strong className="text-red-500">모두 지워지고 복원할 수 없어요.</strong>
            </p>
            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setAsking(false)}
                disabled={busy}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={run}
                disabled={busy}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {busy ? "지우는 중..." : "지울게요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";

/**
 * 화면을 그리다 실패했을 때 (기본 영문 화면 대신).
 * reset 은 같은 화면을 한 번 더 그려 본다 — 잠깐의 통신 오류면 이걸로 풀린다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6 text-gray-800">
      <div className="w-full max-w-sm rounded-3xl border border-gold-100 bg-white p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <p className="text-4xl">🌙</p>
        <h1
          className="mt-4 text-xl text-ink"
          style={{ fontFamily: "var(--font-song)" }}
        >
          잠시 문제가 생겼어요
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-gray-500">
          다시 시도해 보시고, 계속 안 되면
          <br />
          잠시 후 들어와 주세요.
        </p>
        <div className="mt-7 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/40 transition hover:from-gold-500 hover:to-gold-600"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="flex-1 rounded-full border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            홈으로
          </Link>
        </div>
        {/* 문의 주실 때 이 값을 알려 주시면 어떤 오류인지 바로 찾을 수 있다 */}
        {error.digest && (
          <p className="mt-5 text-[11px] text-gray-300">오류 번호 {error.digest}</p>
        )}
      </div>
    </main>
  );
}

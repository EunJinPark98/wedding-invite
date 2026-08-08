import Link from "next/link";

export const metadata = { title: "페이지를 찾을 수 없어요" };

/** 없는 주소로 들어왔을 때 (기본 영문 화면 대신) */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6 text-gray-800">
      <div className="w-full max-w-sm rounded-3xl border border-gold-100 bg-white p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <p className="text-4xl">💌</p>
        <h1
          className="mt-4 text-xl text-ink"
          style={{ fontFamily: "var(--font-song)" }}
        >
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-gray-500">
          주소가 잘못되었거나, 게시 기간이 끝나
          <br />
          사라진 초대장일 수 있어요.
        </p>
        <Link
          href="/"
          className="mt-7 inline-block rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/40 transition hover:from-gold-500 hover:to-gold-600"
        >
          홈으로 가기
        </Link>
      </div>
    </main>
  );
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import EditorClient from "@/components/EditorClient";
import { authEnabled, getUser } from "@/lib/supabase/server";

export const metadata = { title: "청첩장 만들기" };

export default async function EditorPage() {
  // 제작은 로그인 필수 — 비로그인이면 로그인 후 에디터로 복귀
  if (authEnabled) {
    const user = await getUser();
    if (!user) redirect("/login?next=/editor");
  }
  return (
    <Suspense
      fallback={<div className="p-10 text-center text-gray-400">불러오는 중...</div>}
    >
      <EditorClient />
    </Suspense>
  );
}

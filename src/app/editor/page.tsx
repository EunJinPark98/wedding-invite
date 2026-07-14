import { Suspense } from "react";
import { redirect } from "next/navigation";
import EditorClient from "@/components/EditorClient";
import { countInvitationsByUser, getInvitationOwned } from "@/lib/store";
import { authEnabled, getUser } from "@/lib/supabase/server";

export const metadata = { title: "청첩장 만들기" };

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;

  // 제작/수정은 로그인 필수 — 비로그인이면 로그인 후 복귀
  let userId: string | null = null;
  if (authEnabled) {
    const user = await getUser();
    if (!user) {
      const next = edit ? `/editor?edit=${edit}` : "/editor";
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
    userId = user.id;
  }

  // 수정 모드: 본인 청첩장만
  if (edit) {
    const inv = await getInvitationOwned(edit, userId);
    if (!inv) redirect("/my");
    return (
      <Suspense
        fallback={
          <div className="p-10 text-center text-gray-400">불러오는 중...</div>
        }
      >
        <EditorClient
          editSlug={inv.slug}
          initialTemplate={inv.template}
          initialData={inv.data}
        />
      </Suspense>
    );
  }

  // 신규 제작: 계정당 1개 제한 — 이미 있으면 마이페이지로 안내
  if (userId) {
    const count = await countInvitationsByUser(userId);
    if (count >= 1) redirect("/my?notice=limit");
  }

  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-gray-400">불러오는 중...</div>
      }
    >
      <EditorClient />
    </Suspense>
  );
}

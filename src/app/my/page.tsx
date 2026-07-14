import { Suspense } from "react";
import { redirect } from "next/navigation";
import MyPageClient, { type MyInvitation } from "@/components/MyPageClient";
import { listInvitationsByUser, isExpired } from "@/lib/store";
import { getTheme } from "@/lib/templates";
import { authEnabled, getUser } from "@/lib/supabase/server";

export const metadata = { title: "마이페이지" };

// 내가 만든 청첩장 목록 — 로그인 필수
export default async function MyPage() {
  let userId: string | null = null;
  if (authEnabled) {
    const user = await getUser();
    if (!user) redirect("/login?next=/my");
    userId = user.id;
  }

  const invitations = await listInvitationsByUser(userId);
  const items: MyInvitation[] = invitations.map((inv) => ({
    slug: inv.slug,
    templateName: getTheme(inv.template).name,
    groomName: inv.data?.groomName ?? "",
    brideName: inv.data?.brideName ?? "",
    weddingDate: inv.data?.weddingDate ?? "",
    mainPhotoUrl: inv.data?.mainPhotoUrl ?? "",
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    expired: isExpired(inv),
  }));

  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-gray-400">불러오는 중...</div>
      }
    >
      <MyPageClient items={items} />
    </Suspense>
  );
}

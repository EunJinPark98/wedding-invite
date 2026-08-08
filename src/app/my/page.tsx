import { Suspense } from "react";
import { redirect } from "next/navigation";
import MyPageClient, {
  type MyAccount,
  type MyInvitation,
} from "@/components/MyPageClient";
import { listInvitationsByUser, isExpired } from "@/lib/store";
import { getTheme } from "@/lib/templates";
import { authEnabled, getUser } from "@/lib/supabase/server";

export const metadata = { title: "마이페이지" };

// 내가 만든 청첩장 목록 — 로그인 필수
export default async function MyPage() {
  let userId: string | null = null;
  let account: MyAccount | null = null;
  if (authEnabled) {
    const user = await getUser();
    if (!user) redirect("/login?next=/my");
    userId = user.id;
    // 로그인에 쓴 계정에서 받아온 정보 — 마이페이지 "내 계정"에 그대로 보여 준다.
    // 로그인 방식마다 담기는 키가 달라 흔한 이름들을 차례로 본다.
    const m = (user.user_metadata ?? {}) as Record<string, unknown>;
    const pick = (...keys: string[]) => {
      for (const k of keys) {
        const v = m[k];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
      return "";
    };
    account = {
      name: pick("full_name", "name"),
      nickname: pick("nickname", "user_name", "preferred_username"),
      email: user.email ?? "",
      provider: pick("provider") || user.app_metadata?.provider || "",
    };
  }

  const invitations = await listInvitationsByUser(userId);
  const items: MyInvitation[] = invitations.map((inv) => ({
    slug: inv.slug,
    templateName: getTheme(inv.template).name,
    category: inv.data?.category ?? "wedding",
    seniorAge: inv.data?.seniorAge ?? 70,
    dolKind: inv.data?.dolKind ?? "dol",
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
      <MyPageClient items={items} account={account} />
    </Suspense>
  );
}

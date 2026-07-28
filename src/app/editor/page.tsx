import { Suspense } from "react";
import { redirect } from "next/navigation";
import EditorClient from "@/components/EditorClient";
import { getUsedCategories, getInvitationOwned } from "@/lib/store";
import { authEnabled, getUser } from "@/lib/supabase/server";
import { findTheme } from "@/lib/templates";
import { CATEGORY_IDS, type Category } from "@/lib/types";

export const metadata = { title: "초대장 만들기" };

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; template?: string; category?: string }>;
}) {
  const { edit, template, category: rawCategory } = await searchParams;

  // 만들려는 초대장 종류 — 템플릿을 골라 들어왔다면 그 템플릿의 종류를 따른다
  const category: Category =
    findTheme(template)?.category ??
    (CATEGORY_IDS.includes(rawCategory as Category)
      ? (rawCategory as Category)
      : "wedding");

  // 제작/수정은 로그인 필수 — 비로그인이면 로그인 후 "고른 그대로" 복귀
  let userId: string | null = null;
  if (authEnabled) {
    const user = await getUser();
    if (!user) {
      const params = new URLSearchParams();
      if (edit) {
        params.set("edit", edit);
      } else {
        if (template) params.set("template", template);
        params.set("category", category);
      }
      redirect(`/login?next=${encodeURIComponent(`/editor?${params}`)}`);
    }
    userId = user.id;
  }

  // 수정 모드: 본인 초대장만
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

  // 신규 제작: 종류당 1개 제한 — 같은 종류를 이미 만들었으면 마이페이지로 안내
  if (userId) {
    const used = await getUsedCategories(userId);
    if (used.includes(category)) {
      redirect(`/my?notice=limit&category=${category}`);
    }
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

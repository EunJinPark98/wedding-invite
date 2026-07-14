import { NextResponse } from "next/server";
import { deleteInvitation, updateInvitation } from "@/lib/store";
import { getUser, authEnabled } from "@/lib/supabase/server";
import { MAX_GALLERY, SAMPLE_MAIN_PHOTO } from "@/lib/types";
import type { InvitationData, TemplateId } from "@/lib/types";

const TEMPLATES: TemplateId[] = ["classic", "modern", "romantic", "botanical"];

// 로그인 확인 (로컬 개발 모드는 통과) — 실패 시 에러 응답 반환
async function requireUser(): Promise<
  { userId: string | null } | NextResponse
> {
  if (!authEnabled) return { userId: null };
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다.", code: "LOGIN_REQUIRED" },
      { status: 401 }
    );
  }
  return { userId: user.id };
}

// 발행 후 수정 — 1회만 허용, 운영 기간은 변경 불가
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  let body: { template?: string; data?: InvitationData };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const template = body.template as TemplateId;
  const data = body.data;

  if (!template || !TEMPLATES.includes(template)) {
    return NextResponse.json(
      { error: "유효한 템플릿을 선택해 주세요." },
      { status: 400 }
    );
  }
  if (!data || !data.groomName?.trim() || !data.brideName?.trim()) {
    return NextResponse.json(
      { error: "신랑/신부 이름은 필수입니다." },
      { status: 400 }
    );
  }
  if (!data.mainPhotoUrl?.trim() || data.mainPhotoUrl === SAMPLE_MAIN_PHOTO) {
    return NextResponse.json(
      { error: "대표 사진을 등록해 주세요. 미리보기의 사진은 예시용이에요." },
      { status: 400 }
    );
  }
  if (
    Array.isArray(data.gallery) &&
    data.gallery.filter(Boolean).length > MAX_GALLERY
  ) {
    return NextResponse.json(
      { error: `갤러리 사진은 최대 ${MAX_GALLERY}장까지 담을 수 있어요.` },
      { status: 400 }
    );
  }

  try {
    const result = await updateInvitation(slug, auth.userId, template, data);
    if (!result.ok) {
      if (result.code === "already_edited") {
        return NextResponse.json(
          { error: "이 청첩장은 이미 1회 수정을 완료했어요. 더 이상 수정할 수 없어요." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "청첩장을 찾을 수 없어요." },
        { status: 404 }
      );
    }
    return NextResponse.json({ slug });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "수정 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 삭제 — 복원 불가
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const deleted = await deleteInvitation(slug, auth.userId);
    if (!deleted) {
      return NextResponse.json(
        { error: "청첩장을 찾을 수 없어요." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import {
  deleteInvitation,
  updateInvitation,
  getInvitationOwned,
} from "@/lib/store";
import { getUser, authEnabled } from "@/lib/supabase/server";
import { getTheme } from "@/lib/templates";
import { getCategoryLabels } from "@/lib/categories";
import {
  MAX_GALLERY,
  expiryFromEventDate,
  isPastEventDate,
  isSamplePhoto,
  TEMPLATE_IDS,
} from "@/lib/types";
import type { InvitationData, TemplateId } from "@/lib/types";

const TEMPLATES: readonly TemplateId[] = TEMPLATE_IDS;

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

// 발행 후 수정 — 횟수 제한 없음. 날짜를 옮기면 게시 종료일도 함께 옮겨진다
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
  // 수정으로 초대장 종류를 바꿀 수는 없다 (종류당 1개 제한 우회 방지)
  const existing = await getInvitationOwned(slug, auth.userId);
  if (!existing) {
    return NextResponse.json(
      { error: "초대장을 찾을 수 없어요." },
      { status: 404 }
    );
  }
  const category = getTheme(existing.template).category;
  if (getTheme(template).category !== category) {
    return NextResponse.json(
      { error: "초대장 종류는 변경할 수 없어요." },
      { status: 400 }
    );
  }
  const labels = getCategoryLabels(category);

  // 이름 필수 검사 (신부 이름은 두 사람이 등장하는 결혼 청첩장에서만)
  if (!data || !data.groomName?.trim()) {
    return NextResponse.json(
      { error: `${labels.personLabel}은(는) 필수입니다.` },
      { status: 400 }
    );
  }
  if (labels.showPerson2 && !data.brideName?.trim()) {
    return NextResponse.json(
      { error: "신랑/신부 이름은 필수입니다." },
      { status: 400 }
    );
  }
  if (!data.mainPhotoUrl?.trim() || isSamplePhoto(data.mainPhotoUrl)) {
    return NextResponse.json(
      { error: "대표 사진을 등록해 주세요. 미리보기의 사진은 예시용이에요." },
      { status: 400 }
    );
  }
  // 날짜를 옮기면 게시 종료일(행사 다음 날)도 함께 따라간다
  const expiresAt = expiryFromEventDate(data.weddingDate);
  if (!expiresAt) {
    return NextResponse.json(
      { error: `${labels.dateFieldLabel}을 정확히 입력해 주세요.` },
      { status: 400 }
    );
  }
  // 지난 날로 만들면 게시가 시작하자마자 끝나 있다. 화면에서도 막지만,
  // 화면을 거치지 않고 들어오는 요청이 있을 수 있어 여기서도 본다.
  if (isPastEventDate(data.weddingDate)) {
    return NextResponse.json(
      { error: `${labels.dateFieldLabel}은 오늘 이후로 정해 주세요.` },
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
    const updated = await updateInvitation(
      slug,
      auth.userId,
      template,
      { ...data, category },
      expiresAt
    );
    if (!updated) {
      return NextResponse.json(
        { error: "초대장을 찾을 수 없어요." },
        { status: 404 }
      );
    }
    return NextResponse.json({ slug, expiresAt });
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
        { error: "초대장을 찾을 수 없어요." },
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

import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { saveInvitation, getUsedCategories } from "@/lib/store";
import { getUser, loginRequired } from "@/lib/supabase/server";
import { getTheme } from "@/lib/templates";
import {
  getCategoryMeta,
  getCategoryLabels,
  josaEulReul,
  josaEunNeun,
} from "@/lib/categories";
import {
  MAX_GALLERY,
  expiryFromEventDate,
  isPastEventDate,
  isSamplePhoto,
  TEMPLATE_IDS,
} from "@/lib/types";
import type { InvitationData, TemplateId } from "@/lib/types";

// 공유 링크에 쓰기 좋은 짧은 slug (헷갈리는 문자 제외)
const nano = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 8);

const TEMPLATES: readonly TemplateId[] = TEMPLATE_IDS;

export async function POST(req: Request) {
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
  // 저장할 종류 — 본문의 category가 아니라 템플릿을 기준으로 삼는다
  const category = getTheme(template).category;
  const labels = getCategoryLabels(category);

  // 이름 필수 검사 (신부 이름은 두 사람이 등장하는 결혼 청첩장에서만)
  if (!data || !data.groomName?.trim()) {
    return NextResponse.json(
      {
        error: `${labels.personLabel}${josaEunNeun(
          labels.personLabel
        )} 필수입니다.`,
      },
      { status: 400 }
    );
  }
  if (labels.showPerson2 && !data.brideName?.trim()) {
    return NextResponse.json(
      { error: "신랑/신부 이름은 필수입니다." },
      { status: 400 }
    );
  }
  // 게시 종료일은 행사 다음 날로 자동 결정되므로 날짜가 반드시 필요하다
  const expiresAt = expiryFromEventDate(data.weddingDate);
  if (!expiresAt) {
    return NextResponse.json(
      {
        error: `${labels.dateFieldLabel}${josaEulReul(
          labels.dateFieldLabel
        )} 정확히 입력해 주세요.`,
      },
      { status: 400 }
    );
  }
  // 지난 날로 만들면 게시가 시작하자마자 끝나 있다. 화면에서도 막지만,
  // 화면을 거치지 않고 들어오는 요청이 있을 수 있어 여기서도 본다.
  if (isPastEventDate(data.weddingDate)) {
    return NextResponse.json(
      {
        error: `${labels.dateFieldLabel}${josaEunNeun(
          labels.dateFieldLabel
        )} 오늘 이후로 정해 주세요.`,
      },
      { status: 400 }
    );
  }
  // 예시 사진(개인 사진)은 실제 청첩장에 쓸 수 없음 — 본인 사진 필수
  if (!data.mainPhotoUrl?.trim() || isSamplePhoto(data.mainPhotoUrl)) {
    return NextResponse.json(
      { error: "대표 사진을 등록해 주세요. 미리보기의 사진은 예시용이에요." },
      { status: 400 }
    );
  }
  // 갤러리 장수 한도 (로딩 속도를 위한 기술적 한도)
  if (
    Array.isArray(data.gallery) &&
    data.gallery.filter(Boolean).length > MAX_GALLERY
  ) {
    return NextResponse.json(
      { error: `갤러리 사진은 최대 ${MAX_GALLERY}장까지 담을 수 있어요.` },
      { status: 400 }
    );
  }

  // 로그인 필수 + 종류당 1개 제한 (Supabase 미설정 로컬 개발 모드는 통과)
  let userId: string | null = null;
  if (loginRequired) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다.", code: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }
    userId = user.id;
    const used = await getUsedCategories(userId);
    if (used.includes(category)) {
      const label = getCategoryMeta(category).label;
      return NextResponse.json(
        {
          error: `${label}${josaEunNeun(label)} 계정당 1개만 만들 수 있어요. 새로 만들려면 마이페이지에서 기존 ${label}${josaEulReul(label)} 삭제해 주세요.`,
          code: "LIMIT_REACHED",
          category,
        },
        { status: 409 }
      );
    }
  }

  try {
    const slug = nano();
    // 종류는 템플릿을 기준으로 고정 — 본문의 category만 바꿔 제한을 우회하지 못하게
    await saveInvitation(slug, template, { ...data, category }, expiresAt, userId);
    return NextResponse.json({ slug, expiresAt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { saveInvitation, countInvitationsByUser } from "@/lib/store";
import { getUser, authEnabled } from "@/lib/supabase/server";
import {
  FREE_INVITATIONS,
  PERIOD_OPTIONS,
  SAMPLE_MAIN_PHOTO,
} from "@/lib/types";
import type { InvitationData, TemplateId } from "@/lib/types";

// 공유 링크에 쓰기 좋은 짧은 slug (헷갈리는 문자 제외)
const nano = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 8);

const TEMPLATES: TemplateId[] = ["classic", "modern", "romantic", "botanical"];

export async function POST(req: Request) {
  let body: { template?: string; data?: InvitationData; periodMonths?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const template = body.template as TemplateId;
  const data = body.data;
  const months = Number(body.periodMonths);

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
  const option = PERIOD_OPTIONS.find((p) => p.months === months);
  if (!option) {
    return NextResponse.json(
      { error: "운영 기간을 선택해 주세요." },
      { status: 400 }
    );
  }
  // 6개월/1년은 유료 (결제 도입 전까지 잠금)
  if (option.paid) {
    return NextResponse.json(
      { error: "6개월 이상 운영은 유료 플랜으로 준비 중이에요. 지금은 1개월/3개월을 선택해 주세요." },
      { status: 403 }
    );
  }
  // 예시 사진(개인 사진)은 실제 청첩장에 쓸 수 없음 — 본인 사진 필수
  if (!data.mainPhotoUrl?.trim() || data.mainPhotoUrl === SAMPLE_MAIN_PHOTO) {
    return NextResponse.json(
      { error: "대표 사진을 등록해 주세요. 미리보기의 사진은 예시용이에요." },
      { status: 400 }
    );
  }
  // 갤러리 무료 한도 (8장부터 유료 예정)
  if (Array.isArray(data.gallery) && data.gallery.filter(Boolean).length > 7) {
    return NextResponse.json(
      { error: "갤러리 사진 8장부터는 유료 플랜으로 준비 중이에요. 7장까지 담아 주세요." },
      { status: 403 }
    );
  }

  // 로그인 필수 + 계정당 무료 1개 제한 (Supabase 미설정 로컬 개발 모드는 통과)
  let userId: string | null = null;
  if (authEnabled) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다.", code: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }
    userId = user.id;
    const count = await countInvitationsByUser(userId);
    if (count >= FREE_INVITATIONS) {
      return NextResponse.json(
        {
          error:
            "무료 플랜은 청첩장을 1개까지 만들 수 있어요. 추가 제작은 유료 플랜으로 준비 중이에요.",
        },
        { status: 403 }
      );
    }
  }

  try {
    const slug = nano();
    const expires = new Date();
    expires.setMonth(expires.getMonth() + months);
    const expiresAt = expires.toISOString();
    await saveInvitation(slug, template, data, expiresAt, userId);
    return NextResponse.json({ slug, expiresAt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { saveInvitation } from "@/lib/store";
import { PERIOD_OPTIONS } from "@/lib/types";
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
  if (!PERIOD_OPTIONS.some((p) => p.months === months)) {
    return NextResponse.json(
      { error: "운영 기간을 선택해 주세요." },
      { status: 400 }
    );
  }

  try {
    const slug = nano();
    const expires = new Date();
    expires.setMonth(expires.getMonth() + months);
    const expiresAt = expires.toISOString();
    await saveInvitation(slug, template, data, expiresAt);
    return NextResponse.json({ slug, expiresAt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

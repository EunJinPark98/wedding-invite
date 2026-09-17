import { NextResponse } from "next/server";
import { uploadImage, ALLOWED_TYPES } from "@/lib/storage";
import { getUser, loginRequired } from "@/lib/supabase/server";
import { overRateLimit } from "@/lib/ratelimit";

// 압축은 클라이언트에서 끝나지만, 원본 직업로드 대비 여유 한도
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

/*
 * 한 사람이 10분에 올릴 수 있는 장수.
 *
 * 실제로는 갤러리 19장을 한꺼번에 올리는 것이 가장 많은데, 그래도 한참
 * 남는다. 사진을 바꿔 가며 여러 번 올려도 닿지 않는 수다. 멀쩡한 사람이
 * 막히는 것이 폭주보다 훨씬 나쁘므로 넉넉한 쪽으로 잡는다.
 */
const UPLOAD_LIMIT = 100;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;

/**
 * 사진 업로드.
 *
 * 로그인한 사람만 올릴 수 있다. 이 칸을 부르는 곳은 에디터뿐이고 에디터는
 * 이미 로그인을 요구하므로, 실제로 쓰는 사람에게는 달라지는 것이 없다.
 * 다만 주소를 아는 누구나 바로 부를 수 있으면 저장소가 남의 파일로 차오르고
 * 그대로 요금이 된다 — 초대장을 만들 수 있는 사람만 올릴 수 있으면 된다.
 *
 * 게시·수정과 같은 방식으로 본다(loginRequired). 미리보기 배포는 로그인
 * 자체가 불가능해 통과시키고, 실제 서비스에서는 항상 로그인을 요구한다.
 */
export async function POST(req: Request) {
  let who = "anon";
  if (loginRequired) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다.", code: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }
    who = user.id;
  }

  if (overRateLimit(`upload:${who}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS)) {
    return NextResponse.json(
      { error: "사진을 너무 빠르게 올리고 있어요. 잠시 뒤에 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "이미지 파일이 필요합니다." },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: "JPG, PNG, WEBP 이미지만 업로드할 수 있습니다." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "이미지 용량이 너무 큽니다. (최대 10MB)" },
      { status: 413 }
    );
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(bytes, file.type);
    return NextResponse.json({ url });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "업로드 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

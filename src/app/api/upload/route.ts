import { NextResponse } from "next/server";
import { uploadImage, ALLOWED_TYPES } from "@/lib/storage";

// 압축은 클라이언트에서 끝나지만, 원본 직업로드 대비 여유 한도
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
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

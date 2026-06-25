import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { customAlphabet } from "nanoid";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

// 청첩장 사진을 담는 공개 버킷 (supabase/schema.sql 에서 생성)
const BUCKET = "photos";

const nano = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 12);

// 업로드 허용 타입 → 확장자
export const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function supabase() {
  return createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false },
  });
}

/**
 * 이미지 바이트를 저장하고 공개 URL을 돌려준다.
 * - Supabase 설정 시: Storage 버킷에 업로드
 * - 미설정 시(개발용): public/uploads 에 저장하고 "/uploads/..." 경로 반환
 */
export async function uploadImage(
  bytes: Buffer,
  contentType: string
): Promise<string> {
  const ext = ALLOWED_TYPES[contentType] ?? "jpg";
  const filename = `${Date.now()}-${nano()}.${ext}`;

  if (useSupabase) {
    const { error } = await supabase()
      .storage.from(BUCKET)
      .upload(filename, bytes, { contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase().storage.from(BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);
  return `/uploads/${filename}`;
}

export const uploadMode = useSupabase ? "supabase" : "local";

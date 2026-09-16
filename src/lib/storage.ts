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

/**
 * 업로드된 사진 URL에서 지울 대상 경로를 뽑는다.
 * 우리가 올린 파일이 아니면(예시 사진, 외부 URL) null — 실수로 지우지 않도록.
 */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  const u = (url ?? "").trim();
  if (!u) return null;
  if (useSupabase) {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const i = u.indexOf(marker);
    if (i < 0) return null;
    const p = u.slice(i + marker.length).split("?")[0];
    return p ? decodeURIComponent(p) : null;
  }
  // 로컬 개발 모드: "/uploads/파일명"
  if (!u.startsWith("/uploads/")) return null;
  const name = u.slice("/uploads/".length).split("?")[0];
  // 경로 탈출 방지
  return name && !name.includes("/") && !name.includes("..") ? name : null;
}

/**
 * 초대장에 딸린 사진들을 저장소에서 지운다.
 * 삭제 흐름을 막지 않도록 실패는 던지지 않고 지운 개수만 돌려준다.
 */
export async function deleteImages(
  urls: (string | null | undefined)[]
): Promise<number> {
  const paths = Array.from(
    new Set(
      urls.map(storagePathFromUrl).filter((p): p is string => Boolean(p))
    )
  );
  if (paths.length === 0) return 0;

  try {
    if (useSupabase) {
      const { error } = await supabase().storage.from(BUCKET).remove(paths);
      if (error) throw new Error(error.message);
      return paths.length;
    }
    const dir = path.join(process.cwd(), "public", "uploads");
    let n = 0;
    for (const name of paths) {
      try {
        await fs.unlink(path.join(dir, name));
        n += 1;
      } catch {
        // 이미 없는 파일은 무시
      }
    }
    return n;
  } catch (e) {
    console.error("[storage] 사진 삭제 실패:", e);
    return 0;
  }
}

export const uploadMode = useSupabase ? "supabase" : "local";

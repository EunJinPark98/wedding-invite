import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { deleteImages } from "./storage";
import { normalizeData, CATEGORY_IDS } from "./types";
import type {
  Category,
  Invitation,
  InvitationData,
  TemplateId,
} from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

function supabase() {
  return createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false },
  });
}

/* ───────── 로컬 파일 폴백 (Supabase 미설정 시 개발용) ───────── */
const DATA_FILE = path.join(process.cwd(), ".data", "invitations.json");

async function readLocal(): Promise<Record<string, Invitation>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLocal(db: Record<string, Invitation>) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

/* ───────── 공개 API ───────── */
export async function saveInvitation(
  slug: string,
  template: TemplateId,
  rawData: InvitationData,
  expiresAt: string | null = null,
  userId: string | null = null
): Promise<Invitation> {
  const data = normalizeData(rawData);
  const invitation: Invitation = {
    slug,
    template,
    data,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  if (useSupabase) {
    const { error } = await supabase().from("invitations").insert({
      slug,
      template,
      data,
      expires_at: expiresAt,
      user_id: userId,
    });
    if (error) throw new Error(error.message);
    return invitation;
  }

  const db = await readLocal();
  db[slug] = invitation;
  await writeLocal(db);
  return invitation;
}

export async function getInvitation(slug: string): Promise<Invitation | null> {
  if (useSupabase) {
    const { data, error } = await supabase()
      .from("invitations")
      .select("slug, template, data, created_at, expires_at")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      slug: data.slug,
      template: data.template,
      data: data.data,
      createdAt: data.created_at,
      expiresAt: data.expires_at ?? null,
    };
  }

  const db = await readLocal();
  const inv = db[slug];
  if (!inv) return null;
  return { ...inv, expiresAt: inv.expiresAt ?? null };
}

// 만료 여부 (expiresAt이 없으면 무기한)
export function isExpired(inv: Invitation): boolean {
  if (!inv.expiresAt) return false;
  const t = new Date(inv.expiresAt).getTime();
  return !isNaN(t) && t < Date.now();
}

/* ───────── 마이페이지 (소유자 기준 조회/수정/삭제) ───────── */

// 계정이 만든 청첩장 목록 (최신순)
export async function listInvitationsByUser(
  userId: string | null
): Promise<Invitation[]> {
  if (useSupabase) {
    if (!userId) return [];
    const { data, error } = await supabase()
      .from("invitations")
      .select("slug, template, data, created_at, expires_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      slug: r.slug,
      template: r.template,
      data: r.data,
      createdAt: r.created_at,
      expiresAt: r.expires_at ?? null,
    }));
  }
  // 로컬 폴백은 계정 개념이 없어 전체 반환 (개발용)
  const db = await readLocal();
  return Object.values(db).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

/** 운영자가 만들어진 초대장을 훑어보기 위한 전체 목록 (관리자 화면 전용). */
export async function listAllInvitations(): Promise<
  (Invitation & { userId: string | null })[]
> {
  if (useSupabase) {
    const { data, error } = await supabase()
      .from("invitations")
      .select("slug, template, data, created_at, expires_at, user_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      slug: r.slug,
      template: r.template,
      data: r.data,
      createdAt: r.created_at,
      expiresAt: r.expires_at ?? null,
      userId: r.user_id ?? null,
    }));
  }
  const db = await readLocal();
  return Object.values(db)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((inv) => ({ ...inv, userId: null }));
}

/**
 * 계정이 지금 쓰고 있는 초대장의 종류 목록 (종류당 1개 제한 검사용).
 * 게시 기간이 끝난 초대장은 자리를 비워주므로 제외한다.
 * category가 없는 과거 데이터는 결혼 청첩장으로 본다.
 */
export async function getUsedCategories(userId: string): Promise<Category[]> {
  if (useSupabase) {
    const { data, error } = await supabase()
      .from("invitations")
      .select("data, expires_at")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const now = Date.now();
    return (data ?? [])
      .filter((r) => {
        if (!r.expires_at) return true; // 무기한 (과거 데이터)
        const t = new Date(r.expires_at).getTime();
        return isNaN(t) || t >= now;
      })
      .map((r) => {
        const c = (r.data as InvitationData | null)?.category;
        return CATEGORY_IDS.includes(c as Category)
          ? (c as Category)
          : "wedding";
      });
  }
  // 로컬 폴백은 계정 개념이 없어 항상 빈 목록 (개발용)
  return [];
}

// 소유자 확인 포함 단건 조회 (수정 화면 로드용)
export async function getInvitationOwned(
  slug: string,
  userId: string | null
): Promise<Invitation | null> {
  if (useSupabase) {
    if (!userId) return null;
    const { data, error } = await supabase()
      .from("invitations")
      .select("slug, template, data, created_at, expires_at")
      .eq("slug", slug)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      slug: data.slug,
      template: data.template,
      data: data.data,
      createdAt: data.created_at,
      expiresAt: data.expires_at ?? null,
    };
  }
  const db = await readLocal();
  return db[slug] ?? null;
}

// 초대장 수정 (소유자 검증 포함) — 횟수 제한 없음.
// 행사 날짜를 바꾸면 게시 종료일(행사 다음 날)도 함께 옮긴다.
export async function updateInvitation(
  slug: string,
  userId: string | null,
  template: TemplateId,
  rawData: InvitationData,
  expiresAt: string
): Promise<boolean> {
  const data = normalizeData(rawData);

  if (useSupabase) {
    const existing = await getInvitationOwned(slug, userId);
    if (!existing) return false;
    const { error } = await supabase()
      .from("invitations")
      .update({ template, data, expires_at: expiresAt })
      .eq("slug", slug)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    await deleteImages(droppedPhotos(existing.data, data));
    return true;
  }

  const db = await readLocal();
  const inv = db[slug];
  if (!inv) return false;
  db[slug] = { ...inv, template, data, expiresAt };
  await writeLocal(db);
  await deleteImages(droppedPhotos(inv.data, data));
  return true;
}

// 수정으로 더 이상 쓰이지 않게 된 사진들 (교체·삭제된 것)
function droppedPhotos(
  before: InvitationData | null | undefined,
  after: InvitationData
): string[] {
  const kept = new Set(photoUrlsOf(after));
  return photoUrlsOf(before).filter((u) => !kept.has(u));
}

// 초대장에 담긴 모든 사진 URL (대표·프로필·갤러리)
function photoUrlsOf(data: InvitationData | null | undefined): string[] {
  if (!data) return [];
  return [
    data.mainPhotoUrl,
    data.groomPhotoUrl,
    data.bridePhotoUrl,
    ...(Array.isArray(data.gallery) ? data.gallery : []),
  ].filter(Boolean);
}

// 삭제 (소유자 검증 포함) — 복원 불가. 업로드한 사진도 저장소에서 함께 지운다.
export async function deleteInvitation(
  slug: string,
  userId: string | null
): Promise<boolean> {
  if (useSupabase) {
    if (!userId) return false;
    // 사진 URL은 행이 지워지기 전에 확보해 둔다
    const existing = await getInvitationOwned(slug, userId);
    const { data, error } = await supabase()
      .from("invitations")
      .delete()
      .eq("slug", slug)
      .eq("user_id", userId)
      .select("slug");
    if (error) throw new Error(error.message);
    if ((data?.length ?? 0) === 0) return false;
    // 행 삭제가 확정된 뒤에 사진 정리 (실패해도 삭제 자체는 성공 처리)
    await deleteImages(photoUrlsOf(existing?.data));
    return true;
  }
  const db = await readLocal();
  const inv = db[slug];
  if (!inv) return false;
  delete db[slug];
  await writeLocal(db);
  await deleteImages(photoUrlsOf(inv.data));
  return true;
}

/**
 * 한 계정이 만든 초대장을 전부 지운다 (DB 행 + 업로드된 사진). 회원 탈퇴용.
 * auth.users 를 지우려면 이 표에 남은 행이 먼저 없어져야 한다
 * (invitations.user_id 가 auth.users 를 참조한다).
 */
export async function deleteInvitationsOfUser(userId: string): Promise<number> {
  if (useSupabase) {
    const { data, error } = await supabase()
      .from("invitations")
      .delete()
      .eq("user_id", userId)
      .select("slug, data");
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    await deleteImages(
      rows.flatMap((r) => photoUrlsOf(r.data as InvitationData | null))
    );
    return rows.length;
  }
  // 로컬 폴백은 계정 개념이 없어 지울 것이 없다 (개발용)
  return 0;
}

/**
 * 게시 기간이 끝난 초대장을 완전히 지운다 (DB 행 + 업로드된 사진).
 * 하루 한 번 /api/cron/purge 에서 호출된다. 복구 불가.
 */
export async function purgeExpiredInvitations(): Promise<{
  deleted: number;
  images: number;
}> {
  const now = new Date().toISOString();

  if (useSupabase) {
    // 만료된 행을 지우면서 data를 함께 돌려받아 사진 경로를 확보
    const { data, error } = await supabase()
      .from("invitations")
      .delete()
      .not("expires_at", "is", null)
      .lte("expires_at", now)
      .select("slug, data");
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const urls = rows.flatMap((r) =>
      photoUrlsOf(r.data as InvitationData | null)
    );
    const images = await deleteImages(urls);
    return { deleted: rows.length, images };
  }

  const db = await readLocal();
  const expired = Object.values(db).filter(
    (inv) => inv.expiresAt && new Date(inv.expiresAt).getTime() <= Date.now()
  );
  if (expired.length === 0) return { deleted: 0, images: 0 };
  for (const inv of expired) delete db[inv.slug];
  await writeLocal(db);
  const images = await deleteImages(expired.flatMap((inv) => photoUrlsOf(inv.data)));
  return { deleted: expired.length, images };
}

export const storageMode = useSupabase ? "supabase" : "local";

import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { normalizeData } from "./types";
import type { Invitation, InvitationData, TemplateId } from "./types";

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
      .select("slug, template, data, created_at, expires_at, edited")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      slug: r.slug,
      template: r.template,
      data: r.data,
      createdAt: r.created_at,
      expiresAt: r.expires_at ?? null,
      edited: Boolean(r.edited),
    }));
  }
  // 로컬 폴백은 계정 개념이 없어 전체 반환 (개발용)
  const db = await readLocal();
  return Object.values(db).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

// 계정이 만든 청첩장 수 (계정당 1개 제한 검사용)
export async function countInvitationsByUser(userId: string): Promise<number> {
  if (useSupabase) {
    const { count, error } = await supabase()
      .from("invitations")
      .select("slug", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }
  // 로컬 폴백은 계정 개념이 없어 항상 0 (개발용)
  return 0;
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
      .select("slug, template, data, created_at, expires_at, edited")
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
      edited: Boolean(data.edited),
    };
  }
  const db = await readLocal();
  return db[slug] ?? null;
}

export type UpdateResult =
  | { ok: true }
  | { ok: false; code: "not_found" | "already_edited" };

// 발행 후 1회만 허용되는 수정 (소유자 검증 포함)
export async function updateInvitation(
  slug: string,
  userId: string | null,
  template: TemplateId,
  rawData: InvitationData
): Promise<UpdateResult> {
  const data = normalizeData(rawData);

  if (useSupabase) {
    const existing = await getInvitationOwned(slug, userId);
    if (!existing) return { ok: false, code: "not_found" };
    if (existing.edited) return { ok: false, code: "already_edited" };
    const { error } = await supabase()
      .from("invitations")
      .update({ template, data, edited: true })
      .eq("slug", slug)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  }

  const db = await readLocal();
  const inv = db[slug];
  if (!inv) return { ok: false, code: "not_found" };
  if (inv.edited) return { ok: false, code: "already_edited" };
  db[slug] = { ...inv, template, data, edited: true };
  await writeLocal(db);
  return { ok: true };
}

// 삭제 (소유자 검증 포함) — 복원 불가
export async function deleteInvitation(
  slug: string,
  userId: string | null
): Promise<boolean> {
  if (useSupabase) {
    if (!userId) return false;
    const { data, error } = await supabase()
      .from("invitations")
      .delete()
      .eq("slug", slug)
      .eq("user_id", userId)
      .select("slug");
    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
  }
  const db = await readLocal();
  if (!db[slug]) return false;
  delete db[slug];
  await writeLocal(db);
  return true;
}

export const storageMode = useSupabase ? "supabase" : "local";

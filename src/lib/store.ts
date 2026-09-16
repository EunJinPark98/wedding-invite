import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { deleteImages, purgeOrphanImages, storagePathFromUrl } from "./storage";
import {
  normalizeData,
  stripSampleAccounts,
  CATEGORY_IDS,
  DRAFT_MAX_AGE_HOURS,
} from "./types";
import { isPreviewDeploy } from "./supabase/server";
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
      // 계좌 단계가 없던 시절 저장된 예시 계좌는 걸러 낸다 (stripSampleAccounts 주석 참고)
      data: stripSampleAccounts(data.data),
      createdAt: data.created_at,
      expiresAt: data.expires_at ?? null,
    };
  }

  const db = await readLocal();
  const inv = db[slug];
  if (!inv) return null;
  return {
    ...inv,
    data: stripSampleAccounts(inv.data),
    expiresAt: inv.expiresAt ?? null,
  };
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
    // 미리보기 배포는 로그인이 없어 주인이 비어 있는 것(=미리보기에서 만든 것)을
    // 모아 보여 준다. 실제 서비스에서는 isPreviewDeploy 가 항상 false 다.
    if (!userId && !isPreviewDeploy) return [];
    const q = supabase()
      .from("invitations")
      .select("slug, template, data, created_at, expires_at");
    const { data, error } = await (userId
      ? q.eq("user_id", userId)
      : q.is("user_id", null)
    ).order("created_at", { ascending: false });
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
    // 한 번에 다 오지 않는다. 끝까지 받지 않으면 운영 현황의 숫자가
    // 조용히 모자라게 나온다 — 틀린 줄 모르고 보게 되므로 끝까지 받는다.
    const rows: (Invitation & { userId: string | null })[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase()
        .from("invitations")
        .select("slug, template, data, created_at, expires_at, user_id")
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      const page = data ?? [];
      for (const r of page) {
        rows.push({
          slug: r.slug,
          template: r.template,
          data: r.data,
          createdAt: r.created_at,
          expiresAt: r.expires_at ?? null,
          userId: r.user_id ?? null,
        });
      }
      if (page.length < pageSize) break;
    }
    return rows;
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
    if (!userId && !isPreviewDeploy) return null;
    const q = supabase()
      .from("invitations")
      .select("slug, template, data, created_at, expires_at")
      .eq("slug", slug);
    const { data, error } = await (userId
      ? q.eq("user_id", userId)
      : q.is("user_id", null)
    ).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      slug: data.slug,
      template: data.template,
      data: stripSampleAccounts(data.data),
      createdAt: data.created_at,
      expiresAt: data.expires_at ?? null,
    };
  }
  const db = await readLocal();
  const inv = db[slug];
  return inv ? { ...inv, data: stripSampleAccounts(inv.data) } : null;
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
    const upd = supabase()
      .from("invitations")
      .update({ template, data, expires_at: expiresAt })
      .eq("slug", slug);
    // PostgREST 는 eq(null) 로 NULL 을 못 맞춘다 — is(null) 을 써야 한다
    const { error } = await (userId
      ? upd.eq("user_id", userId)
      : upd.is("user_id", null));
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

/* ───────── 지워진 초대장 수 세기 ─────────
 *
 * 초대장을 지우면 행이 사라져서, 나중에 "지금까지 몇 개가 지워졌는지"를
 * 세어 볼 방법이 없다. 그래서 지울 때마다 app_stats 에 더해 둔다
 * (supabase/schema.sql 참고). 숫자만 남기고 개인정보는 담지 않는다.
 *
 * 세는 것은 어디까지나 곁다리라, 여기서 실패해도 삭제 자체는 막지 않는다.
 * 수가 하나 덜 세어지는 것보다 초대장이 안 지워지는 쪽이 훨씬 나쁘다.
 */
const STAT_DELETED_EXPIRED = "invitations_deleted_expired";
const STAT_DELETED_BY_USER = "invitations_deleted_by_user";

async function bumpDeleted(key: string, n: number): Promise<void> {
  if (!useSupabase || n <= 0) return;
  try {
    const { error } = await supabase().rpc("bump_stat", { k: key, n });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error("[stats] 지워진 수 기록 실패:", e);
  }
}

/**
 * 지금까지 지워진 초대장 수 (운영 현황용).
 *
 * ready 는 세는 표가 준비돼 있는지다. schema.sql 을 아직 실행하지 않았으면
 * false 로 오는데, 그래야 화면에서 "아직 아무것도 안 지워졌다(0)"와
 * "셀 준비가 안 됐다"를 구분해 보여 줄 수 있다.
 */
export async function readDeletedCounts(): Promise<{
  expired: number;
  byUser: number;
  ready: boolean;
}> {
  if (!useSupabase) return { expired: 0, byUser: 0, ready: false };
  try {
    const { data, error } = await supabase()
      .from("app_stats")
      .select("key, value")
      .in("key", [STAT_DELETED_EXPIRED, STAT_DELETED_BY_USER]);
    if (error) throw new Error(error.message);
    const get = (k: string) =>
      Number((data ?? []).find((r) => r.key === k)?.value ?? 0);
    return {
      expired: get(STAT_DELETED_EXPIRED),
      byUser: get(STAT_DELETED_BY_USER),
      ready: true,
    };
  } catch (e) {
    console.error("[stats] 지워진 수 읽기 실패:", e);
    return { expired: 0, byUser: 0, ready: false };
  }
}

// 삭제 (소유자 검증 포함) — 복원 불가. 업로드한 사진도 저장소에서 함께 지운다.
export async function deleteInvitation(
  slug: string,
  userId: string | null
): Promise<boolean> {
  if (useSupabase) {
    if (!userId && !isPreviewDeploy) return false;
    // 사진 URL은 행이 지워지기 전에 확보해 둔다
    const existing = await getInvitationOwned(slug, userId);
    const del = supabase()
      .from("invitations")
      .delete()
      .eq("slug", slug);
    const { data, error } = await (userId
      ? del.eq("user_id", userId)
      : del.is("user_id", null))
      .select("slug");
    if (error) throw new Error(error.message);
    if ((data?.length ?? 0) === 0) return false;
    await bumpDeleted(STAT_DELETED_BY_USER, data?.length ?? 0);
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
    await bumpDeleted(STAT_DELETED_BY_USER, rows.length);
    await deleteImages(
      rows.flatMap((r) => photoUrlsOf(r.data as InvitationData | null))
    );
    return rows.length;
  }
  // 로컬 폴백은 계정 개념이 없어 지울 것이 없다 (개발용)
  return 0;
}

/**
 * 어느 초대장에도 딸리지 않은 사진을 지운다.
 *
 * 저장소를 훑기 전에 "쓰이고 있는 경로"를 모두 모아 둬야 한다. 하나라도
 * 빠뜨리면 멀쩡한 초대장의 사진이 지워진다.
 */
export async function purgeUnusedImages(
  minAgeHours = DRAFT_MAX_AGE_HOURS
): Promise<number> {
  if (!useSupabase) return 0;

  // 한 번에 다 오지 않는다. 끝까지 받지 않고 지우기 시작하면, 못 받은 행이
  // 쓰고 있는 사진을 "아무도 안 쓴다"고 보고 지워 버린다.
  const keep = new Set<string>();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase()
      .from("invitations")
      .select("data")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    for (const row of rows) {
      for (const url of photoUrlsOf(row.data as InvitationData | null)) {
        const p = storagePathFromUrl(url);
        if (p) keep.add(p);
      }
    }
    if (rows.length < pageSize) break;
  }

  return purgeOrphanImages(keep, minAgeHours);
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
    await bumpDeleted(STAT_DELETED_EXPIRED, rows.length);
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

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


export const storageMode = useSupabase ? "supabase" : "local";

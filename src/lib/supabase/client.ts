"use client";

import { createBrowserClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase 미설정(로컬 개발) 시 로그인 기능 비활성
export const authEnabled = Boolean(URL && KEY);

export function supabaseBrowser() {
  return createBrowserClient(URL!, KEY!);
}

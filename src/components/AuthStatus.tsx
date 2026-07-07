"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authEnabled, supabaseBrowser } from "@/lib/supabase/client";

// 헤더에 로그인 상태 표시: 비로그인 → 로그인 링크 / 로그인 → 닉네임 + 로그아웃
export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authEnabled) {
      setReady(true);
      return;
    }
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
      setName(
        (user?.user_metadata?.name as string) ??
          (user?.user_metadata?.full_name as string) ??
          null
      );
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      setName(
        (session?.user?.user_metadata?.name as string) ??
          (session?.user?.user_metadata?.full_name as string) ??
          null
      );
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authEnabled || !ready) return null;

  // 네이비 헤더 위에 올라가므로 밝은 톤 사용
  if (!email && !name) {
    return (
      <Link
        href="/login"
        className="text-sm text-white/70 transition hover:text-gold-300"
      >
        로그인
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-2.5 text-sm">
      <span className="max-w-[140px] truncate text-white/80">
        {name ?? email}
      </span>
      <button
        type="button"
        onClick={async () => {
          await supabaseBrowser().auth.signOut();
          window.location.reload();
        }}
        className="text-xs text-white/45 transition hover:text-gold-300"
      >
        로그아웃
      </button>
    </span>
  );
}

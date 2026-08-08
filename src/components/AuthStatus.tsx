"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authEnabled, supabaseBrowser } from "@/lib/supabase/client";

// 헤더에 로그인 상태 표시: 비로그인 → 로그인 링크 / 로그인 → 닉네임 + 로그아웃
export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  // 로그인 기능이 꺼진 환경에서는 물어볼 것이 없으니 처음부터 준비된 상태다
  const [ready, setReady] = useState(!authEnabled);

  useEffect(() => {
    if (!authEnabled) return;
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

  if (!email && !name) {
    return (
      <Link
        href="/login"
        className="text-sm text-gray-500 transition hover:text-gold-600"
      >
        로그인
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-2.5 text-sm">
      <span className="max-w-[80px] truncate font-medium text-gray-600 sm:max-w-[160px]">
        {name ? `${name}님` : email}
      </span>
      <Link
        href="/my"
        className="text-xs text-gray-400 transition hover:text-gold-600"
      >
        마이페이지
      </Link>
      <button
        type="button"
        onClick={async () => {
          await supabaseBrowser().auth.signOut();
          window.location.reload();
        }}
        className="text-xs text-gray-400 transition hover:text-gold-600"
      >
        로그아웃
      </button>
    </span>
  );
}

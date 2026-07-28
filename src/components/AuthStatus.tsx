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
      {/* 모바일은 헤더가 좁아 아이콘으로, 데스크톱은 글자로 */}
      <Link
        href="/my"
        aria-label="마이페이지"
        title="마이페이지"
        className="flex items-center text-gray-400 transition hover:text-gold-600"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          className="sm:hidden"
        >
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
        </svg>
        <span className="hidden text-xs sm:inline">마이페이지</span>
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

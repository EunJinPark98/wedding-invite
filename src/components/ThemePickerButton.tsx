"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

// 히어로의 "무료로 제작하기" 버튼 — 누르면 바로 결혼으로 보내지 않고
// 4가지 초대장 종류(결혼·돌잔치·칠순팔순·생일) 중 하나를 고르게 한다.
export default function ThemePickerButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        무료로 제작하기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-center text-lg text-ink"
              style={{ fontFamily: "var(--font-song)" }}
            >
              어떤 초대장을 만들까요?
            </h2>
            <p className="mt-1.5 text-center text-sm text-gray-400">
              4가지 종류 중 하나를 선택하세요
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.id}
                  href={`/editor?category=${c.id}`}
                  className="rounded-2xl border-2 border-gold-100 bg-white/70 px-4 py-5 text-center transition hover:border-gold-400 hover:bg-gold-50/50"
                >
                  <span className="block text-3xl">{c.emoji}</span>
                  <span className="mt-2 block text-sm font-semibold text-ink">
                    {c.label}
                  </span>
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

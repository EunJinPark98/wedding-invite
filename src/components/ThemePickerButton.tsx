"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/types";

// 히어로의 "무료로 제작하기" 버튼 — 누르면 바로 결혼으로 보내지 않고
// 4가지 초대장 종류(결혼·돌잔치·칠순팔순·생일) 중 하나를 고른 뒤 확인해야 넘어간다.
// 대부분 모바일에서 보므로 바텀시트 형태 + 큼직한 탭 영역으로 오터치를 줄인다.
export default function ThemePickerButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);

  const close = () => {
    setOpen(false);
    setSelected(null);
  };

  const confirm = () => {
    if (!selected) return;
    router.push(`/editor?category=${selected}`);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        무료로 제작하기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모바일 바텀시트 손잡이 */}
            <div className="mx-auto -mt-1 mb-3 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />
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
              {CATEGORIES.map((c) => {
                const active = c.id === selected;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelected(c.id)}
                    aria-pressed={active}
                    className={`min-h-[92px] rounded-2xl border-2 px-4 py-5 text-center transition active:scale-[0.98] ${
                      active
                        ? "border-gold-400 bg-gold-50 shadow-sm shadow-gold-200/60"
                        : "border-gold-100 bg-white/70"
                    }`}
                  >
                    <span className="block text-3xl">{c.emoji}</span>
                    <span
                      className={`mt-2 block text-sm font-semibold ${
                        active ? "text-gold-600" : "text-ink"
                      }`}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={close}
                className="min-h-[52px] flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition active:bg-gray-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!selected}
                className="min-h-[52px] flex-[2] rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 py-3 text-sm font-semibold text-white shadow-md shadow-gold-300/40 transition disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

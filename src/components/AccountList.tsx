"use client";

import { useState } from "react";
import type { Account } from "@/lib/types";
import type { TemplateTheme } from "@/lib/templates";

export default function AccountList({
  accounts,
  t,
}: {
  accounts: Account[];
  t: TemplateTheme;
}) {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (i: number, a: Account) => {
    try {
      await navigator.clipboard.writeText(a.number.replace(/\s/g, ""));
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard 불가 환경 무시 */
    }
  };

  if (accounts.length === 0) return null;

  return (
    <div className="space-y-3 text-left">
      {accounts.map((a, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border px-5 py-4"
          style={{ background: t.accentSoft, borderColor: t.line }}
        >
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ background: t.accent }}
              >
                {a.side}
              </span>
              <span className="text-xs" style={{ color: t.sub }}>
                {a.name}
              </span>
            </p>
            <p
              className="mt-1.5 truncate text-[15px] font-semibold tracking-wide"
              style={{ color: t.ink }}
            >
              {a.number}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: t.sub }}>
              {a.bank}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copy(i, a)}
            className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
            style={{ background: copied === i ? t.sub : t.accent }}
          >
            {copied === i ? "✓ 복사됨" : "복사"}
          </button>
        </div>
      ))}
    </div>
  );
}

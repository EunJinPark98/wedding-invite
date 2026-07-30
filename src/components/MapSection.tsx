"use client";

import { useState } from "react";
import type { TemplateTheme } from "@/lib/templates";

/**
 * 오시는 길 지도 — 실제 지도 임베드(구글, 키 불필요) + 네이버 길찾기 + 주소 복사.
 * 지도 픽셀이 필요 없는 경우(주소 미입력)엔 렌더링하지 않음.
 */
export default function MapSection({
  address,
  t,
  square = false,
}: {
  address: string;
  t: TemplateTheme;
  // 모던 템플릿용 각진 모서리
  square?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const addr = address.trim();
  if (!addr) return null;

  const rounded = square ? "rounded-sm" : "rounded-2xl";

  function copyAddress() {
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mt-6">
      {/* 실제 지도 (키 없이 쓸 수 있는 구글 임베드) */}
      <div
        className={`inv-zoom overflow-hidden border ${rounded}`}
        style={{ borderColor: t.line }}
      >
        <iframe
          title="오시는 길 지도"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(addr)}&z=16&hl=ko&output=embed`}
          className="h-[220px] w-full"
          style={{ border: 0, filter: "saturate(0.92)" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* 지도 앱으로 열기 — 네이버 · 카카오 둘 다 제공 */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={`https://map.naver.com/p/search/${encodeURIComponent(addr)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-1.5 border py-3 text-[calc(12.5px*var(--inv-fs))] transition ${rounded}`}
          style={{ borderColor: `${t.accent}88`, color: t.accent }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          네이버지도
        </a>
        <a
          href={`https://map.kakao.com/?q=${encodeURIComponent(addr)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-1.5 border py-3 text-[calc(12.5px*var(--inv-fs))] transition ${rounded}`}
          style={{ borderColor: `${t.accent}88`, color: t.accent }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          카카오맵
        </a>
      </div>
      <button
        type="button"
        onClick={copyAddress}
        className={`mt-2 flex w-full items-center justify-center gap-1.5 border py-3 text-[calc(12.5px*var(--inv-fs))] transition ${rounded}`}
        style={{ borderColor: t.line, color: t.sub }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        </svg>
        {copied ? "복사됐어요!" : "주소 복사"}
      </button>
    </div>
  );
}

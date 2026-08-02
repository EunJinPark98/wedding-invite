"use client";

import { useState } from "react";
import type { TemplateTheme } from "@/lib/templates";

/**
 * 오시는 길 지도 — 실제 지도 임베드(구글, 키 불필요) + 네이버 길찾기 + 주소 복사.
 * 지도 픽셀이 필요 없는 경우(주소 미입력)엔 렌더링하지 않음.
 *
 * 지하철·버스·주차 안내를 하나라도 적어 두면 아래에 "오시는 길 안내" 버튼이
 * 생기고, 누르면 지도 자리가 그 안내로 바뀐다. 다시 누르면 지도로 돌아온다.
 */
export default function MapSection({
  address,
  t,
  square = false,
  subway = "",
  bus = "",
  parking = "",
}: {
  address: string;
  t: TemplateTheme;
  // 모던 템플릿용 각진 모서리
  square?: boolean;
  // 오시는 길 안내 (비어 있는 항목은 표시하지 않음)
  subway?: string;
  bus?: string;
  parking?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const addr = address.trim();
  if (!addr) return null;

  const rounded = square ? "rounded-sm" : "rounded-2xl";
  const directions = [
    { icon: "🚇", label: "지하철", text: subway.trim() },
    { icon: "🚌", label: "버스 · 대중교통", text: bus.trim() },
    { icon: "🅿️", label: "주차", text: parking.trim() },
  ].filter((d) => d.text);
  const hasDirections = directions.length > 0;

  function copyAddress() {
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mt-6">
      {/* 지도 자리 — 안내를 펼치면 지도 대신 교통편 안내가 들어온다 */}
      {showDirections ? (
        <div
          className={`overflow-hidden border px-5 py-5 text-left ${rounded}`}
          style={{ borderColor: t.line, background: t.accentSoft }}
        >
          {directions.map((d, i) => (
            <div key={d.label} className={i > 0 ? "mt-4" : ""}>
              <p
                className="text-[calc(12.5px*var(--inv-fs))] font-semibold tracking-[0.02em]"
                style={{ color: t.accent }}
              >
                <span aria-hidden>{d.icon}</span> {d.label}
              </p>
              <p
                className="mt-1.5 whitespace-pre-line text-[calc(13px*var(--inv-fs))] leading-[1.9]"
                style={{ color: t.ink }}
              >
                {d.text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* 실제 지도 (키 없이 쓸 수 있는 구글 임베드) */
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
      )}

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

      {/* 적어 둔 안내가 있을 때만 — 누르면 지도 자리가 안내로 바뀐다 */}
      {hasDirections && (
        <button
          type="button"
          onClick={() => setShowDirections((v) => !v)}
          aria-expanded={showDirections}
          className={`mt-2 flex w-full items-center justify-center gap-1.5 border py-3 text-[calc(12.5px*var(--inv-fs))] transition ${rounded}`}
          style={{
            borderColor: `${t.accent}88`,
            color: showDirections ? "#fff" : t.accent,
            background: showDirections ? t.accent : "transparent",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm1.8-7.1-.9.9c-.7.7-1.1 1.3-1.1 2.7h-2v-.5c0-1 .4-1.9 1.1-2.6l1.2-1.2c.4-.3.6-.8.6-1.3a2 2 0 0 0-4 0H8a4 4 0 0 1 8 0c0 .8-.3 1.5-.9 2z" />
          </svg>
          {showDirections ? "지도 보기" : "오시는 길 안내"}
        </button>
      )}
    </div>
  );
}

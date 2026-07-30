"use client";

import { useEffect, useRef, useState } from "react";

/** 다음(카카오) 우편번호 서비스가 넘겨주는 값 중 실제로 쓰는 것만 */
interface PostcodeResult {
  roadAddress: string; // 도로명 주소
  jibunAddress: string; // 지번 주소
  userSelectedType: "R" | "J"; // 사용자가 고른 주소 종류
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: PostcodeResult) => void;
        onresize?: (size: { height: number }) => void;
        width?: string;
        height?: string;
      }) => { embed: (el: HTMLElement) => void };
    };
  }
}

// 무료로 열려있는 공식 스크립트 (별도 키 없음)
const SDK_URL = "https://t1.daum.net/postcode/api/mapsapi/postcode.v2.js";

// 스크립트를 1회만 로드 (KakaoShareButton 과 같은 방식)
let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error("Postcode SDK load failed"));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

/**
 * 주소 검색 버튼 — 누르면 우편번호 서비스를 시트로 띄우고,
 * 고른 주소를 onSelect 로 돌려준다.
 *
 * 새 창(open) 대신 화면 안에 끼워 넣는(embed) 방식을 쓴다.
 * 모바일 브라우저는 팝업을 막는 경우가 있어서다.
 */
export default function AddressSearch({
  onSelect,
}: {
  onSelect: (address: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  async function handleOpen() {
    setError(false);
    setBusy(true);
    try {
      await loadSdk();
      setOpen(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  // 시트가 열린 뒤 컨테이너가 생기면 그때 끼워 넣는다
  useEffect(() => {
    if (!open || !boxRef.current || !window.daum) return;
    boxRef.current.innerHTML = "";
    new window.daum.Postcode({
      oncomplete: (data) => {
        // 사용자가 고른 종류(도로명/지번)를 그대로 따른다
        const addr =
          data.userSelectedType === "J" ? data.jibunAddress : data.roadAddress;
        onSelect(addr);
        setOpen(false);
      },
      width: "100%",
      height: "100%",
    }).embed(boxRef.current);
  }, [open, onSelect]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={busy}
        className="shrink-0 rounded-xl border border-gold-200 px-3.5 py-2.5 text-sm font-medium text-gold-600 transition hover:bg-gold-50 disabled:opacity-60"
      >
        {busy ? "여는 중..." : "주소 검색"}
      </button>

      {error && (
        <p className="mt-1 w-full text-[11px] text-red-500">
          주소 검색을 열지 못했어요. 잠시 후 다시 시도하거나 직접 입력해 주세요.
        </p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[70vh] w-full max-w-md flex-col rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:h-[520px] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                주소 검색
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="text-2xl leading-none text-gray-400"
              >
                ×
              </button>
            </div>
            {/* 우편번호 서비스가 이 안에 들어온다 */}
            <div ref={boxRef} className="min-h-0 flex-1 overflow-hidden" />
          </div>
        </div>
      )}
    </>
  );
}

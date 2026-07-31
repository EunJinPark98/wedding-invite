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

/**
 * 우편번호 서비스 스크립트 (별도 키 없음).
 * 안내 문서에 실린 주소를 먼저 쓰고, 막히면 예전부터 쓰이던 주소를 시도한다.
 */
const SDK_URLS = [
  "https://t1.daum.net/postcode/api/mapsapi/bundle/daum.postcode.v2.js",
  "https://t1.daum.net/postcode/api/mapsapi/postcode.v2.js",
  "https://spi.maps.daum.net/imap/map_js_init/postcode.v2.js",
];

const ready = () => Boolean(window.daum?.Postcode);

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    // 주소가 없거나(404) 네트워크·차단으로 못 받은 경우 — 브라우저는 이유를 알려주지 않는다
    script.onerror = () => reject(new Error("내려받기 실패"));
    document.head.appendChild(script);
  });
}

// onload 이후에도 전역이 조금 늦게 잡히는 경우가 있어 잠깐 기다려 준다
function waitForReady(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (ready()) return resolve(true);
      if (Date.now() - started > timeoutMs) return resolve(false);
      setTimeout(tick, 100);
    };
    tick();
  });
}

// 스크립트를 1회만 로드 (KakaoShareButton 과 같은 방식)
let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (ready()) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = (async () => {
      // 어디서 왜 막혔는지 남겨 둔다 — 실패 안내에 그대로 보여 준다
      const tried: string[] = [];
      for (const url of SDK_URLS) {
        const host = new URL(url).host;
        try {
          await injectScript(url);
        } catch {
          tried.push(`${host}: 내려받기 실패`);
          continue; // 이 주소는 막혔거나 없음 → 다음 주소로
        }
        if (await waitForReady(3000)) return;
        tried.push(`${host}: 받았지만 실행 안 됨`);
      }
      sdkPromise = null; // 다음에 다시 시도할 수 있게
      throw new Error(tried.join(" / "));
    })();
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
  const [reason, setReason] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  async function handleOpen() {
    setReason(null);
    setBusy(true);
    try {
      await loadSdk();
      setOpen(true);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      // 인터넷 자체가 끊긴 경우는 서비스 탓이 아니니 따로 알려 준다
      setReason(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "인터넷 연결이 끊겨 있어요"
          : detail
      );
      console.error("[AddressSearch] 우편번호 서비스 로드 실패 —", detail);
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

      {reason && (
        <div className="mt-1 w-full text-[11px] leading-relaxed">
          <p className="text-red-500">
            주소 검색을 열지 못했어요. 위 칸에 직접 입력해도 괜찮아요.
          </p>
          {/* 원인을 그대로 노출 — 광고 차단·사내망 차단인지 바로 알 수 있다 */}
          <p className="mt-0.5 text-gray-400">사유 — {reason}</p>
        </div>
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

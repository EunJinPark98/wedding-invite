"use client";

import { useEffect, useState } from "react";

// 카카오 JS SDK (공유 전용) — 전역 window.Kakao 사용
declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (settings: object) => void;
      };
    };
  }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

// SDK 스크립트를 1회만 로드
let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error("Kakao SDK load failed"));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

/**
 * 카카오톡 공유 버튼 — 큰 사진 + 제목 + [청첩장 보기] 버튼이 있는
 * 피드 카드로 전송됩니다. NEXT_PUBLIC_KAKAO_JS_KEY 미설정 시 렌더링하지 않음.
 */
export default function KakaoShareButton({
  url,
  title,
  description,
  imageUrl,
  className = "",
}: {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  className?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!KAKAO_JS_KEY) return;
    let cancelled = false;
    loadSdk()
      .then(() => {
        if (cancelled || !window.Kakao) return;
        if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JS_KEY);
        setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!KAKAO_JS_KEY) return null;

  function share() {
    if (!window.Kakao) return;
    // 상대경로는 절대 URL로 변환 (카카오는 절대 URL만 허용)
    const absUrl = new URL(url, window.location.origin).href;
    const absImage = imageUrl
      ? new URL(imageUrl, window.location.origin).href
      : `${window.location.origin}/logo.png`;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: absImage,
        link: { mobileWebUrl: absUrl, webUrl: absUrl },
      },
      buttons: [
        {
          title: "청첩장 보기",
          link: { mobileWebUrl: absUrl, webUrl: absUrl },
        },
      ],
    });
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={!ready}
      className={`flex items-center justify-center gap-1.5 rounded-xl bg-[#FEE500] font-semibold text-[#191919] transition hover:brightness-95 disabled:opacity-60 ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#191919"
          d="M12 3C6.48 3 2 6.54 2 10.9c0 2.8 1.86 5.26 4.66 6.65l-.95 3.51c-.08.31.27.56.54.38l4.13-2.73c.53.05 1.07.08 1.62.08 5.52 0 10-3.54 10-7.9S17.52 3 12 3z"
        />
      </svg>
      카카오톡 공유
    </button>
  );
}

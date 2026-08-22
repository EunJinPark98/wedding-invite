"use client";

import { useEffect, useRef, useState } from "react";
import { bgmUrl, getBgmTrack } from "@/lib/bgm";
import type { TemplateTheme } from "@/lib/templates";

/**
 * 초대장 배경음악 재생 버튼.
 *
 * 브라우저(특히 모바일)는 소리 있는 자동재생을 막으므로, 하객이 직접 눌러야
 * 소리가 난다. 한 번 눌러 두면 계속 반복 재생한다.
 *
 * 파일은 누르기 전까지 받아오지 않는다(preload="none") — 초대장이 열리는
 * 속도에 영향을 주지 않기 위해서다.
 */
export default function BgmPlayer({
  bgm,
  t,
  mode = "manual",
}: {
  bgm: string;
  t: TemplateTheme;
  /**
   * off    — 소리도 버튼도 두지 않는다. 에디터는 미리보기를 여러 벌 그리는데
   *          모두 소리를 내면 겹쳐 들리므로, 한 벌만 빼고 이 값을 준다.
   * manual — 하객 화면. 눌러야 소리가 난다 (브라우저가 자동재생을 막는다).
   * auto   — 에디터에서 곡을 고르는 순간 바로 들려준다. 고르는 클릭 자체가
   *          사용자 조작이라 이때는 브라우저가 재생을 허용한다.
   */
  mode?: "off" | "manual" | "auto";
}) {
  const track = getBgmTrack(bgm);
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  // 고른 곡이 바뀌면 처음부터 다시 — auto 면 그대로 이어서 들려준다
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
    if (mode !== "auto" || !bgm) return;
    el.play().then(
      () => setPlaying(true),
      () => setPlaying(false) // 자동재생이 막히면 버튼으로 넘긴다
    );
  }, [bgm, mode]);

  if (mode === "off" || !track) return null;

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      // 재생이 막히는 환경(자동재생 정책·네트워크)에서도 화면이 어긋나지 않게
      el.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    // sticky + h-0: 자리를 차지하지 않고 초대장 위에 떠 있는다.
    // fixed 를 쓰면 에디터 미리보기(transform 이 걸린 상자) 밖으로 튀어나간다.
    <div className="pointer-events-none sticky top-0 z-30 flex h-0 justify-end">
      <div className="pointer-events-auto pr-4 pt-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "배경음악 끄기" : "배경음악 켜기"}
          aria-pressed={playing}
          title={track.name}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur transition hover:opacity-90"
          style={{
            background: `color-mix(in srgb, ${t.pageBg} 78%, transparent)`,
            border: `1px solid ${t.line}`,
            color: t.accent,
          }}
        >
          {playing ? (
            // 재생 중 — 음표에 작은 파동
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                d="M9 18V6l10-2v12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="6.5" cy="18" r="2.5" fill="currentColor" />
              <circle cx="16.5" cy="16" r="2.5" fill="currentColor" />
            </svg>
          ) : (
            // 꺼짐 — 음표에 사선
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                d="M9 18V6l10-2v12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.45"
              />
              <circle cx="6.5" cy="18" r="2.5" fill="currentColor" opacity="0.45" />
              <circle cx="16.5" cy="16" r="2.5" fill="currentColor" opacity="0.45" />
              <path
                d="M4 20 20 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>
      <audio
        ref={ref}
        src={bgmUrl(track.id)}
        loop
        preload="none"
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </div>
  );
}

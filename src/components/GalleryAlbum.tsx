"use client";

import { useState, useEffect } from "react";
import { usePhotoFallbackList } from "./usePhotoFallback";

export default function GalleryAlbum({
  images,
  rounded = "rounded-xl",
}: {
  images: string[];
  rounded?: string;
}) {
  const [idx, setIdx] = useState<number | null>(null);
  // 안 열리는 사진은 앨범에서 아예 뺀다. 빈 칸이나 깨진 아이콘을 남기는
  // 것보다, 원래 그만큼 올린 앨범처럼 보이는 편이 낫다.
  const { failed, onError, ref } = usePhotoFallbackList();
  const shown = images.filter((u) => !failed.has(u));

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIdx(null);
      if (e.key === "ArrowLeft")
        setIdx((i) => (i === null ? i : (i + shown.length - 1) % shown.length));
      if (e.key === "ArrowRight")
        setIdx((i) => (i === null ? i : (i + 1) % shown.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, shown.length]);

  if (shown.length === 0) return null;
  const [first, ...rest] = shown;
  const prev = () =>
    setIdx((i) => (i === null ? i : (i + shown.length - 1) % shown.length));
  const next = () =>
    setIdx((i) => (i === null ? i : (i + 1) % shown.length));
  // 크게 보는 중에 그 사진이 빠지면 번호가 범위를 넘을 수 있다
  const bigIdx = idx === null ? null : Math.min(idx, shown.length - 1);

  return (
    <>
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => setIdx(0)}
          className="block w-full"
          aria-label="사진 확대 보기"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={ref(first)}
            src={first}
            alt="gallery-feature"
            onError={onError(first)}
            className={`aspect-[4/3] w-full cursor-zoom-in object-cover shadow-sm ring-1 ring-black/5 ${rounded}`}
          />
        </button>
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {rest.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i + 1)}
                className="block w-full"
                aria-label="사진 확대 보기"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={ref(url)}
                  src={url}
                  alt={`gallery-${i}`}
                  onError={onError(url)}
                  className={`aspect-square w-full cursor-zoom-in object-cover shadow-sm ring-1 ring-black/5 ${rounded}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {bigIdx !== null && (
        <div
          onClick={() => setIdx(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={() => setIdx(null)}
            aria-label="닫기"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center text-3xl text-white/80 hover:text-white"
          >
            ×
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="이전 사진"
            className="absolute left-2 flex h-12 w-12 items-center justify-center text-4xl text-white/70 hover:text-white"
          >
            ‹
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={ref(shown[bigIdx])}
            src={shown[bigIdx]}
            alt={`gallery-large-${bigIdx}`}
            onError={onError(shown[bigIdx])}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="다음 사진"
            className="absolute right-2 flex h-12 w-12 items-center justify-center text-4xl text-white/70 hover:text-white"
          >
            ›
          </button>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm tracking-widest text-white/70">
            {bigIdx + 1} / {shown.length}
          </span>
        </div>
      )}
    </>
  );
}

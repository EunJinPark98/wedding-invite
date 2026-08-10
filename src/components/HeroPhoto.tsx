"use client";

import { useCallback, useState } from "react";

/**
 * 대표 사진 — 고른 모션은 사진이 다 온 뒤에 시작한다.
 *
 * 아웃포커스처럼 한 번만 지나가는 연출(2.6초)은 페이지가 열리는 순간부터
 * 시간이 흐른다. 링크를 받은 하객은 그때부터 사진을 내려받으므로, 사진이
 * 도착했을 땐 연출이 이미 끝나 있어 선명한 사진이 툭 나타날 뿐이다.
 * 에디터 미리보기에서는 사진이 이미 브라우저에 있어 늘 제대로 보이니,
 * 만든 사람은 그 차이를 알기 어렵다.
 *
 * 그래서 사진이 다 그려진 뒤에 모션 클래스를 붙인다. 이미 받아 둔 사진이면
 * onLoad 가 하이드레이션 전에 지나가 버리므로 complete 로 직접 확인한다.
 */
export default function HeroPhoto({
  src,
  motion,
  className,
}: {
  src: string;
  /** 붙일 모션 클래스 ("" 면 모션 없음) */
  motion: string;
  className: string;
}) {
  const [ready, setReady] = useState(false);
  const ref = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete) setReady(true);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt="대표 사진"
      onLoad={() => setReady(true)}
      className={`object-cover ${ready ? motion : ""} ${className}`}
    />
  );
}

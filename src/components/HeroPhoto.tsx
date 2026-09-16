"use client";

import { useCallback, useState } from "react";
import { usePhotoFallback } from "./usePhotoFallback";

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
  const { failed, onError, ref: failRef } = usePhotoFallback(src);
  const ref = useCallback(
    (el: HTMLImageElement | null) => {
      if (el?.complete) setReady(true);
      // 못 받은 사진인지도 같은 자리에서 본다 (둘 다 하이드레이션 전에 끝난다)
      failRef(el);
    },
    [failRef]
  );

  /**
   * 사진이 안 열리면 깨진 아이콘 대신 자리만 남긴다. 하객은 어차피 고칠 수
   * 없으니 "사진을 못 불러왔다"고 알리는 것보다 조용한 편이 낫다. 자리까지
   * 없애면 아래 글이 위로 딸려 올라와 짜임새가 흐트러지므로 크기는 지킨다.
   * 색은 템플릿 글자색을 옅게 깔아 밝은 템플릿과 어두운 템플릿 모두에 맞춘다.
   */
  if (failed) {
    return (
      <div
        className={className}
        style={{ background: "currentColor", opacity: 0.06 }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt="대표 사진"
      onLoad={() => setReady(true)}
      onError={onError}
      className={`object-cover ${ready ? motion : ""} ${className}`}
    />
  );
}

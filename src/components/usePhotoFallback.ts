"use client";

import { useCallback, useState } from "react";

/**
 * 사진이 끝내 안 열렸는지 알려 준다.
 *
 * 사진은 여러 이유로 안 열릴 수 있다 — 저장소에서 지워졌거나, 주소가 옛
 * 것이거나, 하객의 통신이 잠깐 끊겼거나. 아무것도 해 두지 않으면 브라우저가
 * 깨진 그림 아이콘을 그대로 내보낸다. 하객에게는 초대장이 고장 난 것처럼
 * 보이고, 만든 사람은 무엇을 해야 하는지 알 수 없다.
 *
 * 그래서 자리마다 "안 열렸을 때 대신 보일 것"을 정하고, 그 판단만 여기서
 * 한다. 하객이 보는 쪽은 사진이 없는 것처럼 조용히 넘어가고(고장으로 보이지
 * 않는 편이 낫다), 만든 사람이 보는 쪽은 다시 올리라고 알려 준다.
 *
 * 사진을 새로 올리면 주소가 바뀌므로 그때 다시 시도한다.
 */
export function usePhotoFallback(src: string | undefined) {
  // 어느 주소가 안 열렸는지를 담는다. "안 열렸다"만 담아 두면 사진을 새로
  // 올렸을 때 따로 되돌려 줘야 하는데, 주소를 담아 두면 주소가 바뀌는 순간
  // 저절로 풀린다.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !!src && failedSrc === src;

  const onError = useCallback(() => setFailedSrc(src ?? null), [src]);

  /**
   * 초대장 화면은 서버에서 그려져 오므로, 브라우저는 React 가 붙기 전에 이미
   * 사진을 받기 시작한다. 그 사이에 실패가 끝나 버리면 onError 는 영영 오지
   * 않는다 — 하객 화면에서 액박이 그대로 남던 것이 이 경우였다.
   * 그래서 붙는 순간 직접 확인한다. 다 받았다는데(complete) 크기가 0 이면
   * 받지 못한 것이다.
   */
  const ref = useCallback(
    (el: HTMLImageElement | null) => {
      if (el?.complete && el.naturalWidth === 0) setFailedSrc(src ?? null);
    },
    [src]
  );

  return { failed, onError, ref };
}

/**
 * 여러 장을 한 번에 다룰 때 (갤러리). 안 열린 주소를 모아 두고, 그 칸은
 * 아예 그리지 않아 앨범이 원래 그만큼인 것처럼 보이게 한다.
 */
export function usePhotoFallbackList() {
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const mark = useCallback(
    (src: string) =>
      setFailed((prev) => {
        if (prev.has(src)) return prev;
        const next = new Set(prev);
        next.add(src);
        return next;
      }),
    []
  );

  const onError = useCallback((src: string) => () => mark(src), [mark]);

  // 서버에서 그려져 온 사진은 React 가 붙기 전에 실패가 끝나 있을 수 있다
  const ref = useCallback(
    (src: string) => (el: HTMLImageElement | null) => {
      if (el?.complete && el.naturalWidth === 0) mark(src);
    },
    [mark]
  );

  return { failed, onError, ref };
}

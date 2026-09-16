"use client";

import { usePhotoFallback } from "./usePhotoFallback";

/**
 * 하객이 보는 사진 한 장.
 *
 * 초대장 화면은 서버에서 그려지는데, 사진이 끝내 안 열렸다는 것은 브라우저만
 * 알 수 있다. 그래서 이 한 겹만 브라우저 쪽 조각으로 떼어 둔다 — 대표 사진을
 * HeroPhoto 로 따로 둔 것과 같은 이유다.
 *
 * 안 열리면 깨진 아이콘 대신 자리만 남긴다. 하객은 어차피 고칠 수 없으니
 * "사진을 못 불러왔다"고 알리는 것보다 조용한 편이 낫고, 자리까지 없애면
 * 아래 내용이 딸려 올라와 짜임새가 흐트러진다. 색은 템플릿 글자색을 옅게
 * 깔아 밝은 템플릿과 어두운 템플릿 모두에 맞춘다.
 */
export default function PhotoImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const { failed, onError, ref } = usePhotoFallback(src);

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
      alt={alt}
      onError={onError}
      className={className}
    />
  );
}

"use client";

import { useEffect } from "react";

/**
 * 스크롤로 내려갈 때 각 섹션 글씨가 떠오르게 한다.
 *
 * 원래는 CSS 만으로(`animation-timeline: view()`) 처리했는데, 이 기능은
 * 크롬 계열에서만 동작한다. 사파리·파이어폭스에서는 폴백이 걸려 스크롤과
 * 상관없이 화면을 열자마자 전부 재생돼 버려서, 정작 내려볼 때는 아무것도
 * 나타나지 않았다. 모바일 초대장은 아이폰으로 보는 경우가 많아 사실상
 * 대부분의 손님에게 연출이 없는 셈이었다.
 *
 * 그래서 그 브라우저들에서만 이 컴포넌트가 대신 맡는다.
 * (CSS 규칙도 `@supports not` 안에 있어, 크롬에서는 기존 동작 그대로다.)
 */
export default function ScrollReveal() {
  useEffect(() => {
    // 모션을 줄이도록 설정한 기기에서는 연출을 걸지 않는다 — 글씨는 그대로 보인다
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("inv-reveal-on");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("inv-in");
          io.unobserve(e.target); // 한 번 나타나면 다시 숨기지 않는다
        }
      },
      // 살짝 올라온 뒤에 시작해야 자연스럽다
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    const watch = () =>
      document
        .querySelectorAll(".inv-fade:not(.inv-in)")
        .forEach((el) => io.observe(el));
    watch();

    // 갤러리·계좌처럼 입력에 따라 나중에 붙는 섹션도 놓치지 않게.
    // childList 만 보므로 위에서 클래스를 더해도 다시 불리지 않는다.
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      root.classList.remove("inv-reveal-on");
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

/**
 * 스크롤로 내려갈 때 각 섹션 글씨가 떠오르게 한다.
 *
 * 원래는 CSS 만으로(`animation-timeline: view()`) 처리했는데, 이 속성은
 * 브라우저마다 지원이 갈린다. 지원하지 않으면 폴백이 걸려 화면을 열자마자
 * 전부 재생돼 정작 스크롤할 때는 아무것도 나타나지 않고, 지원하더라도
 * 인앱 브라우저 등에서 기대대로 보이지 않는 경우가 있었다.
 *
 * 그래서 지원 여부를 따지지 않고 모든 브라우저에서 이쪽 한 가지 방식으로
 * 통일한다. 스크립트가 없으면 CSS 폴백대로 그냥 보인다.
 */
export default function ScrollReveal() {
  useEffect(() => {
    // 모션을 줄이도록 설정한 기기에서는 연출을 걸지 않는다 — 글씨는 그대로 보인다
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const reveal = (el: Element) => el.classList.add("inv-in");

    // 이미 보이고 있던 글씨를 숨겼다가 다시 띄우면 깜빡이므로, 첫 화면에
    // 들어와 있는 것들은 숨기지 않고 그대로 둔다.
    //
    // 순서가 중요하다. getBoundingClientRect() 는 스타일 계산을 강제하므로,
    // 반드시 inv-reveal-on 을 붙이기 "전에" 위치를 다 재둬야 한다. 순서가
    // 뒤바뀌면 opacity:0 이 확정된 뒤 inv-in 이 붙어, 첫 화면 글씨가
    // 사라졌다 나타나는 깜빡임이 생긴다.
    const inFirstScreen = [
      ...document.querySelectorAll<HTMLElement>(".inv-fade"),
    ].filter((el) => el.getBoundingClientRect().top < window.innerHeight * 0.9);

    // 아래 두 줄 사이에는 화면이 다시 그려지지 않는다
    root.classList.add("inv-reveal-on");
    inFirstScreen.forEach(reveal);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          reveal(e.target);
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

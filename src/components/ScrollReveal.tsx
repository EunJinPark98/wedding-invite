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
 *
 * 에디터 미리보기(폰 프레임 안)에서도 똑같이 동작한다. IntersectionObserver
 * 는 창뿐 아니라 중간의 스크롤·클리핑 상자까지 따져 교차를 판정하므로,
 * 프레임 안을 스크롤해도 그때그때 나타난다.
 */
// 에디터에는 미리보기가 여러 개 떠 있어 이 컴포넌트도 여러 번 붙는다.
// 하나가 사라질 때 공용 클래스를 지워 나머지 미리보기의 연출이 풀리지
// 않도록, 마지막 하나가 사라질 때만 정리한다.
let mounted = 0;

// 나타나는 연출을 붙일 대상.
// 글씨(.inv-fade) 와 프로필 사진(.inv-zoom) 이 같은 방식으로 움직인다.
const TARGETS = ".inv-fade, .inv-zoom";

/**
 * "첫 화면"으로 볼 경계선의 y 좌표.
 *
 * 실제 초대장은 창이 곧 화면이지만, 에디터 미리보기는 폰 프레임 안에서
 * 스크롤된다. 창 기준으로만 재면 프레임 밖에 있어 보이지도 않는 글씨까지
 * 첫 화면으로 쳐서, 정작 스크롤해 내려갔을 때 이미 다 나타나 있게 된다.
 * 그래서 요소를 감싼 가장 가까운 스크롤·클리핑 상자를 기준으로 잡는다.
 */
function firstScreenBottom(el: Element) {
  let top = 0;
  let bottom = window.innerHeight;

  for (let p = el.parentElement; p; p = p.parentElement) {
    if (getComputedStyle(p).overflowY !== "visible") {
      const r = p.getBoundingClientRect();
      top = Math.max(top, r.top);
      bottom = Math.min(bottom, r.bottom);
      break;
    }
  }

  return top + (bottom - top) * 0.9;
}

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
      ...document.querySelectorAll<HTMLElement>(TARGETS),
    ].filter((el) => el.getBoundingClientRect().top < firstScreenBottom(el));

    // 아래 두 줄 사이에는 화면이 다시 그려지지 않는다
    mounted += 1;
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
      // 아래쪽 여백(rootMargin)을 음수로 주면 안 된다. 화면 맨 아래 그만큼은
      // 영원히 교차 판정이 안 나서, 푸터 맺음말처럼 페이지 끝에 붙은 글씨가
      // 끝까지 내려도 계속 숨은 채로 남는다.
      // 대신 요소가 어느 정도 들어왔을 때 시작하도록 threshold 로 조절한다.
      { threshold: 0.15 }
    );

    const watch = () =>
      document
        .querySelectorAll(`${TARGETS.split(", ").map((t) => `${t}:not(.inv-in)`).join(", ")}`)
        .forEach((el) => io.observe(el));
    watch();

    // 갤러리·계좌처럼 입력에 따라 나중에 붙는 섹션도 놓치지 않게.
    //
    // class 까지 보는 이유: 에디터에서 입력을 고치면 React 가 그 자리의
    // className 을 통째로 다시 써서, 우리가 붙여 둔 inv-in 이 지워질 수 있다.
    // 이미 unobserve 한 뒤라 그대로 두면 그 글씨는 영영 숨은 채로 남는다.
    // 다시 관찰 대상에 넣어 주면 보이는 자리면 바로 다시 나타난다.
    // (우리가 inv-in 을 붙일 때도 불리지만, 그때는 대상이 없어 곧 멎는다.)
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        const target = r.target as Element;
        if (
          r.type === "childList" ||
          target.classList?.contains("inv-fade") ||
          target.classList?.contains("inv-zoom")
        ) {
          watch();
          return;
        }
      }
    });
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ["class"],
    });

    return () => {
      mo.disconnect();
      io.disconnect();
      mounted -= 1;
      if (mounted === 0) root.classList.remove("inv-reveal-on");
    };
  }, []);

  return null;
}

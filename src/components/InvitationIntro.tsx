"use client";

import { useEffect, useState } from "react";
import type { InvitationData } from "@/lib/types";
import type { TemplateTheme } from "@/lib/templates";

/**
 * 청첩장을 열면 잠깐 지나가는 인트로(오프닝) 화면.
 *
 * 주인공은 직접 적은 문구다. 연출 4종은 모두 그 문구를 어떻게 띄우느냐로
 * 갈린다 — 번지듯 또렷해지거나(blur), 선을 따라 드러나거나(line),
 * 사진이 밝아지며 얹히거나(photo), 별빛 속에서 떠오른다(star).
 *
 * 연출이 끝나면 스스로 사라지고, 그전에 아무 데나 누르면 바로 넘어간다.
 * 초대장 루트를 덮는 방식이라(absolute) 에디터의 폰 프레임 안에서도 똑같이
 * 보인다. 화면에 붙어 있어야 하는 부분은 안쪽 sticky 가 맡는다.
 *
 * 사라지는 시점은 CSS(inv-intro 의 페이드아웃)와 아래 시간이 맞물려 있다.
 * 한쪽만 고치면 인트로가 사라진 뒤에도 덮개가 남아 클릭을 먹으니 함께 고칠 것.
 */
const DURATION = 2900;

// 별빛 연출용 — 열 때마다 자리가 달라지지 않도록 고정해 둔다
const SPARKS = [
  { left: "12%", top: "22%", size: 3, delay: 0 },
  { left: "78%", top: "18%", size: 2, delay: 0.5 },
  { left: "26%", top: "68%", size: 2, delay: 1.1 },
  { left: "64%", top: "74%", size: 3, delay: 0.3 },
  { left: "45%", top: "12%", size: 2, delay: 0.8 },
  { left: "88%", top: "52%", size: 2, delay: 1.4 },
  { left: "8%", top: "48%", size: 2, delay: 0.9 },
  { left: "56%", top: "88%", size: 3, delay: 1.7 },
];

const dateText = (weddingDate: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weddingDate.trim());
  return m ? `${m[1]}. ${m[2]}. ${m[3]}` : "";
};

export default function InvitationIntro({
  data,
  t,
  style,
}: {
  data: InvitationData;
  t: TemplateTheme;
  style: string;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // 모션을 줄이도록 설정한 기기에서는 연출 없이 곧바로 넘긴다.
    // (서버에서 이미 그려 보낸 화면이라 첫 렌더에서 지우면 안 되고,
    //  한 박자 뒤에 지워야 하이드레이션이 어긋나지 않는다)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(() => setDone(true), reduce ? 0 : DURATION);
    return () => clearTimeout(id);
  }, []);

  if (done) return null;

  const names = [data.groomName, data.brideName].filter(Boolean).join("  ♥  ");
  // 적어 둔 문구가 주인공. 비워 두면 두 사람 이름이 그 자리를 대신한다.
  const phrase = data.introText.trim() || names;
  const sub = data.introText.trim() ? names : "";
  const date = dateText(data.weddingDate);

  const dark = style === "star" || style === "photo";
  const background =
    style === "star" ? "#141830" : style === "photo" ? "#15130f" : t.pageBg;
  const inkColor = dark ? "#fdfaf3" : t.ink;
  const subColor = dark ? "#ded5c4" : t.sub;
  const accentColor = style === "star" ? "#e2c579" : dark ? "#f0e5d2" : t.accent;

  // 문구에 걸리는 연출 — 연출별로 클래스만 갈아 끼운다
  const phraseClass =
    style === "blur"
      ? "inv-intro-blur"
      : style === "line"
        ? "inv-intro-wipe"
        : "inv-intro-rise";

  return (
    <div
      className="inv-intro absolute inset-0 z-30 overflow-hidden"
      style={{ background }}
      onClick={() => setDone(true)}
      aria-hidden
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {style === "photo" && data.mainPhotoUrl && (
          <div
            className="inv-intro-photo absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.mainPhotoUrl})` }}
          />
        )}

        {style === "star" && (
          <div className="pointer-events-none absolute inset-0">
            {SPARKS.map((s, i) => (
              <span
                key={i}
                className="inv-twinkle"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  background: "#f6e7b8",
                  boxShadow: "0 0 6px 1px #e2c579",
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative px-8 text-center">
          {/* 라인 리빌 — 위아래 선이 그어지고 그 사이로 문구가 드러난다 */}
          {style === "line" && (
            <span
              className="inv-intro-line mx-auto mb-5 block h-px"
              style={{ background: accentColor }}
            />
          )}

          {/* 문구 글꼴은 템플릿을 따르지 않고 흘림체로 고정한다 (inv-intro-phrase) */}
          <p
            className={`${phraseClass} inv-intro-phrase whitespace-pre-line text-[calc(1.75rem*var(--inv-fs))] tracking-[0.01em]`}
            style={{ color: inkColor }}
          >
            {phrase}
          </p>

          {sub && (
            <p
              className="inv-intro-rise-2 mt-5 text-[calc(14px*var(--inv-fs))] tracking-[0.12em]"
              style={{ color: accentColor, fontFamily: t.headingFont }}
            >
              {sub}
            </p>
          )}
          {date && (
            <p
              className="inv-intro-rise-2 mt-2 text-[calc(12.5px*var(--inv-fs))] tracking-[0.25em]"
              style={{ color: subColor }}
            >
              {date}
            </p>
          )}

          {style === "line" && (
            <span
              className="inv-intro-line mx-auto mt-5 block h-px"
              style={{ background: accentColor }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

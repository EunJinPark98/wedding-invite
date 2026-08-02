"use client";

import { useEffect, useState } from "react";
import type { InvitationData } from "@/lib/types";
import type { TemplateTheme } from "@/lib/templates";

/**
 * 청첩장을 열면 잠깐 지나가는 인트로(오프닝) 화면.
 *
 * 연출이 끝나면 스스로 사라지고, 그전에 아무 데나 누르면 바로 넘어간다.
 * 초대장 루트를 덮는 방식이라(absolute) 에디터의 폰 프레임 안에서도 똑같이
 * 보인다. 화면에 붙어 있어야 하는 부분은 안쪽 sticky 가 맡는다.
 *
 * 사라지는 시점은 CSS(inv-intro 의 페이드아웃)와 아래 시간이 맞물려 있다.
 * 한쪽만 고치면 인트로가 사라진 뒤에도 덮개가 남아 클릭을 먹으니 함께 고칠 것.
 */
const DURATION = 2900;

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
  const date = dateText(data.weddingDate);

  // 커튼은 좌우 패널이 직접 화면을 가리므로 덮개 자체는 비워 둔다
  const background =
    style === "curtain"
      ? "transparent"
      : style === "photo"
        ? "#15130f"
        : t.pageBg;

  return (
    <div
      className="inv-intro absolute inset-0 z-30 overflow-hidden"
      style={{ background }}
      onClick={() => setDone(true)}
      aria-hidden
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {style === "curtain" && (
          <>
            <div
              className="inv-intro-curtain-l absolute inset-y-0 left-0 w-1/2"
              style={{ background: t.pageBg, borderRight: `1px solid ${t.line}` }}
            />
            <div
              className="inv-intro-curtain-r absolute inset-y-0 right-0 w-1/2"
              style={{ background: t.pageBg }}
            />
          </>
        )}

        {style === "photo" && data.mainPhotoUrl && (
          <>
            <div
              className="inv-intro-zoom absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${data.mainPhotoUrl})` }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.2) 45%,rgba(0,0,0,0.6) 100%)",
              }}
            />
          </>
        )}

        {style === "envelope" && (
          <div className="inv-intro-card relative" style={{ perspective: 900 }}>
            {/* 봉투 몸통 */}
            <div
              className="relative h-[152px] w-[228px] rounded-sm"
              style={{ background: t.accentSoft, border: `1px solid ${t.line}` }}
            >
              {/* 안에서 떠오르는 카드 */}
              <div
                className="inv-intro-letter absolute inset-x-4 top-3 rounded-sm px-3 py-4 text-center"
                style={{ background: t.pageBg, border: `1px solid ${t.line}` }}
              >
                <p
                  className="text-[13px] tracking-[0.3em]"
                  style={{ color: t.accent, fontFamily: t.headingFont }}
                >
                  INVITATION
                </p>
                <p
                  className="mt-2 text-[15px]"
                  style={{ color: t.ink, fontFamily: t.headingFont }}
                >
                  {names}
                </p>
              </div>
              {/* 위로 젖혀지는 덮개 */}
              <div
                className="inv-intro-flap absolute inset-x-0 top-0 h-[74px]"
                style={{
                  background: t.accent,
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                }}
              />
            </div>
          </div>
        )}

        {/* 이름·날짜 — 봉투는 카드 안에 이미 들어가 있어 겹쳐 두지 않는다 */}
        {style !== "envelope" && (
          <div className="relative px-8 text-center">
            <p
              className="inv-intro-rise text-[12px] tracking-[0.45em]"
              style={{
                color: style === "photo" ? "#f4efe6" : t.accent,
                fontFamily: t.headingFont,
              }}
            >
              WEDDING INVITATION
            </p>
            <p
              className="inv-intro-rise-2 mt-4 text-2xl tracking-[0.06em]"
              style={{
                color: style === "photo" ? "#ffffff" : t.ink,
                fontFamily: t.headingFont,
              }}
            >
              {names}
            </p>
            {date && (
              <p
                className="inv-intro-rise-2 mt-3 text-sm tracking-[0.25em]"
                style={{ color: style === "photo" ? "#e6ded1" : t.sub }}
              >
                {date}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/**
 * 사진 페이드는 사진이 도착해야 시작한다.
 *
 * 에디터 미리보기에서는 사진이 이미 브라우저에 있어 곧바로 밝아지지만, 링크를
 * 받은 사람은 그때부터 사진을 내려받는다. 그대로 두면 연출은 페이지가 열리는
 * 순간 흘러가 버려서, 사진이 도착했을 땐 이미 끝나 있고 하객은 캄캄한 화면만
 * 보게 된다. 그래서 사진이 올 때까지 기다렸다가 시작한다 — 미리보기 그대로.
 *
 * 다만 하염없이 기다리면 그게 더 답답하므로 여기까지만 기다린다.
 */
const PHOTO_WAIT_MAX = 2500;

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

// 꽃잎 흩날림 — 자리·속도·기울기를 고정해 매번 같은 그림이 나오게 한다.
// 인트로가 3초도 채 되지 않으니 늦게 시작하는 꽃잎은 보이지도 않는다.
// 그래서 대기 시간은 짧게, 떨어지는 속도는 빠르게 잡는다.
const PETALS = [
  { left: "8%", size: 13, dur: 2.4, delay: 0, sway: 26, tilt: -18 },
  { left: "21%", size: 9, dur: 3.0, delay: 0.25, sway: -20, tilt: 24 },
  { left: "34%", size: 15, dur: 2.6, delay: 0.1, sway: 30, tilt: 12 },
  { left: "47%", size: 10, dur: 3.2, delay: 0.45, sway: -26, tilt: -30 },
  { left: "59%", size: 14, dur: 2.5, delay: 0.05, sway: 22, tilt: 20 },
  { left: "71%", size: 9, dur: 3.1, delay: 0.35, sway: -30, tilt: -14 },
  { left: "84%", size: 12, dur: 2.8, delay: 0.15, sway: 24, tilt: 28 },
  { left: "93%", size: 10, dur: 3.3, delay: 0.55, sway: -18, tilt: -22 },
];

// 풍선 — 아래에서 두둥실 떠오른다 (돌잔치)
const BALLOONS = [
  { left: "10%", size: 34, dur: 2.6, delay: 0, sway: 18, color: "#ff9aa2" },
  { left: "24%", size: 26, dur: 3.0, delay: 0.3, sway: -14, color: "#ffd166" },
  { left: "40%", size: 40, dur: 2.4, delay: 0.1, sway: 22, color: "#a0d8ef" },
  { left: "56%", size: 28, dur: 2.9, delay: 0.45, sway: -18, color: "#c3b1e1" },
  { left: "72%", size: 36, dur: 2.5, delay: 0.2, sway: 16, color: "#ffb3c6" },
  { left: "88%", size: 24, dur: 3.1, delay: 0.55, sway: -20, color: "#b5e5a4" },
];

// 컨페티 — 위에서 쏟아진다 (생일)
const CONFETTI = [
  { left: "6%", dur: 2.3, delay: 0, tilt: 24, color: "#f26d5f" },
  { left: "18%", dur: 2.8, delay: 0.25, tilt: -18, color: "#ffd166" },
  { left: "30%", dur: 2.5, delay: 0.1, tilt: 32, color: "#5fb7c9" },
  { left: "42%", dur: 3.0, delay: 0.4, tilt: -26, color: "#9b8cf2" },
  { left: "54%", dur: 2.4, delay: 0.05, tilt: 20, color: "#f2a3c0" },
  { left: "66%", dur: 2.9, delay: 0.3, tilt: -30, color: "#ffd166" },
  { left: "78%", dur: 2.6, delay: 0.15, tilt: 28, color: "#f26d5f" },
  { left: "90%", dur: 3.1, delay: 0.5, tilt: -22, color: "#5fb7c9" },
];

/**
 * 한 글자씩 써지듯 나타나는 문구.
 *
 * 글자마다 span 을 만들어 시작 시각만 조금씩 늦춘다. 단어는 통째로 감싸
 * 줄바꿈이 단어 중간에서 일어나지 않게 하고, 문구가 길어도 인트로가 끝나기
 * 전에 다 써지도록 글자 간격을 줄인다.
 *
 * 글자에 걸리는 연출은 letterClass 로 갈아 끼운다 (꽃잎=획이 그어지듯,
 * 먹번짐=먹이 크게 번졌다 조여들듯).
 */
function WrittenPhrase({
  text,
  letterClass,
}: {
  text: string;
  letterClass: string;
}) {
  const total = [...text.replace(/\s/g, "")].length || 1;
  const step = Math.min(0.06, 1.25 / total);
  let n = 0;

  return (
    <>
      {text.split("\n").map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word, wi, words) => (
            <span key={wi}>
              <span className="inline-block whitespace-nowrap">
                {[...word].map((ch, ci) => (
                  <span
                    key={ci}
                    className={letterClass}
                    style={{ animationDelay: `${(n++ * step).toFixed(3)}s` }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
              {wi < words.length - 1 && " "}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

/**
 * 이 초대장이 놓인 "화면 한 장"의 높이.
 *
 * 인트로는 화면을 가득 덮는 연출이라 높이가 곧 사진이 잘리는 정도를 정한다.
 * 100vh(=창 높이)를 그대로 쓰면 에디터 미리보기에서 폰 프레임보다 훨씬 길어져
 * 사진이 양옆으로 더 잘리고, 하객이 보는 것과 다른 그림이 나온다.
 * 그래서 초대장을 담고 있는 스크롤 상자(=미리보기의 폰 프레임)를 기준으로 삼고,
 * 그런 상자가 없으면(링크로 연 화면) 브라우저 창을 쓴다.
 */
function screenHeightOf(el: HTMLElement): number {
  let p = el.parentElement;
  while (p) {
    const oy = getComputedStyle(p).overflowY;
    if (oy === "auto" || oy === "scroll") return p.clientHeight;
    p = p.parentElement;
  }
  return window.innerHeight;
}

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
  // 사진 페이드일 때만 사진을 기다린다. 나머지 연출은 기다릴 것이 없다.
  const waitsForPhoto = style === "photo" && !!data.mainPhotoUrl;
  const [started, setStarted] = useState(!waitsForPhoto);

  // 사진이 끝내 안 오더라도 여기까지만 붙잡는다
  useEffect(() => {
    if (!waitsForPhoto) return;
    const id = setTimeout(() => setStarted(true), PHOTO_WAIT_MAX);
    return () => clearTimeout(id);
  }, [waitsForPhoto]);

  // 이미 받아 둔 사진이면 onLoad 가 하이드레이션 전에 지나가 버린다 —
  // 붙는 순간 다 그려져 있는지 직접 확인한다.
  const photoRef = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete) setStarted(true);
  }, []);

  // 덮을 화면의 높이 (창 크기가 바뀌면 다시 잰다)
  const [screenH, setScreenH] = useState<number>();
  const screenEl = useRef<HTMLDivElement>(null);
  const screenRef = useCallback((el: HTMLDivElement | null) => {
    screenEl.current = el;
    if (el) setScreenH(screenHeightOf(el));
  }, []);
  useEffect(() => {
    const remeasure = () => {
      const el = screenEl.current;
      if (el) setScreenH(screenHeightOf(el));
    };
    window.addEventListener("resize", remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, []);

  useEffect(() => {
    if (!started) return;
    // 모션을 줄이도록 설정한 기기에서는 연출 없이 곧바로 넘긴다.
    // (서버에서 이미 그려 보낸 화면이라 첫 렌더에서 지우면 안 되고,
    //  한 박자 뒤에 지워야 하이드레이션이 어긋나지 않는다)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(() => setDone(true), reduce ? 0 : DURATION);
    return () => clearTimeout(id);
  }, [started]);

  if (done) return null;

  const names = [data.groomName, data.brideName].filter(Boolean).join("  ♥  ");
  // 적어 둔 문구가 주인공. 비워 두면 두 사람 이름이 그 자리를 대신한다.
  const phrase = data.introText.trim() || names;
  // 꽃잎은 문구 한 줄만 남기는 연출이라 이름·날짜를 함께 두지 않는다
  const bare = style === "petal";
  const sub = !bare && data.introText.trim() ? names : "";
  const date = bare ? "" : dateText(data.weddingDate);

  const dark = style === "star" || style === "photo";
  const background =
    style === "star" ? "#141830" : style === "photo" ? "#15130f" : t.pageBg;
  const inkColor = dark ? "#fdfaf3" : t.ink;
  const subColor = dark ? "#ded5c4" : t.sub;
  const accentColor = style === "star" ? "#e2c579" : dark ? "#f0e5d2" : t.accent;

  // 문구에 걸리는 연출 — 연출별로 클래스만 갈아 끼운다.
  // 어느 것도 자간을 건드리지 않는다. 자간이 변하면 글자 폭이 달라져
  // 재생 도중에 줄바꿈이 다시 계산되고, 두 줄이던 문구가 한 줄로 튄다.
  const phraseClass =
    // 먹번짐은 글자마다 따로 번져 나오므로 문단에는 연출을 걸지 않는다
    style === "ink" || style === "petal"
      ? ""
      : style === "blur"
        ? "inv-intro-blur"
      : style === "line"
        ? "inv-intro-wipe"
        : "inv-intro-phrase-in";

  return (
    <div
      // 사진이 오기 전에는 inv-intro 를 붙이지 않는다 — 붙는 순간부터 시간이
      // 흘러 2.1초 뒤 사라지기 시작하므로, 사진이 늦으면 캄캄한 화면만 지나간다.
      className={`absolute inset-0 z-30 overflow-hidden${started ? " inv-intro" : ""}`}
      style={{ background }}
      onClick={() => setDone(true)}
      aria-hidden
    >
      <div
        ref={screenRef}
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
        // 재기 전(서버에서 그려 보낸 첫 화면)에는 h-screen 을 그대로 쓴다.
        // --inv-screen 은 꽃잎·풍선·컨페티가 날아가는 거리의 기준이 된다.
        style={
          screenH
            ? ({
                height: screenH,
                "--inv-screen": `${screenH}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {/* 사진은 기다리는 동안에도 걸어 두어야 그때 내려받기 시작한다.
            다 받은 뒤에야(onLoad) 밝아지는 연출을 붙인다. */}
        {style === "photo" && data.mainPhotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={photoRef}
            src={data.mainPhotoUrl}
            alt=""
            onLoad={() => setStarted(true)}
            onError={() => setStarted(true)}
            className={`absolute inset-0 h-full w-full object-cover ${
              started ? "inv-intro-photo" : "opacity-0"
            }`}
          />
        )}

        {style === "petal" && (
          <div className="pointer-events-none absolute inset-0">
            {PETALS.map((p, i) => (
              <span
                key={i}
                className="inv-intro-petal"
                style={
                  {
                    left: p.left,
                    width: p.size,
                    height: p.size * 1.35,
                    background: t.accent,
                    animationDuration: `${p.dur}s`,
                    animationDelay: `${p.delay}s`,
                    "--petal-sway": `${p.sway}px`,
                    "--petal-tilt": `${p.tilt}deg`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        {style === "balloon" && (
          <div className="pointer-events-none absolute inset-0">
            {BALLOONS.map((b, i) => (
              <span
                key={i}
                className="inv-intro-balloon"
                style={
                  {
                    left: b.left,
                    width: b.size,
                    height: b.size * 1.22,
                    background: b.color,
                    animationDuration: `${b.dur}s`,
                    animationDelay: `${b.delay}s`,
                    "--sway": `${b.sway}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        {style === "confetti" && (
          <div className="pointer-events-none absolute inset-0">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="inv-intro-confetti"
                style={
                  {
                    left: c.left,
                    background: c.color,
                    animationDuration: `${c.dur}s`,
                    animationDelay: `${c.delay}s`,
                    "--tilt": `${c.tilt}deg`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
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

        {/* 문구도 사진과 함께 나와야 한다. 먼저 나오면 사진이 도착했을 땐
            이미 다 써진 뒤라 미리보기에서 본 것과 어긋난다. */}
        {started && (
          <div className="relative px-8 text-center">
            {/* 먹번짐 — 글씨 뒤로 먹물이 한 번 번졌다 스며든다 */}
            {style === "ink" && (
              <span className="inv-intro-ink-wash" style={{ color: inkColor }} />
            )}

            {/* 라인 리빌 — 위아래 선이 그어지고 그 사이로 문구가 드러난다 */}
            {style === "line" && (
              <span
                className="inv-intro-line mx-auto mb-5 block h-px"
                style={{ background: accentColor }}
              />
            )}

            {/* 문구 글꼴은 템플릿을 따르지 않고 흘림체로 고정한다 (inv-intro-phrase) */}
            <p
              className={`${phraseClass} inv-intro-phrase relative whitespace-pre-line text-[calc(2.3rem*var(--inv-fs))] tracking-[0.01em]`}
              style={{ color: inkColor }}
            >
              {style === "petal" ? (
                <WrittenPhrase text={phrase} letterClass="inv-intro-letter" />
              ) : style === "ink" ? (
                <WrittenPhrase text={phrase} letterClass="inv-intro-ink-letter" />
              ) : (
                phrase
              )}
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
        )}
      </div>
    </div>
  );
}

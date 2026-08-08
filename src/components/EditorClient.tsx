"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import InvitationView from "./InvitationView";
import AuthStatus from "./AuthStatus";
import KakaoShareButton from "./KakaoShareButton";
import AddressSearch from "./AddressSearch";
import {
  getTemplatesByCategory,
  findTheme,
  FONTS,
  TITLE_FONTS,
  type FontOption,
} from "@/lib/templates";
import { getCategoryLabels } from "@/lib/categories";
import { fileToCompressedBlob } from "@/lib/image";
import {
  emptyInvitation,
  normalizeData,
  BABY_GENDERS,
  CATEGORY_IDS,
  DIVIDERS,
  DOL_KINDS,
  FONT_SCALES,
  HERO_MOTIONS,
  getIntros,
  introPlaceholder,
  MAX_GALLERY,
  SAMPLE_INTRO,
  SENIOR_AGES,
  dolGreetingMessage,
  dolGreetingTitle,
  expiryDateLabel,
  isSamplePhoto,
  seniorGreetingTitle,
  type Account,
  type Category,
  type DolKind,
  type InvitationData,
  type TemplateId,
} from "@/lib/types";

/* ───────── 이미지 업로드 ───────── */
// 사진이 올라가는 동안 도는 표시 (업로드가 길어질 때 멈춘 것처럼 보이지 않게)
function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="사진 올리는 중"
      className={`${className} animate-spin rounded-full border-2 border-gold-100 border-t-gold-400`}
    />
  );
}

// 클라이언트에서 압축 → 서버 업로드 → 저장은 URL만
async function uploadPhoto(file: File): Promise<string> {
  const blob = await fileToCompressedBlob(file);
  const form = new FormData();
  form.append("file", blob, "photo.jpg");
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "업로드에 실패했습니다.");
  return json.url as string;
}

function ImageUpload({
  value,
  onChange,
  label,
  className = "h-40",
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadPhoto(file));
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "이미지를 처리하지 못했습니다. 다른 파일을 시도해 주세요."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label
        className={`relative flex ${className} w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400 transition hover:border-gold-300`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{label}</span>
        )}
        {/* 이미 올린 사진을 바꾸는 중에도 보이도록 위에 덮는다 */}
        {busy && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/70">
            <Spinner />
            <span className="text-xs text-gray-500">올리는 중...</span>
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-1.5 text-xs text-gray-400 hover:text-gray-600"
        >
          사진 삭제
        </button>
      )}
    </div>
  );
}

/* ───────── 담을 사진 추리기 ───────── */
// 폰 사진첩은 웹에서 "몇 장까지"를 정할 수 없어 얼마든지 고를 수 있다.
// 넘게 골랐을 때 처음부터 다시 고르게 하는 대신, 방금 고른 것들 중에서
// 담을 사진만 추리는 화면. 앞에서부터 담을 수 있는 만큼 미리 골라 둔다.
function TrimPicker({
  files,
  room,
  onCancel,
  onConfirm,
}: {
  files: File[];
  room: number;
  onCancel: () => void;
  onConfirm: (picked: File[]) => void;
}) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  // 미리보기 주소는 이 화면을 닫을 때 돌려준다 (안 그러면 메모리에 남는다).
  // effect 정리에서 돌려주면 안 된다 — 개발 모드처럼 effect 가 두 번 도는
  // 환경에서는 첫 정리 때 이미 돌려준 주소를 다시 쓰게 돼 사진이 통째로 깨진다.
  const close = (done: () => void) => {
    urls.forEach((u) => URL.revokeObjectURL(u));
    done();
  };

  const [chosen, setChosen] = useState<Set<number>>(
    () => new Set(files.map((_, i) => i).slice(0, room))
  );
  const full = chosen.size >= room;

  const toggle = (i: number) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else if (next.size < room) next.add(i);
      return next;
    });

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/60 p-3">
      <div className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col rounded-2xl bg-white p-4 shadow-2xl">
        <h2 className="text-center text-base font-bold text-gray-800">
          담을 사진을 골라 주세요
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500">
          {files.length}장을 고르셨어요. 갤러리에는 {room}장까지 담을 수 있어요.
        </p>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {urls.map((src, i) => {
              const on = chosen.has(i);
              // 더 담을 수 없을 때는 안 고른 사진을 흐리게 해 눌러도 안 되는 걸 보인다
              const locked = !on && full;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => toggle(i)}
                  aria-pressed={on}
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                    on ? "border-gold-400" : "border-transparent"
                  } ${locked ? "opacity-35" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <span
                    className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      on
                        ? "bg-gold-400 text-white"
                        : "border border-white/80 bg-black/20"
                    }`}
                  >
                    {on ? [...chosen].sort((a, b) => a - b).indexOf(i) + 1 : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => close(onCancel)}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() =>
              close(() =>
                onConfirm([...chosen].sort((a, b) => a - b).map((i) => files[i]))
              )
            }
            disabled={chosen.size === 0}
            className="flex-1 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {chosen.size}장 담기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── 제작 중 화면 ───────── */
// 저장은 사진 수에 따라 몇 초씩 걸려서, 그동안 멈춘 것처럼 보이지 않게
// 편지가 오가는 그림을 띄운다. (모양은 globals.css 의 ed-* 애니메이션)
function SendingOverlay({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-white/95 backdrop-blur-sm"
    >
      <div className="relative">
        {/* 봉투 위로 피어오르는 하트 */}
        <div className="pointer-events-none absolute inset-x-0 -top-2 flex justify-center">
          {[
            { dx: "-16px", delay: "0s" },
            { dx: "4px", delay: "0.8s" },
            { dx: "18px", delay: "1.6s" },
          ].map((h) => (
            <span
              key={h.delay}
              className="ed-heart absolute text-sm text-gold-300"
              style={
                { "--ed-dx": h.dx, "--ed-delay": h.delay } as React.CSSProperties
              }
              aria-hidden
            >
              ♥
            </span>
          ))}
        </div>
        <svg width="132" height="112" viewBox="0 0 64 54" aria-hidden>
          <g className="ed-envelope">
            {/* 봉투 뒷면 */}
            <rect
              x="5"
              y="16"
              width="54"
              height="33"
              rx="4"
              fill="#faf4e4"
              stroke="#d9bf70"
              strokeWidth="1.4"
            />
            {/* 봉투 안에서 오르내리는 편지지 */}
            <g className="ed-letter">
              <rect
                x="13"
                y="15"
                width="38"
                height="28"
                rx="2.5"
                fill="#fff"
                stroke="#e8d5a2"
                strokeWidth="1.2"
              />
              <path
                d="M19 23h26M19 28h26M19 33h17"
                stroke="#d9bf70"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>
            {/* 봉투 앞면 — 편지지가 이 뒤로 들어간다 */}
            <path
              d="M5 24 32 42 59 24 V45a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z"
              fill="#f3e8c8"
              stroke="#c6a23f"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-700">
        {label}
        <span className="ml-0.5 inline-block w-5 text-left text-gold-400">
          ···
        </span>
      </p>
      <p className="-mt-4 text-xs text-gray-400">
        곧 링크가 만들어져요. 창을 닫지 말아 주세요.
      </p>
    </div>
  );
}

/* ───────── 갤러리 사진 순서 바꾸기 ───────── */
// HTML5 draggable 은 터치에서 아예 동작하지 않아, 폰에서도 되도록 포인터
// 이벤트로 직접 만든다. 사진을 잠깐 누르고 있으면 집히고(그 전에 움직이면
// 페이지 스크롤로 본다), 옮길 자리 위에 올려 놓으면 그 칸이 표시된다.
const HOLD_MS = 200; // 이만큼 누르고 있어야 집힌다
const HOLD_TOL = 8; // 집히기 전에 이만큼(px) 움직이면 스크롤로 본다
const EDGE = 72; // 화면 위아래 이만큼 안으로 들어오면 자동으로 스크롤
const EDGE_SPEED = 12;

type SlotRect = { left: number; top: number; right: number; bottom: number };
type DragState = {
  from: number;
  to: number;
  // 집을 때 재어 둔 각 칸의 자리 (문서 좌표 — 스크롤해도 어긋나지 않는다)
  slots: SlotRect[];
  // 손가락을 따라다니는 사진 (화면 좌표)
  box: { left: number; top: number; width: number; height: number };
};

function SortablePhotos({
  photos,
  onMove,
  onChangeAt,
  onRemoveAt,
  children,
}: {
  photos: string[];
  onMove: (from: number, to: number) => void;
  onChangeAt: (i: number, url: string) => void;
  onRemoveAt: (i: number) => void;
  // "사진 추가" 타일 — 같은 격자 안에 두되 순서 바꾸기 대상은 아니다
  children?: React.ReactNode;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  // rAF 루프와 이벤트 핸들러가 최신 값을 봐야 해서 ref 로도 들고 있는다
  const dragRef = useRef<DragState | null>(null);
  const holdRef = useRef<{
    i: number;
    x: number;
    y: number;
    timer: number;
    el: HTMLElement;
    pointerId: number;
  } | null>(null);
  const grabRef = useRef({ x: 0, y: 0 });
  const ptrRef = useRef({ x: 0, y: 0 });
  // 끌고 나서 손을 떼면 click 이 뒤따라 일어나 사진첩이 열린다 — 그걸 막는다
  const draggedRef = useRef(false);

  const apply = (d: DragState | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  const cancelHold = () => {
    if (holdRef.current) {
      clearTimeout(holdRef.current.timer);
      holdRef.current = null;
    }
  };

  // 옮길 자리 고르기 — 칸 밖으로 나가면 마지막으로 고른 자리를 그대로 둔다
  const pickTarget = (d: DragState) => {
    const x = ptrRef.current.x + window.scrollX;
    const y = ptrRef.current.y + window.scrollY;
    const hit = d.slots.findIndex(
      (s) => x >= s.left && x <= s.right && y >= s.top && y <= s.bottom
    );
    return hit === -1 ? d.to : hit;
  };

  // 드래그 중에는 페이지가 따라 스크롤되지 않게 막고, 화면 가장자리에서는
  // 반대로 자동으로 스크롤해 준다 (사진이 많으면 한 화면에 다 안 들어온다)
  const dragging = !!drag;
  useEffect(() => {
    if (!dragging) return;
    const block = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", block, { passive: false });
    let raf = 0;
    const tick = () => {
      const d = dragRef.current;
      if (d) {
        const y = ptrRef.current.y;
        const dy =
          y < EDGE ? -EDGE_SPEED : y > window.innerHeight - EDGE ? EDGE_SPEED : 0;
        if (dy) {
          window.scrollBy(0, dy);
          const to = pickTarget(d);
          if (to !== d.to) apply({ ...d, to });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener("touchmove", block);
      cancelAnimationFrame(raf);
    };
    // pickTarget 은 ref 만 읽으므로 매 렌더 새로 만들어져도 상관없다
  }, [dragging]);

  const begin = (i: number, el: HTMLElement, pointerId: number) => {
    const grid = gridRef.current;
    if (!grid) return;
    // 집힌 뒤에야 포인터를 붙잡는다. 누르자마자 붙잡으면 뒤따르는 click 도 이
    // 칸으로 끌려와, 그냥 한 번 누른 것뿐인데 사진첩이 열리지 않는다.
    try {
      el.setPointerCapture(pointerId);
    } catch {
      // 이미 손을 뗐으면 무시
    }
    const nodes = [...grid.querySelectorAll<HTMLElement>("[data-slot]")];
    const slots = nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return {
        left: r.left + window.scrollX,
        top: r.top + window.scrollY,
        right: r.right + window.scrollX,
        bottom: r.bottom + window.scrollY,
      };
    });
    // 따라다니는 사진은 사진 부분(라벨)만 — 아래 "사진 삭제" 글씨는 뺀다
    const img = nodes[i]?.querySelector("label") ?? nodes[i];
    const r = img.getBoundingClientRect();
    grabRef.current = { x: ptrRef.current.x - r.left, y: ptrRef.current.y - r.top };
    draggedRef.current = true;
    apply({
      from: i,
      to: i,
      slots,
      box: { left: r.left, top: r.top, width: r.width, height: r.height },
    });
  };

  const onPointerDown = (i: number) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggedRef.current = false;
    ptrRef.current = { x: e.clientX, y: e.clientY };
    const el = e.currentTarget as HTMLElement;
    const pointerId = e.pointerId;
    cancelHold();
    holdRef.current = {
      i,
      x: e.clientX,
      y: e.clientY,
      el,
      pointerId,
      timer: window.setTimeout(() => {
        holdRef.current = null;
        begin(i, el, pointerId);
      }, HOLD_MS),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    ptrRef.current = { x: e.clientX, y: e.clientY };
    const hold = holdRef.current;
    if (hold) {
      // 아직 집히기 전 — 많이 움직였으면 스크롤하려던 것으로 보고 놓아 준다
      if (Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > HOLD_TOL) cancelHold();
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    apply({
      ...d,
      to: pickTarget(d),
      box: {
        ...d.box,
        left: e.clientX - grabRef.current.x,
        top: e.clientY - grabRef.current.y,
      },
    });
  };

  const onPointerUp = () => {
    cancelHold();
    const d = dragRef.current;
    apply(null);
    if (d && d.to !== d.from) onMove(d.from, d.to);
  };

  return (
    <>
      <div
        ref={gridRef}
        // select-none: 마우스로 끌 때 글자가 blue 로 잡히지 않게 한다
        className="grid select-none grid-cols-3 gap-2"
        // 끌고 난 직후의 click 은 삼킨다 (사진첩이 열리면 안 된다)
        onClickCapture={(e) => {
          if (!draggedRef.current) return;
          draggedRef.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {photos.map((g, i) => (
          <div
            key={i}
            data-slot=""
            // 집혀 있는 동안에는 이 칸의 터치가 스크롤로 넘어가지 않게 한다
            style={{ touchAction: drag ? "none" : undefined }}
            className={`relative rounded-xl transition ${
              drag?.from === i ? "opacity-30" : ""
            } ${
              drag && drag.to === i && drag.from !== i
                ? "ring-2 ring-gold-400 ring-offset-2"
                : ""
            }`}
            onPointerDown={onPointerDown(i)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <ImageUpload
              value={g}
              onChange={(url) => (url ? onChangeAt(i, url) : onRemoveAt(i))}
              label="사진 추가"
              className="h-24"
            />
          </div>
        ))}
        {children}
      </div>
      {/* 손가락을 따라다니는 사진 */}
      {drag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photos[drag.from]}
          alt=""
          // 살짝 비쳐 보이게 두어야 밑에 있는 "여기로 갑니다" 표시가 가려지지 않는다
          className="pointer-events-none fixed z-50 rounded-xl object-cover opacity-90 shadow-2xl"
          style={{
            left: drag.box.left,
            top: drag.box.top,
            width: drag.box.width,
            height: drag.box.height,
            transform: "scale(1.06)",
          }}
        />
      )}
    </>
  );
}

/* ───────── 은행 선택 ───────── */
// 많이 쓰는 은행만 추린 목록 — 여기 없으면 직접 입력으로 넣는다
const BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "새마을금고",
  "우체국",
  "신협",
  "수협",
  "SC제일은행",
  "부산은행",
  "대구은행",
  "경남은행",
  "광주은행",
  "전북은행",
  "제주은행",
];
const BANK_CUSTOM = "__custom__";

function BankPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // "직접 입력"을 고르면 아직 아무것도 안 적었어도 입력칸이 떠 있어야 한다
  const [manual, setManual] = useState(false);
  const known = BANKS.includes(value);
  const showInput = manual || (!!value && !known);

  return (
    <div className="space-y-2">
      <select
        value={showInput ? BANK_CUSTOM : known ? value : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === BANK_CUSTOM) {
            setManual(true);
            onChange("");
          } else {
            setManual(false);
            onChange(v);
          }
        }}
        className={SELECT_CLASS}
      >
        <option value="" disabled>
          은행 선택
        </option>
        {BANKS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
        <option value={BANK_CUSTOM}>직접 입력</option>
      </select>
      {showInput && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="은행 이름을 입력해 주세요"
          className={INPUT_CLASS}
        />
      )}
    </div>
  );
}

/* ───────── 시간 선택 ───────── */
// 저장은 지금까지와 같은 문자열 그대로 ("오후 1시", "오후 1시 30분")
const MERIDIEMS = ["오전", "오후"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 10, 20, 30, 40, 50];

function parseTime(v: string) {
  const m = v.match(/(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  if (!m) return { meridiem: "오후", hour: 1, minute: 0 };
  return { meridiem: m[1], hour: Number(m[2]), minute: Number(m[3] ?? 0) };
}

const formatTime = (meridiem: string, hour: number, minute: number) =>
  minute === 0 ? `${meridiem} ${hour}시` : `${meridiem} ${hour}시 ${minute}분`;

function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const cur = parseTime(value);
  // 예전에 직접 적어 둔 값이 목록에 없을 수 있으니 그 분도 함께 보여 준다
  const minutes = MINUTES.includes(cur.minute)
    ? MINUTES
    : [...MINUTES, cur.minute].sort((a, b) => a - b);

  const cls = `${SELECT_CLASS} min-w-0`;
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-gray-500">시간</span>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={cur.meridiem}
          onChange={(e) => onChange(formatTime(e.target.value, cur.hour, cur.minute))}
          className={cls}
        >
          {MERIDIEMS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={cur.hour}
          onChange={(e) =>
            onChange(formatTime(cur.meridiem, Number(e.target.value), cur.minute))
          }
          className={cls}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}시
            </option>
          ))}
        </select>
        <select
          value={cur.minute}
          onChange={(e) =>
            onChange(formatTime(cur.meridiem, cur.hour, Number(e.target.value)))
          }
          className={cls}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}분
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ───────── 연락처 (칸 - 칸 - 칸) ───────── */
// 저장은 지금까지와 같은 "010-0000-0000" 문자열이라 기존 초대장도 그대로 열린다
function splitPhone(v: string): [string, string, string] {
  const raw = (v ?? "").trim();
  if (raw.includes("-")) {
    const p = raw.split("-");
    return [p[0] ?? "", p[1] ?? "", p[2] ?? ""].map((s) =>
      s.replace(/\D/g, "")
    ) as [string, string, string];
  }
  // 하이픈 없이 저장된 값도 자연스럽게 나눠 준다
  const d = raw.replace(/\D/g, "");
  if (d.length <= 3) return [d, "", ""];
  if (d.length <= 7) return [d.slice(0, 3), d.slice(3), ""];
  return [d.slice(0, 3), d.slice(3, d.length - 4), d.slice(-4)];
}

function joinPhone(parts: string[]) {
  const t = [...parts];
  while (t.length && t[t.length - 1] === "") t.pop(); // "010--" 같은 꼴 방지
  return t.join("-");
}

function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const parts = splitPhone(value);
  const max = [3, 4, 4];
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const setPart = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, max[i]);
    const next = [...parts];
    next[i] = digits;
    onChange(joinPhone(next));
    // 칸이 다 차면 다음 칸으로 옮겨 준다
    if (digits.length === max[i] && i < 2) boxes.current[i + 1]?.focus();
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-gray-500">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {parts.map((p, i) => (
          <div key={i} className="flex min-w-0 flex-1 items-center gap-1.5">
            <input
              ref={(el) => {
                boxes.current[i] = el;
              }}
              value={p}
              onChange={(e) => setPart(i, e.target.value)}
              inputMode="numeric"
              maxLength={max[i]}
              placeholder={i === 0 ? "010" : "0000"}
              className={`${INPUT_CLASS} min-w-0 px-2 text-center`}
            />
            {i < 2 && <span className="text-gray-300">-</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── 작은 입력 컴포넌트 ───────── */
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  // 날짜 칸에서 고를 수 있는 가장 이른 날 ("2026-08-08")
  min?: string;
}) {
  return (
    // min-w-0 이 없으면 날짜 입력처럼 고유 폭이 큰 칸이 grid 칸을 밀어내
    // 옆 칸과 겹친다 (grid 항목의 기본값이 min-width:auto 라서)
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-gray-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      />
    </label>
  );
}

// 줄바꿈이 필요한 짧은 안내문용 (오시는 길 등)
function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-gray-500">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_CLASS} leading-7`}
      />
    </label>
  );
}

// 앞 글자에 받침이 있으면 "을", 없으면 "를"
// ("예식일을 입력하면" / "돌잔치 날짜를 입력하면")
const josaEulReul = (word: string) => {
  const code = word.trim().charCodeAt(word.trim().length - 1) - 0xac00;
  // 한글이 아니면(영문·숫자) 안전하게 "을"
  if (code < 0 || code > 11171) return "을";
  return code % 28 === 0 ? "를" : "을";
};

// 만료일 표시용 (예: 2026년 9월 26일)
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

// 공통 입력 스타일
const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm text-gray-800 transition placeholder:text-gray-300 focus:border-gold-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-100";

// 선택 상자 — 기본 화살표 대신 오른쪽에서 조금 안쪽에 직접 그린다 (globals.css)
const SELECT_CLASS = `${INPUT_CLASS} inv-select`;

function Group({
  title,
  step,
  previewSection,
  children,
}: {
  // "(선택)" 처럼 스타일이 다른 조각을 붙일 수 있게 문자열이 아닌 노드로 받는다
  title: React.ReactNode;
  step?: number;
  // 이 칸을 채우고 있을 때 미리보기가 보여 줄 초대장 섹션
  // (InvitationView 의 data-inv-section 과 같은 값, "top"이면 맨 위)
  previewSection?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-form-section={previewSection}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
    >
      <div className="mb-4 flex items-center gap-2.5">
        {step !== undefined && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-50 text-[11px] font-semibold text-gold-400">
            {step}
          </span>
        )}
        <h3 className="text-sm font-semibold tracking-tight text-gray-800">
          {title}
        </h3>
      </div>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

/* ───────── 폼 ↔ 미리보기 스크롤 맞추기 ───────── */
// 모바일 미니 미리보기 — 390px 폭으로 그린 뒤 상자 크기로 줄여 보여 준다
const MINI_W = 126;
const MINI_H = 182;
const MINI_CONTENT_W = 390;
const MINI_SCALE = MINI_W / MINI_CONTENT_W;

/**
 * 폼에서 지금 보고 있는 단계에 맞춰 미리보기도 그 대목으로 옮긴다.
 * (신랑·신부 칸을 보고 있으면 미리보기도 두 사람이 나오는 자리로)
 *
 * 단계가 "바뀔 때만" 움직인다. 스크롤할 때마다 따라 움직이면 미리보기를
 * 직접 넘겨 보려는 사람과 서로 밀어내게 된다.
 *
 * 반환값은 미니 미리보기를 끌어올릴 거리(초대장 기준 px). 미니 쪽은
 * 스크롤 상자가 아니라 축소해 놓은 그림이라 transform 으로 옮겨야 한다.
 */
function usePreviewSync(
  desk: React.RefObject<HTMLDivElement | null>,
  mini: React.RefObject<HTMLDivElement | null>
) {
  const [miniShift, setMiniShift] = useState(0);

  useEffect(() => {
    // 초대장 맨 위에서 그 섹션까지의 거리. 지금 어디까지 내려와 있든 같은 값이
    // 나와야 해서(=절대 위치) 스크롤 상자면 scrollTop 을 더해 준다.
    const offsetIn = (box: HTMLElement, key: string, scale = 1) => {
      if (key === "top") return 0;
      const el = box.querySelector<HTMLElement>(`[data-inv-section="${key}"]`);
      if (!el) return null;
      return (
        (el.getBoundingClientRect().top - box.getBoundingClientRect().top) / scale +
        box.scrollTop
      );
    };

    const move = (key: string) => {
      const box = desk.current;
      if (box) {
        const top = offsetIn(box, key);
        if (top !== null) {
          box.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
        }
      }
      const small = mini.current;
      if (small) {
        const top = offsetIn(small, key, MINI_SCALE);
        if (top !== null) {
          // 아래쪽 섹션이라도 빈 여백만 보이지 않게 끝을 넘지 않는다
          const max = Math.max(0, small.offsetHeight - MINI_H / MINI_SCALE);
          setMiniShift(Math.min(Math.max(0, top - 6), max));
        }
      }
    };

    let current = "";
    let raf = 0;
    const sync = () => {
      raf = 0;
      // 단계 제목이 화면 한가운데까지 올라오면 그 대목으로 옮긴다.
      // (더 아래에 두면 굼떠 보이고, 더 위에 두면 한참 스크롤해야 따라온다)
      const h = window.innerHeight;
      const line = h * 0.5;

      const groups = [
        ...document.querySelectorAll<HTMLElement>("[data-form-section]"),
      ].filter((g) => !g.parentElement?.closest("[data-form-section]"));
      if (!groups.length) return;

      // 페이지 끝까지 내려왔다면 마지막 단계다. 더 스크롤할 수 없어 마지막
      // 단계는 한가운데까지 올라오지 못한다 (생일은 갤러리가 마지막이다).
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;

      let winner: HTMLElement | null = atBottom
        ? groups[groups.length - 1]
        : null;
      if (!winner) {
        groups.forEach((g) => {
          if (g.getBoundingClientRect().top <= line) winner = g;
        });
      }
      if (!winner) return;

      let active = (winner as HTMLElement).dataset.formSection ?? "";
      // 단계 안의 작은 묶음(일시·장소 안의 장소 칸)은 더 위까지 올라와야
      // 인정한다. 같은 선을 쓰면 아직 날짜를 채우는 중인데 바로 아래 장소
      // 칸이 먼저 선을 넘어 미리보기가 성급히 지도로 넘어간다.
      (winner as HTMLElement)
        .querySelectorAll<HTMLElement>("[data-form-section]")
        .forEach((n) => {
          if (n.getBoundingClientRect().top <= h * 0.25) {
            active = n.dataset.formSection ?? "";
          }
        });
      if (!active || active === current) return;
      current = active;
      move(active);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // 첫 위치도 맞춰 둔다 (effect 안에서 바로 setState 하지 않도록 한 박자 뒤)
    raf = requestAnimationFrame(sync);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [desk, mini]);

  return miniShift;
}

function FontPicker({
  value,
  onChange,
  // 메인 타이틀처럼 일부 서체만 보여줘야 하는 곳에서 목록을 좁혀 쓴다
  options = FONTS,
}: {
  value: string;
  onChange: (id: string) => void;
  options?: FontOption[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((f) => {
        const selected = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={`rounded-lg border-2 px-2 py-2.5 text-center text-base text-gray-800 transition ${
              selected
                ? "border-gold-400 bg-gold-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            style={{ fontFamily: f.family || undefined }}
          >
            {f.name}
          </button>
        );
      })}
    </div>
  );
}

export default function EditorClient({
  editSlug,
  initialTemplate,
  initialData,
  today,
}: {
  // 수정 모드: 기존 청첩장 slug + 저장된 내용
  editSlug?: string;
  initialTemplate?: TemplateId;
  initialData?: InvitationData;
  // 날짜 칸에서 고를 수 있는 가장 이른 날 (한국 기준 오늘).
  // 서버에서 정해 내려보낸다 — 여기서 계산하면 서버(UTC)와 화면(한국)이 어긋난다.
  today?: string;
} = {}) {
  const params = useSearchParams();
  const isEdit = Boolean(editSlug);
  // 신규 제작 시 초대장 종류 결정 (수정 모드는 기존 데이터의 category를 따름).
  // 템플릿을 지정해 들어왔다면 그 템플릿이 속한 종류를 우선한다.
  const categoryParam = params.get("category") as Category | null;
  const category: Category =
    initialData?.category ??
    findTheme(params.get("template"))?.category ??
    (categoryParam && CATEGORY_IDS.includes(categoryParam) ? categoryParam : "wedding");
  // 이 카테고리 전용 템플릿만 선택 가능
  const catTemplates = getTemplatesByCategory(category);

  const [template, setTemplate] = useState<TemplateId>(() => {
    // 수정 모드는 저장된 템플릿 그대로, 신규는 URL 값이 이 카테고리 것일 때만 사용
    if (initialTemplate) return initialTemplate;
    const fromUrl = params.get("template") as TemplateId | null;
    return fromUrl && catTemplates.some((t) => t.id === fromUrl)
      ? fromUrl
      : catTemplates[0].id;
  });
  const [data, setData] = useState<InvitationData>(() =>
    initialData ? normalizeData(initialData) : emptyInvitation(category, today)
  );
  // 칠순 카테고리는 선택한 연세(70/80/90/100)에 따라 문구가 바뀜
  const labels = getCategoryLabels(category, data.seniorAge, data.dolKind);
  const sampleIntro = SAMPLE_INTRO[category];
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false); // 제작 전 확인 모달
  const [showPreview, setShowPreview] = useState(false); // 모바일 전체화면 미리보기
  // 갤러리 여러 장 업로드 진행 상황 (null이면 진행 중 아님)
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  // 담을 수 있는 것보다 많이 골랐을 때 뜨는 "사진 추리기" 화면
  const [trim, setTrim] = useState<{ files: File[]; room: number } | null>(null);
  const [resultExpires, setResultExpires] = useState<string | null>(null); // 발급된 만료일
  const [photoWarn, setPhotoWarn] = useState(false); // 대표 사진 미등록 경고
  const photoSectionRef = useRef<HTMLDivElement>(null);

  // 폼을 내리면 미리보기도 같은 대목으로 따라온다
  const deskPreviewRef = useRef<HTMLDivElement>(null);
  const miniPreviewRef = useRef<HTMLDivElement>(null);
  const miniShift = usePreviewSync(deskPreviewRef, miniPreviewRef);

  // 예시 사진 그대로거나 비어있으면 본인 대표 사진 등록 필요
  const needMainPhoto = !data.mainPhotoUrl || isSamplePhoto(data.mainPhotoUrl);

  // 게시 종료일 — 고르는 게 아니라 행사 다음 날로 자동 결정
  const expiryDate = expiryDateLabel(data.weddingDate);

  function openConfirm() {
    if (needMainPhoto) {
      setPhotoWarn(true);
      photoSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setError(null);
    setConfirming(true);
  }

  const set = <K extends keyof InvitationData>(
    key: K,
    value: InvitationData[K]
  ) => setData((d) => ({ ...d, [key]: value }));

  // 연세를 바꾸면 기본 인사말 제목도 따라감 (직접 고쳐 쓴 제목은 그대로 둠)
  const setSeniorAge = (age: number) =>
    setData((d) => ({
      ...d,
      seniorAge: age,
      greetingTitle:
        d.greetingTitle === seniorGreetingTitle(d.seniorAge)
          ? seniorGreetingTitle(age)
          : d.greetingTitle,
    }));

  // 백일/돌을 바꾸면 기본 인사말 제목도 따라감 (직접 고쳐 쓴 제목은 그대로 둠)
  const setDolKind = (kind: DolKind) =>
    setData((d) => ({
      ...d,
      dolKind: kind,
      greetingTitle:
        d.greetingTitle === dolGreetingTitle(d.dolKind)
          ? dolGreetingTitle(kind)
          : d.greetingTitle,
      greetingMessage:
        d.greetingMessage === dolGreetingMessage(d.dolKind)
          ? dolGreetingMessage(kind)
          : d.greetingMessage,
    }));

  const setAccount = (i: number, patch: Partial<Account>) =>
    setData((d) => ({
      ...d,
      accounts: d.accounts.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }));

  const addAccount = () =>
    setData((d) => ({
      ...d,
      accounts: [
        ...d.accounts,
        { side: "신랑측", name: "", bank: "", number: "" },
      ],
    }));

  const removeAccount = (i: number) =>
    setData((d) => ({
      ...d,
      accounts: d.accounts.filter((_, idx) => idx !== i),
    }));

  // 갤러리는 담긴 사진만 추려서 다룬다 — 빈 슬롯이 섞여 있으면 화면에 보이는
  // 순서와 배열 인덱스가 어긋나 순서 바꾸기가 엉뚱한 사진을 옮긴다.
  const photos = data.gallery.filter(Boolean);
  const setPhotos = (next: (list: string[]) => string[]) =>
    setData((d) => ({ ...d, gallery: next(d.gallery.filter(Boolean)) }));
  const setGallery = (i: number, url: string) =>
    setPhotos((list) => list.map((g, idx) => (idx === i ? url : g)));
  const removeGallery = (i: number) =>
    setPhotos((list) => list.filter((_, idx) => idx !== i));
  const moveGallery = (from: number, to: number) =>
    setPhotos((list) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // 갤러리 여러 장 한 번에 담기 — 폰 사진첩에서 여러 장을 골라 올릴 수 있게.
  // 한 장씩 순서대로 올려 진행 상황을 보여 준다.
  async function addGalleryFiles(list: FileList | null) {
    const files = list ? [...list] : [];
    if (files.length === 0) return;

    // 빈 슬롯은 자리를 차지하지 않는다 — 실제 담긴 사진만 센다
    const room = MAX_GALLERY - data.gallery.filter(Boolean).length;
    if (room <= 0) {
      alert(`갤러리는 최대 ${MAX_GALLERY}장까지 담을 수 있어요.`);
      return;
    }
    // 폰 사진첩에서 고를 수 있는 장수는 웹에서 제한할 방법이 없다.
    // 넘게 골랐으면 처음부터 다시 고르게 하는 대신, 방금 고른 사진들 중에서
    // 담을 것만 추리는 화면을 띄운다.
    if (files.length > room) {
      setTrim({ files, room });
      return;
    }
    await uploadIntoGallery(files);
  }

  async function uploadIntoGallery(files: File[]) {
    setBulk({ done: 0, total: files.length });
    try {
      const urls: string[] = [];
      for (const f of files) {
        urls.push(await uploadPhoto(f));
        setBulk({ done: urls.length, total: files.length });
      }
      setData((d) => ({
        ...d,
        gallery: [...d.gallery.filter(Boolean), ...urls].slice(0, MAX_GALLERY),
      }));
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "이미지를 처리하지 못했습니다. 다른 파일을 시도해 주세요."
      );
    } finally {
      setBulk(null);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      // 수정 모드는 PATCH, 신규는 POST (게시 종료일은 서버가 행사일로 계산)
      const res = await fetch(
        isEdit ? `/api/invitations/${editSlug}` : "/api/invitations",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? { template, data }
              : { template, data }
          ),
        }
      );
      const json = await res.json();
      if (res.status === 401) {
        // 로그인 필요 → 로그인 후 에디터로 복귀
        const next = isEdit ? `/editor?edit=${editSlug}` : "/editor";
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }
      if (json.code === "LIMIT_REACHED") {
        // 계정당 1개 제한 → 마이페이지에서 안내
        window.location.href = "/my?notice=limit";
        return;
      }
      if (!res.ok) throw new Error(json.error || "저장에 실패했습니다.");
      const url = `${window.location.origin}/v/${json.slug}`;
      setConfirming(false);
      setResultExpires(json.expiresAt ?? null);
      setResult(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-cream text-gray-800">
      {/* 상단 네비 — 화이트 + 골드 헤어라인 */}
      <header className="sticky top-0 z-40 border-b border-gold-200/50 bg-white/85 shadow-[0_1px_14px_rgba(198,162,63,0.10)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 transition hover:text-gold-500"
          >
            <span aria-hidden>←</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              className="h-6 w-6 rounded-full shadow-sm"
            />
            <span
              className="text-ink"
              style={{ fontFamily: "var(--font-song)" }}
            >
              별빛 초대장
            </span>
          </Link>
          <AuthStatus />
        </div>
      </header>

    <div className="mx-auto grid max-w-6xl gap-8 p-4 md:grid-cols-2 md:p-8">
      {/* 폼 */}
      <div className="space-y-4">
        <div className="mb-1">
          <p className="font-cormorant text-sm tracking-[0.4em] text-gold-400">
            {isEdit ? "EDIT YOUR INVITATION" : "CREATE YOUR INVITATION"}
          </p>
          <h1
            className="mt-2 text-[2rem] leading-tight tracking-tight text-gray-900"
            style={{ fontFamily: "var(--font-song)" }}
          >
            {isEdit ? `${labels.editorTitle.replace("만들기", "수정하기")}` : labels.editorTitle}
          </h1>
          <p
            className="mt-2 text-sm text-gray-400"
            style={{ fontFamily: "var(--font-gowun)" }}
          >
            {isEdit
              ? `수정 내용은 저장 즉시 ${labels.noun}에 반영돼요.`
              : "입력한 내용이 미리보기에 실시간으로 반영돼요."}
          </p>
        </div>

        <Group title="메인" step={1} previewSection="top">
          <div className="grid grid-cols-2 gap-3">
            {catTemplates.map((t) => {
              const selected = template === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className="rounded-xl border-2 px-3 py-3 text-left text-sm transition"
                  style={{
                    borderColor: selected ? t.accent : "#e5e7eb",
                    background: selected ? t.accentSoft : "#fff",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full"
                      style={{ background: t.swatch }}
                    />
                    <span className="font-semibold text-gray-800">
                      {t.name}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {t.description}
                  </span>
                </button>
              );
            })}
          </div>
          {/* 인트로 — 청첩장을 열자마자 잠깐 지나가는 첫 화면.
              템플릿과 함께 첫인상을 정하는 항목이라 바로 아래에 둔다. */}
          <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                인트로
              </span>
              <div className="grid grid-cols-2 gap-2">
                {getIntros(category).map((v) => {
                  const selected = data.intro === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => set("intro", v.id)}
                      aria-pressed={selected}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-gold-400 bg-gold-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-sm font-medium text-gray-800">
                        {v.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        {v.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* 문구는 인트로를 켰을 때만 — 안 쓰는 사람에게는 빈 칸이 짐이 된다 */}
              {data.intro !== "none" && (
                <div className="mt-3">
                  <TextareaField
                    label="인트로 문구"
                    value={data.introText}
                    onChange={(v) => set("introText", v)}
                    placeholder={introPlaceholder(category)}
                  />
                </div>
              )}
            </div>
          {/* 생일은 상단 사진 위에 이름 대신 직접 쓴 문구를 올린다 */}
          {category === "birthday" && (
            <div>
              <Field
                label="메인 타이틀"
                value={data.heroTitle}
                onChange={(v) => set("heroTitle", v)}
                placeholder="예) 은진이의 서른 번째 생일"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                상단 사진 위에 크게 보여요. 비워두면 아무것도 표시되지 않아요.
              </p>
              <div className="mt-3">
                <span className="mb-2 block text-xs font-medium text-gray-500">
                  메인 타이틀 글꼴
                </span>
                <FontPicker
                  value={data.titleFont}
                  onChange={(id) => set("titleFont", id)}
                  options={TITLE_FONTS}
                />
              </div>
            </div>
          )}
          {/* 섹션 사이 구분선 — 모양을 미리 보여 주고 고르게 한다 */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              구분선 디자인
            </span>
            {/* 자리를 적게 차지하도록 한 줄에 모두 둔다 */}
            <div className="grid grid-cols-5 gap-1.5">
              {DIVIDERS.map((v) => {
                const selected = data.dividerStyle === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => set("dividerStyle", v.id)}
                    className={`min-w-0 rounded-lg border-2 px-1 py-2 text-center transition ${
                      selected
                        ? "border-gold-400 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="block whitespace-nowrap text-[11px] font-medium text-gray-800">
                      {v.label}
                    </span>
                    {/* 고르기 전에 모양을 알 수 있게 실제 모습을 작게 보여 준다.
                        종류마다 실제 초대장과 같은 모습이어야 한다. */}
                    <span className="mt-1 flex h-3 items-center justify-center gap-1 text-gold-400">
                      {v.id === "diamond" && (
                        <>
                          <span className="h-px w-2.5 bg-gray-300" />
                          <span className="h-[3px] w-[3px] shrink-0 rotate-45 bg-gold-400" />
                          <span className="h-px w-2.5 bg-gray-300" />
                        </>
                      )}
                      {v.id === "line" && (
                        <span className="h-px w-full bg-gray-300" />
                      )}
                      {v.id === "dots" && (
                        <span className="text-[5px] tracking-[0.4em]">●●●</span>
                      )}
                      {v.id === "flower" && (
                        <span className="text-[12px] leading-none">❀</span>
                      )}
                      {/* "없음"은 예시도 두지 않는다 */}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div ref={photoSectionRef}>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              대표 사진 <span className="text-gold-400">*필수</span>
            </span>
            <div
              className={
                photoWarn && needMainPhoto
                  ? "rounded-xl ring-2 ring-red-400 ring-offset-2"
                  : undefined
              }
            >
              <ImageUpload
                value={needMainPhoto ? "" : data.mainPhotoUrl}
                onChange={(url) => {
                  set("mainPhotoUrl", url);
                  if (url) setPhotoWarn(false);
                }}
                label="클릭해서 대표 사진 업로드 (필수)"
                className="h-52"
              />
            </div>
            {photoWarn && needMainPhoto && (
              <p className="mt-1.5 text-xs font-medium text-red-500">
                미리보기에 보이는 사진은 예시예요.{" "}
                {labels.showPerson2 ? "두 분의" : "직접 찍은"} 사진을 올려
                주세요.
              </p>
            )}
          </div>
          {/* 대표 사진 모션 — 템플릿과 함께 고르는 첫인상 연출 */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              대표 사진 모션
            </span>
            <div className="grid grid-cols-2 gap-2">
              {HERO_MOTIONS.map((m) => {
                const selected = data.heroMotion === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => set("heroMotion", m.id)}
                    className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                      selected
                        ? "border-gold-400 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-800">
                      {m.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Group>

        <Group title="글꼴" step={2} previewSection="top">
          <div>
            <span className="mb-2 block text-xs font-medium text-gray-500">
              메인 글꼴 · 제목/이름
            </span>
            <FontPicker
              value={data.fontHeading}
              onChange={(id) => set("fontHeading", id)}
            />
          </div>
          <div>
            <span className="mb-2 block text-xs font-medium text-gray-500">
              서브 글꼴 · 본문
            </span>
            <FontPicker
              value={data.fontBody}
              onChange={(id) => set("fontBody", id)}
            />
          </div>
          <div>
            <span className="mb-2 block text-xs font-medium text-gray-500">
              글꼴 크기
            </span>
            <div className="grid grid-cols-4 gap-2">
              {FONT_SCALES.map((s) => {
                const selected = data.fontScale === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("fontScale", s.value)}
                    aria-pressed={selected}
                    className={`rounded-xl border-2 px-2 py-2.5 text-center transition ${
                      selected
                        ? "border-gold-400 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* 배율을 글자 크기로 그대로 보여줘 고르기 전에 감을 잡게 함 */}
                    <span
                      className="block font-medium text-gray-800"
                      style={{ fontSize: `${s.value}rem` }}
                    >
                      가
                    </span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              사진과 여백은 그대로 두고 글자 크기만 조절돼요.
            </p>
          </div>
        </Group>

        <Group title={labels.groupTitle} step={3} previewSection="couple">
          {/* 칠순 · 팔순 · 구순 · 백수 선택 — 초대장 문구가 통째로 바뀜 */}
          {category === "senior" && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                어떤 잔치인가요?
              </span>
              <div className="grid grid-cols-4 gap-2">
                {SENIOR_AGES.map((s) => {
                  const selected = data.seniorAge === s.age;
                  return (
                    <button
                      key={s.age}
                      type="button"
                      onClick={() => setSeniorAge(s.age)}
                      className={`rounded-xl border-2 px-2 py-2.5 text-center transition ${
                        selected
                          ? "border-gold-400 bg-gold-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-gray-800">
                        {s.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        {s.age}세
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* 백일잔치 · 돌잔치 선택 — 초대장 문구가 통째로 바뀜 */}
          {category === "doljanchi" && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                어떤 잔치인가요?
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DOL_KINDS.map((k) => {
                  const selected = data.dolKind === k.id;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setDolKind(k.id)}
                      aria-pressed={selected}
                      className={`rounded-xl border-2 px-2 py-2.5 text-center transition ${
                        selected
                          ? "border-gold-400 bg-gold-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-gray-800">
                        {k.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        {k.occasion}을 축하해요
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className={labels.showPerson2 ? "grid grid-cols-2 gap-3" : ""}>
            <Field
              label={labels.personLabel}
              value={data.groomName}
              onChange={(v) => set("groomName", v)}
            />
            {labels.showPerson2 && (
              <Field
                label={labels.person2Label}
                value={data.brideName}
                onChange={(v) => set("brideName", v)}
              />
            )}
          </div>
          {/* 아기 성별 — 초대장에서 이름 옆에 함께 표시 */}
          {category === "doljanchi" && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                성별 (이름 아래에 표시돼요)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BABY_GENDERS.map((g) => {
                  const selected = data.babyGender === g.id;
                  return (
                    <button
                      key={g.id || "none"}
                      type="button"
                      onClick={() => set("babyGender", g.id)}
                      aria-pressed={selected}
                      className={`rounded-xl border-2 px-2 py-2.5 text-center text-sm font-semibold transition ${
                        selected
                          ? "border-gold-400 bg-gold-50 text-gray-800"
                          : "border-gray-200 text-gray-800 hover:border-gray-300"
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className={labels.showPerson2 ? "grid grid-cols-2 gap-3" : ""}>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                {labels.photo1Label}
              </span>
              <ImageUpload
                value={data.groomPhotoUrl}
                onChange={(url) => set("groomPhotoUrl", url)}
                label={labels.photo1Label}
                className="h-28"
              />
            </div>
            {labels.showPerson2 && (
              <div>
                <span className="mb-1.5 block text-xs font-medium text-gray-500">
                  {labels.photo2Label}
                </span>
                <ImageUpload
                  value={data.bridePhotoUrl}
                  onChange={(url) => set("bridePhotoUrl", url)}
                  label={labels.photo2Label}
                  className="h-28"
                />
              </div>
            )}
          </div>
          {/* 한 줄 소개 (선택) — 이름 아래에 들어가는 짧은 문구. 두 사람 칸을
              나란히 두면 글이 눌려서 위아래로 쌓는다 */}
          {labels.showIntro && (
            <div className="space-y-3.5">
              {labels.showPerson2 && (
                <TextareaField
                  label={labels.intro1Label}
                  value={data.groomIntro}
                  onChange={(v) => set("groomIntro", v)}
                  placeholder={sampleIntro.person1}
                  rows={4}
                />
              )}
              {/* 안내문은 마지막 칸에 붙여 둔다 (space-y 간격이 끼면 멀어 보인다) */}
              <div>
                <TextareaField
                  label={labels.showPerson2 ? labels.intro2Label : labels.intro1Label}
                  value={labels.showPerson2 ? data.brideIntro : data.groomIntro}
                  onChange={(v) =>
                    set(labels.showPerson2 ? "brideIntro" : "groomIntro", v)
                  }
                  placeholder={
                    labels.showPerson2 ? sampleIntro.person2 : sampleIntro.person1
                  }
                  rows={4}
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  이름 아래에 들어가요. 비워 두면 나오지 않아요.
                </p>
              </div>
            </div>
          )}
          {/* 연락처는 칸이 세 개라 좁은 화면에서 나란히 두면 눌린다 */}
          {labels.showContact && (
            <div className="space-y-3.5">
              {labels.showPerson2 && (
                <PhoneField
                  label={labels.contact1Label}
                  value={data.groomPhone}
                  onChange={(v) => set("groomPhone", v)}
                />
              )}
              <div>
                <PhoneField
                  label={labels.showPerson2 ? labels.contact2Label : labels.contact1Label}
                  value={labels.showPerson2 ? data.bridePhone : data.groomPhone}
                  onChange={(v) =>
                    set(labels.showPerson2 ? "bridePhone" : "groomPhone", v)
                  }
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  연락처를 입력하면 이름 옆에 전화·문자 버튼이 붙어요.
                </p>
              </div>
            </div>
          )}
          {labels.showParents && (
            <div className="grid grid-cols-2 gap-3">
              {labels.showPerson2 ? (
                <>
                  <Field
                    label="신랑 아버지"
                    value={data.groomFather}
                    onChange={(v) => set("groomFather", v)}
                    placeholder="(선택)"
                  />
                  <Field
                    label="신랑 어머니"
                    value={data.groomMother}
                    onChange={(v) => set("groomMother", v)}
                    placeholder="(선택)"
                  />
                  <Field
                    label="신부 아버지"
                    value={data.brideFather}
                    onChange={(v) => set("brideFather", v)}
                    placeholder="(선택)"
                  />
                  <Field
                    label="신부 어머니"
                    value={data.brideMother}
                    onChange={(v) => set("brideMother", v)}
                    placeholder="(선택)"
                  />
                </>
              ) : (
                <>
                  <Field
                    label={labels.parent1Label}
                    value={data.groomFather}
                    onChange={(v) => set("groomFather", v)}
                    placeholder="(선택)"
                  />
                  <Field
                    label={labels.parent2Label}
                    value={data.groomMother}
                    onChange={(v) => set("groomMother", v)}
                    placeholder="(선택)"
                  />
                </>
              )}
            </div>
          )}
        </Group>

        <Group title={labels.dateSectionTitle} step={4} previewSection="date">
          {/* 좁은 화면에서 날짜 칸이 눌리지 않도록 한 줄씩 둔다 */}
          <Field
            label={labels.dateFieldLabel}
            type="date"
            min={today}
            value={data.weddingDate}
            onChange={(v) => set("weddingDate", v)}
          />
          <TimePicker
            value={data.weddingTime}
            onChange={(v) => set("weddingTime", v)}
          />
          {/* 여기서부터는 날짜가 아니라 장소 이야기라, 미리보기도 지도 쪽을 본다 */}
          <div className="space-y-3.5" data-form-section="location">
            <Field
              label={labels.venueLabel}
              value={data.venueName}
              onChange={(v) => set("venueName", v)}
            />
            <Field
              label="홀 / 층"
              value={data.venueHall}
              onChange={(v) => set("venueHall", v)}
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-500">
                주소
              </span>
              <div className="flex flex-wrap items-start gap-2">
                <input
                  value={data.venueAddress}
                  onChange={(e) => set("venueAddress", e.target.value)}
                  placeholder="주소 검색으로 채워 주세요"
                  className={`${INPUT_CLASS} min-w-0 flex-1`}
                />
                <AddressSearch
                  onSelect={(addr) => set("venueAddress", addr)}
                />
              </div>
            </div>
            {/* 오시는 길 안내 — 초대장에서는 지도 자리에 펼쳐 볼 수 있다 */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
              <span className="block text-xs font-medium text-gray-500">
                오시는 길 안내 (선택)
              </span>
              <p className="mt-1 text-[11px] text-gray-400">
                적어 두면 초대장 지도 아래에 &lsquo;오시는 길 안내&rsquo; 버튼이
                생겨요. 비워 두면 버튼도 나오지 않아요.
              </p>
              <div className="mt-3 space-y-3">
                <TextareaField
                  label="지하철"
                  value={data.directionsSubway}
                  onChange={(v) => set("directionsSubway", v)}
                  placeholder={"2호선 강남역 3번 출구\n도보 5분"}
                />
                <TextareaField
                  label="버스 · 대중교통"
                  value={data.directionsBus}
                  onChange={(v) => set("directionsBus", v)}
                  placeholder={"간선 140, 401\n강남역 정류장 하차"}
                />
                <TextareaField
                  label="주차"
                  value={data.directionsParking}
                  onChange={(v) => set("directionsParking", v)}
                  placeholder={"건물 지하 1~3층\n2시간 무료"}
                />
              </div>
            </div>
          </div>
        </Group>

        <Group title="인사말" step={5} previewSection="greeting">
          <Field
            label="제목"
            value={data.greetingTitle}
            onChange={(v) => set("greetingTitle", v)}
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              내용
            </span>
            <textarea
              value={data.greetingMessage}
              onChange={(e) => set("greetingMessage", e.target.value)}
              rows={5}
              className={`${INPUT_CLASS} leading-7`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              맺음말 · 맨 아래 문구 (선택)
            </span>
            <textarea
              value={data.footerMessage}
              onChange={(e) => set("footerMessage", e.target.value)}
              rows={2}
              placeholder={
                labels.showPerson2
                  ? "비워두면 두 분의 이름과 날짜가 표시돼요"
                  : "비워두면 이름과 날짜가 표시돼요"
              }
              className={`${INPUT_CLASS} leading-7`}
            />
          </label>
        </Group>

        <Group
          title={
            <>
              갤러리<span className="font-normal text-gray-400">(선택)</span>
            </>
          }
          step={6}
          previewSection="gallery"
        >
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-500">
              갤러리 사진{" "}
              <span className="text-gray-400">
                ({photos.length}/{MAX_GALLERY})
              </span>
            </span>
            {/* 빈 슬롯은 두지 않는다. 예전에는 빈 슬롯이 한 장짜리 업로드라,
                여러 장 담기 타일보다 먼저 눈에 띄어 한 장씩만 올리게 됐다. */}
            <SortablePhotos
              photos={photos}
              onMove={moveGallery}
              onChangeAt={setGallery}
              onRemoveAt={removeGallery}
            >
              {photos.length < MAX_GALLERY && (
                // 폰 사진첩에서 여러 장을 한 번에 고를 수 있다
                <label className="relative flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-300 transition hover:border-gold-300 hover:text-gold-400">
                  {bulk ? (
                    // 사진이 다 올라갈 때까지 돌아가는 표시
                    <>
                      <Spinner />
                      <span className="mt-1 text-[11px] font-medium text-gold-400">
                        {bulk.done}/{bulk.total}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl leading-none">+</span>
                      {/* 사진첩을 열기 전에 몇 장까지 고르면 되는지 알려 준다 */}
                      <span className="mt-1 text-[11px]">
                        {photos.length ? `${MAX_GALLERY - photos.length}장 더` : "사진 추가"}
                      </span>
                    </>
                  )}
                  {/* display:none 으로 숨기면 아이폰에서 사진첩이 열리지 않는다.
                      위 ImageUpload 와 같이 투명하게 덮어 두는 방식을 쓴다. */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={!!bulk}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                      addGalleryFiles(e.target.files);
                      e.target.value = ""; // 같은 사진을 다시 골라도 반응하도록
                    }}
                  />
                </label>
              )}
            </SortablePhotos>
          </div>
          {/* 바로 위 사진 목록에 붙여 둔다 (Group 의 space-y 간격을 되돌림) */}
          <p className="-mt-2 text-xs text-gray-400">
            갤러리는 최대 {MAX_GALLERY}장까지 추가할 수 있어요.
            {photos.length > 1 && " 사진을 꾹 눌러 끌면 순서를 바꿀 수 있어요."}
          </p>
        </Group>

        {/* 생일은 축하금을 받는 자리가 아니라 계좌 단계를 두지 않는다 */}
        {labels.showAccounts && (
        <Group title={labels.accountsGroupTitle} step={7} previewSection="accounts">
          <div className="space-y-3">
            {data.accounts.map((a, i) => (
              <div
                key={i}
                className="space-y-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5"
              >
                <div className="flex items-center gap-2">
                  {labels.showPerson2 && (
                    <select
                      value={a.side}
                      onChange={(e) =>
                        setAccount(i, { side: e.target.value as Account["side"] })
                      }
                      className="inv-select rounded-lg border border-gray-200 bg-white py-1.5 pl-2.5 text-sm text-gray-700"
                    >
                      <option value="신랑측">신랑측</option>
                      <option value="신부측">신부측</option>
                    </select>
                  )}
                  <button
                    onClick={() => removeAccount(i)}
                    className="ml-auto text-xs text-gray-400 hover:text-gold-400"
                  >
                    삭제
                  </button>
                </div>
                <BankPicker
                  value={a.bank}
                  onChange={(bank) => setAccount(i, { bank })}
                />
                <input
                  value={a.number}
                  onChange={(e) => setAccount(i, { number: e.target.value })}
                  placeholder="계좌번호"
                  className={INPUT_CLASS}
                />
                <input
                  value={a.name}
                  onChange={(e) => setAccount(i, { name: e.target.value })}
                  placeholder="예금주"
                  className={INPUT_CLASS}
                />
              </div>
            ))}
          </div>
          <button
            onClick={addAccount}
            className="mt-3 w-full rounded-xl border border-dashed border-gold-200 py-2.5 text-sm font-medium text-gold-400 transition hover:bg-gold-50"
          >
            + 계좌 추가
          </button>
        </Group>
        )}

        <button
          onClick={openConfirm}
          className="w-full rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-base font-semibold text-white shadow-lg shadow-gold-300/50 transition hover:from-gold-500 hover:to-gold-600"
        >
          {isEdit ? "수정 내용 저장하기" : `${labels.noun} 제작하기`}
        </button>
        {photoWarn && needMainPhoto ? (
          <p className="text-center text-sm font-medium text-red-500">
            대표 사진을 등록해 주세요. 지금 보이는 사진은 예시용이에요.
          </p>
        ) : (
          <p className="text-center text-xs text-gray-400">
            {isEdit
              ? "저장 전에 미리보기로 한 번 더 확인할 수 있어요."
              : "제작 전에 미리보기로 한 번 더 확인할 수 있어요."}
          </p>
        )}
      </div>

      {/* 실시간 미리보기 — 데스크톱(사이드 고정) */}
      <div className="hidden md:sticky md:top-8 md:block md:h-[calc(100vh-4rem)]">
        <p className="mb-3 text-center font-cormorant text-xs tracking-[0.35em] text-gray-400">
          LIVE PREVIEW
        </p>
        <div className="mx-auto h-full max-w-[380px] overflow-hidden rounded-[2rem] border-8 border-gray-800 shadow-xl">
          <div ref={deskPreviewRef} className="h-full overflow-y-auto">
            <InvitationView template={template} data={data} preview />
          </div>
        </div>
      </div>

      {/* 미리보기 — 모바일(우상단 미니, 탭하면 확대) */}
      <div
        className="fixed right-3 top-16 z-40 overflow-hidden rounded-xl border-2 border-gray-800 bg-white shadow-lg md:hidden"
        style={{ width: MINI_W, height: MINI_H }}
      >
        {/* 축소된 실시간 미리보기 (클릭은 위 오버레이가 처리).
            translateY 는 scale 안쪽이라 초대장 기준 거리를 그대로 쓰면 된다. */}
        <div
          ref={miniPreviewRef}
          className="pointer-events-none"
          style={{
            width: MINI_CONTENT_W,
            transformOrigin: "top left",
            transform: `scale(${MINI_SCALE}) translateY(${-miniShift}px)`,
            transition: "transform 0.4s ease",
          }}
        >
          <InvitationView template={template} data={data} preview />
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          aria-label="미리보기 크게 보기"
          className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/55 via-transparent to-transparent pb-1.5 text-xs font-medium text-white"
        >
          🔍 미리보기
        </button>
      </div>

      {/* 완료 모달 */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-2xl">
              💌
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              {isEdit ? "수정이 완료됐어요!" : `${labels.noun}이 완성됐어요!`}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isEdit
                ? `수정 내용이 ${labels.noun}에 반영됐어요. 링크는 그대로예요.`
                : "아래 링크를 공유하세요."}
            </p>
            <div className="mt-4 break-all rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
              {result}
            </div>
            {resultExpires && expiryDate && (
              <p className="mt-2 text-xs text-gray-400">
                {labels.dateFieldLabel} 당일까지 공개 · {expiryDate}에 자동
                비공개
              </p>
            )}
            <KakaoShareButton
              url={result}
              title={
                labels.showPerson2
                  ? `${data.groomName} ♥ ${data.brideName} 결혼합니다`
                  : `${data.groomName}의 ${labels.countdownLabel}에 초대합니다`
              }
              description={
                data.weddingDate
                  ? `${data.weddingDate} · 모바일 초대장이 도착했어요`
                  : "모바일 초대장이 도착했어요"
              }
              imageUrl={data.mainPhotoUrl}
              className="mt-4 w-full py-2.5 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 py-2.5 text-sm font-semibold text-white transition hover:from-gold-500 hover:to-gold-600"
              >
                {copied ? "복사됨!" : "링크 복사"}
              </button>
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-700"
              >
                바로 보기
              </a>
            </div>
            {/* 닫으면 마이페이지로 이동 */}
            <Link
              href="/my"
              className="mt-3 inline-block text-xs text-gray-400 hover:text-gold-500"
            >
              닫기
            </Link>
          </div>
        </div>
      )}

      {/* 모바일 전체화면 미리보기 */}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4 md:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative mx-auto w-full min-h-0 max-w-[400px] flex-1 overflow-hidden rounded-[2rem] border-8 border-gray-800 bg-white shadow-2xl"
          >
            {/* 초대장 안 오른쪽 위에 붙여 둔다. 스크롤되는 건 안쪽 상자라
                여기 둔 버튼은 내려도 그 자리에 그대로 떠 있는다.
                밝은 템플릿·어두운 템플릿 어디에 얹혀도 보이도록 반투명 검정. */}
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              aria-label="미리보기 닫기"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition active:bg-black/50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="h-full overflow-y-auto">
              <InvitationView template={template} data={data} preview />
            </div>
          </div>
        </div>
      )}

      {/* 제작 확인 모달 (미리보기 + 게시 종료 안내 + 한 번 더 확인) */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-3 sm:p-5">
          <div className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col rounded-2xl bg-white p-4 shadow-2xl sm:p-5">
            <h2 className="text-center text-lg font-bold text-gray-800">
              {isEdit ? "이대로 수정할까요?" : "이대로 제작할까요?"}
            </h2>
            <p className="mb-3 mt-1 text-center text-xs text-gray-500">
              {isEdit
                ? "하객에게 보이는 실제 모습이에요. 저장 즉시 반영돼요."
                : "하객에게 보이는 실제 모습이에요. 확인 후 제작해 주세요."}
            </p>
            <div className="mx-auto w-full min-h-0 max-w-[400px] flex-1 overflow-hidden rounded-2xl border-4 border-gray-800">
              <div className="h-full overflow-y-auto">
                <InvitationView template={template} data={data} />
              </div>
            </div>

            {/* 게시 종료일은 행사 다음 날로 자동 결정 (선택 불필요) */}
            <div className="mt-3.5 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-center text-xs leading-5 text-gold-600">
              {expiryDate ? (
                <>
                  {labels.noun}은 {labels.dateFieldLabel} 당일까지 볼 수 있고,
                  <br />
                  <span className="font-semibold">{expiryDate}</span>에 완전히
                  삭제됩니다.
                </>
              ) : (
                <>
                  {labels.dateFieldLabel}
                  {josaEulReul(labels.dateFieldLabel)} 입력하면 게시 종료일이
                  정해집니다.
                </>
              )}
              <br />
              수정 및 삭제는 마이페이지에서 언제든지 가능합니다.
              {isEdit && (
                <>
                  <br />
                  저장하면 바로 반영되고, 링크는 그대로 유지됩니다.
                </>
              )}
            </div>

            {error && (
              <p className="mt-2 text-center text-sm text-red-500">{error}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                다시 수정할게요
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-gold-500 hover:to-gold-600 disabled:opacity-50"
              >
                {submitting
                  ? "잠시만요..."
                  : isEdit
                    ? "네, 수정할게요"
                    : "네, 제작할게요"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 담을 수 있는 것보다 많이 골랐을 때 — 담을 사진만 추린다 */}
      {trim && (
        <TrimPicker
          files={trim.files}
          room={trim.room}
          onCancel={() => setTrim(null)}
          onConfirm={(picked) => {
            setTrim(null);
            uploadIntoGallery(picked);
          }}
        />
      )}

      {/* 저장하는 동안 — 확인 창 위를 덮는다 */}
      {submitting && (
        <SendingOverlay
          label={
            isEdit ? `${labels.noun} 수정 중` : `${labels.noun} 제작 중`
          }
        />
      )}
    </div>
    </div>
  );
}

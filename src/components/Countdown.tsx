"use client";

import { useEffect, useState } from "react";
import type { TemplateTheme } from "@/lib/templates";

// 예식일 자정까지 남은 시간 계산
function remain(iso: string) {
  const target = new Date(iso + "T00:00:00").getTime();
  if (isNaN(target)) return null;
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

/**
 * 실시간 D-day 카운트다운 — 일/시/분/초가 1초마다 갱신.
 * SSR 시점엔 시간 계산이 어긋날 수 있어 마운트 후에만 숫자를 렌더링.
 */
export default function Countdown({
  iso,
  t,
  groomName,
  brideName,
  showPerson2 = true,
  eventLabel = "결혼식",
}: {
  iso: string;
  t: TemplateTheme;
  groomName: string;
  brideName: string;
  showPerson2?: boolean;
  eventLabel?: string;
}) {
  const [time, setTime] = useState<ReturnType<typeof remain>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(remain(iso));
    const id = setInterval(() => setTime(remain(iso)), 1000);
    return () => clearInterval(id);
  }, [iso]);

  if (!mounted || !time) return null;

  const cells = [
    { label: "DAYS", value: time.days },
    { label: "HOURS", value: time.hours },
    { label: "MIN", value: time.mins },
    { label: "SEC", value: time.secs },
  ];

  return (
    <div className="inv-fade mt-8">
      <div className="mx-auto flex max-w-[280px] items-start justify-center">
        {cells.map((c, i) => (
          <div key={c.label} className="flex items-start">
            {i > 0 && (
              <span
                className="font-cormorant px-2.5 pt-1 text-lg font-light"
                style={{ color: t.line }}
              >
                :
              </span>
            )}
            <div className="w-11 text-center">
              <p
                key={`${c.label}-${c.value}`}
                className="inv-tick font-cormorant text-[26px] font-light leading-none tabular-nums"
                style={{ color: t.ink }}
              >
                {String(c.value).padStart(2, "0")}
              </p>
              <p
                className="font-cormorant mt-1.5 text-[8px] tracking-[0.25em]"
                style={{ color: t.sub }}
              >
                {c.label}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[13px]" style={{ color: t.sub }}>
        {showPerson2 ? `${groomName} · ${brideName}` : groomName}의 {eventLabel}까지{" "}
        <span className="font-medium" style={{ color: t.accent }}>
          {time.days}일
        </span>{" "}
        남았습니다
      </p>
    </div>
  );
}

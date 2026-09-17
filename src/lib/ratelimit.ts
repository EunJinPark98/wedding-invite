import "server-only";

/**
 * 아주 단순한 호출 횟수 제한.
 *
 * 한 사람이 같은 칸을 짧은 시간에 수백 번 두드리는 것만 막는다. 기억은 서버
 * 하나가 들고 있는 것이라, 서버가 여러 대로 늘어나면 대수만큼 느슨해지고
 * 다시 뜨면 잊어버린다. 그래서 이것만 믿을 수는 없다 — 여러 곳에서 한꺼번에
 * 들어오는 것까지 막으려면 Vercel 방화벽처럼 앞단에서 세는 것이 맞다.
 *
 * 그래도 값이 싸고(저장소도, 기다림도 없다) 폭주 하나는 확실히 끊어 준다.
 *
 * 한도는 실제로 쓰는 사람이 절대 닿지 않을 만큼 넉넉히 잡는다. 사진을
 * 한꺼번에 19장 올려도 한참 남아야 한다 — 막는 쪽으로 기울면 멀쩡한 사람이
 * 못 쓰게 되고, 그게 훨씬 나쁘다.
 */
type Hits = { count: number; resetAt: number };

const buckets = new Map<string, Hits>();

// 기억이 끝없이 불어나지 않게, 가끔 지난 것을 치운다
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

/**
 * 한도를 넘었으면 true. 넘지 않았으면 한 번 센 뒤 false.
 *
 * @param key     세는 단위 (예: `upload:<userId>`)
 * @param limit   창 하나에 허용할 횟수
 * @param windowMs 창 길이
 */
export function overRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  sweep(now);

  const cur = buckets.get(key);
  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (cur.count >= limit) return true;
  cur.count += 1;
  return false;
}

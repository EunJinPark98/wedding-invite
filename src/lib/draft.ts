import type { Category, InvitationData, TemplateId } from "./types";

/**
 * 만들다 만 초대장을 브라우저에 잠깐 담아 둔다.
 *
 * 사진을 여러 장 올리고 문구까지 다 적는 데 몇 분이 걸리는데, 실수로
 * 새로고침하거나 뒤로 가면 그동안 적은 것이 통째로 사라진다. 그때 "이어서
 * 작성" 을 눌러 되돌릴 수 있도록 남겨 둔다.
 *
 * 담기는 곳은 그 사람 브라우저뿐이고 서버로 보내지 않는다. 사진은 이미
 * 올라가 있어 주소만 들어간다.
 */
const KEY = "starinvite-draft";
// 이 기간이 지난 것은 없는 셈 친다 (행사 날짜가 지나 버렸을 수 있다)
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface Draft {
  category: Category;
  template: TemplateId;
  data: InvitationData;
  savedAt: number;
}

export function saveDraft(d: Omit<Draft, "savedAt">): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...d, savedAt: Date.now() }));
  } catch {
    // 저장 공간이 꽉 찼거나 막혀 있으면 그냥 넘어간다 — 없어도 제작은 된다
  }
}

/** 같은 종류로 만들던 것이 남아 있으면 돌려준다 */
export function readDraft(category: Category): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (d?.category !== category) return null;
    if (!d.data || typeof d.savedAt !== "number") return null;
    if (Date.now() - d.savedAt > MAX_AGE_MS) {
      clearDraft();
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 지우지 못해도 기한이 지나면 알아서 무시된다
  }
}

/** "3분 전" 처럼 언제 적어 둔 것인지 */
export function savedAgo(savedAt: number): string {
  const min = Math.floor((Date.now() - savedAt) / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

import "server-only";

/**
 * 관리자 화면(/admin)에 들어올 수 있는 사람.
 *
 * ADMIN_EMAILS 환경 변수에 쉼표로 나열한다 (예: "a@x.com, b@y.com").
 * 비워 두면 아무도 못 들어온다 — 실수로 열려 있는 것보다 닫혀 있는 편이 낫다.
 * 여기서 보는 것은 다른 사람이 만든 초대장이므로, 서비스 운영에 필요한
 * 범위에서만 쓴다.
 */
export const adminEmails = (): string[] =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (email: string | null | undefined): boolean => {
  const list = adminEmails();
  if (list.length === 0 || !email) return false;
  return list.includes(email.trim().toLowerCase());
};

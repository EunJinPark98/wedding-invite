/**
 * 이용약관 · 개인정보처리방침에서 함께 쓰는 값.
 *
 * 소셜 로그인(카카오·네이버) 동의 화면은 "이 서비스의 이용약관과
 * 개인정보처리방침에 따라 정보가 관리된다"고 안내하므로, 이 문서들은 실제로
 * 열람할 수 있어야 하고 내용도 서비스 동작과 어긋나면 안 된다.
 */

export const SERVICE_NAME = "별빛 초대장";

/**
 * 서비스 기준 주소. 공유 카드·robots·sitemap·canonical 이 함께 쓴다.
 * 실제 값은 Vercel 환경변수 NEXT_PUBLIC_SITE_URL 로 정하고, 여기 기본값은
 * 그 변수가 없을 때 쓰인다 — 로컬 개발뿐 아니라, 그 변수를 아직 Vercel에
 * 설정하지 않은 지금의 운영 배포도 여기에 해당한다.
 *
 * 그래서 이 기본값은 반드시 "지금 실제로 열리는 도메인"이어야 한다.
 * letter.byeolmamapapa.com 으로 옮기는 작업이 진행 중이지만, 그 도메인이
 * Vercel에 연결되고 NEXT_PUBLIC_SITE_URL 도 그 값으로 설정되기 전까지는
 * 여기 기본값을 새 주소로 바꾸면 안 된다 — 카카오톡 공유 미리보기 이미지
 * 등 이 값을 절대주소로 쓰는 곳이 아직 연결 안 된 도메인을 가리키게 되어
 * 실제 사용자에게 문제가 생긴다.
 *
 * → 도메인 연결과 환경변수 설정이 끝난 뒤에 이 기본값도 새 주소로 바꾼다.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://starinvite.vercel.app";

export const OPERATOR_NAME = "별마마파파";
export const OPERATOR_URL = "https://byeolmamapapa.com";

// 문의 창구 — 푸터에 있는 것과 같은 곳
export const KAKAO_CHANNEL_URL = "http://pf.kakao.com/_GxfxbwX";
export const INSTAGRAM_URL = "https://instagram.com/byeolmamapapa";

/**
 * 개인정보 관련 문의를 받을 이메일.
 * 비워 두면 문서에서 이메일 줄이 빠지고 카카오톡·인스타그램만 안내한다.
 * (공개되는 주소이므로 운영자가 직접 정한 값만 넣는다)
 */
export const CONTACT_EMAIL = "obliviscor29@naver.com";

// 문서 시행일 — 내용을 고칠 때 함께 올린다
export const EFFECTIVE_DATE = "2026년 8월 8일";

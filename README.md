# 모바일 청첩장 메이커 💌

템플릿을 고르고 내용을 입력하면, 모바일 청첩장 웹페이지를 만들어 공유 링크를 발급해 주는 서비스입니다.

## 기능

- 템플릿 선택 (클래식 / 모던)
- 폼 입력 + **실시간 미리보기**
- 신랑/신부·혼주·예식 일시/장소·인사말·갤러리·연락처·계좌(마음 전하실 곳)
- "제작하기" → 고유 링크(`/v/abc12345`) 발급 → 복사/공유
- 발행 페이지는 모바일 최적화 + 카카오맵 길찾기 + 카톡 공유용 OG 메타 태그

## 빠른 시작 (로컬)

```bash
npm install
npm run dev
```

http://localhost:3000 접속 → "무료로 시작하기".

> Supabase 설정 없이도 동작합니다. 이 경우 청첩장 데이터는 `.data/invitations.json` 파일에 저장됩니다(개발/테스트용).

## Supabase 연결 (배포용)

1. https://supabase.com 에서 프로젝트 생성
2. `supabase/schema.sql` 내용을 SQL Editor에 붙여넣고 실행
3. `.env.local.example` 를 `.env.local` 로 복사하고 값 채우기
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - (선택) `SUPABASE_SERVICE_ROLE_KEY`
4. `npm run dev` 재시작

## 배포 (Vercel)

1. GitHub에 푸시
2. https://vercel.com 에서 import
3. 환경 변수(위 3개) 등록 후 Deploy

## 구조

```
src/
  app/
    page.tsx              랜딩 (템플릿 소개)
    editor/page.tsx       편집 화면
    v/[slug]/page.tsx     발행된 청첩장 (공유 링크)
    api/invitations/route.ts   저장 API (POST)
  components/
    EditorClient.tsx      폼 + 실시간 미리보기
    InvitationView.tsx    청첩장 렌더링 (편집/발행 공용)
  lib/
    types.ts              데이터 모델
    templates.ts          템플릿 메타데이터
    store.ts              저장소 (Supabase ↔ 로컬 파일 폴백)
```

## 사진 업로드

대표/갤러리 사진은 업로드 시 클라이언트에서 압축된 뒤 `POST /api/upload` 로 전송되고,
청첩장 데이터에는 **이미지 URL만** 저장됩니다.

- Supabase 설정 시: Storage 공개 버킷 `photos` 에 저장 (schema.sql 실행 시 버킷·정책 자동 생성)
- 미설정 시(개발용): `public/uploads/` 에 저장하고 `/uploads/...` 경로 사용 (git 제외)

> 로컬 폴백은 개발용입니다. Vercel 등 서버리스 배포에서는 파일시스템이 임시이므로
> 반드시 Supabase Storage(또는 외부 스토리지)를 사용하세요.

## 다음 단계 아이디어

- 방명록 / 참석 여부(RSVP)
- 배경 음악, 디데이 카운트다운
- 내 청첩장 관리(로그인 + 수정/삭제)
- 템플릿 추가

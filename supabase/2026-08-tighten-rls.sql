-- Supabase SQL Editor 에 붙여넣어 실행하세요. (한 번만 하면 됩니다)
--
-- 왜 고치나
-- 처음 정책은 초대장 표에 `for select using (true)` 를 걸어 두었다. slug 로
-- 한 건씩 여는 것만 생각한 정책이었는데, 실제로는 anon 키만 있으면 표 전체를
-- 훑을 수 있다. 링크를 몰라도 남의 이름·연락처·계좌번호가 그대로 읽힌다.
--
-- 왜 이렇게 고치나
-- RLS 는 "slug 로 걸렀는지"를 알 수 없어 한 건 조회만 허용할 방법이 없다.
-- 대신 이 서비스는 브라우저가 이 표를 직접 건드리지 않는다 — 초대장 화면은
-- 서버에서 그려 보내고, 저장도 서버 라우트가 한다. 서버는 service_role 키를
-- 쓰므로 RLS 를 지나간다. 그래서 공개 정책을 걷어내면 된다.
--
-- 먼저 확인할 것
-- Vercel 환경 변수에 SUPABASE_SERVICE_ROLE_KEY 가 들어 있어야 한다.
-- (네이버 로그인에도 쓰이므로, 네이버 로그인이 되고 있다면 들어 있는 것이다)

/* ───────── 1) 초대장 표 ───────── */
drop policy if exists "public read" on public.invitations;
drop policy if exists "public insert" on public.invitations;

-- 확인: 아래가 빈 결과여야 한다
-- select policyname from pg_policies where tablename = 'invitations';

/* ───────── 2) 사진 저장소 ─────────
   업로드도 서버(/api/upload)가 대신하므로 공개 업로드를 걷어낸다.
   조회는 초대장 화면의 <img> 가 직접 하므로 그대로 둔다. */
drop policy if exists "photos public upload" on storage.objects;

-- 1) 을 실행한 뒤 초대장이 정상적으로 열리는지, 2) 를 실행한 뒤 사진 업로드가
-- 되는지 각각 확인하고 넘어가는 편이 안전하다.
-- 되돌리려면 schema.sql 의 예전 정책을 다시 만들면 된다.

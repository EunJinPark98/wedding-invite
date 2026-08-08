-- Supabase SQL Editor 에 붙여넣어 실행하세요.

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  template text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz, -- 운영 기간 만료 시각 (null = 무기한)
  user_id uuid references auth.users (id) -- 만든 계정 (계정당 1개 제한용)
);

-- 기존 테이블에 컬럼이 없으면 추가 (재실행해도 안전)
alter table public.invitations add column if not exists expires_at timestamptz;
alter table public.invitations add column if not exists user_id uuid references auth.users (id);

create index if not exists invitations_slug_idx on public.invitations (slug);
create index if not exists invitations_user_idx on public.invitations (user_id);

-- RLS: 이 표는 서버만 건드린다.
-- 초대장 화면은 서버에서 그려 보내고 저장도 서버 라우트가 하므로, 브라우저가
-- 이 표를 직접 읽을 일이 없다. 서버는 SUPABASE_SERVICE_ROLE_KEY 로 붙어 RLS 를
-- 지나가므로 정책을 하나도 만들지 않는다.
--   (공개 조회를 열어 두면 anon 키만으로 표 전체를 훑을 수 있어, 링크를 몰라도
--    남의 이름·연락처·계좌번호가 읽힌다)
alter table public.invitations enable row level security;

-- ───────── 사진 업로드용 Storage ─────────
-- 공개 버킷 'photos' 생성 (이미 있으면 무시)
insert into storage.buckets (id, name, public)
  values ('photos', 'photos', true)
  on conflict (id) do nothing;

-- 조회만 열어 둔다 — 초대장 화면의 <img> 가 사진을 직접 불러오기 때문이다.
-- 업로드는 서버(/api/upload)가, 삭제는 초대장 정리 작업이 각각
-- SUPABASE_SERVICE_ROLE_KEY 로 수행하므로 정책을 열어 둘 필요가 없다.
create policy "photos public read"
  on storage.objects for select
  using (bucket_id = 'photos');

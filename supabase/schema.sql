-- Supabase SQL Editor 에 붙여넣어 실행하세요.

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  template text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz, -- 운영 기간 만료 시각 (null = 무기한)
  user_id uuid references auth.users (id) -- 만든 계정 (무료 1개 제한용)
);

-- 기존 테이블에 컬럼이 없으면 추가 (재실행해도 안전)
alter table public.invitations add column if not exists expires_at timestamptz;
alter table public.invitations add column if not exists user_id uuid references auth.users (id);

create index if not exists invitations_slug_idx on public.invitations (slug);
create index if not exists invitations_user_idx on public.invitations (user_id);

-- RLS: 청첩장은 누구나 보고(조회) / 누구나 만들 수 있게(삽입) 허용.
-- 수정/삭제는 막아둡니다. (관리 기능이 필요하면 인증을 붙이세요.)
alter table public.invitations enable row level security;

create policy "public read"
  on public.invitations for select
  using (true);

create policy "public insert"
  on public.invitations for insert
  with check (true);

-- ───────── 사진 업로드용 Storage ─────────
-- 공개 버킷 'photos' 생성 (이미 있으면 무시)
insert into storage.buckets (id, name, public)
  values ('photos', 'photos', true)
  on conflict (id) do nothing;

-- 누구나 사진 업로드(insert) / 조회(select) 가능. 수정·삭제는 막아둠.
create policy "photos public upload"
  on storage.objects for insert
  with check (bucket_id = 'photos');

create policy "photos public read"
  on storage.objects for select
  using (bucket_id = 'photos');

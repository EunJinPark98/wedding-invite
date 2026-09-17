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

-- ───────── 게시 종료일이 비어 있는 옛 초대장 채우기 ─────────
-- expires_at 칸이 생기기 전에 만들어진 초대장은 이 값이 비어 있다. 비어 있으면
-- "무기한"으로 보기 때문에 행사가 아무리 지나도 정기 청소가 손대지 못하고,
-- 이름·연락처·사진이 계속 남는다 — 개인정보처리방침에 적은 자동 삭제가
-- 그 초대장들에는 지켜지지 않는다.
--
-- 행사 날짜로 게시 종료일을 채워 넣어, 다음 청소부터 정상 처리되게 한다.
-- 값이 이미 있는 행과 날짜를 알 수 없는 행은 건드리지 않는다.
-- (앱의 expiryFromEventDate 와 같은 규칙 — 행사 다음 날 0시, 한국 시간)

-- 날짜 모양이 아니거나 2026-02-31 처럼 없는 날이면 null 을 돌려준다.
-- 그냥 형변환하면 그런 행 하나 때문에 전체가 멈춘다.
create or replace function public.safe_date(t text)
returns date language plpgsql immutable as $$
begin
  return t::date;
exception when others then
  return null;
end;
$$;

update public.invitations
set expires_at =
  ((public.safe_date(data->>'weddingDate') + 1)::timestamp
    at time zone 'Asia/Seoul')
where expires_at is null
  and public.safe_date(data->>'weddingDate') is not null;

-- ───────── 지워진 초대장 수 ─────────
-- 초대장을 지우면 행이 사라지므로, 나중에 "지금까지 몇 개가 지워졌는지"를
-- 세어 볼 방법이 없다. 그래서 지울 때마다 여기에 더해 둔다.
-- 숫자만 남기고 이름·사진 같은 개인정보는 담지 않는다.
create table if not exists public.app_stats (
  key text primary key,
  value bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- invitations 와 같은 이유로 서버만 건드린다
alter table public.app_stats enable row level security;

-- 여러 곳에서 동시에 지워도 수가 어긋나지 않도록 더하기를 DB 안에서 한다.
-- (읽어서 +1 하고 쓰면 동시에 지울 때 한쪽이 묻힌다)
create or replace function public.bump_stat(k text, n bigint)
returns void
language sql
as $$
  insert into public.app_stats (key, value, updated_at)
  values (k, n, now())
  on conflict (key) do update
    set value = app_stats.value + excluded.value,
        updated_at = now();
$$;

-- ───────── 사진 목록 조회 막기 (맨 마지막에 두는 이유가 있다) ─────────
--
-- storage 스키마는 Supabase 가 관리하는 것이라, 프로젝트 설정에 따라 여기서
-- 손대는 것이 거부될 수 있다. 그런데 SQL 편집기는 한 구문이 실패하면 거기서
-- 멈추므로, 이 부분이 중간에 있으면 뒤에 있는 것들(초대장 백필·세는 표)까지
-- 통째로 실행되지 않는다. 그래서 맨 끝에 둔다 — 여기서 막히더라도 앞의 것은
-- 이미 다 적용된 뒤다.
--
-- 막히면 SQL 대신 대시보드에서 하면 된다:
--   Storage → photos → Policies → "photos public read" 삭제
--   Storage → photos → Settings → Public bucket 켜짐 확인
--
-- 무엇을 하는 것인가: 초대장 화면의 <img> 는 공개 버킷 주소로 사진을 직접
-- 받아가므로 storage.objects 에 select 정책이 없어도 사진은 보인다. 그런데
-- 정책이 열려 있으면 목록 조회(/object/list)까지 함께 열려서, 브라우저에 들어
-- 있는 anon 키만으로 파일 이름을 통째로 훑어 받아갈 수 있다. 파일 이름을
-- 아무리 길게 지어도 소용이 없다.
--
-- 순서가 중요하다 — 공개로 만든 다음에 정책을 내려야 사진이 안 보이는 순간이 없다.
update storage.buckets set public = true where id = 'photos';
drop policy if exists "photos public read" on storage.objects;

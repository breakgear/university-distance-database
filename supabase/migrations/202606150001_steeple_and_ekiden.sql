begin;

-- 1. distance CHECK 制約を拡張（3000mSC / 駅伝）
alter table public.races drop constraint if exists races_distance_check;
alter table public.races add constraint races_distance_check
  check (distance in ('1500m', '3000mSC', '5000m', '10000m', 'ハーフ', '駅伝'));

alter table public.results drop constraint if exists results_distance_check;
alter table public.results add constraint results_distance_check
  check (distance in ('1500m', '3000mSC', '5000m', '10000m', 'ハーフ', '駅伝'));

-- personal_bests は駅伝のPBを持たないため 3000mSC のみ追加
alter table public.personal_bests drop constraint if exists personal_bests_distance_check;
alter table public.personal_bests add constraint personal_bests_distance_check
  check (distance in ('1500m', '3000mSC', '5000m', '10000m', 'ハーフ'));

-- 2. results に駅伝の区間カラムを追加（通常レースは NULL）
alter table public.results add column if not exists section text;
alter table public.results add column if not exists section_distance text;

-- 3. 駅伝チーム総合テーブル
create table if not exists public.team_results (
  team_result_id text primary key,
  meet_id text not null references public.meets(meet_id) on update cascade on delete cascade,
  race_id text not null references public.races(race_id) on update cascade on delete cascade,
  university_id text not null references public.universities(id) on update cascade on delete restrict,
  result_type text not null check (result_type in ('総合', '往路', '復路')),
  rank text,
  time text,
  status text not null default 'finished' check (status in ('finished', 'dns', 'dnf', 'dq')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (race_id, university_id, result_type)
);

create index if not exists team_results_race_id_idx on public.team_results(race_id);
create index if not exists team_results_university_id_idx on public.team_results(university_id);

-- updated_at トリガ（既存 set_updated_at 関数を再利用）
drop trigger if exists set_team_results_updated_at on public.team_results;
create trigger set_team_results_updated_at before update on public.team_results
  for each row execute function public.set_updated_at();

-- RLS（既存テーブルと同じ public read + service_role 全権）
alter table public.team_results enable row level security;
drop policy if exists "public read team_results" on public.team_results;
create policy "public read team_results" on public.team_results
  for select to anon, authenticated using (true);
grant select on public.team_results to anon, authenticated;
grant all on public.team_results to service_role;

commit;

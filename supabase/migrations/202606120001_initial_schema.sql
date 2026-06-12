begin;

create table if not exists public.universities (
  id text primary key,
  slug text not null unique,
  name text not null,
  area text,
  sash_color text,
  accent text,
  profile text,
  listing_events text[] not null default '{}',
  has_upcoming boolean not null default false,
  has_result boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.athletes (
  id text primary key,
  slug text not null unique,
  name text not null,
  university_id text not null references public.universities(id) on update cascade on delete restrict,
  year text,
  hometown text,
  specialty text,
  profile text,
  next_race text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meets (
  meet_id text primary key,
  slug text not null unique,
  meet_name text not null,
  date date,
  venue text,
  category text not null check (category in ('track', 'road', 'ekiden')),
  status text not null check (
    status in ('scheduled', 'coming_soon', 'startlist_published', 'result_waiting', 'result_published')
  ),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.races (
  race_id text primary key,
  slug text not null unique,
  meet_id text not null references public.meets(meet_id) on update cascade on delete cascade,
  race_name text not null,
  distance text not null check (distance in ('1500m', '5000m', '10000m', 'ハーフ')),
  start_time text,
  status text not null check (
    status in ('scheduled', 'coming_soon', 'startlist_published', 'result_waiting', 'result_published')
  ),
  result_summary_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.athletes
  drop constraint if exists athletes_next_race_fkey;
alter table public.athletes
  add constraint athletes_next_race_fkey
  foreign key (next_race) references public.races(race_id)
  on update cascade on delete set null;

create table if not exists public.entries (
  entry_id text primary key,
  meet_id text not null references public.meets(meet_id) on update cascade on delete cascade,
  race_id text not null references public.races(race_id) on update cascade on delete cascade,
  athlete_id text not null references public.athletes(id) on update cascade on delete cascade,
  university_id text not null references public.universities(id) on update cascade on delete restrict,
  bib_no integer,
  entry_status text not null check (
    entry_status in ('entered', 'listed', 'started', 'dns', 'unconfirmed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (race_id, athlete_id)
);

create table if not exists public.results (
  result_id text primary key,
  meet_id text not null references public.meets(meet_id) on update cascade on delete cascade,
  race_id text not null references public.races(race_id) on update cascade on delete cascade,
  athlete_id text not null references public.athletes(id) on update cascade on delete cascade,
  university_id text not null references public.universities(id) on update cascade on delete restrict,
  distance text not null check (distance in ('1500m', '5000m', '10000m', 'ハーフ')),
  date date,
  rank text,
  time text,
  result_status text not null check (result_status in ('finished', 'dns', 'dnf', 'dq')),
  note text,
  is_pb boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (race_id, athlete_id)
);

create table if not exists public.personal_bests (
  pb_id text primary key,
  athlete_id text not null references public.athletes(id) on update cascade on delete cascade,
  university_id text not null references public.universities(id) on update cascade on delete restrict,
  distance text not null check (distance in ('1500m', '5000m', '10000m', 'ハーフ')),
  time text not null,
  date date,
  source_type text not null check (source_type in ('result', 'manual')),
  source_result_id text references public.results(result_id) on update cascade on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, distance)
);

create index if not exists athletes_university_id_idx on public.athletes(university_id);
create index if not exists races_meet_id_idx on public.races(meet_id);
create index if not exists entries_race_id_idx on public.entries(race_id);
create index if not exists entries_athlete_id_idx on public.entries(athlete_id);
create index if not exists results_race_id_idx on public.results(race_id);
create index if not exists results_athlete_id_idx on public.results(athlete_id);
create index if not exists results_university_id_idx on public.results(university_id);
create index if not exists personal_bests_athlete_id_idx on public.personal_bests(athlete_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'universities', 'athletes', 'meets', 'races', 'entries', 'results', 'personal_bests'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'universities', 'athletes', 'meets', 'races', 'entries', 'results', 'personal_bests'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "public read %s" on public.%I', table_name, table_name);
    execute format(
      'create policy "public read %s" on public.%I for select to anon, authenticated using (true)',
      table_name,
      table_name
    );
    execute format('grant select on public.%I to anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
  end loop;
end;
$$;

commit;

-- Reflex Rush — online 1v1 challenges
-- Run this whole file once in the Supabase SQL editor of your project
-- (Project -> SQL Editor -> New query -> paste -> Run).
--
-- Also required in the dashboard (cannot be done from SQL):
--   Authentication -> Providers -> Anonymous sign-ins -> enable.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────
-- profiles: public display info + online win/loss record.
-- (The per-device difficulty level used for solo play lives only in
-- AsyncStorage on the phone; this table is just for online matches.)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null default 'Giocatore',
  games_played int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────
-- matches
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  level int not null default 1,
  seed text not null default encode(gen_random_bytes(8), 'hex'),
  player1_id uuid not null references auth.users (id),
  player2_id uuid references auth.users (id),
  winner_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

alter table public.matches enable row level security;

create policy "players can view their own matches"
  on public.matches for select
  using (auth.uid() = player1_id or auth.uid() = player2_id);

-- ─────────────────────────────────────────────────────────────────
-- match_players: each player's submitted round scores for a match
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.match_players (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references auth.users (id),
  round1_score int,
  round2_score int,
  round3_score int,
  overall_score int,
  submitted_at timestamptz,
  primary key (match_id, player_id)
);

alter table public.match_players enable row level security;

create policy "players can view match_players rows for their own matches"
  on public.match_players for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.player1_id = auth.uid() or m.player2_id = auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- matchmaking_queue: players waiting for a random opponent
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.matchmaking_queue (
  player_id uuid primary key references auth.users (id) on delete cascade,
  level int not null,
  created_at timestamptz not null default now()
);

alter table public.matchmaking_queue enable row level security;

create policy "players manage their own queue row"
  on public.matchmaking_queue for all
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);

-- Everything below runs with the privileges of the function owner
-- (security definer), which is how clients are allowed to safely
-- pair up / join / finish matches without broad table write access.

-- ─────────────────────────────────────────────────────────────────
-- set_username: the only client-writable profile field
-- ─────────────────────────────────────────────────────────────────
create or replace function public.set_username(p_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.profiles (id, username)
  values (auth.uid(), coalesce(nullif(trim(p_username), ''), 'Giocatore'))
  on conflict (id) do update set username = excluded.username;
end;
$$;

grant execute on function public.set_username(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- try_match_random: atomically pair with a waiting opponent, or
-- queue up. Returns one row if matched, zero rows if now queued.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.try_match_random(p_level int)
returns table (
  match_id uuid,
  seed text,
  level int,
  opponent_id uuid,
  opponent_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_partner_id uuid;
  v_partner_level int;
  v_match_id uuid;
  v_seed text;
  v_level int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select q.player_id, q.level
    into v_partner_id, v_partner_level
  from public.matchmaking_queue q
  where q.player_id <> v_uid
  order by abs(q.level - p_level) asc, q.created_at asc
  for update skip locked
  limit 1;

  if v_partner_id is not null then
    delete from public.matchmaking_queue where player_id = v_partner_id;
    delete from public.matchmaking_queue where player_id = v_uid;

    v_level := greatest(1, round((p_level + v_partner_level) / 2.0));
    v_seed := encode(gen_random_bytes(8), 'hex');

    insert into public.matches (status, level, seed, player1_id, player2_id, started_at)
    values ('active', v_level, v_seed, v_partner_id, v_uid, now())
    returning id into v_match_id;

    insert into public.match_players (match_id, player_id)
    values (v_match_id, v_partner_id), (v_match_id, v_uid);

    return query
      select v_match_id, v_seed, v_level, v_partner_id,
             coalesce((select p.username from public.profiles p where p.id = v_partner_id), 'Avversario');
  else
    insert into public.matchmaking_queue (player_id, level)
    values (v_uid, p_level)
    on conflict (player_id) do update set level = excluded.level, created_at = now();
    return;
  end if;
end;
$$;

grant execute on function public.try_match_random(int) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- leave_matchmaking_queue: cancel a pending random-match search
-- ─────────────────────────────────────────────────────────────────
create or replace function public.leave_matchmaking_queue()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.matchmaking_queue where player_id = auth.uid();
end;
$$;

grant execute on function public.leave_matchmaking_queue() to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- create_match_with_code: host a challenge, share the code
-- ─────────────────────────────────────────────────────────────────
create or replace function public.create_match_with_code(p_level int)
returns table (match_id uuid, code text, seed text, level int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_seed text := encode(gen_random_bytes(8), 'hex');
  v_match_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (
      select 1 from public.matches m where m.code = v_code and m.status = 'waiting'
    );
  end loop;

  insert into public.matches (code, status, level, seed, player1_id)
  values (v_code, 'waiting', greatest(1, p_level), v_seed, v_uid)
  returning id into v_match_id;

  insert into public.match_players (match_id, player_id) values (v_match_id, v_uid);

  return query select v_match_id, v_code, v_seed, greatest(1, p_level);
end;
$$;

grant execute on function public.create_match_with_code(int) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- join_match_by_code: join a friend's hosted challenge
-- ─────────────────────────────────────────────────────────────────
create or replace function public.join_match_by_code(p_code text)
returns table (match_id uuid, seed text, level int, opponent_id uuid, opponent_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_match public.matches%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_match
  from public.matches m
  where m.code = upper(p_code) and m.status = 'waiting'
  for update skip locked
  limit 1;

  if v_match.id is null then
    raise exception 'Codice non valido o partita già iniziata';
  end if;

  if v_match.player1_id = v_uid then
    raise exception 'Non puoi unirti alla tua stessa partita';
  end if;

  update public.matches
  set player2_id = v_uid, status = 'active', started_at = now()
  where id = v_match.id;

  insert into public.match_players (match_id, player_id)
  values (v_match.id, v_uid)
  on conflict do nothing;

  return query
    select v_match.id, v_match.seed, v_match.level, v_match.player1_id,
           coalesce((select p.username from public.profiles p where p.id = v_match.player1_id), 'Avversario');
end;
$$;

grant execute on function public.join_match_by_code(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- cancel_hosted_match: host gives up waiting for someone to join
-- ─────────────────────────────────────────────────────────────────
create or replace function public.cancel_hosted_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.matches
  where id = p_match_id and player1_id = auth.uid() and status = 'waiting';
end;
$$;

grant execute on function public.cancel_hosted_match(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- submit_match_result: report your 3-round scores; once both
-- players have submitted, the match is closed and stats updated.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.submit_match_result(
  p_match_id uuid,
  p_round1 int,
  p_round2 int,
  p_round3 int,
  p_overall int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_submitted_count int;
  v_winner uuid;
  v_p1 uuid;
  v_p2 uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.match_players
  set round1_score = p_round1,
      round2_score = p_round2,
      round3_score = p_round3,
      overall_score = p_overall,
      submitted_at = now()
  where match_id = p_match_id and player_id = v_uid;

  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;
  update public.profiles set games_played = games_played + 1 where id = v_uid;

  select count(*) into v_submitted_count
  from public.match_players
  where match_id = p_match_id and submitted_at is not null;

  if v_submitted_count >= 2 then
    select player1_id, player2_id into v_p1, v_p2 from public.matches where id = p_match_id;

    select player_id into v_winner
    from public.match_players
    where match_id = p_match_id
    order by overall_score desc nulls last
    limit 1;

    update public.matches
    set status = 'finished', finished_at = now(), winner_id = v_winner
    where id = p_match_id;

    if v_winner is not null then
      update public.profiles set wins = wins + 1 where id = v_winner;
      update public.profiles set losses = losses + 1
        where id in (v_p1, v_p2) and id <> v_winner;
    end if;
  end if;
end;
$$;

grant execute on function public.submit_match_result(uuid, int, int, int, int) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- Realtime: let clients subscribe to match/match_players changes
-- ─────────────────────────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.match_players;
exception when duplicate_object then null;
end $$;

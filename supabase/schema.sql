-- Ejecutar desde Supabase SQL Editor en un proyecto nuevo de Ninjuku.
create table public.player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  games_played bigint not null default 0 check (games_played >= 0),
  total_score bigint not null default 0 check (total_score >= 0),
  best_score bigint not null default 0 check (best_score >= 0),
  coins bigint not null default 0 check (coins >= 0),
  updated_at timestamptz not null default now()
);
create table public.game_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null,
  score bigint not null check (score between 0 and 1000000000),
  coins_earned integer not null check (coins_earned >= 0),
  created_at timestamptz not null default now(),
  unique(user_id,game_id)
);
create table public.coin_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null,
  delta bigint not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique(user_id,game_id)
);
create table public.shop_items (
  id bigint generated always as identity primary key,
  name text not null,
  price integer not null check (price >= 0),
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.player_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id bigint not null references public.shop_items(id),
  quantity integer not null default 0 check (quantity >= 0),
  primary key(user_id,item_id)
);
alter table public.player_progress enable row level security;
alter table public.game_results enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.shop_items enable row level security;
alter table public.player_inventory enable row level security;
create policy "read own progress" on public.player_progress for select to authenticated using ((select auth.uid())=user_id);
create policy "read own results" on public.game_results for select to authenticated using ((select auth.uid())=user_id);
create policy "read own coins" on public.coin_transactions for select to authenticated using ((select auth.uid())=user_id);
create policy "read active items" on public.shop_items for select to authenticated using (active=true);
create policy "read own inventory" on public.player_inventory for select to authenticated using ((select auth.uid())=user_id);

create or replace function public.record_ninjuku_game(p_game_id uuid,p_score bigint)
returns table (games_played bigint,total_score bigint,best_score bigint,coins bigint,coins_awarded integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_inserted bigint;
  v_award integer := 10;
begin
  if v_user is null then raise exception 'Inicia sesion'; end if;
  if p_game_id is null or p_score is null or p_score < 0 or p_score > 1000000000 then raise exception 'Puntaje invalido'; end if;
  insert into public.player_progress(user_id) values(v_user) on conflict (user_id) do nothing;
  perform 1 from public.player_progress where user_id=v_user for update;
  insert into public.game_results(user_id,game_id,score,coins_earned)
  values(v_user,p_game_id,p_score,v_award)
  on conflict (user_id,game_id) do nothing returning id into v_inserted;
  if v_inserted is not null then
    update public.player_progress p set games_played=p.games_played+1,
      total_score=p.total_score+p_score, best_score=greatest(p.best_score,p_score),
      coins=p.coins+v_award, updated_at=now() where p.user_id=v_user;
    insert into public.coin_transactions(user_id,game_id,delta,reason)
      values(v_user,p_game_id,v_award,'game_reward');
  else v_award:=0;
  end if;
  return query select p.games_played,p.total_score,p.best_score,p.coins,v_award
    from public.player_progress p where p.user_id=v_user;
end;
$$;
revoke all on function public.record_ninjuku_game(uuid,bigint) from public,anon;
grant execute on function public.record_ninjuku_game(uuid,bigint) to authenticated;
-- Aviso: la puntuacion viene del navegador y aun no tiene validacion anti-trampas en servidor.

-- Schema do back-end opcional (Supabase) — Diferencial 4.
-- Rode no SQL Editor do seu projeto Supabase. A autenticação usa o Supabase Auth (e-mail/senha).

create table if not exists public.favorites (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  word       text        not null,
  created_at timestamptz not null default now(),
  primary key (user_id, word)
);

create table if not exists public.history (
  user_id   uuid        not null references auth.users (id) on delete cascade,
  word      text        not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, word)
);

create index if not exists favorites_user_created_idx on public.favorites (user_id, created_at desc);
create index if not exists history_user_viewed_idx   on public.history (user_id, viewed_at desc);

-- Row Level Security: cada usuário só enxerga e altera os próprios registros.
alter table public.favorites enable row level security;
alter table public.history   enable row level security;

drop policy if exists "favorites_owner" on public.favorites;
create policy "favorites_owner" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "history_owner" on public.history;
create policy "history_owner" on public.history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

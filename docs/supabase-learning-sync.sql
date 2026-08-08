create table if not exists public.learning_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  backup jsonb not null,
  device_id text not null,
  updated_at timestamptz not null default now(),
  constraint learning_state_format check (backup ->> 'format' = 'dsa-engine-learning-data')
);

alter table public.learning_state enable row level security;

drop policy if exists "users read their own learning state" on public.learning_state;
create policy "users read their own learning state"
  on public.learning_state for select
  using (auth.uid() = user_id);

drop policy if exists "users insert their own learning state" on public.learning_state;
create policy "users insert their own learning state"
  on public.learning_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update their own learning state" on public.learning_state;
create policy "users update their own learning state"
  on public.learning_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_learning_state_updated_at()
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

drop trigger if exists learning_state_updated_at on public.learning_state;
create trigger learning_state_updated_at
before update on public.learning_state
for each row execute function public.touch_learning_state_updated_at();


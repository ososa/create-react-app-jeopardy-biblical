-- Create game_sessions table
create table public.game_sessions (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  host_id uuid null, -- Optional, if we want to track who created it
  status text not null default 'waiting', -- 'waiting', 'active', 'finished'
  game_state jsonb null, -- Snapshot of current scores/question for late joiners
  constraint game_sessions_pkey primary key (id),
  constraint game_sessions_host_id_fkey foreign key (host_id) references auth.users (id)
);

-- Enable RLS
alter table public.game_sessions enable row level security;

-- Allow anyone to create a session (since we have anon games)
create policy "Anyone can create game sessions" on public.game_sessions
  for insert with check (true);

-- Allow anyone to read sessions (to join)
create policy "Anyone can read game sessions" on public.game_sessions
  for select using (true);

-- Allow anyone to update sessions (for game state sync)
-- In a stricter app, only host should update, but for simplicity/anon:
create policy "Anyone can update game sessions" on public.game_sessions
  for update using (true);

-- EchoLick Supabase minimal v1 schema
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  key_root text not null,
  bar_count int not null check (bar_count > 0),
  time_signature text not null default '4/4',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.form_bars (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  bar_index int not null check (bar_index >= 0),
  degree text not null,
  chord_symbol text not null,
  chord_root text,
  created_at timestamptz not null default now(),
  unique (form_id, bar_index)
);

create table if not exists public.licks (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  bar_index int not null check (bar_index >= 0),
  note_policy text not null,
  source text not null default 'ai',
  tempo int not null check (tempo between 40 and 220),
  notes_json jsonb not null,
  difficulty_level int check (difficulty_level between 1 and 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_form_bars_form_bar
  on public.form_bars(form_id, bar_index);

create index if not exists idx_licks_form_bar
  on public.licks(form_id, bar_index);

create index if not exists idx_licks_note_policy_created
  on public.licks(note_policy, created_at desc);

create index if not exists idx_licks_active_created
  on public.licks(is_active, created_at desc);

-- Safe default if RLS is enabled globally:
-- service_role bypasses RLS; no anon/auth policies are added yet.
alter table public.forms enable row level security;
alter table public.form_bars enable row level security;
alter table public.licks enable row level security;

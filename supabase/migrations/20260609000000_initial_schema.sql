-- Daily Digest initial schema

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  priority integer not null default 0,
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  edition_number integer not null,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  subtitle text,
  pull_quote text,
  content text not null,
  sources jsonb,
  word_count integer,
  read_time_minutes integer,
  published_at timestamptz not null default now()
);

create table if not exists public.reading_progress (
  paper_id uuid primary key references public.papers(id) on delete cascade,
  scroll_position integer not null default 0,
  percent_read integer not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.papers(id) on delete cascade,
  selected_text text not null,
  note text,
  color text not null default 'yellow' check (color in ('yellow', 'green', 'pink')),
  start_offset integer,
  end_offset integer,
  created_at timestamptz not null default now()
);

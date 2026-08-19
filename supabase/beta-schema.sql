create table if not exists public.beta_analyses (
  id uuid primary key,
  session_id uuid not null,
  created_at timestamptz not null,
  prompt_version text not null,
  product_version text not null,
  model_version text not null,
  scenario jsonb not null,
  snapshot jsonb not null
);

create table if not exists public.beta_feedback (
  id uuid primary key,
  analysis_id uuid not null unique references public.beta_analyses(id) on delete cascade,
  session_id uuid not null,
  created_at timestamptz not null,
  bad_case_tags text[] not null default '{}',
  record jsonb not null
);

create index if not exists beta_analyses_created_at_idx on public.beta_analyses(created_at desc);
create index if not exists beta_feedback_created_at_idx on public.beta_feedback(created_at desc);
create index if not exists beta_feedback_bad_case_tags_idx on public.beta_feedback using gin(bad_case_tags);

alter table public.beta_analyses enable row level security;
alter table public.beta_feedback enable row level security;

grant usage on schema public to service_role;
grant select, insert on table public.beta_analyses to service_role;
grant select, insert on table public.beta_feedback to service_role;

-- No anon/authenticated policies are created. Only the server-side secret key may access these tables.

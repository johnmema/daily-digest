-- Papers are written in one of three modes (see the routine prompt's STEP 0):
-- 'essay' (concept/phenomenon), 'explainer' (technology/method/field), or
-- 'analysis' (company/stock). Store the mode so the archive can group/filter
-- by it later. Nullable: older papers predate categorization.
alter table public.papers
  add column if not exists category text;

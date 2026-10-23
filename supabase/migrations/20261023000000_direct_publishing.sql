-- Apply once through the project SQL editor before deploying the publisher.
-- Edition ledger is private. Only service_role can invoke the publishing function.
create table if not exists public.digest_editions (
  run_date date primary key,
  paper_id uuid not null unique references public.papers(id),
  topic text not null,
  created_at timestamptz not null default now()
);
alter table public.digest_editions enable row level security;
revoke all on public.digest_editions from anon, authenticated;
grant select, insert on public.digest_editions to service_role;

create or replace function public.publish_daily_digest(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d date := (payload->>'run_date')::date;
  existing uuid;
  selected_topic uuid := nullif(payload->>'topic_id', '')::uuid;
  saved public.papers;
  next_edition integer;
begin
  -- Serializes every publisher, including retries of different dates.
  perform pg_advisory_xact_lock(782019, 1);
  select paper_id into existing from public.digest_editions where run_date = d;
  if existing is not null then
    return jsonb_build_object('success', true, 'replayed', true, 'paper_id', existing, 'run_date', d);
  end if;
  if selected_topic is not null then
    if not exists(select 1 from public.topics where id=selected_topic and status in ('queued','in_progress')) then
      raise exception 'Topic missing or already completed';
    end if;
    if exists(select 1 from public.papers where topic_id=selected_topic) then raise exception 'Topic already has an essay'; end if;
  end if;
  if exists(select 1 from public.digest_editions where lower(trim(topic))=lower(trim(payload->>'topic'))) then
    raise exception 'Topic already published';
  end if;
  select coalesce(max(edition_number),0)+1 into next_edition from public.papers;
  insert into public.papers(edition_number,topic_id,category,title,subtitle,pull_quote,content,sources,word_count,read_time_minutes,published_at)
  values(next_edition,selected_topic,payload->>'category',payload->>'title',payload->>'subtitle',payload->>'pull_quote',payload->>'content',payload->'sources',(payload->>'word_count')::integer,(payload->>'read_time_minutes')::integer,now()) returning * into saved;
  insert into public.digest_editions(run_date,paper_id,topic) values(d,saved.id,payload->>'topic');
  if selected_topic is not null then update public.topics set status='done' where id=selected_topic; end if;
  return jsonb_build_object('success',true,'replayed',false,'paper_id',saved.id,'edition',saved.edition_number,'run_date',d);
end;
$$;
revoke all on function public.publish_daily_digest(jsonb) from public, anon, authenticated;
grant execute on function public.publish_daily_digest(jsonb) to service_role;

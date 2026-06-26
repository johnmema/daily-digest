alter table public.topics
  add column if not exists category text
  check (category in ('teach_me', 'how_it_works', 'big_picture', 'debate_this', 'essay', 'stock_deep_dive'));

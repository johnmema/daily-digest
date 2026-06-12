# Daily Digest — Claude Code Context

## What this is
A personal AI newspaper app. An agent researches a topic nightly and writes a long-form cited essay. One paper per day, delivered to a focused reading experience.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Supabase** — Postgres database, server-side client via `@supabase/ssr`
- **Anthropic API** — `claude-sonnet-4-6` with `web_search` tool for research + writing
- **Tailwind CSS** + `@tailwindcss/typography` for essay prose
- **@dnd-kit** for drag-to-reorder in queue
- **Vercel** for hosting, **GitHub Actions** for nightly cron

## Env vars needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, for nightly job
ANTHROPIC_API_KEY=
CRON_SECRET=                    # bearer token for /api/jobs/run-nightly
```

## Database tables
- `topics` — the queue (id, title, priority, status, created_at)
- `papers` — essays (id, edition_number, topic_id, title, subtitle, pull_quote, content, sources jsonb, word_count, read_time_minutes, published_at)
- `reading_progress` — per-paper scroll/percent/completed
- `annotations` — highlights with char offsets + optional notes

## File map
```
app/page.tsx                         home feed
app/paper/[id]/page.tsx              reading view
app/library/page.tsx                 archive + search
app/queue/page.tsx                   topic queue
app/api/jobs/run-nightly/route.ts    nightly essay job
app/api/suggest-topics/route.ts      AI topic suggestions
components/Header.tsx                site header
components/PaperCard.tsx             card (featured + grid variants)
components/ReadingView.tsx           full reading experience
components/TopicQueue.tsx            queue management UI
lib/anthropic.ts                     essay generation + suggestions
lib/supabase.ts                      browser + server clients
lib/utils.ts                         readTime(), parseHeadings(), formatDate()
types/index.ts                       shared TypeScript types
```

## Running the nightly job manually
```bash
curl -X POST http://localhost:3000/api/jobs/run-nightly \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Design rules (never violate)
- Background: `#ffffff`, text: `#000000`, card surface: `#f8f8f8`, borders: `#e8e5e0`, secondary: `#6b6b6b`
- Fonts: Playfair Display for headings/pull quotes, Inter for body/UI
- No drop shadows on cards, no border-radius on cards, no gradients
- Cards have `bg-[#f8f8f8]`, no border; gapped grid (`gap-8`), not a hairline grid
- Section dividers: large serif lowercase header + `flex-1 border-t border-[#1a1a1a]` rule
- "read more ›" link (bold, chevron) ends each card
- Header: large serif "the news." logo + hamburger menu on the right at all breakpoints
- Keep components minimal — 4 components total, pages do the assembly

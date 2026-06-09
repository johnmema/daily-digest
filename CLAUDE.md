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
- Background: `#f9f7f4`, text: `#1a1a1a`, borders: `#e8e5e0`, secondary: `#6b6b6b`
- Fonts: Playfair Display for headings/pull quotes, Inter for body/UI
- No drop shadows on cards, no border-radius on cards, no gradients
- Cards have `border border-[#e8e5e0]` and `bg-white`
- Section dividers: lowercase label + `flex-1 border-t border-[#e8e5e0]` rule
- Keep components minimal — 4 components total, pages do the assembly

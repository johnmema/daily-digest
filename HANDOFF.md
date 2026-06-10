# Daily Digest — Handoff

## What's Built

A personal AI newspaper. Every night a Claude routine researches a topic from your queue, writes a long-form essay, and saves it. You open the site in the morning and read it.

**Live site:** https://daily-digest-pink.vercel.app  
**Repo:** https://github.com/johnmema/daily-digest  
**Supabase project:** https://dsqkvtuuhwpeazdyotie.supabase.co  

---

## The Full Loop (Goal)

1. You go to `/queue` → type a topic → hit Add
2. Claude routine runs at 10pm EDT every night
3. Routine calls `GET /api/next-topic` → gets your top queued topic
4. Routine does 5–8 web searches, writes a 2,500–3,500 word essay
5. Routine POSTs the essay JSON to `POST /api/ingest`
6. Essay appears on your site at `/`

---

## Current Blocker

The Claude Code routine sandbox **only allows web search traffic**. It cannot call external URLs — not Supabase, not your Vercel site. This means:

- `GET /api/next-topic` → blocked (Host not in allowlist)
- `POST /api/ingest` → blocked (Host not in allowlist)

The last routine run self-picked a topic, wrote the essay, but couldn't save it anywhere.

---

## Chosen Solution: Google Drive Bridge

The routine CAN write to Google Drive (it has the connector). Your Vercel app polls Drive, finds new essay files, imports them to Supabase automatically.

### The new flow:
1. Routine reads a `queue.json` file from Drive (you maintain this as the topic source)
2. Routine writes the finished essay as `essay_YYYY-MM-DD.json` to the Drive folder
3. Vercel cron job runs every hour, finds unprocessed essay files, imports to Supabase
4. Topic gets marked done, essay appears on site

### Drive folder
`daily-digest` folder ID: `1qo3ri5RuyjBpbP8NoUhDll021ebOswKX`  
URL: https://drive.google.com/drive/folders/1qo3ri5RuyjBpbP8NoUhDll021ebOswKX

---

## What's Done

### Vercel env vars (already set)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` = `8967d40ec2ace89d827442c59c553fdfe974057763f5cdf98772caee62cf5f5c`

### API routes (already deployed)
- `GET /api/next-topic` — fetches top queued topic, marks it in_progress
- `POST /api/ingest` — saves essay to Supabase, marks topic done
- `GET /api/suggest-topics` — returns curated topic suggestions

### Database tables (already created in Supabase)
- `topics` — queue (id, title, priority, status, created_at)
- `papers` — essays (id, edition_number, topic_id, title, subtitle, pull_quote, content, sources, word_count, read_time_minutes, published_at)
- `reading_progress` — scroll position per paper
- `annotations` — highlights with char offsets

### RLS policies
All tables have `allow all` policies (fine for personal use).

---

## What Still Needs To Be Done

### Step 1 — Google Service Account

1. Go to https://console.cloud.google.com
2. Create a new project or use existing
3. Enable **Google Drive API**
4. Go to **IAM & Admin → Service Accounts → Create Service Account**
5. Download the JSON key file
6. Share the Drive folder with the service account email (give it **Viewer** access)
7. Add these to Vercel env vars:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL = xxx@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY   = <the private_key value from the JSON, including -----BEGIN...>
GOOGLE_DRIVE_FOLDER_ID       = 1qo3ri5RuyjBpbP8NoUhDll021ebOswKX
```

### Step 2 — Build the Drive poller in the codebase

A Vercel cron job at `/api/cron/import-essays` that:
1. Lists JSON files in the Drive folder
2. Downloads any not yet imported
3. POSTs each to `/api/ingest`
4. Moves processed files to a `processed/` subfolder

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/import-essays",
    "schedule": "0 * * * *"
  }]
}
```

Install: `npm install googleapis`

### Step 3 — Update routine instructions

Replace the current routine instructions with:

```
You are a research agent for a personal daily digest app.

STEP 1 — Get the topic. Read the file named "queue.txt" from Google Drive folder 1qo3ri5RuyjBpbP8NoUhDll021ebOswKX. The file contains one topic per line. Use the first line as today's topic. If the file is empty or missing, pick an interesting topic yourself.

STEP 2 — Research deeply using web search:
- Search from multiple angles
- Find recent data, academic perspectives, contrarian views, specific examples
- Do at least 5-8 searches before writing

STEP 3 — Write a 2,500–3,500 word essay:
- Compelling title and subtitle
- Pull quote (one sentence capturing the core insight)
- 5–7 sections with ## headers
- Your own thesis, not just a summary
- Inline citations: (Author/Publication, Year)

STEP 4 — Save to Google Drive folder 1qo3ri5RuyjBpbP8NoUhDll021ebOswKX as a file named essay_YYYY-MM-DD.json with this structure:
{
  "topic": "<the topic you researched>",
  "title": "...",
  "subtitle": "...",
  "pull_quote": "...",
  "content": "...(full markdown with ## headers)...",
  "sources": [{"title": "...", "url": "...", "snippet": "..."}],
  "word_count": <number>,
  "read_time_minutes": <number>,
  "published_at": "<ISO timestamp>"
}

STEP 5 — Remove the used topic from queue.txt in Drive (rewrite the file without the first line).
```

### Step 4 — Update `/api/ingest` to accept Drive format

The Drive essay JSON doesn't have `topic_id` — update the ingest route to handle that gracefully (it already does, `topic_id` is optional).

---

## Stack
- **Next.js 14** — App Router, TypeScript
- **Supabase** — Postgres, server client via `@supabase/ssr`
- **Tailwind CSS** + `@tailwindcss/typography`
- **@dnd-kit** — drag to reorder queue
- **Vercel** — hosting + cron jobs
- **Google Drive** — bridge between Claude routine and Supabase

## Design Rules (never violate)
- Background: `#f9f7f4`, text: `#1a1a1a`, borders: `#e8e5e0`, secondary: `#6b6b6b`
- Fonts: Playfair Display (headings), Inter (body/UI)
- No shadows, no border-radius on cards, no gradients
- Cards: `border border-[#e8e5e0] bg-white`
- Section dividers: 11px uppercase Inter + thin rule

## Local Dev
```bash
cd ~/Desktop/daily-digest
npm run dev
# runs at http://localhost:3000
```

`.env.local` needs:
```
NEXT_PUBLIC_SUPABASE_URL=https://dsqkvtuuhwpeazdyotie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=8967d40ec2ace89d827442c59c553fdfe974057763f5cdf98772caee62cf5f5c
```

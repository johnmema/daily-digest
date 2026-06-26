import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase'

// Polls Gmail drafts for essays delivered by the Claude routine. Each matching
// draft body is pure JSON (see routine prompt). For each: parse, insert a paper,
// match + mark its topic done, then delete the draft so it isn't re-imported.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ error: 'Google OAuth env vars not set' }, { status: 500 })
  }

  const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
  oauth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN })

  // Eagerly validate the token before doing any work. If the refresh token has
  // expired (common when the OAuth app is in "Testing" mode — 7-day limit) this
  // returns a clear error instead of an empty 500 crash mid-loop.
  try {
    await oauth.getAccessToken()
  } catch (err: any) {
    const detail = err?.message ?? String(err)
    console.error('[import-drafts] Google OAuth token invalid:', detail)
    return NextResponse.json(
      { error: 'Google OAuth token invalid — re-run scripts/reauth-google.mjs to refresh', detail },
      { status: 503 }
    )
  }

  const gmail = google.gmail({ version: 'v1', auth: oauth })

  // List draft ids (drafts.list returns lightweight refs; fetch each for content).
  const list = await gmail.users.drafts.list({ userId: 'me', maxResults: 25 })
  const draftRefs = list.data.drafts ?? []

  const supabase = createServiceClient()
  const results: Array<{ draft: string; status: string; detail?: string }> = []

  for (const ref of draftRefs) {
    const draftId = ref.id!
    try {
      const full = await gmail.users.drafts.get({ userId: 'me', id: draftId, format: 'full' })
      const message = full.data.message
      const headers = message?.payload?.headers ?? []
      const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value ?? ''

      if (!subject.includes('[daily-digest]')) continue

      const bodyText = extractBody(message?.payload)
      if (!bodyText) {
        results.push({ draft: draftId, status: 'skipped', detail: 'empty body' })
        continue
      }

      let essay: any
      try {
        essay = JSON.parse(bodyText.trim())
      } catch {
        results.push({ draft: draftId, status: 'error', detail: 'body not valid JSON' })
        continue
      }

      const { topic, category, title, subtitle, pull_quote, content, sources, word_count, read_time_minutes, published_at } = essay
      if (!title || !content) {
        results.push({ draft: draftId, status: 'error', detail: 'missing title/content' })
        continue
      }

      // Match the essay's topic string back to a topics row. The essay's `topic`
      // field can drift from the queue title (smart quotes, em-dashes, trailing
      // space, the model rephrasing), so try progressively looser matches and
      // finally fall back to the topic the fire claimed as in_progress.
      let topicId: string | null = null
      if (topic) {
        const trimmed = String(topic).trim()
        // 1. Exact (case-insensitive).
        const { data: exact } = await supabase
          .from('topics')
          .select('id')
          .ilike('title', trimmed)
          .limit(1)
        topicId = exact?.[0]?.id ?? null

        // 2. Substring match either direction.
        if (!topicId) {
          const { data: fuzzy } = await supabase
            .from('topics')
            .select('id')
            .ilike('title', `%${trimmed}%`)
            .limit(1)
          topicId = fuzzy?.[0]?.id ?? null
        }
      }

      // 3. Fall back to the topic the fire claimed. When an essay arrives there is
      // normally exactly one in_progress topic — the one written for. This is the
      // safety net that keeps a topic from being stranded in the queue when the
      // title string fails to match.
      if (!topicId) {
        const { data: inProgress } = await supabase
          .from('topics')
          .select('id')
          .eq('status', 'in_progress')
          .order('started_at', { ascending: true })
          .limit(1)
        topicId = inProgress?.[0]?.id ?? null
      }

      // One essay per topic, ever: if this topic already has a paper, the draft
      // is a duplicate (e.g. imported twice). Delete it and skip.
      if (topicId) {
        const { data: existing } = await supabase
          .from('papers')
          .select('id')
          .eq('topic_id', topicId)
          .limit(1)
        if (existing && existing.length > 0) {
          await gmail.users.drafts.delete({ userId: 'me', id: draftId })
          results.push({ draft: draftId, status: 'skipped', detail: 'topic already has a paper' })
          continue
        }
      }

      const { data: maxRow } = await supabase
        .from('papers')
        .select('edition_number')
        .order('edition_number', { ascending: false })
        .limit(1)
        .single()
      const editionNumber = (maxRow?.edition_number ?? 0) + 1

      const { data: paper, error } = await supabase
        .from('papers')
        .insert({
          edition_number: editionNumber,
          topic_id: topicId,
          category: normalizeCategory(category),
          title,
          subtitle: subtitle ?? null,
          pull_quote: pull_quote ?? null,
          content,
          sources: sources ?? null,
          word_count: word_count ?? null,
          read_time_minutes: read_time_minutes ?? null,
          published_at: published_at ?? new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        results.push({ draft: draftId, status: 'error', detail: error.message })
        continue
      }

      if (topicId) {
        await supabase.from('topics').update({ status: 'done' }).eq('id', topicId)
      }

      // Imported — delete the draft so it isn't picked up again.
      await gmail.users.drafts.delete({ userId: 'me', id: draftId })

      results.push({ draft: draftId, status: 'imported', detail: `edition ${editionNumber}, paper ${paper.id}` })
    } catch (err) {
      results.push({ draft: draftId, status: 'error', detail: String(err) })
    }
  }

  const imported = results.filter((r) => r.status === 'imported').length
  return NextResponse.json({ scanned: draftRefs.length, imported, results })
}

// The routine emits one of three modes; tolerate casing/whitespace drift and
// store null for anything unrecognized rather than polluting the column.
function normalizeCategory(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  // Routine output modes (direct)
  if (v === 'essay' || v === 'explainer' || v === 'analysis') return v
  // Topic category values echoed back by the routine
  if (v === 'teach_me' || v === 'how_it_works') return 'explainer'
  if (v === 'big_picture' || v === 'debate_this') return 'essay'
  if (v === 'stock_deep_dive') return 'analysis'
  return null
}

// Gmail bodies are base64url-encoded and may be nested in multipart payloads.
// Walk the part tree and return the first text/plain (or text/html) body found.
function extractBody(payload: any): string | null {
  if (!payload) return null

  const decode = (data?: string) =>
    data ? Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8') : null

  if (payload.body?.data && (!payload.parts || payload.parts.length === 0)) {
    return decode(payload.body.data)
  }

  const parts: any[] = payload.parts ?? []
  // Prefer text/plain, fall back to text/html, then recurse.
  const plain = parts.find((p) => p.mimeType === 'text/plain')
  if (plain?.body?.data) return decode(plain.body.data)
  const html = parts.find((p) => p.mimeType === 'text/html')
  if (html?.body?.data) return decode(html.body.data)
  for (const p of parts) {
    const nested = extractBody(p)
    if (nested) return nested
  }
  return null
}

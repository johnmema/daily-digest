import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Nightly trigger. Vercel cron calls this; it picks the top queued topic and
// fires the Claude Code routine with that topic injected as `text`. The routine
// does the research + writing and delivers the essay via the bridge (Drive/email);
// this route does NOT wait for or receive the essay.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fireUrl = process.env.ROUTINE_FIRE_URL
  const fireToken = process.env.ROUTINE_FIRE_TOKEN
  if (!fireUrl || !fireToken) {
    return NextResponse.json(
      { error: 'ROUTINE_FIRE_URL or ROUTINE_FIRE_TOKEN not set' },
      { status: 500 }
    )
  }

  const supabase = createServiceClient()

  // Reaper: a topic goes in_progress at fire time, but if its essay never
  // arrives (session cancelled/failed, draft never made), it would be stuck
  // forever. Reset anything in_progress older than 6h back to queued so it
  // retries on a future run. Nothing is silently lost.
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  await supabase
    .from('topics')
    .update({ status: 'queued', started_at: null })
    .eq('status', 'in_progress')
    .lt('started_at', sixHoursAgo)

  // Idempotency guard 1: if an essay was already published today, today's work
  // is done — skip. This makes the endpoint safe to hit from multiple triggers
  // (cron-job.org, retries, manual) without producing duplicate essays.
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const { data: todaysPapers } = await supabase
    .from('papers')
    .select('id')
    .gte('published_at', startOfDay.toISOString())
    .limit(1)
  if (todaysPapers && todaysPapers.length > 0) {
    return NextResponse.json({ fired: false, reason: 'Already published today' })
  }

  // Idempotency guard 2: if a topic is already in_progress and recent (< 6h),
  // a fire is in flight — don't fire again. (Stale ones were reaped above.)
  const { data: inFlight } = await supabase
    .from('topics')
    .select('id, title')
    .eq('status', 'in_progress')
    .limit(1)
  if (inFlight && inFlight.length > 0) {
    return NextResponse.json({ fired: false, reason: 'A fire is already in progress', topic: inFlight[0].title })
  }

  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('status', 'queued')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)

  const topic = topics?.[0] ?? null
  if (!topic) {
    return NextResponse.json({ fired: false, reason: 'No queued topics' })
  }

  const today = new Date().toISOString().slice(0, 10)
  const text = `Tonight's topic: ${topic.title}

Research this topic deeply with web search (at least 5-8 searches from multiple angles: recent data, academic perspectives, contrarian views, specific examples). Then write a 2,500-3,500 word essay with a short scientific title, a subtitle, a one-sentence pull quote, 5-7 sections with ## headers, your own thesis, and inline citations (Author/Publication, Year).

Title rules — this matters:
- Keep the title SHORT: aim for 2-6 words, hard cap at roughly 60 characters.
- Make it restrained and scientific, like a journal article or a serious magazine feature — not a marketing headline.
- NO colons, NO "How X Does Y", NO "The [Adjective] [Noun]" clickbait constructions, no em-dash subtitle crammed into the title. Name the subject plainly.
- Put any explanatory framing in the SUBTITLE (one descriptive sentence), never in the title.
- Good: "The Energy Cost of AI", "Boredom and the Wandering Mind", "Atlantic Circulation in Decline".
- Bad: "The Digital Carbon Spiral: How Artificial Intelligence Is Reshaping the Planet's Energy and Environmental Balance".

Save the result to the delivery bridge as essay_${today}.json with this exact structure:
{
  "topic": ${JSON.stringify(topic.title)},
  "title": "...",
  "subtitle": "...",
  "pull_quote": "...",
  "content": "...(full markdown with ## headers)...",
  "sources": [{"title": "...", "url": "...", "snippet": "..."}],
  "word_count": <number>,
  "read_time_minutes": <number>,
  "published_at": "${new Date().toISOString()}"
}`

  let fireRes: Response
  try {
    fireRes = await fetch(fireUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${fireToken}`,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'experimental-cc-routine-2026-04-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Fire request failed', detail: String(err) },
      { status: 502 }
    )
  }

  const body = await fireRes.json().catch(() => null)

  if (!fireRes.ok) {
    // Topic stays queued so the next run retries it.
    return NextResponse.json(
      { fired: false, status: fireRes.status, body },
      { status: 502 }
    )
  }

  // Routine started successfully. Claim the topic (with a timestamp so the
  // reaper can recover it if the essay never arrives).
  await supabase
    .from('topics')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', topic.id)

  return NextResponse.json({
    fired: true,
    topic: topic.title,
    session_id: body?.claude_code_session_id ?? null,
    session_url: body?.claude_code_session_url ?? null,
  })
}

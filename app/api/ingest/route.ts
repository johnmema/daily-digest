import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { topic_id, title, subtitle, pull_quote, content, sources, word_count, read_time_minutes } = body

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const supabase = createServiceClient()

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
      topic_id: topic_id ?? null,
      title,
      subtitle,
      pull_quote,
      content,
      sources,
      word_count,
      read_time_minutes,
      published_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[ingest]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (topic_id) {
    await supabase.from('topics').update({ status: 'done' }).eq('id', topic_id)
  }

  console.log(`[ingest] saved paper ${paper.id}, edition ${editionNumber}`)
  return NextResponse.json({ success: true, paper_id: paper.id, edition: editionNumber })
}

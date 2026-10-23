import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { digestAuthorized } from '@/lib/digest-auth'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  if (!digestAuthorized(req.headers.get('authorization'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceClient()
  const [topics, papers, editions] = await Promise.all([
    db.from('topics').select('id,title,category,priority,status,created_at').order('priority', { ascending: false }).order('created_at'),
    db.from('papers').select('id,title,topic_id,published_at,category').order('published_at', { ascending: false }),
    db.from('digest_editions').select('run_date,paper_id,created_at').order('run_date', { ascending: false }).limit(14),
  ])
  if (topics.error || papers.error || editions.error) return NextResponse.json({ error: 'Context unavailable; do not select or publish without full history' }, { status: 503 })
  // Refuse silent PostgREST truncation. Pagination is needed if history grows to this size.
  if ((topics.data?.length ?? 0) >= 1000 || (papers.data?.length ?? 0) >= 1000) return NextResponse.json({ error: 'History pagination required' }, { status: 503 })
  return NextResponse.json({ topics: topics.data, papers: papers.data, editions: editions.data }, { headers: { 'Cache-Control': 'no-store' } })
}

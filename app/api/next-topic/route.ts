import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('status', 'queued')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)

  const topic = topics?.[0] ?? null

  if (topic) {
    await supabase.from('topics').update({ status: 'in_progress' }).eq('id', topic.id)
  }

  return NextResponse.json({ topic })
}

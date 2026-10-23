import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { digestAuthorized } from '@/lib/digest-auth'
import { validateDigest } from '@/lib/digest-payload'
export async function POST(req: NextRequest) {
  if (!digestAuthorized(req.headers.get('authorization'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (Number(req.headers.get('content-length') || 0) > 150000) return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  let payload
  try {
    const raw = await req.text()
    if (Buffer.byteLength(raw) > 150000) return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    payload = validateDigest(JSON.parse(raw))
  } catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid payload' }, { status: 400 }) }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  if (payload.run_date > today) return NextResponse.json({ error: 'Cannot publish a future edition' }, { status: 400 })
  const { data, error } = await createServiceClient().rpc('publish_daily_digest', { payload })
  if (error) {
    console.error('[digest publish]', error.code)
    return NextResponse.json({ error: 'Publication failed; inspect server logs before retrying' }, { status: 500 })
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

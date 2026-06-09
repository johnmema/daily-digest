import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const FALLBACK_SUGGESTIONS = [
  'The economics of open-source software',
  'Why some languages have no word for blue',
  'The hidden history of the QWERTY keyboard',
  'How medieval merchants invented modern finance',
  'The psychology of procrastination',
  'The science of why music gives us chills',
  'How ancient Rome managed its water supply',
  'The rise and fall of the monoculture banana',
  'Why do we dream, and what does it mean?',
  'The surprising history of the color mauve',
]

export async function GET() {
  const supabase = createServiceClient()

  const { data: doneTopics } = await supabase
    .from('topics')
    .select('title')
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(20)

  const done = new Set((doneTopics ?? []).map(t => t.title.toLowerCase()))
  const suggestions = FALLBACK_SUGGESTIONS.filter(s => !done.has(s.toLowerCase())).slice(0, 5)

  return NextResponse.json({ suggestions })
}

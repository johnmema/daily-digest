import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

type Suggestion = { title: string; category: string; reason: string }

const FALLBACK_SUGGESTIONS: Suggestion[] = [
  {
    title: 'Why scientific progress may be slowing',
    category: 'Meta-science',
    reason: "Builds on 'The Quiet Revolution' — you seem drawn to learning curves.",
  },
  {
    title: 'The neuroscience of boredom',
    category: 'Neuroscience',
    reason: 'Pairs with your attention-economy and sleep reads.',
  },
  {
    title: 'How cities could be redesigned for silence',
    category: 'Urbanism · Design',
    reason: "A counterpoint to today's urban-scaling edition.",
  },
  {
    title: 'The economics of open-source software',
    category: 'Economics',
    reason: "Who pays, and why the commons doesn't collapse.",
  },
  {
    title: 'Why some languages have no word for blue',
    category: 'Linguistics',
    reason: 'How color terms differ across cultures.',
  },
  {
    title: 'How medieval merchants invented modern finance',
    category: 'History',
    reason: 'The ledger as a technology of trust.',
  },
  {
    title: 'The science of why music gives us chills',
    category: 'Neuroscience',
    reason: 'Pairs with your reads on emotion and the brain.',
  },
  {
    title: 'The rise and fall of the monoculture banana',
    category: 'Biology',
    reason: 'A story about fragility hiding in the food supply.',
  },
  {
    title: 'Why do we dream, and what does it mean?',
    category: 'Neuroscience',
    reason: 'Connects to your sleep and memory reading.',
  },
  {
    title: 'The thermodynamics of life itself',
    category: 'Physics',
    reason: 'Connects to your reads on mitochondria and cities.',
  },
]

export async function GET() {
  const supabase = createServiceClient()

  // Exclude anything already written or sitting in the queue so suggestions
  // never duplicate what the user can already see.
  const { data: existingTopics } = await supabase.from('topics').select('title')

  const taken = new Set((existingTopics ?? []).map(t => t.title.toLowerCase()))
  const available = FALLBACK_SUGGESTIONS.filter(s => !taken.has(s.title.toLowerCase()))

  // Shuffle so the same three don't appear every time the queue page loads.
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[available[i], available[j]] = [available[j], available[i]]
  }

  const suggestions = available.slice(0, 3)

  return NextResponse.json({ suggestions })
}

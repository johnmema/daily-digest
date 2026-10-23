import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import JournalReader from '@/components/JournalReader'
import type { Paper, ReadingProgress, Annotation } from '@/types'

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: paper }, { data: progress }, { data: annotations }] = await Promise.all([
    supabase.from('papers').select('*').eq('id', id).single(),
    supabase.from('reading_progress').select('*').eq('paper_id', id).single(),
    supabase.from('annotations').select('*').eq('paper_id', id).order('created_at'),
  ])

  if (!paper) notFound()

  const { data: following } = await supabase.from('papers').select('*').lt('published_at', paper.published_at).order('published_at', {ascending:false}).limit(1)

  return (
    <JournalReader
      paper={paper as Paper}
      next={(following?.[0] as Paper) ?? null}
      progress={progress as ReadingProgress | null}
      annotations={(annotations ?? []) as Annotation[]}
    />
  )
}

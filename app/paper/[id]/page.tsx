import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ReadingView from '@/components/ReadingView'
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

  return (
    <ReadingView
      paper={paper as Paper}
      initialProgress={progress as ReadingProgress | null}
      initialAnnotations={(annotations ?? []) as Annotation[]}
    />
  )
}

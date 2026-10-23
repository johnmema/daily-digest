import { createServerSupabaseClient } from '@/lib/supabase-server'
import PaperGrid from '@/components/PaperGrid'
import type { Paper } from '@/types'

export default async function LibraryPage() {
  const supabase = await createServerSupabaseClient()

  const { data: papers } = await supabase
    .from('papers')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50)
  const all = (papers ?? []) as Paper[]

  return <div className="max-w-[1200px] mx-auto px-6 py-12"><h1 className="font-serif text-4xl mb-8">Archive</h1><PaperGrid initialPapers={all}/></div>
}

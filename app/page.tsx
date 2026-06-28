import { createServerSupabaseClient } from '@/lib/supabase-server'
import PaperGrid from '@/components/PaperGrid'
import type { Paper } from '@/types'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  const { data: papers } = await supabase
    .from('papers')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50)
  const all = (papers ?? []) as Paper[]

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-12">
      <div className="flex items-center gap-6 mb-8">
        <h2 className="font-serif text-[34px] font-light text-[#000000] lowercase shrink-0 leading-none">library</h2>
        <div className="flex-1 border-t border-[#1a1a1a] mt-2" />
      </div>
      <PaperGrid initialPapers={all} />
    </div>
  )
}

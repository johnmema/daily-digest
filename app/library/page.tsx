import { createServerSupabaseClient } from '@/lib/supabase-server'
import PaperCard from '@/components/PaperCard'
import type { Paper } from '@/types'

export default async function LibraryPage() {
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

      {all.length === 0 ? (
        <p className="text-[#6b6b6b] text-sm py-8">
          No papers yet — the archive will fill up over time.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {all.map(paper => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  )
}

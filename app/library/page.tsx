import { createServerSupabaseClient } from '@/lib/supabase-server'
import PaperCard from '@/components/PaperCard'
import type { Paper } from '@/types'

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('papers')
    .select('*')
    .order('published_at', { ascending: false })

  if (q) {
    query = query.or(`title.ilike.%${q}%,subtitle.ilike.%${q}%,content.ilike.%${q}%`)
  }

  const { data: papers } = await query.limit(50)
  const all = (papers ?? []) as Paper[]

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <span className="font-serif text-2xl text-[#1a1a1a] shrink-0">library</span>
        <div className="flex-1 border-t border-[#e8e5e0]" />
      </div>

      {/* Search */}
      <form method="get" className="mb-10">
        <div className="flex gap-0 max-w-lg">
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search papers…"
            className="flex-1 border border-[#e8e5e0] bg-white px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#c8c5c0] outline-none focus:border-[#1a1a1a] transition-colors"
          />
          <button
            type="submit"
            className="border border-l-0 border-[#e8e5e0] bg-white px-4 py-2.5 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#f9f7f4] transition-colors"
          >
            Search
          </button>
          {q && (
            <a
              href="/library"
              className="border border-l-0 border-[#e8e5e0] bg-white px-4 py-2.5 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
            >
              Clear
            </a>
          )}
        </div>
        {q && (
          <p className="mt-2 text-xs text-[#6b6b6b]">
            {all.length} result{all.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
          </p>
        )}
      </form>

      {all.length === 0 ? (
        <p className="text-[#6b6b6b] text-sm py-8">
          {q ? 'No papers match that search.' : 'No papers yet — the archive will fill up over time.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#e8e5e0]">
          {all.map(paper => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  )
}

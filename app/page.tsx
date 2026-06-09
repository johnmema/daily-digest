import { createServerSupabaseClient } from '@/lib/supabase-server'
import PaperCard from '@/components/PaperCard'
import type { Paper } from '@/types'

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="font-sans text-[11px] uppercase tracking-widest text-[#6b6b6b] shrink-0">{label}</span>
      <div className="flex-1 border-t border-[#e8e5e0]" />
    </div>
  )
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: papers } = await supabase
    .from('papers')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(10)

  const all = (papers ?? []) as Paper[]
  const [today, ...rest] = all
  const recent = rest.slice(0, 6)

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-12">
      {all.length === 0 ? (
        <div className="py-32 text-center">
          <p className="font-serif text-4xl font-bold text-[#1a1a1a] mb-4">No papers yet.</p>
          <p className="font-sans text-[#6b6b6b] text-sm">
            Add topics to your{' '}
            <a href="/queue" className="underline underline-offset-2 hover:text-[#1a1a1a] transition-colors">queue</a>
            {' '}and the first edition will appear here overnight.
          </p>
        </div>
      ) : (
        <>
          <section className="mb-16">
            <SectionDivider label="latest edition" />
            {today && <PaperCard paper={today} featured />}
          </section>

          {recent.length > 0 && (
            <section className="mb-16">
              <SectionDivider label="recent" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#e8e5e0]">
                {recent.map(paper => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

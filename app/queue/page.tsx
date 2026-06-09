import { createServerSupabaseClient } from '@/lib/supabase-server'
import TopicQueue from '@/components/TopicQueue'
import type { Topic } from '@/types'

export default async function QueuePage() {
  const supabase = await createServerSupabaseClient()
  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-12">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-serif text-2xl text-[#1a1a1a] shrink-0">queue</span>
        <div className="flex-1 border-t border-[#e8e5e0]" />
      </div>
      <p className="text-sm text-[#6b6b6b] mb-10">
        You&apos;re the commissioning editor. Add topics, set the order. The agent writes overnight.
      </p>

      <div className="max-w-2xl">
        <TopicQueue initialTopics={(topics ?? []) as Topic[]} />
      </div>
    </div>
  )
}

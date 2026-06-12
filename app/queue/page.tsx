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
      <div className="flex items-center gap-6 mb-12">
        <h2 className="font-serif text-[34px] font-light text-[#000000] lowercase shrink-0 leading-none">queue</h2>
        <div className="flex-1 border-t border-[#1a1a1a] mt-2" />
      </div>

      <div className="max-w-2xl">
        <TopicQueue initialTopics={(topics ?? []) as Topic[]} />
      </div>
    </div>
  )
}

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
      <TopicQueue initialTopics={(topics ?? []) as Topic[]} />
    </div>
  )
}

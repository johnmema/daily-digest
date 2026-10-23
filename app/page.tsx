import { createServerSupabaseClient } from '@/lib/supabase-server'
import CoverFlow from '@/components/CoverFlow'
import type { Paper } from '@/types'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  const { data: papers } = await supabase
    .from('papers')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50)
  const all = (papers ?? []) as Paper[]

  return <CoverFlow papers={all} />
}

import {createServerSupabaseClient} from '@/lib/supabase-server'
import PhotoStudy from '@/components/PhotoStudy'
import type {Paper} from '@/types'
export const metadata={title:'Daily Digest | Photo directions',robots:{index:false,follow:false}}
export default async function PhotoStudyPage({searchParams}:{searchParams:Promise<{direction?:string}>}){
 const {direction}=await searchParams
 const db=await createServerSupabaseClient()
 const {data}=await db.from('papers').select('*').order('published_at',{ascending:false}).limit(3)
 return <PhotoStudy initialDirection={direction} papers={(data??[]) as Paper[]}/>
}

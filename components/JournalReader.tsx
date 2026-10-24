'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import JournalArticle from './JournalArticle'
import type {Paper,ReadingProgress,Annotation} from '@/types'
export default function JournalReader({paper,next,progress,annotations}:{paper:Paper;next:Paper|null;progress:ReadingProgress|null;annotations:Annotation[]}) {
 const router=useRouter()
 const [closing,setClosing]=useState(false)
 const back=(id:string)=>{if(closing)return;window.scrollTo({top:0,behavior:'instant'});setClosing(true);setTimeout(()=>router.push(`/?edition=${id}`,{scroll:false}),matchMedia('(prefers-reduced-motion: reduce)').matches?0:800)}
 return <JournalArticle paper={paper} next={next} progress={progress} annotations={annotations} closing={closing} onReturn={()=>back(paper.id)} onNext={()=>back(next?.id??paper.id)}/>
}

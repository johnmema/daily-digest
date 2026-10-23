'use client'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import Cover,{coverArt} from './Cover'
import type {Paper} from '@/types'
import {formatDateShort} from '@/lib/utils'
export default function CoverFlow({papers}:{papers:Paper[]}) {
 const [active,setActive]=useState(0)
 const refs=useRef<(HTMLElement|null)[]>([])
 useEffect(()=>{
  document.documentElement.classList.add('cover-browsing')
  const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setActive(Number((e.target as HTMLElement).dataset.index))}),{threshold:.55})
  refs.current.forEach(e=>e&&obs.observe(e))
  const selected=new URLSearchParams(location.search).get('edition')
  if(selected)requestAnimationFrame(()=>refs.current[papers.findIndex(p=>p.id===selected)]?.scrollIntoView({behavior:'instant'}))
  return ()=>{obs.disconnect();document.documentElement.classList.remove('cover-browsing')}
 },[papers])
 return <div className="journal-flow" style={{background:coverArt(papers[active])?.wash??'#dddcd3'}}>
  <nav className="journal-nav"><Link href="/library">Archive</Link><Link href="/queue">Queue</Link></nav>
  {papers.map((p,i)=><section className="journal-panel" key={p.id} data-index={i} ref={e=>{refs.current[i]=e}}>
   <Link className="journal-cover-link" href={`/paper/${p.id}`} aria-label={`Read ${p.title}`}><Cover paper={p}/></Link>
   <div className="journal-readout journal-date">{formatDateShort(p.published_at)}</div><div className="journal-readout journal-number">No. {p.edition_number}</div>
  </section>)}
  {!papers.length&&<div className="journal-empty">No editions yet.</div>}
 </div>
}

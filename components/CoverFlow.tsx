'use client'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import Cover,{coverArt,type CoverArt} from './Cover'
import JournalArticle from './JournalArticle'
import type {Paper} from '@/types'
import {formatDateShort} from '@/lib/utils'
export default function CoverFlow({papers,artOverrides,studyPath}:{papers:Paper[];artOverrides?:Record<string,CoverArt>;studyPath?:string}) {
 const artFor=(p:Paper)=>artOverrides?.[p.id]??coverArt(p)
 const browsePath=studyPath??'/'
 const articlePath=(p:Paper)=>studyPath?`${studyPath}&reading=${p.id}`:`/paper/${p.id}`
 const [active,setActive]=useState(0)
 const [open,setOpen]=useState<number|null>(null)
 const [closing,setClosing]=useState(false)
 const refs=useRef<(HTMLElement|null)[]>([])
 const closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
 const restore=useRef<number|null>(null)
 useEffect(()=>{
  document.documentElement.classList.toggle('cover-browsing',open===null)
  if(open!==null)return
  const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setActive(Number((e.target as HTMLElement).dataset.index))}),{threshold:.55})
  refs.current.forEach(e=>e&&obs.observe(e))
  const selected=new URLSearchParams(location.search).get('edition')
  const idx=restore.current??(selected?papers.findIndex(p=>p.id===selected):-1)
  if(idx>=0)requestAnimationFrame(()=>{refs.current[idx]?.scrollIntoView({behavior:'instant'});setActive(idx);restore.current=null})
  return()=>{obs.disconnect();document.documentElement.classList.remove('cover-browsing')}
 },[papers,open])
 useEffect(()=>()=>{if(closeTimer.current)clearTimeout(closeTimer.current)},[])
 const finishReturn=(idx:number)=>{restore.current=idx;setActive(idx);setOpen(null);setClosing(false);if(!studyPath)history.replaceState(null,'',`${browsePath}?edition=${papers[idx].id}`)}
 const returnToBrowse=(idx=open??active)=>{
  if(closing)return
  window.scrollTo({top:0,behavior:'instant'})
  setClosing(true)
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
  closeTimer.current=setTimeout(()=>finishReturn(idx),reduced?0:800)
 }
 useEffect(()=>{
  const pop=()=>{
   const i=papers.findIndex(p=>(studyPath?new URLSearchParams(location.search).get('reading')===p.id:location.pathname===`/paper/${p.id}`))
   if(i>=0){setOpen(i);setActive(i);window.scrollTo({top:0,behavior:'instant'})}
   else if(open!==null)returnToBrowse(open)
  }
  window.addEventListener('popstate',pop)
  return()=>window.removeEventListener('popstate',pop)
 },[open,closing,papers])
 const read=(i:number)=>{
  if(open!==null)return
  setActive(i);setOpen(i);setClosing(false)
  if(!studyPath)history.pushState(null,'',articlePath(papers[i]))
  window.scrollTo({top:0,behavior:'instant'})
 }
 if(open!==null){const p=papers[open];return <JournalArticle paper={p} next={papers[open+1]??null} onReturn={()=>returnToBrowse(open)} onNext={()=>returnToBrowse(Math.min(open+1,papers.length-1))} closing={closing} artOverride={artOverrides?.[p.id]} preview={!!studyPath} annotations={studyPath?[]:undefined}/>}
 return <div className="journal-flow" style={{background:'#fff'}}>
  {!studyPath&&<nav className="journal-nav"><Link href="/library">Archive</Link><Link href="/queue">Queue</Link></nav>}
  {papers.map((p,i)=><section className="journal-panel" key={p.id} data-index={i} ref={e=>{refs.current[i]=e}}>
   <a className="journal-cover-link" href={articlePath(p)} onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&e.button===0){e.preventDefault();read(i)}}} aria-label={`Read ${p.title}`}><Cover paper={p} artOverride={artOverrides?.[p.id]}/></a>
   <div className="journal-readout journal-date">{formatDateShort(p.published_at)}</div><div className="journal-readout journal-number">No. {p.edition_number}</div>
  </section>)}
  {!papers.length&&<div className="journal-empty">No editions yet.</div>}
 </div>
}

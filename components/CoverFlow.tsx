'use client'
import {useEffect,useRef,useState,type CSSProperties} from 'react'
import Link from 'next/link'
import Cover,{coverArt,type CoverArt} from './Cover'
import JournalArticle from './JournalArticle'
import type {Paper} from '@/types'
import {formatDateShort} from '@/lib/utils'
const coverPalette=['#f1e9df','#e6edf1','#eee6ed','#e6ece0','#f2e5de','#e1ece8','#ece8f2','#f1edda']
function coverBackground(id:string){let hash=2166136261;for(const char of id)hash=Math.imul(hash^char.charCodeAt(0),16777619);return coverPalette[(hash>>>0)%coverPalette.length]}
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
  let frame=0
  let settle:ReturnType<typeof setTimeout>|null=null
  const update=()=>{
   frame=0
   const height=refs.current[0]?.offsetHeight||innerHeight
   const position=scrollY/height
   refs.current.forEach((panel,i)=>{
    if(!panel)return
    const link=panel.querySelector<HTMLElement>('.journal-cover-link')
    const progress=Math.max(0,Math.min(1,(position-i-.35)/.65))
    if(link)link.style.transform=`translateY(${-12*progress}px)`
    panel.style.visibility=i<Math.floor(position)-1?'hidden':'visible'
   })
  }
  const onScroll=()=>{
   if(!frame)frame=requestAnimationFrame(update)
   if(settle)clearTimeout(settle)
   settle=setTimeout(()=>{
    const height=refs.current[0]?.offsetHeight||innerHeight
    const index=Math.round(scrollY/height)
    if(Math.abs(scrollY/height-index)<.006)setActive(Math.max(0,Math.min(papers.length-1,index)))
    else window.scrollTo({top:index*height,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
   },200)
  }
  window.addEventListener('scroll',onScroll,{passive:true})
  window.addEventListener('resize',onScroll)
  update()
  const selected=new URLSearchParams(location.search).get('edition')
  const idx=restore.current??(selected?papers.findIndex(p=>p.id===selected):-1)
  if(idx>=0)requestAnimationFrame(()=>{window.scrollTo({top:idx*(refs.current[0]?.offsetHeight||innerHeight),behavior:'instant'});update();setActive(idx);restore.current=null})
  return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);cancelAnimationFrame(frame);if(settle)clearTimeout(settle);document.documentElement.classList.remove('cover-browsing')}
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
 return <div className="journal-flow" style={{background:coverBackground(papers[active]?.id??''),'--cover-background':coverBackground(papers[active]?.id??'')} as CSSProperties}>
  {!studyPath&&<nav className="journal-nav"><Link href="/library">Archive</Link><Link href="/queue">Queue</Link></nav>}
  {papers.map((p,i)=><section className="journal-panel" key={p.id} data-index={i} style={{zIndex:i+1}} ref={e=>{refs.current[i]=e}}>
   <a className="journal-cover-link" tabIndex={i===active?0:-1} href={articlePath(p)} onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&e.button===0){e.preventDefault();read(i)}}} aria-label={`Read ${p.title}`}><Cover paper={p} artOverride={artOverrides?.[p.id]}/></a>
  </section>)}
  {!!papers.length&&<div className="journal-feed-info" aria-live="polite" aria-atomic="true"><div className="journal-readout journal-date">{formatDateShort(papers[active].published_at)}</div><div className="journal-readout journal-number">No. {papers[active].edition_number}</div></div>}
  {!papers.length&&<div className="journal-empty">No editions yet.</div>}
 </div>
}

'use client'
import Link from 'next/link'
import {useEffect} from 'react'
import Cover,{coverArt} from './Cover'
import ReadingView from './ReadingView'
import type {Paper,ReadingProgress,Annotation} from '@/types'
export default function JournalReader({paper,next,progress,annotations}:{paper:Paper;next:Paper|null;progress:ReadingProgress|null;annotations:Annotation[]}) {
 const art=coverArt(paper)
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')location.href=`/?edition=${paper.id}`};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[paper.id])
 return <div className="journal-reading" style={{background:art?.wash??'#dddcd3'}}>
  <Link className="journal-close" href={`/?edition=${paper.id}`} scroll={false}>Close</Link>
  <div className="journal-reader-cover"><Link href={`/?edition=${paper.id}`} scroll={false} aria-label="Close essay"><Cover paper={paper} small/></Link></div>
  <ReadingView paper={paper} initialProgress={progress} initialAnnotations={annotations} embedded/>
  <footer className="journal-reader-footer">
   {art?.credit&&<p className="journal-credit">{art.credit}</p>}
   {next?<Link className="journal-next" href={`/?edition=${next.id}`}>Next: {next.title}</Link>:<Link className="journal-next" href={`/?edition=${paper.id}`}>Back to the covers</Link>}
  </footer>
 </div>
}

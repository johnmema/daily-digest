'use client'
import {useEffect,useState} from 'react'
import Cover,{coverArt,type CoverArt} from './Cover'
import ReadingView from './ReadingView'
import type {Paper,ReadingProgress,Annotation} from '@/types'
import {createClient} from '@/lib/supabase'
import {coverBackground} from '@/lib/cover-background'
export default function JournalArticle({paper,next,onReturn,onNext,progress,annotations,closing=false,artOverride,preview=false}:{paper:Paper;next:Paper|null;onReturn:()=>void;onNext:()=>void;progress?:ReadingProgress|null;annotations?:Annotation[];closing?:boolean;artOverride?:CoverArt;preview?:boolean}) {
 const art=artOverride??coverArt(paper)
 const [data,setData]=useState<{progress:ReadingProgress|null;annotations:Annotation[]}|null>(annotations?{progress:progress??null,annotations}:null)
 useEffect(()=>{
  if(annotations)return
  let alive=true
  const db=createClient()
  Promise.all([db.from('reading_progress').select('*').eq('paper_id',paper.id).maybeSingle(),db.from('annotations').select('*').eq('paper_id',paper.id).order('created_at')]).then(([p,a])=>{if(alive)setData({progress:p.data,annotations:a.data??[]})})
  return()=>{alive=false}
 },[paper.id,annotations])
 return <div className={`journal-detail${closing?' is-closing':''}`} style={{background:coverBackground(paper.id)}}>
  <div className="journal-sticky-hero"><button className="journal-return-cover" onClick={onReturn} aria-label="Back to editions"><Cover paper={paper} artOverride={artOverride}/>{art?.location&&<span className="journal-photo-location">{art.location}</span>}</button></div>
  <div className="journal-reveal-sheet">
   {data?<ReadingView key={paper.id} paper={paper} initialProgress={data.progress} initialAnnotations={data.annotations} embedded preview={preview}/>:<div className="journal-loading" aria-live="polite">Loading essay</div>}
   <footer className="journal-reader-footer">
    {!preview&&<button className="journal-share" onClick={()=>{const url=`${location.origin}/paper/${paper.id}`;if(navigator.share)navigator.share({title:paper.title,url}).catch(()=>{});else navigator.clipboard.writeText(url)}}>Share essay</button>}
    {art?.credit&&<p className="journal-credit">{art?.credit} {art?.award&&<>{art.award}. </>}{art?.awardUrl&&<><a href={art.awardUrl} target="_blank" rel="noreferrer">Award results</a>{" · "}</>}{art?.creditUrl&&<a href={art?.creditUrl} target="_blank" rel="noreferrer">Source</a>}{" · "}{art?.licenseUrl&&<a href={art?.licenseUrl} target="_blank" rel="noreferrer">{art?.licenseLabel}</a>}</p>}
    <button className="journal-next" onClick={onNext}>{next?`Next: ${next.title}`:'Back to the editions'}</button>
   </footer>
  </div>
 </div>
}

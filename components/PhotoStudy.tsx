'use client'
import {useState} from 'react'
import Link from 'next/link'
import CoverFlow from './CoverFlow'
import study from '@/lib/photo-study.json'
import type {CoverArt} from './Cover'
import type {Paper} from '@/types'
type Direction='nature'|'monochrome'|'awarded'
type Photo={image:string;photographer:string;title:string;source:string;license:string;licenseUrl:string;award?:string;awardUrl?:string}
const labels:Record<Direction,string>={nature:'Nature',monochrome:'Black & white',awarded:'Award winners'}
export default function PhotoStudy({papers,initialDirection}:{papers:Paper[];initialDirection?:string}){
 const [direction,setDirection]=useState<Direction>(()=>['nature','monochrome','awarded'].includes(initialDirection??'')?initialDirection as Direction:'nature')
 const [credits,setCredits]=useState(false)
 const photos=study[direction] as Photo[]
 const overrides:Record<string,CoverArt>={}
 papers.forEach((p,i)=>{const photo=photos[i];if(photo)overrides[p.id]={image:photo.image,wash:'#dfded6',spine:'#263a31',credit:`${photo.title} - ${photo.photographer}. Cover crop and darkening applied. ${photo.license} applies to the photo only.`,creditUrl:photo.source,licenseUrl:photo.licenseUrl,licenseLabel:photo.license}})
 const change=(value:Direction)=>{setDirection(value);setCredits(false);history.replaceState(null,'',`/photo-study?direction=${value}`);window.scrollTo({top:0,behavior:'instant'})}
 return <div className="photo-study">
  <header className="photo-study-toolbar"><div className="photo-study-caption"><Link href="/">Daily Digest</Link><span>Photo direction study</span><button onClick={()=>setCredits(!credits)} aria-expanded={credits}>Photo notes</button></div><nav aria-label="Photography direction">{(Object.keys(labels) as Direction[]).map(d=><button key={d} aria-pressed={direction===d} onClick={()=>change(d)}>{labels[d]}</button>)}</nav></header>
  {credits&&<aside className="photo-study-notes"><p>Same three editions, type, size and background. Only the photography changes. Swipe between editions; tap a cover to open.</p>{photos.map(photo=><p key={photo.image}><strong>{photo.title}</strong><br/>{photo.photographer}{photo.award&&<>. {photo.award}</>}<br/><a href={photo.source} target="_blank" rel="noreferrer">Photo source</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>{photo.awardUrl&&<> · <a href={photo.awardUrl} target="_blank" rel="noreferrer">Award results</a></>}<br/>Cover crop and darkening applied. Photo license does not apply to the essay or app.</p>)}</aside>}
  {photos.length===papers.length&&papers.length>0?<CoverFlow key={direction} papers={papers} artOverrides={overrides} studyPath={`/photo-study?direction=${direction}`}/>:<div className="journal-empty">This photo direction is being prepared.</div>}
 </div>
}

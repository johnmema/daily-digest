import art from '@/lib/cover-art.json'
import type { Paper } from '@/types'
export type CoverArt = {image:string;wash:string;spine:string;credit?:string;creditUrl?:string;licenseUrl?:string;licenseLabel?:string}
export function coverArt(paper: Paper | undefined) {
  return (art as Record<string, {image:string;wash:string;spine:string;credit?:string;creditUrl?:string;licenseUrl?:string;licenseLabel?:string}>)[paper?.id ?? '']
}
export default function Cover({paper, small = false, artOverride}: {paper:Paper;small?:boolean;artOverride?:CoverArt}) {
  const a = artOverride ?? coverArt(paper)
  return <div className={`journal-cover${small ? ' small' : ''}`} style={{background:a?.spine ?? '#23483d'}}>
    {a && <img src={a.image} alt="" loading="lazy" className="journal-photo" />}
    <div className="journal-spine" style={{background:a?.spine ?? '#23483d'}} />
    <div className="journal-scrim" />
    <div className="journal-title">{paper.title.split(/(GLP-1)/g).map((s,i)=>s==='GLP-1'?<span key={i} style={{whiteSpace:'nowrap'}}>{s}</span>:s)}</div>
  </div>
}

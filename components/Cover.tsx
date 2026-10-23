import art from '@/lib/cover-art.json'
import type { Paper } from '@/types'
export type CoverArt = {image:string;wash:string;spine:string;credit?:string;creditUrl?:string;licenseUrl?:string;licenseLabel?:string;award?:string;awardUrl?:string;position?:string;location?:string}
export function coverArt(paper: Paper | undefined) {
  return (art as Record<string, {image:string;wash:string;spine:string;credit?:string;creditUrl?:string;licenseUrl?:string;licenseLabel?:string;award?:string;awardUrl?:string;position?:string;location?:string}>)[paper?.id ?? '']
}
export default function Cover({paper, small = false, artOverride}: {paper:Paper;small?:boolean;artOverride?:CoverArt}) {
  const a = artOverride ?? coverArt(paper)
  return <div className={`journal-cover${small ? ' small' : ''}`} style={{background:'#f3f3f3'}}>
    {a && <img src={a.image} alt="" loading="lazy" className="journal-photo" style={{objectPosition:a.position??'50% 50%'}} />}
  </div>
}

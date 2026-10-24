import art from '@/lib/cover-art.json'
import type { Paper } from '@/types'
export type CoverArt = {image:string;wash:string;spine:string;credit?:string;creditUrl?:string;licenseUrl?:string;licenseLabel?:string;award?:string;awardUrl?:string;position?:string;location?:string}
export function coverArt(paper: Paper | undefined) {
  const all = art as Record<string, CoverArt>
  const id = paper?.id ?? ''
  if (all[id]) return all[id]
  if (!id) return undefined
  // New editions have no mapped photograph yet: reuse one of the credited archive photos, chosen stably from the id.
  const pool = Object.keys(all).sort()
  let h = 2166136261
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return all[pool[(h >>> 0) % pool.length]]
}
export default function Cover({paper, small = false, artOverride}: {paper:Paper;small?:boolean;artOverride?:CoverArt}) {
  const a = artOverride ?? coverArt(paper)
  return <div className={`journal-cover${small ? ' small' : ''}`} style={{background:'#f3f3f3'}}>
    {a && <img src={a.image} alt="" loading="lazy" className="journal-photo" style={{objectPosition:a.position??'50% 50%'}} />}
  </div>
}

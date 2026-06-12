import Link from 'next/link'
import type { Paper } from '@/types'
import { formatDate, excerpt } from '@/lib/utils'

interface PaperCardProps {
  paper: Paper
}

export default function PaperCard({ paper }: PaperCardProps) {
  return (
    <Link href={`/paper/${paper.id}`} className="block group">
      <article className="bg-[#f8f8f8] p-4 h-full flex flex-col transition-colors duration-200 group-hover:bg-[#f1f1f1]">
        <div className="text-[13px] font-sans text-[#6b6b6b] mb-4">
          {formatDate(paper.published_at)}
        </div>

        <h3 className="font-serif text-[22px] font-light text-[#000000] leading-[1.15] mb-4 decoration-[#000000]/40">
          {paper.title}
        </h3>

        <p className="font-sans text-[14px] text-[#1a1a1a] leading-[1.55] flex-1 mb-5">
          {excerpt(paper.content, 280)}
        </p>

        <span className="inline-flex items-center gap-1.5 font-sans text-[13px] font-bold text-[#6b6b6b] transition-colors duration-200 group-hover:text-[#000000]">
          read more
          <span className="transition-transform duration-200 group-hover:translate-x-1">›</span>
        </span>
      </article>
    </Link>
  )
}

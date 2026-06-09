import Link from 'next/link'
import type { Paper } from '@/types'
import { formatDate, excerpt } from '@/lib/utils'

interface PaperCardProps {
  paper: Paper
  featured?: boolean
}

export default function PaperCard({ paper, featured = false }: PaperCardProps) {
  if (featured) {
    return (
      <Link href={`/paper/${paper.id}`} className="block group">
        <article className="border border-[#e8e5e0] bg-white p-10 hover:border-[#1a1a1a] transition-colors duration-200">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b]">
              No. {paper.edition_number}
            </span>
            <span className="text-[#e8e5e0]">·</span>
            <span className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b]">
              {formatDate(paper.published_at)}
            </span>
            {paper.read_time_minutes && (
              <>
                <span className="text-[#e8e5e0]">·</span>
                <span className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b]">
                  {paper.read_time_minutes} min read
                </span>
              </>
            )}
          </div>

          <h2 className="font-serif text-5xl font-bold text-[#1a1a1a] leading-[1.1] mb-4 group-hover:text-[#3a3a3a] transition-colors">
            {paper.title}
          </h2>

          {paper.subtitle && (
            <p className="font-sans text-xl text-[#6b6b6b] leading-relaxed mb-6 max-w-2xl">
              {paper.subtitle}
            </p>
          )}

          {paper.pull_quote && (
            <blockquote className="border-l-2 border-[#1a1a1a] pl-5 my-6 font-serif text-lg italic text-[#3a3a3a] leading-relaxed max-w-2xl">
              {paper.pull_quote}
            </blockquote>
          )}

          <div className="flex items-center gap-2 mt-8">
            <span className="font-sans text-sm text-[#1a1a1a] tracking-wide">read essay</span>
            <span className="text-[#1a1a1a] group-hover:translate-x-1 transition-transform inline-block">→</span>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/paper/${paper.id}`} className="block group">
      <article className="border border-[#e8e5e0] bg-white p-6 h-full flex flex-col hover:border-[#1a1a1a] transition-colors duration-200">
        <div className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b] mb-4">
          {formatDate(paper.published_at)}
        </div>

        <h3 className="font-serif text-[22px] font-bold text-[#1a1a1a] leading-tight mb-3 group-hover:text-[#3a3a3a] transition-colors">
          {paper.title}
        </h3>

        {paper.subtitle && (
          <p className="font-sans text-sm text-[#6b6b6b] leading-relaxed mb-3">
            {paper.subtitle}
          </p>
        )}

        <p className="font-sans text-sm text-[#3a3a3a] leading-relaxed flex-1 mb-5">
          {excerpt(paper.content, 160)}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#e8e5e0]">
          <span className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b]">
            {paper.read_time_minutes ? `${paper.read_time_minutes} min` : ''}
          </span>
          <span className="flex items-center gap-1 font-sans text-xs text-[#1a1a1a] group-hover:gap-2 transition-all">
            read <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
          </span>
        </div>
      </article>
    </Link>
  )
}

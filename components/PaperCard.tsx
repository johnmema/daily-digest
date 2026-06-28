'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import type { Paper } from '@/types'
import { formatDate, excerpt } from '@/lib/utils'

interface PaperCardProps {
  paper: Paper
  onDelete?: (id: string) => void
}

export default function PaperCard({ paper, onDelete }: PaperCardProps) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const handleDelete = async () => {
    setMenu(null)
    await fetch(`/api/papers/${paper.id}`, { method: 'DELETE' })
    onDelete?.(paper.id)
  }

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  return (
    <>
      <Link href={`/paper/${paper.id}`} className="block group" onContextMenu={handleContextMenu}>
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

      {menu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
          <div
            ref={menuRef}
            className="fixed z-20 bg-white border border-[#e0e0e0] py-1 min-w-35"
            style={{ top: menu.y, left: menu.x }}
          >
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-[#000000] hover:bg-[#f8f8f8] transition-colors"
            >
              Delete paper
            </button>
          </div>
        </>
      )}
    </>
  )
}

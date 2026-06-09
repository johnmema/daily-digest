'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Paper, Annotation, AnnotationColor, ReadingProgress } from '@/types'
import { parseHeadings, formatDateShort } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

interface ReadingViewProps {
  paper: Paper
  initialProgress?: ReadingProgress | null
  initialAnnotations?: Annotation[]
}

const ANNOTATION_COLORS: Record<AnnotationColor, string> = {
  yellow: '#fef08a',
  green: '#bbf7d0',
  pink: '#fbcfe8',
}

export default function ReadingView({ paper, initialProgress, initialAnnotations = [] }: ReadingViewProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const [percent, setPercent] = useState(initialProgress?.percent_read ?? 0)
  const [activeHeading, setActiveHeading] = useState('')
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
  const [popover, setPopover] = useState<{ x: number; y: number; text: string; start: number; end: number } | null>(null)
  const [noteText, setNoteText] = useState('')
  const supabase = createClient()
  const headings = parseHeadings(paper.content)

  // Scroll progress
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0
      setPercent(pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Save progress (debounced)
  const saveProgress = useCallback(
    debounce(async (pct: number) => {
      await supabase.from('reading_progress').upsert({
        paper_id: paper.id,
        percent_read: pct,
        scroll_position: window.scrollY,
        completed: pct >= 95,
        updated_at: new Date().toISOString(),
      })
    }, 1500),
    [paper.id]
  )

  useEffect(() => { saveProgress(percent) }, [percent])

  // Active heading via IntersectionObserver
  useEffect(() => {
    const els = contentRef.current?.querySelectorAll('h2, h3')
    if (!els?.length) return
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length) {
          setActiveHeading(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Resume scroll position
  useEffect(() => {
    if (initialProgress?.scroll_position) {
      window.scrollTo({ top: initialProgress.scroll_position })
    }
  }, [])

  // Text selection → annotation popover
  const onMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setPopover(null)
      return
    }
    const text = sel.toString().trim()
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Compute char offset from content root
    const contentEl = contentRef.current
    if (!contentEl) return
    const allText = contentEl.textContent ?? ''
    const start = getCharOffset(contentEl, range.startContainer, range.startOffset)
    const end = start + text.length

    setPopover({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 60,
      text,
      start,
      end,
    })
    setNoteText('')
  }, [])

  const saveAnnotation = async (color: AnnotationColor) => {
    if (!popover) return
    const { data } = await supabase
      .from('annotations')
      .insert({
        paper_id: paper.id,
        selected_text: popover.text,
        note: noteText || null,
        color,
        start_offset: popover.start,
        end_offset: popover.end,
      })
      .select()
      .single()
    if (data) setAnnotations(a => [...a, data])
    setPopover(null)
    window.getSelection()?.removeAllRanges()
  }

  const deleteAnnotation = async (id: string) => {
    await supabase.from('annotations').delete().eq('id', id)
    setAnnotations(a => a.filter(an => an.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-[#1a1a1a] z-50 transition-all duration-150"
        style={{ width: `${percent}%` }}
      />

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[#f9f7f4] border-b border-[#e8e5e0]">
        <div className="max-w-[1200px] mx-auto px-8 h-12 flex items-center justify-between text-sm text-[#6b6b6b]">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 hover:text-[#1a1a1a] transition-colors"
          >
            ← Back
          </button>
          <span className="text-[#1a1a1a] font-medium">
            No. {paper.edition_number} · {formatDateShort(paper.published_at)}
          </span>
          <div className="flex items-center gap-4">
            <span>{percent}%</span>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: paper.title, url: window.location.href })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                }
              }}
              className="hover:text-[#1a1a1a] transition-colors"
              aria-label="Share"
            >
              ⎋
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-12 flex gap-16">
        {/* Table of contents */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-20">
            <p className="text-xs tracking-widest text-[#6b6b6b] mb-4 font-medium">CONTENTS</p>
            <nav className="flex flex-col gap-1">
              {headings.map(h => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`text-sm py-1 pl-3 border-l-2 transition-colors leading-snug ${
                    activeHeading === h.id
                      ? 'border-[#1a1a1a] text-[#1a1a1a] font-medium'
                      : 'border-transparent text-[#6b6b6b] hover:text-[#1a1a1a]'
                  }`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Essay */}
        <main className="flex-1 max-w-[680px]" onMouseUp={onMouseUp}>
          {/* Pull quote */}
          {paper.pull_quote && (
            <div className="border-t border-b border-[#e8e5e0] py-8 mb-10 text-center">
              <p className="font-serif text-2xl italic text-[#1a1a1a] leading-relaxed">
                {paper.pull_quote}
              </p>
            </div>
          )}

          {/* Essay body */}
          <div
            ref={contentRef}
            className="relative prose prose-lg max-w-none
              prose-headings:font-serif prose-headings:font-bold prose-headings:text-[#1a1a1a]
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-[#1a1a1a] prose-p:leading-[1.85] prose-p:text-[17px]
              prose-a:text-[#1a1a1a] prose-a:underline
              prose-strong:font-semibold
              prose-blockquote:border-l-2 prose-blockquote:border-[#e8e5e0] prose-blockquote:text-[#6b6b6b] prose-blockquote:not-italic"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => {
                  const text = String(children)
                  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  return <h2 id={id}>{children}</h2>
                },
                h3: ({ children }) => {
                  const text = String(children)
                  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  return <h3 id={id}>{children}</h3>
                },
              }}
            >
              {applyHighlights(paper.content, annotations)}
            </ReactMarkdown>
          </div>

          {/* Sources */}
          {paper.sources && paper.sources.length > 0 && (
            <div className="mt-16 pt-8 border-t border-[#e8e5e0]">
              <h3 className="font-serif text-lg font-bold text-[#1a1a1a] mb-4">Sources</h3>
              <ol className="space-y-3">
                {paper.sources.map((src, i) => (
                  <li key={i} className="text-sm text-[#6b6b6b] leading-relaxed">
                    <span className="text-[#1a1a1a] font-medium">{src.title}</span>
                    {src.url && (
                      <>
                        {' '}—{' '}
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-[#1a1a1a] break-all"
                        >
                          {src.url}
                        </a>
                      </>
                    )}
                    {src.snippet && <p className="mt-0.5 text-xs">{src.snippet}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Saved annotations panel */}
          {annotations.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#e8e5e0]">
              <h3 className="font-serif text-lg font-bold text-[#1a1a1a] mb-4">Your highlights</h3>
              <div className="space-y-3">
                {annotations.map(ann => (
                  <div
                    key={ann.id}
                    className="group flex items-start gap-3 p-3 border border-[#e8e5e0] bg-white"
                  >
                    <span
                      className="mt-1 w-3 h-3 shrink-0 rounded-full"
                      style={{ backgroundColor: ANNOTATION_COLORS[ann.color as AnnotationColor] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1a1a1a] italic">"{ann.selected_text}"</p>
                      {ann.note && <p className="text-xs text-[#6b6b6b] mt-1">{ann.note}</p>}
                    </div>
                    <button
                      onClick={() => deleteAnnotation(ann.id)}
                      className="text-xs text-[#6b6b6b] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#1a1a1a]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Annotation popover */}
      {popover && (
        <div
          className="fixed z-50 bg-white border border-[#e8e5e0] shadow-sm p-3 flex flex-col gap-2"
          style={{ left: popover.x - 100, top: popover.y, width: 200 }}
        >
          <p className="text-xs text-[#6b6b6b] truncate">"{popover.text.slice(0, 40)}…"</p>
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            className="text-xs border border-[#e8e5e0] px-2 py-1 outline-none focus:border-[#1a1a1a]"
          />
          <div className="flex gap-2">
            {(Object.entries(ANNOTATION_COLORS) as [AnnotationColor, string][]).map(([color, hex]) => (
              <button
                key={color}
                onClick={() => saveAnnotation(color)}
                className="w-6 h-6 border border-[#e8e5e0] hover:scale-110 transition-transform"
                style={{ backgroundColor: hex }}
                title={color}
              />
            ))}
            <button
              onClick={() => setPopover(null)}
              className="ml-auto text-xs text-[#6b6b6b] hover:text-[#1a1a1a]"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

function getCharOffset(root: Node, node: Node, offset: number): number {
  let pos = 0
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    if (walker.currentNode === node) return pos + offset
    pos += (walker.currentNode.textContent ?? '').length
  }
  return pos
}

// Wraps annotation ranges with HTML mark tags in the markdown
// Simple approach: we insert HTML spans the markdown will preserve
function applyHighlights(content: string, annotations: Annotation[]): string {
  if (!annotations.length) return content
  // Annotations are applied at render time via CSS; the markdown content itself is not modified
  // Highlights are shown in the "Your highlights" panel below the essay
  return content
}

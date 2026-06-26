'use client'

import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Topic, TopicCategory } from '@/types'
import { TOPIC_CATEGORY_LABELS, TOPIC_CATEGORY_ORDER } from '@/types'
import { createClient } from '@/lib/supabase'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b] mb-3">{children}</p>
  )
}

function nextRunEta(): string {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(3, 0, 0, 0)
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  const hrs = Math.round((next.getTime() - now.getTime()) / 3_600_000)
  if (hrs <= 0) return 'soon'
  if (hrs === 1) return 'in ~1 hr'
  return `in ~${hrs} hrs`
}

function Chevron({ dir }: { dir: 'up' | 'down' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={dir === 'up' ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4h11M6 4V2.5h4V4M5 4l.5 9h5l.5-9M6.5 6.5v4M9.5 6.5v4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const CATEGORY_DESCRIPTIONS: Record<TopicCategory, string> = {
  teach_me:        'Explains the topic from scratch, like you\'ve never heard of it. Lots of analogies, no jargon left undefined.',
  how_it_works:    'Gets straight to the mechanism. Written for someone technical who wants the real explanation, not the simplified one.',
  big_picture:     'Pulls way back. Where did this come from, what forces are driving it, and where does it go over the next decade.',
  debate_this:     'Lays out the strongest case for both sides without picking one. You decide.',
  essay:           'Takes a position and defends it. One clear argument, built with evidence, tested against the best counterarguments.',
  stock_deep_dive: 'Covers what the company does, the bull and bear cases, valuation, and ends with a clear buy, avoid, or watch call.',
}

function InfoPopover() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0 })

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const popoverWidth = Math.min(288, vw - 32)
      // Anchor to right edge of button, clamp so it never bleeds off left
      const right = vw - r.right
      const left = Math.max(16, r.right - popoverWidth)
      setCoords({ top: r.bottom + 8, left, right })
    }
    setOpen(v => !v)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="text-[#d1d1d1] hover:text-[#a0a0a0] transition-colors"
        aria-label="What do these categories mean?"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7.5 6.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7.5" cy="4.5" r="0.7" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="fixed z-20 border border-[#e0e0e0] bg-white p-4 flex flex-col gap-3"
            style={{ top: coords.top, left: coords.left, width: Math.min(288, window.innerWidth - 32) }}
          >
            {TOPIC_CATEGORY_ORDER.map((cat) => (
              <div key={cat}>
                <p className="text-[11px] font-sans uppercase tracking-widest text-[#000000] mb-0.5">
                  {TOPIC_CATEGORY_LABELS[cat]}
                </p>
                <p className="text-xs text-[#6b6b6b] leading-relaxed">
                  {CATEGORY_DESCRIPTIONS[cat]}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function CategoryPills({
  value,
  onChange,
}: {
  value: TopicCategory | null
  onChange: (v: TopicCategory | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TOPIC_CATEGORY_ORDER.map((cat) => {
        const selected = value === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(selected ? null : cat)}
            className={`text-[11px] font-sans uppercase tracking-widest px-3 py-1 rounded-sm border transition-colors ${
              selected
                ? 'border-[#000000] text-[#000000] bg-white'
                : 'border-[#e0e0e0] text-[#6b6b6b] bg-white hover:border-[#d1d1d1]'
            }`}
          >
            {TOPIC_CATEGORY_LABELS[cat]}
          </button>
        )
      })}
    </div>
  )
}

function nextCategory(current: TopicCategory | null): TopicCategory | null {
  if (current === null) return TOPIC_CATEGORY_ORDER[0]
  const i = TOPIC_CATEGORY_ORDER.indexOf(current)
  if (i === TOPIC_CATEGORY_ORDER.length - 1) return null
  return TOPIC_CATEGORY_ORDER[i + 1]
}

function SortableItem({
  topic,
  index,
  isFirst,
  isLast,
  onDelete,
  onMove,
  onCategoryChange,
}: {
  topic: Topic
  index: number
  isFirst: boolean
  isLast: boolean
  onDelete: (id: string) => void
  onMove: (index: number, dir: -1 | 1) => void
  onCategoryChange: (id: string, cat: TopicCategory | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex items-center gap-3 sm:gap-5 p-4 sm:p-5 bg-white border rounded-sm group transition-all ${
        isDragging
          ? 'opacity-60 border-[#000000]'
          : 'border-[#e0e0e0] hover:border-[#000000] hover:bg-[#fcfcfc]'
      }`}
    >
      <span className="font-serif text-[22px] text-[#d1d1d1] group-hover:text-[#000000] tabular-nums shrink-0 w-6 text-center leading-none -mt-1 self-center transition-colors">
        {index + 1}
      </span>

      <button
        {...attributes}
        {...listeners}
        className="text-[#d1d1d1] hover:text-[#6b6b6b] cursor-grab active:cursor-grabbing shrink-0 touch-none hidden sm:block"
        aria-label="Drag to reorder"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="5.5" cy="3.5" r="1.1" /><circle cx="10.5" cy="3.5" r="1.1" />
          <circle cx="5.5" cy="8" r="1.1" /><circle cx="10.5" cy="8" r="1.1" />
          <circle cx="5.5" cy="12.5" r="1.1" /><circle cx="10.5" cy="12.5" r="1.1" />
        </svg>
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <p className="flex-1 min-w-0 text-sm font-medium text-[#000000] wrap-break-word">{topic.title}</p>
        {/* Category cycling pill */}
        <button
          onClick={() => onCategoryChange(topic.id, nextCategory(topic.category))}
          className={`self-start sm:self-auto text-[11px] font-sans uppercase tracking-widest px-2.5 py-1 border rounded-xs whitespace-nowrap shrink-0 ${
            topic.category
              ? 'border-[#000000] text-[#000000] bg-white'
              : 'border-[#e0e0e0] text-[#d1d1d1] bg-white'
          }`}
          aria-label="Change category"
          title="Click to change type"
        >
          {topic.category ? TOPIC_CATEGORY_LABELS[topic.category] : 'set type'}
        </button>
      </div>

      {/* Reorder arrows */}
      <div className="flex flex-col text-[#d1d1d1] shrink-0">
        <button
          onClick={() => onMove(index, -1)}
          disabled={isFirst}
          className="hover:text-[#000000] disabled:opacity-30 disabled:hover:text-[#d1d1d1] transition-colors -my-0.5"
          aria-label="Move up"
        >
          <Chevron dir="up" />
        </button>
        <button
          onClick={() => onMove(index, 1)}
          disabled={isLast}
          className="hover:text-[#000000] disabled:opacity-30 disabled:hover:text-[#d1d1d1] transition-colors -my-0.5"
          aria-label="Move down"
        >
          <Chevron dir="down" />
        </button>
      </div>

      <button
        onClick={() => onDelete(topic.id)}
        className="text-[#d1d1d1] hover:text-[#000000] hover:scale-110 active:scale-95 shrink-0 p-1 -mr-1 transition-all"
        aria-label="Remove topic"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

export default function TopicQueue({ initialTopics }: { initialTopics: Topic[] }) {
  const [topics, setTopics] = useState(initialTopics)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<TopicCategory | null>(null)
  const [suggestions, setSuggestions] = useState<
    { id: string; title: string; category: string; reason: string }[]
  >([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [eta, setEta] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setEta(nextRunEta())
    const id = setInterval(() => setEta(nextRunEta()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    loadSuggestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const addTopic = async () => {
    const title = newTitle.trim()
    if (!title) return
    const maxPriority = topics.length ? Math.max(...topics.map(t => t.priority)) + 1 : 0
    const { data } = await supabase
      .from('topics')
      .insert({ title, priority: maxPriority, status: 'queued', category: newCategory })
      .select()
      .single()
    if (data) {
      setTopics(t => [...t, data])
      setNewTitle('')
      setNewCategory(null)
    }
  }

  const deleteTopic = async (id: string) => {
    await supabase.from('topics').delete().eq('id', id)
    setTopics(t => t.filter(topic => topic.id !== id))
  }

  const updateCategory = async (id: string, category: TopicCategory | null) => {
    await supabase.from('topics').update({ category }).eq('id', id)
    setTopics(t => t.map(topic => topic.id === id ? { ...topic, category } : topic))
  }

  const persistOrder = async (reorderedQueued: Topic[]) => {
    const doneTopics = topics.filter(t => t.status === 'done')
    setTopics([...reorderedQueued, ...doneTopics])
    await Promise.all(
      reorderedQueued.map((topic, i) =>
        supabase.from('topics').update({ priority: reorderedQueued.length - i }).eq('id', topic.id)
      )
    )
  }

  const moveTopic = (index: number, dir: -1 | 1) => {
    const list = topics.filter(t => t.status !== 'done')
    const target = index + dir
    if (target < 0 || target >= list.length) return
    persistOrder(arrayMove(list, index, target))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const list = topics.filter(t => t.status !== 'done')
    const oldIndex = list.findIndex(t => t.id === active.id)
    const newIndex = list.findIndex(t => t.id === over.id)
    persistOrder(arrayMove(list, oldIndex, newIndex))
  }

  const loadSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const res = await fetch('/api/suggest-topics')
      const data = await res.json()
      const items: { title: string; category: string; reason: string }[] =
        data.suggestions ?? []
      setSuggestions(
        items.map((item, i) => ({ id: `${Date.now()}-${i}`, ...item }))
      )
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const addSuggestion = async (suggestion: {
    id: string
    title: string
    category: string
    reason: string
  }) => {
    setSuggestions(s => s.filter(sg => sg.id !== suggestion.id))
    const maxPriority = topics.length ? Math.max(...topics.map(t => t.priority)) + 1 : 0
    const { data } = await supabase
      .from('topics')
      .insert({ title: suggestion.title, priority: maxPriority, status: 'queued' })
      .select()
      .single()
    if (data) {
      setTopics(t => [...t, data])
    } else {
      setSuggestions(s => [suggestion, ...s])
    }
  }

  const dismissSuggestion = (id: string) => {
    setSuggestions(s => s.filter(sg => sg.id !== id))
  }

  const queued = topics.filter(t => t.status !== 'done')
  const nextUp = queued[0] ?? null

  return (
    <div>
      <div className="flex items-center gap-6 mb-10">
        <h2 className="font-serif text-[34px] font-light text-[#000000] lowercase shrink-0 leading-none">queue</h2>
        <div className="flex-1 border-t border-[#1a1a1a] mt-2" />
      </div>

      {/* 50/50: ranking (with add bar) | suggested for you */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
        {/* Left: tonight's paper + add + ranking */}
        <div>
          {/* Tonight's paper — clean banner */}
          <div className="mb-4 ad">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b]">
                Tonight&apos;s paper
              </p>
              {eta && (
                <>
                  <span className="h-1 w-1 rounded-full bg-[#d1d1d1]" />
                  <span className="text-[11px] font-sans text-[#6b6b6b] whitespace-nowrap">
                    {eta}
                  </span>
                </>
              )}
              <InfoPopover />
            </div>
            <p
              className={`font-serif text-[20px] sm:text-[24px] font-light leading-[1.1] tracking-tight ${
                nextUp ? 'text-[#000000]' : 'text-[#d1d1d1]'
              }`}
            >
              {nextUp ? nextUp.title : 'Nothing queued — the agent will choose.'}
            </p>
          </div>

          <div className="flex gap-2.5 mb-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTopic()}
              placeholder="Add a topic to research…"
              className="flex-1 min-w-0 border border-[#e0e0e0] rounded-sm bg-white px-4 py-3 text-sm text-[#000000] placeholder:text-[#d1d1d1] outline-none focus:border-[#000000] transition-colors"
            />
            <button
              onClick={addTopic}
              className="flex items-center justify-center gap-1.5 border border-[#000000] bg-[#000000] text-white px-5 py-3 text-sm font-medium rounded-sm hover:bg-white hover:text-[#000000] active:scale-[0.98] transition-colors shrink-0"
            >
              <span className="text-base leading-none">+</span> Add
            </button>
          </div>

          <div className="mb-6">
            <CategoryPills value={newCategory} onChange={setNewCategory} />
          </div>

          {queued.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={queued.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {queued.map((topic, i) => (
                    <SortableItem
                      key={topic.id}
                      topic={topic}
                      index={i}
                      isFirst={i === 0}
                      isLast={i === queued.length - 1}
                      onDelete={deleteTopic}
                      onMove={moveTopic}
                      onCategoryChange={updateCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="bg-white border border-[#e0e0e0] rounded-sm px-4 py-10 text-center">
              <p className="text-sm text-[#6b6b6b]">Queue is empty.</p>
              <p className="text-xs text-[#d1d1d1] mt-1">Add a topic or pull one from suggestions.</p>
            </div>
          )}
        </div>

        {/* Right: suggested for you (auto-loaded) */}
        <div>
          <Label>Suggested for you</Label>
          {suggestions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {suggestions.map(s => (
                <div
                  key={s.id}
                  className="group/card bg-white border border-[#e0e0e0] rounded-sm p-5 hover:border-[#d1d1d1] transition-colors"
                >
                  <p className="font-serif text-[20px] text-[#000000] leading-tight mb-1">
                    {s.title}
                  </p>
                  <p className="text-sm text-[#6b6b6b] leading-snug mb-4">{s.reason}</p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => addSuggestion(s)}
                      className="flex items-center justify-center gap-2 flex-1 border border-[#000000] bg-[#000000] text-white px-4 py-2.5 text-[13px] font-medium rounded-sm hover:bg-white hover:text-[#000000] active:scale-[0.98] transition-colors"
                    >
                      <span className="text-base leading-none">+</span> Add to queue
                    </button>
                    <button
                      onClick={() => dismissSuggestion(s.id)}
                      className="flex items-center justify-center gap-2 flex-1 border border-[#e0e0e0] bg-white text-[#6b6b6b] px-4 py-2.5 text-[13px] rounded-sm hover:text-[#000000] hover:border-[#000000] active:scale-[0.98] transition-colors"
                    >
                      <span className="leading-none">×</span> Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#e0e0e0] rounded-sm px-4 py-10 text-center">
              <p className="text-xs text-[#d1d1d1]">
                {loadingSuggestions ? 'Finding ideas for you…' : 'No suggestions right now.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

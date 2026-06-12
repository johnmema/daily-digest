'use client'

import { useState, useEffect } from 'react'
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
import type { Topic } from '@/types'
import { createClient } from '@/lib/supabase'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b] mb-3">{children}</p>
  )
}

// The nightly job fires at 03:00 UTC. Show a rough countdown to the next run
// so the banner reads "in ~9 hrs". Recomputed on the client after mount.
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

function SortableItem({
  topic,
  index,
  isFirst,
  isLast,
  onDelete,
  onMove,
}: {
  topic: Topic
  index: number
  isFirst: boolean
  isLast: boolean
  onDelete: (id: string) => void
  onMove: (index: number, dir: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-4 p-4 bg-[#f8f8f8] group transition-colors ${
        isDragging ? 'opacity-60 shadow-sm' : 'hover:bg-[#f1f1f1]'
      }`}
    >
      <span className="font-serif text-[22px] text-[#c8c5c0] tabular-nums shrink-0 w-6 text-center leading-none">
        {index + 1}
      </span>

      <button
        {...attributes}
        {...listeners}
        className="text-[#c8c5c0] hover:text-[#6b6b6b] cursor-grab active:cursor-grabbing shrink-0 touch-none hidden sm:block"
        aria-label="Drag to reorder"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="5.5" cy="3.5" r="1.1" /><circle cx="10.5" cy="3.5" r="1.1" />
          <circle cx="5.5" cy="8" r="1.1" /><circle cx="10.5" cy="8" r="1.1" />
          <circle cx="5.5" cy="12.5" r="1.1" /><circle cx="10.5" cy="12.5" r="1.1" />
        </svg>
      </button>

      <p className="flex-1 min-w-0 text-sm font-medium text-[#000000] truncate">{topic.title}</p>

      {/* Reorder arrows */}
      <div className="flex flex-col text-[#c8c5c0] shrink-0">
        <button
          onClick={() => onMove(index, -1)}
          disabled={isFirst}
          className="hover:text-[#000000] disabled:opacity-30 disabled:hover:text-[#c8c5c0] transition-colors -my-0.5"
          aria-label="Move up"
        >
          <Chevron dir="up" />
        </button>
        <button
          onClick={() => onMove(index, 1)}
          disabled={isLast}
          className="hover:text-[#000000] disabled:opacity-30 disabled:hover:text-[#c8c5c0] transition-colors -my-0.5"
          aria-label="Move down"
        >
          <Chevron dir="down" />
        </button>
      </div>

      <button
        onClick={() => onDelete(topic.id)}
        className="text-[#c8c5c0] hover:text-[#000000] shrink-0 p-1 -mr-1 transition-colors"
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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [eta, setEta] = useState('')
  const supabase = createClient()

  // Compute ETA only after mount so server and client markup match.
  useEffect(() => {
    setEta(nextRunEta())
    const id = setInterval(() => setEta(nextRunEta()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Suggestions load automatically — no manual generate step.
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
      .insert({ title, priority: maxPriority, status: 'queued' })
      .select()
      .single()
    if (data) {
      setTopics(t => [...t, data])
      setNewTitle('')
    }
  }

  const deleteTopic = async (id: string) => {
    await supabase.from('topics').delete().eq('id', id)
    setTopics(t => t.filter(topic => topic.id !== id))
  }

  // Persist a reordered queue: highest priority first. Done topics keep their rows.
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
      setSuggestions(data.suggestions ?? [])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const addSuggestion = async (title: string) => {
    const maxPriority = topics.length ? Math.max(...topics.map(t => t.priority)) + 1 : 0
    const { data } = await supabase
      .from('topics')
      .insert({ title, priority: maxPriority, status: 'queued' })
      .select()
      .single()
    if (data) {
      setTopics(t => [...t, data])
      setSuggestions(s => s.filter(sg => sg !== title))
    }
  }

  const dismissSuggestion = (title: string) => {
    setSuggestions(s => s.filter(sg => sg !== title))
  }

  const queued = topics.filter(t => t.status !== 'done')
  const nextUp = queued[0] ?? null

  return (
    <div>
      {/* 50/50: ranking (with add bar) | suggested for you */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
        {/* Left: tonight's paper + add + ranking */}
        <div>
          {/* Tonight's paper — clean banner */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b]">
                Tonight&apos;s paper
              </p>
              {eta && (
                <>
                  <span className="h-1 w-1 rounded-full bg-[#d8d5d0]" />
                  <span className="text-[11px] font-sans text-[#6b6b6b] whitespace-nowrap">
                    {eta}
                  </span>
                </>
              )}
            </div>
            <p
              className={`font-serif text-[28px] sm:text-[32px] font-light leading-[1.1] tracking-tight ${
                nextUp ? 'text-[#000000]' : 'text-[#c8c5c0]'
              }`}
            >
              {nextUp ? nextUp.title : 'Nothing queued — the agent will choose.'}
            </p>
          </div>

          <div className="flex gap-0 mb-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTopic()}
              placeholder="Add a topic to research…"
              className="flex-1 min-w-0 border border-[#e8e5e0] bg-white px-4 py-3 text-sm text-[#000000] placeholder:text-[#c8c5c0] outline-none focus:border-[#000000] transition-colors"
            />
            <button
              onClick={addTopic}
              className="flex items-center justify-center gap-1.5 bg-[#000000] text-white px-5 py-3 text-sm font-medium hover:bg-[#1a1a1a] transition-colors shrink-0"
            >
              <span className="text-base leading-none">+</span> Add
            </button>
          </div>

          {queued.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={queued.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-px">
                  {queued.map((topic, i) => (
                    <SortableItem
                      key={topic.id}
                      topic={topic}
                      index={i}
                      isFirst={i === 0}
                      isLast={i === queued.length - 1}
                      onDelete={deleteTopic}
                      onMove={moveTopic}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="bg-[#f8f8f8] px-4 py-10 text-center">
              <p className="text-sm text-[#6b6b6b]">Queue is empty.</p>
              <p className="text-xs text-[#c8c5c0] mt-1">Add a topic or pull one from suggestions.</p>
            </div>
          )}
        </div>

        {/* Right: suggested for you (auto-loaded) */}
        <div>
          <Label>Suggested for you</Label>
          {suggestions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {suggestions.map(s => (
                <div key={s} className="bg-[#f8f8f8] p-5">
                  <p className="font-serif text-[20px] font-light text-[#000000] leading-snug mb-5">
                    {s}
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => addSuggestion(s)}
                      className="flex items-center justify-center gap-2 flex-1 bg-[#000000] text-white px-4 py-2.5 text-[13px] font-medium hover:bg-[#1a1a1a] transition-colors"
                    >
                      <span className="text-base leading-none">+</span> Add to queue
                    </button>
                    <button
                      onClick={() => dismissSuggestion(s)}
                      className="flex items-center justify-center gap-2 flex-1 border border-[#e8e5e0] bg-white text-[#6b6b6b] px-4 py-2.5 text-[13px] hover:text-[#000000] hover:border-[#c8c5c0] transition-colors"
                    >
                      <span className="leading-none">×</span> Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#f8f8f8] px-4 py-10 text-center">
              <p className="text-xs text-[#c8c5c0]">
                {loadingSuggestions ? 'Finding ideas for you…' : 'No suggestions right now.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

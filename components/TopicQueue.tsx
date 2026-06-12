'use client'

import { useState } from 'react'
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

function SortableItem({
  topic,
  onDelete,
}: {
  topic: Topic
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-4 p-4 border border-[#e8e5e0] bg-white group ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-[#c8c5c0] hover:text-[#6b6b6b] cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#000000] truncate">{topic.title}</p>
      </div>

      <button
        onClick={() => onDelete(topic.id)}
        className="text-[#c8c5c0] hover:text-[#000000] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-lg leading-none"
        aria-label="Remove topic"
      >
        ×
      </button>
    </div>
  )
}

export default function TopicQueue({ initialTopics }: { initialTopics: Topic[] }) {
  const [topics, setTopics] = useState(initialTopics)
  const [newTitle, setNewTitle] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const supabase = createClient()

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = topics.findIndex(t => t.id === active.id)
    const newIndex = topics.findIndex(t => t.id === over.id)
    const reordered = arrayMove(topics, oldIndex, newIndex)
    setTopics(reordered)

    await Promise.all(
      reordered.map((topic, i) =>
        supabase.from('topics').update({ priority: reordered.length - i }).eq('id', topic.id)
      )
    )
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

  const queued = topics.filter(t => t.status !== 'done')
  const done = topics.filter(t => t.status === 'done')

  return (
    <div className="space-y-10">
      {/* Add topic */}
      <div>
        <p className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b] mb-3">Commission a new topic</p>
        <div className="flex gap-0">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTopic()}
            placeholder="e.g. the economics of open-source software"
            className="flex-1 border border-[#e8e5e0] bg-white px-4 py-3 text-sm text-[#000000] placeholder:text-[#c8c5c0] outline-none focus:border-[#000000] transition-colors"
          />
          <button
            onClick={addTopic}
            className="border border-l-0 border-[#e8e5e0] bg-white px-5 py-3 text-sm text-[#000000] hover:bg-[#f8f8f8] transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Queue */}
      {queued.length > 0 ? (
        <div>
          <p className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b] mb-3">Up next — drag to reprioritize</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={queued.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-px">
                {queued.map(topic => (
                  <SortableItem key={topic.id} topic={topic} onDelete={deleteTopic} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <p className="text-sm text-[#6b6b6b] py-4">Queue is empty — add a topic above.</p>
      )}

      {/* Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b]">Suggested topics</p>
          <button
            onClick={loadSuggestions}
            disabled={loadingSuggestions}
            className="text-xs text-[#000000] underline underline-offset-2 hover:no-underline disabled:text-[#6b6b6b]"
          >
            {loadingSuggestions ? 'thinking…' : 'generate'}
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-px">
            {suggestions.map(s => (
              <div key={s} className="flex items-center justify-between p-4 border border-[#e8e5e0] bg-white group">
                <p className="text-sm text-[#6b6b6b]">{s}</p>
                <button
                  onClick={() => addSuggestion(s)}
                  className="text-xs text-[#000000] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  + add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Written */}
      {done.length > 0 && (
        <div>
          <p className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b] mb-3">Written</p>
          <div className="flex flex-col gap-px">
            {done.map(topic => (
              <div key={topic.id} className="flex items-center justify-between p-4 border border-[#e8e5e0] bg-white">
                <p className="text-sm text-[#6b6b6b] line-through">{topic.title}</p>
                <span className="text-[11px] font-sans uppercase tracking-widest text-[#6b6b6b]">done</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

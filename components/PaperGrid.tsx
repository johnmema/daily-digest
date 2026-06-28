'use client'

import { useState } from 'react'
import PaperCard from '@/components/PaperCard'
import type { Paper } from '@/types'

export default function PaperGrid({ initialPapers }: { initialPapers: Paper[] }) {
  const [papers, setPapers] = useState(initialPapers)

  const handleDelete = (id: string) => {
    setPapers(p => p.filter(paper => paper.id !== id))
  }

  if (papers.length === 0) {
    return (
      <p className="text-[#6b6b6b] text-sm py-8">
        No papers yet — the archive will fill up over time.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {papers.map(paper => (
        <PaperCard key={paper.id} paper={paper} onDelete={handleDelete} />
      ))}
    </div>
  )
}

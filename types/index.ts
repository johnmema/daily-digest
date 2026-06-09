export type TopicStatus = 'queued' | 'in_progress' | 'done'

export interface Topic {
  id: string
  title: string
  priority: number
  status: TopicStatus
  created_at: string
}

export interface Source {
  title: string
  url: string
  snippet: string
}

export interface Paper {
  id: string
  edition_number: number
  topic_id: string | null
  title: string
  subtitle: string | null
  pull_quote: string | null
  content: string
  sources: Source[] | null
  word_count: number | null
  read_time_minutes: number | null
  published_at: string
}

export interface ReadingProgress {
  paper_id: string
  scroll_position: number
  percent_read: number
  completed: boolean
  updated_at: string
}

export type AnnotationColor = 'yellow' | 'green' | 'pink'

export interface Annotation {
  id: string
  paper_id: string
  selected_text: string
  note: string | null
  color: AnnotationColor
  start_offset: number | null
  end_offset: number | null
  created_at: string
}

export interface EssayOutput {
  title: string
  subtitle: string
  pull_quote: string
  content: string
  sources: Source[]
}

export type TopicStatus = 'queued' | 'in_progress' | 'done'

export type TopicCategory =
  | 'teach_me'
  | 'how_it_works'
  | 'big_picture'
  | 'debate_this'
  | 'essay'
  | 'stock_deep_dive'

export const TOPIC_CATEGORY_LABELS: Record<TopicCategory, string> = {
  teach_me: 'Teach Me',
  how_it_works: 'How It Works',
  big_picture: 'Big Picture',
  debate_this: 'Debate This',
  essay: 'Essay',
  stock_deep_dive: 'Stock Deep Dive',
}

export const TOPIC_CATEGORY_ORDER: TopicCategory[] = [
  'teach_me',
  'how_it_works',
  'big_picture',
  'debate_this',
  'essay',
  'stock_deep_dive',
]

export interface Topic {
  id: string
  title: string
  priority: number
  status: TopicStatus
  created_at: string
  category: TopicCategory | null
}

export interface Source {
  title: string
  url: string
  snippet: string
}

export type PaperCategory = 'essay' | 'explainer' | 'analysis'

export interface Paper {
  id: string
  edition_number: number
  topic_id: string | null
  category: PaperCategory | null
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

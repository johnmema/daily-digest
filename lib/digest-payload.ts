export type DigestPayload = {
  run_date: string; topic_id?: string; topic: string;
  category: 'essay' | 'explainer' | 'analysis'; title: string;
  subtitle?: string; pull_quote?: string; content: string;
  sources: { title: string; url: string; snippet?: string }[];
  word_count: number; read_time_minutes: number;
}
export function validateDigest(input: unknown): DigestPayload {
  if (!input || typeof input !== 'object') throw new Error('Expected an object')
  const p = input as Record<string, unknown>
  const text = (key: string, max: number) => {
    const v = p[key]
    if (typeof v !== 'string' || !v.trim() || v.length > max) throw new Error(`Invalid ${key}`)
    return v.trim()
  }
  const run_date = text('run_date', 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(run_date) || new Date(`${run_date}T00:00:00Z`).toISOString().slice(0, 10) !== run_date) throw new Error('Invalid run_date')
  if (p.topic_id !== undefined && (typeof p.topic_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.topic_id))) throw new Error('Invalid topic_id')
  const content = text('content', 100000)
  const word_count = content.split(/\s+/u).length
  if (word_count < 2500 || word_count > 3500) throw new Error('Essay must contain 2500-3500 words')
  if (!['essay', 'explainer', 'analysis'].includes(String(p.category))) throw new Error('Invalid category')
  if (!Array.isArray(p.sources) || p.sources.length < 6 || p.sources.length > 40) throw new Error('Provide 6-40 sources')
  const sources = p.sources.map((s: unknown) => {
    if (!s || typeof s !== 'object') throw new Error('Invalid source')
    const src = s as Record<string, unknown>
    if (typeof src.title !== 'string' || !src.title.trim() || src.title.length > 500 || typeof src.url !== 'string') throw new Error('Invalid source')
    const u = new URL(src.url)
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || src.url.length > 2000) throw new Error('Invalid source URL')
    return { title: src.title.trim(), url: src.url, ...(typeof src.snippet === 'string' ? { snippet: src.snippet.slice(0, 1000) } : {}) }
  })
  if (new Set(sources.map(s => s.url)).size < 6) throw new Error('Provide six distinct source URLs')
  for (const key of ['subtitle', 'pull_quote']) if (p[key] !== undefined && (typeof p[key] !== 'string' || (p[key] as string).length > 1000)) throw new Error(`Invalid ${key}`)
  return { run_date, topic: text('topic', 1000), topic_id: p.topic_id as string | undefined, category: p.category as DigestPayload['category'], title: text('title', 300), subtitle: p.subtitle as string | undefined, pull_quote: p.pull_quote as string | undefined, content, sources, word_count, read_time_minutes: Math.ceil(word_count / 220) }
}

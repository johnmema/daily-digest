export function readTime(wordCount: number): number {
  return Math.ceil(wordCount / 250)
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length
}

export interface Heading {
  id: string
  text: string
  level: number
}

export function parseHeadings(markdown: string): Heading[] {
  const lines = markdown.split('\n')
  return lines
    .filter(line => /^#{1,3}\s/.test(line))
    .map(line => {
      const match = line.match(/^(#{1,3})\s+(.+)$/)!
      const text = match[2].trim()
      return {
        id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        text,
        level: match[1].length,
      }
    })
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function excerpt(markdown: string, maxChars = 280): string {
  const plain = markdown
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
  if (plain.length <= maxChars) return plain
  return plain.slice(0, maxChars).replace(/\s+\S*$/, '') + '…'
}

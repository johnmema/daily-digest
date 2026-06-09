# Daily Digest — Product Spec

## What it is
A personal AI newspaper. Every night, an AI agent takes your top queued topic, researches it deeply across the web, and writes a 2,500–3,500 word long-form essay with a real point of view. Each morning you have one new paper waiting.

## The core loop
1. You queue topics ranked by priority ("the economics of open-source", "why languages lack a word for blue")
2. Overnight, the agent picks the top topic, runs deep web research, writes a cited essay
3. Each morning: one new paper, numbered sequentially like a newspaper edition
4. You read it in a focused reading experience — no distractions, just the essay
5. The agent watches what you've read and suggests related topics you'd find interesting

## Design philosophy
- **Newspaper / literary magazine framing** — not a feed, not a dashboard
- **One thing a day** — today's edition is the main story, past ones are the archive
- **Read it or don't** — no notifications, no engagement metrics, no red dots
- The Queue is your editorial desk. You're the commissioning editor, the agent is the writer.

## Routes
| Route | Purpose |
|-------|---------|
| `/` | Home feed — today's paper featured, recent papers in grid |
| `/paper/[id]` | Reading view — ToC, progress, highlights, margin notes |
| `/library` | Full archive, searchable by title/topic |
| `/queue` | Add topics, drag to reorder priority, AI suggestions |

## Reading features
- Table of contents (auto from section headers), sticky sidebar
- Scroll progress bar + read percentage
- Text highlights in yellow/green/pink with optional margin notes
- Resume where you left off (saved scroll position)
- Estimated read time on every card and essay

## Essay structure (what the AI produces)
- Title + subtitle
- Pull quote (one italic sentence that captures the core insight)
- 5–7 sections with bold headers
- Inline citations (Author, Publication, Year)
- Sources list at the bottom with URLs

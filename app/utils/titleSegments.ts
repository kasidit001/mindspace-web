export interface TitleSegment {
  text: string
  code: boolean
}

// Lesson titles sometimes embed a literal file/path reference (e.g.
// "server.ts + app.ts", "src/schema/", "/api/v1/events/:eventId") rather than
// markdown -- this splits those tokens out so they can be rendered in a
// monospace code font instead of the surrounding heading/label font.
const CODE_TOKEN_RE = /(?:\/?[\w<>:-]+\/)+[\w.<>:-]*|[\w<>-]+\.[A-Za-z0-9]{1,6}(?![\w])/g

export function splitTitleSegments(title: string): TitleSegment[] {
  const segments: TitleSegment[] = []
  let lastIndex = 0

  for (const match of title.matchAll(CODE_TOKEN_RE)) {
    const index = match.index ?? 0
    if (index > lastIndex) segments.push({ text: title.slice(lastIndex, index), code: false })
    segments.push({ text: match[0], code: true })
    lastIndex = index + match[0].length
  }
  if (lastIndex < title.length) segments.push({ text: title.slice(lastIndex), code: false })

  return segments
}

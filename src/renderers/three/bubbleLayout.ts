export const KNOWLEDGE_BUBBLE_PIXEL_HEIGHT = 26
export const KNOWLEDGE_BUBBLE_FONT_SIZE_PX = 13
export const KNOWLEDGE_BUBBLE_HORIZONTAL_PADDING_PX = 10
export const KNOWLEDGE_BUBBLE_GAP_PX = 7
export const KNOWLEDGE_BUBBLE_STAR_GAP_PX = 16
export const knowledgeLabelCenterOffsetPx = (displayHeightPx: number) => (
  KNOWLEDGE_BUBBLE_STAR_GAP_PX + Math.max(0, displayHeightPx) / 2
)
export const KNOWLEDGE_BUBBLE_CENTER_OFFSET_PX = knowledgeLabelCenterOffsetPx(
  KNOWLEDGE_BUBBLE_PIXEL_HEIGHT,
)
export const KNOWLEDGE_BUBBLE_DENSITY_RATIO = 0.11
export const KNOWLEDGE_CARD_PIXEL_WIDTH = 280
export const KNOWLEDGE_CARD_PIXEL_HEIGHT = 105
// Legacy rollback value; the active renderer refreshes on every camera frame.
export const KNOWLEDGE_BUBBLE_SETTLE_MS = 160

export type ActiveBubbleNodeLod = 'glow' | 'title'

export function activeBubbleNodeLod(
  selected: boolean,
  displayedAsBubble: boolean,
): ActiveBubbleNodeLod {
  return selected || displayedAsBubble ? 'title' : 'glow'
}

export interface KnowledgeBubbleRect {
  left: number
  right: number
  top: number
  bottom: number
}

export interface KnowledgeBubbleCandidate {
  id: string
  importance: number
  cameraDistance: number
  rect: KnowledgeBubbleRect
}

interface SelectKnowledgeBubblesInput {
  candidates: readonly KnowledgeBubbleCandidate[]
  viewportWidth: number
  viewportHeight: number
  existingIds?: ReadonlySet<string>
  pinnedId?: string | null
  priorityIds?: ReadonlySet<string>
  addOnly?: boolean
}

function rectArea(rect: KnowledgeBubbleRect): number {
  return Math.max(0, rect.right - rect.left) * Math.max(0, rect.bottom - rect.top)
}

function rectFitsViewport(
  rect: KnowledgeBubbleRect,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  return rect.left >= 0
    && rect.right <= viewportWidth
    && rect.top >= 0
    && rect.bottom <= viewportHeight
}

function rectsOverlap(left: KnowledgeBubbleRect, right: KnowledgeBubbleRect): boolean {
  return left.left - KNOWLEDGE_BUBBLE_GAP_PX < right.right
    && left.right + KNOWLEDGE_BUBBLE_GAP_PX > right.left
    && left.top - KNOWLEDGE_BUBBLE_GAP_PX < right.bottom
    && left.bottom + KNOWLEDGE_BUBBLE_GAP_PX > right.top
}

function candidateQueues(candidates: readonly KnowledgeBubbleCandidate[]) {
  const important = [...candidates].sort((left, right) => (
    right.importance - left.importance
    || left.cameraDistance - right.cameraDistance
    || left.id.localeCompare(right.id)
  ))
  const nearby = [...candidates].sort((left, right) => (
    left.cameraDistance - right.cameraDistance
    || right.importance - left.importance
    || left.id.localeCompare(right.id)
  ))
  return { important, nearby }
}

function interleavedCandidates(candidates: readonly KnowledgeBubbleCandidate[]) {
  const { important, nearby } = candidateQueues(candidates)
  const ordered: KnowledgeBubbleCandidate[] = []
  const queuedIds = new Set<string>()
  const uniqueCandidateCount = new Set(candidates.map(({ id }) => id)).size
  let importantIndex = 0
  let nearbyIndex = 0
  const takeNext = (
    queue: readonly KnowledgeBubbleCandidate[],
    index: number,
  ): number => {
    let nextIndex = index
    while (nextIndex < queue.length && queuedIds.has(queue[nextIndex].id)) nextIndex += 1
    if (nextIndex < queue.length) {
      ordered.push(queue[nextIndex])
      queuedIds.add(queue[nextIndex].id)
      nextIndex += 1
    }
    return nextIndex
  }

  while (queuedIds.size < uniqueCandidateCount) {
    nearbyIndex = takeNext(nearby, nearbyIndex)
    nearbyIndex = takeNext(nearby, nearbyIndex)
    importantIndex = takeNext(important, importantIndex)
  }
  return ordered
}

export function selectKnowledgeBubbles({
  candidates,
  viewportWidth,
  viewportHeight,
  existingIds = new Set<string>(),
  pinnedId = null,
  priorityIds = new Set<string>(),
  addOnly = false,
}: SelectKnowledgeBubblesInput): Set<string> {
  const safeWidth = Math.max(1, viewportWidth)
  const safeHeight = Math.max(1, viewportHeight)
  const pixelBudget = safeWidth * safeHeight * KNOWLEDGE_BUBBLE_DENSITY_RATIO
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]))
  const selected = new Set<string>()
  const placed: KnowledgeBubbleRect[] = []
  let usedPixels = 0

  const reserve = (id: string, ignoreLimits = false, ignorePixelBudget = false) => {
    if (selected.has(id)) return
    const candidate = byId.get(id)
    if (!candidate) {
      if (addOnly || id === pinnedId) selected.add(id)
      return
    }
    const fits = rectFitsViewport(candidate.rect, safeWidth, safeHeight)
    const collides = placed.some((rect) => rectsOverlap(candidate.rect, rect))
    const area = rectArea(candidate.rect)
    if (
      !ignoreLimits
      && (!fits || collides || (!ignorePixelBudget && usedPixels + area > pixelBudget))
    ) return
    selected.add(id)
    if (fits) {
      placed.push(candidate.rect)
      usedPixels += area
    }
  }

  if (pinnedId) reserve(pinnedId, true)
  if (addOnly) existingIds.forEach((id) => reserve(id, true))
  candidates
    .filter(({ id }) => priorityIds.has(id))
    .sort((left, right) => (
      left.cameraDistance - right.cameraDistance
      || right.importance - left.importance
      || left.id.localeCompare(right.id)
    ))
    .forEach(({ id }) => reserve(id, false, true))

  interleavedCandidates(candidates).forEach((candidate) => reserve(candidate.id))

  return selected
}

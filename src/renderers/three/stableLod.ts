export type StableNodeLod = 'glow' | 'title' | 'card'

export const STABLE_LOD_EVALUATION_INTERVAL_MS = 80
export const STABLE_LOD_SCORE_RESPONSE_MS = 140
export const STABLE_LOD_MIN_HOLD_MS = 180
export const STABLE_LOD_PROMOTION_DWELL_MS = 140
export const STABLE_LOD_DEMOTION_DWELL_MS = 80
export const STABLE_LOD_RETENTION_BONUS = 0.08
export const STABLE_LOD_MAX_SWAPS_PER_EVALUATION = 4

export const TITLE_LOD_ENTER_PX = 28
export const TITLE_LOD_EXIT_PX = 20
export const CARD_LOD_ENTER_PX = 70
export const CARD_LOD_EXIT_PX = 54

export const HEMISPHERE_ENTER_THRESHOLD = -0.05
export const HEMISPHERE_EXIT_THRESHOLD = -0.3
export const FAIRNESS_WAIT_MS = 6_000
export const MAX_FAIRNESS_BONUS = 0.08

interface StableLodScoreInput {
  emphasis: number
  hemisphere: number
  projectedHeight: number
  detail: number
  hiddenForMs: number
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (maximum <= minimum) return value >= maximum ? 1 : 0
  const normalized = clamp01((value - minimum) / (maximum - minimum))
  return normalized * normalized * (3 - 2 * normalized)
}

export function stableLodDetail(projectedHeights: readonly number[]): number {
  if (projectedHeights.length === 0) return 0
  const sorted = [...projectedHeights].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
  return smoothstep(median, 18, 72)
}

export function stableLodMinimumEmphasis(detail: number): number {
  return 0.7 * (1 - clamp01(detail))
}

export function stableLodLabelBudget(
  viewportWidth: number,
  viewportHeight: number,
  detail: number,
): number {
  const areaPerLabel = 120_000 + (32_000 - 120_000) * clamp01(detail)
  return Math.max(6, Math.min(80, Math.round(
    Math.max(1, viewportWidth) * Math.max(1, viewportHeight) / areaPerLabel,
  )))
}

export function stableLodScore({
  emphasis,
  hemisphere,
  projectedHeight,
  detail,
  hiddenForMs,
}: StableLodScoreInput): number {
  const normalizedDetail = clamp01(detail)
  const semanticWeight = 0.85 + (0.55 - 0.85) * normalizedDetail
  const frontWeight = 0.1 + (0.25 - 0.1) * normalizedDetail
  const sizeWeight = 1 - semanticWeight - frontWeight
  const frontness = smoothstep(hemisphere, -0.35, 0.55)
  const size = smoothstep(projectedHeight, 20, 80)
  const fairness = Math.min(1, Math.max(0, hiddenForMs) / FAIRNESS_WAIT_MS)
    * MAX_FAIRNESS_BONUS
    * normalizedDetail
  return clamp01(emphasis) * semanticWeight
    + frontness * frontWeight
    + size * sizeWeight
    + fairness
}

export function stableLodScoreAlpha(elapsedMs: number): number {
  return 1 - Math.exp(-Math.max(0, elapsedMs) / STABLE_LOD_SCORE_RESPONSE_MS)
}

export function stableHemisphereEligibility(
  wasEligible: boolean,
  hemisphere: number,
): boolean {
  return wasEligible
    ? hemisphere >= HEMISPHERE_EXIT_THRESHOLD
    : hemisphere > HEMISPHERE_ENTER_THRESHOLD
}

export function stableDesiredLod(
  projectedHeight: number,
  currentLod: StableNodeLod,
): StableNodeLod {
  if (currentLod === 'card') {
    if (projectedHeight >= CARD_LOD_EXIT_PX) return 'card'
    return projectedHeight >= TITLE_LOD_EXIT_PX ? 'title' : 'glow'
  }
  if (currentLod === 'title') {
    if (projectedHeight >= CARD_LOD_ENTER_PX) return 'card'
    return projectedHeight >= TITLE_LOD_EXIT_PX ? 'title' : 'glow'
  }
  if (projectedHeight >= CARD_LOD_ENTER_PX) return 'card'
  return projectedHeight >= TITLE_LOD_ENTER_PX ? 'title' : 'glow'
}

export function stableLodChangeReady(
  now: number,
  changedAt: number,
  candidateSince: number,
  demotion: boolean,
): boolean {
  const dwellMs = demotion
    ? STABLE_LOD_DEMOTION_DWELL_MS
    : STABLE_LOD_PROMOTION_DWELL_MS
  return now - changedAt >= STABLE_LOD_MIN_HOLD_MS
    && now - candidateSince >= dwellMs
}

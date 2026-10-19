export type StableNodeLod = 'glow' | 'title' | 'card'

export const STABLE_LOD_EVALUATION_INTERVAL_MS = 80
export const STABLE_LOD_SCORE_RESPONSE_MS = 140
export const STABLE_LOD_MIN_HOLD_MS = 180
export const STABLE_LOD_PROMOTION_DWELL_MS = 140
export const STABLE_LOD_DEMOTION_DWELL_MS = 80
export const STABLE_LOD_RETENTION_BONUS = 0.08
export const STABLE_LOD_MAX_SWAPS_PER_EVALUATION = 4
export const STABLE_LOD_INTERACTION_MAX_TRAVEL_RATIO = 0.45
export const STABLE_LOD_INTERACTION_MAX_ZOOM_OCTAVES = 0.75
export const STABLE_LOD_CORE_FOUNDATION_START = 0.84
export const STABLE_LOD_CORE_FOUNDATION_FULL = 0.95
export const STABLE_LOD_CORE_PRIORITY_BONUS = 0.18
export const STABLE_LOD_CORE_RETENTION_BONUS = 0.14
export const STABLE_LOD_CORE_PROJECTED_HEIGHT_BOOST = 0.25
export const STABLE_LOD_CORE_MIN_HOLD_BONUS_MS = 720
export const STABLE_LOD_CORE_DEMOTION_DWELL_BONUS_MS = 320
export const STABLE_LOD_VIEW_REFRESH_TRAVEL_RATIO = 0.18
export const STABLE_LOD_VIEW_REFRESH_ANGLE_RADIANS = Math.PI / 15
export const STABLE_LOD_VIEW_REFRESH_DURATION_MS = 1_100

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
  foundationScore?: number
  hemisphere: number
  projectedHeight: number
  detail: number
  hiddenForMs: number
}

interface StableLodInteractionRetentionInput {
  cameraTravel: number
  lookAtTravel: number
  referenceDistance: number
  referenceZoom: number
  currentZoom: number
}

interface StableLodViewRefreshInput {
  cameraTravel: number
  lookAtTravel: number
  referenceDistance: number
  referenceZoom: number
  viewAngleRadians: number
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function smoothstep(value: number, minimum: number, maximum: number): number {
  if (maximum <= minimum) return value >= maximum ? 1 : 0
  const normalized = clamp01((value - minimum) / (maximum - minimum))
  return normalized * normalized * (3 - 2 * normalized)
}

export function stableLodCoreStrength(foundationScore = 0): number {
  return smoothstep(
    foundationScore,
    STABLE_LOD_CORE_FOUNDATION_START,
    STABLE_LOD_CORE_FOUNDATION_FULL,
  )
}

export function stableLodSemanticPriority(emphasis: number, foundationScore = 0): number {
  return clamp01(emphasis)
    + stableLodCoreStrength(foundationScore) * STABLE_LOD_CORE_PRIORITY_BONUS
}

export function stableLodRetentionBonus(foundationScore = 0): number {
  return STABLE_LOD_RETENTION_BONUS
    + stableLodCoreStrength(foundationScore) * STABLE_LOD_CORE_RETENTION_BONUS
}

export function stableLodViewRefreshNeeded({
  cameraTravel,
  lookAtTravel,
  referenceDistance,
  referenceZoom,
  viewAngleRadians,
}: StableLodViewRefreshInput,
): boolean {
  const safeReferenceZoom = Math.max(1e-6, referenceZoom)
  const effectiveViewDistance = Math.max(1e-6, referenceDistance / safeReferenceZoom)
  const travelRatio = Math.max(Math.max(0, cameraTravel), Math.max(0, lookAtTravel))
    / effectiveViewDistance
  return travelRatio > STABLE_LOD_VIEW_REFRESH_TRAVEL_RATIO
    || Math.max(0, viewAngleRadians) > STABLE_LOD_VIEW_REFRESH_ANGLE_RADIANS
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
  foundationScore = 0,
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
  return stableLodSemanticPriority(emphasis, foundationScore) * semanticWeight
    + frontness * frontWeight
    + size * sizeWeight
    + fairness
}

export function stableLodScoreAlpha(elapsedMs: number): number {
  return 1 - Math.exp(-Math.max(0, elapsedMs) / STABLE_LOD_SCORE_RESPONSE_MS)
}

export function stableLodInteractionRetained({
  cameraTravel,
  lookAtTravel,
  referenceDistance,
  referenceZoom,
  currentZoom,
}: StableLodInteractionRetentionInput): boolean {
  const safeReferenceZoom = Math.max(1e-6, referenceZoom)
  const safeCurrentZoom = Math.max(1e-6, currentZoom)
  const effectiveViewDistance = Math.max(1e-6, referenceDistance / safeReferenceZoom)
  const travelRatio = Math.max(Math.max(0, cameraTravel), Math.max(0, lookAtTravel))
    / effectiveViewDistance
  const zoomFactor = 2 ** STABLE_LOD_INTERACTION_MAX_ZOOM_OCTAVES
  return travelRatio <= STABLE_LOD_INTERACTION_MAX_TRAVEL_RATIO
    && safeCurrentZoom >= safeReferenceZoom / zoomFactor
    && safeCurrentZoom <= safeReferenceZoom * zoomFactor
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
  foundationScore = 0,
): StableNodeLod {
  const effectiveProjectedHeight = projectedHeight * (
    1 + stableLodCoreStrength(foundationScore) * STABLE_LOD_CORE_PROJECTED_HEIGHT_BOOST
  )
  if (currentLod === 'card') {
    if (effectiveProjectedHeight >= CARD_LOD_EXIT_PX) return 'card'
    return effectiveProjectedHeight >= TITLE_LOD_EXIT_PX ? 'title' : 'glow'
  }
  if (currentLod === 'title') {
    if (effectiveProjectedHeight >= CARD_LOD_ENTER_PX) return 'card'
    return effectiveProjectedHeight >= TITLE_LOD_EXIT_PX ? 'title' : 'glow'
  }
  if (effectiveProjectedHeight >= CARD_LOD_ENTER_PX) return 'card'
  return effectiveProjectedHeight >= TITLE_LOD_ENTER_PX ? 'title' : 'glow'
}

export function stableLodChangeReady(
  now: number,
  changedAt: number,
  candidateSince: number,
  demotion: boolean,
  foundationScore = 0,
): boolean {
  const coreStrength = stableLodCoreStrength(foundationScore)
  const dwellMs = demotion
    ? STABLE_LOD_DEMOTION_DWELL_MS
      + coreStrength * STABLE_LOD_CORE_DEMOTION_DWELL_BONUS_MS
    : STABLE_LOD_PROMOTION_DWELL_MS
  const minimumHoldMs = STABLE_LOD_MIN_HOLD_MS
    + (demotion ? coreStrength * STABLE_LOD_CORE_MIN_HOLD_BONUS_MS : 0)
  return now - changedAt >= minimumHoldMs
    && now - candidateSince >= dwellMs
}

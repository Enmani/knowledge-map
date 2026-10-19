export const NODE_GLOW_IMPORTANCE_WEIGHT = 0.65
export const NODE_GLOW_FOUNDATION_WEIGHT = 0.35
export const NODE_GLOW_BASE_WEIGHT = 0.6
export const NODE_GLOW_CONTEXT_WEIGHT = 0.4
export const NODE_GLOW_ATTACK_MS = 160
export const NODE_GLOW_RELEASE_MS = 650
export const NODE_GLOW_SETTLE_EPSILON = 0.002
export const NODE_STAR_CORE_SCALE = 0.5
export const NODE_HALO_TARGET_LINEAR_LUMINANCE = 0.43
export const NODE_HALO_LUMINANCE_SCALE_MIN = 0.92
export const NODE_HALO_LUMINANCE_SCALE_MAX = 1.08

const EPSILON = 1e-9

export interface NodeGlowSalienceInput {
  id: string
  importance?: number
  foundationScore: number
}

export interface NodeGlowVisual {
  coreOpacity: number
  bloomCoreDensity: number
  haloOpticalDensity: number
  haloRadiusScale: number
}

export interface LinearRgb {
  r: number
  g: number
  b: number
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const smoothstep = (value: number, minimum: number, maximum: number) => {
  if (maximum <= minimum) return value >= maximum ? 1 : 0
  const normalized = clamp01((value - minimum) / (maximum - minimum))
  return normalized * normalized * (3 - 2 * normalized)
}

const quantile = (values: readonly number[], fraction: number): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.min(
    sorted.length - 1,
    Math.floor((sorted.length - 1) * clamp01(fraction)),
  )]
}

/** Equal authored values receive the same mid-rank so catalog ordering cannot change salience. */
export function midrankPercentiles(values: readonly number[]): readonly number[] {
  if (values.length === 0) return []
  if (values.length === 1) return [0.5]
  const ordered = values
    .map((value, index) => ({ value, index }))
    .sort((left, right) => left.value - right.value || left.index - right.index)
  const result = new Array<number>(values.length)
  let start = 0
  while (start < ordered.length) {
    let end = start
    while (end + 1 < ordered.length && ordered[end + 1].value === ordered[start].value) end += 1
    const percentile = ((start + end) * 0.5) / (ordered.length - 1)
    for (let index = start; index <= end; index += 1) {
      result[ordered[index].index] = percentile
    }
    start = end + 1
  }
  return result
}

/**
 * Computes a stable, scope-local semantic salience. Quantiles are taken from the
 * canonical public graph or one declared subspace, never from a live filter.
 */
export function buildNodeGlowSalience(
  inputs: readonly NodeGlowSalienceInput[],
): ReadonlyMap<string, number> {
  if (inputs.length === 0) return new Map()
  const importanceRanks = midrankPercentiles(inputs.map(({ importance }) => (
    Number.isFinite(importance) ? importance as number : 1
  )))
  const raw = inputs.map((input, index) => (
    NODE_GLOW_IMPORTANCE_WEIGHT * importanceRanks[index]
    + NODE_GLOW_FOUNDATION_WEIGHT * clamp01(
      Number.isFinite(input.foundationScore) ? input.foundationScore : 0,
    )
  ))
  const lower = quantile(raw, 0.05)
  const upper = quantile(raw, 0.95)
  const span = upper - lower
  return new Map(inputs.map((input, index) => [
    input.id,
    span <= EPSILON ? 0.5 : clamp01((raw[index] - lower) / span),
  ]))
}

/** Core light is stable; the broad halo receives a bounded current-lens contribution. */
export function resolveNodeGlowVisual(
  baseSalience: number,
  emphasis: number,
): NodeGlowVisual {
  const base = clamp01(baseSalience)
  const shapedBase = smoothstep(base, 0.06, 0.94) ** 1.2
  const context = smoothstep(emphasis, 0.2, 1)
  const haloScore = clamp01(
    NODE_GLOW_BASE_WEIGHT * base
    + NODE_GLOW_CONTEXT_WEIGHT * context,
  )
  const shapedHalo = smoothstep(haloScore, 0.15, 1) ** 1.5
  return {
    coreOpacity: 0.72 + 0.28 * shapedBase,
    bloomCoreDensity: 0.18 + 0.28 * shapedBase,
    haloOpticalDensity: 0.055 + 0.205 * shapedHalo,
    haloRadiusScale: 0.86 + 0.18 * haloScore,
  }
}

/**
 * Equalizes halo luminance within a narrow gain window so a domain hue does not
 * look more important merely because its authored color is brighter.
 */
export function normalizeNodeHaloLinearRgb(color: LinearRgb): LinearRgb {
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b
  const unclampedScale = luminance > EPSILON
    ? NODE_HALO_TARGET_LINEAR_LUMINANCE / luminance
    : 1
  const scale = Math.max(
    NODE_HALO_LUMINANCE_SCALE_MIN,
    Math.min(NODE_HALO_LUMINANCE_SCALE_MAX, unclampedScale),
  )
  return {
    r: color.r * scale,
    g: color.g * scale,
    b: color.b * scale,
  }
}

export function dampNodeGlowValue(
  current: number,
  target: number,
  deltaSeconds: number,
  reducedMotion = false,
): number {
  if (reducedMotion || current === target) return target
  const responseMs = target > current ? NODE_GLOW_ATTACK_MS : NODE_GLOW_RELEASE_MS
  const elapsed = Math.max(0, Math.min(deltaSeconds, 0.05))
  // The configured response is T95, so three time constants fit inside it.
  const alpha = 1 - Math.exp(-3 * elapsed / (responseMs / 1000))
  const next = current + (target - current) * alpha
  return Math.abs(next - target) <= NODE_GLOW_SETTLE_EPSILON ? target : next
}

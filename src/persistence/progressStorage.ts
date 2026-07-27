import type { ConceptId, ProgressLevel, ProgressState } from '../domain/knowledge'
import {
  createProgressStore,
  filterProgressToKnownConcepts,
  type ProgressMode,
  type ProgressStoreState,
} from '../engine/progression/progressStore'

export const PROGRESS_STORAGE_KEY = 'knowledge-map-progress'
export const LEGACY_PROGRESS_STORAGE_KEY = 'math-atlas-progress'
export const PROGRESS_SCHEMA_VERSION = 1

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

interface SerializedProgressEntryV1 {
  conceptId: ConceptId
  level: ProgressLevel
  completedInteractionIds?: readonly string[]
  updatedAt?: string
}

interface SerializedProgressV1 {
  version: 1
  mode: ProgressMode
  concepts: readonly SerializedProgressEntryV1[]
}

export type ProgressLoadStatus =
  | 'loaded'
  | 'migrated'
  | 'empty'
  | 'invalid'
  | 'unsupported-version'
  | 'storage-unavailable'

export interface ProgressLoadResult {
  state: ProgressStoreState
  status: ProgressLoadStatus
  discardedConceptIds: readonly ConceptId[]
}

export interface ProgressLoadOptions {
  fallbackMode?: ProgressMode
  fallbackProgress?: Iterable<ProgressState>
  removeLegacyAfterMigration?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isProgressMode(value: unknown): value is ProgressMode {
  return value === 'exploration' || value === 'free'
}

function isProgressLevel(value: unknown): value is ProgressLevel {
  return value === 'unknown' || value === 'sensed' || value === 'discovered' || value === 'mastered'
}

function stringsOnly(value: unknown) {
  return Array.isArray(value) && value.every((item): item is string => typeof item === 'string')
}

function fallbackState(options: ProgressLoadOptions) {
  return createProgressStore(options.fallbackMode ?? 'exploration', options.fallbackProgress ?? [])
}

function readV1Entry(value: unknown): SerializedProgressEntryV1 | undefined {
  if (!isRecord(value) || typeof value.conceptId !== 'string' || !isProgressLevel(value.level)) {
    return undefined
  }
  if (value.completedInteractionIds !== undefined && !stringsOnly(value.completedInteractionIds)) {
    return undefined
  }
  if (value.updatedAt !== undefined && typeof value.updatedAt !== 'string') return undefined

  return {
    conceptId: value.conceptId,
    level: value.level,
    ...(value.completedInteractionIds
      ? { completedInteractionIds: [...new Set(value.completedInteractionIds)] }
      : {}),
    ...(value.updatedAt ? { updatedAt: value.updatedAt } : {}),
  }
}

export function serializeProgress(store: ProgressStoreState) {
  const payload: SerializedProgressV1 = {
    version: PROGRESS_SCHEMA_VERSION,
    mode: store.mode,
    concepts: [...store.byConcept.values()].map((entry) => ({
      conceptId: entry.conceptId,
      level: entry.level,
      ...(entry.completedInteractionIds?.length
        ? { completedInteractionIds: [...new Set(entry.completedInteractionIds)] }
        : {}),
      ...(entry.updatedAt ? { updatedAt: entry.updatedAt } : {}),
    })),
  }
  return JSON.stringify(payload)
}

export function parseProgress(
  raw: string | null,
  knownConceptIds: ReadonlySet<ConceptId>,
  options: ProgressLoadOptions = {},
): ProgressLoadResult {
  if (raw === null) {
    return { state: fallbackState(options), status: 'empty', discardedConceptIds: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return { state: fallbackState(options), status: 'invalid', discardedConceptIds: [] }
  }

  if (!isRecord(parsed)) {
    return { state: fallbackState(options), status: 'invalid', discardedConceptIds: [] }
  }
  if (parsed.version !== PROGRESS_SCHEMA_VERSION) {
    return {
      state: fallbackState(options),
      status: 'unsupported-version',
      discardedConceptIds: [],
    }
  }
  if (!isProgressMode(parsed.mode) || !Array.isArray(parsed.concepts)) {
    return { state: fallbackState(options), status: 'invalid', discardedConceptIds: [] }
  }

  const entries: ProgressState[] = []
  const discardedConceptIds: ConceptId[] = []
  for (const candidate of parsed.concepts) {
    const entry = readV1Entry(candidate)
    if (!entry) {
      return { state: fallbackState(options), status: 'invalid', discardedConceptIds: [] }
    }
    if (!knownConceptIds.has(entry.conceptId)) {
      discardedConceptIds.push(entry.conceptId)
      continue
    }
    entries.push(entry)
  }

  return {
    state: createProgressStore(parsed.mode, entries),
    status: 'loaded',
    discardedConceptIds,
  }
}

export function migrateLegacyProgress(
  raw: string | null,
  knownConceptIds: ReadonlySet<ConceptId>,
  options: ProgressLoadOptions = {},
): ProgressLoadResult {
  if (raw === null) {
    return { state: fallbackState(options), status: 'empty', discardedConceptIds: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return { state: fallbackState(options), status: 'invalid', discardedConceptIds: [] }
  }
  if (!stringsOnly(parsed)) {
    return { state: fallbackState(options), status: 'invalid', discardedConceptIds: [] }
  }

  const discardedConceptIds = parsed.filter((id) => !knownConceptIds.has(id))
  const progress = [...new Set(parsed)]
    .filter((id) => knownConceptIds.has(id))
    .map<ProgressState>((conceptId) => ({ conceptId, level: 'mastered' }))

  return {
    state: createProgressStore(options.fallbackMode ?? 'exploration', progress),
    status: 'migrated',
    discardedConceptIds,
  }
}

export function saveProgressToStorage(
  storage: StorageLike | undefined,
  store: ProgressStoreState,
) {
  if (!storage) return false
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, serializeProgress(store))
    return true
  } catch {
    return false
  }
}

export function loadProgressFromStorage(
  storage: StorageLike | undefined,
  knownConceptIds: ReadonlySet<ConceptId>,
  options: ProgressLoadOptions = {},
): ProgressLoadResult {
  if (!storage) {
    return {
      state: fallbackState(options),
      status: 'storage-unavailable',
      discardedConceptIds: [],
    }
  }

  let currentRaw: string | null
  let legacyRaw: string | null
  try {
    currentRaw = storage.getItem(PROGRESS_STORAGE_KEY)
    legacyRaw = storage.getItem(LEGACY_PROGRESS_STORAGE_KEY)
  } catch {
    return {
      state: fallbackState(options),
      status: 'storage-unavailable',
      discardedConceptIds: [],
    }
  }

  if (currentRaw !== null) {
    const current = parseProgress(currentRaw, knownConceptIds, options)
    if (current.status === 'loaded') {
      return {
        ...current,
        state: filterProgressToKnownConcepts(current.state, knownConceptIds),
      }
    }
    if (legacyRaw === null) return current
  }

  const migrated = migrateLegacyProgress(legacyRaw, knownConceptIds, options)
  if (migrated.status !== 'migrated') return migrated

  const saved = saveProgressToStorage(storage, migrated.state)
  if (saved && options.removeLegacyAfterMigration && storage.removeItem) {
    try {
      storage.removeItem(LEGACY_PROGRESS_STORAGE_KEY)
    } catch {
      // The new copy is already safe; retaining the legacy key is harmless.
    }
  }
  return migrated
}

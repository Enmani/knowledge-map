import type {
  FrontierCatalog,
  FrontierEntry,
  FrontierIsoDate,
  FrontierSource,
  FrontierValidationIssue,
  FrontierValidationResult,
} from './types'

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

export function isValidFrontierIsoDate(value: string): value is FrontierIsoDate {
  if (!isoDatePattern.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    const normalized = value.trim().toLocaleLowerCase('en')
    if (seen.has(normalized)) duplicates.add(value)
    seen.add(normalized)
  }
  return [...duplicates]
}

function hasValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function requiredTextIssues(
  fields: ReadonlyArray<readonly [name: string, value: string]>,
  owner: Pick<FrontierValidationIssue, 'entryId' | 'sourceId'>,
): FrontierValidationIssue[] {
  return fields
    .filter(([, value]) => !value.trim())
    .map(([name]) => ({
      code: 'empty-field',
      severity: 'error',
      message: `${name}不能为空。`,
      ...owner,
    }))
}

export function validateFrontierSource(source: FrontierSource): FrontierValidationResult {
  const issues: FrontierValidationIssue[] = requiredTextIssues(
    [
      ['来源 ID', source.id],
      ['来源标题', source.title],
      ['来源发布方', source.publisher],
      ['来源地址', source.url],
    ],
    { sourceId: source.id },
  )

  if (!hasValidHttpsUrl(source.url)) {
    issues.push({
      code: 'invalid-url',
      severity: 'error',
      message: `来源“${source.id}”需要使用有效的 HTTPS 地址。`,
      sourceId: source.id,
    })
  }

  if (!isValidFrontierIsoDate(source.accessedAt)) {
    issues.push({
      code: 'invalid-date',
      severity: 'error',
      message: `来源“${source.id}”的访问日期无效。`,
      sourceId: source.id,
    })
  }

  if (source.publishedAt && !isValidFrontierIsoDate(source.publishedAt)) {
    issues.push({
      code: 'invalid-date',
      severity: 'error',
      message: `来源“${source.id}”的发布日期无效。`,
      sourceId: source.id,
    })
  }

  return { valid: issues.length === 0, issues }
}

export function validateFrontierEntry(entry: FrontierEntry): FrontierValidationResult {
  const issues: FrontierValidationIssue[] = requiredTextIssues(
    [
      ['条目 ID', entry.id],
      ['条目标识', entry.slug],
      ['条目去重键', entry.dedupeKey],
      ['条目标题', entry.title],
      ['条目摘要', entry.summary],
      ...(entry.breakthroughTrack === undefined
        ? []
        : [['突破路线', entry.breakthroughTrack] as const]),
    ],
    { entryId: entry.id },
  )

  const dateFields: ReadonlyArray<readonly [name: string, value: string]> = [
    ['发布日期', entry.publishedAt],
    ['复核日期', entry.reviewedAt],
    ['下次复核日期', entry.reviewDue],
  ]
  for (const [name, value] of dateFields) {
    if (!isValidFrontierIsoDate(value)) {
      issues.push({
        code: 'invalid-date',
        severity: 'error',
        message: `条目“${entry.id}”的${name}无效。`,
        entryId: entry.id,
      })
    }
  }

  if (
    isValidFrontierIsoDate(entry.reviewedAt) &&
    isValidFrontierIsoDate(entry.reviewDue) &&
    entry.reviewDue < entry.reviewedAt
  ) {
    issues.push({
      code: 'invalid-date-order',
      severity: 'error',
      message: `条目“${entry.id}”的下次复核日期早于最近复核日期。`,
      entryId: entry.id,
    })
  }

  const listFields: ReadonlyArray<readonly [name: string, values: readonly string[]]> = [
    ['标签', entry.tags],
    ['关联概念', entry.relatedConceptIds],
    ['来源', entry.sourceIds],
  ]
  for (const [name, values] of listFields) {
    for (const duplicate of duplicateValues(values)) {
      issues.push({
        code: 'duplicate-list-value',
        severity: 'error',
        message: `条目“${entry.id}”的${name}“${duplicate}”重复。`,
        entryId: entry.id,
      })
    }
  }

  if (entry.status !== 'draft' && entry.sourceIds.length === 0) {
    issues.push({
      code: 'source-required',
      severity: 'error',
      message: `条目“${entry.id}”在进入${entry.status}状态前需要至少一个来源。`,
      entryId: entry.id,
    })
  }

  if ((entry.kind === 'award-overview' || entry.kind === 'award-research') && !entry.award) {
    issues.push({
      code: 'award-metadata-required',
      severity: 'error',
      message: `奖项条目“${entry.id}”缺少奖项类型。`,
      entryId: entry.id,
    })
  }

  if (entry.breakthroughTrack?.trim() && entry.kind !== 'historical-milestone') {
    issues.push({
      code: 'invalid-breakthrough-track-kind',
      severity: 'error',
      message: `条目“${entry.id}”只有历史已解决问题可以声明突破路线。`,
      entryId: entry.id,
    })
  }

  if (entry.kind === 'award-research' && entry.award?.cycleYear === undefined) {
    issues.push({
      code: 'award-cycle-required',
      severity: 'error',
      message: `获奖研究条目“${entry.id}”缺少届次年份。`,
      entryId: entry.id,
    })
  }

  if (
    entry.award?.cycleYear !== undefined &&
    (!Number.isInteger(entry.award.cycleYear) || entry.award.cycleYear < 1900)
  ) {
    issues.push({
      code: 'invalid-award-cycle',
      severity: 'error',
      message: `奖项条目“${entry.id}”的届次年份无效。`,
      entryId: entry.id,
    })
  }

  return { valid: !issues.some((issue) => issue.severity === 'error'), issues }
}

export function validateFrontierCatalog(catalog: FrontierCatalog): FrontierValidationResult {
  const issues: FrontierValidationIssue[] = [
    ...catalog.sources.flatMap((source) => validateFrontierSource(source).issues),
    ...catalog.entries.flatMap((entry) => validateFrontierEntry(entry).issues),
  ]

  for (const id of duplicateValues(catalog.sources.map((source) => source.id))) {
    issues.push({
      code: 'duplicate-source-id',
      severity: 'error',
      message: `来源 ID“${id}”重复。`,
      sourceId: id,
    })
  }
  for (const id of duplicateValues(catalog.entries.map((entry) => entry.id))) {
    issues.push({
      code: 'duplicate-entry-id',
      severity: 'error',
      message: `条目 ID“${id}”重复。`,
      entryId: id,
    })
  }
  for (const slug of duplicateValues(catalog.entries.map((entry) => entry.slug))) {
    issues.push({
      code: 'duplicate-entry-slug',
      severity: 'error',
      message: `条目标识“${slug}”重复。`,
    })
  }
  for (const dedupeKey of duplicateValues(catalog.entries.map((entry) => entry.dedupeKey))) {
    issues.push({
      code: 'duplicate-dedupe-key',
      severity: 'warning',
      message: `条目去重键“${dedupeKey}”重复，查询时会保留优先级更高的条目。`,
    })
  }

  const sourceIds = new Set(catalog.sources.map((source) => source.id))
  for (const entry of catalog.entries) {
    for (const sourceId of entry.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        issues.push({
          code: 'missing-source',
          severity: 'error',
          message: `条目“${entry.id}”引用了不存在的来源“${sourceId}”。`,
          entryId: entry.id,
          sourceId,
        })
      }
    }
  }

  return { valid: !issues.some((issue) => issue.severity === 'error'), issues }
}

export function assertValidFrontierCatalog(catalog: FrontierCatalog): FrontierCatalog {
  const result = validateFrontierCatalog(catalog)
  if (!result.valid) {
    throw new Error(result.issues.map((issue) => issue.message).join('\n'))
  }
  return catalog
}

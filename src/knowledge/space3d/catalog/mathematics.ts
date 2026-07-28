import { mathNodes } from '../../../data/mathMap'
import type { MathNode } from '../../../data/mathMap'
import type { KnowledgeSpaceEdge, KnowledgeSpaceNode, ScienceDomainId } from '../types'
import { defineEdge, defineNode } from './helpers'

const MATH_ID_ALIASES: Readonly<Record<string, string>> = {
  numbers: 'quantity-arithmetic',
  logic: 'mathematical-logic',
  sets: 'set-theory',
}

const CROSS_DOMAIN_MEMBERSHIP: Readonly<Record<string, readonly ScienceDomainId[]>> = {
  'vector-geometry': ['mathematics', 'physics'],
  'differential-geometry': ['mathematics', 'physics'],
  'differential-equations': ['mathematics', 'physics'],
  'fourier-analysis': ['mathematics', 'physics'],
  'calculus-of-variations': ['mathematics', 'physics'],
  'dynamical-systems': ['mathematics', 'physics', 'biology'],
  probability: ['mathematics', 'physics', 'biology'],
  statistics: ['mathematics', 'biology'],
  stochastic: ['mathematics', 'physics', 'biology'],
  'numerical-analysis': ['mathematics', 'physics'],
  optimization: ['mathematics', 'physics'],
  'theory-of-computation': ['mathematics', 'computer-science'],
  algorithms: ['mathematics', 'computer-science'],
  'game-theory': ['mathematics', 'biology'],
  'mathematical-modeling': ['mathematics', 'physics', 'chemistry', 'biology'],
  'machine-learning': ['mathematics', 'biology', 'computer-science'],
  'control-theory': ['mathematics', 'physics', 'biology'],
  'math-physics': ['mathematics', 'physics'],
}

const IMPORTANCE: Readonly<Record<string, number>> = {
  'quantity-arithmetic': 1.2,
  functions: 1.15,
  'linear-algebra': 1.2,
  calculus: 1.3,
  'differential-equations': 1.2,
  statistics: 1.15,
  'mathematical-modeling': 1.15,
  'math-physics': 1.15,
}

export const toKnowledgeSpaceMathId = (id: string): string => MATH_ID_ALIASES[id] ?? id

const toKnowledgeSpaceNode = (node: MathNode): KnowledgeSpaceNode => {
  const id = toKnowledgeSpaceMathId(node.id)
  return defineNode({
    id,
    title: node.title,
    englishTitle: node.english,
    summary: node.summary,
    primaryDomain: 'mathematics',
    domains: CROSS_DOMAIN_MEMBERSHIP[id],
    tags: node.fieldTags,
    level: node.level,
    importance: IMPORTANCE[id],
  })
}

export const mathematicsNodes: readonly KnowledgeSpaceNode[] = mathNodes.map(toKnowledgeSpaceNode)

export const mathematicsEdges: readonly KnowledgeSpaceEdge[] = mathNodes.flatMap((node) => (
  node.prerequisites.map((source) => defineEdge({
    source: toKnowledgeSpaceMathId(source),
    target: toKnowledgeSpaceMathId(node.id),
    type: 'prerequisite',
    prerequisiteKind: 'strict',
    strength: 0.88,
  }))
))

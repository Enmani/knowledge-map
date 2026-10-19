import type { DomainFilterStrength, KnowledgeSpaceDataset, ScienceDomainId } from './types'

export const domainFilterStrengths = [
  { value: 'related', label: '直接关联', description: '显示本领域知识，以及与其有直接连线的节点；不继续扩展间接关系。' },
  { value: 'inclusive', label: '包含跨域', description: '显示所有归属于本领域的知识，包括同时属于其他领域的节点。' },
  { value: 'exclusive', label: '仅本领域', description: '只显示领域归属中仅有当前领域的知识，排除跨领域节点。' },
] as const

export const getDomainFilterNodeIds = (
  dataset: KnowledgeSpaceDataset,
  domain: ScienceDomainId,
  strength: DomainFilterStrength,
): string[] => {
  const members = new Set(dataset.nodes
    .filter((node) => node.domains.includes(domain) && (strength !== 'exclusive' || node.domains.length === 1))
    .map((node) => node.id))
  const visible = new Set(members)
  if (strength === 'related') {
    dataset.edges.forEach((edge) => {
      if (members.has(edge.source)) visible.add(edge.target)
      if (members.has(edge.target)) visible.add(edge.source)
    })
  }
  return [...visible]
}

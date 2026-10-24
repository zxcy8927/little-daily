const ids = [
  'cooking',
  'shopping',
  'budget',
  'dog',
  'tasks',
  'date',
  'more',
  'house',
]
export function toolFromHash(hash: string): string | null {
  const path = hash.replace(/^#\/?/, '')
  if (path === 'pets') return 'dog'
  return ids.includes(path) ? path : null
}
export function hashForTool(id: string | null) {
  return id && ids.includes(id) ? `#/${id === 'dog' ? 'pets' : id}` : '#/'
}

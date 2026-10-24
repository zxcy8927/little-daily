export type DailyTool = { id: string; emoji: string; title: string; subtitle: string; color: string }
export const tools: DailyTool[] = [
  { id: 'cooking', emoji: '🍳', title: '今天煮什麼', subtitle: '用家裡的食材想一餐', color: '#f4b48e' },
  { id: 'shopping', emoji: '🛍️', title: '買之前想想', subtitle: '先放一下，再決定要不要買', color: '#f0aac7' },
  { id: 'budget', emoji: '💰', title: '日常預算', subtitle: '看看今天還能花多少', color: '#f5d68b' },
  { id: 'dog', emoji: '🐾', title: '寵物日記', subtitle: '記下毛孩的日常與照護', color: '#a9d5c6' },
  { id: 'tasks', emoji: '🌷', title: '待辦小本', subtitle: '把想到的事一件件記下', color: '#b8b3f0' },
  { id: 'date', emoji: '💗', title: '約會提案', subtitle: '不知道去哪，就抽個點子', color: '#e9a5b6' },
]


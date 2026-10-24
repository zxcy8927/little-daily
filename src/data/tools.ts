export type DailyTool = {
  id: string
  emoji: string
  title: string
  subtitle: string
  color: string
}
export const tools: DailyTool[] = [
  {
    id: 'cooking',
    emoji: '🍳',
    title: '今天煮什麼',
    subtitle: '冰箱有什麼，今天就煮什麼',
    color: '#f4b48e',
  },
  {
    id: 'shopping',
    emoji: '🛍️',
    title: '買之前想想',
    subtitle: '想買的先放著，過幾天再說',
    color: '#f0aac7',
  },
  {
    id: 'budget',
    emoji: '💰',
    title: '日常預算',
    subtitle: '今天花了多少，心裡有個底',
    color: '#f5d68b',
  },
  {
    id: 'dog',
    emoji: '🐾',
    title: '寵物日記',
    subtitle: '吃飯、散步，替牠留一筆',
    color: '#a9d5c6',
  },
  {
    id: 'tasks',
    emoji: '🌷',
    title: '待辦小本',
    subtitle: '掛在心上的事，先寫下來',
    color: '#b8b3f0',
  },
  {
    id: 'date',
    emoji: '💗',
    title: '約會提案',
    subtitle: '沒想到去哪？抽一個看看',
    color: '#e9a5b6',
  },
]

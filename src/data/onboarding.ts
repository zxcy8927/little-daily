export const onboardingKey = 'little-daily-onboarding-v1'
export const tourSteps = [
  {
    title: '先坐一下，小兔在家',
    text: '想買的先放著，省下來的金幣拿來布置小屋。其他生活小事，也有地方收。',
    target: null,
    hint: '隨時可以跳過，之後從「新手導覽」再看一次。',
  },
  {
    title: '小兔在家，先坐一下',
    text: '這間小屋就是你的首頁。忍住沒買得到的金幣，可以拿來挑家具；按「佈置小屋」就能去選物店。',
    target: '.home-world',
    hint: '小屋一直在這裡，不用再展開找它。',
  },
  {
    title: '想買的東西，先留點時間',
    text: '記下想買的東西，等 1、3 或 7 天。到時還想要就買；決定不買，就拿金幣替小屋添點東西。',
    target: '.home-primary-actions',
    hint: '決定不買的金額會列為避免的預計支出，不會算成存款。',
  },
  {
    title: '其他小事，收進小本子',
    text: '食材、待辦、寵物日記與約會點子都在「更多」裡的「生活小本子」。今天用不到，就先收著。',
    target: '[data-nav="more"]',
    hint: '用「整理我的首頁工具」調整順序，或隱藏暫時用不到的工具。',
  },
  {
    title: '這週過得怎麼樣？',
    text: '「更多」裡的每週回顧，會留下花了多少、哪些東西沒買、做完哪些事。也能翻回上一週看看。',
    target: '[data-nav="more"]',
    hint: '有記一點，就有一點可以回頭看。',
  },
  {
    title: '走之前，帶一份備份',
    text: '到「更多」可以下載備份。紀錄住在現在這個瀏覽器，換裝置或清除網站資料前，先下載備份，到新地方再匯入。',
    target: '[data-nav="more"]',
    hint: '導覽只介紹操作，不會替你新增、刪除或更動工具紀錄。',
  },
] as const
export function shouldShowTour(storage: Pick<Storage, 'getItem'>) {
  try {
    return storage.getItem(onboardingKey) !== 'seen'
  } catch {
    return false
  }
}
export function rememberTour(storage: Pick<Storage, 'setItem'>) {
  storage.setItem(onboardingKey, 'seen')
}
type Box = { left: number; top: number; width: number; height: number }
export function tourCardPosition(
  viewport: { width: number; height: number },
  card: { width: number; height: number },
  target: Box | null,
) {
  const margin = 16,
    gap = 18
  const width = Math.min(card.width, Math.max(0, viewport.width - margin * 2))
  const height = Math.min(
    card.height,
    Math.max(0, viewport.height - margin * 2),
  )
  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, Math.max(min, max)))
  if (!target)
    return {
      left: Math.max(margin, (viewport.width - width) / 2),
      top: Math.max(margin, (viewport.height - height) / 2),
    }
  let left = target.left + target.width / 2 - width / 2
  let top = target.top + target.height + gap
  if (top + height > viewport.height - margin) top = target.top - height - gap
  if (top < margin) {
    top = (viewport.height - height) / 2
    if (target.left + target.width + gap + width <= viewport.width - margin)
      left = target.left + target.width + gap
    else if (target.left - gap - width >= margin)
      left = target.left - gap - width
  }
  return {
    left: clamp(left, margin, viewport.width - width - margin),
    top: clamp(top, margin, viewport.height - height - margin),
  }
}

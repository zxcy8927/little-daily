export const onboardingKey = 'little-daily-onboarding-v1'
export const tourSteps = [
  {
    title: '歡迎來到 Little Daily',
    text: '這裡是整理生活小事的地方。不用一次學會所有工具，先花一分鐘，跟小兔逛一圈就好。',
    target: null,
    hint: '隨時可以跳過，之後從「新手導覽」再看一次。',
  },
  {
    title: '先看看今天的小整理',
    text: '今天還能花多少、哪些事到期了、購物清單能不能做決定，都會整理在這裡。點一張卡片，就能開啟對應工具。',
    target: '.overview-grid',
    hint: '開始留下紀錄後，這裡的摘要就會跟著更新。',
  },
  {
    title: '想買的東西，先留點時間',
    text: '把想買的商品、價格和原因記在「買之前想想」。選 1、3 或 7 天冷靜期，到期後回來回顧；不買可記避免支出並解鎖像素裝飾，買了也能記入支出。',
    target: '.home-primary-actions',
    hint: '決定不買的金額會列為避免的預計支出，不會算成存款。',
  },
  {
    title: '挑一件現在需要的小工具',
    text: '料理工具可以整理冰箱、找食譜；預算記錄開銷；寵物日記、待辦和約會提案也各有自己的小本子。',
    target: '.tool-grid',
    hint: '用「整理我的首頁工具」調整順序，或隱藏暫時用不到的工具。',
  },
  {
    title: '每週回來看看自己的小成果',
    text: '每週生活回顧會分開整理實際支出、避免的預計支出、完成待辦與用完食材，也能切換上一週。',
    target: '.review-grid',
    hint: '不必每天做到滿分，有留下紀錄就能慢慢看見變化。',
  },
  {
    title: '最後，替你的紀錄留一份備份',
    text: '資料保存在目前的瀏覽器。換電腦或清除瀏覽器資料前，先下載備份，再到另一個瀏覽器匯入。',
    target: '.backup-panel',
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

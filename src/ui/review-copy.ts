import type { weeklyReview } from '../data/workflows'
type Review = ReturnType<typeof weeklyReview>
export function reviewReply(current: Review, previous: Review) {
  if (current.avoided > 0)
    return `這週有 ${current.avoidedItems.length} 樣東西想過後沒買，慢慢選也很好。`
  if (current.completed > previous.completed)
    return '這週多收好了幾件事，剩下的照自己的步調來。'
  if (current.foodsUsed > 0) return '冰箱裡的食材有好好用上，今天也吃點喜歡的。'
  if (current.spent > 0) return '有花的、有記的，都留在這裡了。我陪你慢慢看。'
  return '這週還沒留下太多紀錄，也沒關係。想到時再記一點。'
}

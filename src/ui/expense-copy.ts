export const expenseReplies = {
  comfortable: [
    '這筆記好了，今天還有餘裕。',
    '收進小本子了，錢包的事慢慢看。',
    '今天還花得開，照自己的步調來。',
    '記下來了，剩下的額度也幫你算好了。',
    '好，這筆有留著，不用一直惦記。',
    '今天的帳又清楚一點，先忙你的吧。',
    '這筆收好了，晚點想看再回來。',
    '還有空間，想花在哪裡可以慢慢選。',
  ],
  low: [
    '這筆記好了，今天的額度剩一點點。',
    '剩下的錢先幫你算著，等等再看也行。',
    '今天快用到預算了，我陪你看剩下的。',
    '收好了，接下來有哪些要花的，想到再記。',
    '額度剩不多了，先知道就好，不用急。',
    '這筆有記，晚點還要花什麼，再一起看看。',
    '今天的預算快到邊了，我有幫你留意。',
    '好，剩下這一小段額度，慢慢安排。',
  ],
  over: [
    '今天多花了一點，我陪你把帳記清楚。',
    '這筆收好了，今天多花的也一起留著。',
    '今天花得多些，記下來就好，我在。',
    '這筆超過今天額度了，我陪你記著。',
    '有些日子就是會多花一點，這筆我記著。',
    '今天超出額度了，我陪你慢慢看。',
    '收進小本子了，晚點想看再回來。',
    '這筆有留著，晚點想整理，我再陪你看。',
  ],
  first: [
    '今天第一筆，幫你翻開小本子了。',
    '好，今天的帳從這裡開始。',
    '第一筆收好了，後面花了再來記。',
    '今天先留這一筆，不用一次補完。',
    '小本子開張了，這筆有記到。',
    '第一筆放好了，接著忙你的吧。',
    '今天花的錢，有地方收著了。',
    '從這筆開始，今天的花費慢慢記。',
  ],
  continuous: [
    '又記好一筆，小本子幫你接著收。',
    '這筆也放好了，不用靠腦袋硬記。',
    '一筆一筆來，今天的帳慢慢有樣子了。',
    '好，這筆接在剛剛那筆後面。',
    '還有想記的就繼續，我在這裡。',
    '又少一件掛在心上的事，這筆記好了。',
    '收到了，今天花在哪裡又清楚一點。',
    '這筆也留下了，記完就可以先歇一下。',
  ],
} as const
export type ExpenseContext = keyof typeof expenseReplies
export type ExpenseBudgetContext = {
  limit: number
  spent: number
  entries: number
}
export function expenseContext(
  budget: ExpenseBudgetContext | undefined,
  amount: number,
  consecutive: boolean,
): ExpenseContext {
  if (budget) {
    const spent =
      (Math.round(budget.spent * 100) + Math.round(amount * 100)) / 100
    if (spent > budget.limit) return 'over'
    if (budget.limit > 0 && spent >= budget.limit * 0.8) return 'low'
    if (budget.entries === 0 && !consecutive) return 'first'
  }
  return consecutive ? 'continuous' : 'comfortable'
}

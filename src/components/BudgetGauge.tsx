export function budgetState(limit: number, spent: number) {
  if (spent > limit)
    return { name: 'over', label: '今天多花了一點，記下來就好。' }
  if (limit === 0)
    return { name: 'low', label: '還沒留今天的額度，可以先設定預算。' }
  if (spent >= limit * 0.8)
    return { name: 'low', label: '今天的額度剩不多，接下來慢慢花。' }
  return { name: 'comfortable', label: '今天還有餘裕，照自己的步調花。' }
}
export default function BudgetGauge({
  limit,
  spent,
}: {
  limit: number
  spent: number
}) {
  const percent =
    limit > 0
      ? Math.min(100, Math.round((spent / limit) * 100))
      : spent > 0
        ? 100
        : 0
  return (
    <div
      className="budget-gauge"
      role="progressbar"
      aria-label="每日預算已使用"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`已花 NT$${spent.toLocaleString('zh-TW')}，每日預算 NT$${limit.toLocaleString('zh-TW')}`}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  )
}

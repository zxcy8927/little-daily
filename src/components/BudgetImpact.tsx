import type { TodayBudget } from '../hooks/useTodayBudget'
const cash = (n: number) =>
  'NT$' + n.toLocaleString('zh-TW', { maximumFractionDigits: 2 })
export default function BudgetImpact({
  amount,
  budget,
  id,
  shopping = false,
}: {
  amount: number
  budget: TodayBudget
  id?: string
  shopping?: boolean
}) {
  if (budget.error)
    return (
      <p id={id} className="field-help budget-impact" role="status">
        {budget.error}
      </p>
    )
  if (!Number.isFinite(amount) || amount <= 0)
    return (
      <p id={id} className="field-help budget-impact">
        今天預算還剩 {cash(budget.remaining)}。
        {shopping ? '先加入清單，不會扣預算。' : ''}
      </p>
    )
  const after = Math.round((budget.remaining - amount) * 100) / 100
  return (
    <p id={id} className="field-help budget-impact">
      今天預算還剩 {cash(budget.remaining)}；
      {shopping ? '如果今天買下' : '以這份估值試算'}，
      {after < 0 ? `會超出 ${cash(-after)}` : `還剩 ${cash(after)}`}。
      {shopping ? '加入冷靜清單不會扣預算。' : '實際花了多少，確認後再記。'}
    </p>
  )
}

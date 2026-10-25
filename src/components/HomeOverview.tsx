import RollingAmount from './RollingAmount'
import YesterdayReview from './YesterdayReview'
import { motionDuration } from '../ui/motion'
import BudgetGauge, { budgetState } from './BudgetGauge'
import { useEffect, useMemo, useState } from 'react'
import { readBookSnapshot, toolIds, type Book } from '../data/storage'
import { dashboard } from '../data/workflows'
import './HomeOverview.css'
import { formatDate } from '../ui/format'

export default function HomeOverview({
  now,
  onOpen,
  hidden = [],
  mode = 'all',
  onRecord,
  received,
  revision = 0,
}: {
  now: number
  onOpen: (id: string) => void
  hidden?: string[]
  mode?: 'all' | 'budget' | 'reminders'
  onRecord?: () => void
  revision?: number
  received?: { id: string; reply: string } | null
}) {
  const result = useMemo(() => {
    const d = new Date(now)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const books: Partial<Record<string, Book>> = {}
    const errors: string[] = []
    for (const id of toolIds) {
      try {
        books[id] = readBookSnapshot(localStorage, id).book
      } catch {
        errors.push(id)
      }
    }
    return {
      ...dashboard(books, date, now),
      errors,
      date,
      expenses: books.budget?.entries.filter((e) => e.date === date) ?? [],
    }
  }, [now, revision])
  const money = (value: number) =>
    new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(value)
  const [receiving, setReceiving] = useState(false)
  useEffect(() => {
    if (!received) return
    setReceiving(true)
    const timer = setTimeout(() => setReceiving(false), motionDuration('slow'))
    return () => clearTimeout(timer)
  }, [received])
  const limit = result.remaining + result.spent
  const status = budgetState(limit, result.spent)
  const shown = (id: string) => !hidden.includes(id)
  const failed = (id: string) => result.errors.includes(id)
  return (
    <section className="home-overview" aria-labelledby="overview-title">
      <div className="section-heading">
        <h2 id="overview-title">今天的小日子</h2>
        <span>{formatDate(result.date, new Date(now))}</span>
      </div>
      {mode !== 'reminders' && (mode === 'budget' || shown('budget')) && (
        <>
          <button
            data-budget-target
            className={
              'home-budget budget-state-' +
              status.name +
              (receiving ? ' is-receiving' : '')
            }
            onClick={() => onOpen('budget')}
          >
            <span>今天還能花</span>
            <strong className={result.remaining < 0 ? 'over-budget' : ''}>
              {failed('budget') ? (
                '預算暫時讀不到'
              ) : (
                <RollingAmount value={result.remaining} />
              )}
            </strong>
            {!failed('budget') && (
              <BudgetGauge limit={limit} spent={result.spent} />
            )}
            <small>
              {failed('budget')
                ? '打開預算看看，先別清除資料。'
                : result.spent > 0
                  ? `今天已記支出 NT$${money(result.spent)} · 看看明細 →`
                  : '今天還沒記支出，花了再記就好。'}
            </small>
            {!failed('budget') && <small>{status.label}</small>}
          </button>
          {onRecord && (
            <button
              className="primary-button home-record-button"
              onClick={onRecord}
            >
              記一筆
            </button>
          )}
          {received && (
            <p role="status" className="field-help">
              小兔：{received.reply}
            </p>
          )}
          {mode === 'budget' && <YesterdayReview now={now} />}
          {mode === 'budget' && (
            <section
              className="home-today-expenses"
              aria-labelledby="today-expenses-title"
            >
              <h2 id="today-expenses-title">今日花費明細</h2>
              {failed('budget') ? (
                <p>明細暫時讀不到，先別清除資料。</p>
              ) : result.expenses.length ? (
                <>
                  <ul>
                    {result.expenses.slice(0, 5).map((entry) => (
                      <li key={entry.id}>
                        <span>
                          {entry.text}
                          <small> · {entry.category ?? '其他'}</small>
                        </span>
                        <strong>NT${money(entry.amount)}</strong>
                      </li>
                    ))}
                  </ul>
                  {result.expenses.length > 5 && (
                    <button
                      className="secondary-button"
                      onClick={() => onOpen('budget')}
                    >
                      查看全部 {result.expenses.length} 筆
                    </button>
                  )}
                </>
              ) : (
                <p className="field-help">今天還沒記支出，花了再記就好。</p>
              )}
            </section>
          )}
        </>
      )}
      {mode !== 'budget' && (
        <>
          <div className="home-reminders" aria-label="今天的提醒">
            {shown('tasks') &&
              (failed('tasks') ? (
                <button onClick={() => onOpen('tasks')}>
                  待辦讀不到，打開看看 →
                </button>
              ) : (
                result.pending > 0 && (
                  <button onClick={() => onOpen('tasks')}>
                    {result.overdue > 0
                      ? `${result.overdue} 件待辦晚了一點，挑一件先做。`
                      : result.due > 0
                        ? `今天有 ${result.due} 件事要做，慢慢來。`
                        : `待辦還有 ${result.pending} 件，照自己的步調來。`}{' '}
                    →
                  </button>
                )
              ))}
            {shown('dog') &&
              (failed('dog') ? (
                <button onClick={() => onOpen('dog')}>
                  寵物日記讀不到，打開看看 →
                </button>
              ) : result.petNotes > 0 ? (
                <button onClick={() => onOpen('dog')}>
                  毛孩今天的 {result.petNotes} 筆小事，記住了。 →
                </button>
              ) : (
                result.pets > 0 && (
                  <button onClick={() => onOpen('dog')}>
                    毛孩今天做了什麼？留一句就好。 →
                  </button>
                )
              ))}
            {!result.pending &&
              !result.pets &&
              !failed('tasks') &&
              !failed('dog') && <p>今天沒什麼急事，照自己的步調就好。</p>}
          </div>
          {(shown('date') || shown('cooking')) && (
            <details className="home-extra">
              <summary>食材與約會提醒</summary>
              {shown('cooking') && (
                <button onClick={() => onOpen('cooking')}>
                  {failed('cooking')
                    ? '採買清單讀不到，打開看看'
                    : result.supplies > 0
                      ? `下次採買，還有 ${result.supplies} 樣食材要帶。`
                      : '冰箱有什麼，打開看看今晚能煮什麼。'}{' '}
                  →
                </button>
              )}
              {shown('date') && (
                <>
                  <button onClick={() => onOpen('date')}>
                    {failed('date')
                      ? '約會紀錄讀不到，打開看看'
                      : result.upcomingDates.length
                        ? `下次的小約定：${result.upcomingDates[0].text}`
                        : '還沒排行程，想出門再來抽個點子。'}{' '}
                    →
                  </button>
                  {result.upcomingDates.length > 0 && (
                    <ul>
                      {result.upcomingDates.map((entry) => (
                        <li key={entry.id}>
                          {entry.text} ·{' '}
                          {formatDate(entry.plannedFor!, new Date(now))}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </details>
          )}
        </>
      )}
    </section>
  )
}

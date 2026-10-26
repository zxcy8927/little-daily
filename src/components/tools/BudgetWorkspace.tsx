import RollingAmount from '../RollingAmount'
import BudgetGauge, { budgetState } from '../BudgetGauge'
import ExpenseForm from '../ExpenseForm'
import { formatDate, formatMonth } from '../../ui/format'
import { useState } from 'react'
import type { DailyTool } from '../../data/tools'
import { budgetCategories, type Entry } from '../../data/storage'
import type { BudgetBook } from '../../data/books'
import { expenseCsv, summarizeExpenses } from '../../data/workflows'
import { exportText } from '../../native'
import { dayKey, money, useToolBook } from '../../hooks/useToolBook'
import WorkspaceFrame from './WorkspaceFrame'
import ExpenseEditSheet from '../ExpenseEditSheet'
export default function BudgetWorkspace({
  tool,
  onBack,
}: {
  tool: DailyTool
  onBack: () => void
}) {
  const state = useToolBook<BudgetBook>('budget'),
    { book, save, setError } = state
  const [date, setDate] = useState(dayKey),
    [period, setPeriod] = useState('當日'),
    [category, setCategory] = useState('全部'),
    [search, setSearch] = useState('')
  const [limit, setLimit] = useState(String(book.limit)),
    [editing, setEditing] = useState<Entry | null>(null)
  const sum = (entries: Entry[]) =>
    entries.reduce((n, e) => n + Math.round(e.amount * 100), 0) / 100
  const daily = sum(book.entries.filter((e) => e.date === date)),
    month = sum(book.entries.filter((e) => e.date.startsWith(date.slice(0, 7))))
  const periodEntries = book.entries.filter((e) =>
    period === '當日'
      ? e.date === date
      : e.date.startsWith(date.slice(0, 7) + '-'),
  )
  const showFilters = periodEntries.length >= 10
  const status = budgetState(book.limit, daily)
  const visible = book.entries.filter(
    (e) =>
      (period === '當日'
        ? e.date === date
        : e.date.startsWith(date.slice(0, 7) + '-')) &&
      (!showFilters ||
        category === '全部' ||
        (e.category ?? '其他') === category) &&
      (!showFilters ||
        e.text.toLocaleLowerCase().includes(search.toLocaleLowerCase())),
  )
  visible.sort((a, b) => b.date.localeCompare(a.date))
  return (
    <WorkspaceFrame {...state} tool={tool} onBack={onBack} onUndo={state.undo}>
      <ExpenseForm
        budgetContext={{
          limit: book.limit,
          spent: daily,
          entries: book.entries.filter((entry) => entry.date === date).length,
        }}
        remaining={book.limit - daily}
        date={date}
        onDateChange={setDate}
        lastCategory={book.entries.find((e) => e.category)?.category}
        onSave={(entry) => save({ ...book, entries: [entry, ...book.entries] })}
      />
      <section
        className={'budget-summary budget-state-' + status.name}
        data-budget-target
        aria-label="每日預算"
      >
        <div className="budget-card-heading">
          <div>
            <span>每日預算</span>
            <label className="budget-date">
              <span className="sr-only">查看日期</span>
              <input
                aria-label="查看紀錄日期"
                type="date"
                required
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value)
                }}
              />
            </label>
          </div>
          <div className="budget-card-actions">
            <details
              name="budget-card-menu"
              className="budget-settings icon-disclosure"
            >
              <summary aria-label="設定每日預算" title="設定每日預算">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M3 5h14M3 10h14M3 15h14" />
                  <path d="M7 2v6M13 7v6M7 12v6" />
                </svg>
              </summary>{' '}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const n = Number(limit)
                  if (
                    !limit.trim() ||
                    !Number.isFinite(n) ||
                    n < 0 ||
                    n > 1e9
                  ) {
                    setError(
                      '預算可以填 NT$0 到 NT$1,000,000,000，請再看一下金額。',
                    )
                    return
                  }
                  save({ ...book, limit: Math.round(n * 100) / 100 })
                }}
              >
                <label>
                  每日預算（套用所有日期）
                  <input
                    type="number"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    required
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </label>
                <button className="secondary-button">儲存預算</button>
              </form>
            </details>
            <details
              name="budget-card-menu"
              className="budget-actions icon-disclosure"
            >
              <summary aria-label="預算更多選項" title="預算更多選項">
                ⋯
              </summary>
              <button
                className="secondary-button"
                disabled={!visible.length}
                onClick={() =>
                  void exportText(
                    expenseCsv(visible),
                    'little-daily-expenses-' + date + '.csv',
                    'text/csv;charset=utf-8',
                  ).catch(() =>
                    setError('這次沒匯出成功，紀錄沒有更動。請稍後再試。'),
                  )
                }
              >
                匯出目前清單 CSV
              </button>
            </details>
          </div>
        </div>
        <div>
          <span>{formatDate(date)} 還能花</span>
          <strong className={daily > book.limit ? 'over-budget' : ''}>
            <RollingAmount key={date} value={book.limit - daily} />
          </strong>
          <BudgetGauge limit={book.limit} spent={daily} />
          <p>{status.label}</p>
          <p>
            當日已花 NT${money(daily)} · 每日預算 NT${money(book.limit)}
          </p>
          <p>
            {formatMonth(date.slice(0, 7))} 已花 NT${money(month)}
          </p>
        </div>
      </section>
      <div className="list-tabs">
        {['當日', '當月'].map((p) => (
          <button
            className="secondary-button"
            key={p}
            aria-pressed={period === p}
            onClick={() => setPeriod(p)}
          >
            {p}明細
          </button>
        ))}
      </div>
      {book.entries.some((e) => e.date.startsWith(date.slice(0, 7) + '-')) ? (
        <section className="category-summary">
          <h2>這個月花去哪了</h2>
          {summarizeExpenses(book.entries, date.slice(0, 7)).map((row) => (
            <div className="category-row" key={row.category}>
              <span>{row.category}</span>
              <meter
                min="0"
                max={Math.max(month, 1)}
                value={row.amount}
                aria-label={row.category + '支出 NT$' + money(row.amount)}
              />
              <strong>NT${money(row.amount)}</strong>
            </div>
          ))}
        </section>
      ) : (
        <p className="field-help budget-empty-month">
          這個月還沒記支出，記一筆就會在這裡慢慢累積。
        </p>
      )}
      {showFilters && (
        <div className="budget-filters">
          {' '}
          <label>
            明細分類
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {['全部', ...budgetCategories].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            搜尋紀錄
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={200}
            />
          </label>
        </div>
      )}
      <div className="records">
        {!visible.length && (
          <p className="empty-state">
            {showFilters && (search || category !== '全部')
              ? '沒找到這筆支出，換個關鍵字或分類看看。'
              : '這段時間還沒記支出，花了再來記。'}
          </p>
        )}
        {visible.map((entry) => (
          <article className="record" key={entry.id}>
            <div className="record-body">
              <h2>{entry.text}</h2>
              <span className="entry-tag">{entry.category ?? '其他'}</span>
              <p>
                NT${money(entry.amount)} · {formatDate(entry.date)}
              </p>
            </div>
            <div className="record-actions">
              <button
                className="secondary-button"
                aria-label={'編輯 ' + entry.text}
                onClick={() => setEditing(entry)}
              >
                編輯
              </button>
              <button
                className="delete-button"
                aria-label={'刪除 ' + entry.text}
                onClick={() => state.remove(entry)}
              >
                刪除
              </button>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <ExpenseEditSheet
          entry={editing}
          onClose={() => setEditing(null)}
          onSave={(entry) =>
            save({
              ...book,
              entries: book.entries.map((e) => (e.id === entry.id ? entry : e)),
            })
          }
        />
      )}
    </WorkspaceFrame>
  )
}

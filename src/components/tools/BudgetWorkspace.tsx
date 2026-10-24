import { formatDate, formatMonth } from '../../ui/format'
import { useState } from 'react'
import type { DailyTool } from '../../data/tools'
import { budgetCategories, type Entry } from '../../data/storage'
import type { BudgetBook } from '../../data/books'
import { expenseCsv, summarizeExpenses } from '../../data/workflows'
import { exportText } from '../../native'
import { dayKey, money, useToolBook } from '../../hooks/useToolBook'
import WorkspaceFrame from './WorkspaceFrame'
import EntryEditor from './EntryEditor'
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
  const [text, setText] = useState(''),
    [amount, setAmount] = useState(''),
    [expenseCategory, setExpenseCategory] = useState<Entry['category']>('其他'),
    [limit, setLimit] = useState(String(book.limit)),
    [editing, setEditing] = useState<Entry | null>(null)
  const sum = (entries: Entry[]) =>
    entries.reduce((n, e) => n + Math.round(e.amount * 100), 0) / 100
  const daily = sum(book.entries.filter((e) => e.date === date)),
    month = sum(book.entries.filter((e) => e.date.startsWith(date.slice(0, 7))))
  const visible = book.entries.filter(
    (e) =>
      (period === '當日'
        ? e.date === date
        : e.date.startsWith(date.slice(0, 7) + '-')) &&
      (category === '全部' || (e.category ?? '其他') === category) &&
      e.text.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  )
  return (
    <WorkspaceFrame {...state} tool={tool} onBack={onBack} onUndo={state.undo}>
      <label className="date-picker">
        查看日期
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
      <section className="budget-summary">
        <div>
          <span>{formatDate(date)} 還能花</span>
          <strong className={daily > book.limit ? 'over-budget' : ''}>
            {money(book.limit - daily)} <small>元</small>
          </strong>
          <p>
            當日已花 {money(daily)} 元 · 每日預算 {money(book.limit)} 元
          </p>
          <p>
            {formatMonth(date.slice(0, 7))} 已花 {money(month)} 元
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const n = Number(limit)
            if (!limit.trim() || !Number.isFinite(n) || n < 0 || n > 1e9) {
              setError('預算可以填 0 到 10 億元，請再看一下金額。')
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
      </section>
      <form
        className="tool-form pixel-panel"
        onSubmit={(e) => {
          e.preventDefault()
          const n = Number(amount)
          if (
            !text.trim() ||
            !amount.trim() ||
            !Number.isFinite(n) ||
            n <= 0 ||
            n > 1e9
          ) {
            setError('花在哪裡、花了多少？金額要大於 0，最多 10 億元。')
            return
          }
          if (
            save({
              ...book,
              entries: [
                {
                  id: crypto.randomUUID(),
                  text: text.trim(),
                  amount: Math.round(n * 100) / 100,
                  date,
                  done: false,
                  category: expenseCategory,
                },
                ...book.entries,
              ],
            })
          ) {
            setText('')
            setAmount('')
          }
        }}
      >
        <div className="form-row">
          <label>
            這筆花在哪裡
            <input
              required
              maxLength={200}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <label>
            金額（NT$）
            <input
              required
              type="number"
              min="0.01"
              max="1000000000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
        </div>
        <label>
          支出分類
          <select
            value={expenseCategory}
            onChange={(e) =>
              setExpenseCategory(e.target.value as Entry['category'])
            }
          >
            {budgetCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button className="primary-button">新增紀錄</button>
      </form>
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
      </div>
      <section className="category-summary">
        <h2>{formatMonth(date.slice(0, 7))}，錢花在哪裡</h2>
        {summarizeExpenses(book.entries, date.slice(0, 7)).map((row) => (
          <div className="category-row" key={row.category}>
            <span>{row.category}</span>
            <meter
              min="0"
              max={Math.max(month, 1)}
              value={row.amount}
              aria-label={row.category + '支出 ' + money(row.amount) + ' 元'}
            />
            <strong>{money(row.amount)} 元</strong>
          </div>
        ))}
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
      </section>
      <label>
        搜尋紀錄
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={200}
        />
      </label>
      <div className="records">
        {!visible.length && (
          <p className="empty-state">
            {search || category !== '全部'
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
                {money(entry.amount)} 元 · {formatDate(entry.date)}
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
        <EntryEditor
          mode="budget"
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

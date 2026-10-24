import { formatDate } from '../ui/format'
import { useEffect, useRef, useState } from 'react'
import { budgetCategories, validDate, type Entry } from '../data/storage'
import { expenseReplies } from '../ui/expense-copy'
import './QuickExpense.css'

export default function ExpenseForm({
  date,
  lastCategory,
  onSave,
  onRecorded,
  autoFocus = true,
  initial,
  onDateChange,
  editing = false,
  dismissReceipt = false,
}: {
  date: string
  onDateChange?: (date: string) => void
  editing?: boolean
  dismissReceipt?: boolean
  lastCategory?: Entry['category']
  onSave: (entry: Entry) => boolean
  onRecorded?: (entry: Entry, reply: string) => void
  autoFocus?: boolean
  initial?: { amount: number; note: string; category: Entry['category'] }
}) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState<Entry['category']>(
    initial?.category ?? lastCategory ?? '其他',
  )
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<{
    id: string
    amount: number
    reply: string
  } | null>(null)
  const amountInput = useRef<HTMLInputElement>(null)
  const previousReply = useRef('')
  const submitting = useRef(false)
  useEffect(() => {
    if (!autoFocus) return
    const frame = requestAnimationFrame(() =>
      amountInput.current?.focus({ preventScroll: true }),
    )
    return () => cancelAnimationFrame(frame)
  }, [autoFocus])
  useEffect(() => {
    if (dismissReceipt) {
      setReceipt(null)
      amountInput.current?.focus({ preventScroll: true })
    }
  }, [dismissReceipt])
  useEffect(() => {
    if (!receipt) return
    const timer = setTimeout(() => setReceipt(null), 4000)
    return () => clearTimeout(timer)
  }, [receipt])
  return (
    <form
      className="expense-form tool-form pixel-panel"
      aria-label="記一筆支出"
      onSubmit={(event) => {
        event.preventDefault()
        if (submitting.current) return
        setReceipt(null)
        const n = Number(amount)
        if (!amount.trim() || !Number.isFinite(n) || n <= 0 || n > 1e9) {
          setError('金額要大於 0，最多 10 億元。再看一下就好。')
          return
        }
        if (!validDate(date)) {
          setError('日期還沒選好，再看一下。')
          return
        }
        const entry: Entry = {
          id: crypto.randomUUID(),
          text: note.trim() || category || '其他',
          amount: Math.round(n * 100) / 100,
          category,
          date,
          done: false,
        }
        submitting.current = true
        try {
          if (!onSave(entry)) {
            setError('這筆還沒存好，輸入先留著。請查看儲存提示後再試。')
            return
          }
          if (editing) {
            setError('')
            onRecorded?.(entry, '已改好這筆。')
            return
          }
          const choices = expenseReplies.filter(
            (reply) => reply !== previousReply.current,
          )
          const reply = choices[Math.floor(Math.random() * choices.length)]
          previousReply.current = reply
          setReceipt({ id: entry.id, amount: entry.amount, reply })
          setAmount('')
          setNote('')
          setError('')
          onRecorded?.(entry, reply)
          amountInput.current?.focus({ preventScroll: true })
        } finally {
          submitting.current = false
        }
      }}
    >
      <label>
        金額（NT$）
        <input
          ref={amountInput}
          type="number"
          inputMode="decimal"
          min="0.01"
          max="1000000000"
          step="0.01"
          required
          placeholder="輸入金額"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <fieldset className="expense-categories">
        <legend>分類</legend>
        <div>
          {budgetCategories.map((c) => (
            <button
              key={c}
              type="button"
              className="secondary-button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>
      <label>
        備註（選填）
        <input
          maxLength={200}
          placeholder="例如：午餐、回家的車票"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="expense-record-date">
        <span>記在 {formatDate(date)}</span>
        {onDateChange && (
          <details className="expense-date-picker icon-disclosure">
            <summary>改日期</summary>
            <label>
              記帳日期
              <input
                type="date"
                required
                value={date}
                onChange={(event) => {
                  onDateChange(event.target.value)
                }}
              />
            </label>
          </details>
        )}
      </div>
      <button className="primary-button">
        {editing ? '儲存修改' : '記下這筆'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {receipt && (
        <div key={receipt.id} className="expense-receipt" role="status">
          <span className="expense-amount-pop" aria-hidden="true">
            NT${receipt.amount.toLocaleString('zh-TW')}
          </span>
          <p>
            已記下 NT${receipt.amount.toLocaleString('zh-TW')}。小兔：
            {receipt.reply}
          </p>
        </div>
      )}
    </form>
  )
}

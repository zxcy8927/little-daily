import RollingAmount from './RollingAmount'
import { budgetState } from './BudgetGauge'
import { useState } from 'react'
import ExpenseSheet from './ExpenseSheet'
import type { BudgetBook } from '../data/books'
import type { Entry } from '../data/storage'
import { dayKey, useToolBook } from '../hooks/useToolBook'
import ExpenseForm from './ExpenseForm'
import StorageConflict from './StorageConflict'

export default function QuickExpense({
  onClose,
  onRecorded,
  initial,
}: {
  initial?: { amount: number; note: string; category: Entry['category'] }
  onClose: () => void
  onRecorded?: (entry: Entry, reply: string) => void
}) {
  const state = useToolBook<BudgetBook>('budget')
  const [date, setDate] = useState(dayKey)
  const [lastEntry, setLastEntry] = useState<Entry | null>(null)
  const [undoMessage, setUndoMessage] = useState('')
  const spent =
    state.book.entries
      .filter((entry) => entry.date === date)
      .reduce((sum, entry) => sum + Math.round(entry.amount * 100), 0) / 100
  return (
    <ExpenseSheet title="記一筆" onClose={onClose}>
      {!state.readError && (
        <div
          data-budget-target
          className={
            'quick-budget-preview budget-state-' +
            budgetState(state.book.limit, spent).name
          }
        >
          <span>這天還能花</span>
          <strong>
            <RollingAmount value={state.book.limit - spent} />
          </strong>
        </div>
      )}
      {initial && (
        <p className="field-help">
          先帶入一人份預估 NT${initial.amount.toLocaleString('zh-TW')}
          ，請改成實際花費再記。
        </p>
      )}
      {!state.readError && (
        <StorageConflict
          storageKey="little-daily-tool-budget-v1"
          snapshot={state.snapshot}
        />
      )}
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <ExpenseForm
        budgetContext={{
          limit: state.book.limit,
          spent,
          entries: state.book.entries.filter((entry) => entry.date === date)
            .length,
        }}
        initial={initial}
        dismissReceipt={!!undoMessage}
        date={date}
        onDateChange={setDate}
        lastCategory={state.book.entries.find((e) => e.category)?.category}
        onSave={(entry) =>
          state.save({ ...state.book, entries: [entry, ...state.book.entries] })
        }
        onRecorded={(entry, reply) => {
          setLastEntry(entry)
          setUndoMessage('')
          onRecorded?.(entry, reply)
        }}
      />
      {lastEntry && (
        <div className="expense-undo">
          <p>
            剛記下「{lastEntry.text}」NT$
            {lastEntry.amount.toLocaleString('zh-TW')}。
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              if (
                state.save({
                  ...state.book,
                  entries: state.book.entries.filter(
                    (entry) => entry.id !== lastEntry.id,
                  ),
                })
              ) {
                setLastEntry(null)
                setUndoMessage('剛剛那筆已撤回，預算也回來了。')
                onRecorded?.(lastEntry, '剛剛那筆已撤回。')
              }
            }}
          >
            撤回剛剛這筆
          </button>
        </div>
      )}
      {undoMessage && <p role="status">{undoMessage}</p>}
    </ExpenseSheet>
  )
}

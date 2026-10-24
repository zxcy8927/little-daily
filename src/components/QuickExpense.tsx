import { useEffect, useRef } from 'react'
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
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="quick-expense-sheet"
      aria-labelledby="quick-expense-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <header>
        <h2 id="quick-expense-title">記一筆</h2>
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
          aria-label="關閉記帳面板"
        >
          關閉
        </button>
      </header>
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
        initial={initial}
        date={dayKey()}
        lastCategory={state.book.entries.find((e) => e.category)?.category}
        onSave={(entry) =>
          state.save({ ...state.book, entries: [entry, ...state.book.entries] })
        }
        onRecorded={onRecorded}
      />
    </dialog>
  )
}

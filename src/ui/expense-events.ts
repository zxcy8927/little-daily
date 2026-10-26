import type { Entry } from '../data/storage'
export const expenseRecordedEvent = 'little-daily-expense-recorded'
export function announceExpense(entry: Entry) {
  window.dispatchEvent(
    new CustomEvent(expenseRecordedEvent, { detail: { date: entry.date } }),
  )
}

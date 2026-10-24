import { useState } from 'react'
import type { Entry } from '../data/storage'
import ExpenseSheet from './ExpenseSheet'
import ExpenseForm from './ExpenseForm'
export default function ExpenseEditSheet({
  entry,
  onSave,
  onClose,
}: {
  entry: Entry
  onSave: (entry: Entry) => boolean
  onClose: () => void
}) {
  const [date, setDate] = useState(entry.date)
  return (
    <ExpenseSheet title="修改這筆支出" onClose={onClose}>
      <ExpenseForm
        editing
        date={date}
        onDateChange={setDate}
        initial={{
          amount: entry.amount,
          category: entry.category ?? '其他',
          note: entry.text === entry.category ? '' : entry.text,
        }}
        onSave={(changes) =>
          onSave({ ...entry, ...changes, id: entry.id, done: entry.done })
        }
        onRecorded={onClose}
      />
    </ExpenseSheet>
  )
}

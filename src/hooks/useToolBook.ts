import { commonCopy, errorText } from '../ui/copy'
import { useEffect, useRef, useState } from 'react'
import {
  readBookSnapshot,
  saveBookSnapshot,
  type Book,
  type Entry,
} from '../data/storage'
export function useToolBook<T extends Book>(id: string) {
  const [today, setToday] = useState(dayKey)
  useEffect(() => {
    const update = () => setToday(dayKey())
    const now = new Date(),
      midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timer = setTimeout(update, midnight.getTime() - now.getTime() + 50)
    window.addEventListener('focus', update)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', update)
    }
  }, [today])
  const [loaded] = useState(() => {
    try {
      return { ...readBookSnapshot(localStorage, id), error: '' }
    } catch (e) {
      return {
        book: { entries: [], limit: 500 } as Book,
        raw: null,
        error: errorText(e, commonCopy.readFailed),
      }
    }
  })
  const snapshot = useRef(loaded.raw)
  const [book, setBook] = useState(loaded.book as T),
    [error, setError] = useState(loaded.error),
    [feedback, setFeedback] = useState(''),
    [deleted, setDeleted] = useState<Entry | null>(null)
  function save(next: T) {
    try {
      if (loaded.error) throw Error(loaded.error)
      snapshot.current = saveBookSnapshot(
        localStorage,
        id,
        snapshot.current,
        next,
      )
      setBook(next)
      setError('')
      setFeedback(commonCopy.saved)
      return true
    } catch (e) {
      setError(errorText(e))
      return false
    }
  }
  function remove(entry: Entry) {
    if (
      save({ ...book, entries: book.entries.filter((e) => e.id !== entry.id) })
    ) {
      setDeleted(entry)
      setFeedback(commonCopy.removed)
    }
  }
  function undo() {
    if (deleted && save({ ...book, entries: [deleted, ...book.entries] }))
      setDeleted(null)
  }
  function toggle(entry: Entry) {
    save({
      ...book,
      entries: book.entries.map((e) =>
        e.id === entry.id
          ? { ...e, done: !e.done, completedOn: e.done ? undefined : dayKey() }
          : e,
      ),
    })
  }
  function favorite(name: string, amount = 0) {
    if (!book.entries.some((e) => e.text === name))
      save({
        ...book,
        entries: [
          {
            id: crypto.randomUUID(),
            text: name,
            amount,
            date: dayKey(),
            done: false,
          },
          ...book.entries,
        ],
      })
  }
  return {
    book,
    snapshot,
    error,
    setError,
    feedback,
    save,
    remove,
    undo,
    deleted,
    toggle,
    favorite,
    readError: loaded.error,
  }
}
export const dayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const money = (n: number) =>
  new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(n)

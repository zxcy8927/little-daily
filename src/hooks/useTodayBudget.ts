import { useEffect, useState } from 'react'
import { readBookSnapshot } from '../data/storage'
import { dayKey } from './useToolBook'

export type TodayBudget = { remaining: number; error: string }
export function useTodayBudget(): TodayBudget {
  function read() {
    try {
      const book = readBookSnapshot(localStorage, 'budget').book
      const spent =
        book.entries
          .filter((e) => e.date === dayKey())
          .reduce((sum, e) => sum + Math.round(e.amount * 100), 0) / 100
      return {
        remaining: Math.round((book.limit - spent) * 100) / 100,
        error: '',
      }
    } catch {
      return { remaining: 0, error: '今天的預算暫時讀不到，先別清除網站資料。' }
    }
  }
  const [budget, setBudget] = useState(read)
  useEffect(() => {
    const refresh = () => setBudget(read())
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'little-daily-tool-budget-v1')
        refresh()
    }
    const timer = setInterval(refresh, 60000)
    window.addEventListener('little-daily-saved', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', storage)
    return () => {
      clearInterval(timer)
      window.removeEventListener('little-daily-saved', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', storage)
    }
  }, [])
  return budget
}

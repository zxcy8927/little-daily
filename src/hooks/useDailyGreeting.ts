import { useEffect, useRef, useState } from 'react'
export const greetingSeenKey = 'little-daily-greeting-seen-v1'
export function useDailyGreeting(today: string, enabled: boolean) {
  const [visible, setVisible] = useState(false)
  const handled = useRef('')
  useEffect(() => {
    if (!enabled) {
      setVisible(false)
      return
    }
    if (handled.current === today) return
    handled.current = today
    try {
      if (localStorage.getItem(greetingSeenKey) === today) {
        setVisible(false)
        return
      }
    } catch {
      /* Greeting preferences must not block the daily record. */
    }
    setVisible(true)
    try {
      localStorage.setItem(greetingSeenKey, today)
    } catch {
      /* Show the greeting even when the preference cannot be stored. */
    }
  }, [today, enabled])
  return { visible, dismiss: () => setVisible(false) }
}

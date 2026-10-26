import { useEffect, useState } from 'react'
export function roomTime(hour: number) {
  return hour < 6 || hour >= 20
    ? 'night'
    : hour < 11
      ? 'morning'
      : hour < 17
        ? 'afternoon'
        : 'evening'
}
export function useRoomTime(live = true) {
  const [time, setTime] = useState(() => roomTime(new Date().getHours()))
  useEffect(() => {
    if (!live) return
    const refresh = () => setTime(roomTime(new Date().getHours()))
    const timer = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [live])
  return time
}

import { useEffect, useState } from 'react'
export function useWakeScreen() {
  const [status, setStatus] = useState('正在試著保持亮屏…')
  useEffect(() => {
    let active = true,
      pending = false,
      lock: WakeLockSentinel | undefined
    const release = () => {
      if (active) setStatus('亮屏已暫停，回到畫面會再試一次。')
    }
    const acquire = async () => {
      if (
        !active ||
        pending ||
        (lock && !lock.released) ||
        document.visibilityState === 'hidden'
      )
        return
      if (!navigator.wakeLock) {
        setStatus('這個裝置無法保持亮屏，先留意一下螢幕。')
        return
      }
      pending = true
      try {
        const next = await navigator.wakeLock.request('screen')
        if (!active) {
          await next.release()
          return
        }
        lock = next
        next.addEventListener('release', release)
        setStatus('步驟模式開著時，螢幕會保持亮著。')
      } catch {
        if (active) setStatus('這次沒能保持亮屏，步驟照常可以看。')
      } finally {
        pending = false
      }
    }
    const visible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    void acquire()
    document.addEventListener('visibilitychange', visible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', visible)
      lock?.removeEventListener('release', release)
      void lock?.release().catch(() => {})
    }
  }, [])
  return status
}

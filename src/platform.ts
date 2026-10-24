import { Capacitor } from '@capacitor/core'
export function registerOffline() {
  if (
    Capacitor.isNativePlatform() ||
    !import.meta.env.PROD ||
    !('serviceWorker' in navigator)
  )
    return
  const register = () => {
    void navigator.serviceWorker.register('./sw.js').catch(() => {
      window.dispatchEvent(new CustomEvent('little-daily-offline-error'))
    })
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}

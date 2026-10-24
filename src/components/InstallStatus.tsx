import { isNative } from '../native'
import { useEffect, useState } from 'react'
export default function InstallStatus() {
  const [failed, setFailed] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine),
    [ready, setReady] = useState(false),
    [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  useEffect(() => {
    const failure = () => setFailed(true)
    window.addEventListener('little-daily-offline-error', failure)
    const network = () => setOffline(!navigator.onLine)
    window.addEventListener('online', network)
    window.addEventListener('offline', network)
    let registration: ServiceWorkerRegistration | undefined
    const inspect = () => {
      setReady(!!navigator.serviceWorker?.controller)
      setWaiting(registration?.waiting ?? null)
    }
    const installed = () => {
      if (registration?.installing)
        registration.installing.addEventListener('statechange', inspect)
    }
    if (!isNative && import.meta.env.PROD && 'serviceWorker' in navigator)
      void navigator.serviceWorker.ready.then((r) => {
        registration = r
        inspect()
        r.addEventListener('updatefound', installed)
      })
    navigator.serviceWorker?.addEventListener('controllerchange', inspect)
    return () => {
      window.removeEventListener('little-daily-offline-error', failure)
      window.removeEventListener('online', network)
      window.removeEventListener('offline', network)
      navigator.serviceWorker?.removeEventListener('controllerchange', inspect)
      registration?.removeEventListener('updatefound', installed)
    }
  }, [])
  function update() {
    if (!waiting) return
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => window.location.reload(),
      { once: true },
    )
    waiting.postMessage('ACTIVATE_UPDATE')
  }
  return (
    <section className="app-help install-status" aria-label="安裝與離線使用">
      <h2>把小本子帶著走</h2>
      <p role="status">
        {isNative
          ? '目前是手機 App 測試版，工具已隨安裝包提供，可離線開啟。'
          : !import.meta.env.PROD
            ? '現在是本機預覽，離線功能要在正式建置版才能用。'
            : failed
              ? '離線資源尚未準備完成，請保持連線並重新整理後再試。'
              : ready
                ? offline
                  ? '目前沒有網路，可繼續使用已下載的工具。'
                  : '工具已經存好了，沒網路也能繼續記。'
                : '第一次開啟，先保持連線，工具還在準備。'}
      </p>
      <p>
        {isNative
          ? '請由原測試管道更新安裝包，更新前先匯出備份。'
          : '正式版請先連線開啟一次，再用瀏覽器的「安裝應用程式」或「加入主畫面」。安裝方式依手機與瀏覽器而異。'}
      </p>
      {waiting && (
        <div className="import-preview">
          <p>有新版本了。先把正在寫的存好再更新，已儲存的工具紀錄會保留。</p>
          <button className="secondary-button" onClick={update}>
            已儲存，更新版本
          </button>
        </div>
      )}
      <div className="release-links">
        <a href="./privacy.html" target="_blank" rel="noreferrer">
          資料使用與隱私說明
        </a>
        <a href="./support.html" target="_blank" rel="noreferrer">
          測試問題回報說明
        </a>
        <a href="./third-party-notices.txt" target="_blank" rel="noreferrer">
          開源與字型授權聲明
        </a>
      </div>
    </section>
  )
}

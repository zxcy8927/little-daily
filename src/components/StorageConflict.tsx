import { useEffect, useState } from 'react'

export default function StorageConflict({ storageKey, snapshot }: { storageKey: string; snapshot: { current: string | null } }) {
  const [, refresh] = useState(0)
  useEffect(() => {
    const check = () => refresh(n=>n+1)
    const storage = (event: StorageEvent) => { if(event.key === null || event.key === storageKey) check() }
    window.addEventListener('storage',storage);window.addEventListener('focus',check)
    return ()=>{window.removeEventListener('storage',storage);window.removeEventListener('focus',check)}
  },[storageKey])
  let changed = false
  try { changed = localStorage.getItem(storageKey) !== snapshot.current } catch { /* The form reports storage access errors. */ }
  if(!changed) return null
  return <aside className="data-conflict" role="alert"><p>這份紀錄已在其他頁面更新。請先複製尚未儲存的輸入，再載入最新紀錄。</p><button className="secondary-button" onClick={()=>window.location.reload()}>載入最新紀錄</button></aside>
}

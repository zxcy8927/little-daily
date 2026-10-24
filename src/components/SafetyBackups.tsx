import { formatDateTime } from '../ui/format'
import { errorText } from '../ui/copy'
import { exportText } from '../native'
import { useEffect, useState } from 'react'
import {
  createSafetyCopy,
  listSafetyCopies,
  safetyStatus,
  validateSafetyCopy,
  type SafetyCopy,
} from '../data/safety-backups'
import { collectBackup, mergeBackup, writeBackup } from '../data/storage'
export default function SafetyBackups({
  onRestored,
}: {
  onRestored: () => void
}) {
  const [copies, setCopies] = useState<SafetyCopy[]>([]),
    [status, setStatus] = useState(safetyStatus)
  const [selected, setSelected] = useState<SafetyCopy | null>(null),
    [busy, setBusy] = useState(false)
  async function refresh() {
    try {
      setCopies(await listSafetyCopies())
      setStatus(safetyStatus())
    } catch (e) {
      setStatus(errorText(e, '復原點暫時讀不到，先別清除網站資料。'))
    }
  }
  useEffect(() => {
    void refresh()
    const update = () => void refresh()
    window.addEventListener('little-daily-safety', update)
    return () => window.removeEventListener('little-daily-safety', update)
  }, [])
  async function capture() {
    setBusy(true)
    try {
      await createSafetyCopy()
      await refresh()
    } catch (e) {
      setStatus(errorText(e, '這次沒留成復原點，請檢查裝置空間。'))
    } finally {
      setBusy(false)
    }
  }
  async function download(copy: SafetyCopy) {
    try {
      const backup = validateSafetyCopy(copy)
      await exportText(
        JSON.stringify(backup, null, 2),
        'little-daily-recovery-' + copy.id + '.json',
      )
    } catch {
      setStatus('無法匯出這份復原點，請檢查檔案權限或選另一份。')
    }
  }
  async function recover() {
    if (!selected) return
    setBusy(true)
    try {
      const saved = validateSafetyCopy(selected)
      await createSafetyCopy().catch(() => {})
      const merged = mergeBackup(collectBackup(localStorage), saved)
      writeBackup(localStorage, merged)
      onRestored()
      setSelected(null)
      setStatus('已合併找回缺少的紀錄，目前內容與設定保留。')
      setCopies(await listSafetyCopies())
    } catch (e) {
      setStatus(errorText(e, '這次還沒找回紀錄，請稍後再試。'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <details className="backup-panel pixel-panel safety-panel">
      <summary>自動復原點</summary>
      <p>
        記錄時會在這個瀏覽器多留一份，最多保留最近 5
        次不同資料。它也會隨網站資料一起被清掉；換機或清除資料前，還是要下載備份。
      </p>
      <button
        className="secondary-button"
        disabled={busy}
        onClick={() => void capture()}
      >
        {busy ? '處理中…' : '現在建立復原點'}
      </button>
      <p role="status">{status}</p>
      <ul className="safety-list">
        {copies.map((copy) => (
          <li key={copy.id}>
            <span>{formatDateTime(copy.createdAt)}</span>
            <div>
              <button
                className="secondary-button"
                onClick={() => download(copy)}
              >
                下載這份備份
              </button>
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => setSelected(copy)}
              >
                預覽找回紀錄
              </button>
            </div>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="import-preview">
          <h3>從 {formatDateTime(selected.createdAt)} 的復原點找回紀錄</h3>
          <p>
            只補回目前缺少的紀錄；不覆寫現有內容，也不會把已編輯的內容退回舊版本。
          </p>
          <div className="backup-actions">
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => void recover()}
            >
              確認合併找回
            </button>
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </details>
  )
}

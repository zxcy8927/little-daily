import { errorText } from '../ui/copy'
import { exportText, isNative } from '../native'
import { useState } from 'react'
import {
  collectBackup,
  mergeBackup,
  parseBackup,
  writeBackup,
  type Backup,
  type Book,
  gameKey,
  settingsKey,
} from '../data/storage'
import { createSafetyCopy } from '../data/safety-backups'
import { tools } from '../data/tools'

export default function BackupPanel({
  onImported,
}: {
  onImported: () => void
}) {
  const [pending, setPending] = useState<Backup | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function download() {
    try {
      const backup = collectBackup(localStorage)
      await exportText(
        JSON.stringify(backup, null, 2),
        `little-daily-${new Date().toISOString().slice(0, 10)}.json`,
      )
      setMessage(
        isNative
          ? '已開啟匯出選單，請自行選擇儲存位置；關閉選單不代表已保存。'
          : '已交給瀏覽器下載。確認檔案有存好，再換裝置。',
      )
      setError('')
    } catch {
      setError(
        '這次沒做成備份。先別清除資料，請確認瀏覽器允許讀取網站儲存空間。',
      )
    }
  }
  async function choose(file: File) {
    setPending(null)
    setError('')
    setMessage('')
    setBusy(true)
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error('這份檔案太大了，請選 10 MB 以內的備份。')
      setPending(parseBackup(await file.text()))
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? '這份檔案讀不懂，請選 Little Daily 匯出的 JSON 備份。'
          : errorText(e, '這份檔案暫時讀不到，請重新選一次。'),
      )
    } finally {
      setBusy(false)
    }
  }
  async function restore() {
    if (!pending || busy) return
    setBusy(true)
    try {
      await createSafetyCopy().catch(() => {})
      const merged = mergeBackup(collectBackup(localStorage), pending)
      writeBackup(localStorage, merged)
      onImported()
      setPending(null)
      setError('')
      setMessage('匯入完成。同一筆紀錄和現有設定已保留，未重複加入。')
    } catch (e) {
      setError(errorText(e, '這次沒匯入成功，請檢查裝置的儲存空間。'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <details className="backup-panel pixel-panel">
      <summary>資料備份與匯入</summary>
      <p>
        換手機或瀏覽器前，先帶一份備份走。匯入只合併缺少的紀錄；同一筆紀錄、每日預算和簽到進度都保留目前這份。
      </p>
      <div className="backup-actions">
        <button className="primary-button" onClick={download}>
          下載備份
        </button>
        <label className="import-label">
          選擇備份檔
          <input
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void choose(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {busy && <p role="status">正在整理備份，先等一下…</p>}
      {pending && (
        <div className="import-preview">
          <h3>先看看這份備份</h3>
          <p>
            共{' '}
            {Object.entries(pending.data)
              .filter(([key]) => key !== gameKey && key !== settingsKey)
              .reduce(
                (n, [, value]) => n + (value as Book).entries.length,
                0,
              )}{' '}
            筆工具紀錄；
            {gameKey in pending.data ? '包含簽到進度' : '不含簽到進度'}
            。重複紀錄會略過。
          </p>
          <ul className="backup-details">
            {tools.map((tool) => {
              const book = pending.data[`little-daily-tool-${tool.id}-v1`] as
                Book | undefined
              return book ? (
                <li key={tool.id}>
                  <strong>{tool.title}</strong>
                  <span>
                    {book.entries.length} 筆紀錄
                    {tool.id === 'dog'
                      ? ` · ${book.pets?.length ?? (book.petName || book.entries.length ? 1 : 0)} 隻寵物`
                      : ''}
                    {tool.id === 'cooking'
                      ? ` · ${book.supplies?.length ?? 0} 項採買 · ${book.foods?.length ?? 0} 項冰箱食材`
                      : ''}
                  </span>
                </li>
              ) : null
            })}
          </ul>
          {settingsKey in pending.data && <p>包含首頁工具顯示與排序設定。</p>}
          <p>相同紀錄與現有設定會保留，匯入不會刪除目前資料。</p>
          <div className="backup-actions">
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => void restore()}
            >
              確認合併匯入
            </button>
            <button
              className="secondary-button"
              onClick={() => setPending(null)}
            >
              取消
            </button>
          </div>
        </div>
      )}
      <p role="status">{message}</p>
      <p role="alert" className="form-error">
        {error}
      </p>
    </details>
  )
}

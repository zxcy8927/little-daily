import { useEffect, useState } from 'react'
import {
  hapticsEnabled,
  setHapticsEnabled,
  hapticsSettingEvent,
} from '../haptics'
export default function InteractionSettings() {
  const [enabled, setEnabled] = useState(hapticsEnabled)
  const [error, setError] = useState('')
  useEffect(() => {
    const update = () => setEnabled(hapticsEnabled())
    window.addEventListener(hapticsSettingEvent, update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(hapticsSettingEvent, update)
      window.removeEventListener('storage', update)
    }
  }, [])
  return (
    <details className="interaction-settings">
      <summary>互動設定</summary>
      <div>
        <label className="haptics-switch">
          <input
            type="checkbox"
            role="switch"
            checked={enabled}
            onChange={(event) => {
              if (setHapticsEnabled(event.target.checked)) {
                setEnabled(event.target.checked)
                setError('')
              } else setError('設定還沒存好，先檢查瀏覽器的儲存設定。')
            }}
          />
          開啟觸覺回饋
        </label>
        <p className="field-help">
          手機 App 預設開啟，想安靜一點也能關掉。Android
          網頁版可手動開啟，支援時會輕輕震一下。這是這個裝置的偏好，不包含在紀錄備份裡。
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </div>
    </details>
  )
}

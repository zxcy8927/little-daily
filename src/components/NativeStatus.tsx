import { errorText } from '../ui/copy'
import { useEffect, useState } from 'react'
import { getNativeStatus, isNative } from '../native'
export default function NativeStatus() {
  const [status, setStatus] = useState(getNativeStatus)
  useEffect(() => {
    const update = () => setStatus(getNativeStatus())
    window.addEventListener('little-daily-native-status', update)
    return () =>
      window.removeEventListener('little-daily-native-status', update)
  }, [])
  return isNative ? (
    <p className="native-status" role="status">
      {status
        ? errorText(
            new Error(status),
            '裝置副本還沒準備好。先匯出備份，再檢查裝置空間。',
          )
        : ''}
    </p>
  ) : null
}

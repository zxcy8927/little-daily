export const commonCopy = {
  saved: '記好了。',
  removed: '刪掉了，還能復原上一筆。',
  saveFailed: '這次沒存進去。輸入先留著，別急著關掉畫面。',
  readFailed: '紀錄暫時讀不到。先別清除網站資料，檢查儲存設定後再試。',
  conflict: '另一個頁面剛改過這份紀錄。先複製還沒存的內容，再載入最新紀錄。',
} as const

export function errorText(
  error: unknown,
  fallback: string = commonCopy.saveFailed,
): string {
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError')
      return '儲存空間不夠了。先匯出備份，再整理裝置空間。'
    if (error.name === 'SecurityError')
      return '目前不能使用網站儲存空間。請檢查瀏覽器的隱私與儲存設定。'
    return fallback
  }
  if (error instanceof SyntaxError) return commonCopy.readFailed
  if (!(error instanceof Error)) return fallback
  if (error.message.includes('另一個頁面更新')) return commonCopy.conflict
  return /[\u3400-\u9fff]/.test(error.message) ? error.message : fallback
}

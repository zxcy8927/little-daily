import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
export type ReviewImage = {
  period: string
  spent: number
  avoided: number
  completed: number
  foodsUsed: number
  reply: string
}
export function reviewImage(data: ReviewImage) {
  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 1000
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('無法產生圖片')
  const styles = getComputedStyle(document.documentElement),
    color = (name: string, fallback: string) =>
      styles.getPropertyValue(name).trim() || fallback
  ctx.fillStyle = color('--color-page', '#faf6ef')
  ctx.fillRect(0, 0, 1000, 1000)
  ctx.fillStyle = color('--color-text', '#44362f')
  ctx.font = 'bold 42px Huninn, sans-serif'
  ctx.fillText('LITTLE DAILY', 70, 95)
  ctx.font = '40px Huninn, sans-serif'
  ctx.fillText('這週，生活留了些什麼', 70, 160)
  ctx.font = '28px Huninn, sans-serif'
  ctx.fillText(data.period, 70, 210)
  const rows = [
    ['實際支出', `NT$${data.spent.toLocaleString('zh-TW')}`],
    ['避免的預計支出', `NT$${data.avoided.toLocaleString('zh-TW')}`],
    ['完成待辦', `${data.completed} 件`],
    ['用完食材', `${data.foodsUsed} 項`],
  ]
  rows.forEach(([label, value], i) => {
    const y = 265 + i * 110
    ctx.fillStyle = color('--color-sage-soft', '#e8eddf')
    ctx.fillRect(60, y, 880, 90)
    ctx.fillStyle = color('--color-text', '#44362f')
    ctx.font = '34px Huninn, sans-serif'
    ctx.fillText(label, 85, y + 55)
    ctx.font = 'bold 42px Huninn, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(value, 910, y + 55)
    ctx.textAlign = 'left'
  })
  ctx.font = '28px Huninn, sans-serif'
  ctx.fillStyle = color('--color-muted', '#6c6054')
  ctx.fillText('避免支出不是實際存款。', 70, 740)
  let line = '',
    y = 805
  for (const char of data.reply) {
    if (ctx.measureText(line + char).width > 850) {
      ctx.fillText(line, 70, y)
      line = ''
      y += 42
    }
    line += char
  }
  ctx.fillText(line, 70, y)
  ctx.font = '20px Huninn, sans-serif'
  ctx.fillText('日子慢慢過。', 70, 950)
  return canvas.toDataURL('image/png')
}
export async function shareReviewImage(dataUrl: string, filename: string) {
  if (Capacitor.isNativePlatform()) {
    const file = await Filesystem.writeFile({
      path: filename,
      data: dataUrl.split(',')[1],
      directory: Directory.Cache,
    })
    try {
      await Share.share({
        title: '我的 Little Daily 這週小記',
        files: [file.uri],
        dialogTitle: '分享這週小記',
      })
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        error.message === 'Share canceled'
      )
        return 'cancelled'
      throw error
    }
    return 'shared'
  }
  const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (char) =>
    char.charCodeAt(0),
  )
  const file = new File([bytes], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        title: '我的 Little Daily 這週小記',
        files: [file],
      })
      return 'shared'
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'AbortError'
      )
        return 'cancelled'
      throw error
    }
  }
  const url = URL.createObjectURL(file),
    link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}

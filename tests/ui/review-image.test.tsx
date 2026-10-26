import { afterEach, expect, it, vi } from 'vitest'
import { reviewImage, shareReviewImage } from '../../src/ui/review-image'
const mocks = vi.hoisted(() => ({
  native: vi.fn(),
  write: vi.fn(),
  share: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.native },
}))
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: mocks.write },
  Directory: { Cache: 'CACHE' },
}))
vi.mock('@capacitor/share', () => ({ Share: { share: mocks.share } }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.clearAllMocks()
})
it('分享圖只畫彙總數字與總結，長總結會換行', () => {
  const ctx = {
    fillStyle: '',
    font: '',
    textAlign: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 24 })),
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/png;base64,AQID',
  )
  const image = reviewImage({
    period: '10 月 26 日 ～ 11 月 1 日',
    spent: 500,
    avoided: 1500,
    completed: 2,
    foodsUsed: 1,
    reply: '日子慢慢過。'.repeat(15),
  })
  expect(image).toContain('image/png')
  expect(ctx.fillText.mock.calls.flat()).toContain('NT$1,500')
  expect(ctx.fillText.mock.calls.flat()).toContain('避免支出不是實際存款。')
})
it('原生分享使用快取 PNG 與既有 Share 插件', async () => {
  mocks.native.mockReturnValue(true)
  mocks.write.mockResolvedValue({ uri: 'file:///cache/week.png' })
  mocks.share.mockResolvedValue({})
  await expect(
    shareReviewImage('data:image/png;base64,AQID', 'week.png'),
  ).resolves.toBe('shared')
  expect(mocks.write).toHaveBeenCalledWith({
    path: 'week.png',
    data: 'AQID',
    directory: 'CACHE',
  })
  expect(mocks.share).toHaveBeenCalledWith(
    expect.objectContaining({ files: ['file:///cache/week.png'] }),
  )
  mocks.share.mockRejectedValueOnce(new Error('Share canceled'))
  await expect(
    shareReviewImage('data:image/png;base64,AQID', 'week.png'),
  ).resolves.toBe('cancelled')
})
it('網頁可分享時使用檔案，取消不當作失敗', async () => {
  mocks.native.mockReturnValue(false)
  const share = vi
    .fn()
    .mockRejectedValue(new DOMException('cancel', 'AbortError'))
  vi.stubGlobal('navigator', { canShare: () => true, share })
  await expect(
    shareReviewImage('data:image/png;base64,AQID', 'week.png'),
  ).resolves.toBe('cancelled')
  expect(share.mock.calls[0][0].files[0].type).toBe('image/png')
})
it('不支援分享的網頁下載圖片並釋放連結', async () => {
  vi.useFakeTimers()
  mocks.native.mockReturnValue(false)
  vi.stubGlobal('navigator', {})
  const revoke = vi.fn()
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:review',
    revokeObjectURL: revoke,
  })
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {})
  await expect(
    shareReviewImage('data:image/png;base64,AQID', 'week.png'),
  ).resolves.toBe('downloaded')
  expect(click).toHaveBeenCalledOnce()
  vi.advanceTimersByTime(1000)
  expect(revoke).toHaveBeenCalledWith('blob:review')
})

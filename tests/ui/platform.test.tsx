import { afterEach, expect, it, vi } from 'vitest'
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}))
afterEach(() => {
  vi.unstubAllEnvs()
})
it('頁面已載入完畢後仍會註冊離線服務', async () => {
  vi.stubEnv('PROD', true)
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete')
  const register = vi.fn().mockResolvedValue({})
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { register },
    configurable: true,
  })
  const { registerOffline } = await import('../../src/platform')
  registerOffline()
  expect(register).toHaveBeenCalledWith('./sw.js')
})
it('載入中等待 load，註冊失敗會通知介面', async () => {
  vi.stubEnv('PROD', true)
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')
  const register = vi.fn().mockRejectedValue(new Error('offline'))
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { register },
    configurable: true,
  })
  const notified = vi.fn()
  window.addEventListener('little-daily-offline-error', notified, {
    once: true,
  })
  const { registerOffline } = await import('../../src/platform')
  registerOffline()
  expect(register).not.toHaveBeenCalled()
  window.dispatchEvent(new Event('load'))
  await Promise.resolve()
  expect(notified).toHaveBeenCalledOnce()
  window.dispatchEvent(new Event('load'))
  expect(register).toHaveBeenCalledOnce()
})
